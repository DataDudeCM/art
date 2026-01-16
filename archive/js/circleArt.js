function setup() {
    const canvas = createCanvas(500,500);
    
    colorMode(HSB,255,100,100,100);
    angleMode(DEGREES);

    palette = []
    palette[0]=color('Yellow');
    palette[1]=color('Blue');
    palette[2]=color('Green');
    palette[3]=color('White');

    backcolor = color('Black');
    
    mycircle = new Circle(width*.5,height*.5,width*.5*.6);
    console.log(mycircle);

    //frameRate(30);  // set frame rate - default = 60
    background(backcolor); 
}

function draw() {
    //background(backcolor); //erases background every time
    mycircle.update();
    mycircle.show();

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
  	    save('Circle_' + timeStamp);
    }
 }