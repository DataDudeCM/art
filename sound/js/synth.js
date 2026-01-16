let osc,fft;
let sliderStarty = 20;
let controls = [];
let playing = false;

function setup() {
  mainCanvas = createCanvas(1200, 400);
  //osc.start();
  //osc.amp(0); // Initially silent
  controls.push(new SliderControl('Frequency',100,1000,440,10,width+20,sliderStarty));
  controls.push(new SliderControl('Amplitude',0,1,.5,0.01,width+20,sliderStarty+30));

  fft = new p5.FFT();
  
}

function draw() {
  background(220);
  if (playing) {
    osc.freq(controls[0].update());
    osc.amp(controls[1].update());
  }
  let spectrum = fft.analyze();
  noStroke();
  fill(0, 255, 0);
  bandwidth = spectrum.length * .25;
  for (let i = 0; i < bandwidth; i++) {
    console.log(spectrum[i]);
    let x = map(i, 0, bandwidth, 0, width);
    let h = map(spectrum[i], 0, 255, 0, height);
    rect(x, height, width / bandwidth, -h);
  }
}

function keyReleased() {
  if (key == 'g' && !playing)  {
    osc = new p5.Oscillator('sawtooth');
    osc.start();
    osc.amp(0);
    playing = true;
  }
}



class SliderControl {
  constructor(name, min, max, start, step, x, y) {
    this.name = name;
    this.slider = createSlider(min, max, start, step);
    this.slider.position(x, y);
    // if name is null, don't create label
    if (name !== null) {
      this.label = createDiv(`${name}: ${start}`);
      this.label.position(x, y-10);
      this.label.style('font-family', 'Arial');
      this.label.style('font-size', '10px');
    }
  }
  
  update() {
    let val = this.slider.value();
    this.label.html(`${this.name}: ${val}`);
    return val;
  }
}