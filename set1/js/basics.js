// 
// Basics

let isLoopingFlag = true;

function preload() {
  img = loadImage('images/marble_texture.jpg');
}

function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(windowWidth, windowHeight);
  print(windowWidth,windowHeight);

  //grainBuffer = createGraphics(width, height, WEBGL);
  //grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,360,100,100,100);

  frameRate(2);

  //noLoop();

  selectedPalette = palettes[10]; //set selectedPalette to the one with index i
  fillColor = color(selectedPalette[3]);
  outlineColor = selectedPalette[0];
  background(selectedPalette[4]); 

}

function draw() {
  noLoop();
  print(width,height);
  cnv1 = createGraphics(400,400);
  cnv1.colorMode(HSB,360,100,100,100);
  //cnv1.background(fillColor);

  cnv1.fill(fillColor);
  cnv1.stroke(outlineColor);
  cnv1.strokeWeight(4);
  
  // Create a mask.
  cnv1.beginClip();
  cnv1.circle(200, 200, 200);
  cnv1.endClip();

  cnv1.tint(300,60,100,100);
  cnv1.image(img,0,0); //loads the image or texture to the hidden canvas

  image(cnv1,0,0,400,400); // adds the hidden canvas to the primary
  strokeWeight(4);
  noFill();
  circle(200,200,200);

  //applyGrain(mainCanvas);
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
