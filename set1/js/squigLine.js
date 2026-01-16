let startX, startY, endX, endY;

function setup() {
  createCanvas(400, 400);
  background(220);
  // Set a lower frame rate, adjust as needed
  frameRate(1);
  
  // Create a slider with a range from 0 to 100 and an initial value of 50
  noiseslider = createSlider(0, 10, 2);
  noiseslider.position(10, height + 10);
  noiseslider.style('width', '100px');
  // Create a slider with a range from 0 to 100 and an initial value of 50
  jaggyslider = createSlider(1, 100, 10);
  jaggyslider.position(10, height + 30);
  jaggyslider.style('width', '100px');
}

function draw() {
  background(220);
  
  startX = random(width);
  startY = random(height);
  endX = random(width);
  endY = random(height);
  
  distance = dist(startX,startY,endX,endY);
  jaggyFactor = jaggyslider.value() * .01;
  noiseFactor = noiseslider.value();
  numpoints = distance * jaggyFactor;
  
  prevX = startX;
  prevY = startY;
  
  // Add some noise to the line
  for (let i = 0; i < numpoints; i++) {
    let x = lerp(startX, endX, i / numpoints);
    let y = lerp(startY, endY, i / numpoints);
    x += random(-noiseFactor, noiseFactor);
    y += random(-noiseFactor, noiseFactor);
    //point(x, y);
    line(prevX,prevY,x,y);
    prevX=x;
    prevY=y;
  }
}
