// Array to store all drops of ink
let drops = [];

function setup() {
  createCanvas(1000, 1000);

  // Add 20 ink drops at the center of the canvas
  for (let i = 0; i < 40; i++) {
    addInk(width/2, height/2, 50);
  }

  // Add 50 ink drops at random positions on the canvas
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
    let r = random(10, 100);
    addInk(x, y, r);
  }
}

// Track the start of mouse drag
let start;

// Record the starting point
function mousePressed() {
  start = createVector(mouseX, mouseY);
}

// Handle mouse drag to simulate ink spreading
function mouseDragged() {
  // Calculate vector from start to current mouse position
  let end = createVector(mouseX, mouseY);
  end.sub(start);
  end.normalize();

  // Simulate tine effects based on the mouse drag
  tineLine(end, mouseX, mouseY, 2, 16);
}

// Apply tine effects to ink drops
function tineLine(v, x, y, z, c) {
  // Apply the effect to each drop
  for (let drop of drops) {
    drop.tine(v, x, y, z, c);
  }
}

// Add an ink drop to the canvas
function addInk(x, y, r) {
  // Create a new Drop object
  let drop = new Drop(x, y, r);

  // Interact new drop with all existing drops
  for (let other of drops) {
    other.marble(drop);
  }

  // Add the new drop to the array of drops
  drops.push(drop);
}

function draw() {
  background(255);
  for (let drop of drops) {
    drop.show();
  }
}

