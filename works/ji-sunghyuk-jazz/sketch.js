// [시스템/게임 상태 변수]
let gameState = "INTRO"; 
let introAlpha = 255;    
let introFadeSpeed = 8;  
let introYOffset = 0;   

// [UI 안내선 투명도 변수]
let uiArrowAlpha = 180;
let uiKey1Alpha = 180;
let uiKey2Alpha = 180; 

// [오디오 변수]
let waltzSound; 
let amplitude;  

// [오브젝트 및 잔상 변수]
let trail = [];
let prevOrbX = 0;
let prevOrbY = 0;
let orbX = 0;
let orbY = 0;

// [키보드 조작을 위한 물리 변수]
let orbVx = 0; 
let orbVy = 0; 
let moveSpeed = 0.8;  
let friction = 0.92;  

// [배경 물결 변수]
let flowLayers = [];
let currentLayer = 11; 
let targetLayer = 11;  

// 1번 키 이펙트: 미니 오브젝트 배열
let minis = [];
let miniGravity = 0.28; 

// 2번 키 이펙트: 최상위 파동 잔상 배열
let topLevelRipples = [];

// 착지 임팩트 파티클 변수
let impactParticles = [];
let hasLanded = false;
let isDescending = false;

// 실시간 안정한 색상 제어를 위한 유동적 색상 변수
let c_bg = 10;          
let c_stroke = 230;     
let c_coreR = 180;      let c_coreG = 60;       let c_coreB = 60;       
let c_coreFillR = 130;  let c_coreFillG = 40;   let c_coreFillB = 40;   
let comboStartTime = 0; 

// 새로운 크리처 내부 기관 변수
let visceralBlobs = []; 

function preload() {
  waltzSound = loadSound('Waltz.2.mp3');
}

function setup() {
  createCanvas(1280, 720);
  pixelDensity(1); // 고해상도 픽셀 폭발 방지
  
  orbX = width * 0.5;
  orbY = -150; 
  prevOrbX = orbX;
  prevOrbY = orbY;

  amplitude = new p5.Amplitude();
  waltzSound.setVolume(0.5);

  for (let i = 0; i < 8; i++) {
    flowLayers.push({
      x: random(width), y: random(height),
      strength: random(0.6, 1.4), phase: random(TWO_PI),
      speed: random(0.002, 0.008), seed: random(1000)
    });
  }
  
  for (let i = 0; i < 7; i++) {
    visceralBlobs.push({
      angleSeed: random(1000), radSeed: random(1000),        
      size: random(3.0, 7.0), speed: random(0.003, 0.007)   
    });
  }
}

function draw() {
  // 1+2번 동시 입력 시간에 따른 색상 반전 제어
  if (gameState === "PLAY" && keyIsDown(49) && keyIsDown(50)) {
    if (comboStartTime === 0) comboStartTime = millis(); 
    if (millis() - comboStartTime > 2000) { 
      c_bg = 245;
      c_stroke = 15;
      c_coreR = 75;   c_coreG = 195; c_coreB = 195;
      c_coreFillR = 125; c_coreFillG = 215; c_coreFillB = 215;
    }
  } else {
    comboStartTime = 0; 
    c_bg = (gameState === "INTRO") ? 5 : 10;
    c_stroke = 230;
    c_coreR = 180;   c_coreG = 60;  c_coreB = 60;
    c_coreFillR = 130; c_coreFillG = 40;  c_coreFillB = 40;
  }

  background(c_bg);

  // 오디오 분석
  let level = amplitude.getLevel(); 
  let musicScale = map(level, 0, 0.4, 1.0, 1.8, true); 

  // 하강 등장 시네마틱 물리 연산
  if (gameState === "PLAY" && isDescending) {
    let targetY = height * 0.5;
    orbY += (targetY - orbY) * 0.12; 
    
    if (abs(orbY - targetY) < 2.0) {
      orbY = targetY;
      hasLanded = true;
      isDescending = false; 
      
      // 착지 파티클 생성
      for (let i = 0; i < 40; i++) {
        let angle = random(TWO_PI);
        let speed = random(3, 10);
        impactParticles.push({
          x: orbX, y: orbY,
          vx: cos(angle) * speed, vy: sin(angle) * speed,
          size: random(2, 6), alpha: 255
        });
      }
    }
  }

  // 일반 방향키 조작
  if (gameState === "PLAY" && !isDescending) {
    let keyPressedThisFrame = false;
    if (keyIsDown(LEFT_ARROW))  { orbVx -= moveSpeed; keyPressedThisFrame = true; }
    if (keyIsDown(RIGHT_ARROW)) { orbVx += moveSpeed; keyPressedThisFrame = true; }
    if (keyIsDown(UP_ARROW))    { orbVy -= moveSpeed; keyPressedThisFrame = true; }
    if (keyIsDown(DOWN_ARROW))  { orbVy += moveSpeed; keyPressedThisFrame = true; }

    if (keyPressedThisFrame) uiArrowAlpha = max(0, uiArrowAlpha - 5);

    orbVx *= friction; orbVy *= friction; orbX += orbVx; orbY += orbVy;
    orbX = constrain(orbX, 50, width - 50); orbY = constrain(orbY, 50, height - 50);
  }
  
  let moveDist = dist(orbX, orbY, prevOrbX, prevOrbY);
  if (moveDist > 4.0) { targetLayer = map(moveDist, 4, 20, 14, 22, true); } 
  else { if (frameCount % 60 === 0) { targetLayer = random(6, 11); } }
  currentLayer += (targetLayer - currentLayer) * 0.08;

  // 1번 키 '길게 누르기'
  if (gameState === "PLAY" && keyIsDown(49)) {
    uiKey1Alpha = max(0, uiKey1Alpha - 10);
    if (random() < 0.38) {
      minis.push({
        x: random(80, width - 80), y: height + 60,              
        vx: random(-2.0, 2.0), vy: random(-22, -15), seed: random(1000)
      });
    }
  }
  
  // 2번 키 입력 처리
  if (gameState === "PLAY" && keyIsDown(50)) {
    uiKey2Alpha = max(0, uiKey2Alpha - 10);
    if (frameCount % 6 === 0) {
      let headRadius = 70 * musicScale;
      topLevelRipples.push({
        x: orbX, y: orbY, baseRadius: headRadius, currentScale: 1.0,
        timeOffset: frameCount * 0.025, alpha: 150
      });
    }
  }

  // 1번 미니 오브젝트 메모리 정리
  for (let i = minis.length - 1; i >= 0; i--) {
    let m = minis[i]; 
    m.vy += miniGravity; m.x += m.vx; m.y += m.vy;
    if (m.y > height + 100 && m.vy > 0) { 
      minis.splice(i, 1); 
    }
  }

  // 레이어별 렌더링
  let intLayer = floor(currentLayer);
  for (let levelIdx = 0; levelIdx < intLayer; levelIdx++) { 
    drawFlowingShape(levelIdx, 1.0); 
  }
  
  drawMiniObjects(musicScale);
  if (gameState === "PLAY") {
    drawFluidCreature_FinalAesthetics(moveDist, musicScale);
  }
  
  for (let levelIdx = intLayer; levelIdx < 22; levelIdx++) { 
    drawFlowingShape(levelIdx, 1.0); 
  }

  // 2번 최상위 파동 잔상 메모리 정리
  for (let i = topLevelRipples.length - 1; i >= 0; i--) {
    let rip = topLevelRipples[i]; 
    rip.currentScale += 0.045; 
    rip.alpha -= 2.5;          
    
    if (rip.alpha <= 0) { 
      topLevelRipples.splice(i, 1); 
    } else {
      noFill();
      stroke(c_stroke, rip.alpha); 
      strokeWeight(1.5);
      drawDeformedCircle(rip.x, rip.y, rip.baseRadius * rip.currentScale * 1.8, rip.timeOffset, 0.25, 1.0);
    }
  }

  // 착지 화이트 파티클 메모리 정리
  for (let i = impactParticles.length - 1; i >= 0; i--) {
    let p = impactParticles[i]; 
    p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.alpha -= 4;
    
    if (p.alpha <= 0) { 
      impactParticles.splice(i, 1); 
    } else {
      noStroke();
      fill(255 - c_bg, p.alpha); 
      circle(p.x, p.y, p.size);
    }
  }

  // UI 그리기
  if (gameState === "PLAY") { drawControlGuides(); }

  // 인트로 화면
  if (introAlpha > 0) {
    drawIntroScreen();
    if (gameState === "PLAY") {
      introAlpha = max(0, introAlpha - introFadeSpeed);
      introYOffset -= 4; 
    }
  }

  prevOrbX = orbX; prevOrbY = orbY;
}

// 해수면 면(Shape)을 그리는 함수
function drawFlowingShape(level, waveIntensity) {
  strokeWeight(1.1);
  let alphaVal = map(level, 0, 21, 15, 160);
  stroke(c_stroke, c_stroke, c_stroke, alphaVal);
  fill(c_bg); 
  beginShape();
  for (let x = -100; x < width + 100; x += 15) {
    let offsetY = 0;
    for (let f of flowLayers) {
      let dx = x - f.x;
      let influence = exp(-abs(dx) * 0.002);
      let pulse = sin(frameCount * f.speed + f.phase) * 18;
      let flow = noise(x * 0.003 + f.seed, level * 0.08, frameCount * 0.002);
      flow = map(flow, 0, 1, -80, 80);
      offsetY += (flow + pulse) * influence * f.strength * waveIntensity;
    }
    let y = height * 0.35; y += offsetY; y += (level - 7) * 32; y += sin(x * 0.01 + frameCount * 0.004) * 18;
    vertex(x, y);
  }
  vertex(width + 100, height + 150); vertex(-100, height + 150);
  endShape(CLOSE);
}

// 세포질 크리처 렌더링 함수
function drawFluidCreature_FinalAesthetics(moveDist, musicScale) {
  trail.push({ x: orbX, y: orbY, scale: musicScale });
  if (trail.length > 40) { trail.shift(); }

  let activeInertiaX = orbVx * 2.8 * (moveSpeed * 1.5); 
  let activeInertiaY = orbVy * 2.8 * (moveSpeed * 1.5);

  // 1. 몸통(흐름) 그리기
  for (let i = 0; i < trail.length; i++) {
    let t = trail[i];
    let baseRadius = map(i, 0, trail.length - 1, 45, 65) * t.scale; 
    stroke(c_stroke, map(i, 0, trail.length - 1, 10, 200));
    strokeWeight(1.2);
    fill(c_bg);
    drawDeformedCircle(t.x, t.y, baseRadius, i * 0.06 + frameCount * 0.015, 0.08, 1.0);
  }

  // 2. 메인 머리 파트
  let headRadius = 70 * musicScale;

  // 2-1. 외곽 두 줄 동심원
  noFill(); 
  stroke(c_stroke, 45); strokeWeight(1.8);
  drawDeformedCircle(orbX, orbY, headRadius * 1.4, frameCount * 0.02, 0.22, 1.0); 
  stroke(c_stroke, 140); strokeWeight(2.3);
  drawDeformedCircle(orbX, orbY, headRadius * 1.2, frameCount * 0.02, 0.18, 1.0); 

  // 2-2. 메인 머리 본체 원형 표면
  stroke(c_stroke); strokeWeight(2); fill(c_bg);
  drawDeformedCircle(orbX, orbY, headRadius, frameCount * 0.025, 0.25, 1.0);

  // 3. 내부 세포질 파동
  push();
  translate(orbX + activeInertiaX, orbY + activeInertiaY); 
  noFill(); strokeWeight(1.5); 
  for (let k = 0; k < 3; k++) {
    stroke(c_stroke, map(k, 0, 2, 80, 30)); 
    drawDeformedCircle(0, 0, headRadius * (0.8 - k * 0.15), frameCount * 0.02 + k * 10, 0.28 * musicScale, 1.0);
  }
  pop();

  // 3-2. 내부를 유영하는 유체 파편들
  push();
  translate(orbX + activeInertiaX, orbY + activeInertiaY); 
  noFill(); strokeWeight(1.2); 
  for (let b of visceralBlobs) {
    let angleOff = noise(b.angleSeed + frameCount * b.speed);
    let radOff = noise(b.radSeed + frameCount * (b.speed * 1.2));
    let blobAngle = map(angleOff, 0, 1, 0, TWO_PI);
    let blobRad = map(radOff, 0, 1, headRadius * 0.45, headRadius * 0.85);
    let blobR = b.size * musicScale; 
    stroke(c_stroke, map(blobRad, headRadius * 0.45, headRadius * 0.85, 30, 80)); 
    drawDeformedCircle(blobRad * cos(blobAngle), blobRad * sin(blobAngle), blobR, frameCount * 0.04 + b.angleSeed, 0.2, 1.0);
  }
  pop();

  // 4. 중심부 유동적 눈동자 핵
  let blinkCycle = frameCount % 342; 
  let yBlinkScale = 1.0; 
  if (blinkCycle > 320) {
    let blinkProgress = map(blinkCycle, 320, 342, 0, PI);
    yBlinkScale = map(sin(blinkProgress), 0, 1, 1.0, 0.02); 
  }

  push();
  translate(orbX + activeInertiaX * 1.1, orbY + activeInertiaY * 1.1); 
  let coreRadius = 16.8 * musicScale; 
  stroke(c_coreR, c_coreG, c_coreB, 200); strokeWeight(1.8); 
  fill(c_coreFillR, c_coreFillG, c_coreFillB, 230);    
  drawDeformedCircle(0, 0, coreRadius, frameCount * 0.04, 0.15, yBlinkScale);
  pop();
}

// 인트로 화면 렌더링 함수
function drawIntroScreen() {
  push();
  textAlign(CENTER, CENTER); textFont('Helvetica'); fill(255, introAlpha); noStroke(); textSize(36);
  text("Shostakovich / Waltz.2", width / 2, height / 2 - 80 + introYOffset);
  stroke(255, introAlpha); strokeWeight(2); fill(10, introAlpha);
  let btnX = width / 2; let btnY = height / 2 + 50 + introYOffset; let btnR = 70;
  circle(btnX, btnY, btnR); noStroke(); fill(140, 45, 45, introAlpha);
  let triSize = 16;
  triangle(btnX - triSize * 0.6, btnY - triSize, btnX - triSize * 0.6, btnY + triSize, btnX + triSize, btnY);
  pop();
}

// 수면 아래 조작 안내 UI 함수
function drawControlGuides() {
  push();
  rectMode(CENTER); textAlign(CENTER, CENTER); textSize(14); strokeWeight(1.2);
  let startX = 100; let uiY = height - 80; let spacing = 45;

  // 1번 키 가이드
  if (uiKey1Alpha > 0) {
    stroke(c_stroke, uiKey1Alpha); fill(c_bg, uiKey1Alpha); 
    drawDeformedCircle(startX, uiY, 18, frameCount * 0.01, 0.07, 1.0);
    fill(c_coreR, c_coreG, c_coreB, uiKey1Alpha); noStroke(); text("1", startX, uiY - 1);
  }
  // 2번 키 가이드
  if (uiKey2Alpha > 0) {
    stroke(c_stroke, uiKey2Alpha); fill(c_bg, uiKey2Alpha); 
    drawDeformedCircle(startX + spacing, uiY, 18, frameCount * 0.01, 0.07, 1.0);
    fill(c_coreR, c_coreG, c_coreB, uiKey2Alpha); noStroke(); text("2", startX + spacing, uiY - 1);
  }

  // 방향키 가이드
  if (uiArrowAlpha > 0) {
    let ax = width - 130; let ay = height - 80; let aSpacing = 38;
    stroke(c_stroke, uiArrowAlpha); fill(c_bg, uiArrowAlpha);
    drawDeformedCircle(ax, ay - aSpacing, 18, frameCount * 0.01, 0.07, 1.0);
    drawDeformedCircle(ax, ay, 18, frameCount * 0.01, 0.07, 1.0);
    drawDeformedCircle(ax - aSpacing, ay, 18, frameCount * 0.01, 0.07, 1.0);
    drawDeformedCircle(ax + aSpacing, ay, 18, frameCount * 0.01, 0.07, 1.0);
    fill(c_coreR, c_coreG, c_coreB, uiArrowAlpha); noStroke();
    text("▲", ax, ay - aSpacing - 1); text("▼", ax, ay - 1); text("◀", ax - aSpacing, ay - 1); text("▶", ax + aSpacing, ay - 1);
  }
  pop();
}

// 마우스 클릭 시스템
function mousePressed() {
  if (getAudioContext().state !== 'running') { getAudioContext().resume(); }
  if (gameState === "INTRO") {
    let btnX = width / 2; let btnY = height / 2 + 50; let d = dist(mouseX, mouseY, btnX, btnY);
    if (d < 35) { 
      gameState = "PLAY"; isDescending = true; 
      if (!waltzSound.isPlaying()) { waltzSound.loop(); }
    }
  }
}

// 미니 오브젝트 렌더링 함수
function drawMiniObjects(musicScale) {
  let miniBaseRadius = 17.5 * musicScale;
  for (let m of minis) {
    stroke(c_stroke, 180); strokeWeight(1.5); fill(c_bg);
    drawDeformedCircle(m.x, m.y, miniBaseRadius, frameCount * 0.03 + m.seed, 0.22, 1.0);
    let miniCoreRadius = 3.5 * musicScale;
    stroke(c_coreR, c_coreG, c_coreB, 160); strokeWeight(1); fill(c_coreFillR, c_coreFillG, c_coreFillB, 200);
    drawDeformedCircle(m.x, m.y, miniCoreRadius, frameCount * 0.05 + m.seed, 0.15, 1.0);
  }
}

// 원의 표면을 곡선 노이즈로 만드는 함수 (정수형 루프로 무한 루프 완벽 차단)
function drawDeformedCircle(cx, cy, radius, timeOffset, deformation, yScale) {
  beginShape();
  let steps = 16; // 안전한 정수 개수 지정
  let angles = [];
  
  // ◀ [무한루프 완벽 수정] 소수점 각도 더하기 대신, 정수 루프를 돌려 오차로 인한 무한 가둠을 100% 원천 차단합니다.
  for (let i = 0; i < steps; i++) {
    let a = (i / steps) * TWO_PI;
    angles.push(a);
  }
  
  let extendedAngles = [angles[angles.length-1], ...angles, angles[0], angles[1]];
  for (let a of extendedAngles) {
    let xoff = map(cos(a), -1, 1, 0, 1.8); 
    let yoff = map(sin(a), -1, 1, 0, 1.8);
    let offset = noise(xoff + timeOffset, yoff + timeOffset);
    let r = radius + map(offset, 0, 1, -radius * deformation, radius * deformation);
    curveVertex(cx + r * cos(a), cy + (r * sin(a)) * yScale);
  }
  endShape();
}