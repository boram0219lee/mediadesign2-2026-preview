let objects = [];
let creature;
let marineSnow = []; 
let backgroundObjects = []; 

let objectImgs = []; 

let backDebris = [];
let midDebris = [];
let frontDebris = [];

let bgm, glowSound, magicSound, soundCharge; 
let soundTV, soundRadio, soundRing, soundArcade, soundKids, soundRewind;

// 글로벌 색상 정의
let abyssColor;
let debrisBackCol;
let debrisMidCol;
let debrisFrontCol;
let bgDebrisColors = [];

function preload() {
  objectImgs.push(loadImage('new1.png')); 
  objectImgs.push(loadImage('new2.png')); 
  objectImgs.push(loadImage('new3.png')); 
  objectImgs.push(loadImage('new4.png')); 
  objectImgs.push(loadImage('new5.png')); 
  objectImgs.push(loadImage('new6.png')); 
  
  soundFormats('mp3', 'wav'); 
  bgm = loadSound('underwater.mp3');
  glowSound = loadSound('ding.mp3');
  magicSound = loadSound('magic2.mp3');
  
  soundCharge = loadSound('charge.mp3');
  
  soundTV = loadSound('-tv.mp3');
  soundRadio = loadSound('-radio1.mp3');
  soundRing = loadSound('-phone.mp3');
  soundArcade = loadSound('-gameboy.mp3'); 
  soundKids = loadSound('-kids2.mp3');
  soundRewind = loadSound('-cassette.mp3');
}

function setup() {
  createCanvas(1280, 720);
  noStroke(); 
  imageMode(CENTER); 
  
  if (bgm) bgm.setVolume(0.3)
  if (glowSound) glowSound.setVolume(0.05);
  if (magicSound) magicSound.setVolume(0.2);
  if (soundCharge) soundCharge.setVolume(0.05); 
  
  if (soundTV) soundTV.setVolume(0.5);
  if (soundRadio) soundRadio.setVolume(0.3);
  if (soundRing) soundRing.setVolume(0.3);
  if (soundArcade) soundArcade.setVolume(0.3);
  if (soundKids) soundKids.setVolume(0.3);
  if (soundRewind) soundRewind.setVolume(0.5);
  
  abyssColor = color(10, 15, 10);
  debrisBackCol = color(42, 52, 38);
  debrisMidCol = color(28, 36, 26);
  debrisFrontCol = color(15, 20, 15);
  bgDebrisColors = [debrisBackCol, debrisMidCol, debrisFrontCol];
  
  // [수정] 화면에 생성되는 오브젝트 개수를 4개에서 7개로 증가
  for (let i = 0; i < 7; i++) {
    let x, y;
    let attempts = 0;
    let overlapping = true;

    while (overlapping && attempts < 20) {
      x = random(width);
      y = random(-400, height);
      overlapping = false;
      for (let other of objects) {
        if (dist(x, y, other.x, other.y) < 350) { 
          overlapping = true;
          break;
        }
      }
      attempts++;
    }
    objects.push(new SinkingObject(x, y));
  }
  
  for (let i = 0; i < 15; i++) {
    backgroundObjects.push(new BackgroundSinkingObject());
  }
  
  for (let i = 0; i < 80; i++) {
    marineSnow.push({
      x: random(width), y: random(height), size: random(1, 3.5),          
      speed: random(0.15, 0.6), wobbleSpeed: random(0.01, 0.04), 
      wobbleAmount: random(0.1, 0.5), wobbleOffset: random(TWO_PI), alpha: random(40, 160)          
    });
  }
  
  for (let i = -2; i <= 52; i++) {
    let x = map(i, 0, 50, 0, width); let nx = map(x, 0, width, 0, TWO_PI);
    let y = 520 - sin(nx) * 120 + random(-10, 10);
    backDebris.push({x: x, y: y, type: floor(random(4)), size: random(35, 55), rot: random(-0.3, 0.3)});
  }
  
  for (let i = -2; i <= 42; i++) {
    let x = map(i, 0, 40, 0, width); let nx = map(x, 0, width, -HALF_PI, PI);
    let y = 620 - sin(nx) * 160 + random(-15, 15);
    midDebris.push({x: x, y: y, type: floor(random(4)), size: random(50, 75), rot: random(-0.2, 0.2)});
  }
  
  for (let i = -2; i <= 32; i++) {
    let x = map(i, 0, 30, 0, width); let nx = map(x, 0, width, 0, PI);
    let y = 720 - sin(nx) * 180 + random(-20, 20);
    frontDebris.push({x: x, y: y, type: floor(random(4)), size: random(70, 110), rot: random(-0.1, 0.1)});
  }
  
  creature = new Creature(width / 2, height / 2);
}

function mousePressed() {
  userStartAudio(); 
  if (bgm && bgm.isLoaded() && !bgm.isPlaying()) {
    bgm.loop();
  }
}

function draw() {
  background(57, 69, 50);
  
  drawDeepSeaLights();
  
  for(let obj of backgroundObjects) {
    obj.update();
    obj.display();
  }
  
  drawMarineSnow();
  
  drawAbyssGradient();
  drawSunkenDebrisPiles();
  
  for (let i = 0; i < objects.length; i++) {
    objects[i].update();
    objects[i].display();
  }
  
  drawSpotlight(creature.segments[0].x, creature.segments[0].y, creature.glowFactor);
  
  creature.update();
  creature.display();
}

function drawSpotlight(cx, cy, glow) {
  push();
  noStroke();
  let innerDarkness = map(glow, 0, 1, 0.1, 0.0);
  let outerDarkness = 0.45; 
  let currentRadius = map(glow, 0, 1, 150, 450); 
  
  let gradient = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, currentRadius);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${innerDarkness})`);
  gradient.addColorStop(0.4, `rgba(0, 0, 0, ${innerDarkness})`); 
  gradient.addColorStop(1, `rgba(0, 0, 0, ${outerDarkness})`); 
  
  drawingContext.fillStyle = gradient;
  rect(0, 0, width, height);
  pop();
}

function drawAbyssGradient() {
  push();
  noStroke();
  let gradient = drawingContext.createLinearGradient(0, 350, 0, 800);
  gradient.addColorStop(0, 'rgba(10, 15, 10, 0)');
  gradient.addColorStop(1, 'rgba(10, 15, 10, 1)');
  drawingContext.fillStyle = gradient;
  rect(0, 350, width, 450);
  pop();
}

function drawSunkenDebrisPiles() {
  drawPile(backDebris, debrisBackCol);
  drawPile(midDebris, debrisMidCol); 
  drawPile(frontDebris, debrisFrontCol);
}

function drawPile(debrisArray, col) {
  push();
  fill(col);
  noStroke();
  beginShape();
  vertex(debrisArray[0].x, height + 50);
  for (let item of debrisArray) { vertex(item.x, item.y); }
  vertex(debrisArray[debrisArray.length - 1].x, height + 50);
  endShape(CLOSE);
  for (let item of debrisArray) { drawSingleDebrisItem(item, col); }
  pop();
}

function drawSingleDebrisItem(item, col) {
  push();
  translate(item.x, item.y); rotate(item.rot); fill(col); noStroke(); rectMode(CENTER);
  if (item.type === 0) { 
    rect(0, 0, item.size, item.size * 0.35, item.size * 0.05); rect(0, -item.size * 0.25, item.size * 0.5, item.size * 0.3, item.size * 0.05); circle(-item.size * 0.28, item.size * 0.16, item.size * 0.2); circle(item.size * 0.28, item.size * 0.16, item.size * 0.2);
  } else if (item.type === 1) { rect(0, 0, item.size * 0.7, item.size * 0.7, item.size * 0.06);
  } else if (item.type === 2) { circle(0, 0, item.size * 0.6);
  } else if (item.type === 3) { triangle(-item.size * 0.5, item.size * 0.3, item.size * 0.5, item.size * 0.3, 0, -item.size * 0.4); }
  pop();
}

function drawMarineSnow() {
  push();
  noStroke();
  for (let p of marineSnow) {
    p.y -= p.speed; p.wobbleOffset += p.wobbleSpeed; p.x += sin(p.wobbleOffset) * p.wobbleAmount;
    if (p.y < -10) { p.y = height + 10; p.x = random(width); }
    if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
    fill(200, 230, 210, p.alpha); circle(p.x, p.y, p.size);
  }
  pop();
}

function drawDeepSeaLights() {
  push();
  noStroke();
  let numRays = 14; let slant = height / tan(radians(60)); 
  for (let i = 0; i < numRays; i++) {
    let timeCoord = frameCount * 0.003; 
    let nPos = noise(timeCoord + i * 50); let nWidth = noise(timeCoord + i * 120 + 500); let nAlpha = noise(timeCoord + i * 80 + 1000);
    let baseScale = map(noise(i * 250 + 2000), 0, 1, 0.3, 2.2);
    let baseX = map(i, 0, numRays - 1, -slant * 0.8, width * 1.1); let startX = baseX + map(nPos, 0, 1, -80, 80);
    let rayWidthTop = map(nWidth, 0, 1, 12, 45) * baseScale; let rayWidthBottom = rayWidthTop * map(nWidth, 0, 1, 1.8, 3.5); 
    let alphaFactor = map(baseScale, 0.3, 2.2, 1.4, 0.5); let maxAlpha = map(nAlpha, 0, 1, 0.02, 0.09) * alphaFactor; 
    let gradient = drawingContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(180, 220, 170, ${maxAlpha})`);       
    gradient.addColorStop(0.4, `rgba(150, 190, 140, ${maxAlpha * 0.4})`); 
    gradient.addColorStop(1, 'rgba(57, 69, 50, 0)');                    
    drawingContext.fillStyle = gradient;
    beginShape(); vertex(startX - rayWidthTop / 2, 0); vertex(startX + rayWidthTop / 2, 0); vertex(startX + slant + rayWidthBottom / 2, height); vertex(startX + slant - rayWidthBottom / 2, height); endShape(CLOSE);
  }
  pop();
}

class BackgroundSinkingObject {
  constructor() { this.reset(); }
  reset() {
    this.x = random(width); this.y = random(-800, -50); this.size = random(8, 20);
    this.speed = random(0.1, 0.3); this.type = floor(random(4)); this.rot = random(TWO_PI);
  }
  update() {
    this.y += this.speed; if (this.y > height + 50) this.reset();
  }
  display() {
    let idx = floor(map(this.y, 0, height, 0, 3, true)); idx = min(idx, 2); let col = bgDebrisColors[idx]; 
    push(); translate(this.x, this.y); rotate(this.rot); fill(col); noStroke(); rectMode(CENTER);
    if(this.type === 0) rect(0, 0, this.size, this.size * 0.5); else if(this.type === 1) circle(0, 0, this.size); else triangle(-this.size/2, this.size/2, this.size/2, this.size/2, 0, -this.size/2);
    pop();
  }
}

class SinkingObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    this.imgIndex = floor(random(objectImgs.length));
    this.img = objectImgs[this.imgIndex]; 
    
    this.speed = random(0.3, 0.8); 
    this.angle = random(TWO_PI);
    this.rotationSpeed = (0.001); 
    
    this.targetWidth = 400; 
    if (this.img && this.img.width > 0) {
      let aspectRatio = this.img.height / this.img.width;
      this.targetHeight = this.targetWidth * aspectRatio; 
    } else {
      this.targetHeight = this.targetWidth; 
    }

    this.glowAlpha = 0; 
    this.interactionParticles = [];

    this.state = 'normal'; 
    this.stateTimer = 0; 
  }
  
  update() {
    this.y += this.speed;
    this.angle += this.rotationSpeed;
    
    if (this.y > height + 150) {
      let newX, newY;
      let attempts = 0;
      let overlapping = true;
      while (overlapping && attempts < 15) {
        newX = random(width);
        newY = random(-250, -100);
        overlapping = false;
        for (let other of objects) {
          if (other !== this && dist(newX, newY, other.x, other.y) < 350) {
            overlapping = true; break;
          }
        }
        attempts++;
      }
      this.x = newX; this.y = newY;
      
      this.imgIndex = floor(random(objectImgs.length));
      this.img = objectImgs[this.imgIndex]; 
      
      this.glowAlpha = 0;
      this.interactionParticles = [];
      this.state = 'normal';
      this.stateTimer = 0;
    }

    let d = dist(this.x, this.y, creature.segments[0].x, creature.segments[0].y);
    let isNear = (d < this.targetWidth / 2 - 10);
    let isCreatureGlowing = (creature.glowFactor > 0.5);

    if (this.state === 'normal' || this.state === 'cooling') {
      if (isNear && isCreatureGlowing) {
        this.state = 'ready';
        
        if (soundCharge && soundCharge.isLoaded()) {
          soundCharge.stop(); 
          soundCharge.setVolume(0.1); 
          soundCharge.play();
        }
      }
    } 
    
    if (this.state === 'ready') {
      if (!isNear || !isCreatureGlowing) {
        this.state = 'cooling';
        
        if (soundCharge && soundCharge.isPlaying()) {
          soundCharge.setVolume(0, 0.5);
          setTimeout(() => {
            if (soundCharge && soundCharge.getVolume() <= 0.01) {
              soundCharge.stop();
            }
          }, 500);
        }
      } else {
        this.glowAlpha += (240 / 180);

        if (this.glowAlpha >= 240) {
          this.state = 'activated';
          this.stateTimer = 0;
          this.glowAlpha = 0; 

          if (soundCharge && soundCharge.isPlaying()) {
            soundCharge.stop();
          }

          if (magicSound && magicSound.isLoaded()) magicSound.play();
          
          // [수정] new4 사운드 중복 재생 버그 픽스 (soundKids 제거)
          if (this.imgIndex === 0 && soundTV) soundTV.play();
          else if (this.imgIndex === 1 && soundRadio) soundRadio.play();
          else if (this.imgIndex === 2 && soundRing) soundRing.play();
          else if (this.imgIndex === 3 && soundArcade) soundArcade.play(); 
          else if (this.imgIndex === 4 && soundKids) soundKids.play();
          else if (this.imgIndex === 5 && soundRewind) soundRewind.play();

          for(let i = 0; i < 40; i++) {
            this.interactionParticles.push({
              x: 0, y: 0,
              vx: random(-8, 8), vy: random(-8, 8),
              life: 255, size: random(4, 9)
            });
          }
        }
      }
    } 
    else if (this.state === 'cooling') {
      this.glowAlpha -= 8;
      
      if (this.glowAlpha <= 0) {
        this.glowAlpha = 0;
        this.state = 'normal'; 
      }
    }
    else if (this.state === 'activated') {
      this.stateTimer++;
      if (this.stateTimer >= 120) {
        this.state = 'fading';
        this.stateTimer = 0;
      }
    } 
    else if (this.state === 'fading') {
      this.stateTimer++;
      if (this.stateTimer >= 120) {
        this.state = 'exhausted'; 
      }
    }

    for (let i = this.interactionParticles.length - 1; i >= 0; i--) {
      let p = this.interactionParticles[i];
      p.x += p.vx; 
      p.y += p.vy; 
      
      p.vx *= 0.95; 
      p.vy *= 0.95; 
      p.life -= 4; 
      
      if (p.life <= 0) this.interactionParticles.splice(i, 1);
    }
  }
  
  display() {
    if (!this.img) return; 
    
    push();
    translate(this.x, this.y);
    
    push();
    rotate(this.angle);
    drawingContext.shadowBlur = 0; 
    
    let darkRatio = map(this.y, 350, 800, 0, 1, true); 
    let tintCol = lerpColor(color(255), abyssColor, darkRatio);
    tint(red(tintCol), green(tintCol), blue(tintCol), 255); 

    let currentBright = 60; 
    let currentSaturate = 40; 

    if (this.state === 'normal' || this.state === 'ready' || this.state === 'cooling') {
      currentBright = 60;
      currentSaturate = 40;
    } 
    else if (this.state === 'activated') {
      currentBright = 100;
      currentSaturate = 100;
    } 
    else if (this.state === 'fading') {
      currentBright = map(this.stateTimer, 0, 120, 100, 20);
      currentSaturate = map(this.stateTimer, 0, 120, 100, 20);
    } 
    else if (this.state === 'exhausted') {
      currentBright = 20;
      currentSaturate = 20;
    }

    drawingContext.filter = `brightness(${currentBright}%) saturate(${currentSaturate}%)`;
    image(this.img, 0, 0, this.targetWidth, this.targetHeight);
    pop(); 

    if (this.glowAlpha > 0) {
      push();
      rotate(this.angle);
      blendMode(ADD); 
      tint(255, 234, 0, this.glowAlpha); 
      image(this.img, 0, 0, this.targetWidth, this.targetHeight);
      pop();
    }
    
    if (this.interactionParticles.length > 0) {
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = color(255, 234, 100);
      noStroke();
      for (let p of this.interactionParticles) {
        fill(255, 234, 100, p.life);
        circle(p.x, p.y, p.size);
      }
    }
    
    pop(); 
  }
}

class Creature {
  constructor(x, y) {
    this.segments = [];
    this.numSegments = 20; 
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push(createVector(x, y));
    }
    this.noiseAngle = random(1000); 
    this.mouseNearNoiseAngle = random(1000); 
    this.heading = 0; 
    this.particles = [];
    this.glowFactor = 0; 
    this.wasMouseActive = false; 
  }
  
  update() {
    let target = createVector(0, 0);
    let isMouseActive = mouseIsPressed; 
    
    if (isMouseActive && !this.wasMouseActive) {
      if (glowSound && glowSound.isLoaded()) {
        glowSound.play();
      }
    }
    this.wasMouseActive = isMouseActive;
    
    if (isMouseActive) {
      this.glowFactor = min(this.glowFactor + 0.05, 1.0);
      this.mouseNearNoiseAngle += 0.1;
      let nearAngle = map(noise(this.mouseNearNoiseAngle), 0, 1, 0, TWO_PI * 2);
      let nearRadius = 30; 

      target.x = mouseX + cos(nearAngle) * nearRadius;
      target.y = mouseY + sin(nearAngle) * nearRadius;
    } else {
      this.glowFactor = max(this.glowFactor - 0.02, 0.0);
      this.noiseAngle += 0.01;
      let angle = map(noise(this.noiseAngle), 0, 1, 0, TWO_PI * 2);
      target.x = this.segments[0].x + cos(angle) * 100;
      target.y = this.segments[0].y + sin(angle) * 100;
      
      if (this.segments[0].x < 50 || this.segments[0].x > width - 50 || 
          this.segments[0].y < 50 || this.segments[0].y > height - 50) {
        let centerAngle = atan2(height/2 - this.segments[0].y, width/2 - this.segments[0].x);
        target.x = this.segments[0].x + cos(centerAngle) * 100;
        target.y = this.segments[0].y + sin(centerAngle) * 100;
      }
    }
    
    let speed = map(this.glowFactor, 0, 1, 3, 6);
    let turnSpeed = map(this.glowFactor, 0, 1, 0.04, 0.12);
    
    let desiredAngle = atan2(target.y - this.segments[0].y, target.x - this.segments[0].x);
    let angleDiff = desiredAngle - this.heading;
    angleDiff = atan2(sin(angleDiff), cos(angleDiff)); 
    
    this.heading += angleDiff * turnSpeed;
    this.segments[0].x += cos(this.heading) * speed;
    this.segments[0].y += sin(this.heading) * speed;
    
    for (let i = 1; i < this.numSegments; i++) {
      let prev = this.segments[i - 1];
      let curr = this.segments[i];
      let angle = atan2(prev.y - curr.y, prev.x - curr.x);
      let dist = 6; 
      
      curr.x = prev.x - cos(angle) * dist;
      curr.y = prev.y - sin(angle) * dist;
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.alpha -= 4; 
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
    
    if (this.glowFactor > 0.5) {
      let tail = this.segments[this.numSegments - 1];
      for (let k = 0; k < 2; k++) {
        this.particles.push({
          x: tail.x + random(-4, 4), y: tail.y + random(-4, 4),
          vx: random(-0.3, 0.3), vy: random(-0.3, 0.3),
          alpha: map(this.glowFactor, 0.5, 1.0, 50, 200), size: random(2, 6)
        });
      }
    }
  }
  
  display() {
    push(); 
    noStroke();
    
    if (this.particles.length > 0) {
      drawingContext.shadowBlur = 8 * this.glowFactor;
      drawingContext.shadowColor = color(255, 215, 0); 
      for (let p of this.particles) {
        fill(255, 234, 0, p.alpha); circle(p.x, p.y, p.size);
      }
    }
    
    let pulseWave = sin(frameCount * 0.08); 
    let dynamicBlurRange = map(pulseWave, -1, 1, 15, 55); 
    drawingContext.shadowBlur = dynamicBlurRange * this.glowFactor; 
    drawingContext.shadowColor = color(255, 234, 0); 
    
    let creatureGrad = drawingContext.createLinearGradient(0, 450, 0, 750);
    let headR = lerp(143, 255, this.glowFactor);
    let headG = lerp(155, 234, this.glowFactor);
    let headB = lerp(61, 0, this.glowFactor);
    let tailR = lerp(10, 255, this.glowFactor);
    let tailG = lerp(15, 180, this.glowFactor);
    let tailB = lerp(10, 0, this.glowFactor);
    
    creatureGrad.addColorStop(0, `rgba(${floor(headR)}, ${floor(headG)}, ${floor(headB)}, 1)`);
    creatureGrad.addColorStop(1, `rgba(${floor(tailR)}, ${floor(tailG)}, ${floor(tailB)}, 1)`);
    drawingContext.fillStyle = creatureGrad;
    
    let finLength = 40;
    let baseSpread = map(this.glowFactor, 0, 1, 0.1, 0.8); 
    let finPulse = sin(frameCount * 0.05) * 0.3 * this.glowFactor; 
    let currentSpread = max(0.05, baseSpread + finPulse);
    let swimCycle = frameCount * map(this.glowFactor, 0, 1, 0.05, 0.2);
    let flapAngle = sin(swimCycle) * 0.25;

    push();
    translate(this.segments[1].x, this.segments[1].y); rotate(this.heading);
    push(); translate(0, -12); rotate(-HALF_PI - 0.8 + flapAngle); arc(0, 0, finLength * 2, finLength * 2, -currentSpread / 2, currentSpread / 2, PIE); pop();
    push(); translate(0, 12); rotate(HALF_PI + 0.8 - flapAngle); arc(0, 0, finLength * 2, finLength * 2, -currentSpread / 2, currentSpread / 2, PIE); pop();
    pop();

    let tailIdx = this.numSegments - 1; let tailSeg = this.segments[tailIdx]; let prevSeg = this.segments[tailIdx - 1]; 
    let tailAngle = atan2(tailSeg.y - prevSeg.y, tailSeg.x - prevSeg.x);
    let tailFinLength = 45; let tailBaseSpread = 0.4; let tailFinPulse = sin(frameCount * 0.05) * 0.1; let tailCurrentSpread = tailBaseSpread + tailFinPulse;
    let tailFlapAngle = sin(frameCount * 0.2) * 0.15;

    push();
    let pushDir = p5.Vector.sub(prevSeg, tailSeg).normalize().mult(15);
    translate(tailSeg.x + pushDir.x, tailSeg.y + pushDir.y); rotate(tailAngle + tailFlapAngle);
    arc(0, 0, tailFinLength * 2, tailFinLength * 2, -tailCurrentSpread / 2, tailCurrentSpread / 2, PIE);
    pop();
    
    circle(this.segments[0].x, this.segments[0].y, 40); 

    let topPoints = []; let bottomPoints = [];
    let headNormal = createVector(cos(this.heading + HALF_PI), sin(this.heading + HALF_PI));
    let headR_size = 20; 
    
    topPoints.push(p5.Vector.add(this.segments[0], p5.Vector.mult(headNormal, headR_size)));
    bottomPoints.push(p5.Vector.sub(this.segments[0], p5.Vector.mult(headNormal, headR_size)));

    for (let i = 1; i < this.numSegments; i++) {
      let curr = this.segments[i]; let t = i / (this.numSegments - 1); let r = headR_size * pow(1 - t, 1.5); if (i === this.numSegments - 1) r = 0; 
      let prev = this.segments[i - 1]; let dir = p5.Vector.sub(prev, curr).normalize(); let normal = createVector(dir.y, -dir.x);
      topPoints.push(p5.Vector.add(curr, p5.Vector.mult(normal, r))); bottomPoints.push(p5.Vector.sub(curr, p5.Vector.mult(normal, r)));
    }

    beginShape();
    for (let i = 0; i < topPoints.length; i++) { if (i === 0) curveVertex(topPoints[i].x, topPoints[i].y); curveVertex(topPoints[i].x, topPoints[i].y); }
    curveVertex(topPoints[topPoints.length-1].x, topPoints[topPoints.length-1].y);
    for (let i = bottomPoints.length - 1; i >= 0; i--) { curveVertex(bottomPoints[i].x, bottomPoints[i].y); if (i === bottomPoints.length - 1) curveVertex(bottomPoints[i].x, bottomPoints[i].y); }
    endShape(CLOSE);
    pop(); 
  }
}