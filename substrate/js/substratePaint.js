// --- Sketch Scope ---
const sketch = (p) => {
  let walkers = [];
  let startAtEdge = false; // Set to false to start walkers anywhere in the canvas
  const backgroundColor = p.color('Light Gray');
  const lookAheadDistance = 5;
  const spawnChanceDecay = 0.85;
  const acuteAngleChance = 0.2;
  const startWidth = 5; // Starting width of the walkers

  // --- DOM Elements ---
  let spawnChanceSlider, alphaSlider, wobbleSlider, colorPicker, numWalkersSlider, brush;
  
  class Walker {
    constructor(x, y, direction, width, spawnChance, branchAngle, glowLength, lastBranchPoint, startGlowAlpha, wobbleAmount, lineColor) {
      this.pos = p.createVector(x, y);
      this.dir = direction;
      this.width = width;
      this.spawnChance = spawnChance;
      this.isDone = false;
      
      this.branchAngle = branchAngle; 
      this.glowLength = glowLength;
      this.lastBranchPoint = lastBranchPoint;
      this.startGlowAlpha = startGlowAlpha;
      
      this.wobbleAmount = wobbleAmount;
      this.noiseSeed = p.random(1000);

      this.lineColor = lineColor; 
    }

    update() {
      if (this.isDone) return;
      
      if (this.wobbleAmount > 0) {
        let noiseValue = (p.noise(this.noiseSeed + p.frameCount * 0.01) - 0.5) * 2;
        this.dir.rotate(noiseValue * this.wobbleAmount);
      }
      
      // --- REFINED COLLISION DETECTION ---
      // Check not just one point, but a fan of three "whiskers"
      if (this.checkCollision()) {
        /*
        p.stroke('Black');
        p.fill('Black');
        p.strokeWeight(1);
        p.ellipse(this.pos.x, this.pos.y, this.width*2); 
        */
        this.isDone = true;
        return;
      }
      if (this.width < 0.5) {
        this.isDone = true; return;
      }

      this.pos.add(this.dir);

      p.strokeWeight(this.width);
      p.stroke(this.lineColor);
      //p.point(this.pos.x, this.pos.y);
      let angle = p.atan2(this.dir.y, this.dir.x);
      // brush, position, size, color, angle, transparency, count
      paintStroke(p.brush, this.pos.x, this.pos.y, this.width*2, angle, this.lineColor, 50, 5);
      /*
      if (p.random(1) < 0.005) {
          p.strokeWeight(this.width * .5);
          p.stroke('Red');
          //p.fill('Red');
          p.ellipse(this.pos.x, this.pos.y, this.width * 4);  
      }       
      */

      this.drawGradientLine();

      if (p.random(1) < this.spawnChance && this.width > 0.5) {
        this.spawn();
      }
    }

    // --- NEW: More robust collision check method ---
    checkCollision() {
      // Define the three "whiskers"
      const whiskerAngle = p.QUARTER_PI / 3; // ~15 degrees
      let probes = [
        this.dir.copy(), // Straight ahead
        this.dir.copy().rotate(whiskerAngle), // Left whisker
        this.dir.copy().rotate(-whiskerAngle) // Right whisker
      ];

      // Check each probe
      for (let probeDir of probes) {
        let probePos = p5.Vector.add(this.pos, p5.Vector.mult(probeDir, lookAheadDistance));
        
        // 1. Check against canvas edges
        if (probePos.x < 0 || probePos.x >= p.width || probePos.y < 0 || probePos.y >= p.height) {
          return true; // Collision detected
        }

        // 2. Check against other lines
        let c = p.get(probePos.x, probePos.y);
        if (p.brightness(c) < 95) { 
          return true; // Collision detected
        }
      }
      return false; // No collision detected
    }

    drawGradientLine() {
      if (this.startGlowAlpha < 1 || this.glowLength < 1 || this.width < 1) return;

      const rotationDirection = Math.sign(this.branchAngle);
      const rotation = p.HALF_PI * rotationDirection;
      let perpDir = this.dir.copy().rotate(rotation);
      
      p.strokeWeight(1); 
      // The power to which the fade is raised. A higher number means a faster fade.
      const fadeExponent = 5;

      for (let i = 0; i < this.glowLength; i++) {
        let progress = i / this.glowLength;
        let alpha = this.startGlowAlpha * p.pow(1.0 - progress, fadeExponent);
        if (alpha < 1) continue;

        let pixelPos = p5.Vector.add(this.pos, p5.Vector.mult(perpDir, i));
        
        p.stroke(p.red(this.lineColor), p.green(this.lineColor), p.blue(this.lineColor), alpha);
        p.point(pixelPos.x, pixelPos.y);
      }
    }

    spawn() {
      const childGlowLength = this.pos.dist(this.lastBranchPoint) * 0.75;
      
      let angle;
      if (p.random(1) < acuteAngleChance) {
        angle = (p.random(1) < 0.5) ? p.QUARTER_PI : -p.QUARTER_PI;
      } else {
        angle = (p.random(1) < 0.5) ? p.HALF_PI : -p.HALF_PI;
      }
      
      let newDir = this.dir.copy().rotate(angle);
      let newWidth = this.width * 0.8; // Reduce width for child walkers
      let newSpawnChance = this.spawnChance * spawnChanceDecay;

      // --- HUE SHIFT LOGIC ---
      // Get the parent's hue
      let parentHue = p.hue(this.lineColor);
      // Calculate the new hue (5% of 360 is 18)
      let newHue = (parentHue + 10) % 360;
      // Create the new color, keeping saturation and brightness constant
      let newColor = p.color(newHue, 80, 90);
      newColor = this.lineColor;

      walkers.push(new Walker(this.pos.x, this.pos.y, newDir, newWidth, newSpawnChance, angle, childGlowLength, this.pos.copy(), alphaSlider.value(), wobbleSlider.value(), newColor));
      this.lastBranchPoint = this.pos.copy();
    }
  }

  p.preload = () => {
    brush = p.loadImage('../brushes/Acrylic Glaze.png');  
  }

  p.setup = () => {
    const canvasContainer = document.getElementById('canvas-container');
    //const canvasWidth = Math.min(window.innerWidth * 0.9, 1200);
    //const canvasHeight = Math.min(window.innerHeight * 0.7, 800);
    const canvasWidth = 1080; //2560
    const canvasHeight = 1080; //1600
    let cnv = p.createCanvas(canvasWidth, canvasHeight);
    cnv.parent(canvasContainer);

    p.colorMode(p.RGB, 255, 255, 255, 50);
    //p.colorMode(p.HSB, 360, 100, 100, 50);

    p.randomSeed(p.millis());
    
    const controlsContainer = document.getElementById('controls-container');
    controlsContainer.classList.add('controls');
    
    createSliderControl('Starting Walkers:', 1, 5, 2, 1, (val) => val, 'walkers');
    createSliderControl('Spawn Chance:', 0, 0.05, 0.02, 0.001, (val) => `${p.nfc(val * 100, 1)}%`, 'spawn');
    createSliderControl('Start Alpha:', 5, 50, 20, 1, (val) => val, 'alpha');
    createSliderControl('Wobble Amount:', 0, 0.1, 0.01, 0.005, (val) => p.nfc(val, 3), 'wobble');
    
    let group = p.createDiv().parent(controlsContainer).class('slider-group');
    let container = p.createDiv().parent(group).class('slider-container');
    p.createSpan('Line Color:').parent(container);
    colorPicker = p.createInput('#2c3e50', 'color').parent(container);

    p.createP('Adjust settings, then click the canvas to start a new generation.')
      .parent(controlsContainer).style('margin', '0.5rem 0 0 0').style('font-size', '14px');
    
    startDrawing();
  };
  
  function createSliderControl(labelText, min, max, initial, step, labelFormatter, type) {
    let group = p.createDiv().parent(document.getElementById('controls-container')).class('slider-group');
    let container = p.createDiv().parent(group).class('slider-container');
    p.createSpan(labelText).parent(container);
    let slider = p.createSlider(min, max, initial, step).parent(container);
    let label = p.createSpan('').parent(container);
    
    const updateLabel = () => label.html(labelFormatter(slider.value()));
    slider.input(updateLabel);
    updateLabel();

    if (type === 'spawn') { spawnChanceSlider = slider; }
    else if (type === 'alpha') { alphaSlider = slider; }
    else if (type === 'wobble') { wobbleSlider = slider; }
    else if (type === 'walkers') { numWalkersSlider = slider; }
  }
  
  function startDrawing() {
      p.colorMode(p.RGB, 255, 255, 255, 50);
      //p.colorMode(p.HSB, 360, 100, 100, 50);
      p.background(backgroundColor);
      walkers = [];
      
      const numWalkers = numWalkersSlider.value();
      for (let i = 0; i < numWalkers; i++) {
          let startX, startY;
          let startDir;
          let startPos;

          const baseSpawnChance = spawnChanceSlider.value();
          const startAlpha = alphaSlider.value();
          const wobbleAmount = wobbleSlider.value();
          const selectedColor = p.color(colorPicker.value());

          if (startAtEdge != true) {
            startX  = p.random(p.width);
            startY  = p.random(p.height);   
            startDir = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
            startDir.normalize();
            startPos = p.createVector(startX, startY);
            // add an extra walker in the opposite direction
            let startDirOpposite = p.createVector(-startDir.x, -startDir.y);
            walkers.push(new Walker(startX, startY, startDirOpposite, startWidth, baseSpawnChance, p.HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
            walkers.push(new Walker(startX, startY, startDir, startWidth, baseSpawnChance, p.HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
          } else {

            const edge = p.floor(p.random(4));

            switch (edge) {
            case 0: // Top edge
                startX = p.random(p.width);
                startY = 1;
                startDir = p.createVector(p.random(-0.5, 0.5), 1);
                break;
            case 1: // Right edge
                startX = p.width - 1;
                startY = p.random(p.height);
                startDir = p.createVector(-1, p.random(-0.5, 0.5));
                break;
            case 2: // Bottom edge
                startX = p.random(p.width);
                startY = p.height - 1;
                startDir = p.createVector(p.random(-0.5, 0.5), -1);
                break;
            case 3: // Left edge
                startX = 1;
                startY = p.random(p.height);
                startDir = p.createVector(1, p.random(-0.5, 0.5));
                break;
            } 
            startDir.normalize();
            startPos = p.createVector(startX, startY);
            walkers.push(new Walker(startX, startY, startDir, startWidth, baseSpawnChance, p.HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
          }
      }
  }

  

  p.draw = () => {
    for (let walker of walkers) {
      walker.update();
    }
    let allDone = walkers.every(w => w.isDone);
    if (allDone) {
      p.noLoop();
      console.log("All lines have stopped. Generation complete.");
    }
  };

  
  
  p.mousePressed = () => {
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
          p.randomSeed(p.millis());
          startDrawing();
          p.loop();
      }
  }

  p.keyReleased = () => {
    if (p.keyCode === p.DELETE || p.keyCode === p.BACKSPACE) {
      p.background(backgroundColor);
      walkers = [];
    }
    if (p.key === 'l' || p.key === 'L') {
      if (p.isLooping()) {
        p.noLoop();
      } else {
        p.loop();
      }
    }
    if (p.key === 's' || p.key === 'S') {
      // images go to Downloads folder
      let timeStamp = `${p.year()}-${p.month()}-${p.day()}-${p.hour()}-${p.minute()}-${p.second()}-${p.nf(p.millis(), 3, 0)}`;
      p.save(`walker_art_${timeStamp}.png`);
    }
  };

};

new p5(sketch);