// p5.js script for generating unique digital paintings using the rainbow smoke algorithm

let canvasSize = 250;
let img;
let colorSpace = [];
let paintedPixels = [];

function setup() {
  createCanvas(canvasSize, canvasSize);
  img = createImage(canvasSize, canvasSize);
  background('Black');
  img.loadPixels();

  // Initialize the RGB color space
  for (let r = 0; r < 256; r++) {
    for (let g = 0; g < 256; g++) {
      for (let b = 0; b < 256; b++) {
        colorSpace.push([r, g, b]);
      }
    }
  }

  // Start with a random pixel on the canvas
  let startX = floor(random(canvasSize));
  let startY = floor(random(canvasSize));
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

  img.updatePixels();
  image(img, 0, 0); // Display the current image
}

function paintPixel(x, y, color) {
  let index = (y * canvasSize + x) * 4;
  img.pixels[index] = color[0];
  img.pixels[index + 1] = color[1];
  img.pixels[index + 2] = color[2];
  img.pixels[index + 3] = 255;
  paintedPixels.push([x, y]);
}

function getUncoloredNeighbors(x, y) {
  let neighbors = [];
  let directions = [
    [0, -1], // Up
    [0, 1],  // Down
    [-1, 0], // Left
    [1, 0],  // Right
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
  return img.pixels[index + 3] === 255;
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

  for (let i = 0; i < colorSpace.length; i++) {
    let dist = colorDistance(targetColor, colorSpace[i]);
    if (dist < minDist) {
      minDist = dist;
      closestColor = colorSpace[i];
    }
  }

  colorSpace.splice(colorSpace.indexOf(closestColor), 1); // Remove the color from the space
  return closestColor;
}

function colorDistance(c1, c2) {
  return dist(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
}
