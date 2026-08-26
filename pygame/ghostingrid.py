import React, { useEffect, useRef } from 'react';

const App = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let canvas;
    let watercolorLayer;
    let grid = [];
    const DIM = 15; // Grid dimension
    let w; // Cell width
    
    // Artistic Configuration
    const BLUR_STEPS = 8;
    const OPACITY = 12;
    const PALETTE = [
      { h: 200, s: 40, b: 90 }, // Soft Blue (Your signature)
      { h: 220, s: 20, b: 80 }, // Slate
      { h: 180, s: 30, b: 85 }, // Teal Wash
      { h: 240, s: 10, b: 95 }  // Ghostly White
    ];

    // Simple Tile Rules (Ghostly architecture)
    // 0: Empty, 1: Horizontal, 2: Vertical, 3: Corner
    const rules = [
      [0, 1, 3], // 0 can be next to 0, 1, or 3
      [1, 0, 2], // 1 can be next to 1, 0, or 2
      [2, 1, 3], // 2 can be next to 2, 1, or 3
      [3, 0, 1, 2] // 3 is a wildcard
    ];

    class Cell {
      constructor(i, j) {
        this.i = i;
        this.j = j;
        this.options = [0, 1, 2, 3];
        this.collapsed = false;
      }
    }

    const sketch = (p) => {
      p.setup = () => {
        canvas = p.createCanvas(700, 700);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        watercolorLayer = p.createGraphics(p.width, p.height);
        watercolorLayer.colorMode(p.HSB, 360, 100, 100, 100);
        watercolorLayer.background(0, 0, 98); // Creamy paper texture
        
        w = p.width / DIM;
        for (let j = 0; j < DIM; j++) {
          for (let i = 0; i < DIM; i++) {
            grid.push(new Cell(i, j));
          }
        }
      };

      p.draw = () => {
        p.image(watercolorLayer, 0, 0);
        
        // WFC Step-by-Step Evolution
        let nextCell = getMinEntropyCell();
        if (nextCell) {
          collapseCell(nextCell);
          propagateConstrains();
        } else {
          p.noLoop(); // Finished
        }
      };

      function getMinEntropyCell() {
        let gridCopy = grid.filter(c => !c.collapsed);
        if (gridCopy.length === 0) return null;
        
        gridCopy.sort((a, b) => a.options.length - b.options.length);
        let minEntropy = gridCopy[0].options.length;
        let candidates = gridCopy.filter(c => c.options.length === minEntropy);
        return p.random(candidates);
      }

      function collapseCell(cell) {
        cell.collapsed = true;
        const pick = p.random(cell.options);
        cell.options = [pick];
        
        // Instead of a tile, paint a "Ghost"
        drawWatercolorGhost(cell.i * w + w/2, cell.j * w + w/2, pick);
      }

      function propagateConstrains() {
        // Simplified propagation for visual effect
        // Real WFC would look at neighbors iteratively
      }

      function drawWatercolorGhost(x, y, type) {
        let colorData = p.random(PALETTE);
        let baseColor = p.color(colorData.h, colorData.s, colorData.b, OPACITY);
        
        watercolorLayer.push();
        watercolorLayer.translate(x, y);
        
        // Create the "Stain" effect
        for (let i = 0; i < BLUR_STEPS; i++) {
          let radius = p.map(i, 0, BLUR_STEPS, w * 1.5, w * 0.2);
          let offsetNoise = p.random(100);
          
          watercolorLayer.noStroke();
          watercolorLayer.fill(
            colorData.h, 
            colorData.s, 
            colorData.b, 
            p.map(i, 0, BLUR_STEPS, 1, OPACITY)
          );
          
          watercolorLayer.beginShape();
          for (let a = 0; a < p.TWO_PI; a += 0.2) {
            let r = radius + p.map(p.noise(p.cos(a) + offsetNoise, p.sin(a) + offsetNoise), 0, 1, -radius*0.3, radius*0.3);
            let sx = p.cos(a) * r;
            let sy = p.sin(a) * r;
            
            // Influence of the "Tile Type" on shape
            if (type === 1) sx *= 1.5; // Horizontal stretch
            if (type === 2) sy *= 1.5; // Vertical stretch
            if (type === 3) { sx += sy * 0.5; } // Sheared/Corner
            
            watercolorLayer.vertex(sx, sy);
          }
          watercolorLayer.endShape(p.CLOSE);
        }
        watercolorLayer.pop();
      }
    };

    const p5Instance = new window.p5(sketch, containerRef.current);
    return () => p5Instance.remove();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4">
      <div className="bg-white p-2 rounded-lg shadow-2xl overflow-hidden">
        <div ref={containerRef}></div>
      </div>
      <div className="mt-6 text-center max-w-md">
        <h2 className="text-white text-xl font-light tracking-widest uppercase">The Ghost in the Grid</h2>
        <p className="text-neutral-400 text-sm mt-2 italic">
          An algorithmic simulation where Wave Function Collapse dictates the presence of light, 
          rendered with the bleeding edges of digital watercolor.
        </p>
      </div>
    </div>
  );
};

export default App;