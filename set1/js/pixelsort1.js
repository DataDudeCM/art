// Pixel Sort with Perlin Noise using p5.js
let img;
let sortedImg;
let sortMode = "row"; // "row" or "column"
let noiseScale = 0.01; // Adjust the smoothness of the noise

function preload() {
  img = loadImage('images/jinx.jpg'); // Replace with your image path
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
  sortedImg.loadPixels(); // Prepare sortedImg for pixel manipulation

  if (sortMode === "row") {
    for (let y = 0; y < img.height; y++) {
      let rowPixels = [];
      let noiseStart = noise(y * noiseScale) * img.width;
      let start = int(noiseStart);
      let end = start + int(noise((y + 1) * noiseScale) * (img.width - start));

      // Ensure valid range
      start = constrain(start, 0, img.width - 1);
      end = constrain(end, start + 1, img.width);

      // Copy original pixels to sortedImg
      for (let x = 0; x < img.width; x++) {
        let index = (y * img.width + x) * 4;
        sortedImg.pixels[index] = img.pixels[index];
        sortedImg.pixels[index + 1] = img.pixels[index + 1];
        sortedImg.pixels[index + 2] = img.pixels[index + 2];
        sortedImg.pixels[index + 3] = img.pixels[index + 3];
      }

      // Extract pixels in the noise-defined range
      for (let x = start; x < end; x++) {
        let index = (y * img.width + x) * 4;
        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];
        rowPixels.push({ r, g, b, index });
      }

      // Sort the segment by brightness
      rowPixels.sort((a, b) => brightness(color(a.r, a.g, a.b)) - brightness(color(b.r, b.g, b.b)));

      // Write sorted pixels back
      rowPixels.forEach((p, i) => {
        let idx = (y * img.width + (start + i)) * 4;
        sortedImg.pixels[idx] = p.r;
        sortedImg.pixels[idx + 1] = p.g;
        sortedImg.pixels[idx + 2] = p.b;
        sortedImg.pixels[idx + 3] = 255; // Alpha
      });
    }
  } else if (sortMode === "column") {
    for (let x = 0; x < img.width; x++) {
      let colPixels = [];
      let noiseStart = noise(x * noiseScale) * img.height;
      let start = int(noiseStart);
      let end = start + int(noise((x + 1) * noiseScale) * (img.height - start));

      // Ensure valid range
      start = constrain(start, 0, img.height - 1);
      end = constrain(end, start + 1, img.height);

      // Copy original pixels to sortedImg
      for (let y = 0; y < img.height; y++) {
        let index = (y * img.width + x) * 4;
        sortedImg.pixels[index] = img.pixels[index];
        sortedImg.pixels[index + 1] = img.pixels[index + 1];
        sortedImg.pixels[index + 2] = img.pixels[index + 2];
        sortedImg.pixels[index + 3] = img.pixels[index + 3];
      }

      // Extract pixels in the noise-defined range
      for (let y = start; y < end; y++) {
        let index = (y * img.width + x) * 4;
        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];
        colPixels.push({ r, g, b, index });
      }

      // Sort the segment by brightness
      colPixels.sort((a, b) => brightness(color(a.r, a.g, a.b)) - brightness(color(b.r, b.g, b.b)));

      // Write sorted pixels back
      colPixels.forEach((p, i) => {
        let idx = ((start + i) * img.width + x) * 4;
        sortedImg.pixels[idx] = p.r;
        sortedImg.pixels[idx + 1] = p.g;
        sortedImg.pixels[idx + 2] = p.b;
        sortedImg.pixels[idx + 3] = 255; // Alpha
      });
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
