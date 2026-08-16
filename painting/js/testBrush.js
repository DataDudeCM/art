let brushes = {};
let brush = null;
let palette;

let controls = {};

let brushesReady = false;


// --------------------------------------------------
// Setup
// --------------------------------------------------

function setup() {
  createCanvas(800, 600);

  palette = getPalette("earthMagenta");

  createBrushControls();

  clearCanvas();

  loadBrushes();
}


// --------------------------------------------------
// Load brush manifest + images
// --------------------------------------------------

async function loadBrushes() {

  const response =
    await fetch("../common/brushes/brushes.json");

  const manifest =
    await response.json();

  const promises =
    manifest.brushes.map(filename =>
      loadBrushFile(filename)
    );

  await Promise.all(promises);

  populateBrushPicker();

  const names = Object.keys(brushes);

  if (names.length > 0) {
    brush = brushes[names[0]];
  }

  brushesReady = true;

  console.log(
    `Loaded ${names.length} brushes:`,
    names
  );
}


// --------------------------------------------------
// Convert p5 loadImage into a Promise
// --------------------------------------------------

function loadBrushFile(filename) {

  return new Promise((resolve, reject) => {

    const name =
      filename.replace(/\.[^/.]+$/, "");

    loadImage(
      "../common/brushes/" + filename,

      img => {
        brushes[name] = img;
        resolve();
      },

      error => {
        console.error(
          "Could not load brush:",
          filename,
          error
        );

        reject(error);
      }
    );

  });
}


// --------------------------------------------------
// Drawing
// --------------------------------------------------

function draw() {

  if (!brushesReady || !brush) {
    return;
  }

  if (
    mouseIsPressed &&
    mouseY >= 0 &&
    mouseY < height
  ) {

    const angle = atan2(
      mouseY - pmouseY,
      mouseX - pmouseX
    );

    paintStroke(
      brush,
      mouseX,
      mouseY,
      {
        size: controls.size.value(),
        angle,
        color: getAccentColor(palette),
        alpha: controls.alpha.value(),
        count: controls.count.value(),
        spacing: controls.spacing.value(),
        spread: controls.spread.value(),
        angleJitter: controls.angleJitter.value(),
        scaleJitter: controls.scaleJitter.value(),
        endAlpha: controls.endAlpha.value(),
        forwardOnly: controls.forwardOnly.checked(),
        flipX: controls.flipX.checked(),
        flipY: controls.flipY.checked()
      }
    );
  }
}


// --------------------------------------------------
// UI
// --------------------------------------------------

function createBrushControls() {

  const panel = createDiv();

  panel.style(
    "font-family",
    "sans-serif"
  );

  panel.style(
    "font-size",
    "14px"
  );

  panel.style(
    "padding",
    "12px"
  );

  panel.style(
    "background",
    "#eeeeee"
  );

  panel.style(
    "width",
    "350px"
  );


  // ------------------------------------------------
  // Brush picker
  // ------------------------------------------------

const brushRow = createDiv();
  brushRow.parent(panel);
  brushRow.style("margin-bottom", "10px");

  createSpan("Brush: ")
    .parent(brushRow);

  controls.brushSelect =
    createSelect();

  controls.brushSelect
    .parent(brushRow);

  controls.brushSelect.option(
    "Loading brushes..."
  );

  controls.brushSelect.attribute(
    "disabled",
    ""
  );

  controls.brushSelect.changed(() => {

    brush =
      brushes[
        controls.brushSelect.value()
      ];

  });

  function populateBrushPicker() {

    controls.brushSelect.elt.innerHTML = "";

    for (const name of Object.keys(brushes)) {

      controls.brushSelect.option(
        name,
        name
      );

    }

    controls.brushSelect.removeAttribute(
      "disabled"
    );
  }

  // ------------------------------------------------
  // Palette picker
  // ------------------------------------------------

  const paletteRow =
    createDiv();

  paletteRow.parent(panel);

  paletteRow.style(
    "margin-bottom",
    "14px"
  );

  createSpan("Palette: ")
    .parent(paletteRow);

  controls.paletteSelect =
    createSelect();

  controls.paletteSelect
    .parent(paletteRow);

  for (
    const name of
    getPaletteNames()
  ) {

    const p =
      getPalette(name);

    /*
     * Display the friendly palette name,
     * but keep the registry key as the value.
     */
    controls.paletteSelect.option(
      p.name,
      name
    );
  }

  controls.paletteSelect
    .selected("earthMagenta");

  controls.paletteSelect
    .changed(() => {

      palette =
        getPalette(
          controls.paletteSelect.value()
        );

    });


  // ------------------------------------------------
  // Sliders
  // ------------------------------------------------

  createControl(
    panel,
    "Size",
    "size",
    5,
    300,
    50,
    1
  );

  createControl(
    panel,
    "Alpha",
    "alpha",
    0,
    255,
    50,
    1
  );

  createControl(
    panel,
    "Count",
    "count",
    0,
    20,
    5,
    1
  );

  createControl(
    panel,
    "Spacing",
    "spacing",
    0,
    0.5,
    0.05,
    0.005
  );

  createControl(
    panel,
    "Spread",
    "spread",
    0,
    0.25,
    0.05,
    0.005
  );

  createControl(
    panel,
    "Angle Jitter",
    "angleJitter",
    0,
    PI,
    0.5,
    0.01
  );

  createControl(
    panel,
    "Scale Jitter",
    "scaleJitter",
    0,
    0.5,
    0.025,
    0.005
  );

  createControl(
    panel,
    "End Alpha",
    "endAlpha",
    0,
    255,
    3,
    1
  );


  // ------------------------------------------------
  // Checkboxes
  // ------------------------------------------------

  controls.forwardOnly =
    createCheckbox(
      " Forward only",
      true
    );

  controls.forwardOnly
    .parent(panel);

  createElement("br")
    .parent(panel);


  controls.flipX =
    createCheckbox(
      " Flip X",
      false
    );

  controls.flipX
    .parent(panel);

  createElement("br")
    .parent(panel);


  controls.flipY =
    createCheckbox(
      " Flip Y",
      false
    );

  controls.flipY
    .parent(panel);

  createElement("br")
    .parent(panel);


  // ------------------------------------------------
  // Clear button
  // ------------------------------------------------

  const clearButton =
    createButton(
      "Clear Canvas"
    );

  clearButton.parent(panel);

  clearButton.style(
    "margin-top",
    "10px"
  );

  clearButton.mousePressed(
    clearCanvas
  );
}


// --------------------------------------------------
// Slider helper
// --------------------------------------------------

function createControl(
  parent,
  label,
  key,
  minValue,
  maxValue,
  defaultValue,
  step
) {

  const row =
    createDiv();

  row.parent(parent);

  row.style(
    "margin-bottom",
    "8px"
  );


  createSpan(label + ": ")
    .parent(row);


  controls[key] =
    createSlider(
      minValue,
      maxValue,
      defaultValue,
      step
    );

  controls[key]
    .parent(row);


  const valueSpan =
    createSpan(
      defaultValue
    );

  valueSpan.parent(row);

  valueSpan.style(
    "margin-left",
    "8px"
  );


  controls[key]
    .input(() => {

      valueSpan.html(
        controls[key].value()
      );

    });
}


// --------------------------------------------------
// Canvas reset
// --------------------------------------------------

function clearCanvas() {

  background(
    getLightColor(palette)
  );
}