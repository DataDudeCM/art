let sourceInput;
let mapInput;

let modeSelect;

let strengthXSlider;
let strengthYSlider;

let flowStrengthSlider;
let noiseScaleSlider;
let angleSlider;

let controlPanel;
let imageMapGroup;
let flowFieldGroup;

let sourceInfo;
let beforeAfterButton;

function createUI() {
  applyUIPalette();

  controlPanel = createDiv();
  controlPanel.id("control-panel");

  // -----------------------
  // Header
  // -----------------------

  const header = createDiv();
  header.addClass("panel-header");
  header.parent(controlPanel);

  const title = createDiv("DISPLACEMENT MAPPER");
  title.addClass("panel-title");
  title.parent(header);

  const subtitle = createDiv(
    "Pixel displacement laboratory"
  );
  subtitle.addClass("panel-subtitle");
  subtitle.parent(header);

  // -----------------------
  // Source
  // -----------------------

  const sourceSection =
    createSection("SOURCE");

  sourceInput =
    createFileInput(handleSourceFile);

  sourceInput.addClass("file-input");
  sourceInput.parent(sourceSection);

  sourceInfo =
    createDiv("No image loaded");

  sourceInfo.addClass("source-info");
  sourceInfo.parent(sourceSection);

  // -----------------------
  // Mode
  // -----------------------

  const modeSection =
    createSection("MODE");

  modeSelect = createSelect();

  modeSelect.option(
    "Image Map",
    "imageMap"
  );

  modeSelect.option(
    "Flow Field",
    "flowField"
  );

  modeSelect.selected(mode);
  modeSelect.addClass("mode-select");
  modeSelect.parent(modeSection);

  modeSelect.changed(() => {
    mode = modeSelect.value();

    updateControlVisibility();
    tryRender();
  });

  // -----------------------
  // Image Map
  // -----------------------

  imageMapGroup = createDiv();
  imageMapGroup.parent(controlPanel);

  const imageMapSection =
    createSection(
      "DISPLACEMENT MAP",
      imageMapGroup
    );

  mapInput =
    createFileInput(handleMapFile);

  mapInput.addClass("file-input");
  mapInput.parent(imageMapSection);

  strengthXSlider =
    createSliderControl(
      "Horizontal",
      0,
      200,
      30,
      1,
      imageMapGroup,
      value => value,
      () => {
        if (mode === "imageMap") {
          tryRender();
        }
      }
    );

  strengthYSlider =
    createSliderControl(
      "Vertical",
      0,
      200,
      30,
      1,
      imageMapGroup,
      value => value,
      () => {
        if (mode === "imageMap") {
          tryRender();
        }
      }
    );

  // -----------------------
  // Flow Field
  // -----------------------

  flowFieldGroup = createDiv();
  flowFieldGroup.parent(controlPanel);

  flowStrengthSlider =
    createSliderControl(
      "Strength",
      0,
      200,
      35,
      1,
      flowFieldGroup,
      value => value,
      () => {
        if (mode === "flowField") {
          tryRender();
        }
      }
    );

  noiseScaleSlider =
    createSliderControl(
      "Noise Scale",
      0.001,
      0.05,
      0.008,
      0.001,
      flowFieldGroup,
      value => Number(value).toFixed(3),
      () => {
        if (mode === "flowField") {
          tryRender();
        }
      }
    );

  angleSlider =
    createSliderControl(
      "Angle Multiplier",
      1,
      8,
      2,
      1,
      flowFieldGroup,
      value => value,
      () => {
        if (mode === "flowField") {
          tryRender();
        }
      }
    );

  // -----------------------
  // View
  // -----------------------

  const viewSection =
    createSection("VIEW");

  beforeAfterButton =
    createButton("SHOW BEFORE");

  beforeAfterButton.addClass(
    "secondary-button"
  );

  beforeAfterButton.parent(viewSection);

  beforeAfterButton.mousePressed(() => {
    showBefore = !showBefore;

    updateBeforeAfterButton();
  });

  const hint =
    createDiv("SPACE toggles before / after");

  hint.addClass("keyboard-hint");
  hint.parent(viewSection);

  updateControlVisibility();
  updateBeforeAfterButton();
}

function createSection(
  title,
  parent = controlPanel
) {
  const section = createDiv();
  section.addClass("control-section");
  section.parent(parent);

  const label = createDiv(title);
  label.addClass("section-title");
  label.parent(section);

  return section;
}

function createSliderControl(
  label,
  min,
  max,
  initial,
  step,
  parent,
  formatter,
  onInput
) {
  const group = createDiv();
  group.addClass("slider-control");
  group.parent(parent);

  const labelRow = createDiv();
  labelRow.addClass("slider-label-row");
  labelRow.parent(group);

  const labelElement =
    createSpan(label);

  labelElement.addClass("slider-label");
  labelElement.parent(labelRow);

  const valueElement =
    createSpan(formatter(initial));

  valueElement.addClass("slider-value");
  valueElement.parent(labelRow);

  const slider =
    createSlider(
      min,
      max,
      initial,
      step
    );

  slider.addClass("control-slider");
  slider.parent(group);

  slider.input(() => {
    valueElement.html(
      formatter(slider.value())
    );

    onInput();
  });

  return slider;
}

function updateControlVisibility() {
  if (!imageMapGroup || !flowFieldGroup) {
    return;
  }

  if (mode === "imageMap") {
    imageMapGroup.show();
    flowFieldGroup.hide();
  } else {
    imageMapGroup.hide();
    flowFieldGroup.show();
  }
}

function updateSourceInfo() {
  if (!sourceInfo) {
    return;
  }

  if (!sourceImg) {
    sourceInfo.html(
      "No image loaded"
    );

    return;
  }

  sourceInfo.html(
    `${sourceImg.width} × ${sourceImg.height}`
  );
}

function updateBeforeAfterButton() {
  if (!beforeAfterButton) {
    return;
  }

  beforeAfterButton.html(
    showBefore
      ? "SHOW AFTER"
      : "SHOW BEFORE"
  );
}

function applyUIPalette() {
  const palette =
    getPalette("industrialSun");

  if (!palette) {
    return;
  }

  const dark =
    getColorByRole(
      palette,
      "dark",
      false
    );

  const warm =
    getColorByRole(
      palette,
      "warm",
      false
    );

  const cool =
    getColorByRole(
      palette,
      "cool",
      false
    );

  const neutral =
    getColorByRole(
      palette,
      "neutral",
      false
    );

  const light =
    getColorByRole(
      palette,
      "light",
      false
    );

  const root =
    document.documentElement;

  root.style.setProperty(
    "--ui-dark",
    dark
  );

  root.style.setProperty(
    "--ui-warm",
    warm
  );

  root.style.setProperty(
    "--ui-cool",
    cool
  );

  root.style.setProperty(
    "--ui-neutral",
    neutral
  );

  root.style.setProperty(
    "--ui-light",
    light
  );
}