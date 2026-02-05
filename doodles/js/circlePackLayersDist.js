// Circle Packing with Layered Textured Cutouts
// Each layer has circles "punched out" to reveal the layer below
// The bottom layer shows the background color through all holes
// Texturing and distribution is used in this version
let layerCounts = [100, 250, 80]; 
let circleData = [[], [], []];
let palette = [];

function setup() {
  mainCanvas = createCanvas(windowWidth, windowHeight); //

  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)
  pixelDensity(1); // Keep it snappy for the texture generation
  frameRate(1);
  //noLoop();
}

function draw() {
  palette = palettes[int(random(palettes.length))];
  //background('#050508'); // The "void" at the bottom
  background(palette[0]); // The "void" at the bottom
  circleData = [[], [], []];
  for (let i = 0; i < 3; i++) {
    packLayer(i, layerCounts[i]);
  }
  for (let i = 0; i < 3; i++) {
    drawTexturedCutout(i);
  }
  applyGrain(mainCanvas, grainBuffer, grainShader, 0.05);
}

function packLayer(index, maxCircles) {
  let attempts = 0;
  let center = createVector(width / 2, height / 2);

  while (circleData[index].length < maxCircles && attempts < 10000) {
    let x = random(width);
    let y = random(height);
    let dToCenter = dist(x, y, center.x, center.y);
    
    // VIGNETTE LOGIC: Circles are more likely to spawn/be larger near the center
    let spawnChance = map(dToCenter, 0, width/2, 1.0, 0.01);
    
    if (random() < spawnChance) {
      let maxR = map(dToCenter, 0, width/2, 200, 40) * (index + 1) * 0.5;
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
  let pg = createGraphics(width, height);
  
  // 1. Create Paper Texture
  pg.fill(palette[index]);
  pg.noStroke();
  pg.rect(0, 0, width, height);

  // 2. Punch the holes
  pg.erase();
  pg.noStroke();
  for (let c of circleData[index]) {
    pg.ellipse(c.x, c.y, c.r * 2);
  }
  pg.noErase();
  
  pg.stroke('Light Gold'); //light grey
  pg.strokeWeight(2);
  pg.noFill();
  for (let c of circleData[index]) {
    pg.ellipse(c.x, c.y, c.r * 2);
  }

  // 3. Shadow Rendering
  // The higher the layer, the further the shadow casts
  drawingContext.shadowOffsetX = 12 * (index + 1);
  drawingContext.shadowOffsetY = 12 * (index + 1);
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.8)';

  image(pg, 0, 0);
  
  // Reset for next layer
  drawingContext.shadowBlur = 0;
  pg.remove();
}
function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('circlePackLayersDist_' + timeStamp);
    }
}