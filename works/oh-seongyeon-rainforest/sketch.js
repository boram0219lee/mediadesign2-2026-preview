let creatures = [];
let trees = [];
let rain = [];
let condensation = []; 
let waterStreaks = []; 
let dustParticles = []; 
let touchParticles = []; 
let creatureSparkles = []; // 새와 나비가 흘리는 빛가루 전역 배열
let isRaining = true; 
let transitionProgress = 1; 

let activeLightning = null; 
let nextThunderTime = 0;

let userChar;
let introTimer = 300; 

function setup() {
  createCanvas(1280, 720);
  smooth();
  
  userChar = new PremiumRealisticFairy();
  
  for (let i = 0; i < 18; i++) {
    let scaleVal = map(i, 0, 17, 0.2, 1.7);
    trees.push(new PremiumTree2D(random(width), height, scaleVal));
  }

  for (let i = 0; i < 6; i++) creatures.push(new PremiumBird2D('BIRD'));
  for (let i = 0; i < 7; i++) creatures.push(new PremiumButterfly2D('BUTTERFLY'));
  for (let i = 0; i < 4; i++) creatures.push(new PremiumBeetle2D('BEETLE'));
  for (let i = 0; i < 25; i++) creatures.push(new PremiumFirefly2D('FIREFLY'));

  for (let i = 0; i < 450; i++) rain.push(new RainDrop2D());
  for (let i = 0; i < 600; i++) condensation.push(new CondensationDrop());
  for (let i = 0; i < 15; i++) waterStreaks.push(new CapillaryWaterStreak());
  for (let i = 0; i < 120; i++) dustParticles.push(new DustParticle());
  
  nextThunderTime = millis() + random(2000, 5000);
}

function draw() {
  let targetProgress = isRaining ? 1 : 0;
  transitionProgress = lerp(transitionProgress, targetProgress, 0.03);
  
  drawDitheredBackground();

  for (let i = 0; i < trees.length; i++) {
    if (trees[i].scale < 0.6) trees[i].display();
  }

  for (let i = 0; i < trees.length; i++) {
    if (trees[i].scale >= 0.6 && trees[i].scale < 1.1) trees[i].display();
  }

  if (transitionProgress < 0.5) {
    drawGodRays();
    let dustAlpha = map(transitionProgress, 0, 0.5, 1, 0);
    drawDustParticles(dustAlpha);
    drawLensFlare(dustAlpha);
  }

  if (transitionProgress > 0.1) {
    let rainAlpha = map(transitionProgress, 0.1, 1, 0, 1);
    for (let i = 0; i < rain.length; i++) {
      rain[i].update();
      rain[i].display(rainAlpha);
    }
  }

  for (let i = trees.length - 1; i >= 0; i--) {
    if (trees[i].scale >= 1.1) trees[i].display();
  }

  // 생명체들이 남긴 빛가루 파티클 처리 (새/나비 전용)
  push();
  blendMode(ADD);
  noStroke();
  for (let i = creatureSparkles.length - 1; i >= 0; i--) {
    let p = creatureSparkles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    fill(p.r, p.g, p.b, p.alpha);
    ellipse(p.x, p.y, p.size);
    if (p.alpha <= 0) creatureSparkles.splice(i, 1);
  }
  pop();

  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.applyBehaviors(creatures, userChar.pos); 
    c.maxSpeed = isRaining ? c.personalMaxSpeed * 0.6 : c.personalMaxSpeed;
    c.checkCharacterCollision(userChar.pos);
    c.update();
    c.display();
  }

  for (let i = touchParticles.length - 1; i >= 0; i--) {
    touchParticles[i].update();
    touchParticles[i].display();
    if (touchParticles[i].isDead()) {
      touchParticles.splice(i, 1);
    }
  }

  drawMist();
  
  if (isRaining && transitionProgress > 0.4) {
    drawGlassCondensation();
    handleRealisticLightning(); 
  } else {
    activeLightning = null; 
  }

  applyRainyDesaturation();

  // 최전방 레이어에서 영롱하게 빛나는 추상 요정 렌더링
  userChar.update(mouseX, mouseY); 
  userChar.display();

  drawCustomCursor();
  drawOnboardingUI();
}

function drawDitheredBackground() {
  noFill();
  let topColorRain = color(5, 12, 10);
  let bottomColorRain = color(12, 22, 18);
  let topColorClear = color(12, 45, 38);
  let bottomColorClear = color(25, 68, 52);
  
  for (let y = 0; y < height; y++) {
    let inter = map(y + random(-0.6, 0.6), 0, height, 0, 1);
    let cRain = lerpColor(topColorRain, bottomColorRain, inter);
    let cClear = lerpColor(topColorClear, bottomColorClear, inter);
    let c = lerpColor(cClear, cRain, transitionProgress);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGodRays() {
  push(); blendMode(ADD); noStroke();
  let rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    let x = map(i, 0, rayCount - 1, width * 0.1, width * 0.9);
    let rayWidth = random(80, 200);
    let pulse = sin(frameCount * 0.008 + i * 0.7) * 0.3 + 0.7;
    let alpha = 15 * pulse * (1 - transitionProgress); 
    for (let j = 0; j < 20; j++) {
      let y = map(j, 0, 19, -50, height + 50);
      let w = rayWidth * map(j, 0, 19, 0.3, 1.5);
      fill(255, 245, 200, alpha * (1 - j / 25));
      ellipse(x + sin(frameCount * 0.01 + i) * 30, y, w, 80);
    }
  }
  pop();
}

function drawDustParticles(alpha) {
  for (let p of dustParticles) {
    p.update();
    p.display(alpha);
  }
}

function drawLensFlare(alpha) {
  push(); blendMode(ADD); noStroke();
  let sunX = width * 0.7 + sin(frameCount * 0.005) * 50;
  let sunY = height * 0.15;
  let glowSize = 150 + sin(frameCount * 0.02) * 20;
  for (let i = 5; i > 0; i--) {
    fill(255, 250, 220, 3 * alpha * i);
    ellipse(sunX, sunY, glowSize * i * 0.6, glowSize * i * 0.6);
  }
  for (let i = 0; i < 12; i++) {
    let bx = lerp(sunX, width / 2, i / 12) + random(-30, 30);
    let by = lerp(sunY, height / 2, i / 12) + random(-30, 30);
    fill(255, 240, 200, random(5, 20) * alpha);
    ellipse(bx, by, random(8, 35), random(8, 35));
  }
  pop();
}

function drawGlassCondensation() {
  let condAlpha = map(transitionProgress, 0.4, 1, 0, 1);
  for (let streak of waterStreaks) { streak.update(); streak.display(condAlpha); }
  for (let drop of condensation) { drop.update(); drop.display(condAlpha); }
  push(); noStroke();
  for (let i = 0; i < 2; i++) { fill(180, 200, 195, 6 * condAlpha); rect(0, 0, width, height); }
  pop();
}

function handleRealisticLightning() {
  if (millis() > nextThunderTime && activeLightning === null) {
    activeLightning = new RealisticLightningBolt();
    nextThunderTime = millis() + random(4000, 9000); 
  }

  if (activeLightning !== null) {
    activeLightning.update();
    activeLightning.display(transitionProgress);
    if (activeLightning.isDead()) {
      activeLightning = null;
    }
  }
}

function applyRainyDesaturation() {
  if (transitionProgress > 0.05) {
    push();
    blendMode(SUBTRACT); 
    noStroke();
    let satReduction = map(transitionProgress, 0, 1, 0, 35);
    fill(15, 8, 25, satReduction); 
    rect(0, 0, width, height);
    pop();
  }
}

function mousePressed() {
  isRaining = !isRaining;
}

function drawCustomCursor() {
  noCursor(); 
  push();
  translate(mouseX, mouseY);
  blendMode(ADD);
  noFill();
  stroke(255, 255, 255, 80);
  makeStrokeWeight = 1;
  strokeWeight(makeStrokeWeight);
  ellipse(0, 0, 28, 28);
  noStroke();
  fill(255, 230, 150, 200);
  ellipse(0, 0, 5, 5);
  let pulse = sin(frameCount * 0.1) * 6;
  stroke(255, 200, 100, 40);
  ellipse(0, 0, 35 + pulse, 35 + pulse);
  pop();
}

function drawOnboardingUI() {
  if (introTimer > 0) {
    introTimer--;
  }
}

function drawMist() {
  noStroke();
  for (let i = 0; i < 3; i++) {
    let alpha = lerp(4 + i * 1.5, 9 + i * 2, transitionProgress);
    fill(80, 105, 95, alpha); rect(0, 0, width, height);
  }
}

class RealisticLightningBolt {
  constructor() {
    this.segments = [];
    this.lifespan = 255;
    this.decay = random(12, 20); 
    
    let startX = random(width * 0.2, width * 0.8);
    let startY = 0;
    
    let currentX = startX;
    let currentY = startY;
    
    while (currentY < height * 0.7) {
      let nextX = currentX + random(-35, 35);
      let nextY = currentY + random(15, 40);
      
      this.segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY, isBranch: false });
      
      if (random(1) < 0.2) {
        let branchX = nextX;
        let branchY = nextY;
        for (let i = 0; i < 3; i++) {
          let bNextX = branchX + random(-40, 40);
          let bNextY = branchY + random(10, 25);
          this.segments.push({ x1: branchX, y1: branchY, x2: bNextX, y2: bNextY, isBranch: true });
          branchX = bNextX;
          branchY = bNextY;
        }
      }
      currentX = nextX;
      currentY = nextY;
    }
  }

  update() { this.lifespan -= this.decay; }

  display(weatherAlpha) {
    if (this.lifespan <= 0) return;
    push();
    blendMode(ADD); 
    if (this.segments.length > 0 && this.lifespan > 150) {
      noStroke();
      fill(215, 235, 255, (this.lifespan * 0.12) * weatherAlpha);
      ellipse(this.segments[0].x1, 30, 350, 150);
    }
    for (let seg of this.segments) {
      if (seg.isBranch) {
        stroke(180, 210, 255, this.lifespan * weatherAlpha);
        strokeWeight(1.2);
      } else {
        stroke(240, 248, 255, this.lifespan * weatherAlpha);
        strokeWeight(random(2.5, 4.0));
      }
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }
    pop();
  }

  isDead() { return this.lifespan <= 0; }
}

class TouchSpark {
  constructor(x, y, r, g, b) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(3, 8)); 
    this.lifespan = 255;
    this.decay = random(6, 12); 
    this.size = random(3, 7);
    this.color = color(r, g, b);
  }
  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.92); 
    this.lifespan -= this.decay;
  }
  display() {
    push(); blendMode(ADD); noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    pop();
  }
  isDead() { return this.lifespan <= 0; }
}

class PremiumRealisticFairy {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.vel = createVector(0, 0); 
    this.acc = createVector(0, 0); 
    this.friction = 0.75;           
    this.wobblePhase = random(1000);
    this.sparkles = []; 
  }

  update(targetX, targetY) {
    let target = createVector(targetX, targetY);
    let force = p5.Vector.sub(target, this.pos);
    let distance = force.mag();
    
    if (distance > 2) { 
      force.setMag(map(distance, 0, 300, 0.5, 5));
      this.acc.add(force);
    }
    
    this.vel.add(this.acc);
    this.vel.mult(this.friction); 
    this.pos.add(this.vel);
    this.acc.set(0, 0); 
    
    this.pos.x = constrain(this.pos.x, 50, width - 50);
    this.pos.y = constrain(this.pos.y, 80, height - 20);

    if (this.vel.mag() > 0.5 && random(1) < 0.4) {
      this.sparkles.push({
        x: this.pos.x + random(-10, 10),
        y: this.pos.y + random(-10, 10),
        vx: random(-0.5, 0.5),
        vy: random(0.2, 1),
        alpha: 255,
        size: random(2, 5)
      });
    }

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      let p = this.sparkles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 6;
      if (p.alpha <= 0) this.sparkles.splice(i, 1);
    }
  }

  display() {
    push();
    blendMode(ADD);
    noStroke();

    for (let p of this.sparkles) {
      fill(255, 240, 150, p.alpha * 0.7);
      ellipse(p.x, p.y, p.size);
    }

    let bobbing = sin(frameCount * 0.04 + this.wobblePhase) * 6;
    translate(this.pos.x, this.pos.y + bobbing);
    
    let angle = this.vel.x * 0.025;
    rotate(constrain(angle, -0.15, 0.15));

    let pulse = sin(frameCount * 0.05) * 8;
    for (let i = 6; i > 0; i--) {
      fill(255, 235, 160, 4 * i);
      ellipse(0, 0, (65 + pulse) * i * 0.35, (75 + pulse) * i * 0.35);
    }

    let wingWiggle = sin(frameCount * 0.08) * 0.15;
    for (let dir of [-1, 1]) { 
      push();
      scale(dir, 1);
      rotate(wingWiggle);
      
      fill(255, 255, 230, 45);
      beginShape();
      vertex(0, -5);
      bezierVertex(25, -30, 65, -25, 70, 5);
      bezierVertex(45, 15, 15, 5, 0, -5);
      endShape(CLOSE);
      
      fill(255, 210, 150, 30);
      beginShape();
      vertex(0, 5);
      bezierVertex(20, 20, 45, 25, 40, 40);
      bezierVertex(20, 35, 5, 15, 0, 5);
      endShape(CLOSE);
      pop();
    }

    fill(255, 255, 255, 230);
    ellipse(0, -2, 14, 18);
    fill(255, 245, 180, 255);
    ellipse(0, -2, 8, 10);
    
    stroke(255, 255, 255, 200);
    strokeWeight(1.5);
    line(-15, -2, 15, -2);
    line(0, -17, 0, 13);

    pop();
  }
}

class PremiumCreature2D {
  constructor(type) {
    this.type = type;
    this.pos = createVector(random(width), random(height * 0.2, height * 0.6));
    this.vel = p5.Vector.random2D();
    this.acc = createVector();
    this.maxForce = 0.5; 
    this.sparkColor = [255, 255, 255]; 
    this.personalSeed = random(10000);
    this.speedMult = random(0.75, 1.35); 
  }

  applyForce(f) { this.acc.add(f); }

  handleFlee(targetPos) {
    let d = p5.Vector.dist(this.pos, targetPos);
    let scareRadius = 180; 
    if (d < scareRadius) {
      let desired = p5.Vector.sub(this.pos, targetPos); 
      desired.setMag(this.personalMaxSpeed * 4.5); 
      let steer = p5.Vector.sub(desired, this.vel);
      let maxForceValue = this.maxForce || 0.5;
      steer.limit(maxForceValue * 3.5);
      this.applyForce(steer);
    }
  }

  checkCharacterCollision(characterPos) {
    let d = p5.Vector.dist(this.pos, characterPos);
    let collideRadius = 40; 
    if (d < collideRadius) {
      let bounce = p5.Vector.sub(this.pos, characterPos).setMag(this.personalMaxSpeed * 8);
      this.vel.add(bounce);
      for (let i = 0; i < 8; i++) {
        touchParticles.push(new TouchSpark(this.pos.x, this.pos.y, this.sparkColor[0], this.sparkColor[1], this.sparkColor[2]));
      }
    }
  }

  update() {
    this.vel.add(this.acc);
    let maxSpeedVal = this.maxSpeed || 2;
    this.vel.limit(maxSpeedVal);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    if (this.pos.x < -80) this.pos.x = width + 80;
    if (this.pos.x > width + 80) this.pos.x = -80;
    if (this.pos.y < -80) this.pos.y = height + 80;
    if (this.pos.y > height + 80) this.pos.y = -80;
  }

  separate(others, dThresh) {
    let steer = createVector(0, 0); let count = 0;
    for (let i = 0; i < others.length; i++) {
      let other = others[i];
      if (other !== this && other.type === this.type) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < dThresh) {
          let diff = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
          steer.add(diff); count++;
        }
      }
    }
    if (count > 0) steer.div(count);
    return steer;
  }
}

// 🦅 3단계 래디얼 그라데이션 오라를 두른 신비로운 파란 새
class PremiumBird2D extends PremiumCreature2D {
  constructor(type) { 
    super(type); 
    this.baseMaxSpeed = random(3.5, 6.5); 
    this.personalMaxSpeed = this.baseMaxSpeed * this.speedMult;
    this.sparkColor = [135, 206, 250]; 
    
    this.wingTime = random(100);
    this.personalFlapFreq = random(0.2, 0.4);
    this.isGliding = false;
    this.glideTimer = random(40, 200);
    
    this.noiseOffset = random(1000);
    this.waveMagnitude = random(0.3, 0.9);
  }

  applyBehaviors(others, targetPos) { 
    this.handleFlee(targetPos); 
    this.applyForce(this.separate(others, 90).mult(2.5)); 

    let customYFlew = sin(frameCount * 0.02 + this.noiseOffset) * this.waveMagnitude;
    let customXFlew = cos(frameCount * 0.005 + this.noiseOffset) * 0.2;
    let aerodynamicFlow = createVector(this.vel.x + customXFlew, customYFlew);
    aerodynamicFlow.normalize().mult(random(0.2, 0.5));
    this.applyForce(aerodynamicFlow);

    if ((frameCount + floor(this.noiseOffset)) % 180 === 0 && !this.isGliding) {
      this.applyForce(createVector(random(-1, 1), random(-2, -4))); 
    }
  }

  update() {
    super.update();
    this.glideTimer--;
    if (this.glideTimer <= 0) {
      this.isGliding = !this.isGliding;
      this.glideTimer = this.isGliding ? random(30, 90) : random(60, 240);
    }

    if (random(1) < 0.25) {
      creatureSparkles.push({
        x: this.pos.x + random(-5, 5), y: this.pos.y + random(-5, 5),
        vx: this.vel.x * -0.2 + random(-0.3, 0.3), vy: random(0.1, 0.6),
        r: 160, g: 230, b: 255, alpha: 220,
        size: random(2, 4.5), decay: random(2, 5)
      });
    }
  }

  display() { 
    push(); 
    translate(this.pos.x, this.pos.y); 
    
    let headingAngle = this.vel.heading();
    let isHeadingLeft = (headingAngle > HALF_PI || headingAngle < -HALF_PI);
    
    if (isHeadingLeft) {
      rotate(headingAngle + PI);
      scale(-1.4, 1.4); 
    } else {
      rotate(headingAngle);
      scale(1.4, 1.4); 
    }
    
    // 네이티브 그래픽 브라우저 래디얼 그라데이션 적용
    push();
    blendMode(ADD);
    let grad = drawingContext.createRadialGradient(0, 0, 0, 0, 0, 45);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.2, 'rgba(100, 190, 255, 0.5)');
    grad.addColorStop(1, 'rgba(30, 70, 150, 0)');
    drawingContext.fillStyle = grad;
    noStroke();
    ellipse(0, 0, 90, 90);
    pop();

    noStroke(); 
    fill(40, 90, 160, 30); 
    ellipse(-1, 3, 22, 16); 
    
    fill(245, 250, 255); 
    ellipse(0, 0, 22, 18); 
    
    fill(70, 145, 225);
    arc(1, -1, 20, 16, PI + QUARTER_PI, TWO_PI - QUARTER_PI, CHORD);

    fill(25); ellipse(7, -3, 2.5, 2.5);
    fill(255, 195, 45); triangle(10, -2, 13, -1, 10, 0); 
    fill(35, 75, 140); rect(-14, -1.5, 4, 3, 1);

    let flapAngle = !this.isGliding ? sin(frameCount * this.personalFlapFreq + this.wingTime) * 1.3 : 0.05;

    fill(100, 200, 255);
    push(); translate(1, -2); rotate(-HALF_PI + flapAngle * 0.75);
    beginShape(); vertex(0, 0); bezierVertex(-2, -8, 3, -13, -1, -16); bezierVertex(-7, -13, -6, -6, 0, 0); endShape(CLOSE); pop();

    push(); translate(1, 2); rotate(HALF_PI - flapAngle * 0.75);
    beginShape(); vertex(0, 0); bezierVertex(-2, 8, 3, 13, -1, 16); bezierVertex(-7, 13, -6, 6, 0, 0); endShape(CLOSE); pop();
    
    pop(); 
  }
}

// 🦋 360도 자유 유영 및 환상적인 네온 핑크 그라데이션 나비
class PremiumButterfly2D extends PremiumCreature2D {
  constructor(type) { 
    super(type); 
    this.baseMaxSpeed = random(2.0, 3.8); 
    this.personalMaxSpeed = this.baseMaxSpeed * this.speedMult;
    this.wingSeed = random(1000); 
    this.sparkColor = [255, 150, 200]; 
    
    this.xTime = random(5000);
    this.yTime = random(5000);
    this.xSpeed = random(0.008, 0.015);
    this.ySpeed = random(0.008, 0.015);
  }

  applyBehaviors(others, targetPos) { 
    this.handleFlee(targetPos); 
    
    if (isRaining) { 
      let shelter = createVector(this.pos.x, height * 0.25); 
      let maxForceVal = this.maxForce || 0.5;
      this.applyForce(p5.Vector.sub(p5.Vector.sub(shelter, this.pos).setMag(this.personalMaxSpeed * 0.4), this.vel).limit(maxForceVal)); 
    } 

    this.xTime += this.xSpeed;
    this.yTime += this.ySpeed;
    
    // Perlin Noise를 라디안 각도로 변환해 완전한 상하좌우 비행 궤적 생성
    let angleNoise = noise(this.xTime, this.yTime) * TWO_PI * 2;
    let desired = p5.Vector.fromAngle(angleNoise).setMag(this.personalMaxSpeed);
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(0.35); 
    this.applyForce(steer);
    
    this.applyForce(this.separate(others, 40).mult(0.6));
  }

  update() {
    super.update();
    if (random(1) < 0.3) {
      creatureSparkles.push({
        x: this.pos.x, y: this.pos.y,
        vx: random(-0.5, 0.5), vy: random(-0.2, 0.5),
        r: 255, g: 130, b: 210, alpha: 220,
        size: random(1.5, 3.8), decay: random(3, 6)
      });
    }
  }

  display() { 
    push(); 
    translate(this.pos.x, this.pos.y); 
    
    if (this.vel.mag() > 0.1) {
      rotate(this.vel.heading()); 
    }
    noStroke(); 
    
    let flap = sin(frameCount * 0.28 + this.wingSeed); 
    let wingWidth = map(abs(flap), 0, 1, 1.5, 14); 
    
    // 네온 핑크 광운을 뿜는 래디얼 그라데이션 레이어
    push();
    blendMode(ADD);
    let grad = drawingContext.createRadialGradient(2, 0, 0, 2, 0, 30);
    grad.addColorStop(0, 'rgba(255, 230, 245, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 80, 180, 0.5)');
    grad.addColorStop(1, 'rgba(150, 50, 200, 0)');
    drawingContext.fillStyle = grad;
    ellipse(2, 0, 60, 60);
    pop();

    fill(255, 140, 200, 230); ellipse(2, -5, wingWidth, 14); ellipse(2, 5, wingWidth, 14); 
    fill(195, 130, 255, 230); ellipse(-3, -4, wingWidth * 0.7, 9); ellipse(-3, 4, wingWidth * 0.7, 9); 
    
    fill(255, 250, 255); 
    ellipse(0, 0, 11, 3.5); 
    pop(); 
  }
}

class PremiumBeetle2D extends PremiumCreature2D {
  constructor(type) { 
    super(type); 
    this.baseMaxSpeed = random(1.3, 2.4); 
    this.personalMaxSpeed = this.baseMaxSpeed * this.speedMult;
    this.sparkColor = [140, 180, 160]; 
  }
  applyBehaviors(others, targetPos) { 
    this.handleFlee(targetPos); 
    let groundBound = createVector(this.pos.x, height - 40); 
    let maxForceVal = this.maxForce || 0.5;
    this.applyForce(p5.Vector.sub(p5.Vector.sub(groundBound, this.pos).setMag(this.personalMaxSpeed * 0.2), this.vel).limit(maxForceVal)); 
    let crawlX = (noise(frameCount * 0.01 + this.personalSeed) - 0.45) * 0.8;
    this.applyForce(createVector(crawlX, 0));
  }
  display() { 
    push(); translate(this.pos.x, this.pos.y); rotate(this.vel.heading()); stroke(35, 40, 38, 120); strokeWeight(1.2); noFill(); 
    let legWiggle = sin(frameCount * 0.3) * 2; 
    line(-1, -3, -3, -7 - legWiggle); line(3, -3, 5, -7 + legWiggle); 
    line(-1, 3, -3, 7 + legWiggle); line(3, 3, 5, 7 - legWiggle); 
    noStroke(); fill(30, 40, 35); ellipse(0, 0, 16, 11); fill(50, 68, 56); ellipse(-2, 0, 10, 9); pop(); 
  }
}

class PremiumFirefly2D extends PremiumCreature2D {
  constructor(type) { 
    super(type); 
    this.baseMaxSpeed = random(2.2, 4.0); 
    this.personalMaxSpeed = this.baseMaxSpeed * this.speedMult;
    this.glowPhase = random(1000); 
    this.sparkColor = [180, 255, 120]; 
  }
  applyBehaviors(others, targetPos) { 
    this.handleFlee(targetPos); 
    this.applyForce(this.separate(others, 40).mult(1.2)); 
    let vx = (noise(frameCount * 0.02, this.personalSeed) - 0.5) * 1.5;
    let vy = (noise(frameCount * 0.02, this.personalSeed + 50) - 0.5) * 1.5;
    this.applyForce(createVector(vx, vy));
  }
  display() {
    push(); translate(this.pos.x, this.pos.y); noStroke(); blendMode(ADD); 
    let pulse = sin(frameCount * (0.04 * this.speedMult) + this.glowPhase); 
    let brightness = map(pulse, -1, 1, 90, 255); 
    let maxRadius = map(pulse, -1, 1, 120, 280); 
    for (let i = 16; i > 0; i--) {
      let ratio = i / 16; let currentRadius = maxRadius * ratio; let alphaFactor = pow(1 - ratio, 2.8); 
      fill(170, 245, 100, brightness * 0.07 * alphaFactor); ellipse(0, 0, currentRadius, currentRadius);
    }
    fill(210, 255, 140, brightness * 0.4); ellipse(0, 0, 18, 18);
    fill(255, 255, 250, brightness); ellipse(0, 0, 7, 7); pop();
  }
}

class CondensationDrop { constructor() { this.reset(); } reset() { this.x = random(width); this.y = random(height); this.size = random(1, 8); this.opacity = random(20, 80); this.shimmer = random(1000); } update() { if (this.size > 5 && random() < 0.01) { this.y += random(0.5, 2); if (this.y > height) this.reset(); } } display(alpha) { push(); let finalAlpha = this.opacity * alpha * (sin(frameCount * 0.03 + this.shimmer) * 0.2 + 0.8); noStroke(); fill(0, 20, 15, finalAlpha * 0.3); ellipse(this.x + 1, this.y + 1, this.size, this.size * 0.9); fill(200, 220, 215, finalAlpha); ellipse(this.x, this.y, this.size, this.size * 0.9); pop(); } }
class CapillaryWaterStreak { constructor() { this.reset(); } reset() { this.x = random(width); this.y = random(-200, 0); this.speed = random(0.6, 1.6); this.nodes = []; this.maxNodes = floor(random(25, 50)); this.wobbleSeed = random(1000); this.opacity = random(35, 75); } update() { this.y += this.speed; if (this.nodes.length < this.maxNodes && frameCount % 3 === 0) { let lastX = this.nodes.length > 0 ? this.nodes[this.nodes.length - 1].x : this.x; let lastY = this.nodes.length > 0 ? this.nodes[this.nodes.length - 1].y : this.y; let nx = lastX + (noise(frameCount * 0.06, this.wobbleSeed) - 0.5) * 12; let ny = lastY + random(5, 13); let branch = false; let bx = 0, by = 0; if (random() < 0.14 && this.nodes.length > 8) { branch = true; bx = nx + (random() < 0.5 ? -1 : 1) * random(10, 22); by = ny + random(4, 10); } this.nodes.push({ x: nx, y: ny, hasBranch: branch, bx: bx, by: by }); } if (this.nodes.length > 0 && this.nodes[0].y > height + 200) this.reset(); for (let node of this.nodes) { node.y += this.speed * 0.2; if (node.hasBranch) node.by += this.speed * 0.2; } this.y += this.speed * 0.2; } display(alpha) { if (this.nodes.length < 2) return; push(); noFill(); stroke(200, 225, 240, this.opacity * alpha); strokeWeight(2.0); beginShape(); vertex(this.x, this.y); for (let node of this.nodes) vertex(node.x, node.y); endShape(); strokeWeight(0.9); stroke(185, 215, 230, this.opacity * alpha * 0.6); for (let node of this.nodes) { if (node.hasBranch) { line(node.x, node.y, node.bx, node.by); fill(220, 235, 245, this.opacity * alpha); ellipse(node.bx, node.by, 2, 2.5); noFill(); } } pop(); } }
class DustParticle { constructor() { this.reset(); } reset() { this.x = random(width); this.y = random(height); this.z = random(0.3, 1); this.size = random(1, 4) * this.z; this.speedX = random(-0.3, 0.3); this.speedY = random(-0.2, 0.1); this.phase = random(1000); } update() { this.x += this.speedX + sin(frameCount * 0.01 + this.phase) * 0.2; this.y += this.speedY; if (this.x < -10) this.x = width + 10; if (this.x > width + 10) this.x = -10; if (this.y < -10 || this.y > height + 10) this.reset(); } display(alpha) { push(); noStroke(); let a = 40 * alpha * this.z * (sin(frameCount * 0.05 + this.phase) * 0.3 + 0.7); fill(255, 250, 230, a * 0.3); ellipse(this.x, this.y, this.size * 3, this.size * 3); fill(255, 255, 245, a); ellipse(this.x, this.y, this.size, this.size); pop(); } }
class RainDrop2D { constructor() { this.pos = createVector(random(width), random(-height, 0)); this.speed = random(10, 16); this.len = map(this.speed, 10, 16, 15, 35); } update() { this.pos.y += this.speed; this.pos.x += 0.5; if (this.pos.y > height || this.pos.x > width) { this.pos.y = random(-50, -10); this.pos.x = random(width); } } display(alpha = 1) { stroke(180, 210, 245, map(this.speed, 10, 16, 30, 75) * alpha); strokeWeight(map(this.speed, 10, 16, 0.7, 1.2)); line(this.pos.x, this.pos.y, this.pos.x + 1.5, this.pos.y + this.len); } }
class PremiumTree2D { constructor(x, y, s) { this.x = x; this.y = y; this.scale = s; this.leaves = []; this.barkLines = []; this.trunkSeed = random(5000); this.treeHeight = random(height * 0.75, height * 0.95); for (let l = 0; l < floor(random(3, 5)); l++) this.barkLines.push(random(-12, 12)); for (let i = 0; i < floor(map(s, 0.2, 1.7, 50, 220)); i++) { let gb = random(55, 145); this.leaves.push({ x: random(-195, 195), y: random(-this.treeHeight - 20, -this.treeHeight * 0.2), size: random(8, 24), angle: random(TWO_PI), c: color(gb * random(0.2, 0.35), gb, gb * random(0.55, 0.7), 190), veinC: color(gb * 0.1, gb * 0.6, gb * 0.3, 160) }); } this.trunkColor = color(20, 15, 10); } display() { let fogColor = color(12, 28, 23); let fogAmt = constrain(map(this.scale, 0.2, 1.7, 0.93, 0.03), 0, 1); push(); translate(this.x, this.y); scale(this.scale); fill(lerpColor(this.trunkColor, fogColor, fogAmt)); noStroke(); beginShape(); for (let yPos = 0; yPos <= this.treeHeight; yPos += 20) { vertex(-25 - noise(this.trunkSeed, yPos * 0.015) * 35, -yPos); } for (let yPos = this.treeHeight; yPos >= 0; yPos -= 20) { vertex(25 + noise(this.trunkSeed + 500, yPos * 0.015) * 35, -yPos); } endShape(CLOSE); stroke(lerpColor(color(35, 28, 20, 100), fogColor, fogAmt)); strokeWeight(1); noFill(); for (let bx of this.barkLines) { beginShape(); for (let yPos = 10; yPos < this.treeHeight - 30; yPos += 40) { vertex(bx + noise(this.trunkSeed + bx, yPos * 0.01) * 20 - 10, -yPos); } endShape(); } for (let i = 0; i < this.leaves.length; i++) { let l = this.leaves[i]; let sway = sin(frameCount * 0.018 + this.x * 0.05 + l.x) * 6; push(); translate(l.x + sway, l.y); rotate(l.angle + sway * 0.012); noStroke(); fill(lerpColor(l.c, fogColor, fogAmt)); beginShape(); vertex(0, 0); bezierVertex(-l.size / 2, -l.size / 4, -l.size / 1.7, -l.size, 0, -l.size * 1.25); bezierVertex(l.size / 1.7, -l.size, l.size / 2, -l.size / 4, 0, 0); endShape(CLOSE); stroke(lerpColor(l.veinC, fogColor, fogAmt)); strokeWeight(0.6); line(0, 0, 0, -l.size * 1.1); pop(); } pop(); } }