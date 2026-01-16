// Ensure these variables are at the top of your script
let gridN = 3;
let margin = 10;
let maxDepth = 2; 
let palette;
let grid = [];

function setup() {
  createCanvas(800, 800);
  
  palette = [
    color('#E63946'), color('#F1FAEE'), color('#A8DADC'), 
    color('#457B9D'), color('#1D3557')
  ];

  let cellSize = (width - (margin * (gridN + 1))) / gridN;

  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      let x = margin + i * (cellSize + margin);
      let y = margin + j * (cellSize + margin);

      let tl = createVector(x, y);
      let tr = createVector(x + cellSize, y);
      let br = createVector(x + cellSize, y + cellSize);
      let bl = createVector(x, y + cellSize);

      // Just create the objects. The class now handles the storage logic.
      grid.push(new MobileTriangle(tl, tr, bl, maxDepth));
      grid.push(new MobileTriangle(tr, br, bl, maxDepth));
    }
  }
}
function draw() {
  background(20); // Dark background to highlight the "breathing" forms
  
  // Update and Display all root triangles
  // We pass the static vertices of the root into the system
  for (let t of grid) {
    t.run();
  }
}

class MobileTriangle {
  constructor(a, b, c, depth) {
    this.depth = depth;

    // IF this is a Root triangle (top of the hierarchy), 
    // we MUST save the corners permanently because they never change.
    // We determine if it's a root by comparing depth to the global maxDepth.
    if (this.depth === maxDepth) {
      this.a = a.copy();
      this.b = b.copy();
      this.c = c.copy();
    }

    // Initialize P (the moving point) at the centroid
    this.p = createVector((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3);
    
    // Give P a random slow velocity
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
    
    // Assign a color
    this.col = random(palette);

    this.children = [];
    if (this.depth > 0) {
      // Create children. We pass references to current geometry for setup,
      // but the real geometry update happens in run().
      this.children.push(new MobileTriangle(a, b, this.p, depth - 1));
      this.children.push(new MobileTriangle(b, c, this.p, depth - 1));
      this.children.push(new MobileTriangle(c, a, this.p, depth - 1));
    }
  }

  // run() now accepts optional arguments. 
  // If arguments are missing, it uses the stored this.a/b/c (Root case).
  run(inA, inB, inC) {
    // 1. Determine the geometry for this frame
    let a = inA || this.a;
    let b = inB || this.b;
    let c = inC || this.c;

    // Safety check: If we still don't have vertices, stop to prevent crash
    if (!a || !b || !c) return;

    // 2. Update Physics of Point P
    this.p.add(this.vel);

    // 3. Collision Detection (Point in Triangle)
    if (!this.pointInTriangle(this.p, a, b, c)) {
      this.vel.mult(-1); 
      this.p.add(this.vel); // Nudge back
    }

    // 4. Draw or Recurse
    if (this.depth === 0) {
      noStroke();
      fill(this.col);
      triangle(a.x, a.y, b.x, b.y, c.x, c.y);
      stroke('Black');
      line(a.x,a.y, b.x, b.y);
      line(b.x,b.y,c.x,c.y);
      line(c.x,c.y,a.x,a.y);
    } else {
      // Pass the CURRENT geometry down to children
      // Child 1 uses Current A, Current B, and Moving P
      this.children[0].run(a, b, this.p);
      this.children[1].run(b, c, this.p);
      this.children[2].run(c, a, this.p);
    }
  }

  pointInTriangle(p, a, b, c) {
    // Standard Barycentric coordinates
    let as_x = p.x - a.x;
    let as_y = p.y - a.y;
    let s_ab = (b.x - a.x) * as_y - (b.y - a.y) * as_x > 0;
    
    if ((c.x - a.x) * as_y - (c.y - a.y) * as_x > 0 == s_ab) return false;
    if ((c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x) > 0 != s_ab) return false;
    return true;
  }
}