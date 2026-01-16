var freeze = false;
const CYCLES=10;

function setup() {
    createCanvas(1200,800);
    colorMode(HSB);
    background(0);
    fill(0,0,100,255);
    noFill();
    stroke(0,0,100,255);
    strokeWeight(2);
}
    
function draw() {
    background(0);
    for (let a = 0; a <= 360; a=a+180) {
        console.log(a);
        myCircle(width/2,height/2,240,CYCLES,a);
    }
    //noLoop()

function myCircle(x,y,r,cycles, angle) {

    //angle=angle+120
    if (cycles <= 0) {
        return;
    }
    else {
        strokeWeight(int(cycles/2.5));
        stroke(0,0,100,cycles*255/CYCLES);
        var scaleFactor = map(mouseX,0,width,0,1);
        var angleShift = parseInt(map(mouseY,0,height,0,90));
        var angleShift = 10;
        var f = parseInt(random(0,5));
        //uncomment below for random blues
        //fill(180,100,100/4*f,cycles*255/CYCLES);
        circle(x,y,r);
        var x1=x + cos(radians(angle)) * r * 2 * scaleFactor;
        var y1=y + sin(radians(angle)) * r * 2 * scaleFactor;
        myCircle(x1,y1,r*scaleFactor,cycles-1,angle-angleShift);
        var x2 = x+cos(radians(angle-120))*r*2*scaleFactor;
        var y2 = y+sin(radians(angle-120))*r*2*scaleFactor;
        myCircle(x2,y2,r*scaleFactor,cycles-1,angle-120-angleShift);
    }
}
}