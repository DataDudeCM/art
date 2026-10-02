
let hud;
const BW = 1536, BH = 1024;
let fitS = 1, ox = 0, oy = 0;
let particles = [];
let blips = [];
let bootStart = 0;
let glitchUntil = 0;
let glitchSeed = 0;

function preload(){ hud = loadImage("hud.jpg"); }

function setup(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  angleMode(DEGREES);
  bootStart = millis();

  for(let i=0;i<70;i++){
    particles.push({
      a: random(360),
      r: random(18,56),
      s: random(.08,.28),
      size: random(1,3),
      phase: random(360)
    });
  }
  blips = [
    {x:1460,y:300,p:0},
    {x:1410,y:345,p:80},
    {x:1478,y:334,p:150},
    {x:1398,y:313,p:230}
  ];
}

function windowResized(){ resizeCanvas(windowWidth,windowHeight); }

function draw(){
  background(2,3,8);

  fitS = min(width/BW,height/BH);
  const dw=BW*fitS, dh=BH*fitS;
  ox=(width-dw)/2; oy=(height-dh)/2;

  push();
  translate(ox,oy);
  scale(fitS);

  drawBaseWithGlitch();
  drawBoot();
  if(millis()-bootStart>1400){
    drawTopCore();
    drawRadar();
    drawLeftScanner();
    drawWavePanel();
    drawBottomSequence();
    drawEdgeEnergy();
    drawDataRain();
    drawScanBeam();
    drawRandomGlitches();
  }
  pop();
}

function glow(col, blur=16){
  drawingContext.shadowBlur=blur;
  drawingContext.shadowColor=col;
}
function clearGlow(){drawingContext.shadowBlur=0;drawingContext.shadowColor="transparent"}

function drawBaseWithGlitch(){
  if(millis()>glitchUntil && random()<0.006){
    glitchUntil=millis()+random(90,180);
    glitchSeed=random(9999);
  }
  if(millis()<glitchUntil){
    randomSeed(glitchSeed+frameCount);
    image(hud,0,0,BW,BH);
    for(let i=0;i<9;i++){
      let y=random(100,BH-30), h=random(2,14), shift=random(-18,18);
      copy(hud,0,y,BW,h,shift,y,BW,h);
    }
    randomSeed();
  }else{
    image(hud,0,0,BW,BH);
  }
}

function drawBoot(){
  let t=millis()-bootStart;
  if(t<1500){
    let p=constrain(t/1500,0,1);
    noStroke();
    fill(0,0,0,220*(1-p));
    rect(0,0,BW,BH);

    // bright horizontal startup sweep
    let y=lerp(120,790,p);
    glow("rgba(0,220,255,.9)",30);
    fill(0,220,255,90*(1-p));
    rect(150,y,1235,3);
    clearGlow();

    // center text
    textAlign(CENTER,CENTER);
    textSize(18);
    fill(0,230,255,220);
    text("SYSTEM INITIALIZING",BW/2,BH/2-12);
    fill(255,0,220,180);
    textSize(12);
    text(nf(floor(p*100),2)+"%",BW/2,BH/2+18);
  }
}

function drawTopCore(){
  const cx=768,cy=70;
  let pulse=.5+.5*sin(millis()*.16);

  // halo
  noFill();
  glow("rgba(0,220,255,.9)",25);
  stroke(0,220,255,90+100*pulse);
  strokeWeight(2);
  circle(cx,cy,58+6*pulse);

  // orbiting particles
  noStroke();
  for(let p of particles){
    p.a += p.s;
    let rr=p.r+sin(frameCount*.8+p.phase)*3;
    let x=cx+cos(p.a)*rr;
    let y=cy+sin(p.a)*rr;
    let mixv=(sin(p.a*3)+1)/2;
    fill(lerp(0,255,mixv), lerp(220,0,mixv), 255,120);
    circle(x,y,p.size);
  }

  // rotating arcs
  noFill();
  strokeWeight(2);
  stroke(255,0,220,180);
  arc(cx,cy,44,44,frameCount*.7,frameCount*.7+145);
  stroke(0,210,255,180);
  arc(cx,cy,34,34,-frameCount*1.2,-frameCount*1.2+210);
  clearGlow();
}

function drawRadar(){
  const cx=1441,cy=303,R=82;
  let a=(millis()*.095)%360;

  // sweep fan
  noStroke();
  for(let i=0;i<35;i++){
    let aa=a-i*1.3;
    let alpha=map(i,0,34,42,0);
    fill(0,220,255,alpha);
    triangle(cx,cy,
      cx+cos(aa)*R,cy+sin(aa)*R,
      cx+cos(aa-1.8)*R,cy+sin(aa-1.8)*R);
  }

  glow("rgba(0,220,255,.95)",16);
  stroke(0,230,255,220);
  strokeWeight(2);
  line(cx,cy,cx+cos(a)*R,cy+sin(a)*R);

  // rings
  noFill();
  stroke(0,180,255,70);
  for(let r=20;r<=80;r+=20) circle(cx,cy,r*2);

  // blips that explode when sweep nears
  noStroke();
  for(let b of blips){
    let ba=atan2(b.y-cy,b.x-cx);
    if(ba<0) ba+=360;
    let d=abs(((a-ba+540)%360)-180);
    let flash=constrain(map(d,28,0,20,255),20,255);
    fill(255,0,220,flash);
    circle(b.x,b.y,4+flash/70);
    if(flash>180){
      noFill(); stroke(255,0,220,flash*.7); strokeWeight(1);
      circle(b.x,b.y,12+(255-flash)*.08);
      noStroke();
    }
  }
  clearGlow();
}

function drawLeftScanner(){
  const cx=83,cy=281;
  let a=(frameCount*.5)%360;

  noFill();
  glow("rgba(0,180,255,.8)",12);
  stroke(0,190,255,130);
  arc(cx,cy,84,84,a,a+110);
  stroke(255,0,220,110);
  arc(cx,cy,66,66,-a*1.5,-a*1.5+160);

  // crosshair twitch
  let jx=sin(frameCount*2.2)*2;
  let jy=cos(frameCount*1.7)*2;
  stroke(0,220,255,80);
  line(cx-30+jx,cy+jy,cx+30+jx,cy+jy);
  line(cx+jx,cy-30+jy,cx+jx,cy+30+jy);
  clearGlow();
}

function drawWavePanel(){
  const x0=1389,x1=1495,mid=516;
  noFill();
  glow("rgba(0,220,255,.7)",9);
  stroke(0,220,255,170);
  strokeWeight(1.4);
  beginShape();
  for(let x=x0;x<=x1;x+=2){
    let y=mid+sin(x*.22+millis()*.13)*10+sin(x*.065-millis()*.07)*5;
    vertex(x,y);
  }
  endShape();

  stroke(255,0,220,145);
  beginShape();
  for(let x=x0;x<=x1;x+=2){
    let y=mid+8+sin(x*.15-millis()*.11)*8;
    vertex(x,y);
  }
  endShape();

  noStroke();
  for(let i=0;i<17;i++){
    let h=6+(sin(frameCount*4+i*31)+1)*12;
    fill(i%4===0?color(255,0,220,150):color(0,210,255,145));
    rect(1390+i*6,570-h,3,h);
  }
  clearGlow();
}

function drawBottomSequence(){
  const sx=993, y=918, gap=54;
  let active=floor((millis()/180)%9);
  for(let i=0;i<9;i++){
    let dist=min(abs(i-active),9-abs(i-active));
    let alpha=max(40,230-dist*60);
    noFill();
    strokeWeight(i===active?3:1.4);
    if(i===active){
      glow("rgba(255,0,220,.95)",22);
      stroke(255,0,220,alpha);
      circle(sx+i*gap,y,47);
      circle(sx+i*gap,y,37);
    } else {
      stroke(0,210,255,alpha);
      circle(sx+i*gap,y,42);
    }
    clearGlow();
  }
}

function drawEdgeEnergy(){
  let p=.5+.5*sin(millis()*.003);
  glow("rgba(0,220,255,.8)",15);
  strokeWeight(3);
  stroke(0,220,255,35+70*p);
  line(345,70,625,70);
  line(906,70,1195,70);
  line(175,825,542,825);
  line(965,825,1345,825);
  clearGlow();

  glow("rgba(255,0,220,.7)",13);
  stroke(255,0,220,25+55*(1-p));
  line(365,84,620,84);
  line(904,84,1170,84);
  clearGlow();
}

function drawDataRain(){
  // deliberately keep the center mostly clean; data stays near side panels
  textSize(7);
  textAlign(LEFT,TOP);
  for(let i=0;i<10;i++){
    let y=(frameCount*1.3+i*48)%390+185;
    fill(0,210,255,70);
    text(("0x"+hex((i*37+frameCount)%255,2)+" "+nf((frameCount+i*13)%999,3)),34,y);
  }
  for(let i=0;i<9;i++){
    let y=(frameCount*1.05+i*53)%390+180;
    fill(255,0,220,55);
    text(("SIG "+nf((i*17+frameCount)%100,2)),1460,y);
  }
}

function drawScanBeam(){
  // subtle scan line across the white center for more life
  let y=125+((millis()*.09)%650);
  noStroke();
  fill(0,220,255,9);
  rect(160,y,1210,2);
  fill(255,0,220,5);
  rect(160,y+3,1210,1);
}

function drawRandomGlitches(){
  if(random()<0.025){
    let y=random(100,820);
    let w=random(50,220);
    let x=random(20,BW-w);
    noStroke();
    fill(random()<.5?color(0,220,255,35):color(255,0,220,30));
    rect(x,y,w,random(1,4));
  }

  if(random()<0.01){
    glow("rgba(255,255,255,.7)",8);
    stroke(255,255,255,80);
    strokeWeight(1);
    let x=random(20,BW-20);
    line(x,90,x,95+random(5,15));
    clearGlow();
  }
}
