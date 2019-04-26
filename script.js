
//////////////////////////////////////////////////////////////////////////////
/////////////Section 0: Declaring instance variables//////////////////////////
//////////////////////////////////////////////////////////////////////////////

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

//for propogating results
var finishedAssignments = false;
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
      for (var i=1; i<info.length; i++){
        data.push(info[i].split(','));
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

  //allows node to be dragged an dropped to different areas of the webapp
  newNode.onmousedown = function click() {
    dragAndDrop(newNode);
  };

  //append new node to documeent body, add node ID to array of nodes
  document.body.appendChild(newNode);
  nextNodeName.push(newNode.id);
  nodes.push(newNode.id);

  //create the form that will allow you to name a node
  createNewForm(newNode.id);
}

/////////////////Helper functions for creating a new node///////////////////////

//Found example on the internet. TODO site author
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

    // centers the node at (pageX, pageY) coordinates
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

    // (3) move the node on mousemove
    document.addEventListener('mousemove', onMouseMove);

    // (4) drop the node, remove unneeded handlers
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

/**create form that will be used to name the node
 **nodeID: Id of the node that we will be renaming
*/
function createNewForm(nodeID) {
  //create form and add style
  var form = document.createElement("form");
  form.setAttribute('id',nodeID+"Form");
  form.style.position = "absolute";
  form.style.top = "730px";

  //create inputs, form is given an ID with the existing node's name, that way the form is attached to the node
  var select = document.createElement("select");
  select.setAttribute('name',nodeID+"Select");
  select.setAttribute('id',nodeID+"Select");

  //create options to name the node (which are all of the existing features that don't have a node already assigned)
  for (var i=0; i<features.length; i++){
    if (!nodes.includes(features[i])){
      var option = document.createElement("option");
      option.setAttribute('value',features[i]);
      option.innerHTML=features[i];

      select.appendChild(option);
    }
  }

  //create submit button
  var input = document.createElement("input");
  input.setAttribute('type','button');
  input.setAttribute('value','Submit');
  input.onclick = function() {
    //when the submit button is clicked, add that particular value (node name) to the node
    addNodeName(nodeID);
  }

  //append options and submit button to form
  form.appendChild(select);
  form.appendChild(input);

  //append form to the body of the document
  document.body.appendChild(form);
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

  var node = document.getElementById(nodeID);
  node.innerHTML = nodeName;
  node.id = nodeName;

  var oldIndex = nodes.indexOf(nodeID);
  nodes.splice(oldIndex, 1);
  nodes.push(nodeName);
  parents[nodeName] = [];

  var form = document.getElementById(nodeID+"Form");
  document.body.removeChild(form);

  //append new name to delete node form
  var delOption = document.createElement("option");
  delOption.setAttribute('value', nodeName);
  delOption.setAttribute("id", "delOption"+nodeName);
  delOption.innerHTML = nodeName;
  document.getElementById("deleteValue").appendChild(delOption);

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
}

function deleteNode(event) {
  //get node ID
  var nodeID = document.getElementById("deleteValue").value;

  if (!nodes.includes(nodeID)){
    alert("Please select a node to delete");
    return;
  }

  //remove from Nodex
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

  //remove connections
  console.log(parents);
  delete parents[nodeID];

  for (var child in parents){
    var parList = parents[child];
    if (parList.includes(nodeID)){
      var index = parList.indexOf(nodeID);
      parList.splice(index, 1);
      parents[child] = parList;
    }
  }
  
  //remove from delete options
  var delOption = document.getElementById("delOption"+nodeID);
  document.getElementById("deleteValue").removeChild(delOption);
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

      //determine which nodes to animate and animate them (change the text color)
      for (var j=0; j<nodesToAnimate.length; j++){
        var nodeToAnimate = nodesToAnimate[j];
        var elem = document.getElementById(nodeToAnimate)
        var dataIndex = features.indexOf(nodeToAnimate);

        if (!nodesToAnimate.includes(nodes[j])){
          console.log("THIS WEIRD CASE THAT I WAS THINKING OF DELETING");
          continue;
        }

        //only change the color of the node every other loop so that we can get the blinking effect
        if (counter%2 == 1){
          elem.style.color = "white";
        } 

        //change color of node if data value is true (==1)
        else {
          if (data[counter/2][dataIndex] == "1"){
            elem.style.color = colors[nodeToAnimate];
          } else {
            elem.style.color = "white";
          }
        }

      }
      counter++;

      //used to keep track of how far along we are in the animation process
      if (counter%2 == 0){
        document.getElementById('completionRate').innerHTML = "Animation is " + counter/2 + " % finished."; 
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
  var secondNode = document.getElementById("connectSelect2").value;

  if (parent == secondNode){
    alert("Please select two different nodes.");
    return;
  }

  //add parent to the parents list of child
  if (secondNode in parents){
    parents[secondNode].push(parent);
  } else {
    parents[secondNode] = [parent];
  }

  //connect nodes on front-end
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

////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
/////////Section 4: Running training and reading test file//////////////////////

function computeProbabilities() {
  finalNode = "Plane Doesn't Land";

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
        for (var i=0; i<permutations.length; i++){
          parentNodes = permutations[i].split("&");
          var valid = true;

          //separate parent node names in permutations and check if they're true or false;
          for (var k=0; k<parentNodes.length; k++){
            //if one of the parent nodes contains a not
            if (parentNodes[k].includes("not")){
              nodeName = parentNodes[k].slice(3,parentNodes[k].length);
              nodeIndex = features.indexOf(nodeName);

              if (data[j][nodeIndex] != "0"){
                valid = false;
                break;
              }
            } else {
              nodeIndex = features.indexOf(parentNodes[k]);
              if (data[j][nodeIndex] != "1"){
                valid = false;
                break;
              }
            }
          }

          if (valid){
            countDict[permutations[i]] += 1;
            var finalNodeIndex = features.indexOf(currentNode);
            if (data[j][finalNodeIndex] == "1"){
              trueCountDict[permutations[i]] += 1;
            }
          }
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
  document.getElementById("certified").innerHTML = "Finished Training";
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
  clearResults();

  if (testCounter >= testData.length){
    testCounter = 0;
    testCorrect = 0;
  }

  var finalVariable = "Plane Doesn't Land";
  var dataPoint = testData[testCounter];

  var givens = parents[finalVariable];

  for (var i=0; i<givens.length; i++){
    console.log("parent", givens[i]);
    var givenIndex = features.indexOf(givens[i]);
    setValues[givens[i]] = (dataPoint[givenIndex] == "1");
    var node = document.getElementById(givens[i]);
    node.innerHTML += "<br />";
    node.innerHTML += "<span style='color:red'>"+setValues[givens[i]]+"</span>";
  }

  console.log("set values", setValues);
  console.log(probabilities);

  //populates setValues dictionary
  function helper(currentNode) {
    console.log(currentNode);
    //base case, no parents, set value
    if (parents[currentNode].length == 0){
      console.log("no parents");
      if (!currentNode in setValues){
        var probability = probabilities[currentNode][true];
        var randomNum = Math.random();
        if (randomNum <= probability){
          setValues[currentNode] = true;
        } else {
          setValues[currentNode] = false;
        }

        var node = document.getElementById(currentNode);
        node.innerHTML += "<br />";
        node.innerHTML += "<span style='color:red'>"+setValues[currentNode]+"</span>";
      } else {
        var node = document.getElementById(currentNode);
        node.innerHTML += "<br />";
        node.innerHTML += "<span style='color:red'>"+setValues[currentNode]+"</span>";
      }
    }

    //recursive step we've set all the parents
    else {
      var parentList = parents[currentNode];
      var parentKey = "";
      for (var i=0; i<parentList.length; i++){
        helper(parentList[i]);
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

      var node = document.getElementById(currentNode);
      node.innerHTML += "<br />";
      node.innerHTML += "Probability True: " + finalprobability*100 + "%";
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
  document.getElementById(finalVariable).innerHTML += "<br /><span>Expected: "+(correct==1)+"</span>";
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
  var speed = 10000 - document.getElementById("testSlider").value*100;

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

  var probability = probabilities[currentNode];
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

function clearResults() {
  finishedAssignments = false;
  setValues = {};

  for (var i=0; i<nodes.length; i++){
    var elem = document.getElementById(nodes[i]);
    elem.innerHTML = nodes[i];
  }
}
