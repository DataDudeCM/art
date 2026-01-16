jaggy = 0;
jaggyz = 0;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  colorMode(RGB)
  //stroke(color('magenta'));
  noStroke();
  //noLoop();
}

function draw() {
    jaggy = mouseX / 60;  // 0 to 10 is best range from smooth to jaggy
    jaggyz = random(40);  // 0 to 50 is a good range for creating different noise patterns
    background(0);
    for (let y = 0; y < height-100; y+=2) {
        noiseY = map(y,0,height,0,jaggy);
        for (let x = 0; x < width; x+=2) {
          var noiseX = map(x,0,width,0,jaggy*map(y,0,height,1,.01));
          var noiseValue = noise(noiseX,noiseY,jaggyz);
          var bright = map(noiseValue,0,1,0,255);
          var diff = map(noiseValue,0,1,0,200);
          //fill(bright);
          //rect(x,y,4,4);
          fill(color('#ffd700'));
          ellipse(x,y-diff+150,2,2);
      }
    }    
}

function mousePressed() {
	if (isLooping()) {
		noLoop();
	} else {
		loop();
	}
}

function keyPressed() {
    if (keyCode == BACKSPACE) {
		if (circles == false) {
			circles = true;
		} else {
			circles = false;
		}
	} 
	if (keyCode == SHIFT) {
		if (bez == false) {
			bez = true;
		} else {
			bez = false;
		}
	} 
	if (key == 1) {
        type = 1; 
    } 
	if (key == 2) {
        type = 2; 
    } 
    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Voronoi_' + timeStamp + 'png');
    }
 }