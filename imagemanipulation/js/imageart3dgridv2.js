let img;
let uploadedImg;
let slices = [];
let imageReady = false; // Flag to indicate if the image is ready
let firstTime = true; // Flag to build grid only once after image upload

// UI elements
let cellSlider;    // controls tile size
let borderSlider;  // controls white‐border thickness
let sizeToggle;    // toggles uniform vs. varied scaling
let zSlider;       // controls maximum Z‐offset

function preload() {
  // ─── Replace this with your own image path or URL ───
  //img = loadImage('../images/bridance.jpg');
  // img = loadImage('../images/doodle4.jpg'); // Example image
}

function setup() {
  createCanvas(900, 900, WEBGL);
  noStroke();

  // Create a file‐input element and position it on the page
  // Used to upload an image into the browser
  const fileInput = createFileInput(handleFile);
  fileInput.position(width - 300, height + 10);

  // ─── “Cell Size” slider (10px → 200px, default 50px) ───
  cellSlider = createSlider(40, 400, 80, 1);
  cellSlider.style('width', '150px');
  cellSlider.position(10, height + 10);
  cellSlider.input(buildGrid);

  // ─── “Border Width” slider (0px → 50px, default 5px) ───
  borderSlider = createSlider(0, 50, 5, 1);
  borderSlider.style('width', '150px');
  borderSlider.position(10, height + 40);
  // (no rebuild needed when this changes)

  // ─── “Varied Size” checkbox ───
  // OFF → each tile draws at baseSize × 1.0  
  // ON  → each tile draws at baseSize × random(0.5 … 1.5)
  sizeToggle = createCheckbox('Varied Size', false);
  sizeToggle.position(10, height + 70);
  sizeToggle.changed(applyVariedSizes);

  // ─── “Max Z” slider (0px → 500px, default 200px) ───
  // As you slide from 0 to 500, each tile’s Z is re‐randomized in [−maxZ…+maxZ].
  zSlider = createSlider(0, 500, 200, 1);
  zSlider.style('width', '150px');
  zSlider.position(10, height + 100);
  zSlider.input(updateZPositions);




}

function buildGrid() {
  slices = [];
  let baseSize = cellSlider.value();
  let maxZ = zSlider.value();

  // How many columns/rows fit into the original image?
  let cols = floor(img.width  / baseSize);
  let rows = floor(img.height / baseSize);
  if (cols < 1 || rows < 1) {
    return; // too big → no tiles
  }

  // Compute total grid width/height, so we can center it at (0,0) in WEBGL:
  let gridW = cols * baseSize;
  let gridH = rows * baseSize;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Perfectly even grid (no half‐cell offset):
      let x = (i + 0.5) * baseSize - gridW / 2;
      let y = (j + 0.5) * baseSize - gridH / 2;
      let z = random(-maxZ, maxZ);

      // Extract that sub‐image into an offscreen p5.Graphics buffer:
      let tileImg = createGraphics(baseSize, baseSize);
      tileImg.image(
        img,
        0,
        0,                // draw into top‐left of tileImg
        baseSize,
        baseSize,         // draw size = baseSize × baseSize
        i * baseSize,
        j * baseSize,     // source x,y in the original image
        baseSize,
        baseSize          // source w,h
      );

      // Start with scale = 1.0 (uniform). We’ll adjust if “Varied Size” is ON.
      slices.push({
        img:       tileImg,
        x:         x,
        y:         y,
        z:         z,
        baseSize:  baseSize,
        scale:     1.0
      });
    }
  }

  // If “Varied Size” was already checked, randomize each tile’s scale now:
  if (sizeToggle.checked()) {
    applyVariedSizes();
  }
}

function applyVariedSizes() {
  // When toggled ON → scale each slice = random(0.5 … 1.5)  
  // When OFF → reset all scales to 1.0
  if (sizeToggle.checked()) {
    for (let s of slices) {
      s.scale = random(0.5, 2);
    }
  } else {
    for (let s of slices) {
      s.scale = 1.0;
    }
  }
}

function updateZPositions() {
  // Called whenever the “Max Z” slider moves.
  // Re‐randomize each slice’s z in [−maxZ … +maxZ].
  let maxZ = zSlider.value();
  for (let s of slices) {
    s.z = random(-maxZ, maxZ);
    //s.z = s.z + (250-zSlider.value());
  }
}

// This callback fires when a file is selected/uploaded
function handleFile(file) {
  // Check that it's an image
  if (file.type === 'image') {
    // loadImage can take a p5.File data URI
    uploadedImg = loadImage(file.data, 
      () => {
        imageReady = true; // Set a flag to indicate the image is ready
        firstTime = true;
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

function draw() {
  background(0);
        // simple light so textures aren’t flat


  if (imageReady) {
      // Build the initial grid (uniform, with Z from zSlider’s default of 200)
    img = uploadedImg; // Use the uploaded image
    if (firstTime) { buildGrid(); firstTime = false; };
    
    orbitControl();         // click‐drag to rotate, scroll to zoom
    ambientLight(400);


    let border = borderSlider.value();

    for (let s of slices) {
      let drawSize = s.baseSize * s.scale;

      // 1) White border (if border > 0)
      if (border > 0) {
        push();
        translate(s.x, s.y, s.z);
        noStroke();
        fill(0);
        plane(drawSize + 2 * border, drawSize + 2 * border);
        //sphere(drawSize +2 * border);
        pop();
      }

      // 2) The textured tile “in front” by 0.1 in Z (to avoid z‐fighting)
      push();
      translate(s.x, s.y, s.z + 0.1);
      noStroke();
      texture(s.img);
      plane(drawSize, drawSize);
      //sphere(drawSize);
      pop();
    }



  }
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 'l' || key == 'L') {
    if (isLoopingFlag) {
      isLoopingFlag = false;
      noLoop()
    } else {
      isLoopingFlag = true;
      loop();
    }
  }
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('imageart3d_' + timeStamp + 'png');
    }
}

