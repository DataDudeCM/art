function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    
    colorMode(HSB,255,100,100,100);
    angleMode(DEGREES);

    palette = []
    palette[0]=color('Yellow');
    palette[1]=color('Blue');
    palette[2]=color('Green');
    palette[3]=color('White');

    backcolor = color('Black');
    strokeWeight(1);

  
    //frameRate(1);  // set frame rate - default = 60
    background(backcolor); 
}

function draw() {
    //background(backcolor); //erases background every time
    let strokecolor = palette[int(random(4))];
    strokecolor.setAlpha(1);
    stroke(strokecolor);

    let numpoints = int(random(10,200));
    //let offset = int(random(numpoints));
    let offset = int(numpoints*.5); // varying offset affects whether intersections are visible

    let array1 = circleArray(width*.5+random(-50,50), height*.5 + random(-50,50),random(width*.25),numpoints);
    let array2 = circleArray(random(width),random(height),random(width*.1,width),numpoints);

    for (i = 0; i < numpoints; i++) {
        //connect line from the first point in object 1 to the offset point in object 2
        line(array1[i].x,array1[i].y,array2[(i+offset) % numpoints].x,array2[(i + offset) % numpoints].y);
    }
    //noLoop();
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
  	    save('Shapeart_' + timeStamp);
    }
 }