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
  sortedImg.loadPixels();
  img.loadPixels();

  for (let y = 0; y < img.height; y++) {
    let start = int(noise(y * 0.01) * img.width);
    let end = start + int(noise(y * 0.02) * (img.width - start));
    start = constrain(start, 0, img.width - 1);
    end = constrain(end, start + 1, img.width);

    let rowPixels = [];
    for (let x = start; x < end; x++) {
      let index = (y * img.width + x) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      if (brightness(color(r, g, b)) > 50) {
        rowPixels.push({ r, g, b, index });
      }
    }

    rowPixels.sort((a, b) => brightness(color(a.r, a.g, a.b)) - brightness(color(b.r, b.g, b.b)));

    rowPixels.forEach((p, i) => {
      let idx = (y * img.width + (start + i)) * 4;
      sortedImg.pixels[idx] = p.r;
      sortedImg.pixels[idx + 1] = p.g;
      sortedImg.pixels[idx + 2] = p.b;
      sortedImg.pixels[idx + 3] = 255;
    });
  }

  sortedImg.updatePixels();
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
