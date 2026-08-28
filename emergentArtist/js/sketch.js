let agents = [];
let palette;
let artLayer;
let renderer;
let paused = false;
let showAgents = SETTINGS.debug.showAgents;
let currentSeed = SETTINGS.seed;

function setup() {
  createCanvas(windowWidth, windowHeight);
  palette = getPalette(SETTINGS.paletteName);
  createArtLayer();
  regenerate(currentSeed);
}

function draw() {
  if (!paused) updateAgents();
  background(getPaperColor());
  image(artLayer, 0, 0);
  if (showAgents) {
    for (const agent of agents) agent.debugDraw();
  }
  drawHud();
}

function createArtLayer() {
  artLayer = createGraphics(width, height);
  renderer = new SimpleRenderer(artLayer);
}

function regenerate(seed = floor(random(1, 999999999))) {
  currentSeed = seed;
  randomSeed(currentSeed);
  noiseSeed(currentSeed);
  agents = [];
  artLayer.clear();
  artLayer.background(getPaperColor());

  for (let i = 0; i < SETTINGS.population.circles; i++) agents.push(new CircleAgent());
  for (let i = 0; i < SETTINGS.population.lines; i++) agents.push(new LineAgent());

  console.log(`Emergent Artist seed: ${currentSeed}`);
  console.table(agents.map((agent, index) => ({
    id: index,
    species: agent.species,
    scale: agent.personality.scale.toFixed(2),
    opacity: agent.personality.opacity.toFixed(2),
    weight: agent.personality.weight.toFixed(2),
    roughness: agent.personality.roughness.toFixed(2),
    speed: agent.personality.speed.toFixed(2),
    wander: agent.personality.wander.toFixed(3),
    drawFrequency: agent.personality.drawFrequency.toFixed(4),
    curiosity: agent.personality.curiosity.toFixed(2)
  })));
}

function updateAgents() {
  for (const agent of agents) {
    agent.update();
    if (agent.shouldDraw()) {
      renderer.render(agent.createMarkRequest());
      agent.framesSinceMark = 0;
    }
  }
}

function keyPressed() {
  if (key === "a" || key === "A") showAgents = !showAgents;
  if (key === "p" || key === "P") paused = !paused;
  if (key === "r" || key === "R") regenerate();
  if (key === "s" || key === "S") save(artLayer, `emergent-artist-${currentSeed}.png`);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createArtLayer();
  regenerate(currentSeed);
}

function chooseAgentColor() {
  const usable = palette.colors.filter(item => !["paper", "light", "highlight"].includes(item.role));
  const choices = usable.length ? usable : palette.colors;
  return random(choices).hex;
}

function getPaperColor() {
  return getColorByRole(palette, "paper", false)
    || getColorByRole(palette, "light", false)
    || getColorByRole(palette, "highlight", false)
    || "#f3efe5";
}

function drawHud() {
  push();
  noStroke();
  fill(0, 150);
  rect(12, 12, 265, 82, 6);
  fill(255);
  textFont("monospace");
  textSize(12);
  text(`Emergent Artist v0.1
seed: ${currentSeed}
A agents   P pause   R regenerate   S save`, 22, 31);
  pop();
}
