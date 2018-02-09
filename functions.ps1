################################# Pre Reqs #################################
import-module Hyper-V
. "hosts.ps1"

################################# Variables #################################
$postCmd = $PoSHQuery.command
$postStartJob = $PoSHQuery.startJob
$postHost = $PoSHQuery.host
$postJob = $PoSHQuery.job

################################# Workflows #################################
workflow Invoke-ParallelWMI {
    param ([System.Array]$hvhosts)
    $hvhosts_obj = @()
    sequence {
        foreach -parallel ($hvhost in $hvhosts) {
            $wmi = Get-WmiObject -Class Win32_OperatingSystem -PSComputerName $hvhost
            if ($wmi) { $enabled = "yes" } else { $enabled = "no" }
            $obj= New-Object -type PSObject -Property  @{
                Name = $hvhost
                Enabled = $enabled
            }
            $WORKFLOW:hvhosts_obj += $obj
        }
    }
    $hvhosts_obj | group length,Name | sort -Property Name | foreach {$_.group | sort } | convertto-json
}

workflow Invoke-GetCluster {
    param ([array]$hvhosts)
    $cluster_obj = @()
    foreach -parallel ($hvhost in $hvhosts) {
        $mem = get-wmiobject -PSComputerName $hvhost -query "select FreePhysicalMemory from Win32_OperatingSystem"
        $disk = Get-WmiObject -PSComputerName $hvhost Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object FreeSpace
        $model = get-wmiobject -PSComputerName $hvhost -query "select Model from Win32_ComputerSystem"
        $proc = Get-WMIObject -PSComputerName $hvhost -Class Win32_Processor | select Name, NumberOfCores, LoadPercentage
        $tag = Get-WMIObject -PSComputerName $hvhost -Class Win32_Bios | select SerialNumber
        $obj= New-Object -type PSObject -Property  @{
            HVHost = $hvhost.toUpper()
            CPU = "{0:N0}" -f ($proc | Measure-Object -property LoadPercentage -Average | Select Average).Average
            Memory = ([math]::round(($mem.FreePhysicalMemory / 1024 / 1024), 0))
            Disk = ([math]::round(($disk.FreeSpace / 1gb), 0))
            Model = $model.Model
            Procs = $proc.count
            Cores = $proc.NumberOfCores | select -First 1
            ServiceTag = $tag.SerialNumber
        }
        $WORKFLOW:cluster_obj += $obj
    }
    $cluster_obj | group length,HVHost | sort -Property Name | foreach {$_.group | sort } | ConvertTo-Json -Depth 1
}

Workflow Invoke-ParallelLiveMigrate {
 Param (
    [parameter(Mandatory=$true)][psobject[]] $VMList)
    ForEach -Parallel ($VM in $VMList) {
        Move-VM -ComputerName $VM.source -Name $VM.vm -DestinationHost $VM.dest -DestinationStoragePath $VM.path
    }
}
################################# Get Commands #################################

# Start Jobs
if ($postStartJob) {
    $hvhosts = @()

    if ($postStartJob -eq "getcluster" -and ($postDC)) {
        if ($postDC -eq "se") { $hvhosts = Get-HVHosts("se") }
        if ($postDC -eq "sw") { $hvhosts = Get-HVHosts("sw") }
        if ($postDC -eq "tp") { $hvhosts = Get-HVHosts("tp") }
        $workflow = Invoke-GetCluster -hvhosts $hvhosts -AsJob -JobName "getcluster"
        write-output $workflow.Id
    } elseif ($postStartJob -eq "movevms" -and ($postHost)) {
        $vmlist = @()
        $postHost = $postHost -replace '%22','"'
        $vms = $postHost | ConvertFrom-Json

        foreach ($vm in $vms) {
            $C_Path = "\\$($vm.dest)\c$\Virtual Machines"
            $Cluster_Path = "\\$($vm.dest)\c$\ClusterStorage"
            $D_Path = "\\$($vm.dest)\d$"
            $E_Path = "\\$($vm.dest)\e$"
            $cluster_disk = $false

            $vhds = Get-VM -ComputerName $vm.source -Name $vm.vm | Get-VMHardDiskDrive | select Path
            foreach ($vhd in $vhds) {
                If ($vhd.Path -like "*ClusterStorage*") { $cluster_disk = $true }
            }

            If (($cluster_disk) -and (Test-Path $Cluster_Path\$($vm.vm))) {
                $dest_path = "$Cluster_Path\$($vm.vm)"
            } ElseIf (Test-Path $C_Path\$($vm.vm)) {
                $dest_path = "$C_Path\$($vm.vm)"
            } ElseIf (Test-Path $D_Path\$($vm.vm)) {
                $dest_path = "$D_Path\$($vm.vm)"
            } ElseIf (Test-Path $E_Path\$($vm.vm)) {
                $dest_path = "$E_Path\$($vm.vm)"
            } Else {
                If ($cluster_disk) {
                    New-Item -Path "$Cluster_Path\$($vm.vm)" -type directory -Force | out-null
                    $dest_path = "$Cluster_Path\$($vm.vm)"
                } ElseIf (Test-Path $C_Path) {
                    New-Item -Path "$C_Path\$($vm.vm)" -type directory -Force | out-null
                    $dest_path = "$C_Path\$($vm.vm)"
                } ElseIf (Test-Path $D_Path) {
                    New-Item -Path "$D_Path\$($vm.vm)" -type directory -Force | out-null
                    $dest_path = "$D_Path\$($vm.vm)"
                } ElseIf (Test-Path $E_Path) {
                    New-Item -Path "$E_Path\$($vm.vm)" -type directory -Force | out-null
                    $dest_path = "$E_Path\$($vm.vm)"
                } Else {
                    break
                }
            }

            ### Turn off Time Sync ###
            Disable-VMIntegrationService -name "Time Synchronization" -ComputerName $vm.source -VMName $vm.vm

            $obj = new-object psobject
            $obj | add-member –membertype NoteProperty –name "vm" –value $vm.vm
            $obj | add-member –membertype NoteProperty –name "source" –value $vm.source
            $obj | add-member –membertype NoteProperty –name "dest" –value $vm.dest
            $obj | add-member –membertype NoteProperty –name "path" –value $dest_path
            $vmlist += $obj

        }
        ### Move VM(s) ###
        $workflow = Invoke-ParallelLiveMigrate -VMList $vmlist -AsJob -JobName "movevms" -Verbose 4>&1
        write-output $workflow.Id
    }
}
