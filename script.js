var nextID = 0;
var nextNodeName = []
var nodes = []
var parents = {}
var features = []
var data = []
var colors = {}
var colorOptions = ["#FF0000", "#FFA500", "#FFFF00", "#00FF00", "#00FFFF", 
  "#0000FF", "#FF00FF", "#FF1493"]

//testing
var testData = []
var testCounter = 0;
var testCorrect = 0;

//for stopping the animation
var stopAnimating = false;

//for propogating results
var finishedAssignments = false;
var setValues = {}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');

      var reader = new FileReader();

    }
    //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function generateRandomColor() {
  var randomIndex = Math.floor(Math.random()*colorOptions.length);
  color = colorOptions[randomIndex];
  var index = colorOptions.indexOf(color);
  colorOptions.splice(index,1);
  return color;
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function readTestFile() {
  var testFiles = document.getElementById('testFiles').files;
  if (!testFiles.length){
    alert("Please upload test file.");
    return;
  }

  var file = testFiles[0];
  var start = 0;
  var stop = file.size;

  var reader = new FileReader();

  reader.onloadend = function(evt){
    if (evt.target.readyState == FileReader.DONE){
      var info = evt.target.result.split('\n');

      for (var i=1; i<info.length-1; i++){
        testData.push(info[i].split(','));
      }
    }
  }

  reader.readAsBinaryString(file);

  document.getElementById("TestLoaded").style.display = "block";
  console.log("loaded it");
}

function readDataFile() {
  var files = document.getElementById('files').files;
  if (!files.length){
    alert('Please select a file');
    return;
  }

  var file = files[0];
  var start = 0;
  var stop = file.size -1;

  var reader = new FileReader();

  reader.onloadend = function(evt){
    if (evt.target.readyState == FileReader.DONE){
      var info = evt.target.result.split('\n');

      //populate features
      features = info[0].slice(0,-1).split(',');

      //populate colors dictionary
      for (var j=0; j<features.length; j++){
        colors[features[j]] = generateRandomColor(); 
      }

      //populate data array
      for (var i=1; i<info.length; i++){
        data.push(info[i].split(','));
      }
      
      document.getElementById('byte_range').textContent = "Data Successfully Loaded";
      //document.getElementById('byte_content').textContent = "Available Features: " + features;

      //create animate form
      var form = document.getElementById("animateForm");

      var select = document.createElement("select");
      select.setAttribute('name','animationOptions');
      select.setAttribute('id','animationOptions');
      select.setAttribute('multiple', true);

      /*
      for (var j=0; j<features.length; j++){
        var option = document.createElement("option");
        option.setAttribute('value', features[j]);
        option.innerHTML = features[j];
        select.appendChild(option);
      }*/
      form.appendChild(select);

      var animations = document.getElementsByClassName("animation");

      for (var i=0; i<animations.length; i++){
        animations[i].style.display = "block";
      }
    }
  };

  var blob = file.slice(start, stop+1);
  reader.readAsBinaryString(blob);
}

//document.getElementById('entire').addEventListener('click', function(event){
  //readDataFile();
//}, false);

function displayRSVPSpeed() {
  var speed = document.getElementById("slider").value;
  document.getElementById("speedDisplay").innerHTML = speed;
}

function animateNodes(event) {
  if (data.length == 0){
    alert("Please upload data");
    return;
  } else if (nodes.length == 0){
    alert("Please create a node");
    return;
  }

  var counter = 0;

  //Determine which nodes to animate (which were selected)
  var animationSelect = document.getElementById("animationOptions");
  var tags = [];
  var options = animationSelect.options;
  for (var i=0; i<options.length; i++){
    if (animationSelect.options[i].selected){
      tags.push(animationSelect.options[i].value);
    }
  }

  //get slider value
  var slider = document.getElementById("slider");
  var speed = slider.value;
  
  function myloop() {
    setTimeout(function () {

      for (var j=0; j<tags.length; j++){
        var elem = document.getElementById(tags[j])
        var dataIndex = features.indexOf(tags[j]);

        if (!tags.includes(nodes[j])){
          continue;
        }

        //console.log("top", elem.offsetTop, elem.offsetLeft);

        if (counter%2 == 1){
          elem.style.color = "white";
        } 

        else {
          if (data[counter/2][dataIndex] == "1"){
            elem.style.color = colors[tags[j]];
          } else {
            elem.style.color = "white";
          }
        }

      }
      counter++;

      if (counter%2 == 0){
        document.getElementById('completionRate').innerHTML = "Animation is " + counter/2 + " % finished."; 
      }

      if (!stopAnimating){
        if (counter/2 < data.length){
          myloop();
        }
      } else {
        for (var j=0; j<tags.length; j++){
          var tagElem = document.getElementById(tags[j]);
          tagElem.style.color = "white";
        }
      }
    }, speed)
  }

  myloop();
  stopAnimating = false;
}

function stopAnimation() {
  console.log("No animating");
  stopAnimating = true;
}

function createNewNode(event) {
  if (features.length == 0){
    alert("Please upload data first");
    return;
  }

  var newNode = document.createElement("div");
  newNode.className = "node";
  newNode.id = "node"+String(nextID);
  newNode.style.position = "absolute";
  newNode.style.top = "670px";

  nextID += 1;

  newNode.onmousedown = function click() {
    dragAndDrop(newNode);
  };
  document.body.appendChild(newNode);
  nextNodeName.push(newNode.id);
  nodes.push(newNode.id);

  createNewForm(newNode.id);

}

function createNewForm(nodeID) {
  var form = document.createElement("form");
  form.setAttribute('id',nodeID+"Form");
  form.style.position = "absolute";
  form.style.top = "730px";

  //create inputs
  var select = document.createElement("select");
  select.setAttribute('name',nodeID+"Select");
  select.setAttribute('id',nodeID+"Select");

  for (var i=0; i<features.length; i++){
    var option = document.createElement("option");
    option.setAttribute('value',features[i]);
    option.innerHTML=features[i];

    select.appendChild(option);
  }

  //create submit button
  var input = document.createElement("input");
  input.setAttribute('type','button');
  input.setAttribute('value','Submit');
  input.onclick = function() {
    addNodeName(nodeID);
  }

  form.appendChild(select);
  form.appendChild(input);

  document.body.appendChild(form);
}

/**
(1) Add name to the node
(2) Add option to animate that particular node
(3) Add option to connect that particular node
(4) Add option to get results for that paricular node
*/
function addNodeName(nodeID) {
  
  var select = document.getElementById(nodeID+"Select");
  var nodeName = select.value;

  var node = document.getElementById(nodeID);
  node.innerHTML = nodeName;
  node.id = nodeName;

  var oldIndex = nodes.indexOf(nodeID);
  nodes.splice(oldIndex, 1);
  nodes.push(nodeName);
  parents[nodeName] = [];

  var form = document.getElementById(nodeID+"Form");
  document.body.removeChild(form);

  //append new name to animation options
  var option = document.createElement("option");
  option.setAttribute('value', nodeName);
  option.innerHTML = nodeName;
  document.getElementById("animationOptions").appendChild(option);

  //append new names to connect node options
  var option1 = document.createElement("option");
  option1.setAttribute('value', nodeName);
  option1.innerHTML = nodeName;
  document.getElementById("connectSelect1").appendChild(option1);

  var option2 = document.createElement("option");
  option2.setAttribute('value', nodeName);
  option2.innerHTML = nodeName;
  document.getElementById("connectSelect2").appendChild(option2);


  //append new names to get results form
  var resultsOption = document.createElement("option");
  resultsOption.setAttribute("value", nodeName);
  resultsOption.innerHTML = nodeName;
  document.getElementById("resultsForm").appendChild(resultsOption);


  //append new name to propogate results options
  var table = document.getElementById("propTable");
  var row = document.createElement("tr");

  //create first element in row
  var tag = document.createElement("td");
  tag.style.width = "160px";
  tag.innerHTML = nodeName;

  //create given form in row
  var formTD = document.createElement("td");
  var newForm = document.createElement("form");
  var select = document.createElement("select");
  select.setAttribute("id", "propForm"+nodeName);

  //create options for the form
  //given true option
  var givenTrue = document.createElement("option");
  givenTrue.setAttribute("value", "True");
  givenTrue.innerHTML = "True";
  select.appendChild(givenTrue);

  //given false option
  var givenFalse = document.createElement("option");
  givenFalse.setAttribute("value", "False");
  givenFalse.innerHTML = "False";
  select.appendChild(givenFalse);

  //not given option
  var notGiven = document.createElement("option");
  notGiven.setAttribute("value", "Not Given");
  notGiven.innerHTML = "Not Given";
  select.appendChild(notGiven);

  newForm.appendChild(select);
  formTD.appendChild(newForm);

  //add final appends
  row.appendChild(tag);
  row.appendChild(formTD);
  table.appendChild(row);
}

function dragAndDrop(node_id) {

  function move(event) { // (1) start the process

    let shiftX = event.clientX - node_id.getBoundingClientRect().left;
    let shiftY = event.clientY - node_id.getBoundingClientRect().top;

    // (2) prepare to moving: make absolute and on top by z-index
    node_id.style.position = 'absolute';
    node_id.style.zIndex = 1000;
    // move it out of any current parents directly into body
    // to make it positioned relative to the body
    document.body.append(node_id);
    // ...and put that absolutely positioned ball under the cursor

    moveAt(event.pageX, event.pageY);

    // centers the ball at (pageX, pageY) coordinates
    function moveAt(pageX, pageY) {
      node_id.style.left = pageX - shiftX + 'px';
      node_id.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);

      node_id.hidden = true;
      let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
      node_id.hidden = false;

      if (!elemBelow) return;

      let droppableBelow = elemBelow.closest('.droppable');
      if (currentDroppable != droppableBelow){
        if (currentDroppable) {
          leaveDroppable(currentDroppable);
        }
        currentDroppable = droppableBelow;
        if (currentDroppable) {
          enterDroppable(currentDroppable);
        }
      }
    }

    // (3) move the ball on mousemove
    document.addEventListener('mousemove', onMouseMove);

    // (4) drop the ball, remove unneeded handlers
    node_id.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      node_id.onmouseup = null;
    };

  };

  function enterDroppable(elem){
      //elem.style.background = 'pink';
  }

  function leaveDroppable(elem){
      //elem.style.background = '';
  }

  let currentDroppable = null;

  move(event);

  node_id.ondragstart = function() {
    return false;
  }
}

function connectTwoNodes(event) {
  console.log("Connecting");
  if (nodes.length == 0){
    alert("Please create nodes");
    return;
  }

  var parent = document.getElementById("connectSelect1").value;
  var secondNode = document.getElementById("connectSelect2").value;

  if (parent == secondNode){
    alert("Please select two different nodes.");
    return;
  }

  if (secondNode in parents){
    var list = parents[secondNode];
    list.push(parent);
    parents[secondNode] = list;
  } else {
    parents[secondNode] = [parent];
  }

  var node1 = document.getElementById(parent);
  var node2 = document.getElementById(secondNode);

  var x1 = node1.offsetLeft, y1 = node1.offsetTop;
  var x2 = node2.offsetLeft, y2 = node2.offsetTop;

  var width = Math.abs(x1-x2);
  var height = Math.abs(y1-y2);

  //console.log(x1, y1);
  //console.log(x2, y2);

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", parent+secondNode+"line");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height-50);
  svg.style.position = "absolute";
  svg.style.top = Math.min(y1, y2)+50;
  svg.style.left = Math.min(x1, x2)+65;
  svg.style.stroke = "white";

  var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  if (x1 > x2){
    line.setAttribute("x1", width);
    line.setAttribute("x2", 0);
  } else {
    line.setAttribute("x1", 0);
    line.setAttribute("x2", width);
  }
  line.setAttribute("y1", 0);
  line.setAttribute("y2", height-50);
  line.setAttribute("style", "strokeWidth: 2");

  svg.appendChild(line);
  document.body.appendChild(svg);
}

function disconnectTwoNodes(event) {
  if (nodes.length == 0){
    alert("Please create nodes.");
    return;
  }

  var parent = document.getElementById("connectSelect1").value;
  var secondNode = document.getElementById("connectSelect2").value;

  var line = document.getElementById(parent+secondNode+"line");
  if (line == null){
    alert("This connection does not exist.");
    return;
  }

  line.parentNode.removeChild(line);

  var parentList = parents[secondNode];
  var badIndex = parentList.indexOf(parent);
  parentList.splice(badIndex,1);
  parents[secondNode] = parentList;
}

function runTests(event) {
  clearResults();
  console.log("running tests", testCounter);

  var finalVariable = "Plane Doesn't Land";
  var dataPoint = testData[testCounter];

  var givens = ["Bad Weather"];

  for (var i=0; i<givens.length; i++){
    var givenIndex = features.indexOf(givens[i]);
    setValues[givens[i]] = (dataPoint[givenIndex] == "1");
    var node = document.getElementById(givens[i]);
    node.innerHTML += "<br />";
    node.innerHTML += "<span style='color:red'>"+setValues[givens[i]]+"</span>";
  }

  //populates setValues dictionary
  function helper(currentNode) {
    //base case, no parents, set value
    if (parents[currentNode].length == 0){
      if (!currentNode in setValues){
        var probability = getProbability(currentNode, []);
        var randomNum = Math.floor(Math.random()*100);
        if (randomNum <= probability){
          setValues[currentNode] = true;
        } else {
          setValues[currentNode] = false;
        }

        var node = document.getElementById(currentNode);
        node.innerHTML += "<br />";
        node.innerHTML += "<span style='color:red'>"+setValues[currentNode]+"</span>";
      } else {
        return;
      }
    }

    //recursive step we've set all the parents
    else {
      var parentList = parents[currentNode];
      for (var i=0; i<parentList; i++){
        helper(parentList[i]);
      }
      var finalprobability = getProbability(currentNode, parentList);
      var finalrandomNum = Math.floor(Math.random()*100);
      if (finalrandomNum <= finalprobability){
          setValues[currentNode] = true;
        } else {
          setValues[currentNode] = false;
        }

      var node = document.getElementById(currentNode);
      node.innerHTML += "<br />";
      node.innerHTML += "<span style='color:red'>Actual: "+setValues[currentNode]+"</span>";
    }
  }

  helper(finalVariable);
  
  var finalVarIndex = features.indexOf(finalVariable);
  var correct = dataPoint[finalVarIndex];
  if (setValues[finalVariable] == (correct == "1")){
    testCorrect += 1;
  }
  document.getElementById(finalVariable).innerHTML += "<br /><span>Expeced: "+(correct==1)+"</span>";
  //var corr = document.getElementById("CorrectVal");
  //corr.innerHTML="Correct Value"

  var acc = document.getElementById("TestAccuracy");
  acc.innerHTML = "TestAccuracy: "+testCorrect/(testCounter+1);


  testCounter += 1;
  if (testCounter >= testData.length){
    console.log("test accuracy", testCorrect/testData.length);

    testCounter == 0;
    alert("Finished running tests");
  }
}

function runAllTests(event) {
  function totalloop() {
    setTimeout(function () {
      if (testCounter < testData.length){
        runTests(event);
        totalloop();
      }
    }, 2000)
  }

  totalloop();
}

function getResults(event) {
  console.log("getting results");

  var table = document.getElementById("propTable");
  if (!finishedAssignments){
    for (var i=0; i<nodes.length; i++){
      //get form value
      var testID = "propForm"+nodes[i];
      var propForm = document.getElementById("propForm"+nodes[i]);
      var propFormVal = propForm.value;
      setValues[nodes[i]] = propFormVal;

      if (propFormVal != "Not Given"){
        var firstNode = document.getElementById(nodes[i]);
        firstNode.innerHTML += "<br />"
        firstNode.innerHTML += "<span style='color:red'>"+propFormVal+"</span>";
      }
    }
    finishedAssignments = true;
    return;
  }

  var finalNode = document.getElementById("resultsForm").value;
  var currentNode = finalNode;

  //keep checking until all parents have assigned value
  var keepLooping = true;
  while (keepLooping){
    keepLooping = false;

    //check if current node has assigned value
    var pars = parents[currentNode];
    if (pars.length == 0) {
      break;
    } else {
      for (var j=0; j<pars.length; j++){
        var parent = pars[j];
        if (setValues[parent] == "Not Given"){
          keepLooping = true;
          currentNode = parent;
        }
      }
    }
  }
  console.log("Got current node", currentNode);

  var probability = getProbability(currentNode, parents[currentNode])
  var randomNum = Math.floor(Math.random()*100);
  console.log(randomNum, probability);

  if (randomNum < probability){
    setValues[currentNode] = "True";
  } else {
    setValues[currentNode] = "False";
  }

  var node = document.getElementById(currentNode);
  node.innerHTML += "<br />";
  node.innerHTML += "Probability = "+probability+"%";
  node.innerHTML += "<br />";
  node.innerHTML += "<span style='color:red'>"+setValues[currentNode]+"</span>";
  console.log("made it here");

}

function getProbability(child, parentList) {
  ///console.log("Getting probability");
  //console.log(child, parentList);
  var total = 0
  var featureCount = 0;

  for (var i=0; i<data.length; i++){
    var count = true;
    for (var j=0; j<parentList.length; j++){
      var parent = parentList[j];
      var CorrectVal = (setValues[parent] == "True");
      var DataVal = (data[i][j] == "1");
      if (CorrectVal != DataVal){
        count = false;
      }
    }
    if (count){
      total += 1;
      var featureIndex = features.indexOf(child);
      if (data[i][featureIndex] == "1"){
        featureCount += 1;
      }
    }
  }
  if (total == 0){
    return 0;
  }

  //console.log("numbers", total, featureCount);
  return Math.round((featureCount/total)*100);

}

function clearResults() {
  finishedAssignments = false;
  setValues = {};

  for (var i=0; i<nodes.length; i++){
    var elem = document.getElementById(nodes[i]);
    elem.innerHTML = nodes[i];
  }
}
