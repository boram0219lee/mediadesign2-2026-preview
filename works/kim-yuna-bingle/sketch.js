const W = 1280, H = 720;
const cx = W / 2, cy = H / 2;
const orbitRadius = 160;
const segmentCount = 8;
const sizes = [44, 42, 40, 38, 36, 34, 32, 30];
const BPM = 160;
const margin = 120;
const numBuildings = 25;

let recordAngle = 0, recordVelocity = 0, dragging = false, prevMouseAngle = 0;
let wanderAngle = 0, wanderX = cx, wanderY = cy;
let segments = [];
let palettes = [], currentPalette;
let recordImg, faceNormal, faceHappy, cursorImg, myFont, mySound;
let state = 'WANDERING'; 
let buildings = [];
let attachedTime = 0; 

function preload() {
  recordImg = loadImage("pink_record.png");
  faceNormal = loadImage("caterpillar_face.png");
  faceHappy = loadImage("caterpillar_smile.png"); // 이 이미지가 행복한 얼굴로 바뀜
  mySound = loadSound("music.mp3");
}

function setup() {
  createCanvas(W, H);
  noCursor();
  // ColorMode를 HSB로 유지하되 Glow를 위해 투명도를 활성화
  colorMode(HSB, 360, 180, 100, 100);
  palettes = [[color(95, 120, 90), color(55, 160, 100), color(10, 150, 100)], [color(320, 150, 100), color(190, 140, 100), color(280, 140, 100)], [color(40, 160, 100), color(120, 140, 90), color(350, 130, 100)]];
  currentPalette = random(palettes);
  noStroke();
  wanderX = random(0, W); wanderY = random(0, H);
  for (let i = 0; i < segmentCount; i++) segments.push(createVector(wanderX - i * 25, wanderY));
  for (let i = 0; i < numBuildings; i++) {
    let wave = sin(map(i, 0, numBuildings, 0, TWO_PI * 3));
    buildings.push({ angle: (i / numBuildings) * TWO_PI, baseHeight: 80 + wave * 40, type: i % 3 });
  }
}

  function draw() {
  // --- [배경 로직 추가] ---
  if (!mySound.isPlaying()) {
    // 1. 재생 전: 하늘색 배경
    background(200, 30, 100); 
    // 2. 핫핑크 땡땡이 (폴카 도트) 그리기
    fill(330, 80, 100, 50); // 옅은 오퍼시티 핫핑크
    noStroke();
    for (let x = -20; x < width + 20; x += 40) {
      for (let y = -20; y < height + 20; y += 40) {
        let offset = (y % 80 === 0) ? 0 : 20; 
        ellipse(x + offset, y, 20, 20);
      }
    }
  } else {
    // 3. 재생 중: 흰색 배경
    background(255);
  }
  let kick = mySound.isPlaying() ? pow(max(0, sin((millis() / 1000) / (33 / BPM) * PI)), 10) : 0;
  if (frameCount % 20 === 0) currentPalette = random(palettes);

  updateLogic();
  updateSegments();

  drawRecord(kick);

  // 빌딩 레이어
  if (mySound.isPlaying()) {
    push(); translate(cx, cy); rotate(-recordAngle * 0.2);
    for (let b of buildings) {
      push(); rotate(b.angle);
      let h = b.baseHeight + kick * 100;
      translate(180, 0); drawBuilding(h, b.type);
      pop();
    }
    pop();
  }

  // 애벌레 그리기 (호흡 및 빛 효과 적용)
  let breathe = (state === 'BREATHING') ? sin(frameCount * 0.1) * 3 : 0;
  
  // 빛(Glow) 효과 구현: 겉에 부드러운 원을 겹쳐 그리기
  if (state === 'BREATHING') {
    for (let i = 0; i < segments.length; i++) {
      push();
      translate(segments[i].x, segments[i].y);
      // 부드럽게 빛나는 효과를 위해 투명도가 높은 원을 여러 번 그림
      for (let j = 10; j > 0; j--) {
        // HSB 모드에서 Glow 구현: S를 낮추고 B를 높여 흰 빛에 가깝게 만듦
        let col = color(hue(currentPalette[0]), saturation(currentPalette[0]) * 0.3, 100, j * 3); 
        fill(col);
        ellipse(0, 0, (sizes[i] + breathe) * 1.2 + j * 3, sizes[i] + breathe + j * 3);
      }
      pop();
    }
  }

  // 원래 애벌레 몸통
  for (let i = 0; i < segments.length - 1; i++) drawCapsule(segments[i], segments[i + 1], 28 + breathe, currentPalette[0]);
  for (let i = segments.length - 1; i >= 0; i--) {
    fill(currentPalette[0]); ellipse(segments[i].x, segments[i].y, (sizes[i] + breathe) * 1.2, sizes[i] + breathe);
    fill(currentPalette[2]); drawTexture(segments[i].x, segments[i].y, sizes[i]);
  }

  // 얼굴 (상태에 따라 이미지 변경)
  push();
  translate(segments[0].x, segments[0].y);
  rotate(p5.Vector.sub(segments[0], segments[1]).heading()); 
  imageMode(CENTER);
  
  // --- [얼굴 변경 로직 수정] ---
  // 유영 중에는 Normal, LP에 붙거나 숨 쉬거나 꿈틀거릴 때는 Happy
  let faceToDraw = (state === 'WANDERING') ? faceNormal : faceHappy;
  image(faceToDraw, 0, 0, 50 + breathe, 50 + breathe);
  
  pop();
  
  // draw() 함수의 맨 마지막 줄 (반드시 가장 마지막에 그려야 다른 요소 위에 보입니다.)
  
if (!mySound.isPlaying()) {
    push(); translate(cx, cy);
    fill(255); noStroke(); ellipse(0, 0, 60, 60);
    fill(200, 30, 100); triangle(-10, -15, -10, 15, 15, 0);
    pop();
  }
  
  // --- [새로운 커서 코드: 형광 노란색 별] ---
  push();
  translate(mouseX, mouseY); // 마우스 위치로 이동
  rotate(frameCount * 0.05); // 커서가 살짝 회전하게 해서 눈에 잘 띄게 함 (선택 사항)
  
  // 형광 노란색 설정 (HSB 모드이므로 H:60, S:100, B:100, Alpha:100)
  fill(60, 100, 100); 
  noStroke();
  
  // 별 그리기 함수 호출 (radius1: 겉 반지름, radius2: 속 반지름, npoints: 꼭짓점 수)
  drawStar(0, 0, 15, 7, 5); 
  pop();
  // ----------------------------------------
}

function updateLogic() {
  if (!dragging && state === 'WANDERING') {
    // 1. 좀 더 자유로운 움직임을 위해 각도 변화 범위를 다시 넓힘
    wanderAngle += random(-0.15, 0.15); 
    
    // 2. 부드러운 전진
    wanderX += cos(wanderAngle) * 5.0; 
    wanderY += sin(wanderAngle) * 5.0;
    
    // 3. [개선] 모서리 고착 방지: 벽 근처라면 무조건 중심 방향으로 '강한 힘' 추가
    // 벽에 닿았을 때 단순히 미끄러지는 게 아니라, 각도 자체를 중심부로 확 돌려버립니다.
    let margin = 80;
    if (wanderX < margin || wanderX > W - margin || wanderY < margin || wanderY > H - margin) {
      // 중심을 향하는 각도를 계산하고, 거기에 약간의 랜덤함을 더해 멈춤 방지
      let angleToCenter = atan2(cy - wanderY, cx - wanderX);
      wanderAngle = lerp(wanderAngle, angleToCenter, 0.1); 
    }
    
    // 4. 아주 가끔씩 강제로 방향을 전환해주는 '탈출기' 추가 (멈춤 방지)
    if (frameCount % 300 === 0) {
      wanderAngle += PI;
    }
    
  } else if (!dragging && !mySound.isPlaying() && state !== 'WANDERING') {
    state = 'WANDERING';
  }

  // ... (이후 ATTACHED, BREATHING, WIGGLE 로직은 그대로)
  if (state !== 'WANDERING') {
    if (mySound.isPlaying()) {
      recordVelocity = 0.02; recordAngle += recordVelocity; recordVelocity *= 0.75;
    }
    let wiggle = (state === 'WIGGLE') ? sin(frameCount * 0.2) * 20 : 0;
    wanderX = cx + cos(recordAngle + 1.6) * (175 + wiggle);
    wanderY = cy + sin(recordAngle + 1.6) * (175 + wiggle);
    if (state === 'ATTACHED' && millis() - attachedTime > 5000) state = 'BREATHING';
  }
}

function updateSegments() {
  let speed = (state === 'WIGGLE') ? 0.2 : 0.15;
  segments[0].x = lerp(segments[0].x, wanderX, speed);
  segments[0].y = lerp(segments[0].y, wanderY, speed);
  for (let i = 1; i < segmentCount; i++) {
    let dir = p5.Vector.sub(segments[i - 1], segments[i]);
    dir.setMag(24);
    segments[i].x = segments[i - 1].x - dir.x;
    segments[i].y = segments[i - 1].y - dir.y;
  }
}

function mousePressed() {
  if (state === 'WANDERING' && dist(mouseX, mouseY, cx, cy) < orbitRadius * 2.0) {
    mySound.play(); 
    state = 'ATTACHED'; 
    attachedTime = millis();
    
    // [수정] 음악을 10초(10000ms) 뒤에 강제로 멈추고 WANDERING으로 전환
    setTimeout(() => {
      if (mySound.isPlaying()) {
        mySound.stop();
        state = 'WANDERING';
      }
    }, 15000); 
    
  } else if (state === 'BREATHING' && dist(mouseX, mouseY, segments[0].x, segments[0].y) < 60) {
    state = 'WIGGLE';
  }
  
  dragging = true; 
  prevMouseAngle = atan2(mouseY - cy, mouseX - cx);
}
function mouseDragged() { if (!dragging) return; let ang = atan2(mouseY - cy, mouseX - cx); recordVelocity = ang - prevMouseAngle; recordAngle += recordVelocity; prevMouseAngle = ang; }
function mouseReleased() { dragging = false; }
function drawRecord(kick) { push(); translate(cx, cy); rotate(recordAngle); imageMode(CENTER); recordImg ? image(recordImg, 0, 0, 300 + kick * 40, 300 + kick * 40) : circle(0, 0, 300 + kick * 40); pop(); }
function drawCapsule(a, b, thickness, col) { let dir = p5.Vector.sub(b, a); push(); translate(a.x, a.y); rotate(dir.heading()); fill(col); rect(0, -thickness/2, dir.mag(), thickness, thickness / 2); pop(); }
function drawTexture(x, y, size) { for (let i = 0; i < 10; i++) { fill(0, 0, 100, 40); circle(x + random(-size * 0.3, size * 0.3), y + random(-size * 0.3, size * 0.3), random(2, 5)); } }
function drawBuilding(h, type) { fill(200, 30, 100, 70); if (type === 0) rect(0, -15, h, 30, 5); else if (type === 1) { triangle(0, -10, h, 0, 0, 10); rect(0, -5, h * 0.7, 10); } else ellipse(h/2, 0, h, 30); }


function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius1;
    let sy = y + sin(a) * radius1;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius2;
    sy = y + sin(a + halfAngle) * radius2;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}