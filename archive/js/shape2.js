/**
 * Basic template for Class / Slider
 *
 */
 'use strict';

 let particle = [];
 let slider;

 function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    frameRate(60);  // set frame rate - default = 60
    colorMode(RGB, 255,255,255,100);
    background(0, 100); // white
    strokeWeight(1);
    noStroke();
    fill(0, 117, 219, 100);

    slider = createSlider(1, 100, 10, 1);
    slider.position(10, 10);
    slider.style('width', '80px');

    // Create particles
    for (let i = 0; i < 20; i++) {
        particle[i] = new Particle(random(0,width), random(0,height),20);
        particle[i].show();
    }
 }
 
function draw() {
    background(0, 100); // white

    // Draw particles
    for (let p of particle) {
        p.update();
        p.show();
    }
 }

 function mousePressed() {
     noLoop();
 }

 function mouseReleased() {
    background(255); 
    loop();
 }

 function keyReleased() {
   if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
   if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
 }

 // Create a particle class
 class Particle {
    constructor (x,y,size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = [];
        this.color[0] = random(255);
        this.color[1] = random(255);
        this.color[2] = random(255);
    }
    update() {
        let xinc = map(mouseX,0,width,1,5);
        let yinc = map(mouseY,0,height,1,5);
        let newx = this.x += random(-xinc,xinc);
        let newy = this.y += random(-yinc,yinc);
        this.x = (newx < 0 || newx > width) ? width:newx;
        this.y = (newy < 0 || newy > height) ? height:newy;      
        this.size = slider.value();
    }
    show() {
        fill(this.color,100);
        ellipse(this.x, this.y, this.size, this.size);
    }

 }