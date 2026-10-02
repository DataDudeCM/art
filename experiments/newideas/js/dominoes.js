let dominoes = [];
let used;
let cellSize = 50;
let cols, rows;
let offsetX, offsetY;
let gap = 4; // gap between dominoes

function setup() {
  createCanvas(800, 800);
  cols = floor(width / cellSize);
  rows = floor(height / cellSize);
  offsetX = (width - cols * cellSize) / 2;
  offsetY = (height - rows * cellSize) / 2;
  frameRate(2);
  
}

// Determines if a grid cell (i, j) is within an irregular, jagged boundary.
function insideMask(i, j) {
  let cx = offsetX + i * cellSize + cellSize / 2;
  let cy = offsetY + j * cellSize + cellSize / 2;
  let d = dist(cx, cy, width / 2, height / 2);
  let angle = atan2(cy - height / 2, cx - width / 2);
  
  let baseRadius = min(width, height) * random(0.2,0.4);
  let amplitude = random(100,1000); //100 is default
  let noiseScale = random(1,500); //3 is default
  let noiseVal = noise(cos(angle) * noiseScale, sin(angle) * noiseScale);
  let r_max = baseRadius + map(noiseVal, 0, 1, -amplitude, amplitude);
  
  return d < r_max;
}

// Maps the number of pips to a specific color.
function getPipColor(num) {
  switch(num) {
    case 1: return color(255, 0, 0);     // Red
    case 2: return color(0, 155, 0);     // Green
    case 3: return color(0, 0, 255);     // Blue
    case 4: return color(255, 165, 0);   // Orange
    case 5: return color(128, 0, 128);   // Purple
    case 6: return color(0, 155, 255);   // Cyan
    default: return color(0);
  }
}

// Draws classic dice pips in a square region for a given number (1–6) using the pip color.
function drawPips(x, y, s, num) {
  push();
  let pipSize = s * 0.15;
  fill(getPipColor(num));
  noStroke();
  
  let positions = {};
  positions[1] = [{ x: x + s * 0.5, y: y + s * 0.5 }];
  positions[2] = [{ x: x + s * 0.25, y: y + s * 0.25 }, { x: x + s * 0.75, y: y + s * 0.75 }];
  positions[3] = [{ x: x + s * 0.25, y: y + s * 0.25 }, { x: x + s * 0.5, y: y + s * 0.5 }, { x: x + s * 0.75, y: y + s * 0.75 }];
  positions[4] = [{ x: x + s * 0.25, y: y + s * 0.25 }, { x: x + s * 0.75, y: y + s * 0.25 },
                  { x: x + s * 0.25, y: y + s * 0.75 }, { x: x + s * 0.75, y: y + s * 0.75 }];
  positions[5] = [{ x: x + s * 0.25, y: y + s * 0.25 }, { x: x + s * 0.75, y: y + s * 0.25 },
                  { x: x + s * 0.5, y: y + s * 0.5 },
                  { x: x + s * 0.25, y: y + s * 0.75 }, { x: x + s * 0.75, y: y + s * 0.75 }];
  positions[6] = [{ x: x + s * 0.25, y: y + s * 0.25 }, { x: x + s * 0.75, y: y + s * 0.25 },
                  { x: x + s * 0.25, y: y + s * 0.5  }, { x: x + s * 0.75, y: y + s * 0.5  },
                  { x: x + s * 0.25, y: y + s * 0.75 }, { x: x + s * 0.75, y: y + s * 0.75 }];
  
  for (let pos of positions[num]) {
    ellipse(pos.x, pos.y, pipSize, pipSize);
  }
  pop();
}

function draw() {
  background('LightBlue');
  dominoes = [];
  
  // Initialize grid tracking
  used = new Array(cols);
  for (let i = 0; i < cols; i++) {
    used[i] = new Array(rows).fill(false);
  }
  
  // Gather grid cells sorted by distance from the canvas center
  cells = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let cx = offsetX + i * cellSize + cellSize / 2;
      let cy = offsetY + j * cellSize + cellSize / 2;
      let d = dist(cx, cy, width / 2, height / 2);
      cells.push({ i, j, d });
    }
  }
  cells.sort((a, b) => a.d - b.d);

  // Place dominoes (each domino covers 2 adjacent cells)
  for (let cell of cells) {
    let i = cell.i;
    let j = cell.j;
    if (used[i][j]) continue;
    if (!insideMask(i, j)) continue;
    
    // Randomly choose an orientation
    let orientation = random() < 0.5 ? "horizontal" : "vertical";
    let placed = false;
    if (orientation === "horizontal") {
      if (i + 1 < cols && !used[i + 1][j] && insideMask(i + 1, j)) {
        dominoes.push({ 
          i, 
          j, 
          orientation, 
          pipA: floor(random(1, 7)), 
          pipB: floor(random(1, 7)) 
        });
        used[i][j] = true;
        used[i + 1][j] = true;
        placed = true;
      }
    }
    if (!placed && orientation === "vertical") {
      if (j + 1 < rows && !used[i][j + 1] && insideMask(i, j + 1)) {
        dominoes.push({ 
          i, 
          j, 
          orientation, 
          pipA: floor(random(1, 7)), 
          pipB: floor(random(1, 7)) 
        });
        used[i][j] = true;
        used[i][j + 1] = true;
        placed = true;
      }
    }
    // If the preferred orientation didn't work, try the other.
    if (!placed) {
      if (orientation === "horizontal") {
        if (j + 1 < rows && !used[i][j + 1] && insideMask(i, j + 1)) {
          dominoes.push({ 
            i, 
            j, 
            orientation: "vertical", 
            pipA: floor(random(1, 7)), 
            pipB: floor(random(1, 7)) 
          });
          used[i][j] = true;
          used[i][j + 1] = true;
          placed = true;
        }
      } else {
        if (i + 1 < cols && !used[i + 1][j] && insideMask(i + 1, j)) {
          dominoes.push({ 
            i, 
            j, 
            orientation: "horizontal", 
            pipA: floor(random(1, 7)), 
            pipB: floor(random(1, 7)) 
          });
          used[i][j] = true;
          used[i + 1][j] = true;
          placed = true;
        }
      }
    }
  }
  
  //noLoop();
  
  // Draw each domino with a drop shadow
  for (let d of dominoes) {
    push();
    // Set basic style for domino background
    fill(255);
    stroke(0);
    strokeWeight(3);
    
    let x = offsetX + d.i * cellSize;
    let y = offsetY + d.j * cellSize;
    
    // Calculate drawing boundaries with gap
    if (d.orientation === "horizontal") {
      let boxW = cellSize * 2;
      let boxH = cellSize;
      let x_draw = x + gap / 2;
      let y_draw = y + gap / 2;
      let w_draw = boxW - gap;
      let h_draw = boxH - gap;
      
      // Set drop shadow for the domino shape
      drawingContext.shadowOffsetX = 5;
      drawingContext.shadowOffsetY = 5;
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
      
      // Draw the domino background and divider line with shadow
      strokeWeight(2);
      rect(x_draw, y_draw, w_draw, h_draw, 5);
      
      // Disable shadow for pips
      drawingContext.shadowColor = 'rgba(0,0,0,0)';
      
      strokeWeight(2);
      rect(x_draw, y_draw, w_draw, h_draw, 5);
      strokeWeight(3);
      line(x_draw + w_draw / 2, y_draw+gap*2, x_draw + w_draw / 2, y_draw + h_draw - gap*2);

      // Left half pips (color based on d.pipA)
      let s_left = min(w_draw / 2, h_draw);
      let offsetX_left = x_draw + (w_draw / 2 - s_left) / 2;
      let offsetY_left = y_draw + (h_draw - s_left) / 2;
      drawPips(offsetX_left, offsetY_left, s_left, d.pipA);
      
      // Right half pips (color based on d.pipB)
      let s_right = s_left;
      let offsetX_right = x_draw + w_draw / 2 + (w_draw / 2 - s_right) / 2;
      let offsetY_right = y_draw + (h_draw - s_right) / 2;
      drawPips(offsetX_right, offsetY_right, s_right, d.pipB);
      
    } else { // vertical orientation
      let boxW = cellSize;
      let boxH = cellSize * 2;
      let x_draw = x + gap / 2;
      let y_draw = y + gap / 2;
      let w_draw = boxW - gap;
      let h_draw = boxH - gap;
      
      // Set drop shadow for the domino shape
      drawingContext.shadowOffsetX = 5;
      drawingContext.shadowOffsetY = 5;
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
      
      strokeWeight(2);
      rect(x_draw, y_draw, w_draw, h_draw, 5);

      // Disable shadow for the pips
      drawingContext.shadowColor = 'rgba(0,0,0,0)';
      strokeWeight(2);
      rect(x_draw, y_draw, w_draw, h_draw, 5);
      strokeWeight(3);
      line(x_draw + gap *2, y_draw + h_draw / 2, x_draw + w_draw - gap*2, y_draw + h_draw / 2);

      
      // Top half pips (color based on d.pipA)
      let s_top = min(w_draw, h_draw / 2);
      let offsetX_top = x_draw + (w_draw - s_top) / 2;
      let offsetY_top = y_draw + (h_draw / 2 - s_top) / 2;
      drawPips(offsetX_top, offsetY_top, s_top, d.pipA);
      
      // Bottom half pips (color based on d.pipB)
      let s_bot = s_top;
      let offsetX_bot = x_draw + (w_draw - s_bot) / 2;
      let offsetY_bot = y_draw + h_draw / 2 + (h_draw / 2 - s_bot) / 2;
      drawPips(offsetX_bot, offsetY_bot, s_bot, d.pipB);
    }
    pop();
  }
}
