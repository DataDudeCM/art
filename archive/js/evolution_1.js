//Creates a set of particles which move in a flock
const particles = [];
counter = 0;
numparticles = 50;

 //color palette for building when filled


function setup() {
    const canvas = createCanvas(windowWidth,windowHeight);
    
    colorMode(HSB,255,100,100,100);
    angleMode(DEGREES);

    palette = []
    palette[0]=color('Yellow');
    palette[1]=color('Blue');
    palette[2]=color('Green');
    palette[3]=color('White');

    backcolor = color('Black');
    
    for (let i = 0; i< numparticles; i++) {
        particles.push(new Particle());     
    }
    //frameRate(30);  // set frame rate - default = 60
    background(backcolor); 
}

function draw() {
    background(backcolor); //erases background every time
    for (let particle of particles) {
        particle.update();
        particle.edges();
        particle.checkOtherParticles(particles);
        particle.show();
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

	} 
	// if (keyCode == SHIFT) {

    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Particles_' + timeStamp);
    }
 }