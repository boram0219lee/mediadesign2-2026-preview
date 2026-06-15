let yoonseuls = [];
const NUM = 80; 

let state = "WAIT";
let stateTimer = 0;
let spawnFadeAlpha = 0; 

let targetX, targetY;
let rectSize = 100; 
let bgParticles = [];
let deadParticles = []; 

// [사운드 채널 변수 선언]
let sndAmbientWater; 
let sndFirework;     
let sndFailBubble;   

const pastelPalette = [
  [255, 0, 120],    // 쨍한 비비드 핫 핑크
  [0, 255, 160],     // 고광도 형광 에메랄드 청록
  [255, 200, 0],     // 딥 골든 옐로우
  [120, 30, 255],    // 진한 일렉트릭 바이올렛
  [0, 180, 255]      // 포카리 블루 원색 채도
];

let currentTargetColorIdx;
let bgBuffer; 
let duckBuffer; 

// [지정해주신 파일명 기반 사전 로드]
function preload() {
  sndAmbientWater = loadSound('water.mp3');   
  sndFirework = loadSound('success.mp3');     
  sndFailBubble = loadSound('fail.mp3');      
}

function setup(){
  let canvas = createCanvas(1280, 720);
  canvas.style('display', 'block'); canvas.style('margin', 'auto');
  canvas.style('position', 'absolute'); canvas.style('top', '0'); canvas.style('bottom', '0');
  canvas.style('left', '0'); canvas.style('right', '0');
  canvas.style('box-shadow', '0 25px 60px rgba(0,20,50,0.35)');
  
  select('body').style('background-color', '#07101e');
  select('body').style('overflow', 'hidden');
  colorMode(RGB, 255, 255, 255, 255);
  
  // [오디오 엔진 가동 및 마스터 볼륨 강제 증폭 파트]
  userStartAudio(); 
  outputVolume(2.5); 

  if (sndAmbientWater) {
    sndAmbientWater.setVolume(1.0); 
    sndAmbientWater.loop();         
  }

  createNewWaterCausticBackground();
  
  duckBuffer = createGraphics(800, 800);
  bakePerfectOriginalDuck(); 
  
  initYoonseuls();

  for(let i = 0; i < 180; i++){
    bgParticles.push({ 
      x: random(0, width), 
      y: random(0, height), 
      s: random(2.0, 6.0), 
      a: random(30, 70),
      speed: random(0.2, 0.6) 
    });
  }
}

function initYoonseuls() {
  yoonseuls = [];
  for(let i = 0; i < NUM; i++) yoonseuls.push(new Yoonseul(i)); 
  pickNewTarget();
  spawnFadeAlpha = 0; 
}

function createNewWaterCausticBackground() {
  bgBuffer = createGraphics(1280, 720);
  for (let y = 0; y < 720; y++) {
    let inter = map(y, 0, 720, 0, 1.0);
    let c = inter < 0.45 
      ? lerpColor(color(10, 60, 160), color(30, 180, 210), map(inter, 0, 0.45, 0, 1.0)) 
      : lerpColor(color(30, 180, 210), color(140, 245, 220), map(inter, 0.45, 1.0, 0, 1.0));
    bgBuffer.stroke(c); bgBuffer.line(0, y, 1280, y);
  }
  bgBuffer.noFill(); randomSeed(12345); 
  for(let i = 0; i < 28; i++) {
    let baseH = map(i, 0, 28, 10, 710); 
    bgBuffer.stroke(255, 255, 255, random(15, 35)); bgBuffer.strokeWeight(random(1.0, 2.2));
    bgBuffer.beginShape(); bgBuffer.vertex(-50, baseH + random(-30, 30));
    bgBuffer.bezierVertex(320, baseH + random(-70, 70), 640, baseH + random(-70, 70), 960, baseH + random(-70, 70));
    bgBuffer.vertex(1330, baseH + random(-30, 30)); bgBuffer.endShape();
  }
}

function draw(){
  image(bgBuffer, 0, 0); 
  drawBackgroundDust();

  if(state === "WAIT") spawnFadeAlpha = lerp(spawnFadeAlpha, 255, 0.045);

  let mX = mouseX, mY = mouseY;
  let d = dist(mX, mY, targetX, targetY);

  for(let y of yoonseuls){ y.update(d, mX, mY); y.display(mX, mY); }
  updateDeadParticles();

  if(state === "WAIT") {
    drawTargetHint();
  }
  
  drawUserFrame(d, mX, mY);

  if(state !== "WAIT"){
    stateTimer++;
    if(stateTimer > 120) nextRound(); 
  }
}

function drawBackgroundDust(){
  push(); noStroke();
  for(let p of bgParticles){ 
    p.y -= p.speed;
    p.x += sin(frameCount * 0.01 + p.a) * 0.1;
    if(p.y < -10) { p.y = height + 10; p.x = random(0, width); }
    fill(240, 250, 255, p.a * 0.35); 
    circle(p.x, p.y, p.s); 
  }
  pop();
}

function updateDeadParticles() {
  push(); noStroke();
  for(let i = deadParticles.length - 1; i >= 0; i--) {
    let p = deadParticles[i];
    p.x += p.vx; p.y += p.vy; 
    p.vx *= 0.975; p.vy *= 0.975; 
    p.alpha -= 1.6; 
    fill(242, 252, 255, p.alpha * 0.52); 
    circle(p.x, p.y, p.size);
    if(p.alpha <= 0) deadParticles.splice(i, 1);
  }
  pop();
}

function pickNewTarget(){
  targetX = random(width * 0.25, width * 0.75);
  targetY = random(height * 0.25, height * 0.75);
  currentTargetColorIdx = floor(random(pastelPalette.length));
}

function targetInBox() {
  let mX = mouseX, mY = mouseY;
  return mX >= targetX - rectSize*0.5 && mX <= targetX + rectSize*0.5 && mY >= targetY - rectSize*0.5 && mY <= targetY + rectSize*0.5;
}

function drawTargetHint(){
  if (targetInBox()) {
    push(); blendMode(BLEND); imageMode(CENTER);
    image(duckBuffer, targetX, targetY, 86, 86); 
    pop();
  }
}

function bakePerfectOriginalDuck() {
  duckBuffer.push(); duckBuffer.clear(); 
  duckBuffer.translate(duckBuffer.width / 2, duckBuffer.height / 2);
  duckBuffer.blendMode(ADD); duckBuffer.noStroke();

  let baseRadius = 240;
  for (let i = 0; i < 5; i++) {
    if (i < 3) duckBuffer.fill(255, 245, 140, 55); 
    else duckBuffer.fill(255, 255, 255, 15); 
    
    duckBuffer.push();
    let scaleFactor = map(i, 0, 5, 1.5, 0.4); duckBuffer.scale(scaleFactor);
    duckBuffer.push(); noFill(); stroke(35, 45, 60, 110); strokeWeight(0.85);
    duckBuffer.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let n = noise(cos(a) * 0.5 + 1, sin(a) * 0.5 + i * 0.02) * 35;
      duckBuffer.vertex(cos(a) * (baseRadius + n), sin(a) * (baseRadius + n));
    }
    duckBuffer.endShape(CLOSE); duckBuffer.pop();

    duckBuffer.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let n = noise(cos(a) * 0.5 + 1, sin(a) * 0.5 + i * 0.02) * 35;
      duckBuffer.vertex(cos(a) * (baseRadius + n), sin(a) * (baseRadius + n));
    }
    duckBuffer.endShape(CLOSE); duckBuffer.pop();
  }

  duckBuffer.push(); duckBuffer.translate(-160, 130); 
  let beakBlobRadius = 125; 
  for (let i = 0; i < 5; i++) {
    if (i < 3) duckBuffer.fill(255, 120, 60, 55); 
    else duckBuffer.fill(255, 255, 255, 12); 
    
    duckBuffer.push();
    let scaleFactor = map(i, 0, 5, 1.3, 0.2); duckBuffer.scale(scaleFactor);
    duckBuffer.push(); noFill(); stroke(50, 40, 50, 100); strokeWeight(0.85);
    duckBuffer.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let n = noise(cos(a) * 0.6 + 5, sin(a) * 0.6 + i * 0.03) * 20;
      duckBuffer.vertex(cos(a) * (beakBlobRadius + n), sin(a) * (beakBlobRadius + n));
    }
    duckBuffer.endShape(CLOSE); duckBuffer.pop();

    duckBuffer.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let n = noise(cos(a) * 0.6 + 5, sin(a) * 0.6 + i * 0.03) * 20;
      let x = cos(a) * (beakBlobRadius + n);
      let y = sin(a) * (beakBlobRadius + n);
      duckBuffer.vertex(x, y);
    }
    duckBuffer.endShape(CLOSE); duckBuffer.pop();
  }
  for (let i = 0; i < 15; i++) { duckBuffer.fill(255, 140, 30, 12); duckBuffer.ellipse(0, 0, 40 - i * 2, 40 - i * 2); }
  duckBuffer.pop(); duckBuffer.pop(); duckBuffer.blendMode(BLEND); 
}

function drawUserFrame(d, mX, mY){
  if(state !== "WAIT") return; 
  push(); translate(mX, mY); noFill();
  let isDet = (d < 45); 
  if (isDet) { translate(random(-0.4, 0.4), random(-0.4, 0.4)); stroke(255, 95, 150, 240); } 
  else { stroke(255, 255, 255, 150); }
  
  strokeWeight(2.7); circle(0, 0, 92);
  stroke(isDet ? color(255, 95, 150, 90) : color(255, 255, 255, 70));
  strokeWeight(1.35); circle(0, 0, 80); circle(0, 0, 30); 
  strokeWeight(3.5); point(0, -46); point(0, 46); point(-46, 0); point(46, 0);
  pop();
}

function mousePressed(){
  if(state !== "WAIT") return; 
  
  if(targetInBox()){
    state = "SUCCESS";
    
    if(sndAmbientWater && sndAmbientWater.isPlaying()) sndAmbientWater.setVolume(0.04, 0.15); 
    if(sndFirework) { sndFirework.setVolume(0.55); sndFirework.play(); } 
    
    for(let y of yoonseuls) y.triggerSuccess(mouseX, mouseY); 
  } else {
    state = "FAIL";
    
    if(sndAmbientWater && sndAmbientWater.isPlaying()) sndAmbientWater.setVolume(0.04, 0.15);
    if(sndFailBubble) { sndFailBubble.setVolume(0.5); sndFailBubble.play(); }
    
    for(let y of yoonseuls) y.triggerFailWithDelay(mouseX, mouseY); 
  }
}

function nextRound(){
  state = "WAIT"; stateTimer = 0;
  for(let y of yoonseuls) y.calmDown(); 
  pickNewTarget(); spawnFadeAlpha = 0; 
  
  if(sndAmbientWater && sndAmbientWater.isPlaying()) {
    sndAmbientWater.setVolume(1.0, 0.25); 
  }
}

class Yoonseul{
  constructor(id){
    this.id = id; this.pos = createVector(random(50, width - 50), random(50, height - 50));
    this.vel = createVector(0, 0); this.acc = createVector(0, 0);
    this.burstVel = createVector(0, 0); this.history = []; 
    this.size = random(0.7, 2.1); this.baseSize = random(16, 34) * this.size;
    this.seed = random(1000); this.pulseOffset = random(TWO_PI);
    this.type = floor(random(2)); this.excited = 0; this.mode = "WAIT"; 
    this.successTimer = 0; this.delayFrames = 0; this.failTimer = 0; this.failDelay = 0;
    this.clickOrigin = createVector(0, 0);

    let pType = random(1);
    this.personality = pType < 0.3 ? "EAGER" : (pType < 0.7 ? "LAZY" : "CLUMSY");
    this.followSpeed = this.personality === "EAGER" ? random(0.65, 0.88) : (this.personality === "LAZY" ? random(0.35, 0.55) : random(0.45, 0.68));
    this.maxSpeed = this.personality === "EAGER" ? random(6.5, 8.8) : (this.personality === "LAZY" ? random(4.0, 5.8) : random(4.8, 6.8));
    this.dragCoeff = this.personality === "EAGER" ? random(0.80, 0.85) : (this.personality === "LAZY" ? random(0.82, 0.88) : random(0.78, 0.84));
    this.maxForce = random(0.45, 0.75); this.personalSpace = random([42, 60, 80]);
    
    this.burstTier = floor(map(this.seed, 0, 1000, 0, 24)) % 8; 
  }

  calmDown(){
    this.mode = "WAIT"; this.excited = 0; this.successTimer = 0; this.delayFrames = 0;
    this.failTimer = 0; this.failDelay = 0; this.vel.set(0, 0); this.acc.set(0, 0);
    this.burstVel.set(0, 0); this.history = []; 
  }

  update(d, mX, mY){
    let mouseVec = createVector(mX, mY);
    
    if(this.mode === "WAIT"){
      this.excited = d < 300 ? lerp(this.excited, map(d, 300, 0, 0, 1.0), this.personality === "EAGER" ? 0.15 : 0.08) : lerp(this.excited, 0, 0.06);

      let desired = p5.Vector.sub(mouseVec, this.pos);
      let distToTarget = desired.mag(); desired.normalize();
      
      // 🚨 [속도 수치 완화]: 오리 가까이 갔을 때(d < 300) 급격히 빨라지던 가속 상한선을 일반 속도 수준으로 부드럽게 감축
      let spd = map(this.excited, 0, 1, this.maxSpeed * 0.7, this.maxSpeed * 0.95); 
      desired.mult((distToTarget < 100 && d >= 300) ? map(distToTarget, 0, 100, 0, spd) : spd);

      let steer = p5.Vector.sub(desired, this.vel); steer.limit(this.maxForce * (this.excited * 0.4 + 1.0)); this.acc.add(steer.mult(this.followSpeed));
      
      // 🚨 [떨림 수치 완화]: 오리 근처에서 노이즈 방향 외력이 심하게 진동하던 계수를 기존 1.5배 증폭에서 0.5배 수준으로 칼다운하여 잔떨림 박멸
      let noiseAngle = noise(frameCount * (0.005 + this.excited * 0.005) + this.seed) * TWO_PI * 0.5; 
      this.acc.add(createVector(cos(noiseAngle), sin(noiseAngle)).mult(0.06 * (1.0 + this.excited * 0.4)));

      let mDist = dist(this.pos.x, this.pos.y, mX, mY);
      if (mDist < 55 && mDist > 0) {
        let pf = p5.Vector.sub(this.pos, mouseVec).normalize().mult(map(mDist, 0, 55, 3.0, 0.5));
        this.acc.add(pf); this.vel.lerp(pf, 0.3);
      }
      this.acc.add(this.maintainPersonalSpace(this.personalSpace)); 
      this.vel.add(this.acc); this.vel.mult(this.dragCoeff); this.pos.add(this.vel); this.acc.set(0, 0);
    }
    
    if(this.mode === "SUCCESS"){
      this.successTimer++; 
      let lt = this.successTimer - this.delayFrames;
      
      if (lt > 0) {
        let sideWayX = -this.vel.y * 0.12 * sin(frameCount * 0.05 + this.seed);
        let sideWayY = this.vel.x * 0.12 * sin(frameCount * 0.05 + this.seed);
        this.pos.x += sideWayX; this.pos.y += sideWayY;
        
        let desiredVel = p5.Vector.sub(mouseVec, this.pos).normalize().mult(this.maxSpeed * 0.55);
        this.vel.lerp(desiredVel, 0.035);
        this.pos.add(this.vel);
        this.pos.add(this.burstVel); 
        this.burstVel.mult(0.94); 
        
        let sep = this.maintainPersonalSpace(this.personalSpace * 1.5); 
        this.pos.add(sep.mult(1.2)); 
      }
    }
    
    this.pos.x = constrain(this.pos.x, 20, width - 20); this.pos.y = constrain(this.pos.y, 20, height - 20);
    if(this.mode === "FAIL_DELAY" && ++this.failTimer >= this.failDelay) this.triggerActualFailParticles(); 
  }

  maintainPersonalSpace(lim) {
    let steer = createVector(0, 0); let c = 0;
    for (let o of yoonseuls) {
      if (o !== this) {
        let d = dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y);
        if (d > 0 && d < lim) { steer.add(p5.Vector.sub(this.pos, o.pos).normalize().div(d)); c++; }
      }
    }
    return c > 0 ? steer.div(c).normalize().mult(1.2) : steer;
  }

  triggerFailWithDelay(cX, cY) {
    this.mode = "FAIL_DELAY"; this.failTimer = 0; this.clickOrigin.set(cX, cY);
    let clickDist = dist(this.pos.x, this.pos.y, cX, cY);
    this.failDelay = floor(map(clickDist, 0, 1400, 0, 42)); 
  }

  triggerActualFailParticles() {
    this.mode = "FAIL"; 
    let bubCount = floor(random(14, 24)); 
    for(let i = 0; i < bubCount; i++) {
      let bSz = random(3.0, 12.0); let randAngle = random(TWO_PI); let randForce = random(0.8, 3.2); 
      deadParticles.push({ 
        x: this.pos.x + random(-4, 4), y: this.pos.y + random(-4, 4), size: bSz, 
        vx: cos(randAngle) * randForce, vy: sin(randAngle) * randForce, alpha: random(190, 245) 
      });
    }
  }

  triggerSuccess(cX, cY) {
    this.mode = "SUCCESS"; this.successTimer = 0; this.history = [];
    this.delayFrames = this.burstTier * 6; 
    
    let escapeVec = p5.Vector.sub(this.pos, createVector(cX, cY)).normalize();
    if(escapeVec.mag() === 0) escapeVec = p5.Vector.random2D(); 
    this.burstVel = escapeVec.mult(random(3.0, 6.5)); 
  }

  display(mX, mY){
    if(this.mode === "FAIL" || (this.mode === "SUCCESS" && this.id >= 72)) return; 
    if ((state === "WAIT" || this.mode === "FAIL_DELAY") && dist(this.pos.x, this.pos.y, mX, mY) < 50) return; 

    let lt = this.successTimer - this.delayFrames;
    push(); translate(this.pos.x, this.pos.y);
    
    if (this.vel.mag() > 0.1) {
      // 🚨 [회전 수치 제어 보정]: 타겟 접근 시 가속도가 붙어 각도가 홱홱 뒤집히던 현상을 방지하기 위해 
      // heading() 벡터의 민감도를 부드럽게 제어하여 지나친 고개 꺾임 현상 안정화
      let smoothHeading = this.vel.heading();
      rotate(smoothHeading); 
      
      let str = map(this.vel.mag(), 0, 15, 1.0, 1.06); scale(str, 1.0 / (str * 0.99));
    }

    let pulseAngle = frameCount * map(this.excited, 0, 1, 0.015, 0.02) + this.pulseOffset;
    let basePulse = sin(pulseAngle) * map(this.excited, 0, 1, 0.15, 0.22);
    
    if (this.mode === "SUCCESS" && lt > 0) {
      let selfExplosionScale = 0;
      if (lt <= 5) {
        selfExplosionScale = map(lt, 0, 5, 0, -0.97); 
      } else if (lt <= 9) {
        selfExplosionScale = map(lt, 5, 9, -0.97, 2.2); 
      } else if (lt <= 85) {
        selfExplosionScale = 2.2 * exp(-(lt - 9) * 0.052); 
      } else {
        selfExplosionScale = 0;
      }
      scale(max(0.01, 1 + basePulse + selfExplosionScale));
      
      blendMode(ADD);
      let c = pastelPalette[floor((this.seed * 7) % pastelPalette.length)];
      
      let transitionRatio = constrain(map(lt, 0, 16, 0, 1.0), 0, 1.0);
      let finalR = lerp(245, c[0], transitionRatio);
      let finalG = lerp(252, c[1], transitionRatio);
      let finalB = lerp(255, c[2], transitionRatio);
      let finalA = lt < 9 ? 255 : map(lt, 9, 85, 255, 0); 
      
      this.drawPurityShape(1.0, finalR, finalG, finalB, finalA, true);
      blendMode(BLEND);
    } else {
      scale(1 + basePulse);
      blendMode(ADD);
      let finalA = ((75 + this.excited * 110) * (spawnFadeAlpha / 255.0)); let r = noise(this.seed * 5) * 3;
      if(r < 1.0) this.drawPurityShape(1.0, 255, 255, 255, finalA * 0.9, false); 
      else if(r < 2.0) this.drawPurityShape(1.0, 140, 245, 255, finalA * 0.95, false); 
      else this.drawPurityShape(1.0, 245, 200, 255, finalA * 0.9, false); 
      blendMode(BLEND);
    }
    
    pop();
  }

  drawPurityShape(sf, r, g, b, a, fC) {
    if (this.type === 0) {
      let maxR = this.baseSize * sf * 0.72;
      for(let i = 3; i > 0; i--){
        fill(r, g, b, (this.mode === "SUCCESS") ? (a * (i / 3) * 0.45) : ((15 + (3 - i) * 20) * (a / 85.0)));
        let curR = maxR * (i / 3), nAmp = fC ? 0 : map(this.excited, 0, 1, 0.05, 0.14); 
        beginShape();
        for(let aPos = 0; aPos < TWO_PI; aPos += 0.35) { 
          let n = fC ? 0 : sin(aPos * 2 + frameCount * (0.01 + this.excited * 0.04) + this.seed) * (curR * nAmp); 
          vertex(cos(aPos) * (curR + n), sin(aPos) * (curR + n));
        }
        endShape(CLOSE);
      }
    } else {
      let wMult = fC ? 1.0 : map(sin(frameCount * map(this.excited, 0, 1, 0.02, 0.05) + this.seed), -1, 1, 0.94, 1.06); 
      for(let j = 3; j > 0; j--) {
        fill(r, g, b, (this.mode === "SUCCESS") ? (a * (j / 3) * 0.45) : ((12 + (3 - j) * 22) * (a / 85.0)));
        let sMult = (j / 3) * sf; push();
        for(let i = 0; i < 4; i++){ rotate(HALF_PI); ellipse(this.baseSize * 0.4 * sMult, 0, this.baseSize * 1.35 * sMult * wMult, this.baseSize * 0.75 * sMult * (2.0 - wMult)); }
        pop();
      }
    }
  }
}

function windowResized() { resizeCanvas(1280, 720); }