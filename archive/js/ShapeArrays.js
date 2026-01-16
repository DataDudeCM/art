// Returns an array of l points on a circle of radius r at center x,y
function circleArray (x,y,r, l) {
    let array = [];
    for (let angle=0; angle < 360; angle = angle + int(360/l)) {
        array.push(createVector(cos(angle)*r+x,sin(angle)*r+y));
    }
    return array;
}



   