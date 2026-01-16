// p5.js script for generating unique digital paintings using the rainbow smoke algorithm

let canvasSize = 200;
let img;
let colorSpace = [];
let paintedPixels = [];
let pixelSize = 10; // Size of "pixels" to paint

function setup() {
  createCanvas(canvasSize, canvasSize);
  img = createImage(canvasSize, canvasSize);
  img.loadPixels();

  // Initialize the image with a black background
  for (let i = 0; i < img.pixels.length; i += 4) {
    img.pixels[i] = 0;
    img.pixels[i + 1] = 0;
    img.pixels[i + 2] = 0;
    img.pixels[i + 3] = 255;
  }

  // Calculate the number of colors needed based on pixelSize
  let numPixels = (canvasSize / pixelSize) * (canvasSize / pixelSize);

  // Initialize the RGB color space to match the number of needed colors
  let step = floor(256 / pow(numPixels, 1/3)); // Step size for evenly distributing colors
  for (let r = 0; r < 256; r += step) {
    for (let g = 0; g < 256; g += step) {
      for (let b = 0; b < 256; b += step) {
        if (colorSpace.length < numPixels) {
          colorSpace.push([r, g, b]);
        }
      }
    }
  }

  img.updatePixels(); // Update the black background

  // Start with a random pixel on the canvas
  let startX = floor(random(canvasSize / pixelSize)) * pixelSize;
  let startY = floor(random(canvasSize / pixelSize)) * pixelSize;
  let startColorIndex = floor(random(colorSpace.length));
  let startColor = colorSpace.splice(startColorIndex, 1)[0];

  paintPixel(startX, startY, startColor);

  //frameRate(30); // Control the drawing speed
}

function draw() {
  if (colorSpace.length > 0) {
    // Get a random painted pixel
    let [x, y] = random(paintedPixels);

    // Find neighboring uncolored pixels
    let neighbors = getUncoloredNeighbors(x, y);
    if (neighbors.length > 0) {
      let [nx, ny] = random(neighbors);

      // Find a color close to the last used color
      let lastColor = getColorAt(x, y);
      let nextColor = findClosestColor(lastColor);

      paintPixel(nx, ny, nextColor);
    }
  } else {
    noLoop(); // Stop when all pixels are painted
  }

  img.updatePixels(); // Ensure the image buffer is updated
  image(img, 0, 0); // Display the current image
}

function paintPixel(x, y, color) {
  for (let dx = 0; dx < pixelSize; dx++) {
    for (let dy = 0; dy < pixelSize; dy++) {
      let index = ((y + dy) * canvasSize + (x + dx)) * 4;
      img.pixels[index] = color[0];
      img.pixels[index + 1] = color[1];
      img.pixels[index + 2] = color[2];
      img.pixels[index + 3] = 255;
    }
  }
  paintedPixels.push([x, y]);
}

function getUncoloredNeighbors(x, y) {
  let neighbors = [];
  let directions = [
    [0, -pixelSize], // Up
    [0, pixelSize],  // Down
    [-pixelSize, 0], // Left
    [pixelSize, 0],  // Right
  ];

  for (let [dx, dy] of directions) {
    let nx = x + dx;
    let ny = y + dy;
    if (nx >= 0 && nx < canvasSize && ny >= 0 && ny < canvasSize) {
      if (!isPixelColored(nx, ny)) {
        neighbors.push([nx, ny]);
      }
    }
  }

  return neighbors;
}

function isPixelColored(x, y) {
  let index = (y * canvasSize + x) * 4;
  return img.pixels[index] !== 0 || img.pixels[index + 1] !== 0 || img.pixels[index + 2] !== 0;
}

function getColorAt(x, y) {
  let index = (y * canvasSize + x) * 4;
  return [
    img.pixels[index],
    img.pixels[index + 1],
    img.pixels[index + 2]
  ];
}

function findClosestColor(targetColor) {
  let minDist = Infinity;
  let closestColor;
  let closestIndex;

  for (let i = 0; i < colorSpace.length; i++) {
    let dist = colorDistance(targetColor, colorSpace[i]);
    if (dist < minDist) {
      minDist = dist;
      closestColor = colorSpace[i];
      closestIndex = i;
    }
  }

  colorSpace.splice(closestIndex, 1); // Remove the color from the space
  return closestColor;
}

function colorDistance(c1, c2) {
  return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2; // Optimized distance
}
