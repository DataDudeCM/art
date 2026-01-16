/*
The idea is to use the elements of a wav or mp4 file to draw lines outward from a circle
 that has a radius of 50. The lines should be drawn outward from the circumference of the circle,
  starting from the top of the circle and continuing around based on the length of the song. 
  In other words, the length of the song should be divided by the circumference to determine how many lines can be drawn. 
  The length of the lines should be based on the amplitude of the song at that point in time. 
  The lines should be drawn, not as single lines, but rather as colored pixels evenly divided over
   the length of the line based on the waveform at that point in the song. Also, anytime a beat is detected, 
   a white outward line of length = 40 should be drawn over the top of the colored pixel line to indicate 
   where the beats are in the song
*/
let song;
let segments = [];
const baseRadius = 50;  // radius of the central circle
let numSegments;

function preload() {
  // Change the filename to your own audio file (mp3, wav, etc.)
  song = loadSound('');
}

function setup() {
  createCanvas(800, 800);../common/testmusic.mp3
  colorMode(HSB, 360, 100, 100);
  background(0);
  
  // Analyze the audio file once it’s loaded.
  // (This will run once and then we’ll use noLoop() to keep a static image.)
  analyzeSong();
  
  noLoop();  // since we’re drawing a static visualization.
}

function analyzeSong() {
  if (!song.isLoaded()) {
    console.log("Song not loaded yet.");
    return;
  }
  
  // Access the underlying AudioBuffer from the p5.SoundFile.
  let buffer = song.buffer;
  let totalSamples = buffer.length; // total number of samples in channel 0
  // We’ll use the circle’s circumference (in pixels) as our number of segments.
  numSegments = floor(TWO_PI * baseRadius);  // e.g., ~314 segments for baseRadius=50
  let samplesPerSegment = totalSamples / numSegments;
  
  // Get the first channel’s data (mono is fine for this visualization).
  let channelData = buffer.getChannelData(0);
  let rmsValues = [];
  
  // Process each segment.
  for (let i = 0; i < numSegments; i++) {
    let start = floor(i * samplesPerSegment);
    let end = floor((i + 1) * samplesPerSegment);
    let sumSq = 0;
    let segmentSamples = [];
    let sampleCount = end - start;
    
    // To avoid iterating over too many samples (a long song can have millions),
    // we’ll downsample the data in each segment to at most 100 values.
    let step = max(1, floor(sampleCount / 100));
    let count = 0;
    for (let j = start; j < end; j += step) {
      let sample = channelData[j];
      sumSq += sample * sample;
      segmentSamples.push(sample);
      count++;
    }
    let rms = sqrt(sumSq / count);
    rmsValues.push(rms);
    
    // Calculate the angle for this segment.
    // We map from -PI/2 (top of circle) to 3*PI/2 (making a full circle).
    let angle = map(i, 0, numSegments, -HALF_PI, 3 * HALF_PI);
    segments.push({
      angle: angle,
      rms: rms,
      waveform: segmentSamples  // downsampled waveform data for this segment
    });
  }
  
  // A very basic beat detection: mark segments as a beat if their RMS
  // is above (mean + 1 standard deviation). You might want to refine this.
  let meanRMS = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  let variance = rmsValues.reduce((acc, r) => acc + (r - meanRMS) * (r - meanRMS), 0) / rmsValues.length;
  let stdDev = sqrt(variance);
  let threshold = meanRMS + stdDev; // adjust factor as needed
  
  segments.forEach(seg => {
    seg.beat = seg.rms > threshold;
  });
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  
  // Draw the base circle.
  stroke(255);
  noFill();
  ellipse(0, 0, baseRadius * 2, baseRadius * 2);
  
  // To scale the line lengths appropriately, find the maximum RMS in our segments.
  let maxRMS = 0;
  segments.forEach(seg => {
    if (seg.rms > maxRMS) maxRMS = seg.rms;
  });
  
  // Set a scaling factor for converting RMS amplitude into a drawn line length.
  // (You can adjust this value to make the lines longer or shorter.)
  let scaleFactor = 400;
  
  // For each segment, draw its radial line.
  segments.forEach(seg => {
    // The length of the colored line is proportional to the RMS.
    let len = seg.rms * scaleFactor;
    // Use the integer length (in pixels) for drawing the series of points.
    let numPixels = max(1, floor(len));
    
    // Draw the colored pixel line.
    // We map the position along the line to an index in the segment’s waveform data
    // and use the sample value to pick a hue.
    for (let p = 0; p < numPixels; p++) {
      let t = map(p, 0, numPixels, 0, seg.waveform.length - 1);
      let sampleVal = seg.waveform[floor(t)];
      let hueVal = map(sampleVal, -1, 1, 0, 360);
      stroke(hueVal, 80, 100);
      let r = baseRadius + p;
      let x = r * cos(seg.angle);
      let y = r * sin(seg.angle);
      point(x, y);
    }
    
    // If a beat was detected for this segment, overlay a white line of fixed length (40 px)
    if (seg.beat) {
      stroke(0, 0, 100);  // white (in HSB: hue 0, 0 saturation, brightness 100)
      strokeWeight(2);
      let x1 = baseRadius * cos(seg.angle);
      let y1 = baseRadius * sin(seg.angle);
      let x2 = (baseRadius + 40) * cos(seg.angle);
      let y2 = (baseRadius + 40) * sin(seg.angle);
      line(x1, y1, x2, y2);
      strokeWeight(1);  // reset stroke weight
    }
  });
}

// Optional: click to toggle playback of the song.
function mousePressed() {
  if (song.isPlaying()) {
    song.pause();
  } else {
    song.play();
  }
}
