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
  // Update with your own audio file if needed.
  song = loadSound('../common/testmusic.mp3');
}

function setup() {
  createCanvas(800, 800);
  colorMode(HSB, 360, 100, 100);
  background(0);
  
  // Pre-analyze the song into segments.
  analyzeSong();
  
  // Now we let draw() loop continuously so the visualization updates.
}

function analyzeSong() {
  if (!song.isLoaded()) {
    console.log("Song not loaded yet.");
    return;
  }
  
  // Access the audio buffer from the p5.SoundFile.
  let buffer = song.buffer;
  let totalSamples = buffer.length; // total samples in channel 0
  // We'll use the circle’s circumference (in pixels) as our number of segments.
  numSegments = floor(TWO_PI * baseRadius);  // e.g., ~314 segments for baseRadius=50
  let samplesPerSegment = totalSamples / numSegments;
  
  // Get the first channel’s data.
  let channelData = buffer.getChannelData(0);
  let rmsValues = [];
  
  // Process each segment.
  for (let i = 0; i < numSegments; i++) {
    let start = floor(i * samplesPerSegment);
    let end = floor((i + 1) * samplesPerSegment);
    let sumSq = 0;
    let segmentSamples = [];
    let sampleCount = end - start;
    
    // Downsample to at most 100 values per segment.
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
    
    // Map segment index to an angle around the circle.
    // Starting at -HALF_PI (top) and going around full circle.
    let angle = map(i, 0, numSegments, -HALF_PI, 3 * HALF_PI);
    segments.push({
      angle: angle,
      rms: rms,
      waveform: segmentSamples  // downsampled waveform for this segment
    });
  }
  
  // Simple beat detection: mark segments as a beat if their RMS exceeds (mean + stdDev).
  let meanRMS = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  let variance = rmsValues.reduce((acc, r) => acc + (r - meanRMS) ** 2, 0) / rmsValues.length;
  let stdDev = sqrt(variance);
  let threshold = meanRMS + stdDev; // tweak this threshold if needed
  
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
  
  // Determine how many segments to draw based on the song's progress.
  // Each segment corresponds to a time interval of song.duration() / numSegments.
  let currentTime = song.currentTime();
  let totalDuration = song.duration();
  let currentSegmentIndex = floor((currentTime / totalDuration) * numSegments);
  currentSegmentIndex = constrain(currentSegmentIndex, 0, numSegments);
  
  // Optional: find maximum RMS among drawn segments to scale line lengths.
  let maxRMS = 0;
  for (let i = 0; i < currentSegmentIndex; i++) {
    if (segments[i].rms > maxRMS) maxRMS = segments[i].rms;
  }
  // Adjust this factor to change how long the lines appear.
  let scaleFactor = 600;
  
  // Draw segments up to the current segment index.
  for (let i = 0; i < currentSegmentIndex; i++) {
    let seg = segments[i];
    // The length of the colored line is based on the segment's RMS.
    let len = seg.rms * scaleFactor;
    let numPixels = max(1, floor(len));
    
    // Draw the colored pixel line.
    // Here we map positions along the line to indices in the segment's waveform data.
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
    
    // If a beat was detected for this segment, overlay a white line.
    if (seg.beat) {
      stroke(0, 0, 100);  // white in HSB (hue 0, saturation 0, brightness 100)
      strokeWeight(2);
      let x1 = baseRadius * cos(seg.angle);
      let y1 = baseRadius * sin(seg.angle);
      let x2 = (baseRadius + 40) * cos(seg.angle);
      let y2 = (baseRadius + 40) * sin(seg.angle);
      line(x1, y1, x2, y2);
      strokeWeight(1);
    }
  }
}

// Click to toggle song playback.
function mousePressed() {
  if (song.isPlaying()) {
    song.pause();
  } else {
    song.play();
  }
}
