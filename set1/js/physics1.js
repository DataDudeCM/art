// Uses toxiclabs physics library
//
// Uses physics library, springs and gravity to influence the motion of 2 or more particles across the screen
// By drawing semi transparent lines between the points, we get interesting spirograph like art
// Currently utilizes the colors from Pallette 4 in my pallette file.
const { VerletPhysics2D, VerletParticle2D, VerletSpring2D } = toxi.physics2d;
const { GravityBehavior } = toxi.physics2d.behaviors;
const { Vec2D, Rect } = toxi.geom;

let physics;
let particles = [];
let springs = [];
let numparticles;

function setup() {
  createCanvas(windowWidth, windowHeight);

  selectedPalette = palettes[3];
  background(selectedPalette[0]);
  
  c1 = color(selectedPalette[4]); // line segment 1
  c1.setAlpha(20);
  c2 = color(selectedPalette[2]); // line segment 2
  c2.setAlpha(20);

  //set physics worlds
  physics = new VerletPhysics2D();
  let bounds = new Rect(0, 0, width, height);
  physics.setWorldBounds(bounds);
  let gravity = new GravityBehavior(new Vec2D(0,.025)); //default is 0,0.025)
  //physics.addBehavior(gravity);

  numparticles = 3; //setting to 3 tends to create circle eye patterns
  for (let i = 0; i < 2; i++) {

    // add particles
    for (let index = 0; index < numparticles; index++) {
      if (index == 0) {
        particles.push(new VerletParticle2D(int(width/2),int(height/2)));
      } else {
        particles.push(new VerletParticle2D(int(random(width)),int(random(height))));
      } 
      physics.addParticle(particles[index]);
    }

    //add springs
    for (let index = 0; index < numparticles-1; index++) {
      springs.push(new VerletSpring2D(particles[index],particles[(index+1) % numparticles],int(random(width/2)),0.2));
      physics.addSpring(springs[index]);
    }
      
  }
}

function draw() {
  //background(220);

  physics.update();
  //particles[0].lock();

  fill('white');

  //circle(particles[0].x, particles[0].y,10);
  //circle(particles[1].x, particles[1].y,10);
  //noStroke();
  //circle(particles[2].x, particles[2].y,20);
  strokeWeight(2);

  c1true = true;

  //this only draws the first half of lines; need to improve to draw all
  for (l = 0; l < (numparticles); l++) {
    if (c1true) {
      stroke(c1);
      c1true = false;
    } else {
      stroke(c2);
      c1true=c1true;
    }
    line(particles[l].x,particles[l].y,particles[(l+1) % (numparticles)].x,particles[(l+1) % (numparticles)].y);
  }
  //stroke(c1);
  //line(particles[0].x,particles[0].y,particles[1].x,particles[1].y);
  //stroke(c2);
  //line(particles[1].x,particles[1].y,particles[2].x,particles[2].y);

}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('physics1_' + timeStamp + 'png');
    }
}
