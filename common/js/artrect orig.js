function squigLine (point1, point2, sw, jFactor=0.05, nFactor=1) {

    strokeWeight(sw);

    distance = dist(point1.x,point1.y,point2.x,point2.y);
    jaggyFactor = jFactor; // .1 is default and influences number of points - jagginess
    noiseFactor = nFactor; //1 is default and indicates smoothness, greater = less smooth
    numpoints = int(distance * jaggyFactor);
    if (numpoints < 3) {
        numpoints = 3;
    }
    prevX = point1.x;
    prevY = point1.y;

    // Add some noise to the line
    for (let i = 0; i <= numpoints; i++) {

            let x = lerp(point1.x, point2.x, i / numpoints);
            let y = lerp(point1.y, point2.y, i / numpoints);
            if (i != numpoints) {
                x += random(-noiseFactor, noiseFactor);
                y += random(-noiseFactor, noiseFactor);
            }
            //point(x, y);
            if (random() > 0) {
                line(prevX,prevY,x,y);
            }
            prevX=x;
            prevY=y;
        }
}

function artrect(v1, w, h, jFactor=0.05, nFactor=1) {
     let v = [];
     let sw = 1;
     v[0] = createVector(v1.x,v1.y+h);
     v[1] = v1;
     v[2] = createVector(v1.x+w,v1.y);
     v[3] = createVector(v1.x+w,v1.y+h);

    //Draw the lines between vertices
    for (let num = 0; num < numshapes; num++) {
        if (num < fuzzy) { //thin normal lines
            if (num == 0) {
                sw = 1;
                strokeWeight(sw);  // normally 2
                stroke(0,100);
            } else {
                sw = map(num,0,numshapes-1,1,1);
                strokeWeight(sw);  //normally 2,1
                stroke(0,map(num, 0, numshapes-1,20,1));  //normally 10,1
            }
        } else { //fat light opacity lines
            sw = 20;
            strokeWeight(sw);
            stroke(0,2); //normally 0,1
        }
        for (let i = 0; i < v.length; i++) {
            if (i == 0) {
                squigLine(v[v.length-1],v[0],sw,jFactor,nFactor);
            } else {
                squigLine(v[i-1], v[i], sw,jFactor,nFactor);
            }
        }
        //displace each vertex by a random amount 
        v[0] = v[0].add(random(-displace,displace),random(-displace,displace));
        v[1] = v[1].add(random(-displace,displace),random(-displace,displace));
        v[2] = v[2].add(random(-displace,displace),random(-displace,displace));
        v[3] = v[3].add(random(-displace,displace),random(-displace,displace));
    }
}