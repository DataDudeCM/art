
  let walkers = [];
  let startAtEdge = false; // Set to false to start walkers anywhere in the canvas

  const lookAheadDistance = 5;
  const spawnChanceDecay = 0.85;
  const acuteAngleChance = 0.2;
  const startWidth = 5; // Starting width of the walkers

  // --- DOM Elements ---
  let spawnChanceSlider, alphaSlider, wobbleSlider, colorPicker, numWalkersSlider;

  function preload() {
    // 1) Load your brush image (e.g., Acrylic Basic.png)
    myBrush = loadImage('../common/brushes/Creamy.png');
  }

  function setup () {

    const canvasContainer = document.getElementById('canvas-container');
    //const canvasWidth = Math.min(window.innerWidth * 0.9, 1200);
    //const canvasHeight = Math.min(window.innerHeight * 0.7, 800);
    const canvasWidth = 1080; //2560
    const canvasHeight = 1080; //1600
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(canvasContainer);

    pg = createGraphics(canvasWidth, canvasHeight);
    //pg.parent(canvasContainer);

    pg.colorMode(RGB, 255, 255, 255, 50);
    colorMode(RGB, 255, 255, 255, 50);
    //colorMode(HSB, 360, 100, 100, 50);

    pg.backgroundColor = color('Light Gray');
    backgroundColor = color('Light Gray');

    randomSeed(millis());
    
    const controlsContainer = document.getElementById('controls-container');
    controlsContainer.classList.add('controls');
    
    createSliderControl('Starting Walkers:', 1, 5, 2, 1, (val) => val, 'walkers');
    createSliderControl('Spawn Chance:', 0, 0.05, 0.02, 0.001, (val) => `${nfc(val * 100, 1)}%`, 'spawn');
    createSliderControl('Start Alpha:', 5, 50, 20, 1, (val) => val, 'alpha');
    createSliderControl('Wobble Amount:', 0, 0.1, 0.01, 0.005, (val) => nfc(val, 3), 'wobble');
    
    let group = createDiv().parent(controlsContainer).class('slider-group');
    let container = createDiv().parent(group).class('slider-container');
    createSpan('Line Color:').parent(container);
    colorPicker = createInput('#2c3e50', 'color').parent(container);

    createP('Adjust settings, then click the canvas to start a new generation.')
      .parent(controlsContainer).style('margin', '0.5rem 0 0 0').style('font-size', '14px');
    
          // Initialize the library
    painter = new BrushArtist(myBrush);   
    startDrawing();
  };
  
  function createSliderControl(labelText, min, max, initial, step, labelFormatter, type) {
    let group = createDiv().parent(document.getElementById('controls-container')).class('slider-group');
    let container = createDiv().parent(group).class('slider-container');
    createSpan(labelText).parent(container);
    let slider = createSlider(min, max, initial, step).parent(container);
    let label = createSpan('').parent(container);
    
    const updateLabel = () => label.html(labelFormatter(slider.value()));
    slider.input(updateLabel);
    updateLabel();

    if (type === 'spawn') { spawnChanceSlider = slider; }
    else if (type === 'alpha') { alphaSlider = slider; }
    else if (type === 'wobble') { wobbleSlider = slider; }
    else if (type === 'walkers') { numWalkersSlider = slider; }
  }
  
  function startDrawing() {
      pg.colorMode(RGB, 255, 255, 255, 50);
      //colorMode(HSB, 360, 100, 100, 50);
      pg.background(backgroundColor);
      walkers = [];
      
      const numWalkers = numWalkersSlider.value();
      for (let i = 0; i < numWalkers; i++) {
          let startX, startY;
          let startDir;
          let startPos;

          const baseSpawnChance = spawnChanceSlider.value();
          const startAlpha = alphaSlider.value();
          const wobbleAmount = wobbleSlider.value();
          const selectedColor = color(colorPicker.value());

          if (startAtEdge != true) {
            startX  = random(width);
            startY  = random(height);   
            startDir = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
            startDir.normalize();
            startPos = createVector(startX, startY);
            // add an extra walker in the opposite direction
            let startDirOpposite = createVector(-startDir.x, -startDir.y);
            walkers.push(new Walker(startX, startY, startDirOpposite, startWidth, baseSpawnChance, HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
            walkers.push(new Walker(startX, startY, startDir, startWidth, baseSpawnChance, HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
          } else {

            const edge = floor(random(4));

            switch (edge) {
            case 0: // Top edge
                startX = random(width);
                startY = 1;
                startDir = createVector(random(-0.5, 0.5), 1);
                break;
            case 1: // Right edge
                startX = width - 1;
                startY = random(height);
                startDir = createVector(-1, random(-0.5, 0.5));
                break;
            case 2: // Bottom edge
                startX = random(width);
                startY = height - 1;
                startDir = createVector(random(-0.5, 0.5), -1);
                break;
            case 3: // Left edge
                startX = 1;
                startY = random(height);
                startDir = createVector(1, random(-0.5, 0.5));
                break;
            } 
            startDir.normalize();
            startPos = createVector(startX, startY);
            walkers.push(new Walker(startX, startY, startDir, startWidth, baseSpawnChance, HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount, selectedColor));
          }
      }
  }

  function draw() {
    for (let walker of walkers) {
      walker.update();
    }
    let allDone = walkers.every(w => w.isDone);
    if (allDone) {
      noLoop();
      console.log("All lines have stopped. Generation complete.");
    }
  };
  
  function mousePressed() {
      if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
          randomSeed(millis());
          startDrawing();
          loop();
      }
  }

  function keyReleased() {
    if (keyCode === DELETE || keyCode === BACKSPACE) {
      background(backgroundColor);
      walkers = [];
    }
    if (key === 'l' || key === 'L') {
      if (isLooping()) {
        noLoop();
      } else {
        loop();
      }
    }
    if (key === 's' || key === 'S') {
      // images go to Downloads folder
      let timeStamp = `${year()}-${month()}-${day()}-${hour()}-${minute()}-${second()}-${nf(millis(), 3, 0)}`;
      save(`walker_art_${timeStamp}.png`);
    }
  };
    class Walker {
    constructor(x, y, direction, width, spawnChance, branchAngle, glowLength, lastBranchPoint, startGlowAlpha, wobbleAmount, lineColor) {
      this.pos = createVector(x, y);
      this.dir = direction;
      this.width = width;
      this.spawnChance = spawnChance;
      this.isDone = false;
      
      this.branchAngle = branchAngle; 
      this.glowLength = glowLength;
      this.lastBranchPoint = lastBranchPoint;
      this.startGlowAlpha = startGlowAlpha;
      
      this.wobbleAmount = wobbleAmount;
      this.noiseSeed = random(1000);

      this.lineColor = lineColor; 
    }

    update() {
      if (this.isDone) return;
      
      if (this.wobbleAmount > 0) {
        let noiseValue = (noise(this.noiseSeed + frameCount * 0.01) - 0.5) * 2;
        this.dir.rotate(noiseValue * this.wobbleAmount);
      }
      
      // --- REFINED COLLISION DETECTION ---
      // Check not just one point, but a fan of three "whiskers"
      if (this.checkCollision()) {
        /*
        stroke('Black');
        fill('Black');
        strokeWeight(1);
        ellipse(this.pos.x, this.pos.y, this.width*2); 
        */
        this.isDone = true;
        return;
      }
      if (this.width < 0.5) {
        this.isDone = true; return;
      }

      this.pos.add(this.dir);

      pg.strokeWeight(this.width);
      pg.stroke(this.lineColor);
      pg.point(this.pos.x, this.pos.y);
      
      sketchyPaintedLine(this.pos.x, this.pos.y, this.pos.x - this.dir.x * 2, this.pos.y - this.dir.y * 2, {
        strokeColor: this.lineColor,
        size: this.width * 0.5,
        opacity: 10,
        ghosting: 4
      });


      this.drawGradientLine();

      if (random(1) < this.spawnChance && this.width > 0.5) {
        this.spawn();
      }
    }

    // --- NEW: More robust collision check method ---
    checkCollision() {
      // Define the three "whiskers"
      const whiskerAngle = QUARTER_PI / 3; // ~15 degrees
      let probes = [
        this.dir.copy(), // Straight ahead
        this.dir.copy().rotate(whiskerAngle), // Left whisker
        this.dir.copy().rotate(-whiskerAngle) // Right whisker
      ];

      // Check each probe
      for (let probeDir of probes) {
        let probePos = p5.Vector.add(this.pos, p5.Vector.mult(probeDir, lookAheadDistance));
        
        // 1. Check against canvas edges
        if (probePos.x < 0 || probePos.x >= width || probePos.y < 0 || probePos.y >= height) {
          return true; // Collision detected
        }

        // 2. Check against other lines
        let c = pg.get(probePos.x, probePos.y);
        if (pg.brightness(c) < 95) { 
          return true; // Collision detected
        }
      }
      return false; // No collision detected
    }

    drawGradientLine() {
      if (this.startGlowAlpha < 1 || this.glowLength < 1 || this.width < 1) return;

      const rotationDirection = Math.sign(this.branchAngle);
      const rotation = HALF_PI * rotationDirection;
      let perpDir = this.dir.copy().rotate(rotation);
      
      pg.strokeWeight(1); 
      // The power to which the fade is raised. A higher number means a faster fade.
      const fadeExponent = 5;

      for (let i = 0; i < this.glowLength; i++) {
        let progress = i / this.glowLength;
        let alpha = this.startGlowAlpha * pow(1.0 - progress, fadeExponent);
        if (alpha < 1) continue;

        let pixelPos = p5.Vector.add(this.pos, p5.Vector.mult(perpDir, i));
        
        pg.stroke(red(this.lineColor), green(this.lineColor), blue(this.lineColor), alpha);
        pg.point(pixelPos.x, pixelPos.y);
      }
    }

    spawn() {
      const childGlowLength = this.pos.dist(this.lastBranchPoint) * 0.75;
      
      let angle;
      if (random(1) < acuteAngleChance) {
        angle = (random(1) < 0.5) ? QUARTER_PI : -QUARTER_PI;
      } else {
        angle = (random(1) < 0.5) ? HALF_PI : -HALF_PI;
      }
      
      let newDir = this.dir.copy().rotate(angle);
      let newWidth = this.width * 0.8; // Reduce width for child walkers
      let newSpawnChance = this.spawnChance * spawnChanceDecay;

      // --- HUE SHIFT LOGIC ---
      // Get the parent's hue
      let parentHue = hue(this.lineColor);
      // Calculate the new hue (5% of 360 is 18)
      let newHue = (parentHue + 10) % 360;
      // Create the new color, keeping saturation and brightness constant
      let newColor = pg.color(newHue, 80, 90);
      newColor = this.lineColor;

      walkers.push(new Walker(this.pos.x, this.pos.y, newDir, newWidth, newSpawnChance, angle, childGlowLength, this.pos.copy(), alphaSlider.value(), wobbleSlider.value(), newColor));
      this.lastBranchPoint = this.pos.copy();
    }
  }