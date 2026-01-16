let edges = [];

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    frameRate(10);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background([0,0,0,100]); // black
    stroke([0,0,255,100]);
    strokeWeight(1);
    //noFill();
}

function draw() {
    for (y = 0; y < height; y++) {
        for (x=0; x < width; x++){
            stroke(100);
            point(x, y);      
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