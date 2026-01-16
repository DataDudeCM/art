let img;
let audioContextStarted = false;
let pixelQueue = [];
let currentIndex = 0;

function preload() {
  // Load your image
  img = loadImage('../images/doodle6.jpg'); // Replace with the path to your image
}

function setup() {
  createCanvas(600, 400);
  
  // Resize the image to match the canvas size
  img.resize(width, height);
  img.loadPixels();
  
  // Create a button to start the audio context
  const startButton = createButton('Start Sound');
  startButton.position(10, 10);
  startButton.mousePressed(() => {
    Tone.start().then(() => {
      audioContextStarted = true;
      console.log('Audio context started');
      startButton.hide(); // Hide the button after starting the context
      preparePixelQueue(); // Prepare the queue of pixel data
      playSoundscape(); // Start playing soundscape
    });
  });
  
  // Display the image immediately
  image(img, 0, 0);
}

function draw() {
  if (!audioContextStarted) {
    // Display prompt text until audio context is started
    textSize(16);
    fill(0);
    noStroke();
    text('Click "Start Sound" to enable audio.', 10, height - 20);
  }
}

function preparePixelQueue() {
  // Prepare a queue of pixel data for sequential processing
  for (let y = 0; y < img.height; y += 10) {
    for (let x = 0; x < img.width; x += 10) {
      const index = (x + y * img.width) * 4;
      const brightness = img.pixels[index]; // Use red channel for brightness
      const freq = map(brightness, 0, 255, 100, 1000); // Map brightness to frequency
      pixelQueue.push(freq); // Add frequency to the queue
    }
  }
}

function playSoundscape() {
  if (currentIndex < pixelQueue.length) {
    // Play the current frequency
    const freq = pixelQueue[currentIndex];
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease(freq, "16n");
    
    // Move to the next frequency after a delay
    currentIndex++;
    setTimeout(playSoundscape, 200); // Adjust the delay (200ms) as needed
  } else {
    console.log('Soundscape finished!');
  }
}

function mapValue(input, inputMin, inputMax, outputMin, outputMax) {
    return ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
}