/**
 * 작품 제목: Glassic Interface: 생명성(Vitality)의 시각화
 * 본 작품은 유리라는 고정된 공간 속에서 관람객과 반응하는 생명체의 상호작용을 다룹니다.
 * 인터랙션을 통해 발현되는 에너지와 감정의 시각적 전이를 경험해 보시기 바랍니다.
 */

let worm = [];
let particles = [];
let bubbles = [];
let splashParticles = [];
let innerParticles = [];

let glassLayer, maskLayer, spotlightLayer, creatureLayer;
let targetX, targetY;
let fleeRadius = 60;

let jumping = false;
let jumpT = 0;
let jumpBaseY = 0;
let jumpPeakY = 0;
let jumpBeakerRef = null;
let landedSplash = false;

let wormLength = 14;
let beakers = [
  { x: 190, y: 160, w: 250, h: 300 },
  { x: 430, y: 300, w: 210, h: 180 },
  { x: 680, y: 340, w: 120, h: 120 },
  { x: 830, y: 70, w: 120, h: 390 },
  { x: 900, y: 140, w: 180, h: 320 }
];

let vibrateAmt = 0, isPinkActive = false, pinkTimer = 0;
let clickCount = 0, sizeMult = 1.0, idleTimer = 0;

function setup() {
  createCanvas(1200, 600);
  
  // ★ 커스텀 커서를 사용하기 위해 기본 커서를 숨깁니다.
  noCursor();

  glassLayer = createGraphics(width, height);
  maskLayer = createGraphics(width, height);
  spotlightLayer = createGraphics(width, height);
  creatureLayer = createGraphics(width, height);

  drawMask();

  targetX = width / 2;
  targetY = height / 2;
  for (let i = 0; i < wormLength; i++) worm.push(createVector(width / 2, height / 2));

  for (let i = 0; i < 40; i++) {
    let b = random(beakers);
    innerParticles.push({ x: random(b.x + 10, b.x + b.w - 10), y: random(b.y + 10, b.y + b.h - 10), vx: random(-0.5, 0.5), vy: random(-0.5, 0.5) });
  }
}

function draw() {
  background(2, 20, 40);

  updateCreature();
  updateBubbles();
  updateSplashParticles();
  updateInnerParticles();

  glassLayer.clear();
  drawGlass();
  drawCaustics();
  creatureLayer.clear();

  if (!jumping) {
    drawCreatureToLayer(creatureLayer);
    drawSpotlightToLayer(creatureLayer);
    creatureLayer.drawingContext.globalCompositeOperation = 'destination-in';
    creatureLayer.image(maskLayer, 0, 0);
    creatureLayer.drawingContext.globalCompositeOperation = 'source-over';
    image(creatureLayer, 0, 0);
  }

  drawBubbles();
  drawParticles();
  drawSplashParticles();
  drawInnerParticles();

  if (jumping) drawCreatureToCanvas();
  
  // ★ 기존의 drawMouseFleeBoundary 대신 커스텀 커서를 그리는 함수를 호출합니다.
  drawCustomCursor();
  
  image(glassLayer, 0, 0);
}

// --- 생명체 및 파티클 로직 ---

function updateCreature() {
  if (jumping) {
    jumpT += 0.026;
    let travelRatio = sin(jumpT * PI);
    worm[0].y = lerp(jumpBaseY, jumpPeakY, travelRatio);
    if (!landedSplash && jumpT > 0.5 && worm[0].y >= jumpBeakerRef.y) {
      triggerWaterSplash(jumpBeakerRef.x, jumpBeakerRef.y, jumpBeakerRef.w);
      landedSplash = true;
    }
    if (jumpT >= 1.0) { jumping = false; clickCount = 0; sizeMult = 1.0; }
    worm[0].x = lerp(worm[0].x, targetX, 0.05);
    vibrateAmt = 0;
    sizeMult = lerp(sizeMult, 1.0, 0.05);
  } else {
    let d = dist(worm[0].x, worm[0].y, mouseX, mouseY);
    if (d < fleeRadius) {
      let fleeVec = createVector(worm[0].x - mouseX, worm[0].y - mouseY).normalize();
      targetX = worm[0].x + fleeVec.x * 90;
      targetY = worm[0].y + fleeVec.y * 90;
      worm[0].x = lerp(worm[0].x, targetX, 0.07);
      worm[0].y = lerp(worm[0].y, targetY, 0.07);
    } else {
      targetX = lerp(targetX, mouseX, 0.015);
      targetY = lerp(targetY, mouseY, 0.015);
      worm[0].x = lerp(worm[0].x, targetX, 0.03);
      worm[0].y = lerp(worm[0].y, targetY, 0.03);
    }
  }
  
  if (!jumping && clickCount > 0) {
    idleTimer++;
    if (idleTimer > 90) {
      sizeMult = lerp(sizeMult, 1.0, 0.04);
      if (clickCount > 0 && frameCount % 15 === 0) clickCount--;
      if (clickCount === 0) isPinkActive = false;
    }
  }
  keepInsideBeakers();
  for (let i = 1; i < worm.length; i++) {
    worm[i].x = lerp(worm[i].x, worm[i - 1].x, 0.45);
    worm[i].y = lerp(worm[i] .y, worm[i - 1].y, 0.45);
  }
  vibrateAmt *= 0.93;
}

function drawCreatureToLayer(pg) {
  pg.noStroke();
  let commonVibX = 0, commonVibY = 0;
  if (!jumping && vibrateAmt > 0.1) {
    let stackIntensity = 1.0 + (clickCount * 0.25);
    commonVibX = (noise(frameCount * 0.5) - 0.5) * vibrateAmt * 1.2 * stackIntensity;
    commonVibY = (noise(frameCount * 0.5 + 100) - 0.5) * vibrateAmt * 1.2 * stackIntensity;
  }
  for (let i = 0; i < worm.length; i++) {
    let s = map(i, 0, worm.length, 36, 6) * sizeMult;
    let a = map(i, 0, worm.length, 255, 25);
    let drawX = worm[i].x + commonVibX, drawY = worm[i].y + commonVibY;
    if (!jumping) {
      drawX += noise(drawX * 0.05, frameCount * 0.02) * 3 - 1.5;
      drawY += noise(drawY * 0.05 + 100, frameCount * 0.02) * 3 - 1.5;
    }
    let finalColor, effectAlpha;
    if (isPinkActive && clickCount > 0) {
      finalColor = lerpColor(color(255, 180, 210, a), color(255, 120, 180, a), i / worm.length);
      effectAlpha = 0;
    } else {
      finalColor = lerpColor(color(255, 255, 255, a), color(200, 200, 200, a), i / worm.length);
      effectAlpha = a;
    }
    drawWormBody(pg, drawX, drawY, s, finalColor, effectAlpha);
  }
}

function drawCreatureToCanvas() {
  noStroke();
  for (let i = 0; i < worm.length; i++) {
    let s = map(i, 0, worm.length, 36, 6) * sizeMult;
    let a = map(i, 0, worm.length, 255, 25);
    let finalColor, effectAlpha;
    if (isPinkActive && clickCount > 0) {
      finalColor = lerpColor(color(255, 180, 210, a), color(255, 120, 180, a), i / worm.length);
      effectAlpha = 0;
    } else {
      finalColor = lerpColor(color(255, 255, 255, a), color(200, 200, 200, a), i / worm.length);
      effectAlpha = a;
    }
    drawWormBody(this, worm[i].x, worm[i].y, s, finalColor, effectAlpha);
  }
}

function drawWormBody(pg, x, y, s, bodyColor, alpha) {
  pg.push(); pg.translate(x, y); pg.fill(bodyColor); pg.circle(0, 0, s);
  pg.noFill();
  for (let j = 1; j <= 5; j++) {
    pg.stroke(255, alpha * (0.1 - j * 0.015));
    pg.strokeWeight(j * 0.5); pg.circle(0, 0, s);
  }
  pg.pop();
}

function spawnParticles(x, y, n) {
  for (let i = 0; i < n; i++) {
    particles.push({ x: x, y: y, vx: random(-4, 4), vy: random(-4, 4), a: 255, sz: random(3, 7), isPink: isPinkActive });
  }
}

function drawParticles() {
  noStroke();
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]; p.x += p.vx; p.y += p.vy; p.a -= 5;
    if (p.isPink) fill(255, 100, 150, p.a * 0.8);
    else fill(255, p.a * 0.8);
    circle(p.x, p.y, p.sz);
    if (p.isPink) fill(255, 180, 200, p.a * 0.5);
    else fill(255, 255, 255, p.a * 0.5);
    circle(p.x, p.y, p.sz * 1.5);
    if (p.a <= 0) particles.splice(i, 1);
  }
}

// --- 보조 함수들 ---

function mousePressed() {
  if (jumping) return;
  let d = dist(mouseX, mouseY, worm[0].x, worm[0].y);
  if (d < 80) {
    clickCount++; sizeMult += 0.32; idleTimer = 0; vibrateAmt = 26 + (clickCount * 4); isPinkActive = true;
    spawnParticles(worm[0].x, worm[0].y, 20 + clickCount * 10);
    if (clickCount >= 4) {
      for (let b of beakers) {
        if (worm[0].x > b.x && worm[0].x < b.x + b.w && worm[0].y > b.y && worm[0].y < b.y + b.h) {
          jumping = true; jumpT = 0; jumpBaseY = worm[0].y; jumpPeakY = b.y - 150; targetX = worm[0].x; jumpBeakerRef = b; landedSplash = false; break;
        }
      }
      spawnParticles(worm[0].x, worm[0].y, 90);
    }
  }
}

/**
 * ★ 기본 마우스 커서 대신 그릴 커스텀 커서 함수입니다.
 * flee Radius를 표시하는 점선 원은 유지하되, 중앙에 흰색 원 커서를 추가합니다.
 */
function drawCustomCursor() {
  push();
  
  // 1. flee Radius를 나타내는 점선 원 (기존 로직 유지)
  noFill();
  stroke(255, 65);
  strokeWeight(1.5);
  drawingContext.setLineDash([5, 8]);
  circle(mouseX, mouseY, fleeRadius * 2);
  
  // 2. ★ 커서 자체를 나타내는 흰색 원 (수정된 로직)
  // fleeRadius 영역 안으로 들어갔을 때 커서임을 더 명확히 하기 위해 흰색 테두리 원으로 표현합니다.
  drawingContext.setLineDash([]); // 점선 해제
  fill(255, 150); // 반투명 흰색 채우기
  stroke(255); // 흰색 테두리
  strokeWeight(2);
  // 생명체 테두리 원들과 비슷한 느낌을 주기 위해 약간 더 큰 원을 그립니다.
  circle(mouseX, mouseY, 12); 
  
  pop();
}

function updateInnerParticles() {
  for (let p of innerParticles) {
    p.x += p.vx; p.y += p.vy;
    let b = beakers[Math.floor(random(beakers.length))];
    if (p.x < b.x || p.x > b.x + b.w) p.vx *= -1;
    if (p.y < b.y || p.y > b.y + b.h) p.vy *= -1;
  }
}

function drawInnerParticles() {
  fill(255, 60); noStroke();
  for (let p of innerParticles) circle(p.x, p.y, 2);
}

function drawMask() { maskLayer.clear(); maskLayer.fill(255); for (let b of beakers) maskLayer.rect(b.x, b.y, b.w, b.h, 20); }
function keepInsideBeakers() { if (jumping) return; let head = worm[0]; let inside = false; for (let b of beakers) { if (head.x > b.x && head.x < b.x + b.w && head.y > b.y && head.y < b.y + b.h) { inside = true; break; } } if (inside) return; let nearest = null, best = 999999; for (let b of beakers) { let cx = constrain(head.x, b.x, b.x + b.w), cy = constrain(head.y, b.y, b.y + b.h); let d = dist(head.x, head.y, cx, cy); if (d < best) { best = d; nearest = { x: cx, y: cy }; } } if (nearest) { head.x = lerp(head.x, nearest.x, 0.3); head.y = lerp(head.y, nearest.y, 0.3); } }
function drawCaustics() { for (let b of beakers) { if (worm[0].x > b.x && worm[0].x < b.x + b.w && worm[0].y > b.y && worm[0].y < b.y + b.h) { push(); translate(b.x + b.w / 2, b.y + b.h + 12); noStroke(); fill(255, 255, 255, 22); ellipse(0, 8, b.w * 1.7, 48); fill(255, 255, 255, 45); ellipse(-b.w * 0.03, 4, b.w * 1.3, 32); fill(255, 255, 255, 75); ellipse(b.w * 0.05, 1, b.w * 0.8, 18); fill(255, 255, 255, 125); ellipse(0, -1, b.w * 0.42, 10); pop(); break; } } }
function updateBubbles() { if (random(1) < 0.25) { let targetBeaker = random(beakers); bubbles.push({ x: random(targetBeaker.x + 15, targetBeaker.x + targetBeaker.w - 15), y: targetBeaker.y + targetBeaker.h - 10, size: random(3, 6), speed: random(0.6, 2.0), by: targetBeaker.y, noiseOffset: random(100) }); } for (let i = bubbles.length - 1; i >= 0; i--) { let bb = bubbles[i]; bb.y -= bb.speed; bb.x += sin(frameCount * 0.05 + bb.noiseOffset) * 0.3; if (bb.y < bb.by + 10) bubbles.splice(i, 1); } }
function drawBubbles() { push(); for (let bb of bubbles) { stroke(255, 160); strokeWeight(1.0); fill(255, 45); circle(bb.x, bb.y, bb.size); noStroke(); fill(255, 220); circle(bb.x - bb.size * 0.2, bb.y - bb.size * 0.2, bb.size * 0.25); } pop(); }
function triggerWaterSplash(bx, by, bw) { for (let i = 0; i < 55; i++) { splashParticles.push({ x: random(bx + 15, bx + bw - 15), y: by - 2, vx: random(-3.5, 3.5), vy: random(-6.0, -2.5), gravity: 0.22, size: random(4.0, 8.5), startY: by, a: 255 }); } }
function updateSplashParticles() { for (let i = splashParticles.length - 1; i >= 0; i--) { let sp = splashParticles[i]; sp.x += sp.vx; sp.y += sp.vy; sp.vy += sp.gravity; sp.a -= (sp.vy > 0 && sp.y > sp.startY - 35) ? 25 : 2.0; if (sp.a <= 0 || sp.y > height) splashParticles.splice(i, 1); } }
function drawSplashParticles() { push(); noStroke(); for (let sp of splashParticles) { fill(255, sp.a * 0.7); circle(sp.x, sp.y, sp.size); fill(255, sp.a); circle(sp.x - sp.size * 0.15, sp.y - sp.size * 0.15, sp.size * 0.4); } pop(); }
function drawSpotlightToLayer(pg) { pg.push(); pg.translate(worm[0].x, worm[0].y); pg.noStroke(); for (let r = 0; r < 5; r++) { pg.fill(255, 255, 255, map(r, 0, 5, 20, 0)); pg.circle(0, 0, map(r, 0, 5, 160, 240) * sizeMult); } pg.pop(); }
function drawGlass() { for (let b of beakers) { let inside = false; for (let p of worm) if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) inside = true; let am = inside ? 1.0 : 0.7; glassLayer.noStroke(); glassLayer.fill(255, 15 * am); glassLayer.rect(b.x, b.y, b.w, b.h, 20); glassLayer.noFill(); glassLayer.stroke(255, 240 * am); glassLayer.strokeWeight(2.0); glassLayer.arc(b.x + b.w / 2, b.y, b.w, 16, PI, TWO_PI); glassLayer.line(b.x, b.y, b.x, b.y + b.h); glassLayer.line(b.x + b.w, b.y, b.x + b.w, b.y + b.h); glassLayer.arc(b.x + b.w / 2, b.y + b.h, b.w, 16, 0, PI); glassLayer.noStroke(); glassLayer.fill(255, 255, 255, 145 * am); glassLayer.rect(b.x + 8, b.y + 12, b.w * 0.04, b.h - 24, 10); glassLayer.fill(255, 255, 255, 85 * am); glassLayer.rect(b.x + 20, b.y + 18, b.w * 0.015, b.h - 36, 4); glassLayer.fill(255, 255, 255, 55 * am); glassLayer.rect(b.x + b.w - 14, b.y + 12, b.w * 0.025, b.h - 24, 10); glassLayer.fill(255, 255, 255, 115 * am); glassLayer.arc(b.x + b.w / 2, b.y + b.h - 6, b.w * 0.88, 12, 0, PI); glassLayer.fill(inside ? color(255, 85) : color(2, 20, 40, 230)); glassLayer.arc(b.x, b.y + b.h / 2, b.w * 0.09, b.h * 0.97, -HALF_PI, HALF_PI); glassLayer.arc(b.x + b.w, b.y + b.h / 2, b.w * 0.09, b.h * 0.97, HALF_PI, PI + HALF_PI); } }