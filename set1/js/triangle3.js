let c1,c2;

function setup() {
    createCanvas(600, 600);
    colorMode(HSB,255);
    frameRate(5);

    selectedPalette = palettes[int(random(8))];
    c1 = color(selectedPalette[int(random(4))]); // triangle fill color
    print("c1 =", c1);
    c1h = hue(c1);
    c1b = brightness(c1);
    print("c1 Hue =", c1h);

    //noLoop();
}
  
function draw() {
    
}

