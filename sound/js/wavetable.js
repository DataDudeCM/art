// p5.js code for a vocal-like synthesizer
let osc1, osc2, noise, env, filter1, filter2, lfo;
let sequence = [
  { freq: 300, dur: 0.2 }, // Mimics a short "syllable"
  { freq: 600, dur: 0.2 },
  { freq: 900, dur: 0.3 },
  { freq: 500, dur: 0.1 },
];
let currentStep = 0;

function setup() {
  createCanvas(400, 200);
  textAlign(CENTER, CENTER);

  // Oscillators for vocal tones
  osc1 = new p5.Oscillator('sawtooth');
  osc2 = new p5.Oscillator('triangle');
  osc1.start();
  osc2.start();
  osc1.amp(0);
  osc2.amp(0);

  // Noise for breathiness
  noise = new p5.Noise('white');
  noise.start();
  noise.amp(0);

  // Filters to simulate formants
  filter1 = new p5.BandPass();
  filter2 = new p5.BandPass();
  osc1.disconnect();
  osc2.disconnect();
  noise.disconnect();
  osc1.connect(filter1);
  osc2.connect(filter2);
  noise.connect(filter1);

  // Envelope for articulation
  env = new p5.Envelope();
  env.setADSR(0.05, 0.1, 0.5, 0.2);
  env.setRange(0.8, 0);

  // LFO for vibrato
  lfo = new p5.Oscillator('sine');
  lfo.freq(5); // 5 Hz vibrato
  lfo.amp(50); // +/- 50 Hz
  lfo.start();
  lfo.disconnect();
  lfo.connect(osc1.freq);

  // Start rhythm
  frameRate(4); // Rhythm pace (4 steps per second)
}

function draw() {
  background(50);
  fill(255);
  text('Vocal Synth Playing', width / 2, height / 2);
  console.log('Hi');
  // Check if user has interacted
  if (getAudioContext().state !== 'running') {
    text('Click to Start Audio', width / 2, height / 2 + 20);
    return;
  }

  // Get the current step in the sequence
  let step = sequence[currentStep % sequence.length];
  currentStep++;

  // Set formant frequencies
  filter1.freq(step.freq);
  filter2.freq(step.freq + 200); // Slightly offset for richness
  filter1.res(15);
  filter2.res(10);

  // Trigger envelopes
  env.play(osc1, 0, step.dur);
  env.play(osc2, 0, step.dur);
  env.play(noise, 0, step.dur * 0.5);
}

function mousePressed() {
  // Ensure audio context is running
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}
