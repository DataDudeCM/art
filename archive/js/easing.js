var x=0;
var easing = 0.01;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  var targetX = mouseX;
  x += (targetX - x) * easing;
  ellipse(x,40,12,12);
  print(targetX + " : " + x);
}