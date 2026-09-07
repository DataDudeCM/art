function createChaikinBoundarySource() {
  return {
    type: "chaikin",

    generate() {
      let controlPoints =
        generateControlPoints(
          SETTINGS.boundary.pointCount,
          SETTINGS.boundary.scale
        );

      controlPoints =
        softenControlPoints(
          controlPoints,
          SETTINGS.boundary.cornerSoftness,
          SETTINGS.boundary.softeningPasses
        );

      const points =
        chaikin(
          controlPoints,
          SETTINGS.boundary.subdivisions
        );

      return {
        type: "path",

        controlPoints:
          controlPoints.map(p => ({
            x: p.x,
            y: p.y
          })),

        points:
          points.map(p => ({
            x: p.x,
            y: p.y
          })),

        closed: true
      };
    }
  };
}

function createRectangleBoundarySource() {
  return {
    type: "rectangle",

    generate() {
      const rectWidth = width * 0.35;
      const rectHeight = height * 0.35;

      const rectX = (width - rectWidth) / 2;
      const rectY = (height - rectHeight) / 2;

      const points = [
        { x: rectX,             y: rectY },
        { x: rectX + rectWidth, y: rectY },
        { x: rectX + rectWidth, y: rectY + rectHeight },
        { x: rectX,             y: rectY + rectHeight }
      ];

      return {
        type: "path",
        controlPoints: [],
        points: points,
        closed: true
      };
    }
  };
}

const BOUNDARY_SOURCES = {
  chaikin: createChaikinBoundarySource,
  rectangle: createRectangleBoundarySource,
  drawn: createDrawnBoundarySource
};

function getActiveBoundarySource() {
  const sourceFactory =
    BOUNDARY_SOURCES[SETTINGS.boundary.source];

  if (!sourceFactory) {
    console.warn(
      `Unknown boundary source: ${SETTINGS.boundary.source}. Falling back to Chaikin.`
    );

    return createChaikinBoundarySource();
  }

  return sourceFactory();
}

let drawnBoundaryStrokes = [];

function createDrawnBoundarySource() {
  return {
    type: "drawn",

    generate() {
      return {
        type: "drawn",
        strokes: drawnBoundaryStrokes.map(stroke => ({
          points: stroke.points.map(p => ({
            x: p.x,
            y: p.y,
            time: p.time,
            pressure: p.pressure
          })),
          closed: false
        }))
      };
    }
  };
}