/**
 * Skyline generator
 *
 */
 'use strict';
 
let lines = [];
let pixelarray = [];
let numlines = 4;

 //color palette for building when filled
let palette = []
palette[0]=[240,27,18];
palette[1]=[232,17,35];
palette[2]=[309,6,58];
palette[3]=[11,24,72];
palette[4]=[21,35,92];


function setup() {
    const canvas = createCanvas(400, 400);
    // frameRate(20);  // set frame rate - default = 60
    //colorMode(HSB,360,100,100,100);
    angleMode(DEGREES);
    pixelDensity(1);
    background(255, 100); // white
    strokeWeight(2);
    //stroke(append(palette[1],100));
    stroke([0,0,0]);

    
    // Create an array of pixel headings - empty pixels = -999
    for (let y= 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            pixelarray[y*width + x] = -999;
        }
    }

    // Populate array of lines with start vector and velocity
    for (let i = 0; i < numlines; i++) {
        lines[i] = createLine(random(0,360),2);
    }
    print(lines);

}
 
function draw() {

    // Draw 
    print('length',lines.length);
    let l = 0;
    while (lines.length > 0 && l < lines.length && lines.length < 80) {
    //for (let l = 0; l < lines.length; l++) {
        print('l',l);
        print(lines[l][0]);
        print('Line#',l, lines.length, lines[l][0]);
        // handle edges
        if (lines[l][0].x < 0 || lines[l][0].x > width ||
            lines[l][0].y < 0 || lines[l][0].y > height) {
                // remove line from array
                lines.splice(l,1);
                l = l - 1;
                // spawn 2 more lines
                createLineFromPixel();
                createLineFromPixel();
                print('added 2 lines');

        } else {
            print('linesheading', lines[l][0], lines[l][1]);
            if (checkpixel(lines[l][0],lines[l][1],lines[l][1].heading())) 
                //if new pixel is not already filled
            {
                // Draw point
                print('Draw Point');
                point(int(lines[l][0].x), int(lines[l][0].y));
                print(int(lines[l][0].x), int(lines[l][0].y));
                // move to next position - add velocity to the position
                lines[l][0].add(lines[l][1]);
            } else {
                // create two new lines starting from a random filled pixel
                // and rotate heading
                lines.splice(l,1);
                l = l -1;
                createLineFromPixel();
                createLineFromPixel();
                print('added 2 lines');
            }
        }   
        l=l+1;
    }
 }


 function checkpixel(pixelpos, pixelvel, pixelheading) {
    // Check x and y position of vector in pixel array
    //let pixelhdg = pixelarray[int(pixelpos.y)][int(pixelpos.x)];
    let chkvel = pixelvel;
    chkvel.setHeading(pixelheading+90);
    let chkpos = pixelpos;
    pixelpos.add(chkvel);
    print('pixelpos ',pixelpos);
    print("chk",chkpos.x, chkpos.y);
    print(get(int(chkpos.x),int(chkpos.y)));
    print(get(int(chkpos.x-1),int(chkpos.y)));
    print(get(int(chkpos.x+1),int(chkpos.y)));
    if ((get(int(chkpos.x),int(chkpos.y)) == "0,0,0,0")||
        (get(int(chkpos.x-1),int(chkpos.y)) == "0,0,0,0") ||
        (get(int(chkpos.x+1),int(chkpos.y)) == "0,0,0,0") ||
        (get(int(chkpos.x),int(chkpos.y-1)) == "0,0,0,0") ||
        (get(int(chkpos.x),int(chkpos.y+1)) == "0,0,0,0")) {
            print(pixelpos,pixelvel,chkpos,chkvel,'filled');
            return false; // filled
        } else {
             //set pixel to heading
            pixelarray[int(chkpos.y)*width + int(chkpos.x)] = pixelheading;
            return true; // not filled - ok to draw
        }
        
        //print(pixelcolor);
        //if (pixelcolor.toString() == "0,0,0,0"){
        //    print(pixelpos,pixelvel,chkpos,chkvel,'filled');
        //    return false; // filled
        //if (pixelcolor.toString() == "255,255,255,255") {
        //if (pixelhdg == -999) {
        //} else {
        //    //set pixel to heading
        //    pixelarray[int(chkpos.y)*width + int(chkpos.x)] = pixelheading;
        //    return true; // not filled - ok to draw
        //} 
 }

 function createLine(lineheading, linespeed) {
    let newline = ([createVector(int(random(width)),int(random(height))),
        createVector(0,linespeed)]); //set speed of line between 1 and 3
        newline[1].setHeading(lineheading);
    print('newline',newline);
    return newline;
 }

 function createLineFromPixel( ){
    // should spawn from existing line
    let startpos = int(random(pixelarray.length));
    let lineposx;
    let lineposy;
    let linehdg;
    let i = startpos;
    let found = false;
    print(i);
    print(pixelarray[i], i);
    while (!found && i <= pixelarray.length) {
        if (pixelarray[i] != -999) {
            found = true;
            lineposx = (i % width); // get pos
            lineposy = int(i / width);
            linehdg = pixelarray[i];
            pixelarray[i] = -999;
        }
        i++;
    }
    if (!found) {
        for (i = 0; i < startpos; i ++) {
            if (pixelarray[i] != -999) {
                found = true;
                lineposx = (i % width); // get pos
                lineposy = int(i / width);
                linehdg = pixelarray[i];
                pixelarray[i] = -999;
            }
        }
    }
    print(found);
    if (found) {
        //
        let linevel = createVector(0,1);
        linevel.setHeading(linehdg)
        print('B',linevel.heading());
        linevel.rotate(90);
        print('A',linevel.heading());
        let linepos = createVector(lineposx, lineposy);
        linepos.add(linevel);
        lines.push([linepos,linevel]);
        print('pushed new line',lines[length]);
    } else {
        print('Problem w/ newline')
    }
 }

 function keyPressed() {
    console.log(key);
    if (keyCode == BACKSPACE) {
        print(pixels);
    }
    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('substrate_' + timeStamp + 'png');
    }
 }
