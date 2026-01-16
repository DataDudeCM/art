// Pixel Sort using p5.js
let img;
let sortedImg;
let sortMode = "row"; // "row" or "column"

function preload() {
  img = loadImage('images/doodle3.jpg'); // Replace with your image path
}

function setup() {
  createCanvas(img.width, img.height);
  sortedImg = createImage(img.width, img.height);
  img.loadPixels();
  sortedImg.loadPixels();
  pixelSort();
}

function draw() {
  image(sortedImg, 0, 0);
  noLoop();
}

function pixelSort() {
  sortedImg.loadPixels(); // Ensure sortedImg is ready for pixel manipulation

  if (sortMode === "row") {
    for (let y = 0; y < img.height; y++) {
      let rowPixels = [];
      for (let x = 0; x < img.width; x++) {
        let index = (y * img.width + x) * 4;
        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];
        rowPixels.push({ r, g, b, index });
      }

      // Sort row by brightness
      rowPixels.sort((a, b) => brightness(color(a.r, a.g, a.b)) - brightness(color(b.r, b.g, b.b)));

      // Write sorted pixels back
      for (let x = 0; x < rowPixels.length; x++) {
        let idx = (y * img.width + x) * 4;
        sortedImg.pixels[idx] = rowPixels[x].r;
        sortedImg.pixels[idx + 1] = rowPixels[x].g;
        sortedImg.pixels[idx + 2] = rowPixels[x].b;
        sortedImg.pixels[idx + 3] = 255; // Alpha
      }
    }
  } else if (sortMode === "column") {
    for (let x = 0; x < img.width; x++) {
      let colPixels = [];
      for (let y = 0; y < img.height; y++) {
        let index = (y * img.width + x) * 4;
        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];
        colPixels.push({ r, g, b, index });
      }

      // Sort column by brightness
      colPixels.sort((a, b) => brightness(color(a.r, a.g, a.b)) - brightness(color(b.r, b.g, b.b)));

      // Write sorted pixels back
      for (let y = 0; y < colPixels.length; y++) {
        let idx = (y * img.width + x) * 4;
        sortedImg.pixels[idx] = colPixels[y].r;
        sortedImg.pixels[idx + 1] = colPixels[y].g;
        sortedImg.pixels[idx + 2] = colPixels[y].b;
        sortedImg.pixels[idx + 3] = 255; // Alpha
      }
    }
  }

  sortedImg.updatePixels(); // Apply changes to the sortedImg
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    sortMode = "row";
  } else if (key === 'c' || key === 'C') {
    sortMode = "column";
  }
  sortedImg.loadPixels();
  pixelSort();
  redraw();
}
