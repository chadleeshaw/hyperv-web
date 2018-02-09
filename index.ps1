@"
<html>
    <head>
        <title>Hyper-V</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" href="css/w3.css">
        <link rel="stylesheet" href="css/w3-theme-black.css">
        <script type="text/javascript" src="js/jquery.js"></script>
        <script type="text/javascript" src="js/functions.js"></script>
        <script type="text/javascript" src="js/moments.js"></script>
    </head>
<body>

<header class="w3-container w3-blue-grey">
    <h2>Hyper-V</h2>
    <i class="fa fa-cogs topcorner" aria-hidden="true" onclick="jobs()"></i>
    <div class="w3-progress-container w3-medium w3-blue-grey">
        <div id="barWidth" class="w3-progressbar w3-green w3-center" style="width:0%">
            <div id="barText" class="w3-container w3-text-white w3-left"></div>
        </div>
    </div>
</header>

<ul class="w3-navbar w3-theme">
  <li><a class="w3-padding-16" href="#" onclick="hvButtons('dc1')">DC1</a></li>
  <li><a class="w3-padding-16" href="#" onclick="hvButtons('dc2')">DC2</a></li>
  <li><a class="w3-padding-16" href="#" onclick="hvButtons('dc3')">DC3</a></li>
  <form>
        <li class="w3-right w3-padding-16"><button type="button" id="btnSearch" onclick="vmsearch(this.form)" class="w3-btn w3-btn-block fa fa-search"></button></li>
        <li class="w3-right w3-padding-16"><input class="w3-input w3-border w3-hover-border-black" name="inputbox" placeholder="app*" onkeypress="return searchKeyPress(event);" required></li>
  </form>
</ul>


<div class="w3-row w3-border">
    <div class="w3-quarter w3-white" id="hvhosts"></div>
    <div class="w3-container">
        <div class="w3-responsive w3-card-4" id="vmtable"></div>
    </div>
</div>

<div id="moveVM" class="w3-modal">
    <div class="w3-modal-content w3-card-8">
        <header class="w3-container w3-blue-grey">
            <span onclick="document.getElementById('moveVM').style.display='none'" class="w3-closebtn">&times;</span>
            <h3>Move VM(s) - Select Destination</h3>
        </header>
        <div class="w3-container w3-padding-16" id="modalcontainer">
        <p>Content</p>
        </div>
        <div class="w3-container w3-border-top w3-padding-16 w3-light-grey">
            <button onclick="document.getElementById('moveVM').style.display='none'" type="button" class="w3-btn w3-red">Cancel</button>
            <button onclick="vmMove()" type="button" class="w3-btn w3-green">Move</button>
        </div>
    </div>
</div>

<div id="jobmodal" class="w3-modal">
    <div class="w3-modal-content w3-card-8">
        <header class="w3-container w3-blue-grey">
            <span onclick="document.getElementById('jobmodal').style.display='none'" class="w3-closebtn">&times;</span>
            <h3>Job Output</h3>
        </header>
        <div class="w3-container w3-padding-16" id="joboutput">
        <p>blank</p>
        </div>
        <div class="w3-container w3-border-top w3-padding-16 w3-light-grey">
            <button onclick="document.getElementById('jobmodal').style.display='none'" type="button" class="w3-btn w3-red">Close</button>
        </div>
    </div>
</div>

<footer class="w3-container w3-blue-grey">
  <p class="w3-opacity">&copy; 2016</p>
</footer>

</body>
</html>

"@
