import-module Hyper-V
. "hosts.ps1"

$postCmd = $PoSHQuery.command
$postHost = $PoSHQuery.host

# Search Function
if ($postCmd -eq "vmsearch" -and ($postHost)) {
    if ($postHost -match " ") {
        $postHost = $postHost.Split(" ")
    }
    $datacenters = @()
    $hvhosts = @()
    $search_obj = @()
    $count = 1
    $found = 0
    $vm_names = $postHost

    # Generate unique list of data centers
    foreach ($vm_name in $vm_names) {
        $datacenters += $vm_name.Substring(0, ($vm_name.IndexOf("-") ))
    }
    $datacenters = $datacenters.ToLower() | Get-Unique

    # Generate Hyper-V hosts array's
    If ($datacenters -contains "dc1") {
        $hvhosts += Get-HVHosts("dc1")
    }
    If ($datacenters -contains "dc2") {
        $hvhosts += Get-HVHosts("dc2")
    }
    If ($datacenters -contains "dc3") {
        $hvhosts += Get-HVHosts("dc3")
    }

    $hvhosts = $hvhosts | Get-Unique

    # Search for VM's
    $total = $hvhosts.count

    foreach ($hvhost in $hvhosts) {
        if ($found -ne $vm_names.Count) {
            $vms = Get-VM -ComputerName $hvhost -ea 0
            if ($vms) {
                foreach ($vm in $vms) {
                    foreach ($vm_name in $vm_names) {
                            if ($vm_name -contains '*') {
                                if ($vm.Name -match $vm_name) {
                                    $obj = new-object psobject
                                    $obj | add-member –membertype NoteProperty –name "VMName" –value $vm.Name
                                    $obj | add-member –membertype NoteProperty –name "HVHost" –value $hvhost
                                    $search_obj += $obj
                                    $found++
                                }
                            } else {
                                    if ($vm.Name -like $vm_name) {
                                    $obj = new-object psobject
                                    $obj | add-member –membertype NoteProperty –name "VMName" –value $vm.Name
                                    $obj | add-member –membertype NoteProperty –name "HVHost" –value $hvhost
                                    $search_obj += $obj
                            }
                        }
                    }
                }
            }
            $count++
        } else {
            break
        }
    }
    if ($search_obj.count -eq 0) {
        write-output "VM Not Found" | ConvertTo-Json -Depth 1
    } else {
        if ($search_obj.count -eq 1) {
            $search_obj += ,@()
        }
        $search_obj = $search_obj | group length,VMName | sort Name | foreach {$_.group | sort }
        $search_obj | ConvertTo-Json -Depth 1
    }
}
