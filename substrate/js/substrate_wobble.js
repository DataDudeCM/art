<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-M" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recursive Line Art - p5.js</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #1a1a1a;
        font-family: 'Inter', sans-serif;
      }
      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      canvas {
        display: block;
        box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
        border-radius: 8px;
      }
      .controls {
          color: #f0f0f0;
          background-color: #2a2a2a;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          width: 300px;
      }
      .slider-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        justify-content: space-between;
      }
      /* Simple styling for the slider */
      input[type=range] {
        -webkit-appearance: none;
        width: 150px;
        background: transparent;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #4a90e2;
        cursor: pointer;
        margin-top: -6px; /* You need to specify a margin in Chrome, but not in Firefox */
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: #555;
        border-radius: 4px;
      }
    </style>
    <!-- Include the p5.js library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <main>
        <div id="canvas-container"></div>
        <div id="controls-container"></div>
    </main>
    <script>
      // --- Sketch Scope ---
      const sketch = (p) => {
        let walkers = [];
        const backgroundColor = p.color(248, 248, 240);
        const lineColor = p.color(20, 20, 20);
        const lookAheadDistance = 5;
        const spawnChanceDecay = 0.85;
        const acuteAngleChance = 0.1; // 10% chance for a 45-degree turn

        // --- DOM Elements ---
        let spawnChanceSlider, alphaSlider, wobbleSlider;
        
        /**
         * The Walker class.
         */
        class Walker {
          constructor(x, y, direction, width, spawnChance, branchAngle, glowLength, lastBranchPoint, startGlowAlpha, wobbleAmount) {
            this.pos = p.createVector(x, y);
            this.dir = direction;
            this.width = width;
            this.spawnChance = spawnChance;
            this.isDone = false;
            
            this.branchAngle = branchAngle; 
            this.glowLength = glowLength;
            this.lastBranchPoint = lastBranchPoint;
            this.startGlowAlpha = startGlowAlpha; // The max alpha for the glow's start.
            
            this.wobbleAmount = wobbleAmount;
            this.noiseSeed = p.random(1000);
          }

          update() {
            if (this.isDone) return;
            
            if (this.wobbleAmount > 0) {
              let noiseValue = (p.noise(this.noiseSeed + p.frameCount * 0.01) - 0.5) * 2;
              let wobbleAngle = noiseValue * this.wobbleAmount;
              this.dir.rotate(wobbleAngle);
            }

            let probe = p5.Vector.add(this.pos, p5.Vector.mult(this.dir, lookAheadDistance));
            if (probe.x <= 0 || probe.x >= p.width || probe.y <= 0 || probe.y >= p.height) {
              this.isDone = true;
              return;
            }
            let c = p.get(probe.x, probe.y);
            if (c[0] < 220) {
              this.isDone = true;
              return;
            }
            
            this.pos.add(this.dir);

            p.strokeWeight(this.width);
            p.stroke(lineColor);
            p.point(this.pos.x, this.pos.y);

            this.drawGradientLine();

            if (p.random(1) < this.spawnChance && this.width > 0.5) {
              this.spawn();
            }
          }

          /**
           * Draws the glow line pixel-by-pixel with an accelerated fade.
           */
          drawGradientLine() {
            if (this.startGlowAlpha < 1 || this.glowLength < 1) return;

            const rotationDirection = Math.sign(this.branchAngle);
            const rotation = p.HALF_PI * rotationDirection;
            let perpDir = this.dir.copy().rotate(rotation);
            
            p.strokeWeight(1); 

            // The power to which the fade is raised. > 1 for faster fade, < 1 for slower.
            const fadeExponent = 2;

            for (let i = 0; i < this.glowLength; i++) {
              // Calculate a normalized progress (0 to 1) along the glow line.
              let progress = i / this.glowLength;

              // Calculate the alpha using an exponential fade (ease-in curve).
              // Instead of linear `1 - progress`, we use `pow(1 - progress, exponent)`.
              let alpha = this.startGlowAlpha * p.pow(1.0 - progress, fadeExponent);
              
              if (alpha < 1) continue; // Optimization: stop if it's basically invisible.

              let pixelPos = p5.Vector.add(this.pos, p5.Vector.mult(perpDir, i));
              
              p.stroke(p.red(lineColor), p.green(lineColor), p.blue(lineColor), alpha);
              p.point(pixelPos.x, pixelPos.y);
            }
          }

          spawn() {
            const childGlowLength = this.pos.dist(this.lastBranchPoint);
            let angle;
            if (p.random(1) < acuteAngleChance) {
              angle = p.random([p.QUARTER_PI, -p.QUARTER_PI]);
            } else {
              angle = p.random([p.HALF_PI, -p.HALF_PI]);
            }
            let newDir = this.dir.copy().rotate(angle);
            let newWidth = this.width * 0.75;
            let newSpawnChance = this.spawnChance * spawnChanceDecay;

            walkers.push(new Walker(this.pos.x, this.pos.y, newDir, newWidth, newSpawnChance, angle, childGlowLength, this.pos.copy(), alphaSlider.value(), wobbleSlider.value()));
            this.lastBranchPoint = this.pos.copy();
          }
        }

        p.setup = () => {
          const canvasContainer = document.getElementById('canvas-container');
          const canvasWidth = Math.min(window.innerWidth * 0.9, 800);
          const canvasHeight = Math.min(window.innerHeight * 0.7, 600);
          let cnv = p.createCanvas(canvasWidth, canvasHeight);
          cnv.parent(canvasContainer);
          p.randomSeed(p.millis());
          
          const controlsContainer = document.getElementById('controls-container');
          controlsContainer.classList.add('controls');
          
          createSliderControl('Spawn Chance:', 0, 0.05, 0.01, 0.001, (val) => `${p.nfc(val * 100, 1)}%`, 'spawn');
          createSliderControl('Start Alpha:', 5, 50, 20, 1, (val) => val, 'alpha');
          createSliderControl('Wobble Amount:', 0, 0.1, 0, 0.005, (val) => p.nfc(val, 3), 'wobble');

          p.createP('Adjust sliders, then click the canvas to start a new generation.')
            .parent(controlsContainer).style('margin', '0.5rem 0 0 0').style('font-size', '14px');
          
          startDrawing();
        };
        
        // Helper function to create slider controls cleanly
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
        }
        
        function startDrawing() {
            p.background(backgroundColor);
            walkers = [];
            
            let startX = p.random(p.width * 0.2, p.width * 0.8);
            let startY = p.random(p.height * 0.2, p.height * 0.8);
            let startPos = p.createVector(startX, startY);
            let startDir = p.createVector(p.random([-1, 1]), p.random([-1, 1])).normalize(); 
            
            const baseSpawnChance = spawnChanceSlider.value();
            const startAlpha = alphaSlider.value();
            const wobbleAmount = wobbleSlider.value();
            
            walkers.push(new Walker(startX, startY, startDir, 4, baseSpawnChance, p.HALF_PI, 15, startPos.copy(), startAlpha, wobbleAmount));
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
      };
      
      new p5(sketch);
    </script>
  </body>
</html>
