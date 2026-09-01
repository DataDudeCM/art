let uploadedTextureImage = null;
let uploadedTextureName = null;

function loadTextureFile(file) {
  if (!file) {
    return;
  }

  const objectURL =
    URL.createObjectURL(file);

  loadImage(
    objectURL,

    img => {
      uploadedTextureImage = img;
      uploadedTextureName = file.name;

      URL.revokeObjectURL(objectURL);

      updateTextureFileDisplay();

      renderArtwork();
    },

    error => {
      URL.revokeObjectURL(objectURL);

      console.error(
        "Could not load texture image:",
        error
      );
    }
  );
}

function updateTextureFileDisplay() {
  const display =
    document.getElementById(
      "texture-file-name"
    );

  if (!display) {
    return;
  }

  display.textContent =
    uploadedTextureName ||
    "No texture selected";
}