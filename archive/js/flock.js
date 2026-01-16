//Creates a set of particles which move in a flock
const flock = [];
counter = 0;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    for (let i = 0; i< 200; i++) {
        flock.push(new Boid(random(20,50)));     
    }
    //frameRate(10);  // set frame rate - default = 60
    background(51);
}

function draw() {
    //background(51);
    counter = counter + 1;
    if (counter > 200 ) {
        background(51);
        counter = 0;
    }
    for (let boid of flock) {
        boid.flock(flock);
        boid.update();
        boid.edges();
        boid.show();
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
	// if (keyCode == SHIFT) {

    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Flock_' + timeStamp + 'png');
    }
 }