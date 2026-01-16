/* 

Let's say you have a triangle with vertices A, B, and C. The barycentric coordinates (u, v, w) 
for a point P within the triangle can be calculated like this:
\[ P = u \cdot A + v \cdot B + w \cdot C \]
Here, u, v, and w are the barycentric coordinates, and they satisfy the conditions \( u + v + w = 1 \) 
and \( 0 \leq u, v, w \leq 1 \).
For example, if you want a point closer to vertex A, you might have coordinates like \( (u=0.7, v=0.2, w=0.1) \). 
The closer the values are to 0 or 1, the closer the point is to the corresponding vertex.
Hope this sheds some light! Let me know if you'd like further clarification or if there's anything else you're curious about. 🌐🤓

Ideas:
    -Create recursive routine to pick a pt in a triangle, connect each vertex to it
    then use the newly created triangles and start all over again.

*/

function setup() {
    createCanvas(800, 800);

    selectedPalette = palettes[3];
    background(selectedPalette[4]);
    frameRate(5);
    c1 = color(selectedPalette[0]); // triangle fill color
    c1.setAlpha(50); //255 is solid, 0 is fully transparent
    c2 = color(selectedPalette[1]); // line color
    c2.setAlpha(50);

    depth = 1;
    maxdepth = 7;


      
    // Draw the triangle
    //splitTriangle(triangleVertices);

  }
  
  function draw() {
    background(selectedPalette[4]);
    triangleVertices1 = [
      createVector(0,0),
      createVector(0,width),
      createVector(height,0)
    ];
    triangleVertices2 = [
 
        createVector(0,width),
        createVector(height,width),
        createVector(height,0)
      ];
    /*
    triangleVertices = [
        createVector(int(random(width)),int(random(height))),
        createVector(random(width),random(height)),
        createVector(random(width),random(height))
    ];
    */
    drawTriangle(triangleVertices1);
    randomPoint = getRandomPointInTriangle(triangleVertices1);
    splitTriangle(triangleVertices1,randomPoint, depth);
    drawTriangle(triangleVertices2);
    randomPoint = getRandomPointInTriangle(triangleVertices2);
    splitTriangle(triangleVertices2,randomPoint, depth);
    //noLoop();

  }
  
  function splitTriangle (vertices, newcenter, depth) {
    if (depth > maxdepth) {
        return;
    } else {

        //fill('Red');
        //ellipse(newcenter.x,newcenter.y,10,10);
        drawTriangle([vertices[0],vertices[1],newcenter]);
        drawTriangle([vertices[1],vertices[2],newcenter]);
        drawTriangle([vertices[2],vertices[0],newcenter]);

        splitTriangle([vertices[0],vertices[1],newcenter], getRandomPointInTriangle([vertices[0],vertices[1],newcenter]),depth+1);
        splitTriangle([vertices[1],vertices[2],newcenter], getRandomPointInTriangle([vertices[1],vertices[2],newcenter]),depth+1);
        splitTriangle([vertices[2],vertices[0],newcenter], getRandomPointInTriangle([vertices[2],vertices[0],newcenter]),depth+1);
    }
  }

  function drawTriangle(vertices) {
    c1.setAlpha(random(100));
    fill(c1);
    //noStroke();
    stroke(c2);
    strokeWeight(.02);
    //fill(random(255),random(255),random(255),random(255));
    triangle(
        vertices[0].x, vertices[0].y,
        vertices[1].x, vertices[1].y,
        vertices[2].x, vertices[2].y
    );
  }

  function getRandomPointInTriangle(vertices) {
    let u = random();
    let v = random();
    //u,v = .33;
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    let w = 1 - u - v;
  
    let point = createVector(0, 0);
    point.x = u*vertices[0].x + v*vertices[1].x + w*vertices[2].x;
    point.y = u*vertices[0].y + v*vertices[1].y + w*vertices[2].y;
  
    return point;
  }
  