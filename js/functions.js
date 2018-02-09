datacenter = "";
vms = [];
source = [];
var ajax_result = "";
JobID = "";

function startJob(arg1,arg2,arg3) {
    ajax_result = "";
    JobID = "";
    moveBar(1,'Starting job...');
    $.ajax({
    	url: "functions.ps1?startJob=" + arg1 + "&" + arg2 + "=" + arg3,
        success: function(result) {
            JobID = result;
            queryJob(JobID);
        }
    });
}

function queryJob(arg1) {
    var retry = setInterval(function() {
        $.ajax({
            url: "jobs.ps1?command=jobstatus&job=" + arg1,
            success: function(result){
                result = result.replace(/\n|\r/g, "");
                if (result !== "Complete" | "Failed" ) {
                    result = parseInt(result);
                    moveBar(result, "Job in progress...");
                }
                else if (result == "Complete") {
                    moveBar(0, " ");
                    clearInterval(retry);
                    getJob(arg1);
                }
                else if (result == "Failed") {
                    moveBar(0, "Job Failed");
                    clearInterval(retry);
                }
            }
        });
    }, 700);
}

function getJob(arg1) {
    var retry = setInterval(function() {
        $.ajax({
            url: "jobs.ps1?command=getjob&job=" + arg1, dataType:'json',
            success: function(result){
                if (result !== "") {
                    moveBar(0," ");
                    clearInterval(retry);
                    ajax_result = result;
                }
            }
        });
    }, 2000);
}

function getCluster(DC) {
    jobID = startJob("getcluster","datacenter",DC);
    var retry = setInterval(function() {
        if (ajax_result !== "") {
            clearInterval(retry);
            clusterTable(ajax_result,DC);
            $.ajax({url: "jobs.ps1?command=removejob&job=" + JobID});
        }
    }, 700);
}

function hvButtons(DC) {
    var tableDiv = document.getElementById("vmtable");
    while(tableDiv.firstChild){
        tableDiv.removeChild(tableDiv.firstChild);
    }
    var tableDiv = document.getElementById("hvhosts");
    while(tableDiv.firstChild){
        tableDiv.removeChild(tableDiv.firstChild);
    }

    $.ajax({url: "hosts.ps1?command=getdchosts&datacenter=" + DC, dataType:'json',
        success: function(result) {
            var p = document.createElement("p");
            var a = document.createElement("a");
            a.className='w3-btn';
            a.href='#';
            a.setAttribute("onclick", "getCluster('" + DC + "')");
            a.appendChild(document.createTextNode("Cluster Overview"));
            p.appendChild(a);
            tableDiv.appendChild(p);

            for (var i = 0; i < result.length; i++) {
                var p = document.createElement("p");
                var a = document.createElement("a");
                a.className='w3-btn';
                a.href='#';
                a.setAttribute("onclick", "vmTable('" + result[i] + "')");
                a.appendChild(document.createTextNode(result[i]));
                p.appendChild(a);
                tableDiv.appendChild(p);
            }
        }
    });
}

function vmTable(hvhost) {

    var statuscodes=[];
    statuscodes[2] = "Running";
    statuscodes[32782] = "Off Critical";
    statuscodes[32784] = "Saved Critical";
    statuscodes[3] = "Off";

    moveBar(1,'Loading...');

    $.ajax({url: "functions.ps1?command=getvms&host=" + hvhost, dataType:'json', success: function(result){

        moveBar(10,"Loading...");

        var tableDiv = document.getElementById("vmtable");
        while(tableDiv.firstChild){
            tableDiv.removeChild(tableDiv.firstChild);
        }

        var host = document.createElement("h4");
        host.appendChild(document.createTextNode(hvhost.toUpperCase()));
        host.className='w3-center';
        tableDiv.appendChild(host);

        var moveVM = document.createElement("button");
        moveVM.className='w3-btn w3-ripple w3-hover-grey';
        moveVM.appendChild(document.createTextNode("Move VM(s)"));
        moveVM.setAttribute("onclick", "moveVMModal()");
        tableDiv.appendChild(moveVM)


        var table = document.createElement('TABLE');
        table.className='w3-table w3-striped w3-bordered';

        var tableHead = document.createElement('THEAD');
        table.appendChild(tableHead);

        var trHead = document.createElement('TR');
        trHead.className='w3-theme';

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("VM"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("Host"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("State"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("CPU"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("Memory"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("Uptime"));
        trHead.appendChild(th);

        tableHead.appendChild(trHead);

        var tableBody = document.createElement('TBODY');
        table.appendChild(tableBody);

        for (var i = 0; i < result.length; i++) {

            if (result[i].hasOwnProperty("value")) {
                continue;
            }

            var trBody = document.createElement('TR');
            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].Name));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(hvhost.toUpperCase()));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(statuscodes[result[i].State]));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].CPUUsage + " %"));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            var memgb = result[i].MemoryAssigned/1024/1024/1024;
            td.appendChild(document.createTextNode(memgb.toFixed(0) + " GB"));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].Uptime));
            trBody.appendChild(td);

            tableBody.appendChild(trBody);
        }

        tableDiv.appendChild(table);

        moveBar(0,' ');

        $("table tbody tr").click(function() {
            var tr = $(this);
            if(tr.hasClass("w3-select")) {
                tr.removeClass("w3-select");
                tr.removeClass("w3-grey");
            } else {
                tr.addClass("w3-select");
                tr.addClass("w3-grey");
            }
        });

    }});

}

function clusterTable(result,DC) {

    var tableDiv = document.getElementById("vmtable");
    while(tableDiv.firstChild){
        tableDiv.removeChild(tableDiv.firstChild);
    }

    var host = document.createElement("h4");
    host.appendChild(document.createTextNode("Cluster Overview - " + DC.toUpperCase()));
    host.className='w3-center';
    tableDiv.appendChild(host);

    var table = document.createElement('TABLE');
    table.className='w3-table w3-striped w3-bordered';

    var tableHead = document.createElement('THEAD');
    table.appendChild(tableHead);

    var trHead = document.createElement('TR');
    trHead.className='w3-theme';

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("HVHost"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("CPU"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("MemoryFree"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("DiskFree"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("Model"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("Procs"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("Cores"));
    trHead.appendChild(th);

    var th = document.createElement('TH');
    th.appendChild(document.createTextNode("ServiceTag"));
    trHead.appendChild(th);

    tableHead.appendChild(trHead);

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);

    for (var i = 0; i < result.length; i++) {
        var trBody = document.createElement('TR');

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].HVHost));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].CPU + " %"));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].Memory + " GB"));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].Disk + " GB"));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].Model));
        trBody.appendChild(td);

         var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].Procs));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].Cores));
        trBody.appendChild(td);

        var td = document.createElement('TD');
        td.appendChild(document.createTextNode(result[i].ServiceTag));
        trBody.appendChild(td);

        tableBody.appendChild(trBody);
    }

        tableDiv.appendChild(table);

        moveBar(0,' ');

}

function vmsearch(vm) {

    search = vm.inputbox.value;

    moveBar(1,'Searching...')

    $.ajax({url: "functions.ps1?command=vmsearch&host=" + search, dataType:'json', success: function(result){

    var tableDiv = document.getElementById("vmtable");
        while(tableDiv.firstChild){
            tableDiv.removeChild(tableDiv.firstChild);
        }

        var host = document.createElement("h3");
        if (result !== "VM Not Found") {
            host.appendChild(document.createTextNode("Search Results: " + search));
        } else {
            host.appendChild(document.createTextNode(search + " not found"));
        }
        host.className='w3-center';
        tableDiv.appendChild(host);

        if (result !== "VM Not Found") {

            var moveVM = document.createElement("button");
            moveVM.className='w3-btn w3-ripple w3-hover-grey';
            moveVM.appendChild(document.createTextNode("Move VM(s)"));
            moveVM.setAttribute("onclick", "moveVMModal()");
            tableDiv.appendChild(moveVM)

            var table = document.createElement('TABLE');
            table.className='w3-table w3-striped w3-bordered';

            var tableHead = document.createElement('THEAD');
            table.appendChild(tableHead);

            var trHead = document.createElement('TR');
            trHead.className='w3-theme';

            var th = document.createElement('TH');
            th.appendChild(document.createTextNode("VMName"));
            trHead.appendChild(th);

            var th = document.createElement('TH');
            th.appendChild(document.createTextNode("HVHost"));
            trHead.appendChild(th);

            tableHead.appendChild(trHead);

            var tableBody = document.createElement('TBODY');
            table.appendChild(tableBody);

            for (var i = 0; i < result.length; i++) {

                if (result[i].hasOwnProperty("value")) {
                    continue;
                }

                var trBody = document.createElement('TR');

                var td = document.createElement('TD');
                td.appendChild(document.createTextNode(result[i].VMName));
                trBody.appendChild(td);

                var td = document.createElement('TD');
                td.appendChild(document.createTextNode(result[i].HVHost));
                trBody.appendChild(td);

                tableBody.appendChild(trBody);
            }

            tableDiv.appendChild(table);

            $("table tbody tr").click(function() {
                var tr = $(this);
                if(tr.hasClass("w3-select")) {
                    tr.removeClass("w3-select");
                    tr.removeClass("w3-grey");
                } else {
                    tr.addClass("w3-select");
                    tr.addClass("w3-grey");
                }
            });
        }

        moveBar(0,' ')

    }});
}

function moveBar(width,text) {
    var divwidth = document.getElementById("barWidth");
    divwidth.style.width = width + '%';
    var divtext = document.getElementById("barText");
    divtext.innerHTML=text;

}

function searchKeyPress(e)
{
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('btnSearch').click();
        return false;
    }
    return true;
}

function moveVMModal() {
    moveBar(1,"Loading...");
    vms = [];
    source = [];

    var tableDiv = document.getElementById("modalcontainer");
    while(tableDiv.firstChild){
        tableDiv.removeChild(tableDiv.firstChild);
    }

    $(".w3-select td:first-child").each(function(index,cell) {
        vms.push($(cell).text());
    });

    $(".w3-select td:nth-child(2").each(function(index,cell) {
        source.push($(cell).text());
    });

    if (vms[0] !== 'undefined' || !vms[0]) {
        if (vms[0].indexOf("se-") !== -1){
            datacenter = "se";
        } else if (vms[0].indexOf("sw-") !== -1){
            datacenter = "sw";
        } else if (vms[0].indexOf("tp-") !== -1){
            datacenter = "sw";
        }
    }

    $.ajax({url: "hosts.ps1?command=getdchosts&datacenter=" + datacenter, dataType:'json', success: function(result){

        var table = document.createElement('TABLE');
        table.className='w3-table w3-striped w3-bordered';
        table.id="modalTable";

        var tableHead = document.createElement('THEAD');
        table.appendChild(tableHead);

        var trHead = document.createElement('TR');
        trHead.className='w3-theme';

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("VMName"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("SourceHost"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("DestHost"));
        trHead.appendChild(th);

        tableHead.appendChild(trHead);

        var tableBody = document.createElement('TBODY');
        table.appendChild(tableBody);

        for (var vm in vms) {
            var trBody = document.createElement('TR');

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(vms[vm]));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(source[vm]));
            trBody.appendChild(td);

            var td = document.createElement('TD');
                var form = document.createElement('Form');

                var select = document.createElement('select');
                select.id="hvdest";
                select.name="hvdest";
                form.appendChild(select);

                for (var i in result) {
                    var option = document.createElement('option');
                    option.value=result[i];
                    option.appendChild(document.createTextNode(result[i]));
                    select.appendChild(option);
                }
            td.appendChild(form);
            trBody.appendChild(td);

            tableBody.appendChild(trBody);
        }

        tableDiv.appendChild(table);

        var unhide = document.getElementById("moveVM");
        unhide.style.display='block';

        moveBar(0,"");

    }});
}

function vmMove() {
    var vms = [];
    var source = [];
    var dest = [];
    var jsonObj = [];

    document.getElementById('moveVM').style.display='none';

    $("#modalTable td:first-child").each(function(index,cell) {
        vms.push($(cell).text());
    });

    $("#modalTable td:nth-child(2").each(function(index,cell) {
        source.push($(cell).text());
    });
    $("#hvdest option:selected").each(function(index,cell) {
        dest.push($(cell).text());
    });

    for(var i = 0; i < vms.length; ++i) {
        jsonObj.push({
            vm: vms[i],
            source: source[i],
            dest: dest[i]
        })
    }
    var json_string = JSON.stringify(jsonObj);

    jobID = startJob("movevms","host",json_string);
    var retry = setInterval(function() {
        if (ajax_result !== "") {
            clearInterval(retry);
            moveBar(0, "Move complete or failed");
        }
    }, 700);
}

function jobTable() {

    var tableDiv = document.getElementById("vmtable");
    while(tableDiv.firstChild){
        tableDiv.removeChild(tableDiv.firstChild);
    }

    var title = document.createElement("h3");
    title.appendChild(document.createTextNode("Job List"));
    title.className='w3-center';
    tableDiv.appendChild(title);

    $.ajax({url: "jobs.ps1?command=listjobs", dataType:'json', success: function(result){

        var removeall = document.createElement("button");
        removeall.className='w3-btn w3-ripple w3-hover-grey';
        removeall.appendChild(document.createTextNode("Remove Job"));
        removeall.setAttribute('onclick', 'removeJob()');
        tableDiv.appendChild(removeall);

        var removeall = document.createElement("button");
        removeall.className='w3-btn w3-ripple w3-hover-grey';
        removeall.appendChild(document.createTextNode("Job Output"));
        removeall.setAttribute('onclick', 'jobOutput()');
        tableDiv.appendChild(removeall);

        var table = document.createElement('TABLE');
        table.className='w3-table w3-striped w3-bordered';

        var tableHead = document.createElement('THEAD');
        table.appendChild(tableHead);

        var trHead = document.createElement('TR');
        trHead.className='w3-theme';

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("Id"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("Name"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("State"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("StartTime"));
        trHead.appendChild(th);

        var th = document.createElement('TH');
        th.appendChild(document.createTextNode("EndTime"));
        trHead.appendChild(th);

        tableHead.appendChild(trHead);

        var tableBody = document.createElement('tbody');
        table.appendChild(tableBody);

        for (var i = 0; i < result.length; i++) {

            if (result[i].hasOwnProperty("value")) {
                continue;
            }

            var trBody = document.createElement('TR');

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].Id));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].Name));
            trBody.appendChild(td);

            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(result[i].State));
            trBody.appendChild(td);

            var raw = result[i].PSBeginTime;
            var init = raw.indexOf('(');
            var fin = raw.indexOf(')');
            var timestamp = raw.substr(init+1,fin-init-1);
            timestamp = parseInt(timestamp);
            var time = moment(timestamp).format("DD-MM-YYYY h:mm:ss");
            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(time));
            trBody.appendChild(td);

            var raw = result[i].PSEndTime;
            var init = raw.indexOf('(');
            var fin = raw.indexOf(')');
            var timestamp = raw.substr(init+1,fin-init-1);
            timestamp = parseInt(timestamp);
            var time = moment(timestamp).format("DD-MM-YYYY h:mm:ss");
            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(time));
            trBody.appendChild(td);

            tableBody.appendChild(trBody);
        }
        tableDiv.appendChild(table);

         $("table tbody tr").click(function() {
            var tr = $(this);
            if(tr.hasClass("w3-select")) {
                tr.removeClass("w3-select");
                tr.removeClass("w3-grey");
            } else {
                tr.addClass("w3-select");
                tr.addClass("w3-grey");
            }
        });
    }});

}

function removeJob() {
    var jobid = [];

    $(".w3-select td:first-child").each(function(index,cell) {
        jobid.push($(cell).text());
    });

    $.ajax({url: "jobs.ps1?command=removejob&job=" + jobid, success: function() {
        jobTable();
    }});
}

function jobOutput() {
    var jobid = [];

    $(".w3-select td:first-child").each(function(index,cell) {
        jobid.push($(cell).text());
    });

    $.ajax({url: "jobs.ps1?command=getjobplain&job=" + jobid, success: function(result) {

        var tableDiv = document.getElementById("joboutput");
        while(tableDiv.firstChild){
            tableDiv.removeChild(tableDiv.firstChild);
        }

        var p = document.createElement('p');
        p.appendChild(document.createTextNode(result));
        tableDiv.appendChild(p);

        var unhide = document.getElementById("jobmodal");
            unhide.style.display='block';
    }});
}
