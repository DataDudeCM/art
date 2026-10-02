let backLayer;

function setup() {
  createCanvas(800, 800);
  // Create an offscreen graphics buffer for the back layer.
  backLayer = createGraphics(width, height);
  frameRate(1);
}

function draw() {
  // Draw the gradient sky background
  drawGradient();

  // ===== BACK LAYER =====
  backLayer.clear();
  let buildingsBack = [];
  let x = -random(0, 50);
  while (x < width) {
    let w = random(50, 150);
    // Compute normalized distance from canvas center
    let norm = abs((x + w / 2) - width / 2) / (width / 2);
    // Taller buildings near the center, shorter at the edges
    let factor = lerp(1.2, 0.8, norm);
    let hBase = random(height / 3, height / 2);
    let h = hBase * factor;
    buildingsBack.push({ x: x, y: height - h, w: w, h: h });
    x += w * random(0.8, 1.4);
  }

  // Draw back layer buildings on offscreen buffer
  for (let b of buildingsBack) {
    backLayer.noStroke();
    backLayer.fill(random(100,200)); // light building color
    backLayer.rect(b.x, b.y, b.w, b.h);
    // Dark windows for daytime
    drawWindows(backLayer, b, color(40, 40, 50));
    // Sketchy outline
    drawSketchyOutline(backLayer, b.x, b.y, b.w, b.h, 3, 2, color(0));
  }
  // Blur to simulate distant, out-of-focus structures
  backLayer.filter(BLUR, 3);
  image(backLayer, 0, 0);

  // ===== MIDDLE LAYER =====
  let buildingsMid = [];
  x = -random(0, 50);
  while (x < width) {
    let w = random(80, 160);
    let norm = abs((x + w / 2) - width / 2) / (width / 2);
    let factor = lerp(1.2, 0.8, norm);
    let hBase = random(height / 4, height * 0.65);
    let h = hBase * factor;
    buildingsMid.push({ x: x, y: height - h, w: w, h: h });
    x += w * random(0.6, 1.4);
  }

  for (let b of buildingsMid) {
    noStroke();
    fill(random(100,180));
    rect(b.x, b.y, b.w, b.h);
    drawWindows(null, b, color(40, 40, 50));
    drawSketchyOutline(null, b.x, b.y, b.w, b.h, 3, 2, color(0));
  }

  // ===== FRONT LAYER =====
  let buildingsFront = [];
  x = -random(0, 50);
  while (x < width) {
    let w = random(70, 150);
    let norm = abs((x + w / 2) - width / 2) / (width / 2);
    let factor = lerp(1.2, 0.8, norm);
    let hBase = random(height / 4, height * 0.8);
    let h = hBase * factor;
    buildingsFront.push({ x: x, y: height - h, w: w, h: h });
    x += w * random(0.6, 1.4);
  }

  for (let b of buildingsFront) {
    // Drop shadow for extra depth
    push();
    noStroke();
    fill(0, 0, 0, 30);
    rect(b.x + 5, b.y + 5, b.w, b.h);
    pop();

    noStroke();
    fill(random(160,230));
    rect(b.x, b.y, b.w, b.h);
    drawWindows(null, b, color(40, 40, 50));
    drawSketchyOutline(null, b.x, b.y, b.w, b.h, 3, 2, color(0));
  }
}

// Draws a vertical gradient sky from a bright sky blue to a soft alice blue.
function drawGradient() {
  let c1 = color(135, 206, 235); // Sky Blue
  let c2 = color(240, 248, 255); // Alice Blue
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

// Helper function to draw windows on a building.
function drawWindows(ctx, building, winColor) {
  let margin = 15;
  let winW = 10;
  let winH = 15;
  let spacingX = 5;
  let spacingY = 10;
  
  // Determine how many windows fit in the building.
  let cols = floor((building.w - 2 * margin + spacingX) / (winW + spacingX));
  let rows = floor((building.h - 2 * margin + spacingY) / (winH + spacingY));
  let startX = building.x + margin;
  let startY = building.y + margin;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // 50% chance that a window is drawn.
      if (random() < 0.85) {
        if (ctx) {
          ctx.fill(winColor);
          ctx.noStroke();
          ctx.rect(
            startX + i * (winW + spacingX),
            startY + j * (winH + spacingY),
            winW,
            winH
          );
        } else {
          fill(winColor);
          noStroke();
          rect(
            startX + i * (winW + spacingX),
            startY + j * (winH + spacingY),
            winW,
            winH
          );
        }
      }
    }
  }
}

// Draws a sketchy, hand-drawn outline around a rectangle.
function drawSketchyOutline(ctx, x, y, w, h, iterations, jitter, strokeColor) {
  iterations = iterations || 3;
  jitter = jitter || 2;
  
  let begin, vertexFunc, end;
  if (ctx) {
    begin = ctx.beginShape.bind(ctx);
    vertexFunc = ctx.vertex.bind(ctx);
    end = ctx.endShape.bind(ctx);
    ctx.stroke(strokeColor);
    ctx.noFill();
  } else {
    stroke(strokeColor);
    noFill();
    begin = beginShape;
    vertexFunc = vertex;
    end = endShape;
  }
  
  let numPoints = 10; // Number of sample points per edge
  
  for (let i = 0; i < iterations; i++) {
    begin();
    // Top edge
    for (let j = 0; j <= numPoints; j++) {
      let px = lerp(x, x + w, j / numPoints);
      let py = y + random(-jitter, jitter);
      vertexFunc(px, py);
    }
    // Right edge
    for (let j = 0; j <= numPoints; j++) {
      let px = x + w + random(-jitter, jitter);
      let py = lerp(y, y + h, j / numPoints);
      vertexFunc(px, py);
    }
    // Bottom edge
    for (let j = 0; j <= numPoints; j++) {
      let px = lerp(x + w, x, j / numPoints);
      let py = y + h + random(-jitter, jitter);
      vertexFunc(px, py);
    }
    // Left edge
    for (let j = 0; j <= numPoints; j++) {
      let px = x + random(-jitter, jitter);
      let py = lerp(y + h, y, j / numPoints);
      vertexFunc(px, py);
    }
    end(CLOSE);
  }
}

