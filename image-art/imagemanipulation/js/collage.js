let loadedImages = [];
let backgroundImage;
let isDrawing = false;
let messageElement;
let canvas;
// This variable controls the transparency of the images
let alphaValue = 200;

function preload() {
    // Preload is now empty as images are loaded dynamically
}

function setup() {
    // Create a canvas that fills the window
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Set the background to black initially
    background(0);
    
    // Set a frame rate to slow down the collage process
    frameRate(5);
    
    // No outlines for the shapes
    noStroke();
    
    // Get UI elements
    messageElement = document.getElementById('message');
    const backgroundInput = document.getElementById('backgroundInput');
    const collageInput = document.getElementById('collageInput');
    const backgroundUploadArea = document.getElementById('background-upload-area');
    const collageUploadArea = document.getElementById('collage-upload-area');
    
    // Attach event listeners for background image
    backgroundUploadArea.addEventListener('dragover', (event) => { event.preventDefault(); backgroundUploadArea.style.borderColor = '#aaa'; });
    backgroundUploadArea.addEventListener('dragleave', (event) => { event.preventDefault(); backgroundUploadArea.style.borderColor = '#444'; });
    backgroundUploadArea.addEventListener('drop', (event) => { event.preventDefault(); backgroundUploadArea.style.borderColor = '#444'; handleBackgroundFile(event.dataTransfer.files[0]); });
    backgroundInput.addEventListener('change', (event) => { handleBackgroundFile(event.target.files[0]); });

    // Attach event listeners for collage images
    collageUploadArea.addEventListener('dragover', (event) => { event.preventDefault(); collageUploadArea.style.borderColor = '#aaa'; });
    collageUploadArea.addEventListener('dragleave', (event) => { event.preventDefault(); collageUploadArea.style.borderColor = '#444'; });
    collageUploadArea.addEventListener('drop', (event) => { event.preventDefault(); collageUploadArea.style.borderColor = '#444'; handleCollageFiles(event.dataTransfer.files); });
    collageInput.addEventListener('change', (event) => { handleCollageFiles(event.target.files); });
}

function handleBackgroundFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showMessage("Please select an image file for the background.");
        return;
    }

    showMessage("Loading background image...");
    
    loadImage(URL.createObjectURL(file), (img) => {
        backgroundImage = img;
        // Draw the background image once in setup
        image(backgroundImage, 0, 0, width, height);
        showMessage("Background loaded! Now add collage images.");
        document.getElementById('background-upload-area').style.display = 'none';
        document.getElementById('collage-upload-area').style.display = 'block';
    });
}

function handleCollageFiles(files) {
    if (files.length === 0) {
        showMessage("Please select at least one image for the collage.");
        return;
    }
    if (!backgroundImage) {
        showMessage("Please load a background image first.");
        return;
    }

    showMessage(`Loading ${files.length} images...`);
    
    let filesToLoad = Array.from(files).filter(file => file.type.startsWith('image/'));
    let loadedCount = 0;
    
    if (filesToLoad.length === 0) {
        showMessage("No valid image files found.");
        return;
    }

    for (let file of filesToLoad) {
        loadImage(URL.createObjectURL(file), (img) => {
            loadedImages.push(img);
            loadedCount++;
            showMessage(`Loading images... (${loadedCount} of ${filesToLoad.length})`);
            if (loadedCount === filesToLoad.length) {
                isDrawing = true;
                showMessage("Ready! Collage is building.");
                document.getElementById('upload-container').style.display = 'none';
            }
        });
    }
}

function showMessage(msg) {
    messageElement.innerText = msg;
    messageElement.classList.add('show');
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

function draw() {
    if (isDrawing) {
        if (loadedImages.length === 0) {
            return;
        }
        
        let destX = random(width);
        let destY = random(height);
        let randomRotation = floor(random(4)) * HALF_PI;

        push();
        
        let randomImage = random(loadedImages);
        let imgWidth = randomImage.width;
        let imgHeight = randomImage.height;

        let pieceWidth = random(10, min(imgWidth, width*.75));
        let pieceHeight = random(10, min(imgHeight, height*.75));
        
        //translate(destX + pieceWidth / 2, destY + pieceHeight / 2);
        translate(destX, destY);
        rotate(randomRotation);

        let srcX = random(imgWidth - pieceWidth);
        let srcY = random(imgHeight - pieceHeight);
        
        // Randomly choose a blend mode
        let modes = [MULTIPLY, MULTIPLY, SCREEN]; 
        let chosenMode = random(modes);
        
        blendMode(chosenMode);
        
        // Set transparency for the image using tint()
        tint(255, random(alphaValue*.5,alphaValue)); // Random alpha between 50 and alphaValue*2

        // Draw the image piece
        image(
            randomImage,
            -pieceWidth / 2, -pieceHeight / 2, pieceWidth, pieceHeight,
            srcX, srcY, pieceWidth, pieceHeight
        );
        stroke('White');
        strokeWeight(4);
        noFill();   
        //rect(-pieceWidth / 2, -pieceHeight / 2, pieceWidth, pieceHeight);


        // Revert blend mode and tint to normal
        blendMode(BLEND);
        noTint();
        
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (backgroundImage) {
        image(backgroundImage, 0, 0, width, height);
    }
}