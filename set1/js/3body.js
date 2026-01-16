// 
// 3 body

let isLoopingFlag = false;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;
let noiseLevel = 1; //1 straight; < 1 left, > 1 right
let noiseScale = .01; //1 straight; .02 default
let direction = 0;
let expansion = .75;

function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(600, 600);

  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,360,100,100,100);

  frameRate(10);

  //pick color palette
  selectedPalette = palettes[5]; //set selectedPalette to the one with index i
  //pick drawing colors from palette
  background(selectedPalette[4]);
  //background(color('Black'));
  fillColor = color(selectedPalette[2]);
  outlineColor = color(selectedPalette[0]);
  outlineColor = color('White');

  stroke(outlineColor);
  strokeWeight(4);
  fill(fillColor);
  //noFill();

  noLoop();
  initialRadius = 50;

}

function draw() {
    background(selectedPalette[0]);

    xpos = width*.5;
    ypos = height*.5;

    threeBodyF(xpos, ypos,initialRadius,3,direction, PI);
    // add a second 3 body system
    //threeBodyF(width*.75, height*.75,initialRadius/4,3,direction+PI);

    direction = direction + PI/8; // enables rotation

   applyGrain(mainCanvas);
   expansion = map(mouseX,0,width,.5,1.5);
   initialRadius = map(mouseY,0,height,20,50);
}

function threeBody (x,y,r, depth, direction) {
    noFill();
    if (depth == 0) {
        return;
    } else {
        // draw a circle
        ellipse(x,y,r*2);
        // get any point on the circle
        // rotate PI to get a new center point - angle = PI/4
        let newx = x + (r*expansion) * cos((direction));
        let newy = y + (r*expansion) * sin((direction));
        ellipse(newx,newy,4);
        let newr = r*expansion;

        threeBody (newx,newy,newr,depth-1, direction+PI);
    }

}

function threeBodyF (x,y,r, depth, direction, offset) {
    // in this version the circles are filled from the bottom up

    //expansion = random(.25,1.25);

    if (depth == 0) {
        //ellipse(x,y,r*2);
        return;
    } else {
        // get any point on the circle
        // rotate by direction to get a new center point
        let newx = x + (r*expansion) * cos((direction));
        let newy = y + (r*expansion) * sin((direction));
        //set new radius = current radius + the expanded radius
        let newr = r+(r*expansion);
        //recursively call it again
        threeBodyF(newx,newy,newr,depth-1, direction+offset,offset);

        //after hitting bottom draw circles (bottom up)
        fcolor = color(selectedPalette[int(random(1,4))]);
        fcolor = color(selectedPalette[depth]);
        //fcolor.setAlpha(50);
        fill(fcolor);
        //noFill();
        //strokeWeight(depth);
        outlineColor.setAlpha(100);
        stroke(outlineColor);
        ellipse(x,y,r*2); // consider using a different function to draw the circle
        //jaggyCircle(x,y,r);
    }

}

function jaggyCircle (centerX, centerY,radius) {
    let segments = 120; // Number of line segments to approximate the circle
    let s =1; 

    // Draw the circle using line segments
    for (let i = 0; i < segments; i++) {
        strokeWeight(4);
        outlineColor.setAlpha(20);
        stroke(outlineColor);
        let angle1 = map(i, 0, segments, 0, TWO_PI);
        let angle2 = map(i + 1, 0, segments, 0, TWO_PI);
        let x1 = centerX + cos(angle1) * radius + random(-s,s);
        let y1 = centerY + sin(angle1) * radius + random(-s,s);
        let x2 = centerX + cos(angle2) * radius + random(-s,s);
        let y2 = centerY + sin(angle2) * radius + random(-s,s);
        line(x1, y1, x2, y2);
    }
    for (let i = 0; i < segments; i++) {
        strokeWeight(3);
        outlineColor.setAlpha(20);
        stroke(outlineColor);
        let angle1 = map(i, 0, segments, 0, TWO_PI);
        let angle2 = map(i + 1, 0, segments, 0, TWO_PI);
        let x1 = centerX + cos(angle1) * radius + random(-s,s);
        let y1 = centerY + sin(angle1) * radius + random(-s,s);
        let x2 = centerX + cos(angle2) * radius + random(-s,s);
        let y2 = centerY + sin(angle2) * radius + random(-s,s);
        line(x1, y1, x2, y2);
    }
    for (let i = 0; i < segments; i++) {
        strokeWeight(1);
        outlineColor.setAlpha(20);
        stroke(outlineColor);
        let angle1 = map(i, 0, segments, 0, TWO_PI);
        let angle2 = map(i + 1, 0, segments, 0, TWO_PI);
        let x1 = centerX + cos(angle1) * radius + random(-s,s);
        let y1 = centerY + sin(angle1) * radius + random(-s,s);
        let x2 = centerX + cos(angle2) * radius + random(-s,s);
        let y2 = centerY + sin(angle2) * radius + random(-s,s);
        line(x1, y1, x2, y2);
    }
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
