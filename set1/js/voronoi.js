// Make sure to include d3.js in your project
// <script src="https://d3js.org/d3.v4.min.js"></script>

let points = [];

function setup() {
  createCanvas(600, 600);
  noLoop();

  // Generate random points
  for (let i = 0; i < 20; i++) {
    points.push([random(width), random(height)]);
  }

  drawVoronoi();
}

function drawVoronoi() {
  // Create Voronoi generator using d3
  const voronoi = d3.voronoi().extent([[0, 0], [width, height]]);
  const diagram = voronoi(points);
  
  // Draw each cell
  for (let cell of diagram.polygons()) {
    beginShape();
    for (let [x, y] of cell) {
      vertex(x, y);
    }
    endShape(CLOSE);
  }

  // Draw points
  fill(255, 0, 0);
  for (let [x, y] of points) {
    ellipse(x, y, 5, 5);
  }
}
