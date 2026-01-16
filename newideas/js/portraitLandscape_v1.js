let img;
let gridCells = [];
let cellSize = 24;        // each grid cell is 8x8 pixels
let heightScale = .75;     // adjust this if you want taller/shorter columns

function preload() {
  // Replace 'portrait.jpg' with your portrait image path
  img = loadImage('../images/doodle2.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  
  // Ensure the image's pixel array is loaded
  img.loadPixels();
  
  // Loop through the image in blocks of cellSize x cellSize pixels
  for (let y = 0; y < img.height; y += cellSize) {
    for (let x = 0; x < img.width; x += cellSize) {
      let sumR = 0, sumG = 0, sumB = 0;
      let count = 0;
      
      // Handle edge cases if image dimensions aren't multiples of cellSize
      let cellW = min(cellSize, img.width - x);
      let cellH = min(cellSize, img.height - y);
      
      // Sum up the color values for each pixel in the cell
      for (let j = 0; j < cellH; j++) {
        for (let i = 0; i < cellW; i++) {
          let px = x + i;
          let py = y + j;
          let index = (py * img.width + px) * 4;
          sumR += img.pixels[index];
          sumG += img.pixels[index + 1];
          sumB += img.pixels[index + 2];
          count++;
        }
      }
      
      // Calculate the average color components
      let avgR = sumR / count;
      let avgG = sumG / count;
      let avgB = sumB / count;
      
      // Compute brightness using the luminance formula
      let avgBrightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
      
      // Store this cell's data. We'll map the image's y to the z-axis.
      gridCells.push({
        x: x,
        y: y, // we'll treat this as the z coordinate later
        avgColor: color(avgR, avgG, avgB),
        avgBrightness: avgBrightness
      });
    }
  }
}

function draw() {
  background(200);
  
    orbitControl(); // allows mouse-controlled rotation
  scale(1, -1, 1);
  //console.log("Camera position:", cam.eyeX, cam.eyeY, cam.eyeZ);



  // Set up some basic lighting
  ambientLight(150);
  directionalLight(255, 255, 255, 0, -1, 0);

  // Translate so the grid is centered in the scene.
  // Here, x and z correspond to the image's width and height.
  translate(-img.width / 2, 0, -img.height / 2);
  
  // Draw each cell as a 3D box (column)
  for (let cell of gridCells) {
    let col = cell.avgColor;
    // Height is directly proportional to brightness (scaled by heightScale)
    let h = cell.avgBrightness * heightScale;
    
    push();
      // Translate to the cell's center. We add half cellSize because the box is drawn from its center.
      // We also shift upward by h/2 so that the base of the column sits on y = 0.
      translate(cell.x + cellSize / 2, h / 2, cell.y + cellSize / 2);
      //translate(cell.x + cellSize / 2, h / 2, img.height - (cell.y + cellSize / 2));
      fill(col);
      box(cellSize, h, cellSize);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
