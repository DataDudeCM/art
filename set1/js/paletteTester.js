//palette tester

function setup() {
  createCanvas(800, 900);
  background('Cornsilk');
  border = 18;
  boxwidth = 60;

  //let selectedPalette = palettes[int(random(0,1))];
  for (i in palettes) {
    selectedPalette = palettes[i]; //set selectedPalette to the one with index i
    for (let index = 0; index < selectedPalette.length; index++) {
      fill(selectedPalette[index]);
      //ellipse((index+1)*border,border*(i)+border, 50, 50);
      rect(border+(index*(boxwidth+border)),border+(i*(boxwidth+border)), boxwidth, boxwidth);
    }
  }
  

}

function draw() {
  //background(220);

}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('physics1_' + timeStamp + 'png');
    }
}
