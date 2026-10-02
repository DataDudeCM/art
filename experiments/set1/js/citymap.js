//let map;
let masonData;
let roads = [];

// Fetch OpenStreetMap Data
function fetchOSMData() {
  const masonBBox = "39.3507,-84.3523,39.480,-84.3132"; // Bounding box for Mason, OH
  const url = `https://overpass-api.de/api/interpreter?data=[out:json];way(${masonBBox})[highway];(._;>;);out;`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      masonData = data;
      processMapData();
    });
}

// Process OSM Data into a usable format
function processMapData() {
  const nodes = {};
  masonData.elements.forEach((el) => {
    if (el.type === "node") {
      nodes[el.id] = [el.lat, el.lon];
    }
  });

  masonData.elements.forEach((el) => {
    if (el.type === "way") {
      const wayPoints = el.nodes.map((id) => nodes[id]);
      roads.push(wayPoints);
    }
  });
  redraw(); // Re-draw the canvas with roads
}

function setup() {
  createCanvas(800, 800);
  background('White');
  noLoop();
  fetchOSMData(); // Fetch data
}

function draw() {
  background('White');
  translate(width / 2, height / 2);

  // Draw roads if available
  stroke('Black');
  noFill();
  roads.forEach((road) => {
    beginShape();
    road.forEach(([lat, lon]) => {
      const x = map(lon, -84.3623, -84.3232, -400, 400); // Adjust bounding box
      const y = map(lat, 39.3607, 39.3680, 400, -400); // Adjust bounding box
      vertex(x, y);
    });
    endShape();
  });
}
