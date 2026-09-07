let activeDrawnStroke = null;
let isDrawingBoundary = false;

function setupBoundaryInput(canvasElement) {
  canvasElement.addEventListener(
    "pointerdown",
    handleBoundaryPointerDown
  );

  canvasElement.addEventListener(
    "pointermove",
    handleBoundaryPointerMove
  );

  canvasElement.addEventListener(
    "pointerup",
    handleBoundaryPointerUp
  );

  canvasElement.addEventListener(
    "pointercancel",
    handleBoundaryPointerUp
  );
}

function handleBoundaryPointerDown(event) {
  if (SETTINGS.boundary.source !== "drawn") {
    return;
  }

  isDrawingBoundary = true;

  activeDrawnStroke = {
    points: []
  };

  drawnBoundaryStrokes.push(
    activeDrawnStroke
  );

  addBoundaryPointerPoint(event);

  event.currentTarget.setPointerCapture(
    event.pointerId
  );
}

function handleBoundaryPointerMove(event) {
  if (
    SETTINGS.boundary.source !== "drawn" ||
    !isDrawingBoundary ||
    !activeDrawnStroke
  ) {
    return;
  }

  addBoundaryPointerPoint(event);
}

function handleBoundaryPointerUp(event) {
  if (!isDrawingBoundary) {
    return;
  }

  addBoundaryPointerPoint(event);

  isDrawingBoundary = false;
  activeDrawnStroke = null;

  if (
    event.currentTarget.hasPointerCapture(
      event.pointerId
    )
  ) {
    event.currentTarget.releasePointerCapture(
      event.pointerId
    );
  }
}

function addBoundaryPointerPoint(event) {
  const canvasElement =
    event.currentTarget;

  const rect =
    canvasElement.getBoundingClientRect();

  const x =
    (event.clientX - rect.left) *
    (width / rect.width);

  const y =
    (event.clientY - rect.top) *
    (height / rect.height);

  const point = {
    x,
    y,
    time: performance.now(),
    pressure: event.pressure,
    pointerType: event.pointerType
  };

  activeDrawnStroke.points.push(point);

  drawBoundaryPreview();
}

function drawBoundaryPreview() {
  drawingPreviewLayer.clear();

  drawingPreviewLayer.push();

  drawingPreviewLayer.noFill();
  drawingPreviewLayer.stroke(30);
  drawingPreviewLayer.strokeWeight(2);
  drawingPreviewLayer.strokeJoin(ROUND);
  drawingPreviewLayer.strokeCap(ROUND);

  for (const stroke of drawnBoundaryStrokes) {
    if (stroke.points.length < 2) {
      continue;
    }

    drawingPreviewLayer.beginShape();

    for (const point of stroke.points) {
      drawingPreviewLayer.vertex(
        point.x,
        point.y
      );
    }

    drawingPreviewLayer.endShape();
  }

  drawingPreviewLayer.pop();

  renderArtwork();
}