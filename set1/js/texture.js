// 
// spag
// --program to create spaghetti doodles similar to how i draw them
//
// Initial concept is to have particles traverse the screen in a twisting path
// Each will have a perpendicular line drawn through them with different colored dots at the end 
// when connected will look like the outline of the strand of spaghetti
// bits of this line will not be shown to simulate a sketchy line

let img; // Declare variable for the image

function preload() {
  img = loadImage('images/crayon_texture.jpg'); // Load the texture image
}


function setup() {
  //createCanvas(2270, 1270);
  createCanvas(400, 400, WEBGL);
  blendMode(NORMAL);
  //colorMode(HSB,100);
  //frameRate(10);

  //pick color palette
  selectedPalette = palettes[4]; //set selectedPalette to the one with index i

  //pick drawing colors from palette
  background(selectedPalette[2]);
  fillColor = selectedPalette[1];
  //outlineColor = selectedPalette[0];
  outlineColor = color('White');
}

function draw() {
// Begin custom shape

    translate(-width/2,-height/2);
    //fill('Blue');
    //rect(0,0,300,300);
    beginShape();
    texture(img); // Use the texture image
    vertex(100, 100, 0, 0); // Top-left corner
    vertex(300, 100, img.width, 0); // Top-right corner
    vertex(300, 300, img.width, img.height); // Bottom-right corner
    vertex(100, 300, 0, img.height); // Bottom-left corner
    endShape(CLOSE); // End shape
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
      save('spag_' + timeStamp + 'png');
    }
}
