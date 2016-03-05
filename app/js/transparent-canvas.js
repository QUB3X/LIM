var thisFile;

document.addEventListener( "DOMContentLoaded", function() {

  const ipc = require('electron').ipcRenderer;

  ipc.send("send-command","toolbar","doStuff", {}); //send command "doStuff" to toolbar.

// function to setup a new canvas for drawing
// Thanks to http://perfectionkills.com/exploring-canvas-drawing-techniques/
// for the nice explanation :)

  //define and resize canvas

  var footer = document.getElementById("footer");
  var canvasWidth = window.innerWidth;
  var canvasHeight = window.innerHeight;

  thisFile = {
    settings: {
      name: "unnamed",
      date: new Date().getTime(),
      canvas: {
        x: canvasWidth,
        y: canvasHeight,
        backgroundImage: "none"
      }
    },
    pages: [
      {lines: [ ],
        backstack: [ ]}
    ]
    // pages: [{
    //   lines: [
    //     {points: [{x:0,y:0}],
    //      color: "#fff", width: 4, rubber: true}],
    //    backstack: [
    //      {points: [{x:0,y:0}],
    //      color: "#fff", width: 4, rubber: true}]
    // }]
  };

  var content = document.getElementById("content");
  var title = document.getElementById("title");

  content.style.height = String(window.innerHeight) + "px";

  var canvasToAdd = '<canvas id="canvas" width="'+canvasWidth+'" height="'+(canvasHeight)+'"></canvas><div id="grid"></div>';
  document.getElementById("content").innerHTML = canvasToAdd;

  var canvas = document.getElementById("canvas");

  canvas.style.backgroundImage = thisFile.settings.canvas.backgroundImage;

  var DrawPaddingX = canvas.offsetLeft;
  var DrawPaddingY = canvas.offsetTop;

  var ctx = canvas.getContext('2d');

  window.onresize = function() {
    resizeCanvas(true);
  }

  function resizeCanvas(callLoad) {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    var oldCanvasWidth = thisFile.settings.canvas.x;
    var oldCanvasHeight = thisFile.settings.canvas.y;
    var widthRatio = canvasWidth/oldCanvasWidth;
    var heightRatio = canvasHeight/oldCanvasHeight;
    if(canvasWidth==oldCanvasWidth && canvasHeight == oldCanvasHeight) {
      return;
    }

    content.style.height = String(window.innerHeight) + "px";

    canvasToAdd = '<canvas id="canvas" width="'+canvasWidth+'" height="'+(canvasHeight)+'"></canvas><div id="grid"></div>';
    document.getElementById("content").innerHTML = canvasToAdd;
    canvas = document.getElementById("canvas");
    DrawPaddingX = canvas.offsetLeft;
    DrawPaddingY = canvas.offsetTop;
    ctx = canvas.getContext('2d');
    ctx.shadowBlur = 0.5;
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = lineColor;
    ctx.shadowColor = lineColor;
    ctx.lineWidth = lineWidth;
    //Re-bind click events, since we've updated canvas object
    canvas.onmousedown = function(e) {
      startDrawing(e, false);
    };
    canvas.onmousemove = function(e) {
      moveDrawing(e, false);
    };
    canvas.onmouseup = function(e) {
      endDrawing(e, false);
    };
    // TOUCH SUPPORT
    canvas.addEventListener("touchstart", function(e) {
      startDrawing(e, true);
    });

    canvas.addEventListener("touchmove", function(e) {
      moveDrawing(e, true);
    });

    canvas.addEventListener("touchend", function(e) {
      endDrawing();
    });

    //Adapt points
    for(var i=0; i<thisFile.pages.length; i++){
      var _lines = thisFile.pages[i].lines;
      var _backstack = thisFile.pages[i].backstack;
      //lines
      for(var j=0; j<_lines.length; j++){
        var _points = _lines[j].points;
        for(var k=0; k<_points.length; k++){
          var _point = _points[k];
          var newPointX = _point.x * widthRatio;
          var newPointY = _point.y * heightRatio;
          thisFile.pages[i].lines[j].points[k]={x:newPointX,y:newPointY};
        }
      }
      //backstack
      for(var l=0; l<_backstack.length; l++){
        var _points1 = _backstack[l].points;
        for(var m=0; m<_points1.length; m++){
          var _point1 = _points1[m];
          var newPointX = _point1.x * widthRatio;
          var newPointY = _point1.y * heightRatio;
          thisFile.pages[i].backstack[l].points[m]={x:newPointX,y:newPointY};
        }
      }
    }
    thisFile.settings.canvas.x=canvasWidth;
    thisFile.settings.canvas.y=canvasHeight;
    if(callLoad==true){
      loadIntoCanvas(thisFile,currentPage);
    }
  }

  function midPointBtw(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  }

  // Fixed Line Properties
  ctx.shadowBlur = 0.5;
  ctx.imageSmoothingEnabled = true;

  //default values - just first setup
  var lineColor = "black";
  var lineWidth = 4;
  var rubberWidth = 30;

  ctx.strokeStyle = lineColor;
  ctx.shadowColor = lineColor;
  ctx.lineWidth = lineWidth;
  //ctx.translate(0.5,0.5);

  var toolSelected = "pencil"; // can be "pencil", "rubber"
  var rulerActive = false;

  var isDrawing, pages = [ ];
  var hasMoved = false;

  // The current page in the pages[]
  var currentPage = 0;


  function startDrawing(e, touch) {
    console.log("Started drawing!");
    if (toolSelected === "ruler") return;
    isDrawing = true;
    hasMoved = false; //Not yet

    if(thisFile.pages[currentPage] === undefined)
      thisFile.pages[currentPage] = {lines: [], backstack: []};

    var _x, _y, _points = [ ];
    if (touch) {
      _x = e.touches[0].clientX;
      _y = e.touches[0].clientY;
    } else {
      _x = e.clientX;
      _y = e.clientY;
    }

    //RULER ON
    if(rulerActive){

      //let's get the equation for the line that lies on the ruler
      //Using 2 points we can get the general equation for a straight line

      var ruler_topLeft = document.getElementById("top_left");
      var ruler_topRight = document.getElementById("top_right");
      var _topLeftRect = ruler_topLeft.getBoundingClientRect();
      var _topRightRect = ruler_topRight.getBoundingClientRect();
      var _x1 = _topLeftRect.left;
      var _y1 = _topLeftRect.top;
      var _x2 = _topRightRect.right;
      var _y2 = _topRightRect.top;

      //get a b c
      var a = _y1-_y2;
      var b = _x2-_x1;
      var c = (_x1-_x2)*_y1 + (_y2-_y1)*_x1;

      if(a==0 || b==0){
        if(a==0){
           console.log("a is 0");
           _y=_topLeftRect.top;
        }
        if(b==0){
          console.log("b is 0");
          _x=_topLeftRect.left;
        }
      }
      else{
        //get m and q for the line and its perpendicular passing through input position
        var m1=-a/b;
        var m2=b/a;
        var q1=-c/b;
        var q2=_y - (b/a)*_x;

        //get the point generated by the intersection of the 2 lines
        _x=(q2-q1)/(m1-m2);
        _y=-(a/b)*_x - (c/b);
      }
    }

    //gotta be responsive
    _x-= DrawPaddingX;
    _y-= DrawPaddingY;

    // save points
    _points.push({ x: _x, y: _y });
    if (toolSelected !== "rubber") { // RUBBER OFF
      thisFile.pages[currentPage].lines.push({
        points: _points,
        color: lineColor,
        width: lineWidth,
        rubber: false
      });
    } else { // RUBBER ON
      thisFile.pages[currentPage].lines.push({
        points: _points,
        color: canvas.style.backgroundColor,
        width: rubberWidth,
        rubber: true
      });
    }

    //Delete latest backstacks
    for(var i=0; i < backstack_counter; i++){
      thisFile.pages[currentPage].backstack.pop();
    }
    redo_times=1;
  }
  function moveDrawing(e, touch) {
    if (toolSelected === "ruler") return;
    if (!isDrawing) return;

    hasMoved = true;
    var _x, _y, _points;
    var _lines = thisFile.pages[currentPage].lines;

    _points = _lines[_lines.length-1].points;
    ctx.strokeStyle = ctx.shadowColor = _lines[_lines.length-1].color;
    ctx.lineWidth = _lines[_lines.length-1].width;

    if (toolSelected === "rubber") {
      ctx.shadowColor = "transparent";
    } 
    if (touch) {
      canvas.style.cursor = "none";
      _x = e.changedTouches[0].clientX;
      _y = e.changedTouches[0].clientY;
    } else {
      canvas.style.cursor = "crosshair";
      _x = e.clientX;
      _y = e.clientY;
    }

    //RULER ON
    if(rulerActive){
      //let's get the equation for the line that lies on the ruler
      //Using 2 points we can get the general equation for a straight line

      var ruler_topLeft = document.getElementById("top_left");
      var ruler_topRight = document.getElementById("top_right");
      var _topLeftRect = ruler_topLeft.getBoundingClientRect();
      var _topRightRect = ruler_topRight.getBoundingClientRect();
      var _x1 = _topLeftRect.left;
      var _y1 = _topLeftRect.top;
      var _x2 = _topRightRect.right;
      var _y2 = _topRightRect.top;

      //get a b c
      var a = _y1-_y2;
      var b = _x2-_x1;
      var c = (_x1-_x2)*_y1 + (_y2-_y1)*_x1;

      if(a==0 || b==0){
        if(a==0){
           console.log("a is 0");
           _y=_topLeftRect.top;
        }
        if(b==0){
          console.log("b is 0");
          _x=_topLeftRect.left;
        }
      }
      else{
        //get m and q for the line and its perpendicular passing through input position
        var m1=-a/b;
        var m2=b/a;
        var q1=-c/b;
        var q2=_y - (b/a)*_x;

        //get the point generated by the intersection of the 2 lines
        _x=(q2-q1)/(m1-m2);
        _y=-(a/b)*_x - (c/b);
      }
    }

    //gotta be responsive
    _x-= DrawPaddingX;
    _y-= DrawPaddingY;

    // save points
    _points.push({ x: _x, y: _y });
    //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var p1 = _points[0];
    var p2 = _points[1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    for (var i = 1, len = _points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      var midPoint = midPointBtw(p1, p2);
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = _points[i];
      p2 = _points[i+1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
  function endDrawing(e, touch) {
    if (toolSelected === "ruler") return;
  	//Handle dots
  	if(!hasMoved && isDrawing) {
  		var _x, _y;
  		if (touch) {
  		  _x = e.changedTouches[0].clientX - DrawPaddingX;
  		  _y = e.changedTouches[0].clientY - DrawPaddingY;
  		} else {
  		  _x = e.clientX - DrawPaddingX;
  		  _y = e.clientY - DrawPaddingY;
  		}
      var _width;
      var _lines = thisFile.pages[currentPage].lines;

  		ctx.beginPath();

      ctx.fillStyle = ctx.strokeStyle = ctx.shadowColor = _lines[_lines.length-1].color;
      _width = _lines[_lines.length-1].width;

  		ctx.arc(_x, _y, _width, 0, 2 * Math.PI, false);
      ctx.fill();
  	}
	
	 //These points are already saved in startDrawing. No need to save here.
    resetBackstackButtons();
    isDrawing = false;
    hasMoved = false;
  }


  canvas.onmousedown = function(e) {
    startDrawing(e, false);
  };

  canvas.onmousemove = function(e) {
    moveDrawing(e, false);
  };

  canvas.onmouseup = function(e) {
    endDrawing(e, false);
  };
  // TOUCH SUPPORT
  canvas.addEventListener("touchstart", function(e) {
    startDrawing(e, true);
  });

  canvas.addEventListener("touchmove", function(e) {
    moveDrawing(e, true);
  });

  canvas.addEventListener("touchend", function(e) {
    endDrawing();
  });

  // THESE SET THINGS
  function setColor(color){
    lineColor = color;
    pencilColor.style.borderBottom = "12px solid " + lineColor;
  }
  function setWidth(width) {
     lineWidth = width;
     ctx.lineWidth = width;
  }
  function setRubberWidth(width) {
     rubberWidth = width;
     ctx.lineWidth = width;
  }


  function selectTool(_tool){ //--da dividere
    if(_tool.id == "ruler"){
      rulerActive = !rulerActive;
      var rulerContainer = document.getElementById("ruler_container");
      if(rulerActive){
        rulerContainer.style.display="flex";
        _tool.classList.add("btn-ruler-active");
      }
      else{
        rulerContainer.style.display="none";
        _tool.classList.remove("btn-ruler-active");
      }
    }
    else{
      clearButtonSelection(allTools, "btn-tool-active");
      _tool.classList.add("btn-tool-active");
      toolSelected = _tool.id;
    }
  }

  // TOOL PICKER --da dividere
  /*pencil.addEventListener("click", function(e) {
    showColorButtons();
    if (toolSelected === "rubber") {
      ctx.strokeStyle = ctx.shadowColor = lineColor;
      ctx.lineWidth = lineWidth;
    }
    selectTool(this);
    ctx.lineWidth = lineWidth;
  });
  rubber.addEventListener("click", function(e) {
    hideColorButtons();
    selectTool(this);
    ctx.lineWidth = rubberWidth;
  });
  ruler.addEventListener("click", function(e) {
    selectTool(this);
    ctx.lineWidth = lineWidth;
  }); */

  // RECEIVE SETTINGS

  ipc.on('send-command', function(e, command, parameters) {
  var dialog = require('dialog');
  dialog.showMessageBox({ type: 'info', buttons: ['Ok'], message: target+", "+command});
    console.log('Received command!')
    switch (command) {
      case "setLine":
        setColor(command.lineColor);
        lineWidth(command.lineWidth);
        setRubberWidth(command.rubberWidth);
        console.log('Received settings for lines');
        break;
      default:
      console.log('No valid command sent')
        break;
    }
  });


  // ==================================================================== //
  //                    O T H E R   F U N C T I O N S                     //
  // ==================================================================== //

  function loadIntoCanvas(file, page){ /*page is optional. if not set, page will be 0*/
    if (file !== null && file !== undefined) {
      console.log("loading file " + file.settings.name);
      thisFile = file;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      
      if (page === undefined || page === null) {
        page = 0;
      }

      currentPage = page;
      pageCounter.innerHTML = currentPage+1;

      if (thisFile.pages[currentPage] === undefined) {
        thisFile.pages[currentPage] = {lines: [], backstack: []};
      }

      resizeCanvas(false);
      resetBackstackButtons();
      updateNavButtons();

      canvas.style.backgroundColor = thisFile.settings.canvas.backgroundColor;
      document.getElementById("grid").style.backgroundImage = thisFile.settings.canvas.backgroundImage;
      title.innerHTML=thisFile.settings.name.split("\\").pop();

      //DRAW
      //When backgruond changes color, i want rubber to be re-colored to match bg color
      for(var i = 0; i < thisFile.pages[currentPage].lines.length; i++) {
        if(thisFile.pages[currentPage].lines[i].rubber)
        {
          thisFile.pages[currentPage].lines[i].color = thisFile.settings.canvas.backgroundColor;
        }
      }
      var _lines = thisFile.pages[currentPage].lines;

      for (var line = 0; line < _lines.length; line++) {
        var _line = _lines[line];
        var _points = _line.points;

        if (_points.length === 1){  //draw a dot
          _x=_points[0].x;
          _y=_points[0].y;
          ctx.beginPath();
          ctx.arc(_x, _y, _line.width, 0, 2 * Math.PI, false);
          ctx.fillStyle = _line.color;
          ctx.shadowColor = _line.color;
          ctx.strokeStyle = _line.color;
          ctx.fill();
        }
        else {  //draw a line

          ctx.shadowBlur = 0.5;
          ctx.imageSmoothingEnabled = true;
          ctx.strokeStyle = _line.color;
          if (_line.rubber) {
            ctx.shadowColor = "transparent";
          } else {
            ctx.shadowColor = _line.color;
          }

          //Adapted code from startDrawing
          for(var _point = 1; _point<_points.length;_point++){ //Simulate i'm drawing
            var p1 = _points[0];
            var p2 = _points[1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);

            for (var i = 1; i < _point+1; i++) {  //Will produce the same effect as _points.length in startDrawing
              // we pick the point between pi+1 & pi+2 as the
              // end point and p1 as our control point
              var midPoint = midPointBtw(p1, p2);
              ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
              p1 = _points[i];
              p2 = _points[i+1];
            }
            // Draw last line as a straight line while
            // we wait for the next point to be able to calculate
            // the bezier control point
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        }
      }     
    } else console.log("error loading file: " + file);
  }

  //RULER
  var rulerLoader = require('./app/js/ruler');
  rulerLoader.LoadRuler();

  //UNDO & REDO
  var undo = document.getElementById("undo");
  var redo = document.getElementById("redo");
  var backstack_counter=0;
  var redo_times = 1;
  //On load
  resetBackstackButtons();

  undo.addEventListener("click",function() {
    if(thisFile.pages[currentPage] === undefined) return;
    var _lines = thisFile.pages[currentPage].lines;
    if(_lines.length === 0) return;
    thisFile.pages[currentPage].backstack.push(_lines.pop());
    backstack_counter++;
    redo_times=1;
    loadIntoCanvas(thisFile,currentPage);
  });

  redo.addEventListener("click",function() {
    if(thisFile.pages[currentPage] === undefined) return;
    var _backstack = thisFile.pages[currentPage].backstack;
    if (_backstack.length === 0) return;
    for(var i=0; i<redo_times; redo_times--){
      thisFile.pages[currentPage].lines.push(_backstack.pop());
      backstack_counter--;
    }
    redo_times=1;
    loadIntoCanvas(thisFile,currentPage);
  });

  // CLEAR ALL

  var clearAllBtn = document.getElementById("clear_all")
  clearAllBtn.addEventListener("mousedown", function() {
    var _lines = thisFile.pages[currentPage].lines;
    redo_times=0; //was most likely 1 before, so let's set it to 0 before increasing it
    for (var i = _lines.length - 1; i >= 0; i--) {
      thisFile.pages[currentPage].backstack.push(_lines.pop());
      redo_times++; //Next redo will redraw every line deleted by clear all
      backstack_counter++;
    };
    loadIntoCanvas(thisFile, currentPage);
  });

  /*function resetBackstackButtons() {
    if(thisFile.pages[currentPage] === undefined){
      undo.style.pointerEvents = 'none';
      redo.style.pointerEvents = 'none';
    }
    else{
      var _lines = thisFile.pages[currentPage].lines;
      var _backstack = thisFile.pages[currentPage].backstack;
      if(_backstack.length==0){
        redo.style.pointerEvents = 'none';
        redo.classList.add("btn-disabled");
      }
      else{
        redo.style.pointerEvents = 'auto';
        redo.classList.remove("btn-disabled");
      }

      if(_lines.length==0){
        undo.style.pointerEvents = 'none';
        undo.classList.add("btn-disabled");
      }
      else{
        undo.style.pointerEvents = 'auto';
        undo.classList.remove("btn-disabled");
      }
    }
  }*/
}); // document.ready?