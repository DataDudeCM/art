let z = 0;
let type = 0;
let fillit = false;
let bez = false;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    //frameRate(10);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background([0,0,0,100]); // black
	//background(color, [a])
    strokeWeight(1);
}

function draw() {
	background([0,0,0,100]); // white - remove for interesting trail effects

	//Set Cell Stroke Weight
	voronoiCellStrokeWeight(map(mouseY,0,height,1,8));
	//Set Site Stroke Weight
	voronoiSiteStrokeWeight(3);
	//Set Cell Stroke
	if (fillit) {
		voronoiCellStroke([0,0,0,10]);
	} else {
		voronoiCellStroke([204,100,60,100]);
	}
	//Set Site Stroke
	voronoiSiteStroke([0,0,100,100]);

	voronoiSiteFlag(true);  	//Set flag to draw Site
	voronoiJitterStepMax(20);  	//Maximum distance between jitters
	voronoiJitterStepMin(5);  	//Minimum distance between jitters
	voronoiJitterFactor(3);  	//Scales each jitter
	voronoiJitterBorder(false);  	//Jitter edges of diagram
	
	//Clear the sites for each iteration
	voronoiClearSites();


	let sites = [];   // x, y, color
	let increment = int(map(mouseY,0,height,1,100));
	let frequency = mouseX;

	createSites(sites, increment, frequency, type);

	//Create the sites for Voronoi
	voronoiSites(sites);	//voronoiRndSites(100, 20);

	voronoi(width, height, false);  //jitter set to false

	//Draw standard diagram
	voronoiDraw(0, 0, fillit, false);

	if (bez) {
		//Draw with bezier curves
		strokeWeight(1);
		if (fillit) {
			stroke([0,0,100,100]);
		} else {
			stroke([204,100,95,100]);
		}
		noFill();
		var celllist = voronoiGetCells();
		for (let index = 0; index < celllist.length; index++) {
			for (let segment = 0; segment < celllist[index].length; segment++) {
				bezier(celllist[index][segment][0], celllist[index][segment][1], celllist[index][(segment+1) % celllist[index].length][0], +
				celllist[index][(segment+1) % celllist[index].length][1], celllist[index][(segment+1) % celllist[index].length][0], +
				celllist[index][(segment+1) % celllist[index].length][1], celllist[index][(segment+2) % celllist[index].length][0], +
				celllist[index][(segment+2) % celllist[index].length][1]);
			}
			
		}
	}


	//Add text to show the key parameters
	textSize(14);
	strokeWeight(2);
	stroke([0,0,0,100]);
	fill([0,0,100,100]);
	text('Increment = ' + increment, 10, 20);
	text('Frequency = ' + frequency, 10, 40);
}

function createSites(sites, inc, freq, type) {
	//Use this section to populate the sites array
	let amplitude = height/2;

	if (z > width) {
		z = 0;
	}
  	z+= 1;
  	for (x = 0; x < width; x+= inc) {
    	if (type == 1) {
			y = int((sin(radians(x*freq+z))+tan(radians(x*freq+z)))*amplitude+height/2);
		} else {
			y = int((sin(radians(x*freq+z))*amplitude+height/2));
		}
    	sites.push([x,y,[199,100,map(x % 32,0,32,0,100),100]]);
	}
	return sites;
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
		if (fillit == false) {
			fillit = true;
		} else {
			fillit = false;
		}
	} 
	if (keyCode == SHIFT) {
		if (bez == false) {
			bez = true;
		} else {
			bez = false;
		}
	} 
	if (key == 1) {
        type = 1; 
    } 
	if (key == 2) {
        type = 2; 
    } 
    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save('Voronoi_' + timeStamp + 'png');
    }
 }