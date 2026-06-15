let creature, lasers = [], miniCreatures = [], deathParticles = [];
let bpm = 126, pulse, bgShift = 0, flashAlpha = 0;
let launcherX, launcherY, pointerAngle = 0, music, musicStarted = false;

function preload() { music = loadSound("music.mp3"); }

function setup() {
  createCanvas(1280, 720);
  launcherX = width / 2;
  launcherY = height - 20;
  creature = new Creature(launcherX, height / 2);
  noStroke();
}

function draw() {
  pulse = sin(frameCount * (bpm / 1920));
  backgroundPulse();
  pointerAngle = sin(frameCount * 0.03) * HALF_PI - HALF_PI;

  updateArr(deathParticles);
  updateArr(miniCreatures);
  creature.update();
  creature.display();
  updateLasers();
  drawLauncher();

  if (flashAlpha > 0) {
    fill(255, flashAlpha);
    rect(0, 0, width, height);
    flashAlpha *= 0.88;
  }
}

function mouseReleased() {
  let cp = cos(pointerAngle), sp = sin(pointerAngle);
  if (!musicStarted) { music.loop(); musicStarted = true; }
  lasers.push(new Laser(launcherX + cp * 100, launcherY + sp * 100, cp * 22, sp * 22));
}

function updateArr(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    arr[i].update();
    arr[i].display();
    if (arr[i].life <= 0) arr.splice(i, 1);
  }
}

function updateLasers() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    let l = lasers[i];
    l.update();
    l.display();

    if (l.hits(creature)) {
      creature.hit();
      l.hitSuccess = true;
      lasers.splice(i, 1);
      continue;
    }
    if (!l.hitSuccess && l.nearMiss(creature)) {
      creature.fear(l);
      l.hitSuccess = true;
    }
    if (l.offscreen()) {
      if (!l.hitSuccess) {
        for (let j = 0, n = floor(random(5, 10)); j < n; j++) miniCreatures.push(new MiniCreature(l.x, l.y));
      }
      lasers.splice(i, 1);
    }
  }
}

class Creature {
  constructor(x, y) { this.reset(x, y); }

  reset(x = width / 2, y = height / 2) {
    Object.assign(this, {
      x, y, baseSize: 70, health: 3, distortion: 12, hitTimer: 0, dead: false,
      offset: random(1000), deathTimer: 0, hoverEnergy: 0, fearTimer: 0,
      fearVX: 0, fearVY: 0, hoverPhase: random(TWO_PI)
    });
  }

  fear(laser) {
    let dx = this.x - laser.x, dy = this.y - laser.y;
    let d = max(1, sqrt(dx * dx + dy * dy));
    this.fearTimer = 20;
    this.fearVX += (dx / d) * 12;
    this.fearVY += (dy / d) * 12;
  }

  update() {
    if (this.x < 150) this.fearVX++; if (this.x > width - 150) this.fearVX--;
    if (this.y < 150) this.fearVY++; if (this.y > height - 150) this.fearVY--;
    
    if (this.dead) {
      if (++this.deathTimer > 240) this.reset();
      this.baseSize *= 0.85;
      return;
    }
    this.x += sin(frameCount * 0.01 + this.offset) * 1.5 + this.fearVX;
    this.y += cos(frameCount * 0.013 + this.offset) * 1.5 + this.fearVY;
    this.fearTimer *= 0.92; this.fearVX *= 0.9; this.fearVY *= 0.9;
    this.currentSize = this.baseSize + pulse * (10 + this.hoverEnergy * 12) - this.fearTimer * 0.6;
    this.hitTimer *= 0.92;
    this.hoverPhase += 0.03 + this.hoverEnergy * 0.12;

    let d = dist(mouseX, mouseY, this.x, this.y);
    this.hoverEnergy = lerp(this.hoverEnergy, d < 220 ? map(d, 220, 0, 0, 1) : 0, 0.08);
    this.currentDistortion = this.distortion + this.hitTimer * 60 + this.hoverEnergy * 25;
  }

  display() {
    push(); translate(this.x, this.y); blendMode(ADD);
    if (this.dead) {
      for (let i = 0; i < 8; i++) {
        fill(random(100, 255), random(180, 255), 255, random(10, 40));
        drawBlob(this.baseSize + random(-40, 40), random(30, 100), random(9999));
      }
    } else {
      let hm = this.hoverEnergy * 8;
      translate(sin(this.hoverPhase) * hm, cos(this.hoverPhase * 0.8) * hm);
      fill(0, 180, 255, 20);
      for (let i = 0; i < 5; i++) drawBlob(this.currentSize + i * 10, this.currentDistortion + i * 5, this.offset + i * 100 + frameCount * this.hoverEnergy * 0.08);
      fill(165, 175, 185, 50);
      drawBlob(this.currentSize, this.currentDistortion, this.offset + frameCount * this.hoverEnergy * 0.08);
    }
    pop();
  }

  hit() {
    if (!this.dead && --this.health <= 0) this.die();
    else { this.hitTimer = 20; this.baseSize *= 0.9; flashAlpha = 70; }
  }

  die() {
    this.dead = true; this.deathTimer = 0; flashAlpha = 255;
    for (let i = 0; i < 250; i++) deathParticles.push(new DeathParticle(this.x, this.y));
  }
}

class Laser {
  constructor(x, y, dx, dy) { Object.assign(this, { x, y, vx: dx, vy: dy, life: 80, hitSuccess: false }); }
  nearMiss(c) { let d = dist(this.x, this.y, c.x, c.y); return d < c.currentSize * 1.8 && d > c.currentSize * 0.75; }
  update() { this.x += this.vx; this.y += this.vy; this.life--; }
  display() {
    push(); blendMode(ADD);
    stroke(0, 255, 255); strokeWeight(2); line(this.x, this.y, this.x - this.vx * 2, this.y - this.vy * 2);
    stroke(100, 255, 255, 35); strokeWeight(6); line(this.x, this.y, this.x - this.vx * 2, this.y - this.vy * 2);
    pop();
  }
  hits(c) { return dist(this.x, this.y, c.x, c.y) < c.currentSize * 1.5; }
  offscreen() { return this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.life <= 0; }
}

class MiniCreature {
  constructor(x, y) {
    let a = random(TWO_PI), s = random(1, 4);
    Object.assign(this, { x, y, size: random(10, 24), vx: cos(a) * s, vy: sin(a) * s, offset: random(9999), life: 255 });
  }
  update() {
    this.x += this.vx + sin(frameCount * 0.05 + this.offset);
    this.y += this.vy + cos(frameCount * 0.05 + this.offset);
    this.life -= 2;
  }
  display() {
    push(); translate(this.x, this.y); blendMode(ADD);
    fill(100, 220, 255, this.life * 0.35);
    drawBlob(this.size + sin(frameCount * 0.2 + this.offset) * 3, 8, this.offset);
    pop();
  }
}

class DeathParticle {
  constructor(x, y) {
    let a = random(TWO_PI), s = random(8, 35);
    Object.assign(this, { x, y, vx: cos(a) * s, vy: sin(a) * s, size: random(2, 12), life: 255 });
  }
  update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.98; this.vy *= 0.98; this.life -= 4; }
  display() {
    push(); blendMode(ADD); fill(random(100, 255), random(180, 255), 255, this.life);
    circle(this.x, this.y, this.size); pop();
  }
}

function drawBlob(r, d, o) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.08) {
    let nv = noise(cos(a) + 1, sin(a) + 1, frameCount * 0.01 + o);
    vertex(cos(a) * (r + map(nv, 0, 1, -d, d)), sin(a) * (r + map(nv, 0, 1, -d, d)));
  }
  endShape(CLOSE);
}

function drawLauncher() {
  push(); translate(launcherX, launcherY); blendMode(ADD); rotate(pointerAngle + HALF_PI);
  stroke(0, 255, 255); strokeWeight(2); fill(0, 255, 255, 30);
  rectMode(CENTER); rect(0, -70, 4, 120);
  fill(0, 255, 255, 180); rect(0, -40, 10, 14); pop();
}

function backgroundPulse() {
  bgShift += 0.002;
  background(3, 6 + pulse * 2, 25 + sin(bgShift) * 20, 50);
  for (let i = 0; i < 35; i++) {
    fill(100, 180, 255, 8);
    circle(noise(i, frameCount * 0.002) * width, noise(i + 1000, frameCount * 0.002) * height, random(2, 10));
  }
}