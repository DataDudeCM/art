// 
// scontour

let isLoopingFlag = true;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;

let img;

function preload() {
  //img = loadImage('images/untitled-6.png'); // Replace 'your_image.jpg' with the path to your image
}


function setup() {
    //createCanvas(2270, 1270);
    createCanvas(1200, 1200);
    colorMode(HSB,360,100,100,100);

    frameRate(2);

    //pick color palette
    selectedPalette = palettes[6]; //set selectedPalette to the one with index i
    //pick drawing colors from palette
    background(selectedPalette[4]);
    background(color('White'));
    fillColor = color(selectedPalette[0]);
    outlineColor = color(selectedPalette[0]);
    //outlineColor.setAlpha(10);

    stroke(outlineColor);
    strokeWeight(2);
    fill(fillColor);
    //noFill();
    //noLoop();

    axiom = "X"; 
    rules = {
        "X": "F[+X][+X][-X][-X]FX", 
        "F": "FF"
    };
    
    /*
    axiom = "F"; 
    rules = {
        "F": "F[-F]F[+F][F]"
    };
    */
}

function draw() {
    //background(color('White'));
    outlineColor.setAlpha(random(1,10));
    stroke(outlineColor);
    strokeWeight(int(random(1,2)));
    lSystemPaths = [];
    distortedPaths = [];
    length = random(4,8);
    angle = radians(random(10,45));
    sentence = axiom;
    for (i = 0; i < 6; i+=1) {
        generate();
    }
    drawLSystem();
    //for (path of lSystemPaths) {
    //    line(path.start.x, path.start.y, path.end.x, path.end.y);
    // }

    distortedPaths = distortWithNoise(lSystemPaths);
    for (path of distortedPaths) {
        line(path.start.x, path.start.y, path.end.x, path.end.y);
    }
}


function generate() {
    let nextSentence = "";
    for (let char of sentence) {
      nextSentence += rules[char] || char; // Apply rules
    }
    sentence = nextSentence;
  }
  
  function drawLSystem() {
    resetMatrix(); // Clear any previous transformations
    translate(width / 2, height); // Start at bottom-center of the canvas
    let currentX = 0;
    let currentY = 0;
    let stack = []; // Stack for saving/restoring positions and angles
    let currentAngle = -PI / 2; // Initial angle (pointing upwards)
  
    for (let char of sentence) {
      //length = length * .999; //reduce the length of branches over time
      if (char === "F") {
        // Calculate next position using trigonometry
        let nextX = currentX + length * cos(currentAngle);
        let nextY = currentY + length * sin(currentAngle);
  
        // Save the path for potential use later
        lSystemPaths.push({ start: { x: currentX, y: currentY }, end: { x: nextX, y: nextY } });
  
        // Draw the line
        //line(currentX, currentY, nextX, nextY);
  
        // Update current position
        currentX = nextX;
        currentY = nextY;
      } else if (char === "+") {
        // Turn clockwise by modifying the angle
        currentAngle += angle;
      } else if (char === "-") {
        // Turn counter-clockwise by modifying the angle
        currentAngle -= angle;
      } else if (char === "[") {
        // Push the current state (position and angle) to the stack
        stack.push({ x: currentX, y: currentY, angle: currentAngle });
      } else if (char === "]") {
        // Pop the saved state and restore position and angle
        let savedState = stack.pop();
        currentX = savedState.x;
        currentY = savedState.y;
        currentAngle = savedState.angle;
      }
    }
}

function distortWithNoise(paths) {
    for (let path of paths) {
        //let distortedPath = [];
        let noiseOffsets = noise(path.start.x * 0.03, path.start.y * 0.03) * 10;
        let noiseOffsete = noise(path.end.x * 0.03, path.end.y * 0.03) * 10;
        distortedPaths.push({ start: { x: path.start.x + noiseOffsets, y: path.start.y + noiseOffsets }, end: { x: path.end.x + noiseOffsete, y: path.end.y + noiseOffsete }});
        //distortedPaths.push(distortedPath);
    }
    return distortedPaths;
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 'l' || key == 'L') {
    if (isLoopingFlag) {
      isLoopingFlag = false;
      noLoop()
    } else {
      isLoopingFlag = true;
      loop();
    }
  }
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('city_' + timeStamp + 'png');
    }
}
