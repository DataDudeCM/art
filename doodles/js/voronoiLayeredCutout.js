let layers = [[], [], []];
let palette = ['#1a1c2c', '#403d58', '#fcffeb']; // Dark deeps to a cream top

function setup() {
  createCanvas(800, 800);
  noLoop();
}

function draw() {
  background('#050508');

  for (let i = 0; i < 3; i++) {
    drawPaperLayer(i);
  }
}

function drawPaperLayer(index) {
  let pg = createGraphics(width, height);
  
  // 1. Texture the "paper"
  pg.fill(palette[index]);
  pg.noStroke();
  pg.rect(0, 0, width, height);
  addGrain(pg);

  // 2. Punch out the smoothed cells
  pg.erase();
  let cellCount = [80, 40, 20][index]; 
  for (let j = 0; j < cellCount; j++) {
    let seed = generateVignettePoint();
    let jaggedCell = createRandomPolygon(seed.x, seed.y, [30, 60, 120][index]);
    
    // THE MAGIC: Smooth the jagged cell
    let smoothCell = chaikin(jaggedCell, 3); 
    
    pg.beginShape();
    for (let v of smoothCell) {
      pg.vertex(v.x, v.y);
    }
    pg.endShape(CLOSE);
  }
  pg.noErase();

  // 3. Shadow depth (more offset for higher layers)
  drawingContext.shadowOffsetX = 15 * (index + 1);
  drawingContext.shadowOffsetY = 15 * (index + 1);
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.7)';

  image(pg, 0, 0);
  drawingContext.shadowBlur = 0;
}

// Generates a jagged polygon to simulate a raw Voronoi cell
function createRandomPolygon(x, y, radius) {
  let pts = [];
  let steps = floor(random(5, 10));
  for (let a = 0; a < TWO_PI; a += TWO_PI / steps) {
    let r = radius * random(0.5, 1.2);
    pts.push(createVector(x + cos(a) * r, y + sin(a) * r));
  }
  return pts;
}

function addGrain(pg) {
  pg.strokeWeight(1);
  for (let i = 0; i < 12000; i++) {
    pg.stroke(255, random(5, 12));
    pg.point(random(width), random(height));
  }
}

function generateVignettePoint() {
  let angle = random(TWO_PI);
  let r = Math.pow(random(), 1.8) * (width / 2);
  return createVector(width/2 + cos(angle) * r, height/2 + sin(angle) * r);
}

function chaikin(vertices, iterations) {
  if (iterations === 0) return vertices;
  let newVertices = [];
  for (let i = 0; i < vertices.length; i++) {
    let v0 = vertices[i];
    let v1 = vertices[(i + 1) % vertices.length]; // Wrap around
    
    // Create the two new points at 25% and 75%
    let p1 = p5.Vector.lerp(v0, v1, 0.25);
    let p2 = p5.Vector.lerp(v0, v1, 0.75);
    
    newVertices.push(p1);
    newVertices.push(p2);
  }
  return chaikin(newVertices, iterations - 1);
}