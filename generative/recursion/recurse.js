function recurse(node) {
  if (shouldStop(node)) {
    drawLeaf(node);
    return;
  }

  drawNode(node);

  const children = createChildren(node);

  for (const child of children) {
    mutate(child, node);
    respondToEnvironment(child);
    recurse(child);
  }
}