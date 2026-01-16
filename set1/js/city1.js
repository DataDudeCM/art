// 
// city

let isLoopingFlag = true;
let boundary = 5;
let selectedPalette;
let fillColor,outlineColor;
let noiseLevel = 1; //1 straight; < 1 left, > 1 right
let noiseScale = .02; //1 straight; .02 default
let numbldgs = 40;
let bldgh = 700;
let bldgw = 180;


function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(1600, 1100);


  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,360,100,100,100);

  frameRate(4);

  //noLoop();

}

function draw() {

    selectedPalette = palettes[int(random(2,9))]; //set selectedPalette to the one with index i
    selectedPalette = palettes[10]; //set selectedPalette to the one with index i
    //pick drawing colors from palette
    //background(selectedPalette[1]);
    fillColor = color(selectedPalette[3]);
    outlineColor = selectedPalette[0];
    //outlineColor = color('White');
    background(selectedPalette[4]);

    for (i=0; i < numbldgs; i+=1) {

        anchorx=random(-width*.4,width*.4)+width*.5-60;
        anchory=height*.8;
        w=random(30,bldgw);
        h=random(40,bldgh);
        x=anchorx;
        y=anchory-h;
        if (i < numbldgs * .25 ) {
            a = 100;
            sw = .5;
            l = 20;
        } else {
            if (i < numbldgs *.7) {
                a = 100;
                sw = 2;
                l = 50;
            } else {
                a = 100;
                sw = 3;
                l = 100;
            }
        }
        squigRect(x,y,w,h,sw, l, a); //last parameter is transparency

    }

    stroke(outlineColor);
    strokeWeight(2);
    line(0,height*.8,width,height*.8);

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
