function squigLine (point1, point2, sw=1, jFactor=0.05, nFactor=1) {

    strokeWeight(sw);

    distance = dist(point1.x,point1.y,point2.x,point2.y);
    jaggyFactor = jFactor; // .1 is default and influences number of points - jagginess
    noiseFactor = nFactor; //1 is default and indicates smoothness, greater = less smooth
    let noiseOffset = random(1000);
    let scale = 0.01; //scale for noise function


    numpoints = int(distance * jaggyFactor);
    if (numpoints < 3) {
        numpoints = 3;
    }
    let segments = numpoints + 1;
    let prev = point1.copy();

    // Add some noise to the line
    for (let i = 1; i <= (segments)  ; i++) {
            //noiseFactor = noiseFactor * i/segments;
            let t = i / segments;
            let curr = p5.Vector.lerp(point1, point2, t);
            if (i != segments) {
                let nx = noise((i+noiseOffset)*scale);
                let ny = noise((i+noiseOffset+1000)*scale);
                let mapx = map(nx, 0, 1, -noiseFactor, noiseFactor);
                let mapy = map(ny, 0, 1, -noiseFactor, noiseFactor);

                curr.x += mapx;
                curr.y += mapy;

            }
            line(prev.x,prev.y,curr.x,curr.y);  
            prev = curr;
        }
}

function artrect(v1, w, h, numshapes = 10, fuzzy = 8, jFactor=0.05, nFactor=1) {
     let v = [];
     let sw = 1;
     v[0] = createVector(v1.x,v1.y+h);
     v[1] = v1;
     v[2] = createVector(v1.x+w,v1.y);
     v[3] = createVector(v1.x+w,v1.y+h);
    noiseOffset = random(1000);
    //Draw the lines between vertices
    for (let num = 0; num < numshapes; num++) {
        if (num < fuzzy) { //thin normal lines
            if (num == 0) {
                sw = 2;
                strokeWeight(sw);  // normally 2
                stroke(0,100);
            } else {
                sw = map(num,0,numshapes-1,2,1);
                strokeWeight(sw);  //normally 2,1
                stroke(0,map(num, 0, numshapes-1,10,1));  //normally 10,1
            }
        } else { //fat light opacity lines
            sw = 10;
            strokeWeight(sw);
            stroke(0,1); //normally 0,1
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