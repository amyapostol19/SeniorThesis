
//////////////////////////////////////////////////////////////////////////////
/////////////Section 0: Declaring instance variables//////////////////////////
//////////////////////////////////////////////////////////////////////////////

var nodes = []
var parents = {}
var children = {}
var features = []
var data = []
var colors = {}
var colorOptions = ["Red", "#OrangeRed", "Teal", "Blue", "Aqua",
 "Fuchsia", "#FF1493", "MistyRose"]

//testing
var testData = []
var testCounter = 0;
var testCorrect = 0;

//for propogating results
var setValues = {}
var probabilities = {}


////////////////////////////////////////////////////////////////////////////////
///////////////Section 1: Uploading training Data///////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//event handler for when the user selects a file to upload
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
}

//add event listener
document.getElementById('files').addEventListener('change', handleFileSelect, false);

//read training data file that was uploaded and populate data structures in script.js
function readDataFile() {
  var files = document.getElementById('files').files;

  //make sure a file has been uploaded
  if (!files.length){
    alert('Please select a file');
    return;
  }

  var file = files[0];
  var start = 0;
  var stop = file.size -1;

  var reader = new FileReader();

  //populate data array, features array and make visible animate forms
  reader.onloadend = function(evt){
    if (evt.target.readyState == FileReader.DONE){
      var info = evt.target.result.split('\n');

      //populate list of features
      features = info[0].slice(0,-1).split(',');

      //populate colors dictionary
      for (var j=0; j<features.length; j++){
        colors[features[j]] = generateRandomColor(); 
      }

      //populate data array
      data.length = 0;
      for (var i=1; i<info.length-1; i++){
        data.push(info[i].slice(0,-1).split(','));
      }
      
      document.getElementById('byte_range').textContent = "Data Successfully Loaded";

      //create animate form (will populate with options later)
      var form = document.getElementById("animateForm");
      var select = document.createElement("select");
      select.setAttribute('name','animationOptions');
      select.setAttribute('id','animationOptions');
      select.setAttribute('multiple', true);
      form.appendChild(select);

      //make visible all elements that are a part of the animation class
      var animations = document.getElementsByClassName("animation");
      for (var i=0; i<animations.length; i++){
        animations[i].style.display = "block";
      }
    }
  };

  //get parts of the file to read and read those parts
  var blob = file.slice(start, stop+1);
  reader.readAsBinaryString(blob);
}

/////////////////////Helper Functions for reading data file/////////////////////
function generateRandomColor() {
  var randomIndex = Math.floor(Math.random()*colorOptions.length);
  color = colorOptions[randomIndex];
  var index = colorOptions.indexOf(color);
  colorOptions.splice(index,1);
  return color;
}
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
///////////////////Section 2: Adding, Deleting and Moving Nodes/////////////////
////////////////////////////////////////////////////////////////////////////////

//counter to temporarily assign IDs to unamed nodes
var nextID = 0;

//create a new node on the board
function createNewNode(event) {
  //make sure data has been uploaded and possible features exist
  if (features.length == 0){
    alert("Please upload data first");
    return;
  }

  //create new node and set attributes
  var newNode = document.createElement("div");
  newNode.className = "node";
  newNode.id = "node"+String(nextID);
  newNode.style.position = "absolute";
  newNode.style.top = "670px";

  //update nextID counter.
  nextID += 1;

  //create delete button on node
  var deleteButton = document.createElement("button");
  deleteButton.innerHTML = "x"
  deleteButton.style.zIndex = 1001;
  deleteButton.style.position = "absolute";
  deleteButton.style.left = "120px";
  deleteButton.id = "deleteButton";
  deleteButton.onclick = function clickDelete() {
    deleteNode(newNode.id);
  }
  newNode.appendChild(deleteButton);

  //define name div and info div for new node
  //create node name div and add it to node
  var nameElem = document.createElement("div");
  newNode.appendChild(nameElem);

  //create nodeInfo div and add it to node
  var nodeInfo = document.createElement("div");
  newNode.appendChild(nodeInfo);
  
  //make new node draggable and have functions for what to do when dragging
  newNode.draggable = "true";
  newNode.ondragstart = function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
  }


  //rename node when double clicking
  newNode.ondblclick = function(event) {
    console.log("double", event);

    var inputForm = document.createElement("form");
    var inputText = document.createElement("input");
    inputText.type = "text";
    inputForm.appendChild(inputText);
    inputForm.onsubmit = function(argument) {
      var nodeName = inputText.value;
      if (!features.includes(nodeName)){
        alert("Invalid node name, try again");
      } else {
        var oldID = newNode.id;
        newNode.id = nodeName;
        nameElem.id = nodeName+"Name";
        nameElem.innerHTML = nodeName;
        nodeInfo.id = nodeName+"Info";

        //remove old node id from list of nodes and add new node id
        var oldIndex = nodes.indexOf(oldID);
        nodes.splice(oldIndex, 1);
        nodes.push(nodeName);

        newNode.removeChild(inputForm);

        addNodeHelper(nodeName);
      }
      return false;
    }

    newNode.appendChild(inputForm);
  }

  //append new node to documeent body, add node ID to array of nodes
  document.body.appendChild(newNode);
  nodes.push(newNode.id);

  console.log(nodes);
  //create the form that will allow you to name a node
  //createNewForm(newNode.id);
}

/////////////////Helper functions for creating a new node///////////////////////

//Found example on the internet. TODO site author
function dragAndDrop(node, prev_event) {

  function move(event) { // (1) start the process

    let shiftX = event.clientX - node.getBoundingClientRect().left;
    let shiftY = event.clientY - node.getBoundingClientRect().top;

    // (2) prepare to moving: make absolute and on top by z-index
    node.style.position = 'absolute';
    node.style.zIndex = 500;
    // move it out of any current parents directly into body
    // to make it positioned relative to the body
    document.body.append(node);
    // ...and put that absolutely positioned ball under the cursor

    moveAt(event.pageX, event.pageY);

    // centers the node at (pageX, pageY) coordinates
    function moveAt(pageX, pageY) {
      node.style.left = pageX - shiftX + 'px';
      node.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);
    }

    // (3) move the node on mousemove
    document.addEventListener('mousemove', onMouseMove);

    // (4) drop the node, remove unneeded handlers
    node.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      node.onmouseup = null;
    };

  };

  move(prev_event);

  node.ondragstart = function() {
    console.log("drag", prev_event);
    return false;
  }
}

/**
(1) Add name to the node
(2) Add option to animate that particular node
(3) Add option to connect that particular node
(4) Add option to get results for that paricular node
(5) Add option to delete that particular node
*/
function addNodeName(nodeID) {
  
  var select = document.getElementById(nodeID+"Select");
  var nodeName = select.value;

  //create node name div and add it to node
  var node = document.getElementById(nodeID);
  var nameElem = document.createElement("div");
  nameElem.innerHTML = nodeName;
  nameElem.id = nodeName+"Name";
  node.appendChild(nameElem);

  //create nodeInfo div and add it to node
  var nodeInfo = document.createElement("div");
  nodeInfo.id = nodeName+"Info";
  node.appendChild(nodeInfo);

  console.log(node);

  //specify new id of node
  node.id = nodeName;

  //remove old node id from list of nodes and add new node id
  var oldIndex = nodes.indexOf(nodeID);
  nodes.splice(oldIndex, 1);
  nodes.push(nodeName);

  //remove the add name form (TODO will eventually get rid of adding node name by form)
  var form = document.getElementById(nodeID+"Form");
  document.body.removeChild(form);

  addNodeHelper(nodeName);  
}

function addNodeHelper(nodeName) {
  //add node to parents dictionary and children dictionary
  parents[nodeName] = [];
  children[nodeName] = [];

  //compute probabilities for this node assuming no current parents or children
  computeProbabilities(nodeName);

  //append new name to animation options
  var option = document.createElement("option");
  option.setAttribute('value', nodeName);
  option.setAttribute('id', "animOption"+nodeName);
  option.innerHTML = nodeName;
  document.getElementById("animationOptions").appendChild(option);

  //append new names to connect node options
  var option1 = document.createElement("option");
  option1.setAttribute('value', nodeName);
  option1.setAttribute('id', "connectOption1"+nodeName);
  option1.innerHTML = nodeName;
  document.getElementById("connectSelect1").appendChild(option1);

  var option2 = document.createElement("option");
  option2.setAttribute('value', nodeName);
  option2.setAttribute('id', "connectOption2"+nodeName);
  option2.innerHTML = nodeName;
  document.getElementById("connectSelect2").appendChild(option2);


  //append new names to get results form
  var resultsOption = document.createElement("option");
  resultsOption.setAttribute("value", nodeName);
  resultsOption.setAttribute("id", "resultOption"+nodeName);
  resultsOption.innerHTML = nodeName;
  document.getElementById("resultsForm").appendChild(resultsOption);


  //append new name to propogate results options
  var table = document.getElementById("propTable");
  var row = document.createElement("tr");
  row.setAttribute("id", "propRow"+nodeName);

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

  console.log("added name", nodes);
}

function deleteNode(nodeID) {
  if (!features.includes(nodeID)){
    document.body.removeChild(document.getElementById(nodeID));
    document.body.removeChild(document.getElementById(nodeID+"Form"));
    return;
  }

  //remove all connections
  //disconnect node from all children
  var childListCopy = children[nodeID].slice(0);
  for (var i=0; i<childListCopy.length; i++){
    var child = childListCopy[i];
    disconnectNodesHelper(nodeID, child);
  }
  //disconnect node from all parents
  var parentListCopy = parents[nodeID].slice(0);
  for (var j=0; j<parentListCopy.length; j++){
    var parent = parentListCopy[j];
    disconnectNodesHelper(parent, nodeID);
  }

  delete parents[nodeID];
  delete children[nodeID];

  //remove from nodes list
  var nodeIndex = nodes.indexOf(nodeID);
  nodes.splice(nodeIndex, 1);

  //remove from body
  var nodeElem = document.getElementById(nodeID);
  document.body.removeChild(nodeElem);

  //remove from animation list
  var animOption = document.getElementById("animOption"+nodeID);
  document.getElementById("animationOptions").removeChild(animOption);

  //remove from connect options
  var connectOption1 = document.getElementById("connectOption1"+nodeID);
  document.getElementById("connectSelect1").removeChild(connectOption1);
  var connectOption2 = document.getElementById("connectOption2"+nodeID);
  document.getElementById("connectSelect2").removeChild(connectOption2);

  //remove name from get results option
  var resultOption = document.getElementById("resultOption"+nodeID);
  document.getElementById("resultsForm").removeChild(resultOption);

  //remove from givens option
  var row = document.getElementById("propRow"+nodeID);
  document.getElementById("propTable").removeChild(row);

  //remove from probabilities
  delete probabilities[nodeID];
}

function drop(event) {
  event.preventDefault();
  var nodeID = event.dataTransfer.getData("text");
  var node = document.getElementById(nodeID);

  //TODO fix shifting
  document.body.appendChild(node);
  node.style.left = event.clientX - 65 + 'px';
  node.style.top = event.clientY - 25 + 'px';
}

////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//////////////Section 3: Animating and Connecting Nodes/////////////////////////
////////////////////////////////////////////////////////////////////////////////

//for stopping the animation
var stopAnimating = false;

//function which causes nodes to blink on and off
function animateNodes(event) {
  //checks to make sure data has been uploaded and nodes exist
  if (data.length == 0){
    alert("Please upload data");
    return;
  } else if (nodes.length == 0){
    alert("Please create a node");
    return;
  }

  //Determine which nodes to animate (which were selected)
  var animationSelect = document.getElementById("animationOptions");
  var nodesToAnimate = [];
  var options = animationSelect.options;
  for (var i=0; i<options.length; i++){
    if (animationSelect.options[i].selected){
      nodesToAnimate.push(animationSelect.options[i].value);
    }
  }

  //get speed at which to animate nodes
  var slider = document.getElementById("slider");
  var speed = 1000 - (slider.value*10);
  
  //have counter to keep track of data point we're displaying on node animation (RSVP)
  //also used to keep track of how many times we've looped
  var counter = 0;

  function myloop() {
    setTimeout(function () {

      //determine if all nodes are lit for this particular data point
      var allLit = true;
      for (var i=0; i<nodesToAnimate.length; i++){
        var animatedNode = nodesToAnimate[i];
        if (counter%2 == 1){
          continue;
        } else {
          if (data[counter/2][features.indexOf(animatedNode)] != "1"){
            allLit = false;
          }
          //console.log(animatedNode, data[counter/2][features.indexOf(animatedNode)], allLit);
        }
      }

      //determine which nodes to animate and animate them (change the text color)
      for (var j=0; j<nodesToAnimate.length; j++){
        var nodeToAnimate = nodesToAnimate[j];
        var elem = document.getElementById(nodeToAnimate+"Name")
        var dataIndex = features.indexOf(nodeToAnimate);

        //only change the color of the node every other loop so that we can get the blinking effect
        if (counter%2 == 1){
          elem.style.color = "white";
        } 

        //change color of node if data value is true (==1)
        else {
          if (data[counter/2][dataIndex] == "1"){
            if (allLit){
              elem.style.color = "lawnGreen";
            } else {
              elem.style.color = colors[nodeToAnimate];
            }
          } else {
            elem.style.color = "white";
          }
        }

      }
      counter++;

      //used to keep track of how far along we are in the animation process
      if (counter%2 == 0){
        //document.getElementById('completionRate').innerHTML = "Animation is " + counter/2 + " % finished.";
        document.getElementById('animProgressBar').style.width = counter+"px"; 
        document.getElementById('animProgressBar').innerHTML = (counter/200)*100+"%";
      }

      //check to see if we should stop the animation process
      if (!stopAnimating && counter/2 < data.length){
          myloop();
      } 
      //if stopping the animation process, convert all nodes back to their original white color
      else {
        for (var j=0; j<nodesToAnimate.length; j++){
          var nodeElem = document.getElementById(nodesToAnimate[j]);
          nodeElem.style.color = "white";
        }
      }
    }, speed)
  }

  myloop();
  //once we've stopped animating, reset the boolean back to false
  //so it could be changed to true again when we start animating again
  stopAnimating = false;
}

//Once the user has selected a speed at which to animate nodes, display this speed
function displayAnimationSpeed() {
  var speed = document.getElementById("slider").value;
  document.getElementById("speedDisplay").innerHTML = speed;
}

//Stop the animation process from happening by changing the stopAnimating boolean
function stopAnimation() {
  console.log("No animating");
  stopAnimating = true;
}

function connectTwoNodes(event) {
  if (nodes.length == 0){
    alert("Please create nodes");
    return;
  }

  var parent = document.getElementById("connectSelect1").value;
  var child = document.getElementById("connectSelect2").value;

  //check to make sure two ndoes are different
  if (parent == child){
    alert("Please select two different nodes.");
    return;
  }

  connectNodesHelper(parent, child);
 
}

function connectNodesHelper(parent, child) {

  //add parent to the parents list of child
  parents[child].push(parent);
  
  //add child to the childrens list of parent
  children[parent].push(child);

  //connect nodes on front-end
  var node1 = document.getElementById(parent);
  var node2 = document.getElementById(child);

  var x1 = node1.offsetLeft, y1 = node1.offsetTop;
  var x2 = node2.offsetLeft, y2 = node2.offsetTop;

  var width = Math.abs(x1-x2);
  var height = Math.abs(y1-y2);

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", parent+child+"line");
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

  computeProbabilities(child);
}

function disconnectTwoNodes(event) {
  if (nodes.length == 0){
    alert("Please create nodes.");
    return;
  }

  var parent = document.getElementById("connectSelect1").value;
  var secondNode = document.getElementById("connectSelect2").value;

  disconnectNodesHelper(parent,secondNode);

}

function disconnectNodesHelper(parent, child) {
  var line = document.getElementById(parent+child+"line");
  if (line == null){
    alert("This connection does not exist.");
    return;
  }

  line.parentNode.removeChild(line);

  //remove parent from parent list of child
  var parentList = parents[child];
  var badIndex = parentList.indexOf(parent);
  parentList.splice(badIndex,1);
  parents[child] = parentList;

  //remove child from children list of parent
  var childList = children[parent];
  var badIndexChild = childList.indexOf(child);
  childList.splice(badIndexChild, 1);
  children[parent] = childList;

  computeProbabilities(child);
  
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
///////////////Section 4: Splitting and Merging Nodes///////////////////////////
////////////////////////////////////////////////////////////////////////////////
function createSplitNodeForm() {

  //create table that will hold the split node information
  var splitTable = document.createElement("table");
  splitTable.style.position = "absolute";
  splitTable.style.top = "630px";
  splitTable.style.left = "600px";
  splitTable.style.color = "black";
  splitTable.style.background = "white";
  //splitTable.style.border = "white";

  //create form to input which node to split
  var splitRow = document.createElement("tr");
  var splitCol01 = document.createElement("td");
  splitCol01.innerHTML = "Choose node to split:";
  splitCol01.style.width = "100px";
  splitRow.appendChild(splitCol01);

  var splitCol02 = document.createElement("td");
  splitCol02.style.width = "100px";
  var splitForm = document.createElement("form");
  var splitSelect = document.createElement("select");
  //populate form with node values so user can choose which node to split
  for (var i=0; i<nodes.length; i++){
    var splitOption = document.createElement("option");
    splitOption.innerHTML = nodes[i];
    splitSelect.appendChild(splitOption);
  }
  splitForm.appendChild(splitSelect);
  splitCol02.appendChild(splitForm);
  splitRow.appendChild(splitCol02);
  splitTable.appendChild(splitRow);

  //create form to list what column of data should be in the split node
  var splitRow1 = document.createElement("tr");
  var splitCol11 = document.createElement("td");
  splitCol11.innerHTML = "Choose column of data for first new node:";
  splitRow1.appendChild(splitCol11);

  var splitCol12 = document.createElement("td");
  var splitForm1 = document.createElement("form");
  var splitSelect1 = document.createElement("select");
  for (var i=0; i<features.length; i++){
    var splitOption1 = document.createElement("option");
    splitOption1.innerHTML = i;
    splitSelect1.appendChild(splitOption1);
  }
  splitForm1.appendChild(splitSelect1);
  splitCol12.appendChild(splitForm1);
  splitRow1.appendChild(splitCol12);
  splitTable.appendChild(splitRow1);

  //create form to choose the second column of data to be in the split node
  var splitRow2 = document.createElement("tr");
  var splitCol21 = document.createElement("td");
  splitCol21.innerHTML = "Choose column of data for second new node:";
  splitRow2.appendChild(splitCol21);

  var splitCol22 = document.createElement("td");
  var splitForm2 = document.createElement("form");
  var splitSelect2 = document.createElement("select");
  for (var i=0; i<features.length; i++){
    var splitOption2 = document.createElement("option");
    splitOption2.innerHTML = i;
    splitSelect2.appendChild(splitOption2);
  }
  splitForm2.appendChild(splitSelect2);
  splitCol22.appendChild(splitForm2);
  splitRow2.appendChild(splitCol22);
  splitTable.appendChild(splitRow2);

  var splitRow3 = document.createElement("tr");
  var splitCol3 = document.createElement("td");
  var submitButton = document.createElement("button");
  submitButton.innerHTML = "Submit";

  submitButton.onclick = function(argument) {

    //get which node to split and which columns for new nodes
    var nodeToSplit = splitSelect.value;
    var oldNode = document.getElementById(nodeToSplit);
    var firstDataCol = splitSelect1.value;
    var secondDataCol = splitSelect2.value;

    //create two new nodes with name from data column
    var newNodeName1 = features[firstDataCol];
    var newNode1 = document.createElement("div");
    newNode1.className = "node";
    newNode1.id = newNodeName1;
    newNode1.innerHTML = newNodeName1;
    newNode1.style.position = "absolute";
    newNode1.style.top = oldNode.style.top;
    var leftVal1 = parseInt(oldNode.style.left.slice(0,3)) - 100;
    newNode1.style.left = leftVal1+"px";
    nodes.push(newNodeName1);

    document.body.appendChild(newNode1);

    addNodeHelper(newNodeName1);

    //create second node with name from dataColumn
    var newNodeName2 = features[secondDataCol];
    var newNode2 = document.createElement("div");
    newNode2.className = "node";
    newNode2.id = newNodeName2;
    newNode2.innerHTML = newNodeName2;
    newNode2.style.position = "absolute";
    newNode2.style.top = oldNode.style.top;
    var leftVal2 = parseInt(oldNode.style.left.slice(0,3)) + 100;
    newNode2.style.left = leftVal2+"px";
    nodes.push(newNodeName2);

    document.body.appendChild(newNode2);

    addNodeHelper(newNodeName2);


    //add children to each new node
    for (var i=0; i<children[nodeToSplit].length; i++){
      var child = children[nodeToSplit][i];
      connectNodesHelper(newNodeName1, child);
      connectNodesHelper(newNodeName2, child);
    }

    //add parents to each new node
    for (var j=0; j<parents[nodeToSplit].length; j++){
      var parent = parents[nodeToSplit][j];
      connectNodesHelper(parent, newNodeName1);
      connectNodesHelper(parent, newNodeName2);
    }

    //delete node to split
    deleteNode(nodeToSplit);

    document.getElementById("split").removeChild(splitTable);
  }

  splitCol3.appendChild(submitButton);
  splitRow3.appendChild(splitCol3);
  splitTable.appendChild(splitRow3);

  document.getElementById("split").appendChild(splitTable);

}

function createMergeNodeForm() {
  //create table that will hold the split node information
  var mergeTable = document.createElement("table");
  mergeTable.style.position = "absolute";
  mergeTable.style.top = "630px";
  mergeTable.style.left = "600px";
  mergeTable.style.color = "black";
  mergeTable.style.background = "white";

  //enter two nodes to merge
  var row1 = document.createElement("tr");
  var col11 = document.createElement("td");
  col11.innerHTML = "Enter first node to merge:";
  row1.appendChild(col11);

  var col12 = document.createElement("td");
  var mergeForm1 = document.createElement("form");
  var mergeSelect1 = document.createElement("select");
  for (var i=0; i<nodes.length; i++){
    var mergeOption1 = document.createElement("option");
    mergeOption1.innerHTML = nodes[i];
    mergeSelect1.appendChild(mergeOption1);
  }
  mergeForm1.appendChild(mergeSelect1);
  col12.appendChild(mergeForm1);
  row1.appendChild(col12);

  //enter second node to merge
  var row2 = document.createElement("tr");
  var col21 = document.createElement("td");
  col21.innerHTML = "Enter second node to merge:";
  row2.appendChild(col21);

  var col22 = document.createElement("td");
  var mergeForm2 = document.createElement("form");
  var mergeSelect2 = document.createElement("select");
  for (var i=0; i<nodes.length; i++){
    var mergeOption2 = document.createElement("option");
    mergeOption2.innerHTML = nodes[i];
    mergeSelect2.appendChild(mergeOption2);
  }
  mergeForm2.appendChild(mergeSelect2);
  col22.appendChild(mergeForm2);
  row2.appendChild(col22);

  //enter new column number that will be responsible for merge
  var row3 = document.createElement("tr");
  var col31 = document.createElement("td");
  col31.innerHTML = "Choose column of data for merged node:"
  row3.appendChild(col31);

  var col32 = document.createElement("td");
  var mergeForm3 = document.createElement("form");
  var mergeSelect3 = document.createElement("select");
  for (var i=0; i<features.length; i++){
    var mergeOption3 = document.createElement("option");
    mergeOption3.innerHTML = i;
    mergeSelect3.appendChild(mergeOption3);
  }
  mergeForm3.appendChild(mergeSelect3);
  col32.appendChild(mergeForm3);
  row3.appendChild(col32);

  var row4 = document.createElement("tr");
  var col4 = document.createElement("td");
  var mergeSubmit = document.createElement("button");
  mergeSubmit.innerHTML = "Submit";
  mergeSubmit.onclick = function (argument) {
    var firstRemove = mergeSelect1.value;
    var secondRemove = mergeSelect2.value;
    var newNodeName = features[mergeSelect3.value];

    var oldNode1 = document.getElementById(firstRemove);
    var oldNode2 = document.getElementById(secondRemove);

    var newNode = document.createElement("div");
    newNode.className = "node";
    newNode.id = newNodeName;
    newNode.innerHTML = newNodeName;
    newNode.style.position = "absolute";
    newNode.style.top = (parseInt(oldNode1.style.top.slice(0,3))+parseInt(oldNode2.style.top.slice(0,3)))/2 + "px";
    newNode.style.left = (parseInt(oldNode1.style.left.slice(0,3))+parseInt(oldNode2.style.left.slice(0,3)))/2 + "px";
    nodes.push(newNodeName);

    document.body.appendChild(newNode);
    addNodeHelper(newNodeName);

    for (var i=0; i<parents[firstRemove].length; i++){
      var parent1 = parents[firstRemove][i];
      connectNodesHelper(parent1, newNodeName);
    }
    for (var j=0; j<parents[secondRemove].length; j++){
      var parent2 = parents[secondRemove][j];
      connectNodesHelper(parent2, newNodeName);
    }
    for (var k=0; k<children[firstRemove].length; k++){
      var child1 = children[firstRemove][k];
      connectNodesHelper(newNodeName, child1);
    }
    for (var l=0; l<children[secondRemove].length; l++){
      var child2 = children[secondRemove][l];
      connectNodesHelper(newNodeName, child2);
    }
 
    deleteNode(firstRemove);
    deleteNode(secondRemove);

    document.getElementById("split").removeChild(mergeTable);
  }
  col4.appendChild(mergeSubmit);
  row4.appendChild(col4);

  mergeTable.appendChild(row1);
  mergeTable.appendChild(row2);
  mergeTable.appendChild(row3);
  mergeTable.appendChild(row4);

  document.getElementById("split").appendChild(mergeTable);

}


////////////////////////////////////////////////////////////////////////////////
/////////Section 5: Running training and reading test file//////////////////////
////////////////////////////////////////////////////////////////////////////////

function computeProbabilities(childNode) {
  console.log("beginning training");
  finalNode = childNode;

  function getParentPermutations(parentList){
    if (parentList.length == 1){
      parent = parentList[0];
      return [parent, "not"+parent];
    } 

    else {
      var newParentList = parentList.slice(0);
      var parent = newParentList.shift()
      prev_perms = getParentPermutations(newParentList);
      newPermList = []
      for (var i=0; i<prev_perms.length; i++){
        newPermList.push(parent+"&"+prev_perms[i]);
        newPermList.push("not"+parent+"&"+prev_perms[i]);
      }
      return newPermList;
    }
  }

  function getPermutation(parentList, dataPoint) {
    var key = ""
    for (var i=0; i<parentList.length; i++){
      var index = features.indexOf(parentList[i]);
      var value = dataPoint[index];
      if (value == "0"){
        key += "not"+parentList[i];
      } else {
        key += parentList[i];
      }

      if (i+1<parentList.length){
        key += "&";
      }
    }
    return key;
  }

  function helper(currentNode) {
    if (parents[currentNode].length == 0){
      //if node doesn't have any parents just compute probability of true and false
      var True = 0;
      var False = 0;
      var total = 0;
      var nodeIndex = features.indexOf(currentNode);
      for (var i=0; i<data.length; i++){
        total += 1;
        if (data[i][nodeIndex] == "1"){
          True += 1;
        } else {
          False += 1;
        }
      }

      prob_dict = {true: True/total, false: False/total};
      probabilities[currentNode] = prob_dict;
    } 

    //node has parents
    else {
      for (var i=0; i<parents[currentNode].length; i++){
        helper(parents[currentNode][i]);
      }

      countDict = {};
      trueCountDict = {}
      permutations = getParentPermutations(parents[currentNode]);
      for (var i=0; i<permutations.length; i++){
        countDict[permutations[i]] = 0;
        trueCountDict[permutations[i]] = 0;
      }

      //loop through all data points
      for (var j=0; j<data.length; j++){

        //for each data point check if a particular permutation matches that data point
        var permutation = getPermutation(parents[currentNode], data[j]);
        countDict[permutation] += 1;
        var finalNodeIndex = features.indexOf(currentNode);
        if (data[j][finalNodeIndex] == "1"){
          trueCountDict[permutation] += 1;
        }

      }

      prob_dict = {}
      for (var prob in countDict){
        value = trueCountDict[prob]/countDict[prob];
        prob_dict[prob] = value
      }
      probabilities[currentNode] = prob_dict;
    }
  }

  console.log(probabilities);
  helper(finalNode);
}

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

      testData.length = 0;
      for (var i=1; i<info.length-1; i++){
        testData.push(info[i].split(','));
      }
    }
  }

  reader.readAsBinaryString(file);

  document.getElementById("TestLoaded").style.display = "block";
}

function displayTestSpeed() {
  var speed = document.getElementById("testSlider").value;
  document.getElementById("testSpeedDisplay").innerHTML = speed;
}

var pauseTesting = false;

function runTests(event) {
  if (testData.length == 0){
    alert("Please upload test data");
    return;
  }

  clearResults();

  if (testCounter >= testData.length){
    testCounter = 0;
    testCorrect = 0;
  }

  var finalVariable = "Plane Doesn't Land";
  var dataPoint = testData[testCounter];

  //TODO givens should be more than just the parents, givens should be every node
  var givens = parents[finalVariable];
  //set the values of the givens
  for (var i=0; i<givens.length; i++){
    console.log("parent", givens[i]);
    var givenIndex = features.indexOf(givens[i]);
    setValues[givens[i]] = (dataPoint[givenIndex] == "1");
    //var node = document.getElementById(givens[i]);
    //node.innerHTML += "<br />";
    //node.innerHTML += "<span style='color:red'>"+setValues[givens[i]]+"</span>";
  }

  console.log("set values", setValues);
  console.log(probabilities);

  //populates setValues dictionary
  function setValue(currentNode) {
    console.log("current node", currentNode);
    //base case, no parents, set value
    if (parents[currentNode].length == 0){
      console.log("no parents");
      if (!(currentNode in setValues)){
        console.log("node not in set values");
        var probability = probabilities[currentNode][true];
        console.log("probablity", probability);
        var randomNum = Math.random();
        if (randomNum <= probability){
          setValues[currentNode] = true;
        } else {
          setValues[currentNode] = false;
        }
        console.log("new set value", setValues[currentNode]);

        if (currentNode != finalVariable){
          var nodeInfo = document.getElementById(currentNode+"Info");
          nodeInfo.innerHTML = "Probability True: "+probability+"%<br /><span style'color:aqua'>"+setValues[currentNode]+"</span>";
          /*
          node.innerHTML += "<br />";
          node.innerHTML += "Probability True: "+probability+"%";
          node.innerHTML += "<br />";
          node.innerHTML += "<span style='color:aqua'>"+setValues[currentNode]+"</span>";
          */
        }
      } else {
        if (currentNode != finalVariable){
          var nodeInfo = document.getElementById(currentNode+"Info");
          nodeInfo.innerHTML = "<span style='color:aqua'>"+setValues[currentNode]+"</span>";
          /*
          node.innerHTML += "<br />";
          node.innerHTML += "<span style='color:aqua'>"+setValues[currentNode]+"</span>";
          */
        }
      }
    }

    //recursive step we've set all the parents
    else {
      var parentList = parents[currentNode];
      var parentKey = "";
      for (var i=0; i<parentList.length; i++){
        setValue(parentList[i]);
        if (setValues[parentList[i]] == true){
          parentKey += parentList[i];
        } else {
          parentKey += "not"+parentList[i];
        }
        if (i+1 != parentList.length){
          parentKey += "&";
        }
      }

      console.log("parent key", parentKey);

      var finalprobability = probabilities[currentNode][parentKey];
      var finalrandomNum = Math.random();
      if (finalrandomNum <= finalprobability){
          setValues[currentNode] = true;
      } else {
        setValues[currentNode] = false;
      }

      //if current node is not final variable we can write it on front end
      if (currentNode != finalVariable){
        var nodeInfo = document.getElementById(currentNode+"Info");
        nodeInfo.innerHTML = "Probability True: " + finalprobability*100 + "%<br /><span style='color:aqua'>Actual: "+setValues[currentNode]+"</span>";
        /*
        node.innerHTML += "<br />";
        node.innerHTML += "Probability True: " + finalprobability*100 + "%";
        node.innerHTML += "<br />";
        node.innerHTML += "<span style='color:aqua'>Actual: "+setValues[currentNode]+"</span>";
        */
      }
    }
  }

  setValue(finalVariable);
  
  var finalVarIndex = features.indexOf(finalVariable);
  var correct = dataPoint[finalVarIndex];
  if (setValues[finalVariable] == (correct == "1")){
    testCorrect += 1;
    document.getElementById(finalVariable+"Info").innerHTML += "<span style='color:lawnGreen'>Prediction: "+setValues[finalVariable]+"</span>";
    document.getElementById(finalVariable+"Info").innerHTML += "<br /><span style='color:lawnGreen'>Actual: "+(correct==1)+"</span>";
  } else {
    document.getElementById(finalVariable+"Info").innerHTML += "<span style='color:red'>Prediction: "+setValues[finalVariable]+"</span>";
    document.getElementById(finalVariable+"Info").innerHTML += "<br /><span style='color:red'>Actual: "+(correct==1)+"</span>";
  }
  //var corr = document.getElementById("CorrectVal");
  //corr.innerHTML="Correct Value"

  var progressBar = document.getElementById("progressBar");
  var newProgress = ((testCounter+1)/testData.length)*200;
  progressBar.style.width = newProgress+"px";
  progressBar.innerHTML = newProgress/2+"%";

  var acc = document.getElementById("TestAccuracy");
  acc.innerHTML = "TestAccuracy: "+testCorrect/(testCounter+1);


  testCounter += 1;
  if (testCounter >= testData.length){
    console.log("test accuracy", testCorrect/testData.length);
    alert("Finished running tests");
  }
}

function runAllTests(event) {
  if (testData.length == 0){
    alert("Please upload test data");
    return;
  }

  var speed = 2000 - document.getElementById("testSlider").value*20;

  pauseTesting = false;
  function totalloop() {
    setTimeout(function () {
      if (pauseTesting){
      } else if ((testCounter < testData.length) && !pauseTesting){
        runTests(event);
        totalloop();
      } else {
        testCounter = 0;
        testCorrect = 0;
      }
    }, speed)
  }

  totalloop();
  return;
}

function pauseTestingFunc(event) {
  console.log("activating pause");
  pauseTesting = true;
}

//used to know if we have finished assigning given true/false values to nodes
var finishedAssignments = false;
function getResults(event) {

  console.log("getting results");

  //get information about givens from propogation table
  var table = document.getElementById("propTable");
  if (!finishedAssignments){
    var numAssigned = 0;
    for (var i=0; i<nodes.length; i++){
      //get form value
      var propForm = document.getElementById("propForm"+nodes[i]);
      var propFormVal = propForm.value;
      setValues[nodes[i]] = propFormVal;

      //set the value of the node if it is true or false
      if (propFormVal != "Not Given"){
        numAssigned += 1;
        var firstNode = document.getElementById(nodes[i]);
        firstNode.innerHTML += "<br />"
        firstNode.innerHTML += "<span style='color:red'>"+propFormVal+"</span>";
      }
    }
    if (numAssigned == 0){
        alert("No set values to assign. Please click \"Get Results\" again.");
    }
    finishedAssignments = true;
    return;
  }

  var finalNode = document.getElementById("resultsForm").value;

  //get the highest unassigned node (to be assigned)
  var highestUnassigned = getHighestUnassignedValue(finalNode);
  console.log("Got highest unassigned node", highestUnassigned);

  //get the probability of the highest unassigned node being true
  var probability_dict = probabilities[highestUnassigned];
  var key = getProbabilitiesKey(highestUnassigned);
  console.log("dict", probability_dict);
  console.log("key", key);
  var probability = probability_dict[key];
  console.log("probability", probability);
  var randomNum = Math.random();
  console.log(randomNum, probability);

  //set the value of the highest unassigned node
  if (randomNum < probability){
    setValues[highestUnassigned] = "True";
  } else {
    setValues[highestUnassigned] = "False";
  }

  //write the value to the highest unassigned node
  var node = document.getElementById(highestUnassigned);
  node.innerHTML += "<br />";
  node.innerHTML += "Probability = "+probability*100+"%";
  node.innerHTML += "<br />";
  node.innerHTML += "<span style='color:red'>"+setValues[highestUnassigned]+"</span>";
  console.log("made it here");

}

function getHighestUnassignedValue(bottomNode) {
  var highestUnassigned = bottomNode;
  var keepLooping = true;
  while (keepLooping){
    keepLooping = false;

    //check if highest unassigned has parents, if so then we need to check if parents are assigned
    var pars = parents[highestUnassigned];
    if (pars.length == 0) {
      return highestUnassigned;
    } else {
      for (var j=0; j<pars.length; j++){
        var parent = pars[j];
        if (setValues[parent] == "Not Given"){
          keepLooping = true;
          highestUnassigned = parent;
        }
      }
    }
  }
  return highestUnassigned;
}

function getProbabilitiesKey(nodeName) {
  //get parent values to know which probability value to use
  var parentsOfUnassigned = parents[nodeName];

  //if node has no parents, then you just take probability of event occuring
  if (parentsOfUnassigned.length == 0){
    return true;
  } 

  else {
    var key = ""
    for (var i=0; i<parentsOfUnassigned.length; i++){
      var parentName = parentsOfUnassigned[i];
      var parentValue = setValues[parentName];
      if (parentValue == "True"){ //if the parent is set to true
        key += parentName;
      } else { //if the parent is set to false
        key += "not"+parentName;
      }

      if (i+1 != parentsOfUnassigned.length){
        key += "&";
      }
    }

    return key;
  }
}

function clearResults() {
  finishedAssignments = false;
  setValues = {};

  for (var i=0; i<nodes.length; i++){
    document.getElementById(nodes[i]+"Name").style.color = "white";
    document.getElementById(nodes[i]+"Info").innerHTML = "";
  }
}
