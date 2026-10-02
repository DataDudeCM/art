// 
// 3 body

let isLoopingFlag = false;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;

let img, uploadedImg;

let cols = 20;
let rows = 20;
let cellWidth, cellHeight;
let grid = [];
let borderSlider;
let borderThickness = 0;


function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(1000, 1000);

  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,360,100,100,100);

  frameRate(1);

  //pick color palette
  selectedPalette = palettes[int(random(3,11))]; //set selectedPalette to the one with index i
  //pick drawing colors from palette
  background(selectedPalette[4]);
  //background(color('White'));
  fillColor = color(selectedPalette[0]);
  fillColor = color('White');
  outlineColor = color(selectedPalette[0]);
  outlineColor = color('White');

  stroke(outlineColor);
  strokeWeight(12);
  fill(fillColor);
  //noFill();
    // Create a file‐input element and position it on the page
  // Used to upload an image into the browser
  const fileInput = createFileInput(handleFile);
  fileInput.position(width - 300, height + 10);

  borderSlider = createSlider(0, 40, borderThickness, 1);
  borderSlider.position(220, height + 10);
  borderSlider.style('width', '200px');

  //fnoLoop();

}

function draw() {
    background(selectedPalette[4]);
    background(color('White'));
    borderThickness = borderSlider.value();
    if (uploadedImg) {
        grid = [];
        img = uploadedImg; // Use the uploaded image
        // Resize the image so it fits within the canvas, preserving aspect ratio
        let scaleFactor = min(width / uploadedImg.width, height / uploadedImg.height);
        let w = uploadedImg.width * scaleFactor;
        let h = uploadedImg.height * scaleFactor;
        //image(img, (width - w) / 2, (height - h) / 2, w, h);
        img.resize(width, height);
        cellWidth = img.width / cols;
        cellHeight = img.height / rows;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            let x = i * cellWidth;
            let y = j * cellHeight;
            let w = cellWidth;
            let h = cellHeight;
            grid.push(img.get(x, y, w, h));
          }
        }

        //noStroke();
        //set number of images to mouse position x
        numimages = mouseX+10;
        //set random factor to mouse position y
        factor = map(mouseY,0,height,1,6);
        for (let i = 0; i < numimages; i++) { // Adjust the number of images you want to place on the canvas
            let imgIndex = int(random(grid.length));
            //let x = random(.2*width-cellWidth,.8*width - cellWidth);
            //let y = random(.2*height-cellHeight,.8*height - cellHeight);
            let x = random(0,width - cellWidth);
            let y = random(0,height - cellHeight);
            let w = cellWidth*random(1,factor);
            let h = cellHeight* random(1,factor);
            //let w = random(20,100);
            //let h = random(20,100);
            //strokeWeight((w+h)*.1);
            strokeWeight(borderThickness);
            rect(x,y,w,h);
            image(grid[imgIndex], x, y, w, h);
          }

        applyGrain(mainCanvas);

    } else {
      fill(0);
      textSize(16);
      text("Upload an image above ⬆︎", 10, height );
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
      save('city_' + timeStamp + 'png');
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