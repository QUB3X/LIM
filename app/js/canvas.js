document.addEventListener( "DOMContentLoaded", function() {

// function to setup a new canvas for drawing
// Thanks to http://perfectionkills.com/exploring-canvas-drawing-techniques/
// for the nice explanation :)
  //define and resize canvas

  var thisFile = {
    settings: {
      name: "unnamed",
      date: new Date().getTime(),
      canvas: {
        x: 10,
        y: 20,
        background: "#fff"
      }
    },
    pages: [
      {lines: [ ]}
    ]
    // pages: [
    //   lines: [
    //     {points: [{x:0,y:0}],
    //      color: "#fff"}
    // ]
  }

  var content = document.getElementById("content");
  var header_height = document.getElementById('header').clientHeight;

  content.style.height = String(window.innerHeight - header_height) + "px";

  var canvasToAdd = '<canvas id="canvas" width="'+window.innerWidth+'" height="'+(window.innerHeight)+'"></canvas>';
  document.getElementById("content").innerHTML = canvasToAdd;

  var canvas = document.getElementById("canvas");

  canvas.style.background = thisFile.settings.canvas.background;

  var DrawPaddingX = canvas.offsetLeft;
  var DrawPaddingY = canvas.offsetTop;

  var ctx = canvas.getContext('2d');

  window.onresize = function() {
    DrawPaddingX = canvas.offsetLeft;
    DrawPaddingY = canvas.offsetTop;
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

  //default values
  var lineColor = "black";
  var lineWidth = 4;
  ctx.strokeStyle = lineColor;
  ctx.shadowColor = lineColor;
  ctx.lineWidth = lineWidth;
  //ctx.translate(0.5,0.5);

  var toolSelected = "pencil"; // can be "pencil", "rubber", "ruler"

  

  var isDrawing, pages = [ ];
  var hasMoved = false;

  // The current page in the pages[]
  var currentPage = 0;


  function startDrawing(e, touch) {
    if (toolSelected === "ruler") return;
    isDrawing = true;
    hasMoved = false; //Not yet
    var _x, _y, _points = [ ];
    if (touch) {
      _x = e.changedTouchs[0].clientX - DrawPaddingX;
      _y = e.changedTouchs[0].clientY - DrawPaddingY;
    } else {
      _x = e.clientX - DrawPaddingX;
      _y = e.clientY - DrawPaddingY;
    }
    // save points
    _points.push({ x: _x, y: _y });
    thisFile.pages[currentPage].lines.push({
      points: _points,
      color: ctx.strokeStyle,
      width: ctx.lineWidth
    });
  }

  function moveDrawing(e, touch) {
    if (toolSelected === "ruler") return;
    if (!isDrawing) return;

	hasMoved = true;
    var _x, _y;
    var _lines = thisFile.pages[currentPage].lines
    var _points = _lines[_lines.length-1].points
    if (touch) {
      canvas.style.cursor = "none";
      _x = e.changedTouchs[0].clientX - DrawPaddingX;
      _y = e.changedTouchs[0].clientY - DrawPaddingY;
    } else {
      canvas.style.cursor = "crosshair";
      _x = e.clientX - DrawPaddingX;
      _y = e.clientY - DrawPaddingY;
    }
    // save points
    _points.push({ x: _x, y: _y });
    //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var p1 = _points[0];
    var p2 = _points[1];

    ctx.strokeStyle = lineColor;
    ctx.shadowColor = lineColor;
    ctx.lineWidth = lineWidth;
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
  	//Handle points
  	if(!hasMoved) {
  		var _x, _y;
  		if (touch) {
  		  _x = e.changedTouchs[0].clientX - DrawPaddingX;
  		  _y = e.changedTouchs[0].clientY - DrawPaddingY;
  		} else {
  		  _x = e.clientX - DrawPaddingX;
  		  _y = e.clientY - DrawPaddingY;
  		}
  		ctx.beginPath();
  		ctx.arc(_x, _y, lineWidth, 0, 2 * Math.PI, false);
  		ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.strokeStyle = lineColor;
      ctx.fill();
  	}
	
	 //These points are already saved in startDrawing. No need to save here.

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

  var pencil = document.getElementById("pencil");
  var pencilColor = document.getElementById("pencil_color");
  var rubber = document.getElementById("rubber");
  var ruler = document.getElementById("ruler");
  var allTools = [pencil, rubber, ruler];

  var blackColor = document.getElementById("pencil_black");
  var blueColor = document.getElementById("pencil_blue");
  var redColor = document.getElementById("pencil_red");
  var greenColor = document.getElementById("pencil_green");
  var customColor = document.getElementById("pencil_other");
  var allColors = [blackColor, blueColor, redColor, greenColor, customColor];

  var smallWidth = document.getElementById("stroke_small");
  var mediumWidth = document.getElementById("stroke_medium");
  var bigWidth = document.getElementById("stroke_big");
  var allWidths = [smallWidth, mediumWidth, bigWidth];

  var whiteBackground = document.getElementById("background_white");
  var blackBackground = document.getElementById("background_black");
  var greenBackground = document.getElementById("background_green");
  var customBackground = document.getElementById("background_custom");

  var pencilOldColor, pencilOldWidth;

  function clearButtonSelection(buttons) {
    var colors = buttons;
    for (var i = colors.length - 1; i >= 0; i--) {
      colors[i].classList.remove("btn-active");
    }
  }

  function showColorButtons(){
    var _colorButtons = document.getElementsByClassName("btn-toolbar-color");
    for (var i = _colorButtons.length - 1; i >= 0; i--) {
      _colorButtons[i].classList.remove("btn-hidden");
      _colorButtons[i].classList.add("btn-visible");
      _colorButtons[i].style.pointerEvents = 'auto';
    };
  }

  function hideColorButtons(){
    var _colorButtons = document.getElementsByClassName("btn-toolbar-color");
    for (var i = _colorButtons.length - 1; i >= 0; i--) {
      _colorButtons[i].classList.remove("btn-visible");
      _colorButtons[i].classList.add("btn-hidden");
      _colorButtons[i].style.pointerEvents = 'none';
    };
  }

  function setColor(color){
    lineColor = color;
    pencilColor.style.borderBottom = "12px solid " + lineColor;
  }
  function setWidth(width) {
     lineWidth = width;
  }
  function setBackgroundColor(color) {
     thisFile.settings.canvas.background = color;
     canvas.style.background = thisFile.settings.canvas.background;
  }
  // TOOL PICKER
  pencil.addEventListener("click", function(e) {
    clearButtonSelection(allTools);
    this.classList.add("btn-active");
    showColorButtons();
    if (toolSelected === "rubber") {
      lineColor = pencilOldColor;
      lineWidth = pencilOldWidth;
    }
    toolSelected = "pencil";
  });
  rubber.addEventListener("click", function(e) {
    clearButtonSelection(allTools);
    this.classList.add("btn-active");
    hideColorButtons();
    // backup old color & width
    if (toolSelected !== "rubber") {
      pencilOldColor = lineColor;
      pencilOldWidth = lineWidth;
    }
    // apply new color & width
    lineColor = thisFile.settings.canvas.background;
    lineWidth = 30;

    toolSelected = "rubber";
  });
  ruler.addEventListener("click", function(e) {
    clearButtonSelection(allTools);
    this.classList.add("btn-active");
    showColorButtons();
    if (toolSelected === "rubber") {
      lineColor = pencilOldColor;
      lineWidth = pencilOldWidth;
    }
    toolSelected = "ruler";
  });
  // COLOR PICKER
  blackColor.addEventListener("click", function(e) {
    setColor("black");
    clearButtonSelection(allColors);
    this.classList.add("btn-active");
  });
  blueColor.addEventListener("click", function(e) {
    setColor("#2962ff");
    clearButtonSelection(allColors);
    this.classList.add("btn-active");
  });
  redColor.addEventListener("click", function(e) {
    setColor("#f44336");
    clearButtonSelection(allColors);
    this.classList.add("btn-active");
  });
  greenColor.addEventListener("click", function(e) {
    setColor("#4caf50");
    clearButtonSelection(allColors);
    this.classList.add("btn-active");
  });
  customColor.addEventListener("mouseup", function() {
    clearButtonSelection(allColors);
    this.classList.add("btn-active");
    document.getElementById("body").lastChild.addEventListener("mouseup", function() {
      setColor(customColor.getAttribute("value"));
    });
  });
  customColor.addEventListener("click", function() {
    //Voglio che il colore venga settato all'ultimo colore scelto quanto clicco
    setColor(customColor.getAttribute("value"));
  });

  // WIDTH
  smallWidth.addEventListener("click", function() {
    setWidth(2);
    clearButtonSelection(allWidths);
    this.classList.add("btn-active");
  });
  mediumWidth.addEventListener("click", function() {
    setWidth(4);
    clearButtonSelection(allWidths);
    this.classList.add("btn-active");
  });
  bigWidth.addEventListener("click", function() {
    setWidth(6);
    clearButtonSelection(allWidths);
    this.classList.add("btn-active");
  });
  // BACKGROUND COLOR PICKER
  whiteBackground.addEventListener("click", function(e) {
    setBackgroundColor("white");
  });
  blackBackground.addEventListener("click", function(e) {
    setBackgroundColor("black");
  });
  greenBackground.addEventListener("click", function(e) {
    setBackgroundColor("#567E3A");
  });
  customBackground.addEventListener("mouseup", function() {
    document.getElementById("body").lastChild.addEventListener("mouseup", function() {
      setBackgroundColor(customBackground.getAttribute("value"));
    });
  });
  customBackground.addEventListener("click", function() {
    //Voglio che il colore venga settato all'ultimo colore scelto quanto clicco
    setBackgroundColor(customBackground.getAttribute("value"));
  });


  //SAVE
  var saveButton = document.getElementById("save");

  var saveFile = require('./app/js/save');

  saveButton.addEventListener("click", function() {
    if (thisFile.settings.name=="unnamed") {
      saveFile.SaveAs(thisFile);
      console.log('saved as!')
    } else {
      saveFile.Save(thisFile);
      console.log('saved!')
    }
  });

  //LOAD
  var loadButton = document.getElementById("load");
  var loadFile = require('./app/js/load');

  loadButton.addEventListener("click", function(){
    loadFile.Load(loadIntoCanvas);
  });

  function loadIntoCanvas(file){
    if(file != null && file != undefined)
    {
      console.log("loading file " + file.settings.name);
      thisFile = file;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      document.getElementById('settings_container').classList.add('hidden'); //hide settings menu

      //DRAW
      var _lines = thisFile.pages[0].lines

      for(var line = 0; line < _lines.length; line++)
      {
        var _line = _lines[line];
        var _points = _line.points;
        if(_points.length==1){  //draw a dot
          _x=_points[0].x;
          _y=_points[0].y;
          ctx.beginPath();
          ctx.arc(_x, _y, lineWidth, 0, 2 * Math.PI, false);
          ctx.fillStyle = lineColor;
          ctx.shadowColor = lineColor;
          ctx.strokeStyle = lineColor;
          ctx.fill();
        }
        else {  //draw a line
          var p1 = _points[0];
          var p2 = _points[1];

          ctx.shadowBlur = 0.5;
          ctx.imageSmoothingEnabled = true;
          ctx.strokeStyle = _line.color;
          ctx.shadowColor = _line.color;
          ctx.lineWidth = _line.width+2; //bypass shadows not stacking, thus resulting in a smaller line
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
      }
    }
    else console.log("error loading file: " + file);
  }
}); // document.ready?
