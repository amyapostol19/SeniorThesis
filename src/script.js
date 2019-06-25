
//////////////////////////////////////////////////////////////////////////////
/////////////Section 0: Declaring instance variables//////////////////////////
//////////////////////////////////////////////////////////////////////////////

var nodes = []
var waitingNode = null;

var parents = {}
var children = {}
var features = []
var data = []
var colors = {}
var colorOptions = ["Red", "#OrangeRed", "Teal", "Blue", "Aqua",
 "Fuchsia", "DeepPink", "BlueViolet", "Brown", "Chocolate",
 "Maroon", "Salmon"]

//for making connections
var connectMode = false;
var connectParent = null;

//testing
var testData = []
var testCounter = 0;
var testCorrect = 0;

//for propogating results
var setValues = {}
var probabilities = {}

//for animate mode
var animateMode = false;



////////////////////////////////////////////////////////////////////////////////
///////////////Section 1: Uploading training Data///////////////////////////////
////////////////////////////////////////////////////////////////////////////////


//read training data file that was uploaded and populate data structures in script.js
function readDataFile() {
  var files = document.getElementById('files').files;

  //make sure a file has been uploaded
  if (!files.length){
    alert('Please select a file');
    return;
  }

  var file = files[0];

  var reader = new FileReader();

  //populate data array, features array and make visible animate forms
  reader.onloadend = function(evt){
    if (evt.target.readyState == FileReader.DONE){
      var info = evt.target.result.split('\n');

      //populate list of features
      features = info[0].slice(0,-1).split(',');

      //populate colors dictionary. Used to animate nodes with specific color
      for (var j=0; j<features.length; j++){
        colors[features[j]] = generateRandomColor(); 
      }

      //populate data array
      data.length = 0;
      for (var i=1; i<info.length-1; i++){
        data.push(info[i].slice(0,-1).split(','));
      }
      
      document.getElementById('byte_range').textContent = "Data Successfully Loaded";

      //make visible all elements that are a part of the functions class
      var functions = document.getElementsByClassName("functions");
      for (var i=0; i<functions.length; i++){
        functions[i].style.display = "block";
      }

      //create initial node that will be dragged
      createNewNode(event, "120px", "725px", null);
    }
  };

  //get parts of the file to read and read those parts
  var information = file.slice(0, file.size);
  reader.readAsBinaryString(information);
}

/////////////////////Helper Functions for reading data file/////////////////////

//Used to match a color to a feature. Colors are used when animating nodes
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
var tempNodeID = 0;

//create a new node on the board doesnt give the node a name yet
//top = position of new node relative to the top of the webpage
//left = position of new node relative to left of the webpage
function createNewNode(event, top, left, name) {
  //make sure data has been uploaded and possible features exist.
  //Just a check, not sure if this case ever occurs
  if (features.length == 0){
    alert("Please upload data first");
    return;
  }

  //create new node and set attributes
  var newNode = document.createElement("div");
  newNode.className = "node";
  newNode.id = "node"+String(tempNodeID);
  tempNodeID += 1; //update tempNodeID counter

  //specify position of new node
  newNode.style.position = "absolute";
  newNode.style.top = top;
  newNode.style.left = left;
  newNode.style.zIndex = 1000;

  //make new node draggable and have functions for what to do when dragging
  newNode.draggable = "true";
  newNode.ondragstart = function drag(event) {
    if (connectMode){
      alert("Please exit connect mode to move nodes");
    } else {
      event.dataTransfer.setData("text", event.target.id);
    }
  }

  /*when drag ends, either
      - user has added a new node to the board:
          - give node name, info, children, parents, highlighted and delete button attributes 
          - create a new node in the dashboard to eventually be used
      - user moved a node alread on the board:
          - if node was attached to another, move the lines with the moved node
  */
  newNode.ondragend = function(event) {
    if (connectMode){
      return;
    }
    if (waitingNode == newNode.id){ //we just dragged and created a real node
      addNodeAttributes(newNode);
      createNewNode(event, top, left, null); //create a waiting node
    } else {
      moveLines(newNode.id);
    }
  }

  //rename node when double clicking, or if node is highlighted assign node a value
  newNode.ondblclick = function(event) {
    if (!nodes.includes(newNode.id)){//double click on node in dock
      return;
    }
    if (connectMode){
      alert("Cannot rename or set value in connect mode");
      return;
    }

    if (newNode.getAttribute("data-highlight") == "false"){
      //create input form for user to select node name (uses helper function: createDropdownForm)
      var inputForm = createDropdownForm(newNode.id+"Name", features);
      var nameSubmit = document.createElement("button");
      nameSubmit.innerHTML = "Submit";
      inputForm.appendChild(nameSubmit);

      nameSubmit.onclick = function(argument) {
        var nodeName = document.getElementById(newNode.id+"NameSelect").value;
        document.getElementById(newNode.id+"Name").removeChild(inputForm);

        addNodeName(newNode.id, nodeName);
      }

      document.getElementById(newNode.id+"Name").appendChild(inputForm);
      //newNode.appendChild(inputForm);
    } else { //if highlighted, double click to manually assign a value
      var valueForm = createDropdownForm(newNode.id+"Value", [" ", "True", "False"]);
      var nodeInfo = document.getElementById(newNode.id+"Info");
      var submit = document.createElement("button");
      submit.innerHTML = "Submit";
      valueForm.appendChild(submit);
      submit.onclick = function(argument) {
        nodeInfo.innerHTML = "<span style:'color:aqua'>"+document.getElementById(newNode.id+"ValueSelect").value+"</span>";
        setValues[newNode.id] = nodeInfo.innerHTML;
      }
      nodeInfo.appendChild(valueForm);
    } 
  }

  //click node to highlight and unhighlight
  // if in connect mode, selects parent and child
  newNode.onclick = function(event) {
    if (connectMode){
      if (connectParent == null){
        newNode.style.border = "5px solid yellow";
        connectParent = newNode.id;
        document.getElementById("dropzone").innerHTML = "Select a child";
      } else {
        document.getElementById(connectParent).style.border = "1px solid grey";
        
        if (connectParent != newNode.id){
          connectNodes(connectParent, newNode.id);
        }
        connectParent = null;
        document.getElementById("dropzone").innerHTML = "Select a new parent";
      }
    } else {
      if (event.ctrlKey){
        if (newNode.getAttribute("data-highlight") == "false"){
          newNode.setAttribute("data-highlight", "true");
          newNode.style.border = "5px double white";
        } else {
          newNode.setAttribute("data-highlight", "false");
          newNode.style.border = "1px solid grey";
        }
      }
    }
  }

  //append new node to document body
  document.body.appendChild(newNode);

  if (name != null){ //we're creating a new node for the board and assigning it a name
    //create delete button on node
    addNodeAttributes(newNode);
    addNodeName(newNode.id, name);
  } else {
    waitingNode = newNode.id;
  }
  
  return newNode.id;
}

/////////////////Helper functions for creating a new node///////////////////////


//give node name, info, children, parents, highlighted and delete button attributes
//add node to list of existing nodes
//nodes contain two div elements (attributes): name element and info element
function addNodeAttributes(newNode) {
  var nameElem = document.createElement("div");
  nameElem.innerHTML = newNode.id;
  nameElem.id = newNode.id+"Name";
  nameElem.style.zIndex = 200;
  newNode.appendChild(nameElem);

  //create nodeInfo div and add it to node
  var nodeInfo = document.createElement("div");
  nodeInfo.id = newNode.id+"Info";
  nodeInfo.style.zIndex = 200;
  newNode.appendChild(nodeInfo);

  //add node to parents dictionary and childrens dictionary
  children[newNode.id] = [];
  parents[newNode.id] = [];

  //make node able to be highlighed
  newNode.setAttribute("data-highlight", "false");

  //create delete button on node
  var deleteButton = document.createElement("button");
  deleteButton.innerHTML = "x"
  deleteButton.style.zIndex = 101;
  deleteButton.style.position = "absolute";
  deleteButton.style.left = "120px";
  deleteButton.style.top = "0px";
  deleteButton.id = "deleteButton";
  deleteButton.onclick = function clickDelete() {
    deleteNode(newNode.id);
  }
  newNode.appendChild(deleteButton);

  nodes.push(newNode.id);
}

/**
(1) Add name to the node
(2) Add option to animate that particular node
(3) Add option to connect that particular node
(4) Add option to get results for that paricular node
(5) Add option to delete that particular node


We already know features should include new node name
*/
function addNodeName(oldID, newID) {
  //get the old node
  var node = document.getElementById(oldID);

  //change the name and redefine the name div ID
  var nameDiv = document.getElementById(oldID+"Name");
  nameDiv.id = newID+"Name";
  nameDiv.innerHTML = newID;

  //specify new id of node
  node.id = newID;

  //change info id
  document.getElementById(oldID+"Info").id = newID+"Info";

  //change name of node in children and parents
  var oldChildren = children[oldID];
  delete children[oldID];
  children[newID] = oldChildren;
  //change the parent name for all its children
  for (var i=0; i<oldChildren.length; i++){
    var child = oldChildren[i];
    var parList = parents[child];
    var badIndex1 = parList.indexOf(oldID);
    parList.splice(badIndex1, 1);
    parList.push(newID);
    parents[child] = parList;

    //change the svg line for all children
    var parLine = document.getElementById(oldID+child+"line");
    parLine.id = newID+child+"line";
  }

  var oldParents = parents[oldID];
  delete parents[oldID];
  parents[newID] = oldParents;
  //change the child name for all nodes parents
  for (var j=0; j<oldParents.length; j++){
    var parent = oldParents[j];
    var childList = children[parent];
    var badIndex2 = childList.indexOf(oldID);
    childList.splice(badIndex2, 1);
    childList.push(newID);
    children[parent] = childList;

    var childLine = document.getElementById(parent+oldID+"line");
    childLine.id = parent+newID+"line";
  }

  //remove old node id from list of nodes and add new node id
  var oldIndex = nodes.indexOf(oldID);
  nodes.splice(oldIndex, 1);
  nodes.push(newID);

  if (features.includes(newID)){
    //compute probabilities for this node assuming no current parents or children
    if (oldID in probabilities){
      delete probabilities[oldID];
    }
    computeProbabilities(newID);
    for (var j=0; j<children[newID].length; j++){
      var jchild = children[newID][j];
      computeProbabilities(children[newID][j]);
    }

  //replace names on get results form if oldID was previously in features
  //or append new name to get results form

    //add node name to final node option form
    var finalNodeOption;
    if (features.includes(oldID)){
      finalNodeOption = document.getElementById("finalNodeOption"+oldID);
      document.getElementById("finalNodeForm").removeChild(finalNodeOption);
    } else {
      finalNodeOption = document.createElement("option");
    }
    finalNodeOption.setAttribute("value", newID);
    finalNodeOption.setAttribute("id", "finalNodeOption"+newID);
    finalNodeOption.innerHTML = newID;
    document.getElementById("finalNodeForm").appendChild(finalNodeOption);
  }
  
}

/**
(1) disconnect node from all children
(2) disconnect node from all parents
(3) delete node from parent and children dicts
(4) remove node from nodes list
(5) remove node from body
(6) remove node from final node options
(7) remove node from probabilities dict
*/
function deleteNode(nodeID) {

  //remove all connections
  //disconnect node from all children
  var childListCopy = children[nodeID].slice(0);
  for (var i=0; i<childListCopy.length; i++){
    var child = childListCopy[i];
    disconnectNodes(nodeID, child);
  }
  //disconnect node from all parents
  var parentListCopy = parents[nodeID].slice(0);
  for (var j=0; j<parentListCopy.length; j++){
    var parent = parentListCopy[j];
    disconnectNodes(parent, nodeID);
  }

  delete parents[nodeID];
  delete children[nodeID];

  //remove from nodes list
  var nodeIndex = nodes.indexOf(nodeID);
  nodes.splice(nodeIndex, 1);

  //remove from body
  var nodeElem = document.getElementById(nodeID);
  document.body.removeChild(nodeElem);

  if (features.includes(nodeID)){

    //remove name from final node option
    var finalNodeOption = document.getElementById("finalNodeOption"+nodeID);
    document.getElementById("finalNodeForm").removeChild(finalNodeOption);

    //remove from probabilities
    delete probabilities[nodeID];
  }
}

function drop(event) {
  if (!connectMode){
    event.preventDefault();
    var nodeID = event.dataTransfer.getData("text");
    var node = document.getElementById(nodeID);

    //TODO fix shifting
    document.body.appendChild(node);
    node.style.left = event.clientX - 65 + 'px';
    node.style.top = event.clientY - 25 + 'px';
  }
}

function moveLines(nodeID) {
  for (var i=0; i<children[nodeID].length; i++){
    var child = children[nodeID][i]
    document.body.removeChild(document.getElementById(nodeID+child+"line"));
    drawSVGLine(nodeID, child);
  }

  for (var j=0; j<parents[nodeID].length; j++){
    var parent = parents[nodeID][j];
    document.body.removeChild(document.getElementById(parent+nodeID+"line"));
    drawSVGLine(parent, nodeID);
  }
}

////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//////////////Section 3: Animating and Connecting Nodes/////////////////////////
////////////////////////////////////////////////////////////////////////////////

//for stopping the animation
var stopAnimating = false;
var animateCounter = 0;

var changedSpeed = false;

function animateNodes() {
  animateMode = true;
  stopAnimating = false;;
  //checks to make sure data has been uploaded and nodes exist
  if (data.length == 0){
    alert("Please upload data");
    return;
  } else if (nodes.length == 0){
    alert("Please create a node");
    return;
  }

  //get speed at which to animate nodes
  var slider = document.getElementById("animateSlider");
  var speed = 1000 - (slider.value*10);
  
  //have counter to keep track of data point we're displaying on node animation (RSVP)
  //also used to keep track of how many times we've looped

  function loop(speed) {
    setTimeout(function () {

      var new_speed = 1000-(10*document.getElementById("animateSlider").value);

      //make sure the counter is valid
      if (animateCounter/2 >= data.length){
        animateCounter = 0;
      }

      //get nodes to animate
      var nodesToAnimate = [];
      for (var i=0; i<nodes.length; i++){
        var node = document.getElementById(nodes[i]);
        if (node.getAttribute("data-highlight") == "true"){
          if (!features.includes(nodes[i])){
            alert("Please only select nodes with proper feature names");
            return;
          } else {
            nodesToAnimate.push(nodes[i]);
          }
        }
      }

      //determine if all nodes are lit for this particular data point
      var allLit = true;
      for (var i=0; i<nodesToAnimate.length; i++){
        var animatedNode = nodesToAnimate[i];
        if (animateCounter%2 == 1){
          continue;
        } else {
          if (data[animateCounter/2][features.indexOf(animatedNode)] != "1"){
            allLit = false;
          }
        }
      }

      //determine which nodes to animate and animate them (change the text color)
      for (var j=0; j<nodesToAnimate.length; j++){
        var nodeToAnimate = nodesToAnimate[j];
        var elem = document.getElementById(nodeToAnimate+"Name")
        var dataIndex = features.indexOf(nodeToAnimate);

        //only change the color of the node every other loop so that we can get the blinking effect
        if (animateCounter%2 == 1){
          elem.style.color = "white";
        } 

        //change color of node if data value is true (==1)
        else {
          if (data[animateCounter/2][dataIndex] == "1"){
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
      animateCounter++;

      //used to keep track of how far along we are in the animation process
      if (animateCounter%2 == 0){
        //document.getElementById('completionRate').innerHTML = "Animation is " + counter/2 + " % finished.";
        document.getElementById('animProgressBar').style.width = (130*animateCounter)/(2*data.length)+"px"; 
        document.getElementById('animProgressBar').innerHTML = Math.round((100*animateCounter)/(2*data.length))+"%";
      }

      //check to see if we should stop the animation process
      if (nodesToAnimate.length == 0){
        alert("Please select or create a node to animate. Then restart animation");
        animateMode = false;
      } else if (!stopAnimating && animateCounter/2 < data.length){
          loop(new_speed);
      } 
      //if stopping the animation process, convert all nodes back to their original white color
      else {
        animateMode = false;
        for (var j=0; j<nodesToAnimate.length; j++){
          var nodeElem = document.getElementById(nodesToAnimate[j]);
          nodeElem.style.color = "white";
        }
      }
    }, speed)
  }

  loop(speed);
}

//Once the user has selected a speed at which to animate nodes, display this speed
function displayAnimationSpeed() {
  var speed = document.getElementById("animateSlider").value;
  document.getElementById("animSpeedDisplay").innerHTML = "Animate Speed: "+ speed;
}

//Stop the animation process from happening by changing the stopAnimating boolean
function stopAnimation() {
  animateMode = false;
  stopAnimating = true;
}

function switchConnectMode() {
  if (connectMode){
    document.getElementById("dropzone").innerHTML = "";
    for (var i=0; i<nodes.length; i++){
      document.getElementById(nodes[i]).draggable = "true";
    }
    connectMode = false;
    if (connectParent != null){
      document.getElementById(connectParent).style.border = "1px solid grey";
      connectParent = null;
    }
    document.getElementById("ConnectModeButton").style.background = "white";
  } else {
    if (nodes.length < 2){
      alert("Must have at least two nodes to enter connect mode");
      return;
    }

    if (animateMode){
      alert("Cannot enter connect mode while still animating. Please stop animation.");
      return;
    }

    for (var i=0; i<nodes.length; i++){
      var highlighted = document.getElementById(nodes[i]).getAttribute("data-highlight");
      if (highlighted == "true"){
        alert("Please unhighlight all nodes.");
        return;
      }
    }

    document.getElementById("dropzone").innerHTML = "Select a Parent";

    for (var i=0; i<nodes.length; i++){
      document.getElementById(nodes[i]).draggable = "false";
    }
    connectMode = true;
    document.getElementById("ConnectModeButton").style.background = "grey";
  }
}


function connectNodes(parent, child) {
  var lineExists = document.getElementById(parent+child+"line");
  if (lineExists != null){
    return;
  }

  //add parent to the parents list of child
  parents[child].push(parent);
  
  //add child to the childrens list of parent
  children[parent].push(child);

  drawSVGLine(parent, child);

  if (features.includes(child)){
    computeProbabilities(child);
  }
}

function drawSVGLine(parent, child) {

  //connect nodes on front-end
  var node1 = document.getElementById(parent);
  var node2 = document.getElementById(child);

  var x1 = node1.offsetLeft, y1 = node1.offsetTop;
  var x2 = node2.offsetLeft, y2 = node2.offsetTop;

  var width = Math.abs(x1-x2);
  var height = Math.abs(50-Math.abs(y1-y2));

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", parent+child+"line");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.position = "absolute";

  if (y2 < y1 && y1 < y2+50){
    svg.style.top = y1;
  } else if (y1 < y2 && y2 < y1+50){
    svg.style.top = y2;
  } else {
    svg.style.top = Math.min(y1, y2)+50;
  }
  svg.style.left = Math.min(x1, x2)+65;
  svg.style.stroke = "white";
  svg.style.zIndex = 1;

  var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  var arrow1 = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
  var arrow2 = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
  if (x1 > x2){
    line.setAttribute("x1", width);
    line.setAttribute("x2", 0);

    arrow1.setAttribute("x1", 0);
    arrow2.setAttribute("x1", 0);

    arrow1.setAttribute("x2", 10);
    arrow2.setAttribute("x2", 10);
  } else {
    line.setAttribute("x1", 0);
    line.setAttribute("x2", width);

    arrow1.setAttribute("x1", width);
    arrow2.setAttribute("x1", width);

    arrow1.setAttribute("x2", width-10);
    arrow2.setAttribute("x2", width-10);
  }

  if (y2-y1 < 0){ //child is above parent
    if (Math.abs(y2-y1) < 50){
      line.setAttribute("y1", 0)
      line.setAttribute("y2", height);

      arrow1.setAttribute("y1", height);
      arrow2.setAttribute("y1", height);

      arrow1.setAttribute("y2", height-10);
      arrow2.setAttribute("y2", height-10);
    } else {
      line.setAttribute("y1", height);
      line.setAttribute("y2", 0);

      arrow1.setAttribute("y1", 0);
      arrow2.setAttribute("y1", 0);

      arrow1.setAttribute("y2", 10);
      arrow2.setAttribute("y2", 10);
    }
  } else {
    if (Math.abs(y2-y1)<50){
      line.setAttribute("y1", height);
      line.setAttribute("y2", 0);

      arrow1.setAttribute("y1", 0);
      arrow2.setAttribute("y1", 0);

      arrow1.setAttribute("y2", 10);
      arrow2.setAttribute("y2", 10);
    } else {
      line.setAttribute("y1", 0);
      line.setAttribute("y2", height);

      arrow1.setAttribute("y1", height);
      arrow2.setAttribute("y1", height);

      arrow1.setAttribute("y2", height-10);
      arrow2.setAttribute("y2", height-10);
    }
  }

  line.setAttribute("style", "strokeWidth: 4");
  line.style.zIndex = 1;

  arrow1.setAttribute("style", "strokeWidth: 4");
  arrow1.style.zIndex = 1;

  arrow2.setAttribute("style", "strokeWidth: 4");
  arrow2.style.zIndex = 1;


  svg.appendChild(line);
  svg.appendChild(arrow1);
  svg.appendChild(arrow2);
  document.body.appendChild(svg);
}

function disconnectNodesButton(event) {
  var highlighted = [];
  for (var i=0; i<nodes.length; i++){
    var node = document.getElementById(nodes[i]);
    if (node.getAttribute("data-highlight") == "true"){
      highlighted.push(nodes[i]);
    }
  }

  if (highlighted.length > 2){
    alert("Please only select two nodes to disconnect");
    return;
  } else if (highlighted.length < 2){
    alert("Please select at least two nodes to disconnect");
    return;
  }

  var firstNode = highlighted[0];
  var secondNode = highlighted[1];

  var parent;
  var child;
  if (parents[firstNode].includes(secondNode) && children[secondNode].includes(firstNode)){
    parent = secondNode;
    child = firstNode;
    disconnectNodes(parent, child);
  } else if (parents[secondNode].includes(firstNode) && children[firstNode].includes(secondNode)){
    parent = firstNode;
    child = secondNode;
    disconnectNodes(parent, child);
  } else {
    alert("Nodes do not have a parent/child relationship. Please select different nodes.");
  }

}

function disconnectNodes(parent, child) {
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
function splitNodeButton(event) {
  if (connectMode){
    alert("Please exit connect mode");
    return;
  }

  var prevNodeList = nodes.slice(0);
  for (var i=0; i<prevNodeList.length; i++){
    var node = document.getElementById(prevNodeList[i])
    if (node.getAttribute("data-highlight") == "true"){
      splitNode(prevNodeList[i]);
    }
  }
}

function splitNode(nodeID) {
  if (connectMode){
    alert("Please exit connect mode");
    return;
  }

  //get which node to split and which columns for new nodes
  var oldNode = document.getElementById(nodeID);
  newNodeName1 = nodeID+"1";
  newNodeName2 = nodeID+"2";

  //create two new nodes with name from data column
  var leftVal1 = parseInt(oldNode.style.left.slice(0,3)) - 100;
  createNewNode(event, oldNode.style.top, leftVal1+"px", newNodeName1);

  //create second node with name from dataColumn
  var leftVal2 = parseInt(oldNode.style.left.slice(0,3)) + 100;
  createNewNode(event, oldNode.style.top, leftVal2+"px", newNodeName2);

  //add children to each new node
  for (var i=0; i<children[nodeID].length; i++){
    var child = children[nodeID][i];
    connectNodes(newNodeName1, child);
    connectNodes(newNodeName2, child);
  }

  //add parents to each new node
  for (var j=0; j<parents[nodeID].length; j++){
    var parent = parents[nodeID][j];
    connectNodes(parent, newNodeName1);
    connectNodes(parent, newNodeName2);
  }

  //delete node to split
  deleteNode(nodeID);
}

function mergeNodeButton(event) {
  if (connectMode){
    alert("Please exit connect mode");
    return;
  }

  var highlighted = [];
  for (var i=0; i<nodes.length; i++){
    var node = document.getElementById(nodes[i]);
    if (node.getAttribute("data-highlight") == "true"){
      highlighted.push(nodes[i]);
    }
  }

  if (highlighted.length > 2){
    alert("Please only select two nodes to merge");
    return;
  } else if (highlighted.length < 2) {
    alert("Please select at least two nodes to merge");
    return;
  } else {
    mergeNodes(highlighted[0], highlighted[1]);
  }
}

function mergeNodes(firstNode, secondNode) {
  if (connectMode){
    alert("Please exit connect mode");
    return;
  }

  var newNodeName = firstNode+"&"+secondNode;

  var oldNode1 = document.getElementById(firstNode);
  var oldNode2 = document.getElementById(secondNode);

  var top = (parseInt(oldNode1.style.top.slice(0,3))+parseInt(oldNode2.style.top.slice(0,3)))/2 + "px";
  var left = (parseInt(oldNode1.style.left.slice(0,3))+parseInt(oldNode2.style.left.slice(0,3)))/2 + "px";
  createNewNode(event, top, left, newNodeName);

  for (var i=0; i<parents[firstNode].length; i++){
    var parent1 = parents[firstNode][i];
    connectNodes(parent1, newNodeName);
  }
  for (var j=0; j<parents[secondNode].length; j++){
    var parent2 = parents[secondNode][j];
    connectNodes(parent2, newNodeName);
  }
  for (var k=0; k<children[firstNode].length; k++){
    var child1 = children[firstNode][k];
    connectNodes(newNodeName, child1);
  }
  for (var l=0; l<children[secondNode].length; l++){
    var child2 = children[secondNode][l];
    connectNodes(newNodeName, child2);
  }

  deleteNode(firstNode);
  deleteNode(secondNode);
}


////////////////////////////////////////////////////////////////////////////////
/////////Section 5: Running training and reading test file//////////////////////
////////////////////////////////////////////////////////////////////////////////

function computeProbabilities(childNode) {
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
    var validParents = [];
    for (var i=0; i<parents[currentNode].length; i++){
      if (features.includes(parents[currentNode][i])){
        validParents.push(parents[currentNode][i]);
      }
    }

    if (validParents.length == 0){
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
      for (var i=0; i<validParents.length; i++){
        helper(validParents[i]);
      }

      countDict = {};
      trueCountDict = {}
      permutations = getParentPermutations(validParents);
      for (var i=0; i<permutations.length; i++){
        countDict[permutations[i]] = 0;
        trueCountDict[permutations[i]] = 0;
      }

      //loop through all data points
      for (var j=0; j<data.length; j++){

        //for each data point check if a particular permutation matches that data point
        var permutation = getPermutation(validParents, data[j]);
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
        testData.push(info[i].slice(0,-1).split(','));
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
    return false;
  }

  for (var i=0; i<nodes.length; i++){
    if (!features.includes(nodes[i])){
      alert("Not all nodes are named correctly. Please rename nodes to feature names");
      return false;
    }
  }

  clearResults();

  if (testCounter >= testData.length){
    testCounter = 0;
    testCorrect = 0;
  }

  var finalVariable = document.getElementById("finalNodeForm").value;
  var dataPoint = testData[testCounter];

  //TODO givens should be more than just the parents, givens should be every node
  var givens = parents[finalVariable];
  //set the values of the givens
  for (var i=0; i<givens.length; i++){
    var givenIndex = features.indexOf(givens[i]);
    setValues[givens[i]] = (dataPoint[givenIndex] == "1");
  }

  //populates setValues dictionary
  function setValue(currentNode) {
    //base case, no parents, set value
    if (parents[currentNode].length == 0){
      if (!(currentNode in setValues)){
        var probability = probabilities[currentNode][true];
        var randomNum = Math.random();
        if (randomNum <= probability){
          setValues[currentNode] = true;
        } else {
          setValues[currentNode] = false;
        }

        if (currentNode != finalVariable){
          var nodeInfo = document.getElementById(currentNode+"Info");
          nodeInfo.innerHTML = "Probability True: "+probability+"%<br /><span style'color:aqua'>"+setValues[currentNode]+"</span>";
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
  
  return true;
}

function runAllTests(event) {
  if (testData.length == 0){
    alert("Please upload test data");
    return;
  }

  var speed = 1500 - document.getElementById("testSlider").value*15;

  pauseTesting = false;
  function totalloop(speed) {
    setTimeout(function () {
      if (pauseTesting){
      } else if ((testCounter < testData.length) && !pauseTesting){
        var keepRunning = runTests(event);
        var new_speed = 1500-document.getElementById("testSlider").value*15;
        if (keepRunning){
          totalloop(new_speed);
        }
      } else {
        testCounter = 0;
        testCorrect = 0;
      }
    }, speed)
  }

  totalloop(speed);
  return;
}

function pauseTestingFunc(event) {
  pauseTesting = true;
}

function getResults(event) {

  var finalNode = document.getElementById("finalNodeForm").value;

  //get the highest unassigned node (to be assigned)
  var highestUnassigned = getHighestUnassignedValue(finalNode);

  //get the probability of the highest unassigned node being true
  var probability_dict = probabilities[highestUnassigned];
  var key = getProbabilitiesKey(highestUnassigned);
  var probability = probability_dict[key];
  var randomNum = Math.random();

  //set the value of the highest unassigned node
  if (randomNum < probability){
    setValues[highestUnassigned] = "True";
  } else {
    setValues[highestUnassigned] = "False";
  }

  //write the value to the highest unassigned node
  var nodeInfo = document.getElementById(highestUnassigned+"Info");
  nodeInfo.innerHTML += "Probability = "+Math.round(probability*100)+"%";
  nodeInfo.innerHTML += "<br />";
  nodeInfo.innerHTML += "<span style='color:aqua'>"+setValues[highestUnassigned]+"</span>";
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
        if (setValues[parent] == " " || !(parent in setValues)){
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

//TODO should set all node values to be blank
function clearResults() {
  finishedAssignments = false;
  setValues = {};

  for (var i=0; i<nodes.length; i++){
    document.getElementById(nodes[i]+"Name").style.color = "white";
    document.getElementById(nodes[i]+"Info").innerHTML = "";
  }
}

////////////////////////////////////////////////////////////////////////////
/////////////////Section 6: Universal Helper Functions//////////////////////
////////////////////////////////////////////////////////////////////////////

function createDropdownForm(formID, options) {
  var form = document.createElement("form");
  form.id = formID+"Form";
  var select = document.createElement("select");
  select.id = formID+"Select";
  for (var i=0; i<options.length; i++){
    var option = document.createElement("option");
    option.innerHTML = options[i];
    select.appendChild(option);
  }
  form.appendChild(select);
  return form;
}
