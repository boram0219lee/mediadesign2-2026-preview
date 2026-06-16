// =============================================
// 🧸 Segment 클래스 (담요 그리드)
// =============================================
class Segment {
  constructor(x, y, w, h, r, innerCol) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.r = r;
    this.innerCol = innerCol;
    this.pad = 80;
    this.pg = createGraphics(w + this.pad * 2, h + this.pad * 2);
    this.pg.pixelDensity(1);
    this.drawSegment();
    this.warmth = 0;
  }

  drawSegment(col) {
    col = col || this.innerCol;
    let g = this.pg;
    g.clear();
    g.noStroke();
    g.rectMode(CENTER);
    let cx = this.pad + this.w / 2;
    let cy = this.pad + this.h / 2;

    let steps = 12;
    for (let i = steps; i >= 0; i--) {
      let t = i / steps;
      let expand = t * 18;
      let a = (1 - t) * 255;
      g.fill(255, 252, 247, a);
      g.rect(cx, cy, this.w + expand * 2, this.h + expand * 2, this.r + expand);
    }

    let r = red(col);
    let gr = green(col);
    let b = blue(col);

    let steps2 = 7;
    for (let i = steps2; i >= 0; i--) {
      let t = i / steps2;
      let expand = t * 80;
      let a = (1 - t) * 150;
      g.fill(r, gr, b, a);
      g.rect(cx, cy + this.h * 0.2,
        this.w * 0.92 + expand,
        this.h * 0.5 + expand,
        this.r * 0.9 + expand * 0.5);
    }
  }

  display() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    let maxDist = 140;
    let isNear = d < maxDist;
    let lift = map(d, 0, maxDist, -50, 0, true);

    if (isNear) {
      this.warmth += 0.005;
    } else {
      this.warmth -= 0.01;
    }
    this.warmth = constrain(this.warmth, 0, 1);

    if (this.warmth > 0.001 && this.warmth < 0.999) {
      let warmCol = lerpColor(this.innerCol, color(251, 244, 212), this.warmth);
      this.drawSegment(warmCol);
    } else if (this.warmth <= 0.001) {
      this.drawSegment(this.innerCol);
    }

    imageMode(CENTER);
    image(this.pg, this.x, this.y + lift);
  }
}

// =============================================
// 🐍 Dust 클래스 (먼지 파티클)
// =============================================
class Dust {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-0.2, 0.2);
    this.vy = random(-0.2, 0.2);
    this.life = random(300, 600);
  }

  update() {
    this.x += this.vx + random(-0.05, 0.05);
    this.y += this.vy + random(-0.05, 0.05);
    this.life--;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    if (this.life < 0) {
      this.x = random(width);
      this.y = random(height);
      this.life = random(300, 600);
    }
  }

  display() {
    noStroke();
    fill(120, 120, 120, 40);
    circle(this.x, this.y, random(2, 4));
  }
}

// =============================================
// 📦 전역 변수
// =============================================

// --- 담요 그리드 ---
let segments = [];       // Segment 객체 배열 (담요)
let cols = 8;
let rows = 6;
let sw = 150, sh = 150, sr = 50;
let spacingX = 160;
let spacingY = 140;

let stillTimer = 0;
let STILL_THRESHOLD = 180;  // 3초 (60fps 기준, 취향껏 조절)
let creatureSpawnX = -200;  // 화면 왼쪽 밖
let creatureSpawnY = -200;  // 화면 위쪽 밖

// --- 크리처 ---
let creatureSegs = [];   // createVector 배열 (크리처 몸통)
let segLength = 50;
let total = 70;

// --- 플레이어 ---
let player;

// --- 먼지 ---
let dusts = [];
let DUST_NUM = 150;

// --- 상태 ---
let state = "idle";
let wrapAngle = 0;

let path = [];
let maxPath = 300;

let circles = [];
let noiseLayer;

let escapeCount = 0;
let escapeGoal = 20;

let reboundStart = 0;
let reboundDuration = 180;
let reboundCenter;

let blinkTimer = 0;
let blinkInterval = 120;
let blinkDuration = 10;
let isBlinking = false;

let releaseStart = 0;
let releaseDuration = 60;
let isReleasing = false;

let eyeCloseTimer = -1;       // -1이면 비활성. 0 이상이면 카운트 중
let eyeCloseDuration = 90;    // 눈 뜨고 → 감는 데 걸리는 프레임 (90 = 1.5초)

let smoothPressure = 0;

let wrapProgress = 0;
let VIGNETTE_SPEED = 0.002;  // ← 속도 노브. 0.001=느림, 0.005=빠름
let VIGNETTE_MAX   = 0.6;    // ← 최대 밝기 노브. 0.3=은은, 0.8=매우 밝음

let lockedTimer = 0;
let LOCKED_SPIN_FRAMES = 180;  // 3초 (60fps 기준). 바꾸면 시간 조절

// =============================================
// 🔧 SETUP
// =============================================
function setup() {
  createCanvas(1280, 720);
  pixelDensity(0.5);
  noCursor();

  player = createVector(width / 2, height / 2);

  // 먼지 생성
  for (let i = 0; i < DUST_NUM; i++) {
    dusts.push(new Dust());
  }

  // 크리처 초기화 (화면 밖에서 시작)
  for (let i = 0; i < total; i++) {
    creatureSegs.push(createVector(-100, -100));
  }

  // 노이즈 텍스처 레이어
  noiseLayer = createGraphics(width, height);
  noiseLayer.loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      noiseLayer.set(x, y, color(255, 255, 255, 10));
    }
  }
  noiseLayer.updatePixels();

  // 구름 프레임
  createCloudFrame();

  // 담요 그리드 생성
  let startX = width / 2 - ((cols - 1) * spacingX) / 2;
  let startY = height / 2 - ((rows - 1) * spacingY) / 2;

  for (let j = 0; j < rows; j++) {
    let t = j / (rows - 1);
    let innerCol = lerpColor(
      color(236, 239, 241),
      color(210, 220, 227),
      t
    );

    let ltr = (j % 2 === 0);

    for (let i = 0; i < cols; i++) {
      let col = ltr ? i : (cols - 1 - i);
      let x = startX + col * spacingX;
      let y = startY + j * spacingY;
      let rw = spacingX + random(-30, 80);
      let rh = sh + random(-40, 40);
      segments.push(new Segment(x, y, rw, rh, sr, innerCol));
    }

    if (j < rows - 1) {
      let turnX = ltr
        ? startX + (cols - 1) * spacingX
        : startX;
      let baseY = startY + j * spacingY;
      segments.push(new Segment(turnX, baseY + spacingY * 0.5, sw, sh, sr, innerCol));
    }
  }
}

// =============================================
// 🎬 DRAW
// =============================================
function draw() {
  let rawPressure = getPressure();
smoothPressure += (rawPressure - smoothPressure) * 0.05; // 천천히 따라감
let pressure = smoothPressure;

  push();



  // 배경
  background(225, 229, 232);

  // 이전 프레임 위치 저장 (크리처용)
  for (let s of creatureSegs) {
    s.prevX = s.x;
    s.prevY = s.y;
  }

  // 담요 그리드 그리기
  for (let s of segments) {
    s.display();
  }

  // 먼지
  for (let d of dusts) {
    d.update();
    d.display();
  }

  // 상태 체크 & 플레이어 업데이트
  checkMovement();
  
  // wrap/locked 동안 비네트 진행
  if (state === "wrap" || state === "locked") {
    wrapProgress = min(wrapProgress + VIGNETTE_SPEED, 1);
  } else {
    wrapProgress = max(wrapProgress - VIGNETTE_SPEED * 2, 0); // 빠르게 복귀
  }
  if (state !== "locked") updatePlayer();

  // 크리처 행동
  if      (state === "emerge")  emergeCreature();
  else if (state === "follow")  followPlayer();
  else if (state === "wrap")    wrapPlayer();
else if (state === "locked")  lockedSpin();
  
  else if (state === "rebound") reboundCreature();
  else if (state === "escaped") escapeCreature();

  // 크리처 그리기
  drawCreature();

  // 깜빡임 타이머
  blinkTimer++;
  if (blinkTimer > blinkInterval) isBlinking = true;
  if (blinkTimer > blinkInterval + blinkDuration) {
    isBlinking = false;
    blinkTimer = 0;
  }

  if (state === "wrap")   { blinkInterval = 90; blinkDuration = 8; }
  if (state === "locked") { blinkInterval = 80; blinkDuration = 30; }

  // 플레이어 그리기
  drawPlayer();
  

  pop();

  drawPressureOverlay(pressure);
  drawReleaseFlash();
}

// =============================================
// 🖼️ 배경 & 구름 프레임
// =============================================
function drawPaperBackground() {
  noStroke();
  background(225, 229, 232);
}

function createCloudFrame() {
  for (let x = 0; x < width; x += random(80, 140)) circles.push(makeCircle(x, -20));
  for (let x = 0; x < width; x += random(80, 140)) circles.push(makeCircle(x, height + 20));
  for (let y = 0; y < height; y += random(80, 140)) circles.push(makeCircle(-20, y));
  for (let y = 0; y < height; y += random(80, 140)) circles.push(makeCircle(width + 20, y));
}

function makeCircle(x, y) {
  return { x: x + random(-20, 20), y: y + random(-20, 20), r: random(120, 260) };
}

function drawCloudFrame() {
  for (let c of circles) drawBgGradientCircle(c.x, c.y, c.r);
}

function drawBgGradientCircle(x, y, r) {
  let steps = 20;
  for (let i = steps; i > 0; i--) {
    let t = i / steps;
    let col = lerpColor(color(255, 252, 247), color(239, 235, 226), t);
    fill(red(col), green(col), blue(col), 90);
    ellipse(x, y, r * t);
  }
}

// =============================================
// 🌑 압박 오버레이 & 릴리즈 플래시
// =============================================
function drawPressureOverlay(p) {
  if (wrapProgress <= 0) return;
  let ctx = drawingContext;

  // 가장자리만 하얘지는 방사형 그라데이션
  let edgeAlpha = lerp(0, VIGNETTE_MAX, wrapProgress);

  let grad = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.25,  // 중앙은 투명
    width / 2, height / 2, width * 0.78   // 가장자리만 하얗게
  );

  grad.addColorStop(0,   "rgba(255,255,255,0)");
  grad.addColorStop(0.6, `rgba(255,255,255,${edgeAlpha * 0.3})`);
  grad.addColorStop(1,   `rgba(255,255,255,${edgeAlpha})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawReleaseFlash() {
  if (!isReleasing) return;
  let t = (frameCount - releaseStart) / releaseDuration;
  if (t >= 1) return;
  noStroke();
  fill(255, (1 - t) * 200);
  rect(0, 0, width, height);
}

// =============================================
// 🐭 플레이어
// =============================================
function updatePlayer() {
  player.x += (mouseX - player.x) * 0.08;
  player.y += (mouseY - player.y) * 0.08;
}

function drawPlayer() {
  noStroke();
  fill(245, 201, 213);
  circle(player.x, player.y, 30);

  // 눈 연출: eyeCloseTimer가 활성일 때만 표시
  if (eyeCloseTimer >= 0) {
    eyeCloseTimer++;

    let progress = constrain(eyeCloseTimer / eyeCloseDuration, 0, 1);

    // 눈 높이: 0→4(뜬 상태)→0(감긴 상태)
    // 앞 30%는 눈 뜨고, 이후 감기기 시작
    let openPhase = constrain(progress / 0.3, 0, 1);
    let closePhase = constrain((progress - 0.3) / 0.7, 0, 1);
    let eyeH = lerp(0, 4, openPhase) * (1 - closePhase);

    if (eyeH > 0.3) {  // 완전히 감기면 그리지 않음
      fill(0);
      noStroke();
      ellipse(player.x - 8, player.y, 4, eyeH);
      ellipse(player.x + 8, player.y, 4, eyeH);
    }

    if (eyeCloseTimer > eyeCloseDuration) {
      eyeCloseTimer = -1;  // 연출 끝, 눈 숨김
    }
  }
}

// =============================================
// 🔄 상태 제어
// =============================================
function checkMovement() {
  let d = dist(mouseX, mouseY, pmouseX, pmouseY);

  if (state !== "idle") return;  // idle 상태에서만 감지

  if (d < 1.5) {
    stillTimer++;
    if (stillTimer >= STILL_THRESHOLD) {
      // 크리처를 화면 밖에 배치하고 등장 시작
      for (let i = 0; i < creatureSegs.length; i++) {
        creatureSegs[i].x = creatureSpawnX;
        creatureSegs[i].y = creatureSpawnY;
      }
      state = "emerge";
      stillTimer = 0;
    }
  } else {
    stillTimer = 0;  // 움직이면 리셋
  }
}

function keyPressed() {
  if (state === "locked") {
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
      escapeCount++;
      if (escapeCount >= escapeGoal) {
        state = "rebound";
        reboundStart = frameCount;
        reboundCenter = createVector(player.x, player.y);
        escapeCount = 0;
        isReleasing = true;
        releaseStart = frameCount;
      }
    }
  }
}

function getReleaseEffect() {
  if (!isReleasing) return 0;
  let t = (frameCount - releaseStart) / releaseDuration;
  if (t >= 1) { isReleasing = false; return 0; }
  return sin(t * PI);
}

// =============================================
// 🐍 크리처 로직
// =============================================
function emergeCreature() {
  updateCreature(width / 2, height / 2);
  if (dist(creatureSegs[0].x, creatureSegs[0].y, player.x, player.y) < 200) {
    state = "follow";
  }
}

function followPlayer() {
  updateCreature(player.x, player.y);
  let d = dist(creatureSegs[0].x, creatureSegs[0].y, player.x, player.y);
  if (d < 60) {  wrapProgress = 0; state = "wrap"; wrapAngle = 0; }
}

function updatePath(x, y) {
  path.unshift(createVector(x, y));
  if (path.length > maxPath) path.pop();
}

function wrapPlayer() {
  wrapAngle += 0.008;  // ⑤번 느리게도 여기서 조정

  let radius = 130;

  let hx = player.x + cos(wrapAngle) * radius;
  let hy = player.y + sin(wrapAngle) * radius;
  updatePath(hx, hy);

  if (path.length > 0) {
    creatureSegs[0].x += (path[0].x - creatureSegs[0].x) * 0.25;
    creatureSegs[0].y += (path[0].y - creatureSegs[0].y) * 0.25;
  }

  followSegments();

  // ✅ 중괄호로 묶어야 조건부 실행됨
  let s = creatureSegs[20];
  let dx = s.x - player.x;
  let dy = s.y - player.y;
  if (dx * dx + dy * dy < 160 * 160) {
    eyeCloseTimer = 0;
    lockedTimer = 0;
    state = "locked";
  }
}

function followSegments() {
  for (let i = 1; i < creatureSegs.length; i++) {
    let prev = creatureSegs[i - 1];
    let curr = creatureSegs[i];
    curr.x += (prev.prevX - curr.x) * 0.5;
    curr.y += (prev.prevY - curr.y) * 0.5;
    let dx = curr.x - prev.x;
    let dy = curr.y - prev.y;
    let d = sqrt(dx * dx + dy * dy);
    let diff = d - segLength;
    if (d > 0) { curr.x -= (dx / d) * diff; curr.y -= (dy / d) * diff; }
  }
}

function updateCreature(tx, ty) {
  let speed = 0.05;
  creatureSegs[0].x += (tx - creatureSegs[0].x) * speed;
  creatureSegs[0].y += (ty - creatureSegs[0].y) * speed;
  for (let i = 1; i < creatureSegs.length; i++) {
    let dx = creatureSegs[i - 1].x - creatureSegs[i].x;
    let dy = creatureSegs[i - 1].y - creatureSegs[i].y;
    let angle = atan2(dy, dx);
    creatureSegs[i].x = creatureSegs[i - 1].x - cos(angle) * segLength;
    creatureSegs[i].y = creatureSegs[i - 1].y - sin(angle) * segLength;
  }
}

function reboundCreature() {
  let t = constrain((frameCount - reboundStart) / reboundDuration, 0, 1);
  let eased = 1 - pow(1 - t, 3);
  let radius = lerp(140, 60, eased);
  wrapAngle += 0.005;
  let hx = reboundCenter.x + cos(wrapAngle) * radius;
  let hy = reboundCenter.y + sin(wrapAngle) * radius;
  updatePath(hx, hy);
  if (path.length > 0) {
    creatureSegs[0].x += (path[0].x - creatureSegs[0].x) * 0.3;
    creatureSegs[0].y += (path[0].y - creatureSegs[0].y) * 0.3;
  }
  followSegments();
  if (t >= 1) state = "escaped";
}

function escapeCreature() {
  updateCreature(-300, -300);  // 왼쪽 상단 밖으로 목표 변경

  // 판정도 왼쪽 상단 기준으로
  if (creatureSegs[0].x < -250 && creatureSegs[0].y < -250) {
    state = "idle";
    for (let i = 0; i < creatureSegs.length; i++) {
      creatureSegs[i].x = -100;
      creatureSegs[i].y = -100;
      wrapProgress = 0;
    }
    path = [];
    wrapAngle = 0;
  }
}

function keepWrapping() {
  // locked 상태에서 계속 천천히 돌기 (locked 전환 조건만 없음)
  wrapAngle += 0.004;  // wrap보다 더 느리게

  let radius = 130;
  let hx = player.x + cos(wrapAngle) * radius;
  let hy = player.y + sin(wrapAngle) * radius;
  updatePath(hx, hy);

  if (path.length > 0) {
    creatureSegs[0].x += (path[0].x - creatureSegs[0].x) * 0.1;
    creatureSegs[0].y += (path[0].y - creatureSegs[0].y) * 0.1;
  }
  followSegments();
}

function lockedSpin() {
  lockedTimer++;
  
  if (lockedTimer <= LOCKED_SPIN_FRAMES) {
    // 3초 동안만 천천히 돌기
    wrapAngle += 0.015;
    let radius = 130;
    let hx = player.x + cos(wrapAngle) * radius;
    let hy = player.y + sin(wrapAngle) * radius;
    updatePath(hx, hy);

    if (path.length > 0) {
      creatureSegs[0].x += (path[0].x - creatureSegs[0].x) * 0.1;
      creatureSegs[0].y += (path[0].y - creatureSegs[0].y) * 0.1;
    }
    followSegments();
  }
  // 3초 지나면 아무것도 안 함 → 그 자리에서 정지
}

// =============================================
// 🎨 크리처 그리기
// =============================================
function drawCreature() {
  // 배경 Segment 크기와 맞춤: w≈spacingX 범위, h≈sh
  let baseW = 150;
  let baseH = 150;
  let cornerR = 50;
  
  let breathSpeed = 0.01;   // 숨쉬기 속도. 올리면 빠름
  let breathAmt   = 0.06;   // 팽창 진폭 (비율). 올리면 크게 부풀음
  
  // 화면 안에 들어온 세그먼트 수 파악 (페이드 기준)
  let margin = 200;  // 화면 가장자리에서 이 px 안쪽부터 그리기 시작

  for (let i = creatureSegs.length - 1; i >= 0; i--) {
    let s = creatureSegs[i];
    // 머리쪽(i=0)이 가장 크고, 꼬리로 갈수록 살짝 줄어듦
    
    // 화면 밖 세그먼트는 건너뜀 → 몸이 밖에서 오는 느낌
    if (s.x < -margin || s.x > width + margin ||
        s.y < -margin || s.y > height + margin) continue;
    
    let scaleFactor = lerp(1.0, 0.75, i / creatureSegs.length);
    
     // 세그먼트마다 위상 살짝 다르게 → 물결 느낌
    let phase = i * 0.15;
    let breath = 1 + sin(frameCount * breathSpeed + phase) * breathAmt;
    
    drawGradientCircle(
      s.x, s.y,
      baseW * scaleFactor * breath,  
  baseH * scaleFactor * breath,  
      cornerR * scaleFactor,
      i
    );
  }
}

// 크리처 i번째 인덱스 → 배경 그라데이션 색상 매핑
function creatureInnerCol(i) {
  let t = i / (creatureSegs.length - 1);
  return lerpColor(color(236, 239, 241), color(210, 220, 227), t);
}

function drawGradientCircle(x, y, w, h, cornerR, segIdx) {
  let col = creatureInnerCol(segIdx);
  let r = red(col), gr = green(col), b = blue(col);

  push();
  translate(x, y);
  noStroke();
  rectMode(CENTER);

  // ── 1단계: 흰색 번짐 (Segment 흰 glow와 동일) ──
  let steps = 12;
  for (let i = steps; i >= 0; i--) {
    let t = i / steps;
    let expand = t * 18;
    let a = (1 - t) * 255;
    fill(255, 252, 247, a);
    rect(0, 0, w + expand * 2, h + expand * 2, cornerR + expand);
  }

  // ── 2단계: 아래 그림자 번짐 (Segment 색상 shadow와 동일) ──
  let steps2 = 7;
  for (let i = steps2; i >= 0; i--) {
    let t = i / steps2;
    let expand = t * 80;
    let a = (1 - t) * 150;
    fill(r, gr, b, a);
    rect(0, 0, w * 0.92 + expand, h * 0.5 + expand, cornerR * 0.9 + expand * 0.5);
  }

  pop();
}


function getPressure() {
  let count = 0;
  for (let i = 0; i < creatureSegs.length; i++) {
    if (dist(creatureSegs[i].x, creatureSegs[i].y, player.x, player.y) < 80) count++;
  }
  return count / creatureSegs.length;
}

function drawStateText() {
  fill(50);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  let msg = "STATE: " + state;
  if (state === "locked") msg += " (" + escapeCount + "/" + escapeGoal + ")";
  text(msg, 10, 10);
}