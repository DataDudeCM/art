// 
// scontour

let isLoopingFlag = false;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;

let img;

function preload() {
  img = loadImage('images/untitled-6.png'); // Replace 'your_image.jpg' with the path to your image
}


function setup() {
  //createCanvas(2270, 1270);
  createCanvas(800, 800);

  colorMode(HSB,360,100,100,255);

  //frameRate(20);

  //pick color palette
  selectedPalette = palettes[int(random(3,11))]; //set selectedPalette to the one with index i
  //pick drawing colors from palette
  background(selectedPalette[1]);
  background(color('White'));

  fillColor = color(selectedPalette[2]);
  fillColor = color('Black');

  outlineColor = color(selectedPalette[0]);
  outlineColor = color('Black');

  stroke(outlineColor);
  noStroke();
  strokeWeight(2);
  fill(fillColor);
  //noFill();
  img.resize(width, height);

  //image(img,0,0,width,height);
  //noLoop();

}

function draw() {
    background('White');
    let edges = extractEdges(img);
    //image(edges, 0, 0, width, height); // Visualize edges
    drawNoiseAroundEdges(edges); // Add noise wrapping
    drawFlowFieldAroundEdges(edges); // Add noise wrapping
}


function extractEdges(img) {
    let edges = createGraphics(img.width, img.height);
    img.loadPixels();
    edges.loadPixels();
    
    for (let x = 1; x < img.width - 1; x++) {
      for (let y = 1; y < img.height - 1; y++) {
        let i = (x + y * img.width) * 4;
        let brightnessDiff = abs(brightness(color(img.pixels[i])) - brightness(color(img.pixels[i + 4])));
        if (brightnessDiff > 80) { // Adjust threshold for sensitivity
          edges.pixels[i] = 255; // Edge pixel
        } else {
          edges.pixels[i] = 0;   // Non-edge pixel
        }
      }
    }
    edges.updatePixels();
    return edges;
}

function drawNoiseAroundEdges(edges) {
    for (let x = 0; x < edges.width; x++) {
      for (let y = 0; y < edges.height; y++) {
        let edgeVal = edges.get(x, y); // Check if this pixel is part of an edge
        if (edgeVal[0] > 200) { // Adjust threshold for sensitivity
          let n = noise(x * 0.05, y * 0.05); // Generate Perlin noise
          let alpha = map(n, 0, 1, 50, 255); // Map noise to alpha
          fillColor.setAlpha(alpha);
          fill(fillColor); // Use a soft color
          ellipse(x, y, n * 40); // Draw small circles around the edge
        }
      }
    }
}

function drawFlowFieldAroundEdges(edges) {
    for (let x = 0; x < edges.width; x++) {
        for (let y = 0; y < edges.height; y++) {
            let edgeVal = edges.get(x, y); // Check if this pixel is part of an edge
            if (edgeVal[0] > 200) { // Check edge pixel
                let angle = noise(x * 0.01, y * 0.01) * TWO_PI; // Generate angle based on noise
                let vx = cos(angle) * 40;
                let vy = sin(angle) * 40;
                stroke(outlineColor);
                line(x, y, x + vx, y + vy);
            }
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
      save('city_' + timeStamp + 'png');
    }
}
