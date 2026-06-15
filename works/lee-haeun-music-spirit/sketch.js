let wisp;

// --- [음악 관련 변수] ---
let bgmList = [];
let currentBgm; 

function preload() {
  soundFormats('mp3');
  // 업로드한 파일 이름에 맞게 수정해 주세요.
  bgmList.push(loadSound('music1.mp3'));
  bgmList.push(loadSound('music2.mp3'));
  bgmList.push(loadSound('music3.mp3'));
}

// --- [커튼 애니메이션 및 디자인 관련 변수] ---
let isCurtainOpening = false; 
let isCurtainClosing = false; 
let curtainTargetOpen = 480;  
let curtainOpenTop = 0;        
let curtainOpenBottom = 0;   
let curtainWidth = 640;   

let leftFolds = [];
let rightFolds = [];
let valanceFolds = []; 

// UI 페이드인 제어
let uiAlpha = -120; 

// --- [파동 효과 및 시퀀스(순서) 제어 변수] ---
let ripples = [];
let uiFullyVisible = false;
let uiFullyVisibleTimer = 0;

let sequence = ['d', 'f', 'j', 'k'];
let currentSeqIndex = 0;
let btns = {};

// --- [파티클 및 장식/엔딩 배열] ---
let noteParticles = [];
let trebleParticles = []; 
let stars = []; 
let hearts = []; 

// --- [엔딩 페이드 효과 변수] ---
let fadeState = 0; // 0: 평상시, 1: 커튼닫히고 2초대기, 2: 페이드아웃, 3: 페이드인
let fadeAlpha = 0; 
let fadeTimer = 0; 

function setup() {
  createCanvas(1280, 720);
  wisp = new MelodicWisp();
  
  wisp.onActionComplete = function() {
    currentSeqIndex++;
    if (currentSeqIndex < sequence.length) {
      let nextKey = sequence[currentSeqIndex];
      btns[nextKey].interactable = true;
    } else {
      wisp.startEndingSequence();
    }
  };
  
  generateFolds();
  initStarsAndUI();
}

function initStarsAndUI() {
  stars = [];
  let startX = 200;  
  let endX = 1080;   
  let areaWidth = endX - startX;
  let interval = areaWidth / 7;
  
  for (let i = 0; i < 7; i++) {
    let x = startX + (i * interval) + (interval / 2) + random(-20, 20);
    let size = random(12, 22); 
    let targetY = random(130, 250); 
    let delay = random(0, 70); 
    stars.push(new StarProp(x, size, targetY, delay));
  }
  
  btns = {
    d: { active: true, interactable: true,  r: 50, alpha: 255, x: 150, label: 'D' },
    f: { active: true, interactable: false, r: 50, alpha: 255, x: 300, label: 'F' },
    j: { active: true, interactable: false, r: 50, alpha: 255, x: width - 300, label: 'J' },
    k: { active: true, interactable: false, r: 50, alpha: 255, x: width - 150, label: 'K' }
  };
}

function resetToBeginning() {
  wisp = new MelodicWisp(); 
  
  wisp.onActionComplete = function() {
    currentSeqIndex++;
    if (currentSeqIndex < sequence.length) {
      let nextKey = sequence[currentSeqIndex];
      btns[nextKey].interactable = true;
    } else {
      wisp.startEndingSequence();
    }
  };

  hearts = [];
  ripples = [];
  noteParticles = [];
  trebleParticles = [];
  
  isCurtainOpening = false; 
  isCurtainClosing = false;
  curtainOpenTop = 0;
  curtainOpenBottom = 0;
  
  uiAlpha = -120;
  uiFullyVisible = false;
  uiFullyVisibleTimer = 0;
  currentSeqIndex = 0;
  
  if (currentBgm) {
    currentBgm.stop();
    currentBgm = null;
  }

  initStarsAndUI();
}

function startEndingRoutine() {
  if (wisp) {
    wisp.startEnding();
  }
}

function draw() {
  // 1. 배경
  let bgGrad = drawingContext.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, color(15, 20, 50).toString());  
  bgGrad.addColorStop(1, color(40, 55, 100).toString()); 
  drawingContext.fillStyle = bgGrad;
  noStroke();
  rect(0, 0, width, height);

  // 2. 커튼 움직임 계산
  if (isCurtainOpening && !isCurtainClosing) {
    curtainOpenTop = lerp(curtainOpenTop, curtainTargetOpen, 0.015); 
    curtainOpenBottom = lerp(curtainOpenBottom, curtainOpenTop, 0.024); 
  } else if (isCurtainClosing) {
    curtainOpenTop = lerp(curtainOpenTop, 0, 0.03); 
    curtainOpenBottom = lerp(curtainOpenBottom, 0, 0.03);
    
    if (curtainOpenTop < 1 && fadeState === 0) {
      fadeState = 1; 
      fadeTimer = frameCount;
    }
  }

  // 3. 업데이트 로직
  wisp.update();
  
  for (let s of stars) s.update();
  
  for (let i = noteParticles.length - 1; i >= 0; i--) {
    noteParticles[i].update();
    if (noteParticles[i].alpha <= 0) noteParticles.splice(i, 1);
  }
  
  for (let i = trebleParticles.length - 1; i >= 0; i--) {
    trebleParticles[i].update();
    if (trebleParticles[i].alpha <= 0) trebleParticles.splice(i, 1);
  }

  // 큰 하트
  for (let i = hearts.length - 1; i >= 0; i--) {
    hearts[i].y -= 0.5; 
    hearts[i].alpha -= 1.5; 
    if (hearts[i].alpha <= 0) hearts.splice(i, 1); 
  }

  // 4. 화면 그리기 (레이어 순서 스위칭)
  for (let s of stars) s.display();

  if (isCurtainClosing) {
    wisp.display();
    for (let p of noteParticles) p.display();
    for (let tp of trebleParticles) tp.display();
    drawHearts();
    drawCurtains();  
    drawValance();   
  } else {
    drawCurtains();  
    drawValance();   
    wisp.display();
    for (let p of noteParticles) p.display();
    for (let tp of trebleParticles) tp.display();
    drawHearts();
  }

  // 5. UI 그리기
  if (!wisp.isIntro) {
    if (uiAlpha < 255) {
      uiAlpha += 40; 
      if (uiAlpha >= 255) {
        uiAlpha = 255;
        uiFullyVisible = true; 
      }
    }
  }
  
  for (let key in btns) {
    let btn = btns[key];
    if (!btn.active && btn.alpha > 0) {
      btn.r += 2.5;     
      btn.alpha -= 8;   
    }
  }

  if (uiAlpha > 0) {
    drawUI(uiAlpha);
  }

  if (uiFullyVisible) {
    uiFullyVisibleTimer++;
    if (uiFullyVisibleTimer % 120 === 0 || uiFullyVisibleTimer % 120 === 10) {
      if (currentSeqIndex < sequence.length) {
        let currentKey = sequence[currentSeqIndex];
        if (btns[currentKey].interactable && btns[currentKey].active) {
          ripples.push({ x: btns[currentKey].x, r: 50, alpha: 180 });
        }
      }
    }
    drawRipples();
  }

  // 6. 엔딩 페이드 효과
  if (fadeState > 0) {
    if (fadeState === 1) {
      if (frameCount - fadeTimer >= 120) {
        fadeState = 2;
      }
    } else if (fadeState === 2) {
      fadeAlpha += 4;
      if (fadeAlpha >= 255) {
        fadeAlpha = 255;
        resetToBeginning(); 
        fadeState = 3; 
      }
    } else if (fadeState === 3) {
      fadeAlpha -= 4;
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeState = 0; 
      }
    }
    
    fill(0, 0, 0, fadeAlpha);
    noStroke();
    rect(0, 0, width, height);
  }
  
  // 7. UI: 일시정지 버튼
  if (currentBgm && currentBgm.isPlaying()) {
    drawPauseButton();
  }
}

function drawPauseButton() {
  let btnColor = color(255, 230, 250);
  let btnX = width - 60; 
  let btnY = 40;
  
  push();
  translate(btnX, btnY);
  noFill();
  stroke(btnColor);
  strokeWeight(4);
  ellipse(0, 0, 50, 50);
  
  fill(btnColor);
  noStroke();
  rect(-8, -10, 6, 20, 2);
  rect(4, -10, 6, 20, 2);
  pop();
}

function drawHearts() {
  for (let h of hearts) {
    fill(255, 105, 180, h.alpha);
    noStroke();
    textSize(80); 
    textAlign(CENTER, CENTER);
    text("❤", h.x, h.y);
  }
}

function mousePressed() {
  if (wisp.isEndingIdle) {
    let d = dist(mouseX, mouseY, wisp.x, wisp.y);
    if (d < 80) { 
      isCurtainOpening = true;
      wisp.triggerHappySpin();
      stars.forEach(s => s.trigger());
    }
  }
  
  if (currentBgm && currentBgm.isPlaying()) {
    let btnX = width - 60;
    let btnY = 40;
    if (dist(mouseX, mouseY, btnX, btnY) < 25) {
      currentBgm.pause(); 
      wisp.startSecondEnding(); 
    }
  }
}

function emitNotes(startX, startY, count) {
  for (let i = 0; i < count; i++) {
    noteParticles.push(new NoteParticle(startX, startY));
  }
}

function keyPressed() {
  let k = key.toLowerCase();

  if (wisp && wisp.sequenceCompleted && !wisp.isEnding) {
    if (k === 'd') wisp.dash();
    if (k === 'k') wisp.spinDash();
    if (k === 'f') wisp.isGrowing = true;
    if (k === 'j') {
      wisp.isJittering = true;
      wisp.isDashing = false; 
      wisp.isSpinDashing = false; 
    }
    return;
  }

  if (!uiFullyVisible) return;
  if (btns[k] && btns[k].interactable && btns[k].active && k === sequence[currentSeqIndex]) {
    btns[k].active = false; 
    if (k === 'd') wisp.dash();
    if (k === 'f') wisp.grow();
    if (k === 'j') wisp.jitter();
    if (k === 'k') wisp.spinDash();
  }
}

function keyReleased() {
  let k = key.toLowerCase();
  if (wisp && wisp.sequenceCompleted) {
    if (k === 'f') wisp.isGrowing = false;
    if (k === 'j') wisp.isJittering = false; 
  }
}

class StarProp {
  constructor(x, size, targetY, delay) {
    this.x = x; this.y = -100; this.size = size; this.targetY = targetY; this.delay = delay;
    this.vy = 0; this.gravity = 0.8; this.bounceCount = 0; this.isTriggered = false; this.state = 'waiting';
  }
  trigger() { this.isTriggered = true; }
  update() {
    if (!this.isTriggered) return;
    if (this.state === 'waiting') {
      if (this.delay > 0) this.delay--; else this.state = 'dropping';
    } else if (this.state === 'dropping') {
      this.vy += this.gravity; this.y += this.vy;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        if (this.bounceCount === 0) { this.vy = -7; this.bounceCount++; } 
        else { this.state = 'resting'; this.vy = 0; }
      }
    }
  }
  display() {
    if (this.y < -this.size) return;
    let brightBorder = color(255, 250, 160); let starBase = color(255, 220, 40);
    push();
    stroke(brightBorder); strokeWeight(6); line(this.x, 0, this.x, this.y);
    stroke(starBase); strokeWeight(3); line(this.x, 0, this.x, this.y);
    translate(this.x, this.y); stroke(brightBorder); strokeWeight(3); strokeJoin(ROUND); fill(starBase);
    this.drawStar(0, 0, this.size * 0.4, this.size, 5); pop();
  }
  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints; let halfAngle = angle / 2.0; beginShape();
    for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
      let sx = x + cos(a) * radius2; let sy = y + sin(a) * radius2; vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1; sy = y + sin(a + halfAngle) * radius1; vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

class TrebleClef {
  constructor(x, y) {
    this.x = x; this.y = y; this.vy = -2.5; this.alpha = 255; this.life = 80; this.fadeRate = 255 / this.life; this.scale = 0.5;
  }
  update() {
    this.y += this.vy; this.vy *= 0.92; this.alpha -= this.fadeRate; this.scale = lerp(this.scale, 1.2, 0.08);
  }
  display() {
    if (this.alpha <= 0) return;
    push(); translate(this.x, this.y); scale(this.scale); textAlign(CENTER, CENTER); textSize(50);
    drawingContext.shadowBlur = 15; drawingContext.shadowColor = color(255, 230, 50, this.alpha);
    fill(255, 235, 80, this.alpha); noStroke(); text('𝄞', 0, 0); pop();
  }
}

class NoteParticle {
  constructor(x, y) {
    this.x = x; this.y = y; let angle = random(TWO_PI); let speed = random(5, 10);
    this.vx = cos(angle) * speed; this.vy = sin(angle) * speed; this.alpha = 255;
    this.life = random(30, 50); this.fadeRate = 255 / this.life; this.type = floor(random(4)); 
    let colors = [color(150, 220, 255), color(255, 170, 200), color(160, 250, 230), color(255, 250, 160)];
    this.c = random(colors); this.rot = random(-0.4, 0.4); this.scale = random(0.8, 1.3);
  }
  update() {
    this.x += this.vx; this.y += this.vy; this.vx *= 0.82; this.vy *= 0.82; this.y -= 1.2; this.alpha -= this.fadeRate;
  }
  display() {
    if (this.alpha <= 0) return;
    push(); translate(this.x, this.y); rotate(this.rot); scale(this.scale);
    let cWithAlpha = color(red(this.c), green(this.c), blue(this.c), this.alpha); fill(cWithAlpha);
    stroke(cWithAlpha); strokeWeight(2.5); strokeJoin(ROUND);
    if (this.type === 0) { noStroke(); ellipse(0, 0, 12, 9); stroke(cWithAlpha); line(5, 0, 5, -22); } 
    else if (this.type === 1) { noStroke(); ellipse(0, 0, 12, 9); stroke(cWithAlpha); line(5, 0, 5, -22); noFill(); bezier(5, -22, 12, -18, 14, -8, 6, -12); } 
    else if (this.type === 2) { noStroke(); ellipse(0, 0, 12, 9); ellipse(16, -3, 12, 9); stroke(cWithAlpha); line(5, 0, 5, -22); line(21, -3, 21, -25); strokeWeight(4); line(5, -22, 21, -25); } 
    else if (this.type === 3) { noFill(); ellipse(0, 0, 11, 8); line(5, 0, 5, -22); noStroke(); fill(cWithAlpha); ellipse(10, 2, 4, 4); }
    pop();
  }
}

function generateFolds() {
  randomSeed(100); let currentX = 0; leftFolds = []; rightFolds = []; valanceFolds = [];
  while (currentX < curtainWidth) { let foldW = random(10, 45); let gap = random(5, 25); if (currentX + foldW > curtainWidth) foldW = curtainWidth - currentX; leftFolds.push({ x: currentX, w: foldW }); currentX += foldW + gap; }
  currentX = 0;
  while (currentX < curtainWidth) { let foldW = random(10, 45); let gap = random(5, 25); if (currentX + foldW > curtainWidth) foldW = curtainWidth - currentX; rightFolds.push({ x: currentX, w: foldW }); currentX += foldW + gap; }
  let currentR = 0.75; 
  while (currentR > 0.25) { let fw = random(8, 18); let gap = random(0.2, 0.3); valanceFolds.push({ r: currentR, weight: fw }); currentR -= gap; }
}

function drawCurtains() {
  let burgundy = color(90, 15, 30); let topDarkBurgundy = color(65, 10, 20); let borderBurgundy = color(145, 38, 57); 
  let curtainBaseGrad = drawingContext.createLinearGradient(0, 0, 0, 300); curtainBaseGrad.addColorStop(0, topDarkBurgundy.toString()); curtainBaseGrad.addColorStop(1, burgundy.toString());
  let foldGrad = drawingContext.createLinearGradient(0, 0, 0, height); foldGrad.addColorStop(0, color(35, 5, 10, 220).toString()); foldGrad.addColorStop(1, color(35, 5, 10, 0).toString());
  let topOff = curtainOpenTop; let botOff = curtainOpenBottom;
  push(); noStroke(); drawingContext.fillStyle = curtainBaseGrad; quad(-topOff, 0, curtainWidth - topOff, 0, curtainWidth - botOff, height, -botOff, height);
  drawingContext.fillStyle = foldGrad; for (let f of leftFolds) quad(f.x - topOff, 0, f.x + f.w - topOff, 0, f.x + f.w - botOff, height, f.x - botOff, height);
  stroke(borderBurgundy); strokeWeight(6); noFill(); quad(-topOff, 0, curtainWidth - topOff, 0, curtainWidth - botOff, height, -botOff, height); pop();
  push(); let rightStartX = width - curtainWidth; noStroke(); drawingContext.fillStyle = curtainBaseGrad; quad(rightStartX + topOff, 0, rightStartX + curtainWidth + topOff, 0, rightStartX + curtainWidth + botOff, height, rightStartX + botOff, height);
  drawingContext.fillStyle = foldGrad; for (let f of rightFolds) quad(rightStartX + f.x + topOff, 0, rightStartX + f.x + f.w + topOff, 0, rightStartX + f.x + f.w + botOff, height, rightStartX + f.x + botOff, height);
  stroke(borderBurgundy); strokeWeight(8); noFill(); quad(rightStartX + topOff, 0, rightStartX + curtainWidth + topOff, 0, rightStartX + curtainWidth + botOff, height, rightStartX + botOff, height); pop();
}

function drawValance() {
  let burgundy = color(90, 15, 30); let topDarkBurgundy = color(55, 8, 15); let borderBurgundy = color(160, 44, 66); let gold = color(210, 180, 90); let shadowColor = color(40, 5, 15, 120); 
  let numScallops = 7; let scW = width / numScallops; let h = 160; let w = scW * 1.35; let wGold = w; let hGold = h;
  let tassels = [];
  for (let i = 1; i < numScallops; i++) { let dropX = i * scW; let aGold = wGold / 2; let dropY = (hGold / 2) * sqrt(1 - pow((scW / 2) / aGold, 2)) + 12; tassels.push({ x: dropX, y: dropY }); }
  let valanceGrad = drawingContext.createLinearGradient(0, 0, 0, 40); valanceGrad.addColorStop(0, topDarkBurgundy.toString()); valanceGrad.addColorStop(1, burgundy.toString());
  stroke(borderBurgundy); strokeWeight(24); fill(borderBurgundy); strokeJoin(ROUND);
  for (let i = 0; i < numScallops; i++) arc(i * scW + scW / 2, 0, w, h, 0, PI);
  for (let t of tassels) ellipse(t.x, t.y, 13, 22);
  function drawScallopLayer(i) {
    push(); let x = i * scW + scW / 2; noStroke(); fill(255); drawingContext.fillStyle = valanceGrad; arc(x, 0, w, h, 0, PI);
    noFill(); stroke(shadowColor); for (let f of valanceFolds) { strokeWeight(f.weight); arc(x, 0, w * f.r, h * f.r, 0, PI); }
    stroke(gold); strokeWeight(6); noFill(); arc(x, 0, wGold, hGold, 0, PI); pop(); 
  }
  for (let i = 1; i < numScallops; i += 2) drawScallopLayer(i); for (let i = 0; i < numScallops; i += 2) drawScallopLayer(i);
  noStroke(); fill(gold); for (let t of tassels) ellipse(t.x, t.y, 14, 24);
}

function drawUI(alpha) {
  let yPos = height - 100; push(); strokeWeight(6); textAlign(CENTER, CENTER); textSize(50); textStyle(BOLD);
  for (let key in btns) {
    let btn = btns[key];
    if (btn.alpha > 0) {
      let currentAlpha = min(alpha, btn.alpha);
      drawKeyButton(btn.x, yPos, btn.r, btn.label, color(160, 20, 60, currentAlpha), color(240, 140, 170, currentAlpha), color(245, 220, 230, currentAlpha));
    }
  }
  pop();
}

function drawKeyButton(x, y, r, label, fCol, sCol, tCol) {
  push(); fill(fCol); stroke(sCol); ellipse(x, y, r * 2, r * 2); noStroke(); fill(tCol); text(label, x, y + 2); pop();
}

function drawRipples() {
  let startY = height - 100; push(); noFill(); strokeWeight(3);
  for (let i = ripples.length - 1; i >= 0; i--) {
    let rip = ripples[i]; stroke(245, 220, 230, rip.alpha); ellipse(rip.x, startY, rip.r * 2, rip.r * 2);
    rip.r += 2.2; rip.alpha -= 10; if (rip.alpha <= 0) ripples.splice(i, 1);
  }
  pop();
}

class MelodicWisp {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.lastX = this.x; 
    this.lastY = this.y;
    this.angle = -HALF_PI; 
    this.r = 62; 
    this.t = HALF_PI; 
    
    this.sequenceCompleted = false;
    this.normalSpeed = 4.5;
    this.friction = 0.92;

    this.introTimer = 0;    
    this.isIntro = true;    
    
    this.isEnding = false;
    this.endPhase = 0;
    this.colorLerp = 0;

    // --- [두 번째 엔딩 변수 추가] ---
    this.isSecondEnding = false;
    this.secondEndPhase = 0;
    this.secondEndTimer = 0;
    this.redAmount = 0;

    this.isDashing = false;
    this.isGrowing = false;
    this.isJittering = false;
    this.isSpinDashing = false;
    this.isReturning = false; 
    
    // --- [K 액션 후 유영을 위한 추가 변수] ---
    this.isRoamingAfterK = false;
    this.roamAfterKTimer = 0;

    this.isWaitingForCenter = false; 
    this.isTurningHead = false;     
    this.isEndingIdle = false;       
    this.pokeTimer = 0;
    
    this.isHappySpinning = false;
    this.isFinalFloating = false;
    this.spinProgress = 0;

    this.actionTimer = 0; 
    this.onActionComplete = null; 

    this.vx = 0;
    this.vy = 0;
    this.currentScale = 1.0;
    this.jitterAmount = 5;
    this.spinAngleRemaining = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    
    this.numSegments = 42; 
    this.segmentLength = 1.6;
    this.tail1X = new Array(this.numSegments);
    this.tail1Y = new Array(this.numSegments);
    this.tail2X = new Array(this.numSegments);
    this.tail2Y = new Array(this.numSegments);
    for (let i = 0; i < this.numSegments; i++) {
      this.tail1X[i] = this.x + 7; this.tail1Y[i] = this.y + i * this.segmentLength;
      this.tail2X[i] = this.x - 7; this.tail2Y[i] = this.y + i * this.segmentLength;
    }
  }

  // --- [두 번째 엔딩 트리거 및 업데이트 로직] ---
  startSecondEnding() {
    this.isSecondEnding = true;
    this.secondEndPhase = 1;
    this.secondEndTimer = 0;
    this.redAmount = 0;
    this.resetStates();
  }

  updateSecondEnding() {
    this.secondEndTimer++;
    let currentGravity = 0; 

    if (this.secondEndPhase === 1) {
      this.vx = 0;
      this.vy = 0;
      currentGravity = 0; 
      if (this.secondEndTimer >= 120) {
        this.secondEndPhase = 2;
      }
    } else if (this.secondEndPhase === 2) {
      let targetX = width / 2;
      let targetY = height / 2;
      let d = dist(this.x, this.y, targetX, targetY);

      if (d > 25) {
        let targetAngle = atan2(targetY - this.y, targetX - this.x);
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        this.angle += constrain(diff * 0.1, -0.15, 0.15); 

        let speed = map(d, 25, 400, 2, 7, true); 
        this.x += cos(this.angle) * speed;
        this.y += sin(this.angle) * speed;
        currentGravity = 0; 
      } else {
        this.x = lerp(this.x, targetX, 0.1);
        this.y = lerp(this.y, targetY, 0.1);
        
        let targetAngle = -HALF_PI;
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        this.angle += diff * 0.1;
        
        currentGravity = map(d, 25, 0, 0, 3, true);

        if (d < 1 && abs(diff) < 0.05) {
          this.angle = -HALF_PI;
          this.x = targetX;
          this.y = targetY;
          this.secondEndPhase = 3;
          this.secondEndTimer = 0;
        }
      }
    } else if (this.secondEndPhase === 3) {
      this.redAmount = min(this.redAmount + 0.05, 1);
      this.isJittering = true;
      this.currentScale = lerp(this.currentScale, 1.15, 0.75);
      currentGravity = 3; 
      
      if (this.secondEndTimer >= 180) {
        this.secondEndPhase = 4;
        this.isJittering = false;
      }
    } else if (this.secondEndPhase === 4) {
      this.currentScale = lerp(this.currentScale, 1.0, 0.1);
      this.x -= 40;
      this.angle = PI; 
      currentGravity = 0; 
      
      if (this.x < -200) { 
        this.secondEndPhase = 5;
        this.secondEndTimer = 0; 
      }
    } else if (this.secondEndPhase === 5) {
      if (this.secondEndTimer >= 180) {
        fadeState = 2; 
        this.secondEndPhase = 6;
      }
    }
    
    this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, currentGravity);
    this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, currentGravity);
  }

  startEndingSequence() {
    this.isWaitingForCenter = true; 
  }

  triggerHappySpin() {
    this.isEndingIdle = false;
    this.isHappySpinning = true;
    this.spinProgress = 0;
    emitNotes(this.x, this.y, 8); 
  }

  startEnding() {
    this.isEnding = true;
    this.endPhase = 1;
    this.vx = 0;
    this.vy = 0;
  }

  updateEnding() {
    if (this.endPhase === 1) {
      let targetX = width / 2;
      let targetY = height / 2;
      let d = dist(this.x, this.y, targetX, targetY);
      let currentGravity = 0;

      if (d > 25) {
        let targetAngle = atan2(targetY - this.y, targetX - this.x);
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        this.angle += constrain(diff * 0.1, -0.15, 0.15); 

        let speed = map(d, 25, 400, 2, 7, true); 
        this.x += cos(this.angle) * speed;
        this.y += sin(this.angle) * speed;
        currentGravity = 0; 
      } else {
        this.x = lerp(this.x, targetX, 0.1);
        this.y = lerp(this.y, targetY, 0.1);
        
        let targetAngle = -HALF_PI;
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        this.angle += diff * 0.1;
        
        currentGravity = map(d, 25, 0, 0, 3, true);

        if (d < 1 && abs(diff) < 0.05) {
          this.angle = -HALF_PI;
          this.x = targetX;
          this.y = targetY;
          this.endPhase = 2;
          this.pokeTimer = 0; 
        }
      }
      
      this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, currentGravity);
      this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, currentGravity);
    } 
    else if (this.endPhase === 2) {
      this.colorLerp += 0.01;
      this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, 3);
      this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, 3);
      
      if (this.colorLerp >= 1) {
        this.colorLerp = 1;
        
        if (hearts.length === 0 && this.pokeTimer === 0) {
          hearts.push({ x: this.x, y: this.y - 60, alpha: 255 });
          this.pokeTimer = 1; 
        }
        
        if (this.pokeTimer === 1 && hearts.length === 0) {
          this.endPhase = 3;
          this.pokeTimer = 0; 
        }
      }
    }
    else if (this.endPhase === 3) {
      this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, 3);
      this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, 3);
      
      this.pokeTimer++;
      if (this.pokeTimer >= 60) {
        isCurtainClosing = true; 
        this.endPhase = 4;
      }
    }
    else if (this.endPhase === 4) {
      this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, 3);
      this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, 3);
    }
  }

  dash() {
    if (!this.sequenceCompleted && (this.isIntro || this.isEndingIdle || this.isWaitingForCenter || this.isTurningHead)) return;
    if (this.sequenceCompleted && this.isJittering) return;

    this.resetStates();
    this.isDashing = true;
    let dashAngle = random(TWO_PI);
    let dashForce = this.sequenceCompleted ? 28 : 35; 
    this.vx = cos(dashAngle) * dashForce;
    this.vy = sin(dashAngle) * dashForce;
    this.angle = dashAngle;
    emitNotes(this.x, this.y, 6); 
  }

  grow() {
    if (!this.sequenceCompleted && (this.isIntro || this.isEndingIdle || this.isWaitingForCenter || this.isTurningHead)) return;
    this.resetStates();
    this.isGrowing = true;
    this.actionTimer = 45; 
    emitNotes(this.x, this.y, 4); 
  }

  jitter() {
    if (!this.sequenceCompleted && (this.isIntro || this.isEndingIdle || this.isWaitingForCenter || this.isTurningHead)) return;
    this.resetStates();
    this.isJittering = true;
    this.actionTimer = 30; 
    emitNotes(this.x, this.y, 4); 
  }

  spinDash() {
    if (!this.sequenceCompleted && (this.isIntro || this.isEndingIdle || this.isWaitingForCenter || this.isTurningHead)) return;
    if (this.sequenceCompleted && this.isJittering) return;

    this.resetStates();
    this.isSpinDashing = true;
    let dashAngle = random(TWO_PI);
    let dashForce = 45;
    this.vx = cos(dashAngle) * dashForce;
    this.vy = sin(dashAngle) * dashForce;
    this.angle = dashAngle;
    this.spinAngleRemaining = TWO_PI * 2; 
    emitNotes(this.x, this.y, 8); 
  }

  resetStates() {
    this.isDashing = false;
    this.isGrowing = false;
    this.isJittering = false;
    this.isSpinDashing = false;
    this.isReturning = false;
    this.isRoamingAfterK = false;
  }

  updateFreeRoamMode() {
    this.t += 0.01;

    if (this.isJittering) {
      this.vx = 0;
      this.vy = 0;
    } else if (this.isDashing || this.isSpinDashing) {
      let currentFriction = this.isSpinDashing ? 0.88 : this.friction;
      this.vx *= currentFriction;
      this.vy *= currentFriction;

      if (this.isSpinDashing && this.spinAngleRemaining > 0) {
        let rotStep = 0.5;
        rotStep = min(rotStep, this.spinAngleRemaining);
        this.angle += rotStep;
        this.spinAngleRemaining -= rotStep;
        
        for (let i = 0; i < this.numSegments; i++) {
          let dx1 = this.tail1X[i] - this.x; let dy1 = this.tail1Y[i] - this.y;
          let angle1 = atan2(dy1, dx1) + rotStep; 
          let dist1 = sqrt(dx1 * dx1 + dy1 * dy1) + 2.5; 
          this.tail1X[i] = this.x + cos(angle1) * dist1;
          this.tail1Y[i] = this.y + sin(angle1) * dist1;

          let dx2 = this.tail2X[i] - this.x; let dy2 = this.tail2Y[i] - this.y;
          let angle2 = atan2(dy2, dx2) + rotStep;
          let dist2 = sqrt(dx2 * dx2 + dy2 * dy2) + 2.5;
          this.tail2X[i] = this.x + cos(angle2) * dist2;
          this.tail2Y[i] = this.y + sin(angle2) * dist2;
        }
      }
      
      let currentSpeed = sqrt(this.vx * this.vx + this.vy * this.vy);
      let spinFinished = !this.isSpinDashing || this.spinAngleRemaining <= 0;
      
      if (currentSpeed <= this.normalSpeed && spinFinished) {
        this.isDashing = false;
        this.isSpinDashing = false;
        this.vx = cos(this.angle) * this.normalSpeed;
        this.vy = sin(this.angle) * this.normalSpeed;
      } else if (currentSpeed > 0.1 && !this.isSpinDashing) {
        this.angle = atan2(this.vy, this.vx);
      }

      this.x += this.vx;
      this.y += this.vy;
      this.handleWallBounce();
    } else {
      let margin = 200; 
      let centerX = width / 2;
      let centerY = height / 2;

      if (this.x < margin || this.x > width - margin || this.y < margin || this.y > height - margin) {
        let targetAngle = atan2(centerY - this.y, centerX - this.x);
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;

        let turnStep = constrain(diff, -0.06, 0.06);
        this.angle += turnStep;
      } else {
        let noiseTurn = map(noise(this.t), 0, 1, -0.04, 0.04);
        this.angle += noiseTurn;
      }

      this.vx = cos(this.angle) * this.normalSpeed;
      this.vy = sin(this.angle) * this.normalSpeed;
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  update() {
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.isSecondEnding) {
      this.updateSecondEnding();
      return; 
    }

    if (this.isEnding) {
      this.updateEnding();
      return; 
    }

    if (this.sequenceCompleted) {
      this.updateFreeRoamMode();
    } else {
      if (this.isIntro) {
        this.introTimer++;
        this.x = width / 2;
        this.y = height / 2 + sin(this.introTimer * 0.1) * 3; 
        this.angle = -HALF_PI; 
        this.updateTail(this.tail2X, this.tail2Y, -7);
        
        if (this.introTimer <= 120) {
          let offset = 7;
          this.tail1X[0] = this.x + cos(this.angle + HALF_PI) * offset;
          this.tail1Y[0] = this.y + sin(this.angle + HALF_PI) * offset;
          let baseAngle = this.angle + PI; 
          for (let i = 1; i < this.numSegments; i++) {
            let curl = map(i, 0, this.numSegments, 0, -PI * 0.7); 
            let waveAmount = map(i, 0, this.numSegments, 0, 1.2); 
            let wave = sin(this.introTimer * (TWO_PI / 40) - i * 0.1) * waveAmount;
            let segAngle = baseAngle + curl + wave; 
            this.tail1X[i] = this.tail1X[i - 1] + cos(segAngle) * this.segmentLength;
            this.tail1Y[i] = this.tail1Y[i - 1] + sin(segAngle) * this.segmentLength;
          }
        } else {
          this.isIntro = false;
        }
      } 
      else if (this.isDashing) {
        this.vx *= 0.90; this.vy *= 0.90; this.x += this.vx; this.y += this.vy;
        this.handleWallBounce();
        if (sqrt(this.vx * this.vx + this.vy * this.vy) < 1.5) { 
          this.isDashing = false; 
          this.isReturning = true; 
        }
      }
      else if (this.isSpinDashing) {
        this.vx *= 0.88; this.vy *= 0.88;
        if (this.spinAngleRemaining > 0) {
          let rotStep = min(0.5, this.spinAngleRemaining);
          this.angle += rotStep; this.spinAngleRemaining -= rotStep;
          for (let i = 0; i < this.numSegments; i++) {
            let dx1 = this.tail1X[i] - this.x; let dy1 = this.tail1Y[i] - this.y;
            let angle1 = atan2(dy1, dx1) + rotStep; let dist1 = sqrt(dx1 * dx1 + dy1 * dy1) + 2.5; 
            this.tail1X[i] = this.x + cos(angle1) * dist1; this.tail1Y[i] = this.y + sin(angle1) * dist1;
            let dx2 = this.tail2X[i] - this.x; let dy2 = this.tail2Y[i] - this.y;
            let angle2 = atan2(dy2, dx2) + rotStep; let dist2 = sqrt(dx2 * dx2 + dy2 * dy2) + 2.5;
            this.tail2X[i] = this.x + cos(angle2) * dist2; this.tail2Y[i] = this.y + sin(angle2) * dist2;
          }
        }
        this.x += this.vx; this.y += this.vy; this.handleWallBounce();
        if (sqrt(this.vx * this.vx + this.vy * this.vy) < 1.5 && this.spinAngleRemaining <= 0) {
          this.isSpinDashing = false; 
          // --- [K 액션 후 2초 유영 트리거] ---
          if (currentSeqIndex >= sequence.length - 1) { 
            this.isRoamingAfterK = true;
            this.roamAfterKTimer = 0;
          } else {
            this.isReturning = true;
          }
        }
      }
      // --- [K 액션 전용: 2초간 유영] ---
      else if (this.isRoamingAfterK) {
        this.roamAfterKTimer++;
        this.t += 0.018; 
        
        let targetX = width / 2 + (380 * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
        let targetY = height / 2 + (360 * sin(this.t) * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
        let targetAngle = atan2(targetY - this.y, targetX - this.x);
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
        this.angle += diff * 0.1; // 부드럽게 궤도 방향 응시
        
        let d = dist(this.x, this.y, targetX, targetY);
        let speed = min(6, d * 0.1); 
        this.x += cos(this.angle) * speed;
        this.y += sin(this.angle) * speed;

        if (this.roamAfterKTimer >= 120) {
          this.isRoamingAfterK = false;
          this.isReturning = true; // 2초 후 가운데로 복귀 모드 진입
        }
      }
      // --- [D 액션 및 K 유영 완료 후: 궤도/중앙 복귀] ---
      else if (this.isReturning) {
        let targetX, targetY;
        
        if (currentSeqIndex >= sequence.length - 1) {
          targetX = width / 2;
          targetY = height / 2;
        } else {
          targetX = width / 2 + (380 * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
          targetY = height / 2 + (360 * sin(this.t) * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
        }
        
        let d = dist(this.x, this.y, targetX, targetY);
        let targetAngle = atan2(targetY - this.y, targetX - this.x);
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
        
        // 거리에 따라 회전력을 극대화하여 빙빙 도는 오류(Orbiting) 완전 차단
        let turnSpeed = map(d, 0, 200, 0.3, 0.1, true); 
        this.angle += constrain(diff * turnSpeed, -PI/2, PI/2); 
        
        if (d < 5) { // 부드러운 정지 판정
          this.x = targetX; 
          this.y = targetY; 
          this.isReturning = false; 
          if (this.onActionComplete) this.onActionComplete(); 
        } else {
          // 거리에 비례하여 감속 (오버슈팅 방지)
          let speed = min(7, d * 0.15 + 1); 
          this.x += cos(this.angle) * speed;
          this.y += sin(this.angle) * speed;
        }
      }
      else if (this.isWaitingForCenter) {
        let targetX = width / 2;
        let targetY = height / 2;
        let d = dist(this.x, this.y, targetX, targetY);
        
        if (d > 5) {
          let targetAngle = atan2(targetY - this.y, targetX - this.x);
          let diff = targetAngle - this.angle;
          while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
          
          let turnSpeed = map(d, 0, 200, 0.3, 0.1, true);
          this.angle += constrain(diff * turnSpeed, -PI/2, PI/2); 
          
          let speed = map(d, 5, 400, 2, 7, true);
          this.x += cos(this.angle) * speed; 
          this.y += sin(this.angle) * speed;
        } else {
          this.x = targetX; 
          this.y = targetY;
          this.isWaitingForCenter = false; 
          this.isTurningHead = true; 
          this.pokeTimer = 0; 
        }
      }
      else if (this.isTurningHead) {
        this.pokeTimer++;
        this.x = lerp(this.x, width / 2, 0.05); this.y = lerp(this.y, height / 2 + sin(this.pokeTimer * 0.05) * 3, 0.05);
        let targetAngle = -HALF_PI; let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
        this.angle += diff * 0.08;
        if (abs(diff) < 0.05 && this.pokeTimer > 30) {
          this.angle = -HALF_PI; this.isTurningHead = false; this.isEndingIdle = true; this.pokeTimer = 0; 
        }
      }
      else if (this.isEndingIdle) {
        this.pokeTimer++; let cycle = this.pokeTimer % 120; let pokePulse = 0;
        if (cycle >= 60 && cycle < 68) pokePulse = sin(map(cycle, 60, 68, 0, PI));
        else if (cycle >= 74 && cycle < 82) pokePulse = sin(map(cycle, 74, 82, 0, PI));
        this.x = width / 2; this.y = height / 2 + sin(this.pokeTimer * 0.05) * 3; this.angle = -HALF_PI;
        for (let i = 1; i < this.numSegments; i++) this.tail2Y[i] += 2.5; 
        this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, 0);
        
        let tempX = new Array(this.numSegments); let tempY = new Array(this.numSegments);
        tempX[0] = this.x + cos(this.angle + HALF_PI) * (7 * this.currentScale);
        tempY[0] = this.y + sin(this.angle + HALF_PI) * (7 * this.currentScale);
        for (let i = 1; i < this.numSegments; i++) {
          let dx = this.tail1X[i] - tempX[i - 1]; let dy = (this.tail1Y[i] + 2.5) - tempY[i - 1]; 
          let d = sqrt(dx * dx + dy * dy);
          if (d > 0) { tempX[i] = tempX[i - 1] + (dx / d) * this.segmentLength; tempY[i] = tempY[i - 1] + (dy / d) * this.segmentLength; }
        }

        let baseCurl = PI * 1; let blend = constrain(this.pokeTimer / 45.0, 0, 1); blend = blend * blend * (3 - 2 * blend); 
        let baseAngle = this.angle + PI;
        this.tail1X[0] = tempX[0]; this.tail1Y[0] = tempY[0];
        
        for (let i = 1; i < this.numSegments; i++) {
          let curlFactor = (i / this.numSegments); let segAngle = baseAngle - (baseCurl * pow(curlFactor, 1.2));
          if (curlFactor > 0.5) { let tipFactor = map(curlFactor, 0.5, 1.0, 0, 1); segAngle -= pokePulse * 0.99 * tipFactor; }
          segAngle += sin(this.pokeTimer * 0.05 - i * 0.1) * 0.08;
          let fkX = this.tail1X[i - 1] + cos(segAngle) * this.segmentLength; let fkY = this.tail1Y[i - 1] + sin(segAngle) * this.segmentLength;
          this.tail1X[i] = lerp(tempX[i], fkX, blend); this.tail1Y[i] = lerp(tempY[i], fkY, blend);
          let dx = this.tail1X[i] - this.tail1X[i - 1]; let dy = this.tail1Y[i] - this.tail1Y[i - 1]; let d = sqrt(dx * dx + dy * dy);
          if (d > 0) { this.tail1X[i] = this.tail1X[i - 1] + (dx / d) * this.segmentLength; this.tail1Y[i] = this.tail1Y[i - 1] + (dy / d) * this.segmentLength; }
        }
        if (cycle === 60 || cycle === 74) trebleParticles.push(new TrebleClef(this.x, this.y - 65));
      } 
      else if (this.isHappySpinning) {
        this.spinProgress += 0.008; let p = constrain(this.spinProgress, 0, 1);
        let ease = 1 - pow(1 - p, 3); let currentAngle = -HALF_PI + (ease * 3 * PI); let r = sin(ease * PI) * 240; 
        let nextX = width / 2 + cos(currentAngle) * r; let nextY = height / 2 + sin(currentAngle) * r;
        let dx = nextX - this.x; let dy = nextY - this.y;
        if (dist(this.x, this.y, nextX, nextY) > 0.5) {
          let targetAngle = atan2(dy, dx); let diff = targetAngle - this.angle;
          while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
          this.angle += constrain(diff * 0.25, -PI/4, PI/4); 
        }
        this.x = nextX; this.y = nextY;
        if (this.spinProgress >= 0.95) {
          this.isHappySpinning = false; this.isFinalFloating = true; this.pokeTimer = 0; 
        }
      } 
      else if (this.isFinalFloating) {
        this.pokeTimer++;
        this.x = lerp(this.x, width / 2, 0.05);
        this.y = lerp(this.y, height / 2 + sin(this.pokeTimer * 0.08) * 14, 0.05);

        let targetAngle = -HALF_PI; 
        let diff = targetAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        this.angle += diff * 0.05; 
        
        if (this.pokeTimer > 60) {
          this.isFinalFloating = false;
          this.sequenceCompleted = true; 
          
          if (bgmList.length > 0) {
            currentBgm = random(bgmList);
            currentBgm.play(); 
            currentBgm.onended(startEndingRoutine); 
          }

          this.vx = cos(this.angle) * this.normalSpeed;
          this.vy = sin(this.angle) * this.normalSpeed;
        }
      }
      else {
        this.t += 0.018; 
        let nextX = width / 2 + (380 * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
        let nextY = height / 2 + (360 * sin(this.t) * cos(this.t)) / (1 + sin(this.t) * sin(this.t));
        let targetAngle = atan2(nextY - this.y, nextX - this.x);
        if (dist(this.x, this.y, nextX, nextY) > 0.1) {
          let diff = targetAngle - this.angle;
          while (diff < -PI) diff += TWO_PI; while (diff > PI) diff -= TWO_PI;
          this.angle += constrain(diff * 0.15, -TWO_PI, TWO_PI); 
        }
        this.x = nextX; this.y = nextY;
      }
    }

    if (this.isGrowing) {
      if (!this.sequenceCompleted) {
        if (keyIsDown(70) || keyIsDown(102)) { 
          this.actionTimer = max(this.actionTimer, 5);
          if (frameCount % 60 === 0) emitNotes(this.x, this.y, random(1, 3));
        }
        this.actionTimer--;
        if (this.actionTimer <= 0) {
          this.isGrowing = false;
          if (this.onActionComplete) this.onActionComplete(); 
        }
      } else {
        if (frameCount % 60 === 0) emitNotes(this.x, this.y, random(1, 3));
      }
      this.currentScale = lerp(this.currentScale, 1.6, 0.6);
    } 
    else if (this.isJittering) {
      if (!this.sequenceCompleted) {
        if (keyIsDown(74) || keyIsDown(106)) { 
          this.actionTimer = max(this.actionTimer, 5);
          if (frameCount % 60 === 0) emitNotes(this.x, this.y, random(1, 3));
        }
        this.actionTimer--;
        if (this.actionTimer <= 0) {
          this.isJittering = false;
          if (this.onActionComplete) this.onActionComplete(); 
        }
      } else {
        if (frameCount % 60 === 0) emitNotes(this.x, this.y, random(1, 3));
      }
      this.currentScale = lerp(this.currentScale, 1.15, 0.75);
    } 
    else {
      this.currentScale = lerp(this.currentScale, 1.0, 0.05); 
    }

    let currentSpeed = dist(this.x, this.y, this.lastX, this.lastY);
    let gravityDrop = map(currentSpeed, 0, 8, 2.5, 0, true);

    if (this.isJittering || (this.sequenceCompleted && (this.isDashing || this.isSpinDashing))) {
        gravityDrop = 0;
    }
    if  (this.isHappySpinning) {
        gravityDrop = 1;
    } else if (this.isFinalFloating) {
        gravityDrop = 2.5;
    }

    if (!this.isEndingIdle) {
      this.updateTail(this.tail1X, this.tail1Y, 7 * this.currentScale, gravityDrop);
      this.updateTail(this.tail2X, this.tail2Y, -7 * this.currentScale, gravityDrop);
    } 
  }

  handleWallBounce() {
    // --- [시작 파트 safeMargin 0 처리] ---
    // 전체 시퀀스가 완료되기 전(D,F,J,K 상호작용 단계)에는 여백을 0으로 둡니다.
    let safeMargin = this.sequenceCompleted ? ((this.r) * this.currentScale + 20) : 0;
    
    let bounced = false;
    if (this.x < safeMargin) { this.x = safeMargin; this.vx *= -1; bounced = true; }
    else if (this.x > width - safeMargin) { this.x = width - safeMargin; this.vx *= -1; bounced = true; }
    
    if (this.y < safeMargin) { this.y = safeMargin; this.vy *= -1; bounced = true; }
    else if (this.y > height - safeMargin) { this.y = height - safeMargin; this.vy *= -1; bounced = true; }
    
    if (bounced && !this.isSpinDashing) this.angle = atan2(this.vy, this.vx);
  }

  updateTail(tx, ty, offset, gravity = 0) {
    tx[0] = this.x + cos(this.angle + HALF_PI) * offset;
    ty[0] = this.y + sin(this.angle + HALF_PI) * offset;
    for (let i = 1; i < this.numSegments; i++) {
      ty[i] += gravity; 
      let dx = tx[i] - tx[i - 1];
      let dy = ty[i] - ty[i - 1];
      let d = sqrt(dx * dx + dy * dy);
      if (d > 0) {
        tx[i] = tx[i - 1] + (dx / d) * this.segmentLength;
        ty[i] = ty[i - 1] + (dy / d) * this.segmentLength;
      }
    }
  }

  display() {
    this.shakeX = this.isJittering ? (random() > 0.5 ? this.jitterAmount : -this.jitterAmount) : 0;
    this.shakeY = this.isJittering ? (random() > 0.5 ? this.jitterAmount : -this.jitterAmount) : 0;
    
    let pinkColor = color(255, 105, 180);
    let borderColor = color(255, 230, 250);
    let headColor = lerpColor(color(130, 90, 180), pinkColor, this.colorLerp); 
    let tailColor = lerpColor(color(220, 200, 240), pinkColor, this.colorLerp); 
    
    if (this.isSecondEnding && this.redAmount > 0) {
      let pureRed = color(255, 0, 0);
      borderColor = lerpColor(borderColor, pureRed, this.redAmount);
      headColor = lerpColor(headColor, pureRed, this.redAmount);
      tailColor = lerpColor(tailColor, pureRed, this.redAmount);
    }
    
    let borderThickness = 11; 
    stroke(borderColor); strokeWeight(borderThickness); fill(borderColor);
    this.drawCreatureShape(borderColor, borderColor, true); 
    noStroke(); this.drawCreatureShape(headColor, tailColor, false);    
  }

  drawCreatureShape(colorStart, colorEnd, isBorderPass) {
    for (let i = this.numSegments - 1; i >= 0; i--) {
      let size = lerp(45, 1.0, i / (this.numSegments - 1)) * this.currentScale;
      if (!isBorderPass) { fill(lerpColor(colorStart, colorEnd, i / (this.numSegments - 1))); }
      ellipse(this.tail1X[i], this.tail1Y[i], size); ellipse(this.tail2X[i], this.tail2Y[i], size);
    }
    push(); translate(this.x + this.shakeX, this.y + this.shakeY); scale(this.currentScale); rotate(this.angle);
    let darkPurple = lerpColor(color(70, 30, 125), color(200, 50, 150), this.colorLerp); 
    let headGrad, earGrad;
    if (!isBorderPass) {
      headGrad = drawingContext.createLinearGradient(this.r * 0.5, 0, -this.r * 0.5, 0); headGrad.addColorStop(0, darkPurple.toString()); headGrad.addColorStop(1, colorStart.toString());
      earGrad = drawingContext.createLinearGradient(0, -40, 0, 0); earGrad.addColorStop(0, darkPurple.toString()); earGrad.addColorStop(1, colorStart.toString());
    }
    push(); translate(this.r * 0.2, -this.r * 0.15); rotate(HALF_PI); 
    if (!isBorderPass) { fill(255); drawingContext.fillStyle = earGrad; } else { fill(colorStart); }
    this.drawRoundedEar(); pop();
    push(); translate(this.r * 0.2, this.r * 0.15); rotate(HALF_PI);
    if (!isBorderPass) { fill(255); drawingContext.fillStyle = earGrad; } else { fill(colorStart); }
    this.drawRoundedEar(); pop();
    if (!isBorderPass) { fill(255); drawingContext.fillStyle = headGrad; } else { fill(colorStart); }
    ellipse(0, 0, this.r, this.r);
    if (!isBorderPass) {
      fill(255); push(); translate(-this.r * 0.46, 0); rotate(HALF_PI);
      triangle(0, 0, -7, -4, -7, 4); triangle(0, 0, 7, -4, 7, 4); ellipse(0, 0, 3, 3); pop();
    }
    pop();
  }

  drawRoundedEar() {
    let h = 36; let w = 16; beginShape(); vertex(0, 0); bezierVertex(-w, -h, w, -h, 0, 0); endShape(CLOSE);
  }
}