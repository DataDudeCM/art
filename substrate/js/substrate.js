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
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-align: center;
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: 10px;
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
      // This is a self-invoking function to keep all our variables out of the global scope.
      const sketch = (p) => {
        let walkers = [];
        const backgroundColor = p.color(248, 248, 240);
        const lineColor = p.color(20, 20, 20);
        const lookAheadDistance = 5;
        const spawnChanceDecay = 0.85;

        // --- DOM Elements ---
        let spawnChanceSlider;
        let spawnChanceLabel;

        /**
         * The Walker class represents a single line-drawing agent.
         */
        class Walker {
          constructor(x, y, direction, width, spawnChance) {
            this.pos = p.createVector(x, y);
            this.dir = direction;
            this.width = width;
            this.spawnChance = spawnChance;
            this.isDone = false;
          }

          update() {
            if (this.isDone) return;

            let probe = p5.Vector.add(this.pos, p5.Vector.mult(this.dir, lookAheadDistance));
            if (probe.x <= 0 || probe.x >= p.width || probe.y <= 0 || probe.y >= p.height) {
              this.isDone = true;
              return;
            }
            let c = p.get(probe.x, probe.y);
            if (c[0] !== p.red(backgroundColor)) {
              this.isDone = true;
              return;
            }
            
            this.pos.add(this.dir);
            p.strokeWeight(this.width);
            p.stroke(lineColor);
            p.point(this.pos.x, this.pos.y);

            if (p.random(1) < this.spawnChance && this.width > 0.5) {
              this.spawn();
            }
          }

          spawn() {
            let newDir = this.dir.copy();
            let angle = p.random([p.HALF_PI, -p.HALF_PI]);
            newDir.rotate(angle);

            let newWidth = this.width * 0.75;
            let newSpawnChance = this.spawnChance * spawnChanceDecay;

            walkers.push(new Walker(this.pos.x, this.pos.y, newDir, newWidth, newSpawnChance));
          }
        }

        /**
         * setup() is called once when the sketch starts.
         */
        p.setup = () => {
          const canvasContainer = document.getElementById('canvas-container');
          const canvasWidth = Math.min(window.innerWidth * 0.9, 800);
          const canvasHeight = Math.min(window.innerHeight * 0.7, 600);
          let cnv = p.createCanvas(canvasWidth, canvasHeight);
          cnv.parent(canvasContainer);
          p.randomSeed(p.millis());
          
          // --- Create Controls ---
          const controlsContainer = document.getElementById('controls-container');
          controlsContainer.classList.add('controls');
          
          const sliderContainer = p.createDiv();
          sliderContainer.parent(controlsContainer);
          sliderContainer.class('slider-container');
          
          let label = p.createSpan('Spawn Chance: ');
          label.parent(sliderContainer);

          // Create the slider: min, max, initial value, step
          spawnChanceSlider = p.createSlider(0, 0.05, 0.01, 0.001);
          spawnChanceSlider.parent(sliderContainer);
          
          spawnChanceLabel = p.createSpan('');
          spawnChanceLabel.parent(sliderContainer);
          updateSliderLabel();

          // Update label text whenever slider is moved
          spawnChanceSlider.input(updateSliderLabel);
          
          // Add instruction text
          let instruction = p.createP('Adjust the slider, then click the canvas to start a new generation.');
          instruction.parent(controlsContainer);
          instruction.style('margin', '0');
          instruction.style('font-size', '14px');
          
          startDrawing();
        };

        function updateSliderLabel() {
            // Format the value as a percentage with one decimal place.
            let percent = p.nfc(spawnChanceSlider.value() * 100, 1) + '%';
            spawnChanceLabel.html(percent);
        }
        
        /**
         * Initializes or resets the drawing.
         */
        function startDrawing() {
            p.background(backgroundColor);
            walkers = [];
            
            let startX = p.random(p.width * 0.2, p.width * 0.8);
            let startY = p.random(p.height * 0.2, p.height * 0.8);
            
            let startDir = p.createVector(p.random([-1, 1]), p.random([-1, 1]));
            startDir.normalize(); 
            
            // Get the current spawn chance from the slider
            const baseSpawnChance = spawnChanceSlider.value();
            
            // Create the first walker with the initial width and the base spawn chance from the slider.
            walkers.push(new Walker(startX, startY, startDir, 4, baseSpawnChance));
        }

        /**
         * draw() is called repeatedly in a loop, creating the animation.
         */
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
        
        /**
         * p.mousePressed() is a p5.js event that triggers on a mouse click.
         */
        p.mousePressed = () => {
            if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
                p.randomSeed(p.millis());
                startDrawing();
                p.loop();
            }
        }
      };
      
      // Instantiate the p5 sketch.
      new p5(sketch);
    </script>
  </body>
</html>
