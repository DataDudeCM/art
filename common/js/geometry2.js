// functions for creating geometry


// add a function to draw windows within the rectangle


// add ability to pass in brightness
function squigRect (x, y, w, h, sw, l, a) {

    //assumes x,y = top left of rectangle

    noStroke();
    fc = int(random(0,3));
    fillColor = selectedPalette[fc];
    if (l != 100) {
        fillColor = color(hue(fillColor),l,l,a);
    } else {
        fillColor = color(hue(fillColor), saturation(fillColor), brightness(fillColor),a);
    }

    fill(fillColor);
    rect(x,y,w,h);

    //draw reflection
    fillColor.setAlpha(a/4);
    fill(fillColor);
    rect(x,y,w,h*2);

    //softedge on fill
    softborder = 2;
    //fill(hue(fillColor),saturation(fillColor),brightness(fillColor),40);
    rect(x-softborder,y-softborder,w+softborder*2,h+softborder*2);

    stroke(outlineColor);
    squigLine(createVector(x,y),createVector(x,y+h),sw); //left side
    squigLine(createVector(x,y+h),createVector(x+w,y+h),sw); //top side
    squigLine(createVector(x+w,y+h),createVector(x+w,y),sw); //right side
    squigLine(createVector(x,y),createVector(x+w,y),sw); //bottom side

    bldgWindow(x,y,w,h);

}

function bldgWindow (x,y,w,h) {



    //let mborder = 8;
    let mborder = int(random(5,10));

    let hnum = int(random(4,8));
    let vnum = int(random(8,12));

    if (((w - ((hnum+1) * mborder)) / hnum) < 2) {
        hnum = int(hnum/3);
    }
    let wwidth = (w - ((hnum+1) * mborder)) / hnum;
    if (((h - ((vnum+1) * mborder)) / vnum) < 5) {
        vnum = int(vnum/4);
    }
    let wheight = (h - ((vnum+1) * mborder)) / vnum;
    
    /*
    let wwidth = 8;
    let wheight = 12;
    let hnum = int((w-mborder) / (wwidth+mborder));
    let vnum = int((h-mborder) / (wheight+mborder));
    */

    //stroke(color('Black'));
    strokeWeight(1);
    fill(color("#888B90")); //consider randomly picking between this and lighter gray

    for (let wy= 0; wy < vnum; wy+=1) {
        for (let wx = 0; wx < hnum; wx+=1) {
          //rect(border+(index*(boxwidth+border)),border+(i*(boxwidth+border)), wwidth, wheight);
          rect(x+(wx*(wwidth+mborder)+mborder),y+(wy*(wheight+mborder)+mborder), wwidth, wheight);
        }
      }
}

function squigLine (point1, point2, sw) {

    strokeWeight(sw);
    //stroke(color('White'));

    distance = dist(point1.x,point1.y,point2.x,point2.y);
    jaggyFactor = .1; // .1 is default and influences number of points - jagginess
    noiseFactor = 1; //1 is default and indicates smoothness, greater = less smooth
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
    line(prevX,prevY,x,y);
    prevX=x;
    prevY=y;
    }
}