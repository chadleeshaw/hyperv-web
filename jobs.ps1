$postCmd = $PoSHQuery.command
$postJob = $PoSHQuery.job

if ($postCmd -eq "jobstatus" -and ($postJob)) {
    $jobs = Get-Job -id $postJob
    ForEach ($job in $jobs) { 
        if ($job.State -eq "Running" ) {
            try {
                $progress = (((Get-Job $job.Id).ChildJobs[0].Progress.Count)/1.5) 
                $progress = "{0:N0}" -f $progress
                Write-output  $progress
            } catch {
                Start-Sleep -Milliseconds 100
            }
        }
        elseif ($jobs.State -eq "Completed") {
            Receive-Job -Job $job -Keep -OutVariable job_output -ErrorVariable job_error | out-null
            if ($job_error -like '*failed*' -or $job_error -like '*error*') {
                write-output "Failed"
            } else {
                write-output "Complete"
            }
        }
    } 
}


if ($postCmd -eq "getjob" -and ($postJob)) {
    Receive-Job -id $postJob -keep
}

if ($postCmd -eq "joboutput" -and ($postJob)) {
    $jobresults = Get-Job -Id $postJob | Receive-Job -Keep
    write-output "Output: $jobresults"
}

if ($postCmd -eq "stopjob" -and ($postJob)) {
    get-job -Id $postJob| stop-job
    write-output "stopped job $postJob"
}

if ($postCmd -eq "removejob" -and ($postJob)) {
    get-job -id $postJob | remove-job -force
    write-output "Removed job $postJob"
}

if ($postCmd -eq "listjobs") {
    $job = @()
    $job += Get-Job | select id,name,state,psbegintime,psendtime
    if ($job.count -le 1) {
        $job += ,@()
    }
    $job | ConvertTo-Json -Depth 1
}