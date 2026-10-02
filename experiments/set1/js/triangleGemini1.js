/**
 * Recursive Triangle Grid System
 * Concepts: Recursive Subdivision, Barycentric Coordinates, Grid Rhythm
 */

let gridN = 3;           // NxN grid
let margin = 10;         // Margin between squares
let maxDepth = 3;        // Recursion depth
let palette;

function setup() {
  createCanvas(800, 800);
  //noLoop();
  frameRate(5);
  
  // A palette inspired by Bauhaus textiles (Anni Albers)
  palette = [
    color('#2E294E'), // Dark Slate
    color('#EFBCD5'), // Pale Pink
    color('#BE97C6'), // Lilac
    color('#4B5267'), // Steel
    color('#8661C1')  // Violet
  ];
}

function draw() {
  background(240); // Off-white canvas for contrast
  
  // Calculate the size of each cell accounting for margins
  // Total width = (n * size) + ((n+1) * margin)
  // Therefore: size = (width - (n+1)*margin) / n
  let cellSize = (width - (margin * (gridN + 1))) / gridN;

  // Begin batch rendering for performance
  noStroke();
  beginShape(TRIANGLES);

  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      let x = margin + i * (cellSize + margin);
      let y = margin + j * (cellSize + margin);

      // Define the four corners of the square
      let tl = createVector(x, y);
      let tr = createVector(x + cellSize, y);
      let br = createVector(x + cellSize, y + cellSize);
      let bl = createVector(x, y + cellSize);

      // Split square into two initial triangles
      // Triangle 1: Top-Left, Top-Right, Bottom-Left
      subdivideTriangle(tl, tr, bl, maxDepth);
      // Triangle 2: Top-Right, Bottom-Right, Bottom-Left
      subdivideTriangle(tr, br, bl, maxDepth);
    }
  }
  endShape();
}

/**
 * Recursive function to split triangles
 * @param {p5.Vector} a - Vertex A
 * @param {p5.Vector} b - Vertex B
 * @param {p5.Vector} c - Vertex C
 * @param {Number} depth - Current recursion depth
 */
function subdivideTriangle(a, b, c, depth) {
  if (depth === 0) {
    // Base case: Add vertices to the batch
    // We pick a color based on the triangle's position or noise
    let col = random(palette);
    fill(col);
    // Note: In beginShape/endShape, fill() usually needs to be set per vertex 
    // or we break the shape. For pure efficiency with varying colors, 
    // standard triangle() is simpler, but let's stick to the prompt's structural needs.
    // *Correction*: To color individual triangles in a batch, we'd need distinct begin/end 
    // or vertex coloring (WEBGL). For 2D compatibility, we will momentarily break batching 
    // for color assignment, or use a texture atlas. 
    // For this starting point, let's use the direct draw method which is plenty fast 
    // for this specific complexity level.
    
    triangle(a.x, a.y, b.x, b.y, c.x, c.y);
    return;
  }

  // Generate a random point P inside the triangle
  // Using barycentric coordinate logic for uniform distribution
  let r1 = random();
  let r2 = random();
  let sqrtR1 = sqrt(r1);

  let p = p5.Vector.add(
    p5.Vector.mult(a, 1 - sqrtR1),
    p5.Vector.add(
      p5.Vector.mult(b, sqrtR1 * (1 - r2)),
      p5.Vector.mult(c, sqrtR1 * r2)
    )
  );

  // Recursively call for the 3 new triangles formed by P
  subdivideTriangle(a, b, p, depth - 1);
  subdivideTriangle(b, c, p, depth - 1);
  subdivideTriangle(c, a, p, depth - 1);
}

function mousePressed() {
  redraw(); // Click to regenerate
}