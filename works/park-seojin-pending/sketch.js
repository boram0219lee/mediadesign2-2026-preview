let flocks = [];
let windLineY;
let birdLineY;
let childLineY;
let bikeLineY;
let bugLineY;

let birdSound, childSound, windSound, bugSound, bikeSound;
let soundStarted = false;
let bgLines = [];
let bugSystem;
let bikes = [];

let activeLine = null;
const TOUCH_DIST = 25;
let lineAlphas = {};

function preload() {
  birdSound  = loadSound('birds.mp3');
  childSound = loadSound('childrenplaying.mp3');
  windSound  = loadSound('wind.mp3');
  bugSound   = loadSound('cicada.mp3');
  bikeSound  = loadSound('bicycle.mp3');
}

function setup() {
  createCanvas(1280, 720);
  textFont('serif');
  frameRate(60);

  let slot = (height - 60) / 5;
  windLineY  = 40 + slot * 0 + slot / 2;
  birdLineY  = 40 + slot * 1 + slot / 2;
  childLineY = 40 + slot * 2 + slot / 2;
  bikeLineY  = 40 + slot * 3 + slot / 2;
  bugLineY   = 40 + slot * 4 + slot / 2;

  for (let ly of [windLineY, birdLineY, childLineY, bikeLineY, bugLineY]) {
    lineAlphas[ly] = 220;
  }

  let palette = [
    [240, 210, 180],
    [235, 205, 175],
    [238, 200, 178],
    [232, 208, 178],
    [236, 212, 182],
  ];

  for (let y = 20; y < height; y += random(6, 14)) {
    let col = random(palette);
    bgLines.push({
      y, weight: random(0.4, 2.5), col,
      alpha: random(60, 160),
      wave: random(0.002, 0.006),
      amp: random(0.5, 2.5),
      offset: random(1000),
    });
  }

  for (let i = 0; i < 14; i++) flocks.push(new Wind(random(width)));
  for (let i = 0; i < 7; i++) flocks.push(new Flock(map(i, 0, 6, 60, width - 60)));
  for (let i = 0; i < 6; i++) flocks.push(new ChildFlock(map(i, 0, 5, 60, width - 60)));

  let configs = [
    {x: 100,         dir:  1},
    {x: width - 100, dir: -1},
    {x: 500,         dir:  1},
  ];
  for (let i = 0; i < 3; i++) {
    let b = new Bike(configs[i].x, i, configs[i].dir);
    bikes.push(b); flocks.push(b);
  }

  bugSystem = new BugSystem();
  flocks.push(bugSystem);
}

function mousePressed() {
  if (!soundStarted) {
    userStartAudio().then(() => {
      birdSound.setVolume(0.008); birdSound.loop();
      childSound.setVolume(0.15); childSound.loop();
      windSound.setVolume(0.15);  windSound.loop();
      bugSound.setVolume(0.1);    bugSound.loop();
      bikeSound.setVolume(0.15);  bikeSound.loop();
      soundStarted = true;
    });
  }
}

function touchStarted() {
  if (!soundStarted) {
    userStartAudio().then(() => {
      birdSound.setVolume(0.008); birdSound.loop();
      childSound.setVolume(0.15); childSound.loop();
      windSound.setVolume(0.15);  windSound.loop();
      bugSound.setVolume(0.1);    bugSound.loop();
      bikeSound.setVolume(0.15);  bikeSound.loop();
      soundStarted = true;
    });
  }
}

function draw() {
  background(242, 232, 220);

  // 오후 4시 햇빛 오버레이 — 그라디언트 한 번에
  let grad = drawingContext.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255, 200, 120, 0.07)');
  grad.addColorStop(1, 'rgba(255, 200, 120, 0)');
  drawingContext.fillStyle = grad;
  drawingContext.fillRect(0, 0, width, height);

  let lines = [windLineY, birdLineY, childLineY, bikeLineY, bugLineY];
  activeLine = null;
  let minDist = 99999;
  for (let ly of lines) {
    let d = abs(mouseY - ly);
    if (d < TOUCH_DIST && d < minDist) {
      minDist = d;
      activeLine = ly;
    }
  }

  for (let ly of lines) {
    let target = (activeLine === null) ? 220 : (activeLine === ly ? 220 : 80);
    lineAlphas[ly] = lerp(lineAlphas[ly], target, 0.04);
  }

  if (soundStarted) {
    let distToBugLineY = abs(mouseY - bugLineY);
    let inBugZone = mouseY > (bikeLineY + bugLineY) / 2;

    if (bugSystem.frozen) {
      birdSound.setVolume(0.003, 0.5);
      childSound.setVolume(0.05, 0.5);
      windSound.setVolume(0.05, 0.5);
      bugSound.setVolume(0, 0.5);
      bikeSound.setVolume(0.05, 0.5);
    } else if (inBugZone && distToBugLineY < 250) {
      let closeness = map(distToBugLineY, 40, 250, 1, 0, true);
      bugSound.setVolume(lerp(0.1, 1.0, closeness), 0.4);
      birdSound.setVolume(lerp(0.008, 0.002, closeness), 0.4);
      childSound.setVolume(lerp(0.15, 0.03, closeness), 0.4);
      windSound.setVolume(lerp(0.15, 0.03, closeness), 0.4);
      bikeSound.setVolume(lerp(0.15, 0.03, closeness), 0.4);
    } else {
      let soundMap = [
        {line: windLineY,  sound: windSound,  base: 0.15,  active: 0.75},
        {line: birdLineY,  sound: birdSound,  base: 0.008, active: 0.08},
        {line: childLineY, sound: childSound, base: 0.15,  active: 0.75},
        {line: bikeLineY,  sound: bikeSound,  base: 0.15,  active: 0.75},
        {line: bugLineY,   sound: bugSound,   base: 0.1,   active: 0.5},
      ];
      for (let s of soundMap) {
        let targetVol = (activeLine === null) ? s.base : (activeLine === s.line ? s.active : 0.03);
        s.sound.setVolume(targetVol, 0.5);
      }
    }
  }

  drawBgLines();
  for (let f of flocks) { f.update(); f.display(); }
}

function getAlpha(lineY) {
  return lineAlphas[lineY] || 220;
}

function drawBgLines() {
  noFill();
  for (let l of bgLines) {
    let onThisLine = abs(mouseY - l.y) < 5;
    stroke(l.col[0], l.col[1], l.col[2], l.alpha);
    strokeWeight(l.weight);
    beginShape();
    for (let x = 0; x < width; x += 4) {
      let y = l.y + sin(x * l.wave + l.offset) * l.amp;
      if (onThisLine) y += sin(x * 0.3 + frameCount * 0.2) * 1.2;
      vertex(x, y);
    }
    endShape();
  }
}

class Wind {
  constructor(x) {
    this.x = x;
    this.y = random(5, windLineY + 40);
    this.len = random(50, 140);
    this.vx = random(0.2, 0.7);
    this.alpha = random(140, 220);
    this.lineCount = floor(random(2, 6));
    this.lineSpacing = random(2.5, 4.5);
  }
  update() {
    this.x += this.vx;
    if (this.x > width + this.len) this.x = -this.len - 20;
  }
  display() {
    let a = getAlpha(windLineY);
    stroke(130, 185, 225, a); noFill();
    for (let i = 0; i < this.lineCount; i++) {
      strokeWeight(map(i, 0, this.lineCount - 1, 1.5, 0.5));
      line(this.x, this.y + i * this.lineSpacing, this.x + this.len, this.y + i * this.lineSpacing);
    }
  }
}

class Flock {
  constructor(x) {
    this.birds = []; this.homeX = x;
    for (let i = 0; i < floor(random(4, 8)); i++)
      this.birds.push(new Bird(x + random(-25, 25), birdLineY + random(-8, 8), x));
  }
  update() { for (let b of this.birds) { b.flock(this.birds); b.flee(); b.update(); } }
  display() { for (let b of this.birds) b.display(); }
}

class Bird {
  constructor(x, y, homeX) {
    this.x=x; this.y=y; this.homeX=homeX;
    this.vx=random(-0.6,0.6); this.vy=0;
    this.size=random(6,10);
    this.r=random(220,255); this.g=random(180,220);
    this.phase=random(TWO_PI);
  }
  flock(birds) {
    let ax=0,cx=0,cy=0,sx=0,sy=0,count=0;
    for (let o of birds) {
      let d=dist(this.x,this.y,o.x,o.y);
      if (o!==this&&d<100){ax+=o.vx;cx+=o.x;cy+=o.y;count++;}
      if (o!==this&&d<25){sx+=this.x-o.x;sy+=this.y-o.y;}
    }
    if (count>0){this.vx+=(ax/count-this.vx)*0.02;this.vx+=(cx/count-this.x)*0.003;}
    this.vx+=sx*0.03;
    this.phase+=0.008; this.vy=sin(this.phase)*0.3;
    this.vy+=(birdLineY-this.y)*0.02;
    this.vx+=(this.homeX-this.x)*0.001;
    let spd=sqrt(this.vx*this.vx+this.vy*this.vy);
    if (spd>1.0){this.vx=this.vx/spd*1.0;this.vy=this.vy/spd*1.0;}
  }
  flee() {
    let dx=this.x-mouseX,dy=this.y-mouseY,d=sqrt(dx*dx+dy*dy);
    if (d<120&&d>0){let f=(1-d/120)*1.2;this.vx+=(dx/d)*f;this.vy+=(dy/d)*f*0.3;}
  }
  update() {
    this.x+=this.vx; this.y+=this.vy;
    if (this.x<0) this.x=width; if (this.x>width) this.x=0;
  }
  display() {
    let a = getAlpha(birdLineY);
    let angle=atan2(this.vy,this.vx);
    push(); translate(this.x,this.y); rotate(angle);
    stroke(this.r,this.g,0,a); strokeWeight(1.5); noFill();
    line(0,0,-8,-4); line(0,0,-8,4);
    noStroke(); fill(this.r,this.g,0,a);
    circle(0,0,this.size*0.6);
    pop();
  }
}

class ChildFlock {
  constructor(x) {
    this.children=[]; this.homeX=x;
    for (let i=0;i<floor(random(3,6));i++)
      this.children.push(new Child(x+random(-35,35),childLineY+random(-15,15),x));
  }
  update() { for (let c of this.children){c.play(this.children);c.seek();c.update();} }
  display() { for (let c of this.children) c.display(); }
}

class Child {
  constructor(x,y,homeX) {
    this.x=x;this.y=y;this.homeX=homeX;
    this.vx=random(-0.6,0.6);this.vy=random(-0.3,0.3);
    this.size=random(14,22);
    this.phaseX=random(TWO_PI);this.phaseY=random(TWO_PI);
    this.speedX=random(0.015,0.04);this.speedY=random(0.01,0.03);
    this.ampX=random(0.2,0.5);this.ampY=random(0.15,0.4);
    let p=[[255,180,190],[255,200,150],[180,210,255],[180,240,200],[255,230,150],[220,180,255]];
    let c=p[floor(random(p.length))];this.cr=c[0];this.cg=c[1];this.cb=c[2];
  }
  play(others) {
    this.phaseX+=this.speedX;this.phaseY+=this.speedY;
    this.vx+=sin(this.phaseX)*this.ampX;this.vy+=cos(this.phaseY)*this.ampY;
    for (let o of others){
      if (o===this) continue;
      let d=dist(this.x,this.y,o.x,o.y);
      if (d<30&&d>0){this.vx+=(this.x-o.x)/d*0.3;this.vy+=(this.y-o.y)/d*0.3;}
    }
    this.vy+=(childLineY-this.y)*0.02;this.vy=constrain(this.vy,-1.5,1.5);
    this.vx+=(this.homeX-this.x)*0.0006;
    this.vx*=0.94;this.vy*=0.94;
    let spd=sqrt(this.vx*this.vx+this.vy*this.vy);
    if (spd>1.2){this.vx=this.vx/spd*1.2;this.vy=this.vy/spd*1.2;}
  }
  seek() {
    let dx=mouseX-this.x,dy=mouseY-this.y,d=sqrt(dx*dx+dy*dy);
    if (d>0&&d<180){let f=map(d,0,180,0.4,0.03);this.vx+=(dx/d)*f;this.vy+=(dy/d)*f*0.3;}
  }
  update() {
    this.x+=this.vx;this.y+=this.vy;
    if (this.x<0) this.x=width; if (this.x>width) this.x=0;
  }
  display() {
    let a = getAlpha(childLineY);
    noStroke(); fill(this.cr,this.cg,this.cb,a);
    circle(this.x,this.y,this.size);
  }
}

class Bike {
  constructor(x, idx, dir) {
    this.x = x;
    this.y = bikeLineY;
    this.dir = dir;
    this.baseSpeed = 1.4;
    this.speed = this.baseSpeed;
    this.idx = idx;
    this.laneOffset = (idx % 2 === 0) ? -22 : 22;
    this.targetY = bikeLineY;
  }
  update() {
    let dMouse = dist(mouseX, mouseY, this.x, this.y);
    let mouseAhead = (this.dir > 0 && mouseX > this.x && mouseX < this.x + 160) ||
                     (this.dir < 0 && mouseX < this.x && mouseX > this.x - 160);
    let mouseOnPath = abs(mouseY - bikeLineY) < 40;

    if (mouseAhead && mouseOnPath && dMouse < 55) {
      this.speed = 0;
    } else if (mouseAhead && mouseOnPath && dMouse < 160) {
      this.speed = map(dMouse, 40, 160, 0.1, this.baseSpeed);
    } else {
      this.speed = this.baseSpeed;
    }

    let foundOncoming = false;
    for (let other of bikes) {
      if (other === this) continue;
      let dx = other.x - this.x;
      let d = abs(dx);
      let aheadOfMe = (this.dir > 0 && dx > 0) || (this.dir < 0 && dx < 0);
      let comingToward = (other.dir !== this.dir);
      if (aheadOfMe && comingToward && d < 350) {
        this.targetY = bikeLineY + this.laneOffset;
        foundOncoming = true;
        break;
      }
    }
    if (!foundOncoming) this.targetY = bikeLineY;

    this.y += (this.targetY - this.y) * 0.05;
    this.x += this.dir * this.speed;
    if (this.x > width + 30) this.x = -30;
    if (this.x < -30) this.x = width + 30;
  }
  display() {
    let a = getAlpha(bikeLineY);
    stroke(30, 45, 110, a);
    strokeWeight(1.8); noFill();
    circle(this.x - 14, this.y, 16);
    circle(this.x + 14, this.y, 16);
    line(this.x - 14, this.y, this.x + 14, this.y);
  }
}

class BugSystem {
  constructor() {
    this.bugs = [];
    for (let x = 20; x < width - 10; x += 14) {
      // 원래 x * 0.08로 복구 — 규칙적인 연쇄 패턴
      this.bugs.push({ x,     baseY: bugLineY - 5, y: bugLineY - 5, phase: x * 0.08,      frozenPhase: 0 });
      this.bugs.push({ x: x+7, baseY: bugLineY + 5, y: bugLineY + 5, phase: x * 0.08 + PI, frozenPhase: 0 });
    }
    this.frozen = false;
  }
  update() {
    this.frozen = abs(mouseY - bugLineY) < 40 && mouseX > 20 && mouseX < width - 20;

    for (let b of this.bugs) {
      let dToMouse = dist(mouseX, mouseY, b.x, bugLineY);

      if (this.frozen) {
        let freezeSpeed = map(dToMouse, 0, 300, 0.15, 0.02, true);
        b.frozenPhase = min(b.frozenPhase + freezeSpeed, 1);
      } else {
        b.frozenPhase = max(b.frozenPhase - 0.08, 0);
      }

      if (b.frozenPhase < 1) {
        b.phase += 0.12 * (1 - b.frozenPhase);
        let amp = map(b.frozenPhase, 0, 1, 8, 0);
        b.y = b.baseY + sin(b.phase) * amp;
      } else {
        b.y = b.baseY;
      }
    }
  }
  display() {
    let a = getAlpha(bugLineY);
    noStroke();
    for (let b of this.bugs) {
      fill(85, 105, 30, a);
      if (b.frozenPhase > 0.8) {
        if (b.baseY < bugLineY) circle(b.x, bugLineY, 3.5);
      } else {
        let sz = map(sin(b.phase), -1, 1, 2.5, 5.5);
        circle(b.x, b.y, sz);
      }
    }
  }
}