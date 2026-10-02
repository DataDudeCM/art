let cols = 100;
let rows = 100;
let wave = [];
let flying = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function draw() {
  background(20, 30, 70);
  
  // Debug cube — remove once you're seeing the mesh
  // rotateY(frameCount * 0.01);
  // push();
  //   noFill();
  //   stroke(255);
  //   box(100);
  // pop();
  
  // build the height map
  flying -= 0.05;
  let yoff = flying;
  for (let y = 0; y < rows; y++) {
    wave[y] = [];
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      wave[y][x] = map(noise(xoff, yoff), 0, 1, -30, 30);
      xoff += 0.2;
    }
    yoff += 0.2;
  }

  // parameters
  let cellW = width  / cols;
  let cellH = height / rows;
  let turquoise = color(64, 224, 208);
  let white     = color(255);

  // position & tilt
  push();
    // move mesh down a bit and back toward camera
    translate(0, 100, -200);
    rotateX(PI / 3);

    // draw quads as two triangles each
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        // compute the four corners centered at (0,0)
        let x1 = (x    - cols/2) * cellW,
            y1 = (y    - rows/2) * cellH,
            z1 = wave[y][  x];
        let x2 = (x+1  - cols/2) * cellW,
            y2 = y1,
            z2 = wave[y][x+1];
        let x3 = x1,
            y3 = (y+1 - rows/2) * cellH,
            z3 = wave[y+1][x];
        let x4 = x2,
            y4 = y3,
            z4 = wave[y+1][x+1];

        // triangle #1
        let avg1 = (z1 + z3 + z2) / 3;
        let t1   = constrain(map(avg1, -30, 30, 0, 1), 0, 1);
        fill( lerpColor(turquoise, white, t1) );
        beginShape();
          vertex(x1, y1, z1);
          vertex(x3, y3, z3);
          vertex(x2, y2, z2);
        endShape(CLOSE);

        // triangle #2
        let avg2 = (z2 + z3 + z4) / 3;
        let t2   = constrain(map(avg2, -30, 30, 0, 1), 0, 1);
        fill( lerpColor(turquoise, white, t2) );
        beginShape();
          vertex(x2, y2, z2);
          vertex(x4, y4, z4);
          vertex(x3, y3, z3);
        endShape(CLOSE);
      }
    }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
