// 
// city

let isLoopingFlag = true;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;
let noiseLevel = 1; //1 straight; < 1 left, > 1 right
let noiseScale = .02; //1 straight; .02 default
let numbldgs = 50;
let bldgh,minbldgh;
let bldgw,minbldgw;
let bldgcount = 0;
let anchorx, anchory;
//let cnv1;
let img;

function preload() {
  img = loadImage('../images/marble_texture.jpg');
}

function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(windowWidth, windowHeight);
  bldgh = windowHeight *.7;
  minbldgh = bldgh * .1;
  bldgw = windowWidth *.1;
  minbldgw = bldgw * .2;
  
  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,360,100,100,100);

  /*
  selectedPalette = palettes[int(random(10,11))]; //set selectedPalette to the one with index i
  fillColor = color(selectedPalette[3]);
  outlineColor = selectedPalette[0];

  cnv1 = createGraphics(img.width, img.height);
  cnv1.colorMode(HSB,360,100,100,100);
  */  

  frameRate(2);

  //noLoop();

}

function draw() {
    numbldgs = map(mouseX,0,windowWidth,10,100);
    selectedPalette = palettes[int(random(8,11))]; //set selectedPalette to the one with index i
    //selectedPalette = palettes[10]; //set selectedPalette to the one with index i
    //pick drawing colors from palette
    //background(selectedPalette[1]);
    fillColor = color(selectedPalette[3]);
    outlineColor = selectedPalette[0];
    //outlineColor = color('White');
    background(selectedPalette[4]);

    for (i=0; i < numbldgs; i+=1) {

        anchorx=random(-windowWidth*.4,windowWidth*.4)+windowWidth*.5-bldgw*.33;
        anchory=windowHeight*.8;
        //consider adding probability of tall vs short buildings
        w=random(minbldgw,bldgw);
        h=random(minbldgh,bldgh);

        if (i < numbldgs * .3 ) {
            a = 80;
            sw = .5;
            w = w * .6;
            h = h * .6;
            l = 10;
        } else {
            if (i < numbldgs *.6) {
                a = 90;
                sw = 2;
                w = w * .8;
                h = h * .8;
                l = 50;
            } else {
                a = 100;
                sw = 3;
                l = 100;
            }
        }

        //set random fill color for each building
        fc = int(random(1,4)); //pick a random color for the buildings
        fillColor = selectedPalette[fc];
        if (l != 100) {
            fillColor = color(hue(fillColor),saturation(fillColor)-l,brightness(fillColor)-l,a);
        } else {
            fillColor = color(hue(fillColor), saturation(fillColor), brightness(fillColor),a);
        }

        //split building into 1-3 segments
        r = random();
        if (w > 50) { // if building isn't wide enough don't split it
          if (r < .6) { numsegments = 1;
          } else if (r < .9) { numsegments = 2;
          } else { numsegments = 3} ;
        } else numsegments = 1;
        h = h / numsegments;

        x = anchorx;
        y = anchory-h;

        for (j=0; j < numsegments; j++ ) {
          if (j > 0) {
            x = x + 8; 
            w = w- (2*8);
            h = h / (j+1);
            y = y - h - 8;
          }
          squigRect(x,y,w,h,sw, l, a, j, fillColor); //last parameter is transparency          }
        }
    }

    stroke(outlineColor);
    strokeWeight(2);
    line(0,windowHeight*.8,windowWidth,windowHeight*.8);

    applyGrain(mainCanvas);
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 'l' || key == 'L') {
    if (isLoopingFlag) {
      isLoopingFlag = false;
      noLoop()
    } else {
      isLoopingFlag = true;
      loop();
    }
  }
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('city_' + timeStamp + 'png');
    }
}
