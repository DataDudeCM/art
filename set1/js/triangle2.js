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
//let triangleVertices = [];
let depth;
let maxdepth;
let sqwidth;
let padding;
let c1,c2;
let ocount;

function setup() {
    createCanvas(600, 600);
    colorMode(HSB,255);
    frameRate(2);

    maxdepth = 4;
    sqwidth = 250;
    padding = 35;
}
  
function draw() {
    ocount =0;
    selectedPalette = palettes[int(random(11))];
    //background(selectedPalette[4]);
    c1 = color(selectedPalette[int(random(4))]); // triangle fill color
    //c1.setAlpha(150); //255 is solid, 0 is fully transparent
    c2 = color(selectedPalette[int(random(4))]); // line color
    //c2.setAlpha(200);
    background('White');
    //create many squares
    //for every square do the below...
    for (ynum = 0; ynum < 3; ynum+=1) {
        for (xnum = 0; xnum < 3; xnum+=1){
            createSquare((xnum*sqwidth)+padding*(xnum+1),(ynum*sqwidth)+padding*(ynum+1),sqwidth);
        }
    }
    //noLoop();
}

function createSquare (x1, y1, w) {
    //create local trianglevertices
    let triangleVertices = [];
    //split the square into two triangles
    splitSquare(x1,y1,x1+w, y1+w, triangleVertices);
    //execute the draw triangles recursive code
    for (let a = 0; a < 2; a+=1) {
        splitTriangle(triangleVertices[a], maxdepth);
    }
    stroke('Black');
    strokeWeight(5);
    rect(x1,y1,w,w);
}
  
function splitSquare (x1, y1, x2, y2, triangleVertices) {
    //split into two triangles
    if (int(random(10)>5)) { // alternates the orientation of the triangles
        triangleVertices.push([
            createVector(x1,y1), //upper left
            createVector(x2,y1), //upper right
            createVector(x1,y2) // lower left
        ]);
        triangleVertices.push([
            createVector(x2,y1),
            createVector(x2,y2),
            createVector(x1,y2)
        ]);
    } else {
        triangleVertices.push([
            createVector(x1,y1), //upper left
            createVector(x2,y1), //upper right
            createVector(x2,y2) // lower left
        ]);
        triangleVertices.push([
            createVector(x2,y2),
            createVector(x1,y2),
            createVector(x1,y1)
        ]);
    }
} 

function splitTriangle (vertices, depth) {
    let newdepth;
    let newcenter;
    if (depth == 0) {
        //if at the bottom, draw the triangle
        drawTriangle(vertices);
        ocount += 1;
        return;
    } else {
        // get a random point in the center, then call splitTriangle again for 3 new triangles
        newdepth = depth - 1;
        newcenter = getRandomPointInTriangle(vertices);
        splitTriangle([vertices[0],vertices[1],newcenter],newdepth);
        splitTriangle([vertices[1],vertices[2],newcenter],newdepth);
        splitTriangle([vertices[2],vertices[0],newcenter],newdepth);
    }
    return;
}

function drawTriangle(vertices) {
    c1.setAlpha(random(255));
    fill(c1);

    //noStroke();
    stroke(c2);
    strokeWeight(.1);
    triangle(
        vertices[0].x, vertices[0].y,
        vertices[1].x, vertices[1].y,
        vertices[2].x, vertices[2].y
    );
    return;
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
  
function mousePressed() {
	if (isLooping()) {
		noLoop();
	} else {
		loop();
	}
}

function keyPressed() {
    if (keyCode == BACKSPACE) {
	} 
	// if (keyCode == SHIFT) {
    if (key == 'l' || key == 'L') {
        loop();
    }
    if (key == 'n' || key == 'N') {
        noLoop();
    }

    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Particles_' + timeStamp);
    }
 }