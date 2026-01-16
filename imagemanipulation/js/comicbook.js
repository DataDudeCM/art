//
// Comic Book Style Image Manipulation with Recursive Panel Division
// 

let sourceImg;

function preload() {
  // REPLACE 'your_photo.jpg' with one of your actual image files
  sourceImg = loadImage('../images/fracture.png'); 
}

function setup() {
  createCanvas(800, 800);
  noLoop(); // We only want to generate a new "page" on click
  
  // Resize image to fit calculations if needed, or keep original
  sourceImg.resize(800, 0); 
}

function draw() {
  background(240); // Paper-ish off-white background
  
  // Draw a thick border for the whole page
  stroke(20);
  strokeWeight(4);
  noFill();
  rect(0, 0, width, height);
  
  // Start the recursion
  // Arguments: x, y, width, height, recursion depth
  divideRect(10, 10, width - 20, height - 20, 4);
}

function divideRect(x, y, w, h, depth) {
  // Stop recursion if we go too deep or if the rectangle is too small
  if (depth === 0 || w < 100 || h < 100) {
    drawPanel(x, y, w, h);
    return;
  }

  // Randomly decide to split or just draw the panel here
  // 10% chance to stop early for variation in panel sizes
  if (random() < 0.1) {
    drawPanel(x, y, w, h);
    return;
  }

  // Decide split direction (Horizontal or Vertical)
  // We prefer splitting along the longer axis to keep things balanced
  let splitHoriz = w > h; 
  if (w == h) splitHoriz = random() > 0.5;

  if (splitHoriz) {
    // Split vertically (creating two side-by-side panels)
    let splitW = random(0.3, 0.7) * w;
    divideRect(x, y, splitW, h, depth - 1);
    divideRect(x + splitW, y, w - splitW, h, depth - 1);
  } else {
    // Split horizontally (creating top and bottom panels)
    let splitH = random(0.3, 0.7) * h;
    divideRect(x, y, w, splitH, depth - 1);
    divideRect(x, y + splitH, w, h - splitH, depth - 1);
  }
}

function drawPanel(x, y, w, h) {
  // 1. Create a gap between panels (gutter)
  let gutter = 5;
  let px = x + gutter;
  let py = y + gutter;
  let pw = w - gutter * 2;
  let ph = h - gutter * 2;

  // 2. Pick a random source location from the image
  // This creates the "narrative" confusion - distinct moments rearranged
  let sx = random(0, sourceImg.width - pw);
  let sy = random(0, sourceImg.height - ph);

  // 3. Get the crop
  let crop = sourceImg.get(sx, sy, pw, ph);

  // 4. Apply "Arcane" / Comic style processing to the crop
  // Note: Doing pixel processing in real-time can be slow. 
  // For better performance, pre-process the source image in setup().
  crop.filter(POSTERIZE, 4); // Reduce colors to look painted
  // crop.filter(GRAY); // Optional: if you want a noir look

  // 5. Draw the image
  image(crop, px, py);

  // 6. Draw the panel border (ink line)
  noFill();
  stroke(20);
  strokeWeight(3);
  rect(px, py, pw, ph);
}

function mousePressed() {
  // Click to generate a new story layout
  redraw();
}

function keyPressed() {
  // Save the work if you like it
  if (key === 's') {
    saveCanvas('recursive_story', 'png');
  }
}