// Assumes your brush image is preloaded into `brushImg`

function paintStroke(brushImg, x, y, size, angle, brushColor = color('Black'),  transparency = 50, count = 5) {
  brushColor.setAlpha(transparency);

  //push();
  //imageMode(CENTER);
  strokeSize = brushImg.width * size * .01

  // First (main) stroke
  push();
  translate(x, y);
  rotate(angle);
  tint(brushColor); // fully opaque
  image(brushImg, 0, 0, strokeSize, strokeSize);
  pop();

  // Additional strokes (transparent, offset along angle)
  for (let i = 0; i < count; i++) {
    //let offsetDist = random(size, size*3);     // how far from the main stroke

    let forwardDist = (i + 1) * random(size*.1, size*.2);  // always forward
    let sideDist = random(-size*.025, size*.025);              // slight side drift

    let jitter = random(-PI / 32, PI / 32); // small angle variation
    let alpha = map(i, 0, count, transparency*.75, 2);            // fade out with distance

    //let dx = cos(angle) * offsetDist;
    //let dy = sin(angle) * offsetDist;

    let dx = cos(angle) * forwardDist - sin(angle) * sideDist;
    let dy = sin(angle) * forwardDist + cos(angle) * sideDist;

    push();
    translate(x + dx, y + dy);
    rotate(angle + jitter);
    brushColor.setAlpha(alpha);
    tint(brushColor);
    image(brushImg, 0, 0, strokeSize, strokeSize);
    pop();
  }

  //pop();
}
