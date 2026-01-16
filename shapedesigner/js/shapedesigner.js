
        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('drawingCanvas');
            const ctx = canvas.getContext('2d');

            const startBtn = document.getElementById('startBtn');
            const addAnotherBtn = document.getElementById('addAnotherBtn');
            const endShapeBtn = document.getElementById('endShapeBtn');
            const saveShapesBtn = document.getElementById('saveShapesBtn');
            const outputContainer = document.getElementById('outputContainer');
            const outputTextarea = document.getElementById('output');
            const copyBtn = document.getElementById('copyBtn');

            // --- State Management ---
            let isDrawing = false;
            let currentShape = []; // Stores vertices for the shape being drawn
            let allShapes = []; // Stores all completed shapes in the composition
            
            // --- Drawing Area Configuration ---
            let drawingArea = { x: 0, y: 0, size: 0 };

            /**
             * Sets up the canvas dimensions and drawing area.
             */
            function setupCanvas() {
                const parent = canvas.parentElement;
                const smallerDim = Math.min(parent.clientWidth, window.innerHeight * 0.7);
                canvas.width = smallerDim;
                canvas.height = smallerDim;
                
                drawingArea.size = canvas.width * 0.85; 
                drawingArea.x = (canvas.width - drawingArea.size) / 2;
                drawingArea.y = (canvas.height - drawingArea.size) / 2;

                draw(); // Redraw everything after resize
            }

            /**
             * The Chaikin algorithm for curve smoothing.
             */
            function chaikin(points, iterations = 2) {
                if (points.length < 3) return points;
                let smoothed = points;
                for (let i = 0; i < iterations; i++) {
                    const input = smoothed;
                    smoothed = [];
                    if (input.length > 0) smoothed.push(input[0]);
                    for (let j = 0; j < input.length - 1; j++) {
                        const p0 = input[j];
                        const p1 = input[j+1];
                        const pA = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
                        const pB = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
                        smoothed.push(pA, pB);
                    }
                    if (input.length > 1) smoothed.push(input[input.length - 1]);
                }
                return smoothed;
            }

            /**
             * Main drawing function.
             */
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#4a4a4a';
                ctx.lineWidth = 2;
                ctx.strokeRect(drawingArea.x, drawingArea.y, drawingArea.size, drawingArea.size);

                // Draw all the completed shapes in a dimmer color
                allShapes.forEach(shape => drawShape(shape, '#666666'));
                
                // Draw the active shape in a bright color
                drawShape(currentShape, 'white');
                
                // Draw the vertices for the active shape
                ctx.fillStyle = '#ef4444'; // Red vertices
                currentShape.forEach(v => {
                    const canvasX = drawingArea.x + v.x;
                    const canvasY = drawingArea.y + v.y;
                    ctx.beginPath();
                    ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            
            /**
             * Helper to draw a single shape.
             */
            function drawShape(shapeVertices, color) {
                if (shapeVertices.length < 2) return;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                let pointsToDraw = (shapeVertices.length > 2) ? chaikin(shapeVertices) : shapeVertices;
                ctx.beginPath();
                const startCanvasX = drawingArea.x + pointsToDraw[0].x;
                const startCanvasY = drawingArea.y + pointsToDraw[0].y;
                ctx.moveTo(startCanvasX, startCanvasY);
                for (let i = 1; i < pointsToDraw.length; i++) {
                    const canvasX = drawingArea.x + pointsToDraw[i].x;
                    const canvasY = drawingArea.y + pointsToDraw[i].y;
                    ctx.lineTo(canvasX, canvasY);
                }
                ctx.stroke();
            }

            /**
             * Handles click events on the canvas.
             */
            function handleCanvasClick(event) {
                if (!isDrawing) return;
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;

                if (mouseX >= drawingArea.x && mouseX <= drawingArea.x + drawingArea.size &&
                    mouseY >= drawingArea.y && mouseY <= drawingArea.y + drawingArea.size) {
                    const vertexX = mouseX - drawingArea.x;
                    const vertexY = mouseY - drawingArea.y;
                    currentShape.push({ x: vertexX, y: vertexY });
                    draw();
                }
            }
            
            // --- Button Event Listeners ---

            // 'Start Drawing' now acts as a full reset.
            startBtn.addEventListener('click', () => {
                isDrawing = true;
                currentShape = [];
                allShapes = []; // Clears all previous work
                
                startBtn.disabled = true;
                addAnotherBtn.disabled = true;
                endShapeBtn.disabled = false;
                saveShapesBtn.disabled = true;

                outputContainer.classList.add('hidden');
                outputTextarea.value = '';
                draw();
            });

            // 'Add Another Shape' starts a new shape segment without clearing the canvas.
            addAnotherBtn.addEventListener('click', () => {
                isDrawing = true;
                currentShape = []; // Just start a new shape
                
                startBtn.disabled = true;
                addAnotherBtn.disabled = true;
                endShapeBtn.disabled = false;
                saveShapesBtn.disabled = true;
                draw();
            });

            // 'End Shape' finalizes the current shape and allows you to add another or save.
            endShapeBtn.addEventListener('click', () => {
                if (currentShape.length >= 2) {
                    allShapes.push(currentShape);
                }
                isDrawing = false;
                currentShape = [];

                startBtn.disabled = false; // You can always choose to reset everything
                addAnotherBtn.disabled = false; // Now you can add another
                endShapeBtn.disabled = true;
                saveShapesBtn.disabled = allShapes.length === 0;

                draw();
            });

            saveShapesBtn.addEventListener('click', () => {
                if (allShapes.length === 0) return;
                const jsonString = JSON.stringify(allShapes, null, 2);
                outputTextarea.value = jsonString;
                outputContainer.classList.remove('hidden');
            });
            
            copyBtn.addEventListener('click', () => {
                outputTextarea.select();
                try {
                    document.execCommand('copy');
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    copyBtn.textContent = 'Error Copying';
                }
            });

            // --- Initial Setup ---
            window.addEventListener('resize', setupCanvas);
            canvas.addEventListener('click', handleCanvasClick);
            setupCanvas();
        });
