// Circle Packing with Layered Textured Cutouts
// Each layer has circles "punched out" to reveal the layer below
// The bottom layer shows the background color through all holes
// Texturing and distribution is used in this version
let layerCounts = [200, 175, 150, 100]; // 4 layers
let circleData = [[], [], [], []]; // 4 layers
let palette = [];
let cheight = 0;

function preload() {
  myCustomFont = loadFont('../common/fonts/test_sans.ttf');
}

function setup() {
  mainCanvas = createCanvas(windowWidth, windowHeight); //
  cheight = height - 20; // leave space for signature

  grainBuffer = createGraphics(width, cheight, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)
  pixelDensity(1); // Keep it snappy for the texture generation
  frameRate(1);
  //noLoop();
}

function draw() {
  palette = palettes[int(random(12))];
  //background('White');
  background('#050508'); // The "void" at the bottom
  //background(palette[0]); // The "void" at the bottom
  circleData = [[], [], [], []]; // reset circle data  
  for (let i = 0; i < layerCounts.length; i++) {
    packLayer(i, layerCounts[i]);
  }
  for (let i = 0; i < circleData.length; i++) {
    drawTexturedCutout(i);
  }
  applyGrain(mainCanvas);

  // Signature
  fill('White');
  noStroke();
  rect  (0, height - 30, width, height);
  textSize(14);
  fill('Black');
  noStroke();
  text('Circle Packing Cutouts - (c) www.cmARTcreations.com 2026', 10, height-4);
}

function packLayer(index, maxCircles) {
  let attempts = 0;
  let center = createVector(width / 2, cheight / 2);

  while (circleData[index].length < maxCircles && attempts < 10000) {
    let x = random(width);
    let y = random(cheight);
    let dToCenter = dist(x, y, center.x, center.y);
    
    // VIGNETTE LOGIC: Circles are more likely to spawn/be larger near the center
    let spawnChance = map(dToCenter, 0, width/2, 1.0, 0.1); // 1.0 at center, 1% at edges
    
    if (random() < spawnChance) {
      let maxR = map(dToCenter, 0, width/2, width*.4, width*.05) * (index + 1) * 0.5;
      let newC = { x: x, y: y, r: random(20, maxR) }; // default is 5 for smaller circles
      
      let overlapping = false;
      for (let other of circleData[index]) {
        if (dist(newC.x, newC.y, other.x, other.y) < newC.r + other.r + 4) {
          overlapping = true;
          break;
        }
      }
      
      if (!overlapping) circleData[index].push(newC);
    }
    attempts++;
  }
}

function drawTexturedCutout(index) {
  let pg = createGraphics(width, cheight);
  
  // 1. Create Paper Texture
  pg.fill(palette[index]);
  pg.noStroke();
  pg.rect(0, 0, width, cheight);

  // 2. Punch the holes
  pg.erase();
  pg.noStroke();
  for (let c of circleData[index]) {
    drawRoughCircle(pg, c.x, c.y, c.r * 2);
  }
  pg.noErase();
  
  /*
  pg.stroke('Light Gold'); //light grey
  pg.strokeWeight(2);
  pg.noFill();
  for (let c of circleData[index]) {
    pg.ellipse(c.x, c.y, c.r * 2);
  }
  */

  // 2.5 Paper Edge Highlight (The "Deboss" look)
  pg.noFill();
  // Draw a highlight on the bottom-right of the hole (opposite to shadow)
  pg.stroke(255, 255, 255, 150); // Semi-transparent white
  pg.strokeWeight(1.5);
  for (let c of circleData[index]) {
      // Offset slightly to catch the "light"
      pg.arc(c.x, c.y, c.r * 2, c.r * 2, QUARTER_PI, PI - QUARTER_PI); 
  }

  // Draw a shadow/dark rim on the top-left (inner depth)
  pg.stroke(0, 0, 0, 50);
  for (let c of circleData[index]) {
      pg.arc(c.x, c.y, c.r * 2, c.r * 2, PI + QUARTER_PI, -QUARTER_PI); 
  }


  // 3. Shadow Rendering
  // The higher the layer, the further the shadow casts
  drawingContext.shadowOffsetX = 5 * (index + 1);
  drawingContext.shadowOffsetY = 5 * (index + 1);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.8)';

  image(pg, 0, 0);
  
  // Reset for next layer
  drawingContext.shadowBlur = 0;
  pg.remove();
}

function drawRoughCircle(target, x, y, r, variance = 5) {
  target.beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) {
    // Offset the radius using noise based on angle and a unique seed per circle
    let offset = map(noise(cos(a) + x, sin(a) + y, frameCount * 0.01), 0, 1, -variance, variance);
    let rRough = r + offset;
    let vx = x + rRough * cos(a);
    let vy = y + rRough * sin(a);
    target.vertex(vx, vy);
  }
  target.endShape(CLOSE);
}

function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('circlePackLayersDist_' + timeStamp);
    }
}