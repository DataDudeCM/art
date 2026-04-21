// This sketch demonstrates how to create a custom stamp from a complex shape and use it to paint on the canvas with the BrushArtist library.
// The stamp is created by defining a shape, filling it with brush strokes on an off-screen graphics buffer, and then applying a mask to create the final stamp image. This allows for rich textures and organic results when stamping onto the main canvas.    
// Note: Make sure to have the BrushArtist library and your brush images properly set up in the specified paths for this to work.

let myBrush;
let painter;
let selectedPalette;
let shape = [];
let isLoopingFlag = true;

function preload() {
  // 1) Load your brush image (e.g., Acrylic Basic.png)
  myBrush = loadImage('../brushes/Acrylic Basic.png'); // Watercolor 4.png is a good one for testing, but you can try others too!
  textureImg = loadImage('../images/canvasBoard.jpg'); // Example canvas texture
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  stampWidth = 400;
  // Initialize the library
  painter = new BrushArtist(myBrush);
  selectedPalette = palettes[int(random(palettes.length))]; // Example: using the first palette
  // Optionally, you can set a background color from the palette
  background(selectedPalette[0]);
  background(textureImg);

  // 1. Define a complex shape (a simple star-ish blob)

  for (let i = 0; i < 8; i++) {
    let angle = map(i, 0, 10, 0, TWO_PI);
    let r = random(stampWidth*.1, stampWidth*.5);
    shape.push(createVector(stampWidth/2 + cos(angle) * r, stampWidth/2 + sin(angle) * r));
  }

  // 2. Create a stamp from that shape
  stamp = createAbstractStamp(shape, selectedPalette[2]);
  
  frameRate(10);
  //noLoop();
}

function draw() {
    // Place a stamp somewhere on the canvas
    let x = random(width);
    let y = random(height);
    let r = random(TWO_PI);
    let s = random(0.5, 1);

    push();
      translate(x, y);
      rotate(r);
      scale(s);
            // Optionally, you can also draw the shape outline for reference
      stroke(selectedPalette[1]);
      strokeWeight(2);
      noFill();
      beginShape();
        for (let i = 0; i < shape.length; i++) {
          vertex(shape[i].x, shape[i].y);
        }
      endShape(CLOSE); 
      imageMode(CENTER);
      image(stamp, 0, 0);

    pop();
}

// Need a function to create a "stamp"

function createAbstractStamp(shape,strokeColor) {
  let size = stampWidth;
  let iterations = 200;
  let pg = createGraphics(size, size); // The Paint Layer
  let maskG = createGraphics(size, size); // The Shape Layer
  maskG.colorMode(RGB, 255);
  maskG.background(0,0,0,0); // Start with a black background for the mask

  // 1. Use the previously created shape to define the stamp's silhouette on the mask layer
  maskG.fill(255,255,255,255); // The shape should be white on the mask to reveal the paint layer
  maskG.noStroke();
  maskG.beginShape();
  for (let i = 0; i < shape.length; i++) {
    maskG.vertex(shape[i].x, shape[i].y);
  }
  maskG.endShape(CLOSE); 
  maskG.filter(BLUR, 20); // Optional: blur the mask edges for softer transitions

  // 2. Fill the Paint Layer with strokes
  for (let i = 0; i < iterations; i++) {
    let x = random(size);
    let y = random(size);
    lastx = pointFromAngle(x, y, 2, random(TWO_PI)).x;
    lasty = pointFromAngle(x, y, 2, random(PI)).y;
    painter.refill(); // Refill pigment for each stroke to ensure consistent coverage
    painter.paintStroke(pg, x, y,  {
      px: lastx,
      py: lasty,
      strokeColor: strokeColor, // Using your Palette #1
      size: 40,
      opacity: 10,
      ghosting: 2
    });
  }

  // 3. Apply the mask
  let img = pg.get();
  img.mask(maskG);
  return img;
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) {

  } 
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
      save('tileart_' + timeStamp + 'png');
    }
}