let img;

function preload() {
  img = loadImage('../images/circleFlow.png'); 
}

function setup() {
  createCanvas(800, 800, WEBGL);
  img.resize(200, 200); // Resize for performance; each pixel is a 3D vertex
}

function draw() {
  background(0);
  orbitControl(); // Allows you to drag and see the 3D effect
  
  rotateX(PI/3);
  img.loadPixels();
  
  let skip = 1; // Increase to render faster
  for (let y = 0; y < img.height; y += skip) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < img.width; x += skip) {
      let index = (x + y * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      
      // Calculate brightness for Z-axis
      let bright = (r + g + b) / 3;
      let z = map(bright, 0, 255, 0, 20); // Extrude up to 150px
      
      fill(r, g, b);
      noStroke();
      
      // Map x,y to 3D space
      let vx = map(x, 0, img.width, -width/2, width/2);
      let vy = map(y, 0, img.height, -height/2, height/2);
      
      vertex(vx, vy, z);
      
      // Calculate next row for the triangle strip
      let indexNext = (x + (y + skip) * img.width) * 4;
      let zNext = map((img.pixels[indexNext] + img.pixels[indexNext+1] + img.pixels[indexNext+2])/3, 0, 255, 0, 20);
      vertex(vx, map(y + skip, 0, img.height, -height/2, height/2), zNext);
    }
    endShape();
  }
}