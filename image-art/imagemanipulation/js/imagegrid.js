//Converts an uploaded image into a grid of tiles with random rotations and borders.

let img;
let uploadedImg;
let gridSizeSlider;
let borderSlider;
let gridSize = 3;
let tileSize;
let borderThickness = 0;
let tiles = [];
let isLoopingFlag = true;

function setup() {
  createCanvas(800, 800);
  gridSizeSlider = createSlider(1, 25, gridSize, 1);
  gridSizeSlider.position(10, height + 10);
  gridSizeSlider.style('width', '200px');

  borderSlider = createSlider(0, 40, borderThickness, 1);
  borderSlider.position(220, height + 10);
  borderSlider.style('width', '200px');

  // Create a file‐input element and position it on the page
  // Used to upload an image into the browser
  const fileInput = createFileInput(handleFile);
  fileInput.position(width - 300, height + 10);

  frameRate(1);
}

function draw() {
  background('Black');
  gridSize = gridSizeSlider.value();
  borderThickness = borderSlider.value();

    // If an image has been uploaded, draw it centered
  if (uploadedImg) {
    img = uploadedImg; // Use the uploaded image
    // Resize the image so it fits within the canvas, preserving aspect ratio
    let scaleFactor = min(width / uploadedImg.width, height / uploadedImg.height);
    let w = uploadedImg.width * scaleFactor;
    let h = uploadedImg.height * scaleFactor;
    image(img, (width - w) / 2, (height - h) / 2, w, h);

  
    processImage();
    
    if (gridSize !== tiles.length ** 0.5) {
      processImage();
    }
    


    for (let t of tiles) {
      push();
      translate(t.x + tileSize / 2, t.y + tileSize / 2);
      rotate(t.rotation);

      // Draw border
      noFill();
      stroke('Black'); // Match background color
      strokeWeight(borderThickness);
      rectMode(CENTER);
      rect(0, 0, tileSize, tileSize);

      // Draw image
      noStroke();
      image(t.img, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
      pop();
    }

    // Draw outer border
    noFill();
    stroke('Black');
    strokeWeight(borderThickness);
    rectMode(CORNER);
    rect(0, 0, width, height);
    


  } else {
    fill(0);
    textSize(16);
    text("Upload an image above ⬆︎", 10, height / 2);
  }



  
}

function processImage() {
  tiles = [];
  img.resize(width, height);
  tileSize = width / gridSize;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let sx = x * tileSize;
      let sy = y * tileSize;
      let tile = img.get(sx, sy, tileSize, tileSize);

      tiles.push({
        img: tile,
        x: sx,
        y: sy,
        rotation: random([0, HALF_PI, PI, -HALF_PI]), // Random rotation (0, 90, 180, -90 degrees)
      });
    }
  }

  // Shuffle the tiles
  shuffle(tiles, true);

  // Reassign tiles to grid positions
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].x = (i % gridSize) * tileSize;
    tiles[i].y = floor(i / gridSize) * tileSize;
  }
}

function keyReleased() {
    if (key == 'p' || key == 'P') {
        if (isLoopingFlag) {
        isLoopingFlag = false;
        noLoop()
        } else {
        isLoopingFlag = true;
        loop();
        }
    }
}

// This callback fires when a file is selected/uploaded
function handleFile(file) {
  // Check that it's an image
  if (file.type === 'image') {
    // loadImage can take a p5.File data URI
    uploadedImg = loadImage(file.data, 
      () => {
        console.log("Image loaded successfully!");
      },
      (err) => {
        console.error("Failed to load image:", err);
      }
    );
  } else {
    // If it’s not an image, clear any previous upload
    uploadedImg = null;
    console.warn("Please upload a valid image file (jpg, png, etc.)");
  }
}