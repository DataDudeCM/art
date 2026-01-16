// functions for creating geometry


// add a function to draw windows within the rectangle


// add ability to pass in brightness
function squigRect (x, y, w, h, sw, l, a, j, fc) {

    //assumes x,y = top left of rectangle

    noStroke();
   

    //draw shadow
    shadowColor = color('Black');
    shadowColor.setAlpha(40);
    fill(shadowColor);
    rect(x-4,y+1,w,h);

    //draw building
    fc.setAlpha(100);
    fill(fc);
    rect(x,y,w,h);

    // draw textured building

    //cnv1.background(fillColor);
    //cnv1.blendMode(MULTIPLY);
    //ctx = cnv1.canvas.getContext("2d"); // enables clipping later
    //cnv1.image(img,0,0); //loads the image or texture to the hidden canvas
    //image(cnv1,x,y,w,h); // adds the hidden canvas to the primary

    //fill(color('DarkGrey'));
    //tops of buildings     
    rect(x-4,y-8,w+8,8);

    //draw reflection
    fc.setAlpha(a/2);
    fill(fc);
    rect(x,anchory+(h*j),w,h);

    stroke(outlineColor);
    squigLine(createVector(x,y),createVector(x,y+h),sw); //left side
    squigLine(createVector(x,y+h),createVector(x+w,y+h),sw); //top side
    squigLine(createVector(x+w,y+h),createVector(x+w,y),sw); //right side
    squigLine(createVector(x,y),createVector(x+w,y),sw); //bottom side

    //tops of buildings
    squigLine(createVector(x-4,y-8),createVector(x-4,y-8+8),sw); //left side
    squigLine(createVector(x-4,y-8+8),createVector(x-4+w,y-8+8),sw); //top side
    squigLine(createVector(x-4+w+8,y-8+8),createVector(x-4+w+8,y-8),sw); //right side
    squigLine(createVector(x-4,y-8),createVector(x-4+w+8,y-8),sw); //bottom side

    bldgWindow(x,y,w,h);

}

function bldgWindow (x,y,w,h) {



    //let mborder = 8;
    let mborder = int(random(10,16));

    let hnum = int(random(4,8));
    let vnum = int(random(12,20));

    if (((w - ((hnum+1) * mborder)) / hnum) < 2) {
        hnum = int(hnum/2);
    }
    let wwidth = (w - ((hnum+1) * mborder)) / hnum;
    if (((h - ((vnum+1) * mborder)) / vnum) < 5) {
        vnum = int(vnum/2);
    }
    let wheight = (h - ((vnum+1) * mborder)) / vnum;
    
    /*
    let wwidth = 8;
    let wheight = 12;
    let hnum = int((w-mborder) / (wwidth+mborder));
    let vnum = int((h-mborder) / (wheight+mborder));
    */

    stroke(color('Black'));
    strokeWeight(1);


    for (let wy= 0; wy < vnum; wy+=1) {
        for (let wx = 0; wx < hnum; wx+=1) {
          //rect(border+(index*(boxwidth+border)),border+(i*(boxwidth+border)), wwidth, wheight);
            if (random() < .9) {
                fill(color("#888B90")); //consider randomly picking between this and lighter gray
            } else {
                fill(color("White"));
            }    
            rect(x+(wx*(wwidth+mborder)+mborder),y+(wy*(wheight+mborder)+mborder), wwidth, wheight);
        }
      }
}

function squigLine (point1, point2, sw) {

    strokeWeight(sw);
    stroke(outlineColor);
    //stroke(color('White'));

    distance = dist(point1.x,point1.y,point2.x,point2.y);
    jaggyFactor = .05; // .1 is default and influences number of points - jagginess
    noiseFactor = 1.25; //1 is default and indicates smoothness, greater = less smooth
    numpoints = int(distance * jaggyFactor);
    if (numpoints < 3) {
        numpoints = 3;
    }
    prevX = point1.x;
    prevY = point1.y;

    // Add some noise to the line
    for (let i = 0; i <= numpoints; i++) {
    let x = lerp(point1.x, point2.x, i / numpoints);
    let y = lerp(point1.y, point2.y, i / numpoints);
    x += random(-noiseFactor, noiseFactor);
    y += random(-noiseFactor, noiseFactor);
    //point(x, y);
    if (random() > .02) {
        line(prevX,prevY,x,y);
    }
    prevX=x;
    prevY=y;
    }
}