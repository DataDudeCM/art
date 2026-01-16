let img;
let cols = 50;
let rows = 50;
let scale = 20; // spacing between grid points

function preload() {
  // Load your image (make sure the path is correct)
  img = loadImage('../images/portrait.jpg');
}

function setup() {
  createCanvas(600, 600, WEBGL);
  noStroke();
}

function draw() {
  background(220);

    // Create an options object.
    let options = {
      disableTouchActions: false,
      freeRotation: true
    };
  
    // Enable orbiting with the mouse.
    // Prevent accidental touch actions on touchscreen devices
    // and enable free rotation.
    orbitControl(1, 1, 1, options);
  
  
    // Set up some basic lighting
    ambientLight(120);
    directionalLight(255, 255, 255, 0, 1, 0);
  
  // Rotate the scene to better view the surface
  rotateX(PI / 3);
  rotateZ(frameCount * 0.01);
  
  // Apply the texture (the image) to the surface
  texture(img);
  
  // Build the sine wave surface with a triangle strip mesh
  for (let x = 0; x < cols - 1; x++) {
    beginShape(TRIANGLE_STRIP);
    // Loop over each row in the grid
    for (let y = 0; y < rows; y++) {
      // Calculate positions for the current and next column
      let xPos1 = (x - cols / 2) * scale;
      let xPos2 = ((x + 1) - cols / 2) * scale;
      let yPos = (y - rows / 2) * scale;
      
      // Displace vertices along z using a sine function for the wave effect
      let zPos1 = sin(x * 0.3 + y * 0.2) * 40;
      let zPos2 = cos((x + 1) * 0.3 + y * 0.2) * 40;
      
      // Map texture coordinates based on grid position
      // u and v should cover the image dimensions
      let u1 = x / cols;
      let u2 = (x + 1) / cols;
      let v = y / rows;
      
      // Add vertices with associated texture coordinates
      vertex(xPos1, yPos, zPos1, u1 * img.width, v * img.height);
      vertex(xPos2, yPos, zPos2, u2 * img.width, v * img.height);
    }
    endShape();
  }
}
