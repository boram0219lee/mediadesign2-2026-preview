// ==========================================
// RESONANCE
// FESTIVAL CREATURE ENVIRONMENT
// p5.js / 1280 x 720
// ==========================================

let creatures = [];
let pulses = [];

let music;
let fft;

let beatPulse = 0;

let energy = 0;

let awakened = false;
let globalAttention = 0;
let awakeningFlash = 0;

let cursorAuraSize = 0;

let cursorInside = false;
let prevCursorInside = false;

// ==========================================
// RHYTHM SYSTEM
// ==========================================

let rhythmType = "idle";

let lastMoveTime = 0;
let stillnessTimer = 0;

let musicPhase = 0;

// rhythm waves

let horizontalWave = 0;
let verticalWave = 0;

let prevMoveX = 0;
let prevMoveY = 0;

// crowd movement

let crowdFlowX = 0;
let crowdFlowY = 0;

// ==========================================
// LOAD MUSIC
// ==========================================

function preload() {
  soundFormats('mp3');
  music = loadSound(
    'sound/music.mp3');
}

// ==========================================
// SETUP
// ==========================================

function setup() {
  createCanvas(1280, 720);
  noStroke();
  fft = new p5.FFT();
  for (let i = 0; i < 400; i++) {
    creatures.push(
      new Creature()
    );
  }
}

// ==========================================
// DRAW
// ==========================================

function draw() {
  for (let y = 0; y < height; y += 2) {
  let t =map(y,0,height,0,1);
  stroke(  lerp(20,45,t), lerp(25,35,t), lerp(55,90,t), 8 );
  line( 0, y, width, y);
}
noStroke();
  background(22,28,52,24);
  energy *= 0.985;
  globalAttention *= 0.96;
  awakeningFlash *= 0.82;

  // ==========================================
  // MUSIC ANALYSIS
  // ==========================================

  let bass = fft.getEnergy(20, 120);
  beatPulse = lerp(
    beatPulse,
    map(bass, 0, 255, 0, 36),0.25
  );
  beatPulse *= 0.92;
  musicPhase += 0.05;

  // ==========================================
  // RHYTHM ANALYSIS
  // ==========================================

  let moveX = mouseX - pmouseX;
  let moveY = mouseY - pmouseY;
  let moveSpeed = dist( mouseX,mouseY,pmouseX,pmouseY);
  crowdFlowX = lerp(crowdFlowX,moveX * 0.5,0.08);
  crowdFlowY = lerp( crowdFlowY, moveY * 0.5, 0.08);
  let directionChangedX =moveX * prevMoveX < 0;
  let directionChangedY = moveY * prevMoveY < 0;
  if (abs(moveX) > 10 &&
    directionChangedX &&
    abs(moveX) > abs(moveY)) {
    rhythmType = "horizontal";
    horizontalWave = constrain(horizontalWave +abs(moveX) * 0.8,0, 40);
  }
  else if (
   abs(moveY) > 10 && directionChangedY && abs(moveY) > abs(moveX) ) {
    rhythmType = "vertical";
    verticalWave = constrain(
      verticalWave + abs(moveY) * 0.8, 0, 40);
  }
  else if (moveSpeed > 30) {
    rhythmType = "aggressive";
  }
  else if (moveSpeed > 1) {
    rhythmType = "calm";
  }
  else {
    rhythmType = "idle";
  }
  horizontalWave *= 0.90;
  verticalWave *= 0.90;
  prevMoveX = moveX;
  prevMoveY = moveY;

  // ==========================================
  // STILLNESS
  // ==========================================

  if (moveSpeed > 1 || mouseIsPressed) {
    lastMoveTime = millis();
  }
  stillnessTimer =  millis() - lastMoveTime;
  if (
    awakened && stillnessTimer > 10000
  ) {
    awakened = false;
    globalAttention = 0;
    energy *= 0.5;
  }

  // ==========================================
  // CURSOR STATE
  // ==========================================

  cursorInside = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
  if (
    cursorInside && !prevCursorInside && awakened
  ) {
    globalAttention = 4;
    energy += 1.2;
    for (let i = 0; i < 16; i++) {
      pulses.push(
        new Pulse( mouseX + random(-120,120), mouseY + random(-120,120), random(120,280) ) );
    }
  }
  prevCursorInside = cursorInside;
  
  // ==========================================
  // CURSOR AURA
  // ==========================================

  if (mouseIsPressed && awakened) {
    cursorAuraSize = lerp( cursorAuraSize, 16 + energy * 3, 0.06 );
    energy += 0.02;
  } else {
    cursorAuraSize = lerp( cursorAuraSize,  3, 0.08);
  }

  // ==========================================
  // CAMERA SHAKE
  // ==========================================

  push();
  translate( random( -energy * 1.2, energy * 1.2 ),
    random( -energy * 1.2, energy * 1.2) );

  // ==========================================
  // ENVIRONMENT
  // ==========================================

  drawEnvironment();

  // ==========================================
  // MOTION PULSES
  // ==========================================

  if ( awakened && moveSpeed > 10
  ) {
    energy += 0.03;
    pulses.push(
      new Pulse(  mouseX, mouseY, random(40,90) ));
  }

  // ==========================================
  // PULSES
  // ==========================================

  blendMode(ADD);
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].display();
    if (pulses[i].dead) {
      pulses.splice(i,1);
    }
  }

  // ==========================================
  // CREATURES
  // ==========================================

  for (let i = creatures.length - 1; i >= 0; i--) {
  let c = creatures[i];
  c.update();
  c.display();
    if (c.x < -200 || c.x > width + 200 || c.y < -200 || c.y > height + 200) {
    creatures.splice(i, 1);
  }
}
  while (creatures.length < 400) {
  let newCreature = new Creature();
  blendMode(BLEND);
let edge = floor(random(4));
  if (edge === 0) { newCreature.x = random(width); newCreature.y = -100; }
  else if (edge === 1) { newCreature.x = random(width); newCreature.y = height + 100; }
  else if (edge === 2) { newCreature.x = -100; newCreature.y = random(height); }
  else { newCreature.x = width + 100; newCreature.y = random(height); }
    newCreature.homeX = newCreature.x;
  newCreature.homeY = newCreature.y;
  
  creatures.push(newCreature);
}
  // ==========================================
  // CURSOR AURA DRAW
  // ==========================================

  if (awakened && cursorInside) {
    drawCursorAura();
  }

  // ==========================================
  // AWAKENING FLASH
  // ==========================================

  if (awakeningFlash > 1) {
    fill( 255, awakeningFlash );
    rect( 0, 0, width, height );
  }
  pop();
}

// ==========================================
// ENVIRONMENT
// ==========================================

function drawEnvironment() {
  blendMode(ADD);
  for (let i = 0; i < 10; i++) {
    let x = noise( frameCount * 0.002 + i * 200 ) * width;
    let y = noise( frameCount * 0.003 + i * 400) * height;
    let s = 240 + sin( frameCount * 0.01 + i) * 120 + energy * 120 + beatPulse * 3;
    let phase = frameCount*0.01+i*0.7;
    fill(220 + sin(phase) * 35,180 + sin(phase + 2) * 60,120 + sin(phase + 4) * 55,10);
    ellipse(x, y, s);
  }
  blendMode(BLEND);
}

// ==========================================
// CURSOR AURA
// ==========================================

function drawCursorAura() {
  blendMode(ADD);
  for (let i = 0; i < 2; i++) { 
    fill(255,230,190,5);
    ellipse( mouseX, mouseY, cursorAuraSize + i * 3);
  }
  blendMode(BLEND);
}

// ==========================================
// CREATURE
// ==========================================

class Creature {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-1,1);
    this.vy = random(-1,1);
    this.baseX = this.x;
    this.baseY = this.y;
    this.baseSize = random(4,15);
    this.size =this.baseSize;
    this.offset = random(1000);
    this.speed = random(0.5,2.0);
    this.friendliness = random(0.7,1.3);
    this.colorOffset = random(1000);
    this.waveDelay = random(0.2,1.4);
    this.behavior = floor(random(4));
    this.heading = random(TWO_PI);
    this.homeX = this.x;
    this.homeY = this.y;
    this.beatOffset = random(TWO_PI);
    this.orbitRadius = random(6,24);
    this.nodes = [];
    let count = floor(random(4,8));
    for (let i = 0; i<count; i++) {
      this.nodes.push({
        x:random(-15,15), y:random(-15,15)
      });
    }
  }
  update() {
    // ==========================================
    // base floating
    // ==========================================
    let musicNudge = beatPulse * 0.02;
    this.x += sin(frameCount * 0.05 + this.offset) * musicNudge;
    this.y += cos(frameCount * 0.05 + this.offset) * musicNudge;
    if (this.behavior == 0) {
  this.x += sin(frameCount * 0.01 + this.offset) * 0.8;
  this.y += cos(frameCount * 0.012 + this.offset) * 0.8;
}
    if (this.behavior == 1) {
  this.x += sin(frameCount * 0.004 + this.offset) * 1.8;
  this.y +=cos(frameCount * 0.005 + this.offset) * 1.4;
}
    if (this.behavior == 2) {
  this.heading += map( noise(this.offset + frameCount * 0.002),0, 1,-0.007, 0.007);
  this.x += cos(this.heading) * 1.1;
  this.y += sin(this.heading) * 1.1;
}
    if (this.behavior == 3) {
  this.x += crowdFlowX * 0.6;
  this.y += crowdFlowY * 0.6;
}
    let nx = noise( this.offset + frameCount * 0.003 );
    let ny = noise( this.offset + 400 + frameCount * 0.003 );
    this.x += map(nx,0,1,-2.5,2.5) * this.speed;
    this.y += map(ny,0,1,-2.5,2.5) * this.speed;
    this.x +=sin( frameCount * 0.008 +this.offset) * 0.6;
    this.y +=cos( frameCount * 0.008 +this.offset) * 0.6;

    // ==========================================
    // idle state
    // ==========================================

    if (!awakened) { this.size = lerp( this.size, this.baseSize + beatPulse * 0.08, 0.08);
      //return;
    }

    // ==========================================
    // viewer attraction
    // ==========================================

    let d = dist( this.x, this.y, mouseX, mouseY);
    if (d < 520) { let angle = atan2( mouseY - this.y, mouseX - this.x );
      let force = map( d, 520, 0, 0.10, 1.8);
      this.x += cos(angle) * force * this.friendliness;
      this.y += sin(angle) * force * this.friendliness;
    }

    // ==========================================
    // GROUP FLOW
    // ==========================================

    this.x += crowdFlowX * this.waveDelay *  random(0.15,0.6);
    this.y += crowdFlowY * this.waveDelay *  random(0.15,0.6);
    this.y +=sin(musicPhase * 0.6 + this.waveDelay * 5) *beatPulse *0.04;

    // ==========================================
    // HORIZONTAL WAVE
    // ==========================================

    if (rhythmType == "horizontal") {
      let delayedHorizontal = sin(  frameCount * 0.18 +  this.offset * this.waveDelay) * horizontalWave * 0.45;
      this.x += delayedHorizontal;
    }

    // ==========================================
    // VERTICAL WAVE
    // ==========================================

    if (rhythmType == "vertical") {
      let delayedVertical = sin( frameCount * 0.18 + this.offset * this.waveDelay) * verticalWave * 0.45;
      this.y += delayedVertical;
    }

    // ==========================================
    // aggressive
    // ==========================================
    
    if (rhythmType == "aggressive") {
      this.x += random(-8,8);
      this.y += random(-8,8);
      this.size += random(0,5);
      this.speed = 3.5;
    }

    // ==========================================
    // calm
    // ==========================================

    else if (rhythmType == "calm") {
      this.x += sin(  frameCount * 0.01 + this.offset) * 0.5;
      this.y += cos(  frameCount * 0.01 + this.offset ) * 0.5;
      this.speed = 0.35;
    }
    else {
      this.speed = 1;
    }
    this.x += random( -energy * 0.2, energy * 0.2 );
    this.y += random(-energy * 0.2, energy * 0.2);
    let breathing =sin(musicPhase * 0.8 +this.offset) *(beatPulse * 0.12);
this.size += breathing;

    // ==========================================
    // size
    // ==========================================

    this.size = lerp(this.size, this.baseSize + map( d,420,0,0,25) + beatPulse * 0.15 + energy, 0.08);

    // ==========================================
    // wrapping
    // ==========================================

    if (this.x < -50) this.x = width + 50;
    if (this.x > width + 50) this.x = -50;
    if (this.y < -50) this.y = height + 50;
    if (this.y > height + 50) this.y = -50;
    this.vx += map(nx,0,1,-0.08,0.08);
    this.vy += map(ny,0,1,-0.08,0.08);
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
    let homeForce = 0.003;
this.x += (this.homeX - this.x) * homeForce;
this.y +=(this.homeY - this.y)* homeForce;
    this.x += (width / 2 - this.x) * 0.001;
this.y += (height / 2 - this.y) * 0.001;
  }
  
  display()  {
  let phase = frameCount * 0.01 + this.colorOffset;
  let r = 220 + sin(phase) * 35;
  let g = 170 + sin(phase + 2) * 85;
  let b = 120 + sin(phase + 4) * 40;
  blendMode(ADD);
  stroke(r, g, b, 20);
  for (let i = 0; i < this.nodes.length; i++) {
    let a = this.nodes[i];
    let bNode = this.nodes[(i + 1) % this.nodes.length];
    line( this.x + a.x, this.y + a.y, this.x + bNode.x, this.y + bNode.y);
  }
  noStroke();
  for (let node of this.nodes) {
    fill(r, g, b, 60);
    ellipse(this.x + node.x, this.y + node.y, this.size * 0.5);
    fill(r, g, b, 12);
    ellipse(this.x + node.x, this.y + node.y, this.size * 1.2);
  }
  blendMode(BLEND);
 }
}

// ==========================================
// PULSE
// ==========================================

class Pulse {
  constructor(x,y,maxR) {
    this.x = x;
    this.y = y;
    this.r = 5;
    this.maxR = maxR;
    this.alpha = 100;
    this.dead = false;
  }
  update() {
    this.r += 6;
    this.alpha -= 2;
    if (this.r > this.maxR || this.alpha <= 0
    ) {
      this.dead = true;
    }
  }
  display() {
    noFill();
    let phase = frameCount*0.05+this.r*0.1;
    stroke(255,220 + sin(phase) * 25,180 + sin(phase + 2) * 50,this.alpha);
    strokeWeight(1.5);
    ellipse( this.x, this.y, this.r);
    noStroke();
  }
}

// ==========================================
// INTERACTION
// ==========================================

function mousePressed() {
  if (!awakened) {
    awakened = true;
    if (music && !music.isPlaying()) {
      music.loop();
    }
    globalAttention = 5;
    energy = 2.2;
    awakeningFlash = 50;
    lastMoveTime = millis();
    for (let i = 0; i < 26; i++) {
      pulses.push( new Pulse( mouseX + random(-150,150), mouseY + random(-150,150), random(60,140) ));
    }
    return;
  }
  energy += 1.0;
  globalAttention += 0.4;
  for (let i = 0; i < 8; i++) {
    pulses.push( new Pulse(  mouseX + random(-60,60), mouseY + random(-60,60), random(80,180) ));
  }
}
function mouseDragged() {
  if (!awakened) return;
  energy += 0.05;
}
function keyPressed() {
  if (!awakened) return;
  if (keyCode === UP_ARROW) {
    energy += 0.5;
     for (let c of creatures) {
    c.x += random(-25,25);
    c.y += random(-25,25);
  }
 }
  pulses.push(
    new Pulse( random(width), random(height), random(100,220) ));
  if (keyCode === DOWN_ARROW) {
    energy *= 0.8;
    awakeningFlash += 20;
  }
}