$postDC = $PoSHQuery.datacenter
$postCmd = $PoSHQuery.command
$hosts = @();

function Get-HVHosts {
    param ([string]$dc)
    $hosts = @()

    ## TO DO: load hosts from AD OU
    switch ($dc) {
        "dc1" { $hosts =
                  ('hyperv-1.dc1', 'hyperv-2.dc1', 'hyperv-3.dc1',
                  )
             }
        "dc2" { $hosts =
                  ('hyperv-1.dc2',  'hyperv-2.dc2', 'hyperv-3.dc2',
                  )
             }
        "dc3" { $hosts = ('hyperv-1.dc3','hyperv-2.dc3','hyperv-3.dc3') }
    }
    $hosts = $hosts | group length | sort Name | foreach {$_.group | sort}
    return $hosts
}

if ($postCmd -eq "getdchosts" -and ($postDC)) {
    switch ($postDC) {
        "dc1" { $hosts = Get-HVHosts("dc1") }
        "dc2" { $hosts = Get-HVHosts("dc2") }
        "dc3" { $hosts = Get-HVHosts("dc3") }
    }
    $hosts | convertTo-Json
}
