let particles = [];
let circles = true;
let dislimit = 200;
let type = 1;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    let nump = 50;
    //frameRate(10);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background([0,0,0,100]); // black
    stroke([0,0,0,50]);
    strokeWeight(1);
    //noFill();
    for (let p = 0; p < nump; p++) {
        particles[p] = new Particle;
    }
}

function draw() {
	//background([0,0,0,100]); // white - remove for interesting trail effects
    for (let index = 0; index < particles.length; index++) {
        particles[index].move();
    }
    //
    //add - push particles to a super array and if length > 3 pop off the first one
    //  this will allow for creation of trails
    //
    for (let a = 0; a < particles.length; a++) {  //for every particle
        //add a check to see if a was already connected to b
        for (let b = 0; b < particles.length; b++) {  // check distance against every other particle
            if (a != b) {
                var dis = p5.Vector.dist(particles[a].V,particles[b].V);
                if (dis < dislimit) {
                    //add b to array of found

                    if (circles) {  //if toggled creates circles relative to distance in addition to lines
                        strokeWeight(1);
                        noFill();
                        stroke([208,100,55,map(dis,0,dislimit,80,0)]);
                        if (type == 1) {
                            circle(particles[a].V.x,particles[a].V.y,dis);
                        }
                        if (type == 2) {
                            circle(p5.Vector.lerp(particles[a].V,particles[b].V,0.5).x,p5.Vector.lerp(particles[a].V,particles[b].V,0.5).y, + 
                            dis);
                        }
                    }
                    // Draw lines relative to distance
                    strokeWeight(1);
                    stroke([0,0,0,map(dis,0,dislimit,100,0)]);
                    line(particles[a].V.x,particles[a].V.y, particles[b].V.x,particles[b].V.y);
                }
            }
        }
    }
    for (let index = 0; index < particles.length; index++) {
        particles[index].display();
    }
}

class Particle {
    constructor (V,r) {
        this.V = createVector(int(random(width)), int(random(height)));
        this.diameter = 10; //size of ellipse
        this.speed = 10; 
        this.D = createVector(random(-2,2), random(-2,2));
        this.color = 'lightgreen';
        //this.color = [random(360),100,50,100];  //rainbow colors
    }

    move() {
        //this.D.setHeading(map(noise(this.V.x,this.V.y),0,1,0,2*PI));
        //this.D.setMag(this.speed);
        this.V.add(this.D);
        //check for off screen
        if (this.V.x < 0)
            this.V.x = width;
        if (this.V.x > width)
            this.V.x = 0;
        if (this.V.y < 0)
            this.V.y = height;
        if (this.V.y > height)
            this.V.y = 0;
    }
    
    display() {
        stroke(this.color);
        fill(this.color);
        ellipse(this.V.x, this.V.y, this.diameter, this.diameter);
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
	if (key == 1) {
        type = 1; 
    } 
	if (key == 2) {
        type = 2; 
    } 
    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Lattice_' + timeStamp + 'png');
    }
 }