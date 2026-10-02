let img1, img2;
let uploadedImg1 = null;
let uploadedImg2 = null;
let gridResolution = 10; // Initial grid cells per row/column
let imgReadyCount = 0;
const targetImgWidth = 800; // Desired width for display
const targetImgHeight = 600; // Desired height for display
let patternType = 'alternating'; // Default pattern type
let noiseOffset = 0; // For animating Perlin noise over time

function setup() {
    createCanvas(targetImgWidth, targetImgHeight);
    background(220); // A light grey background
    noLoop(); // Don't continuously redraw unless something changes

    // Get input elements
    const imgUpload1 = document.getElementById('imageUpload1');
    const imgUpload2 = document.getElementById('imageUpload2');
    const gridSlider = document.getElementById('gridSlider');
    const gridValueSpan = document.getElementById('gridValue');
    const patternSelector = document.getElementById('patternSelector'); // New pattern selector

    // Event listeners for file inputs
    imgUpload1.addEventListener('change', (event) => handleImageUpload(event, 1));
    imgUpload2.addEventListener('change', (event) => handleImageUpload(event, 2));

    // Event listener for grid slider
    gridSlider.addEventListener('input', () => {
        gridResolution = parseInt(gridSlider.value);
        gridValueSpan.textContent = gridResolution;
        if (uploadedImg1 && uploadedImg2) {
            redraw(); // Redraw when slider changes if images are loaded
        }
    });

    // Event listener for pattern selector
    patternSelector.addEventListener('change', () => {
        patternType = patternSelector.value;
        // If Perlin noise is selected, we might want to loop for animation
        if (patternType === 'perlin') {
            loop(); // Start looping for animation
        } else {
            noLoop(); // Stop looping for static patterns
        }
        if (uploadedImg1 && uploadedImg2) {
            redraw(); // Redraw with the new pattern
        }
    });

    // Initial instruction
    textSize(20);
    textAlign(CENTER, CENTER);
    text('Upload two images to begin!', width / 2, height / 2);

    // Initialize Perlin noise for consistent results (optional, but good practice)
    noiseSeed(random(10000));
}

function handleImageUpload(event, imgNumber) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadImage(e.target.result, (img) => {
                if (imgNumber === 1) {
                    uploadedImg1 = img;
                } else {
                    uploadedImg2 = img;
                }
                imgReadyCount++;
                if (imgReadyCount === 2) {
                    // Both images are loaded, now resize and draw
                    img1 = uploadedImg1;
                    img2 = uploadedImg2;
                    resizeAndDrawImages();
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

function resizeAndDrawImages() {
    // This function scales the uploaded images to "cover" the target dimensions.
    // This means the image will be scaled up until both target dimensions are met
    // or exceeded, and then it will be centered, effectively cropping any excess.

    // Process Image 1
    let ratio1 = Math.max(targetImgWidth / uploadedImg1.width, targetImgHeight / uploadedImg1.height);
    let scaledWidth1 = uploadedImg1.width * ratio1;
    let scaledHeight1 = uploadedImg1.height * ratio1;
    let offsetX1 = (targetImgWidth - scaledWidth1) / 2;
    let offsetY1 = (targetImgHeight - scaledHeight1) / 2;

    let tempImg1 = createGraphics(targetImgWidth, targetImgHeight);
    // Draw the original image onto the temporary graphics buffer,
    // scaled and offset to cover the entire target area.
    tempImg1.image(uploadedImg1, offsetX1, offsetY1, scaledWidth1, scaledHeight1);
    img1 = tempImg1; // Assign the processed image to img1

    // Process Image 2
    let ratio2 = Math.max(targetImgWidth / uploadedImg2.width, targetImgHeight / uploadedImg2.height);
    let scaledWidth2 = uploadedImg2.width * ratio2;
    let scaledHeight2 = uploadedImg2.height * ratio2;
    let offsetX2 = (targetImgWidth - scaledWidth2) / 2;
    let offsetY2 = (targetImgHeight - scaledHeight2) / 2;

    let tempImg2 = createGraphics(targetImgWidth, targetImgHeight);
    // Draw the original image onto the temporary graphics buffer,
    // scaled and offset to cover the entire target area.
    tempImg2.image(uploadedImg2, offsetX2, offsetY2, scaledWidth2, scaledHeight2);
    img2 = tempImg2; // Assign the processed image to img2
    
    // Redraw after images are processed, regardless of pattern type
    redraw(); 
}


function draw() {
    if (img1 && img2) {
        clear(); // Clear the canvas for a fresh draw
        const cellWidth = width / gridResolution;
        const cellHeight = height / gridResolution;

        // Set stroke properties for the cell outlines
        stroke(150); // A medium gray color for the outlines
        strokeWeight(.11); // A thin stroke weight

        for (let i = 0; i < gridResolution; i++) {
            for (let j = 0; j < gridResolution; j++) {
                const x = i * cellWidth;
                const y = j * cellHeight;

                let useImg1 = false; // Flag to determine which image to use

                switch (patternType) {
                    case 'alternating':
                        useImg1 = (i + j) % 2 === 0;
                        break;
                    case 'random':
                        useImg1 = random(1) > 0.5; // 50% chance for either image
                        break;
                    case 'perlin':
                        // Scale i and j to a smaller range for noise input
                        // Add noiseOffset for animation over time
                        let noiseVal = noise(i * 0.1, j * 0.1, noiseOffset); 
                        useImg1 = noiseVal > 0.5; // If noise value is above 0.5, use img1
                        break;
                }

                if (useImg1) {
                    // Draw a slice of img1
                    image(img1.get(x, y, cellWidth, cellHeight), x, y, cellWidth, cellHeight);
                } else {
                    // Draw a slice of img2
                    image(img2.get(x, y, cellWidth, cellHeight), x, y, cellWidth, cellHeight);
                }
                
                // Draw the outline for the current cell
                noFill(); // Ensure the rectangle is just an outline
                rect(x, y, cellWidth, cellHeight);
            }
        }

        // Increment noiseOffset for animation if Perlin noise is active
        if (patternType === 'perlin') {
            noiseOffset += 0.01; // Adjust this value for faster/slower animation
        }
    }
}
