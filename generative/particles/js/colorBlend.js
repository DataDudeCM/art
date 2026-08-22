function setup() {
    createCanvas(600, 400);
    noLoop();
  }
  
  function draw() {
    background(220);
  
    // Define the two primary colors
    let redColor = color('Blue');
    let yellowColor = color('Yellow');
  
    // Square parameters
    let squareSize = 100;
    noStroke();
    /*
    // Draw the red square on the left side
    fill(redColor);
    rect(50, height / 2 - squareSize / 2, squareSize, squareSize);
    
    // Draw the yellow square on the right side
    fill(yellowColor);
    rect(width - 50 - squareSize, height / 2 - squareSize / 2, squareSize, squareSize);
    */
    // Parameters for the intermediate blended squares
    let numPositions = 40; // number of square positions between the primary squares
    let startX = 10 + squareSize;     // right edge of the red square
    let endX = width - 10 - squareSize; // left edge of the yellow square
    let spacing = (endX - startX) / (numPositions + 1);
    
    let numOffsets = 16;  // increased number of offset squares per position
    let offsetRange = 2;  // maximum offset in x and y directions
    let angleRange = PI / 16; // maximum rotation angle (in radians)
    
    // Draw intermediate squares with blended colors, offsets, and rotations
    for (let i = 1; i <= numPositions; i++) {
      // Compute the interpolation factor
      let t = i / (numPositions + 1);
      let blendedColor = lerpColor(redColor, yellowColor, t);
      blendedColor.setAlpha(50); // apply transparency
      
      // Base position for the square (centered)
      let baseX = startX + i * spacing - squareSize / 2;
      let baseY = height / 4 - squareSize / 2;
      
      // Draw several squares with slight offsets and rotations
      for (let j = 0; j < numOffsets; j++) {
        let offsetX = random(-offsetRange, offsetRange);
        let offsetY = random(-offsetRange, offsetRange);
        let angle = random(-angleRange, angleRange);
        
        push();
        // Translate to the center of the square plus random offset
        translate(baseX + squareSize / 2 + offsetX, baseY + squareSize / 2 + offsetY);
        rotate(angle);
        fill(blendedColor);
        // Draw the square centered at the origin
        rect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
        pop();
      }
    }
  }
  