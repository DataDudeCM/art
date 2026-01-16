let a = 1;
let xoff = 0;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    //frameRate(10);  // set frame rate - default = 60
    colorMode(RGB);
    background(color('black')); // black
    stroke(color('red'));
    noFill();
    strokeWeight(1);
    //noFill();
}

function draw() {
    noLoop();
    ellipse(20,20,5,5);
    /*
    for (let y = 0; y < height; y++) {
        var noiseY = map(y,0,height,0,100);
        for (let x = 0; x < width; x++) {
            var noiseX = map(x,0,width,0,100);
            var bright = map(noise(noiseX,noiseY),0,1,0,100);
            stroke([0,0,255,bright]);
            console.log(x,y,noiseX,noiseY,bright);
            ellipse(x,y,5,5);
        }
    }
    */
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