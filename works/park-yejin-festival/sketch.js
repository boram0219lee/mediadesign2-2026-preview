
// --- 설정 ---
const musicFileName = 'S.mp3'; 
const guitarFile = 'G.mp3';
const baseFile = 'B.mp3';
const drumFile = 'D.mp3';
const startTime = 0.0; 
// ------------------------------------------------



let song, guitarSong, baseSong, drumSong; // 기존 song 변수 옆에 추가
let noiseOffset = 0;
let amplitude; // 소리 크기 분석기
let isStarted = false;
let isLoaded = false; 
let particles = [];
let myX = 0;
let myY = 0;
let mergeTime = 0;
let fireworks = [];
let isFinished = false;
let bgColor;
let sessionGroups = [];
let pastelColors = [];

let isJumping = false;
let jumpCount = 0;
let jumpTimer = 0;
const jumpDuration = 250;
const jumpHeight = 15;
const jumpMaxCount = 32;

let isShaking = false;
let shakeTimer = 0;
const shakeDuration = 800;
const shakeAmplitude = 15;

let guideCreatures = [];
let bottomBars = [];
const numBars = 30;
function preload() {
  song = loadSound(musicFileName);
  guitarSong = loadSound(guitarFile);
  baseSong = loadSound(baseFile);
  drumSong = loadSound(drumFile);
}

function setup() {
  createCanvas(1280, 720);
  myX = width / 2;
  myY = height / 2;
  bgColor = color(255, 240, 245);
  pastelColors = [color('#FFC1CC'), color('#A6D8FF'), color('#FFF9B1')];

 // 기존 song 로드 부분 삭제하고 아래 코드 적용
amplitude = new p5.Amplitude(); // 추가
  amplitude.setInput(song); // 메인 곡의 소리 크기를 분석하도록 설정

  
  guitarSong.setVolume(0);
  baseSong.setVolume(0);
  drumSong.setVolume(0);
  isLoaded = true; // 로드 완료
  
  // 

  for (let i = 0; i < 50; i++) {
    particles.push({
      angle: random(0, TWO_PI), radius: random(130, 200), speed: random(0.01, 0.02),
      col: random(pastelColors), baseSize: random(30, 50), jumpOffset: 0, shakeOffsetX: 0,
      explosionRadius: 0,
      vx: 0, vy: 0 
    });
  }

  for (let i = 0; i < 14; i++) {
    guideCreatures.push({
      x: random([-200, width + 200]), y: random(0, height),
      angle: random(TWO_PI),
      speed: random(0.01, 0.015),
      active: true
    });
  }
for (let i = 0; i < numBars; i++) {
    bottomBars.push({
      x: (width / numBars) * i + (width / numBars) / 2,
      baseHeight: random(20, 80),
      speed: random(0.02, 0.05),
      offset: random(TWO_PI)
    });
  }
  initSessions();
}

// 악기 그룹을 상단에 배치하고 외곽선 스타일을 위한 기초 데이터 설정
function initSessions() {
  // 기타: 왼쪽 상단
  for (let i = 0; i < 18; i++) {
    sessionGroups.push({ type: 'guitar', x: random(50, 300), y: random(200, 400), baseX: random(50, 300), baseY: random(200, 170), s: random(15, 30), off: random(TWO_PI) });
  }
  // 베이스: 중앙 상단
  for (let i = 0; i < 18; i++) {
    sessionGroups.push({ type: 'base', x: random(400, 850), y: random(200, 400), baseX: random(400, 850), baseY: random(200, 170), s: random(20, 30), off: random(TWO_PI) });
  }
  // 드럼: 오른쪽 상단
  for (let i = 0; i < 15; i++) {
    sessionGroups.push({ type: 'drum', x: random(950, 1200), y: random(200, 400), baseX: random(950, 1200), baseY: random(200, 170), s: random(20, 30), off: random(TWO_PI) });
  }
}
function draw() {
  // 1. 배경 초기화
  let targetBg = isFinished && fireworks.length > 0 ? color(20, 0, 40) : color(255, 240, 245);
  bgColor = lerpColor(bgColor, targetBg, 0.05);
  background(bgColor);

  // 2. 음악 반응형 몽환적 배경 효과
  let level = amplitude.getLevel();
  noiseOffset += 0.002 + (level * 0.005); 
  
  noStroke();
  // 간격을 넓게(100) 설정하여 원들이 크게 겹치도록 함
  for (let x = 0; x <= width; x += 100) { 
    for (let y = 0; y <= height; y += 100) {
      let n = noise(x * 0.001, y * 0.001, noiseOffset);
      let c = lerpColor(color('#FFC1CC'), color('#A6D8FF'), n);
      
      // 투명도를 매우 낮게(15~35) 설정하여 원의 경계를 없앰
      let alpha = map(level, 0, 0.5, 15, 35, true); 
      fill(red(c), green(c), blue(c), alpha);
      
      // 원 크기를 크게(600) 키워 전체적인 색감의 흐름으로 만듦
      ellipse(x, y, 600 * n, 600 * n);
    }
  }

  // 
  let centerX = width / 2;
  let centerY = height / 1.7;
  let dToCenter = dist(mouseX, mouseY, centerX, centerY);

  // 음악 시작 조건
  if (dToCenter < 250 && !isStarted && isLoaded) {
    userStartAudio();
    song.loop(); 
    guitarSong.loop(); 
    baseSong.loop(); 
    drumSong.loop();
    song.setVolume(1.0);
    isStarted = true;
  }

  for (let gc of guideCreatures) {
    if (gc.active) {
      gc.angle += 0.02;
      let targetX = centerX + cos(gc.angle) * 150;
      let targetY = centerY + sin(gc.angle) * 150;
      gc.x = lerp(gc.x, targetX, 0.03);
      gc.y = lerp(gc.y, targetY, 0.03);
      drawPinkGuide(gc.x, gc.y);
      if (dist(gc.x, gc.y, centerX, centerY) < 160) {
        gc.active = false;
        particles.push({ angle: gc.angle, radius: 150, speed: 0.015, col: color('#FF99AA'), baseSize: 30, jumpOffset: 0, shakeOffsetX: 0, explosionRadius: 0, vx: 0, vy: 0 });
      }
    }
  }

  if (!isJumping && !isShaking && dToCenter < 350 && mergeTime >= 220 && fireworks.length === 0 && !isFinished) {
    isJumping = true; jumpCount = 0; jumpTimer = 0; isFinished = true;
  }

  if (isJumping) {
    jumpTimer += deltaTime;
    let offset = sin((jumpTimer / jumpDuration) * PI) * jumpHeight;
    myX = lerp(myX, mouseX, 0.15); myY = lerp(myY, mouseY, 0.15) - offset;
    for (let p of particles) { p.jumpOffset = offset; p.shakeOffsetX = 0; }
    if (jumpTimer >= jumpDuration) { jumpTimer = 0; jumpCount++; if (jumpCount >= jumpMaxCount) { isJumping = false; isShaking = true; shakeTimer = 0; } }
  } else if (isShaking) {
    shakeTimer += deltaTime;
    let shakeX = sin((shakeTimer / shakeDuration) * TWO_PI * 3) * shakeAmplitude;
    myX = lerp(myX, mouseX, 0.15) + shakeX;
    if (shakeTimer >= shakeDuration) { 
        isShaking = false; 
        createFireworks(centerX, centerY); 
        for(let p of particles) {
            let angle = atan2(centerY - (centerY + sin(p.angle)*p.radius), centerX - (centerX + cos(p.angle)*p.radius));
            p.vx = cos(p.angle) * random(10, 20);
            p.vy = sin(p.angle) * random(10, 20);
            p.explosionRadius = 600;
        }
    }
  } else {
    for (let p of particles) { p.jumpOffset = 0; p.shakeOffsetX = 0; }
    if (mergeTime > 200 && !isFinished) {
      let limit = 200;
      myX = constrain(mouseX, centerX - limit, centerX + limit);
      myY = constrain(mouseY, centerY - limit, centerY + limit);
    } else {
      myX = lerp(myX, mouseX, 0.15);
      myY = lerp(myY, mouseY, 0.15);
    }
  }

  drawStage(); 
  drawBottomBars();
  if (dToCenter >= 250) { isFinished = false; fireworks = []; }
  if (!isFinished && dToCenter < 250 && mergeTime < 300 && !isJumping && !isShaking) mergeTime += 2;
  else if (!isJumping && !isShaking) mergeTime = max(mergeTime - 5, 0);

  for (let p of particles) {
    p.explosionRadius = lerp(p.explosionRadius, 0, 0.02); 
    p.vx *= 0.92; p.vy *= 0.92; 
    let baseRadius = map(mergeTime, 0, 300, p.radius, 0, true);
    let x = centerX + cos(p.angle) * baseRadius + (p.shakeOffsetX || 0) + (p.vx * (p.explosionRadius/600));
    let y = centerY + sin(p.angle) * baseRadius - (p.jumpOffset || 0) + (p.vy * (p.explosionRadius/600));
    let pulse = 1 + sin(frameCount * 0.1 + p.angle) * 0.15;
    push(); translate(x, y); noStroke();
    fill(255, 255, 255, 180); ellipse(0, 0, p.baseSize * 0.5 * pulse, p.baseSize * 0.7 * pulse);
    for (let i = 3; i >= 1; i--) {
      fill(red(p.col), green(p.col), blue(p.col), map(i, 3, 1, 40, 120));
      ellipse(0, 0, p.baseSize * (i + 0.5) * pulse, p.baseSize * (i + 0.5) * pulse * 1.2);
    }
    fill(255, 255, 255, 210); ellipse(0, -p.baseSize * 0.3, p.baseSize * 0.25, p.baseSize * 0.25);
    pop(); p.angle += p.speed;
  }

  for (let f of fireworks) {
    f.vx *= 0.96; f.vy *= 0.96; f.vy += 0.2; 
    f.x += f.vx; f.y += f.vy; f.life -= 2.0; 
    push();
    stroke(red(f.col), green(f.col), blue(f.col), f.life);
    strokeWeight(f.size * 1.2); 
    line(f.x, f.y, f.x - f.vx * 2.0, f.y - f.vy * 2.0);
    pop();
  }
  fireworks = fireworks.filter(f => f.life > 0);
  
  drawParticleStyleMe(myX, myY);
}
function drawStage() {
  let types = ['guitar', 'base', 'drum'];
  let nearType = null;
  let minD = 180; 

  let level = amplitude.getLevel(); 
  let beatPulse = level * 150; 
  let bounce = beatPulse * 2;

  let dToCenter = dist(mouseX, mouseY, width / 2, height / 1.7);
  if (dToCenter > 200) { 
    for (let type of types) {
      let group = sessionGroups.filter(g => g.type === type);
      for (let g of group) {
        let d = dist(mouseX, mouseY, g.x, g.y);
        if (d < minD) {
          minD = d;
          nearType = type;
        }
      }
    }
  }

  for (let type of types) {
    let group = sessionGroups.filter(g => g.type === type);
    for (let i = 0; i < group.length; i++) {
      let g = group[i];
      let isSolo = (type === nearType);
      
      // 1. 기본 흔들림 (Idle Movement)
      let idleX = sin(frameCount * 0.02 + g.off) * 15;
      let idleY = cos(frameCount * 0.02 + g.off) * 15;
      
      let targetX, targetY;

      // 2. 위치 로직
      if (isSolo) {
        // [솔로 모드] 마우스 따라가기 + 박자 튀어오름
        if (type === 'guitar') {
          let flutterX = sin(frameCount * 0.15 + i * 0.7) * (40 + i * 2);
          let flutterY = cos(frameCount * 0.15 + i * 0.7) * (40 + i * 2);
          targetX = mouseX + flutterX + random(-30, 50);
          targetY = mouseY + flutterY + random(-30, 50) - bounce;
        } else if (type === 'base') {
          targetX = mouseX + sin(frameCount * 0.05 + i * 0.2) * 150;
          let individualBounce = bounce * (1.8 + (g.off % 6.4)); 
          targetY = mouseY + cos(frameCount * 0.2) * 50 - individualBounce;
        } else if (type === 'drum') {
          targetX = mouseX + random(-120, 220);
          let individualBounce = bounce * (0.25 + random(0, 1.5));
          targetY = mouseY + random(-120, 120) - individualBounce;
        }
      } else {
        // [복귀 모드] 원래 자리 + 흔들림 + 박자 튀어오름
        targetX = g.baseX + idleX;
        targetY = g.baseY + idleY - bounce; 
      }
      
      // 3. 점프/탄성 효과
      let jumpHeight = sin(frameCount * 0.2 + g.off * 10) * 8;
      let kick = 0;
      if (type === 'drum') {
        let time = (frameCount * 0.25 + g.off * 5) % 100;
        if (time < 15) kick = -sin((time / 15) * PI) * 50;
      }
      
      // 4. 위치 갱신 (솔로 아닐 땐 살짝 더 부드럽게)
      let lerpVal = isSolo ? 0.1 : 0.05;
      g.x = lerp(g.x, targetX, lerpVal);
      g.y = lerp(g.y, targetY + jumpHeight + kick, lerpVal);
// 5. 그리기
      push();
      translate(g.x, g.y);
      
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(0, 0, 0, 30);
      
      noStroke();
      fill(type === 'guitar' ? pastelColors[0] : (type === 'base' ? pastelColors[1] : pastelColors[2]));
      
      let s = g.s + (isSolo ? beatPulse * 0.5 : 0);
      
// 
      if (g.type === 'guitar') {
        ellipse(0, 0, s, s * 3.0); // 기타: 세로로 길쭉
      } else if (g.type === 'base') {
        rectMode(CENTER);
        rect(0, 0, s * 2.6, s * 1.0, s * 0.8); // 베이스: 가로로 길쭉
      } else {
        ellipse(0, 0, s * 1.5, s * 1.5); // 드럼: 크기 키움
      }
      // 
      fill(255, 255, 255, 150);
      ellipse(-s * 0.15, -s * 0.15, s * 0.3, s * 0.3);
      pop();
    } // [세션 반복문 끝]
  } 

  // 6. 볼륨 믹싱
  if (isStarted) {
    let isSolo = nearType !== null;
    song.setVolume(lerp(song.getVolume(), isSolo ? 0.05 : 1.0, 0.1));
    guitarSong.setVolume(lerp(guitarSong.getVolume(), nearType === 'guitar' ? 1.5 : 0, 0.1));
    baseSong.setVolume(lerp(baseSong.getVolume(), nearType === 'base' ? 1.5 : 0, 0.1));
    drumSong.setVolume(lerp(drumSong.getVolume(), nearType === 'drum' ? 1.5 : 0, 0.1));
  }
}
function mousePressed() { userStartAudio(); }
function drawPinkGuide(x, y) {
  push(); translate(x, y); noStroke();
  let pulse = 1.0 + sin(frameCount * 0.1) * 0.2;
  fill(255, 255, 255, 200); ellipse(0, 0, 40 * pulse, 50 * pulse);
  let pinks = [color('#FFC1CC'), color('#FF99AA'), color('#FF7788')];
  for(let i=0; i<3; i++) {
    fill(red(pinks[i]), green(pinks[i]), blue(pinks[i]), i===2 ? 80 : 120);
    ellipse(0, 0, (40 + i*10)*pulse, (45 + i*15)*pulse);
  }
  fill(255, 255, 255, 180); ellipse(0, -10, 10, 10);
  pop();
}

function createFireworks(centerX, centerY) {
  let colors = [color(255, 255, 100), color(255, 150, 200), color(150, 255, 255), color(255, 255, 255)];
  for (let i = 0; i < 400; i++) {
    let angle = random(TWO_PI);
    let speed = random(5, 28);
    fireworks.push({ 
        x: centerX, y: centerY, 
        vx: cos(angle) * speed, 
        vy: sin(angle) * speed, 
        size: random(5, 12), 
        col: random(colors), 
        life: 255 
    });
  }
}

function drawParticleStyleMe(x, y) {
  push(); translate(x, y); noStroke();
  let pulse = 1.3 + sin(frameCount * 0.13) * 0.4;
  fill(255, 255, 255, 220); ellipse(0, 0, 40 * pulse, 50 * pulse);
  let customColors = [pastelColors[0], color('#9FFF6F'), pastelColors[2]];
  for(let i=0; i<3; i++) {
    fill(red(customColors[i]), green(customColors[i]), blue(customColors[i]), i===2 ? 100 : map(i,0,2,40,80));
    ellipse(0, 0, (45 + i*12)*pulse, (50 + i*18)*pulse);
  }
  fill(255, 255, 255, 180); ellipse(0, -15, 14, 14);
  pop();
}

function drawBottomBars() {
  let level = amplitude.getLevel();
  let targetBeat = level * 400; 

  for (let b of bottomBars) {
    let randomMultiplier = 0.5 + (b.offset % 1.0); 
    let wave = sin(frameCount * b.speed + b.offset) * 15;
    let targetH = b.baseHeight + wave + (targetBeat * randomMultiplier);

    if (!b.currentH) b.currentH = b.baseHeight;
    b.currentH = lerp(b.currentH, targetH, 0.1);

    // 동그라미와 막대기 사이의 간격
    let gap = 15; 
    let topY = (height - b.currentH / 2 + 20) - (b.currentH / 2) - gap;

    push();
    noStroke();
    
    // 막대기 그리기
    fill(255, 200, 210, 150); 
    rectMode(CENTER);
    rect(b.x, height - b.currentH / 2 + 20, 15, b.currentH, 8);
    
    // 동그라미 그리기 
    fill(255, 220, 230, 220); 
    ellipse(b.x, topY, 18, 18); // 크기를 살짝 키우면 더 귀여워요!
    
    pop();
  }
}

function drawGrain() {
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    let grain = random(-20, 20);
    pixels[i] += grain;     // R
    pixels[i+1] += grain;   // G
    pixels[i+2] += grain;   // B
  }
  updatePixels();
}