let uploadedImg;

function setup() {
  createCanvas(400, 400);
  background(220);
  
  // Create a file‐input element and position it on the page
  const fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);
}

function draw() {
  background(220);
  
  // If an image has been uploaded, draw it centered
  if (uploadedImg) {
    // Resize the image so it fits within the canvas, preserving aspect ratio
    let scaleFactor = min(width / uploadedImg.width, height / uploadedImg.height);
    let w = uploadedImg.width * scaleFactor;
    let h = uploadedImg.height * scaleFactor;
    image(uploadedImg, (width - w) / 2, (height - h) / 2, w, h);
  } else {
    fill(0);
    textSize(16);
    text("Upload an image above ⬆︎", 10, height / 2);
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
