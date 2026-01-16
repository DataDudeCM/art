// Class for a Particle

class Particle {
    constructor() {
        this.position = createVector(random(width), random(height));
        this.velocity = p5.Vector.random2D(); // random 2d unit vector w random angle
        this.velocity.setMag(random(1,4));
        this.acceleration = createVector();
        this.maxForce = 0.2;
        this.maxSpeed = 3;
        this.color = palette[int(random(palette.length))];
        this.color.setAlpha(100);
        this.typeCheck = 'Bounce';
        }
    
    show() {
        strokeWeight(10);
        this.color.setAlpha(100);
        stroke(this.color);
        point(this.position.x, this.position.y)
    }

    update() {
        this.position.add(this.velocity);
        //this.velocity.add(this.acceleration);
    }

    checkOtherParticles(particleList) {
        let dist = 0;
        for (let particle of particleList) {
            if (this.position != particle.position) {
                dist = p5.Vector.dist(particle.position,this.position);
                if (dist < 10) {
                    //let newvel = p5.Vector.avg(this.velocity,particle.velocity);
                    let ab = particle.velocity.angleBetween(this.velocity);
                    this.velocity.rotate(ab*.1);
                    //this.velocity.setMag((mag(particle.velocity)));
                }
            }
        }
        //strokeWeight(1);
        //noFill();
        //stroke(this.color);
    
        //noStroke();
        //let fcolor = this.color;
        //fcolor.setAlpha(1);
        //fill(fcolor);
        //circle(this.position.x, this.position.y,int(dist/particleList.length));
    }

    edges() {
        if (this.typeCheck == 'Window') {
            if (this.position.x > width) {
                this.position.x = 0;
            }
            if (this.position.x < 0) {
                this.position.x = width;
            }
            if (this.position.y > height) {
                this.position.y = 0;
            }
            if (this.position.y < 0) {
                this.position.y = height;
            }
        }   
        if (this.typeCheck == 'Bounce') {
            if (this.position.x < 0 || this.position.x > width) { this.velocity.x *= -1; };
            if (this.position.y < 0 || this.position.y > height) { this.velocity.y *= -1; };

        }
        if (this.typeCheck == 'Circle') {
        }
    }
}
