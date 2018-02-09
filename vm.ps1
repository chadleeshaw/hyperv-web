$postCmd = $PoSHQuery.command
$postHost = $PoSHQuery.host

# GetVMS Function
if ($postCmd -eq "getvms" -and ($postHost)) {
        $vms_objs = @()
        $vms_objs += Get-VM -ComputerName $postHost | select Name,State,CPUUsage,MemoryAssigned,Uptime
        if ($vms_objs.count -le 1) {
            $vms_objs += ,@()
        }
        $vms_objs | ConvertTo-Json -Depth 1 
}