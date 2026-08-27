function renderDisplacementField(
  source,
  getOffset,
  renderOptions = {}
) {
  if (!source) {
    return null;
  }

  const renderMode =
    renderOptions.mode ||
    "pixel";

  if (renderMode === "brush") {
    return renderBrushField(
      source,
      getOffset,
      renderOptions.brush
    );
  }

  return renderPixelField(
    source,
    getOffset
  );
}