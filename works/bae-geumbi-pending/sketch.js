// ─── Web Serial API ───────────────────────────────────────────
let serialPort = null;
let serialReader = null;
let serialBuffer = '';
let serialConnected = false;
let sensorHeld = [false, false, false, false, false];

let currentRoom = 0;
let buttons = [];
let touchEffects = [];

// Audio 엔진
let audioCtx;
let nextNoteTime = 0;
let currentStep = 0;
const TEMPO = 128;
let bassEnergy = 0;
let midEnergy = 0;

// Room environments
let room1Dots = [];
let room2Tubes = []; 
let room3Grid = [], r3_blinkTimer, r3_stepTimer;
let room4Particles = [];
let room5Bokeh = [], room5Voids = [];

// Room2 클릭 리액션 애니메이션 변수
let r2_burstT = 0;

// Room4 creature
let c4_pos, c4_vel, c4_state, c4_timer;

// Room5
let c5_pos, c5_targetPos;

// Main BG Decoration (회색 동심원)
let bgCircles = [];

// 16:9 고정 가상 해상도 선언
const V_WIDTH = 1920;
const V_HEIGHT = 1080;

// 실제 고정 비율 렌더링 스케일 및 오프셋 변수
let renderScale = 1;
let offsetX = 0;
let offsetY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  calculateScale();

  // ── 5개 메인 포탈 링 정의 (웅장한 메인 비주얼 볼륨감) ──
  const btn1Rings = [
    {c:'#e8c400',t:45},{c:'#fff5a0',t:15},{c:'#f5d800',t:60},{c:'#fffde0',t:12},
    {c:'#d4b000',t:45},{c:'#fff5a0',t:15},{c:'#f0cc00',t:30},{c:'#fffde0',t:8}
  ];
  const btn2Rings = [
    {c:'#8b2fc9',t:35},{c:'#f4a0c8',t:12},{c:'#c060e0',t:50},{c:'#ffc0e0',t:15},
    {c:'#7020a0',t:40},{c:'#f080b8',t:10},{c:'#a040c8',t:25},{c:'#ffe0f0',t:12}
  ];
  const btn3Rings = [
    {c:'#1a7a20',t:40},{c:'#60c8f0',t:15},{c:'#2ea030',t:55},{c:'#a0e8ff',t:12},
    {c:'#0e5c14',t:45},{c:'#40b0e0',t:18},{c:'#3cbc40',t:25},{c:'#c0f0ff',t:10}
  ];
  const btn4Rings = [
    {c:'#5c1a9a',t:48},{c:'#50e0c0',t:18},{c:'#8030cc',t:65},{c:'#90f0d8',t:12},
    {c:'#40108c',t:50},{c:'#30c8a8',t:15},{c:'#9040e0',t:35},{c:'#b0fff0',t:12}
  ];
  const btn5Rings = [
    {c:'#f0a000',t:42},{c:'#c8e840',t:15},{c:'#e06000',t:58},{c:'#e8ff80',t:12},
    {c:'#f8c800',t:45},{c:'#a0c800',t:18},{c:'#e87800',t:30},{c:'#f0ff90',t:10}
  ];

  // 메인 원 5개 배치
  const btnData = [
    { num:1, x: V_WIDTH * 0.23, y: V_HEIGHT * 0.32, r: 295, ringDefs:btn1Rings },
    { num:2, x: V_WIDTH * 0.50, y: V_HEIGHT * 0.23, r: 265, ringDefs:btn2Rings },
    { num:3, x: V_WIDTH * 0.77, y: V_HEIGHT * 0.34, r: 290, ringDefs:btn3Rings },
    { num:4, x: V_WIDTH * 0.32, y: V_HEIGHT * 0.72, r: 315, ringDefs:btn4Rings },
    { num:5, x: V_WIDTH * 0.68, y: V_HEIGHT * 0.70, r: 305, ringDefs:btn5Rings },
  ];
  for (let b of btnData) buttons.push({ ...b, baseR: b.r });

  // 배경 회색 데코 서클 맵핑 데이터
  const greys = ['#c8c8c8','#b0b0b0','#989898','#e0e0e0','#d4d4d4','#a8a8a8','#888888'];
  const decoData = [
    {x: V_WIDTH*0.5,  y: V_HEIGHT*0.55, r:150, th:[24,8,36,10,20,6,28]},
    {x: V_WIDTH*0.12, y: V_HEIGHT*0.6,  r:120, th:[16,6,24,8,14,4,18]},
    {x: V_WIDTH*0.88, y: V_HEIGHT*0.65, r:130, th:[20,8,30,8,18,6,24]},
    {x: V_WIDTH*0.38, y: V_HEIGHT*0.15, r:105, th:[14,6,22,6,12,4,16]},
    {x: V_WIDTH*0.65, y: V_HEIGHT*0.18, r:110, th:[16,6,24,6,14,4,18]},
    {x: V_WIDTH*0.28, y: V_HEIGHT*0.48, r:95,  th:[12,4,18,5,10,3,14]},
    {x: V_WIDTH*0.72, y: V_HEIGHT*0.5,  r:100, th:[14,5,20,5,12,4,16]}
  ];

  for (let d of decoData) {
    let ringDefs = [];
    let totalR = d.r;
    for (let ti = 0; ti < d.th.length && totalR > 0; ti++) {
      let c1 = greys[ti % greys.length];
      let c2 = greys[(ti + 3) % greys.length];
      ringDefs.push({ c: (ti % 2 === 0) ? c1 : c2, t: d.th[ti] });
      totalR -= d.th[ti];
    }
    bgCircles.push({
      x: d.x, y: d.y, r: d.r, ringDefs: ringDefs,
      seed: random(10000), speed: random(0.001, 0.002),
    });
  }

  createRoom1Environment();
  createRoom2Environment();
  createRoom3Environment();
  createRoom4Environment();
  createRoom5Environment();
  initRooms();
}

function calculateScale() {
  let windowRatio = windowWidth / windowHeight;
  let virtualRatio = V_WIDTH / V_HEIGHT;
  if (windowRatio > virtualRatio) {
    renderScale = windowHeight / V_HEIGHT;
    offsetX = (windowWidth - V_WIDTH * renderScale) / 2;
    offsetY = 0;
  } else {
    renderScale = windowWidth / V_WIDTH;
    offsetX = 0;
    offsetY = (windowHeight - V_HEIGHT * renderScale) / 2;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateScale();
}

function draw() {
  bassEnergy *= 0.85;
  midEnergy  *= 0.82;

  background(25, 25, 25);

  push();
  translate(offsetX, offsetY);
  scale(renderScale);

  // 가상 영역 테두리
  stroke(0);
  noFill();
  rect(0, 0, V_WIDTH, V_HEIGHT);

  if (currentRoom === 0) {
    background(255);
    drawMainScreen();
  } else if (currentRoom === 1) {
    background(250, 248, 240);
    drawRoom1Environment();
  } else if (currentRoom === 2) {
    background(246, 242, 232); // 포스터의 부드러운 아이보리 스킨 톤 배경
    drawRoom2Environment();
    updateRoom2();
  } else if (currentRoom === 3) {
    background(16);
    drawRoom3Environment();
    updateRoom3();
  } else if (currentRoom === 4) {
    background(250, 250, 255);
    drawRoom4Environment();
    updateRoom4();
  } else if (currentRoom === 5) {
    background(255);
    drawRoom5Environment();
    updateRoom5();
  }

  drawTouchEffects();
  drawSerialButton();
  pop();
}

function drawVariableRings(cx, cy, totalR, ringDefs, radiusScale, isBg) {
  let scale = radiusScale || 1;
  let curR = totalR * scale;
  noStroke();
  for (let rd of ringDefs) {
    if (curR <= 0) break;
    let col = color(rd.c);
    if (isBg) col.setAlpha(70); // 사형의 피드백 반영: 배경 그레이 원 좀 더 진하게 수정
    fill(col);
    ellipse(cx, cy, curR * 2, curR * 2);
    curR -= rd.t * scale;
  }
  if (curR > 0 && ringDefs.length > 0) {
    let lastCol = color(ringDefs[ringDefs.length - 1].c);
    if (isBg) lastCol.setAlpha(70);
    fill(lastCol);
    ellipse(cx, cy, curR * 2, curR * 2);
  }
}

function drawMainScreen() {
  push();
  for (let b of bgCircles) {
    let t = frameCount * b.speed;
    let ox = map(noise(b.seed + t), 0, 1, -6, 6);
    let oy = map(noise(b.seed + 500 + t), 0, 1, -6, 6);
    drawVariableRings(b.x + ox, b.y + oy, b.r, b.ringDefs, 1, true);
  }
  pop();

  for (let b of buttons) {
    let bounce = (b.num === 1 || b.num === 4)
      ? map(bassEnergy, 0, 255, 0, 30) : map(midEnergy, 0, 255, 0, 22);
    let r = b.r + bounce;
    let scale = r / b.baseR;
    drawVariableRings(b.x, b.y, r, b.ringDefs, scale, false);
  }
}

// ─── AUDIO ENGINE ─────────────────────────────────────────────
function startAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    nextNoteTime = audioCtx.currentTime;
    setInterval(scheduler, 25);
  } else if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    scheduleNote(currentStep, nextNoteTime);
    nextNoteTime += 0.25 * (60.0 / TEMPO);
    currentStep = (currentStep + 1) % 16;
  }
}

function scheduleNote(step, time) {
  if (step % 4 === 0) playSynthKick(time);
  if (step % 4 === 2) playSynthHat(time);
  playSynthBass(step, time);
}

function playSynthKick(time) {
  let o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.setValueAtTime(140, time);
  o.frequency.exponentialRampToValueAtTime(0.01, time + 0.25);
  g.gain.setValueAtTime(1.0, time); g.gain.linearRampToValueAtTime(0, time + 0.25);
  o.start(time); o.stop(time + 0.25);
  bassEnergy = 255;
}

function playSynthHat(time) {
  let buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.04, audioCtx.sampleRate);
  let d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  let n = audioCtx.createBufferSource(); n.buffer = buf;
  let f = audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
  let g = audioCtx.createGain(); g.gain.setValueAtTime(0.18, time); g.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
  n.connect(f); f.connect(g); g.connect(audioCtx.destination);
  n.start(time); n.stop(time + 0.04);
  midEnergy = 200;
}

const MELODY = [55,55,62,55,58,58,65,58,60,60,67,60,58,55,50,48];
function playSynthBass(step, time) {
  let o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle'; o.connect(g); g.connect(audioCtx.destination);
  o.frequency.setValueAtTime(Math.pow(2, (MELODY[step]-69)/12)*440, time);
  g.gain.setValueAtTime(0.15, time); g.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  o.start(time); o.stop(time + 0.08);
}

function playRoomSound(n) {
  if (!audioCtx) startAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  let now = audioCtx.currentTime;
  if (n === 1) {
    let o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(350,now);o.frequency.exponentialRampToValueAtTime(65,now+0.65);
    g.gain.setValueAtTime(0.4,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.65);
    o.start(now);o.stop(now+0.65);
  } else if (n === 2) {
    [880,1109,1318].forEach((f,i)=>{
      let o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.connect(g);g.connect(audioCtx.destination);
      o.frequency.setValueAtTime(f,now+i*0.07);
      g.gain.setValueAtTime(0.25,now+i*0.07);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.07+0.12);
      o.start(now+i*0.07);o.stop(now+i*0.07+0.12);
    });
  } else if (n === 3) {
    let o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(180,now);o.frequency.exponentialRampToValueAtTime(40,now+0.18);
    g.gain.setValueAtTime(0.9,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.18);
    o.start(now);o.stop(now+0.18);
  } else if (n === 4) {
    [1047,1319,1568,2093,2637,3136].forEach((f,i)=>{
      let o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.connect(g);g.connect(audioCtx.destination);
      o.frequency.setValueAtTime(f,now+i*0.04);
      g.gain.setValueAtTime(0.18,now+i*0.04);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.04+0.1);
      o.start(now+i*0.04);o.stop(now+i*0.04+0.1);
    });
  } else if (n === 5) {
    [783.99,785.5].forEach(f=>{
      let o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.connect(g);g.connect(audioCtx.destination);
      o.frequency.setValueAtTime(f,now);
      g.gain.setValueAtTime(0.28,now);g.gain.exponentialRampToValueAtTime(0.001,now+1.2);
      o.start(now);o.stop(now+1.2);
    });
  }
}

function mousePressed() {
  let mx = (mouseX - offsetX) / renderScale;
  let my = (mouseY - offsetY) / renderScale;
  if (mx < 0 || mx > V_WIDTH || my < 0 || my > V_HEIGHT) return;

  if (mx > V_WIDTH-140 && mx < V_WIDTH-20 && my > 20 && my < 60) {
    connectSerial();
    return;
  }
  createTouchEffect(mx, my);
  startAudio();

  if (currentRoom === 0) {
    for (let b of buttons) {
      if (dist(mx, my, b.x, b.y) < b.r) {
        currentRoom = b.num; initRooms(); playRoomSound(b.num); return;
      }
    }
  } else {
    // 사형의 요청에 따라 화면상의 뒤로가기 마우스 트리거를 삭제했습니다.
    playRoomSound(currentRoom);

    if (currentRoom === 1) {
      for (let d of room1Dots) {
        let dtc = dist(mx, my, d.x, d.y);
        if (dtc < 350) {
          let a = atan2(d.y-my, d.x-mx);
          d.vx = cos(a)*map(dtc,0,350,80,15);
          d.vy = sin(a)*map(dtc,0,350,80,15);
        }
      }
    }
    if (currentRoom === 2) {
      r2_burstT = 1.0; 
    }
    if (currentRoom === 3) {
      r3_blinkTimer = 18;
    }
    if (currentRoom === 4 && c4_state === 'WANDER') {
      c4_state = 'FLEE';
      let tx = mx>V_WIDTH/2?50:V_WIDTH-50, ty = my>V_HEIGHT/2?150:V_HEIGHT-50;
      let a = atan2(ty-c4_pos.y, tx-c4_pos.x);
      c4_vel = createVector(cos(a)*25, sin(a)*25);
    }
    if (currentRoom === 5) {
      room5Voids.push({x:mx,y:my,size:45,alpha:255});
      c5_targetPos = createVector(mx,my);
    }
  }
}

// ─── UI ELEMENTS ─────────────────────────────────────────────
function drawTouchEffects() {
  push();
  const glowMap = {2:[255,20,40],3:[255,92,141],4:[168,85,247],5:[255,255,255]};
  for (let i = touchEffects.length-1; i >= 0; i--) {
    let e = touchEffects[i];
    let rgb = glowMap[currentRoom]||[0,0,0];
    let gc = color(rgb[0],rgb[1],rgb[2],e.alpha);
    drawingContext.shadowBlur=25; drawingContext.shadowColor=gc;
    noFill(); stroke(gc); strokeWeight(3.5);
    ellipse(e.x,e.y,e.size,e.size);
    e.size+=9; e.alpha-=11;
    if (e.alpha<=0) touchEffects.splice(i,1);
  }
  pop();
}
function createTouchEffect(x,y) { touchEffects.push({x,y,size:15,alpha:220}); }

function initRooms() {
  r3_stepTimer = 0; r3_blinkTimer = 0;
  c4_pos = createVector(V_WIDTH/2, V_HEIGHT/2);
  c4_vel = createVector(random(-1,1), random(-1,1)).normalize().mult(9);
  c4_state = 'WANDER'; c4_timer = 0;
  c5_pos = createVector(V_WIDTH/2, V_HEIGHT/2);
  c5_targetPos = c5_pos.copy();
  r2_burstT = 0;
}

// ─── ROOM 1 (스케일업 및 요소 확장) ───────────────────────────────
function createRoom1Environment() {
  room1Dots = [];
  let sc = createVector(V_WIDTH/2, V_HEIGHT/2);
  for (let i = 0; i < 950; i++) {
    let a=random(TWO_PI), r=pow(random(1),0.65)*420;
    room1Dots.push({
      homeX:sc.x+cos(a)*r, homeY:sc.y+sin(a)*r, 
      x:sc.x+cos(a)*r, y:sc.y+sin(a)*r, 
      vx:0, vy:0, seed:random(10000), 
      size:random(18, 42) // 사형의 피드백 반영: 요소들 크기 대폭 상향 수정
    });
  }
}
function drawRoom1Environment() {
  push(); noStroke(); fill(30);
  for (let d of room1Dots) {
    let sx=map(noise(d.seed+frameCount*0.2),0,1,-3.5,3.5);
    let sy=map(noise(d.seed+1500+frameCount*0.2),0,1,-3.5,3.5);
    d.x+=d.vx; d.y+=d.vy; d.vx*=0.90; d.vy*=0.90;
    d.x=lerp(d.x,d.homeX,0.05); d.y=lerp(d.y,d.homeY,0.05);
    ellipse(d.x+sx, d.y+sy, d.size, d.size);
  }
  pop();
}

// ─── ROOM 2 (완전 비비드 색감 + 원뿔 쐐기 구조 전면 개편) ───
function createRoom2Environment() {
  room2Tubes = [];
  // 강렬하고 쨍한 포스터 고유의 완전 원색 비비드 컬러칩 추출 세팅
  let vividPosterColors = [
    {bg: '#ff1a2b', cap: ['#ffffff', '#ff1a2b']}, // 울트라 레드
    {bg: '#ffb300', cap: ['#1a335c', '#ffb300']}, // 브라이트 골드 옐로우
    {bg: '#3aa6ff', cap: ['#0033cc', '#3aa6ff']}, // 네온 스카이블루
    {bg: '#00cc44', cap: ['#003300', '#00cc44']}, // 비비드 그린
    {bg: '#a64dff', cap: ['#330066', '#a64dff']}, // 일렉트릭 퍼플
    {bg: '#ff4da6', cap: ['#1a1a1a', '#ff4da6']}, // 핫 핑크
    {bg: '#0f2042', cap: ['#ffffff', '#0f2042']}  // 오리지널 다크네이비
  ];

  let numTubes = 38;
  for (let i = 0; i < numTubes; i++) {
    let angle = map(i, 0, numTubes, 0, TWO_PI) + random(-0.08, 0.08);
    let config = random(vividPosterColors);
    room2Tubes.push({
      angle: angle,
      baseLength: random(250, 520), 
      thick: random(25, 60), // 원뿔 기저면 두께 스케일업
      colorData: config,
      speedPhase: random(100)
    });
  }
}

function drawRoom2Environment() {
  let cx = V_WIDTH / 2;
  let cy = V_HEIGHT / 2;

  r2_burstT = lerp(r2_burstT, 0, 0.06);

  let bassPulse = map(bassEnergy, 0, 255, 0.95, 1.18);
  let midPulse = map(midEnergy, 0, 255, 0, 35);

  push();
  for (let t of room2Tubes) {
    let rhythm = sin(frameCount * 0.07 + t.speedPhase) * 18;
    let currentLen = (t.baseLength * bassPulse) + rhythm + (r2_burstT * 420);
    
    // 외곽 원형 캡의 중심 좌표
    let endX = cx + cos(t.angle) * currentLen;
    let endY = cy + sin(t.angle) * currentLen;

    // 양 꼭짓점 법선 벡터 계산 (중앙점에서는 폭이 0이 되고 바깥으로 갈수록 벌어지는 완전한 원뿔 구조)
    let perpAngle = t.angle + HALF_PI;
    let halfThick = t.thick * 0.5;
    
    let x2 = endX + cos(perpAngle) * halfThick;
    let y2 = endY + sin(perpAngle) * halfThick;
    let x3 = endX - cos(perpAngle) * halfThick;
    let y3 = endY - sin(perpAngle) * halfThick;

    // 중앙 꼭짓점(cx, cy) 하나로 완벽하게 수렴하는 삼각형 쐐기 렌더링
    noStroke();
    fill(t.colorData.bg);
    triangle(cx, cy, x2, y2, x3, y3);

    // 원형 캡 그래픽 디테일 맵핑
    push();
    translate(endX, endY);
    rotate(t.angle);
    fill(t.colorData.cap[0]);
    ellipse(0, 0, t.thick * 1.35 + (midPulse * 0.35), t.thick * 1.35 + (midPulse * 0.35));
    fill(t.colorData.cap[1]);
    ellipse(0, 0, t.thick * 0.72, t.thick * 0.72);
    pop();
  }

  // 완벽한 한 점 집중을 위한 마감 미니 도트 코어
  fill(20);
  ellipse(cx, cy, 12, 12);
  pop();
}

function updateRoom2() {}

// ─── ROOM 3 ──────────────────────────────────────────────────
function createRoom3Environment() {
  room3Grid = [];
  let cells = [
    { gx: 4, gy: 3, type: "main" }, { gx: 7, gy: 3, type: "stripeH" }, { gx: 9, gy: 4, type: "dots" },
    { gx: 5, gy: 6, type: "checker" }, { gx: 12, gy: 5, type: "mainSmall" }, { gx: 3, gy: 8, type: "stripeH" },
    { gx: 10, gy: 8, type: "stripeV" }, { gx: 14, gy: 4, type: "checkerBlue" }, { gx: 6, gy: 9, type: "stripeV" },
    { gx: 11, gy: 2, type: "dotsRed" }, { gx: 15, gy: 7, type: "mainWarm" }, { gx: 2, gy: 5, type: "stripeV" }, { gx: 13, gy: 9, type: "checkerBlue" }
  ];
  for (let c of cells) { room3Grid.push({ gx: c.gx, gy: c.gy, origGx: c.gx, origGy: c.gy, type: c.type, phase: random(TWO_PI) }); }
}
function drawRoom3Environment() {
  push(); stroke(255, 255, 255, 25); strokeWeight(1); let cellSz = 90;
  for (let x = 0; x <= V_WIDTH; x += cellSz) { line(x, 0, x, V_HEIGHT); }
  for (let y = 0; y <= V_HEIGHT; y += cellSz) { line(0, y, V_WIDTH, y); }
  noStroke();
  for (let tile of room3Grid) { drawRoom3Tile(tile.gx * cellSz, tile.gy * cellSz, cellSz, tile.type); }
  pop();
}
function updateRoom3() {
  r3_stepTimer++;
  if (r3_stepTimer % 25 === 0) {
    for (let tile of room3Grid) {
      let dir = floor(random(5));
      if (dir === 0) tile.gx += 1; else if (dir === 1) tile.gx -= 1; else if (dir === 2) tile.gy += 1; else if (dir === 3) tile.gy -= 1;
      tile.gx = constrain(tile.gx, tile.origGx - 2, tile.origGx + 2); tile.gy = constrain(tile.gy, tile.origGy - 2, tile.origGy + 2);
    }
  }
  if (r3_blinkTimer > 0) r3_blinkTimer--;
}
function drawRoom3Tile(x, y, size, type) {
  push(); let s = size * 0.90; rectMode(CORNER);
  if (type === "main") {
    let visible = r3_blinkTimer <= 0 || frameCount % 6 < 3;
    fill(255, 190, 77); rect(x, y, s, s);
    if (visible) { fill(0, 152, 176); rect(x + 10, y + 10, s - 20, s - 20); fill(42, 205, 185); rect(x + 20, y + 20, s - 40, s - 40); }
  } else if (type === "mainSmall") { fill(255, 186, 73); rect(x, y, s, s); fill(75, 100, 189); rect(x + 15, y + 15, s - 30, s - 30);
  } else if (type === "mainWarm") { fill(241, 80, 94); rect(x, y, s, s); fill(255, 179, 62); rect(x + 15, y + 15, s - 30, s - 30);
  } else if (type === "stripeH") {
    let cols = [color(238, 102, 125), color(61, 165, 213), color(50, 73, 140)];
    for (let i = 0; i < 4; i++) { fill(cols[i % cols.length]); rect(x, y + (s / 4) * i, s, s / 4); }
  } else if (type === "stripeV") {
    let cols = [color(245, 65, 83), color(255, 188, 71), color(43, 202, 179)];
    for (let i = 0; i < cols.length; i++) { fill(cols[i]); rect(x + (s / cols.length) * i, y, s / cols.length, s); }
  } else if (type === "checker" || type === "checkerBlue") {
    let a = type === "checker" ? color(239, 170, 142) : color(87, 163, 226); let b = type === "checker" ? color(82, 70, 82) : color(54, 83, 153); let n = 6;
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { fill((i + j) % 2 === 0 ? a : b); rect(x + (s / n) * i, y + (s / n) * j, s / n, s / n); } }
  } else if (type === "dots" || type === "dotsRed") {
    fill(type === "dots" ? color(87, 174, 222) : color(239, 120, 154)); rect(x, y, s, s); fill(30, 45, 70);
    for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) { ellipse(x + 15 + i * 18, y + 15 + j * 18, 5, 5); } }
  }
  pop();
}

// ─── ROOM 4 (스케일업 및 요소 확장) ───────────────────────────────
function createRoom4Environment() {
  room4Particles = []; let cols = 75, rows = 45; let sx = V_WIDTH / cols, sy = V_HEIGHT / rows;
  for (let i = 0; i < cols; i++) { 
    for (let j = 0; j < rows; j++) { 
      if (random(1) < 0.70) { 
        room4Particles.push({ 
          homeX: i * sx + sx / 2, homeY: j * sy + sy / 2, 
          x: i * sx + sx / 2, y: j * sy + sy / 2, 
          col: random(1) < 0.5 ? color(168, 85, 247, 170) : color(45, 212, 191, 170), 
          seed: random(5000) 
        }); 
      } 
    } 
  }
}
function drawRoom4Environment() {
  push(); noStroke();
  for (let p of room4Particles) {
    let dx = c4_pos.x - p.homeX, dy = c4_pos.y - p.homeY, d = sqrt(dx * dx + dy * dy);
    let ps = c4_state === 'FLEE' ? map(constrain(d, 0, 700), 0, 700, 320, 0) : map(constrain(d, 0, 500), 0, 500, 35, 0);
    let ang = atan2(dy, dx);
    p.x = lerp(p.x, p.homeX + cos(ang) * ps, 0.14); p.y = lerp(p.y, p.homeY + sin(ang) * ps, 0.14);
    fill(p.col); 
    rect(p.x, p.y, 5, 5); // 사형의 피드백 반영: 입자 개별 픽셀 크기 업 스케일
  }
  pop();
}
function updateRoom4() {
  c4_pos.add(c4_vel);
  if (c4_pos.x < 50 || c4_pos.x > V_WIDTH - 50) c4_vel.x *= -1; if (c4_pos.y < 50 || c4_pos.y > V_HEIGHT - 50) c4_vel.y *= -1;
  if (c4_state === 'WANDER' && random(1) < 0.02) c4_vel = createVector(random(-1, 1), random(-1, 1)).normalize().mult(9);
  else if (c4_state === 'FLEE' && (c4_pos.x <= 55 || c4_pos.x >= V_WIDTH - 55 || c4_pos.y <= 55 || c4_pos.y >= V_HEIGHT - 55)) { c4_state = 'COWER'; c4_timer = 120; }
  if (c4_state === 'COWER') { c4_timer--; if (c4_timer <= 0) c4_state = 'WANDER'; }
  let rx = c4_pos.x, ry = c4_pos.y; if (c4_state === 'COWER') { rx += random(-5, 5); ry += random(-5, 5); }
  fill(15); noStroke(); 
  ellipse(rx, ry, 65, 65); // 사형의 피드백 반영: 중앙 에이전트 본체 크기 스케일업
}

// ─── ROOM 5 (스케일업 및 요소 확장) ───────────────────────────────
function createRoom5Environment() {
  room5Bokeh = []; let palette = [color(200, 230, 50, 90), color(255, 220, 0, 90), color(50, 180, 150, 90)];
  for (let i = 0; i < 110; i++) { 
    room5Bokeh.push({ 
      x: random(V_WIDTH), y: random(V_HEIGHT), 
      size: random(40, 110), // 사형의 피드백 반영: 부유 보케 입자 반경 확대
      col: random(palette), seed: random(5000), speed: random(0.002, 0.006) 
    }); 
  }
}
function drawRoom5Environment() {
  push(); noStroke(); drawingContext.shadowBlur = 4;
  for (let b of room5Bokeh) {
    let n = noise(b.seed + frameCount * b.speed);
    fill(b.col); drawingContext.shadowColor = b.col; ellipse(b.x + map(n, 0, 1, -50, 50), b.y + map(noise(b.seed + 1000 + frameCount * b.speed), 0, 1, -50, 50), b.size, b.size);
  }
  drawingContext.shadowBlur = 0;
  for (let i = room5Voids.length - 1; i >= 0; i--) {
    let v = room5Voids[i]; let steps = 6;
    for (let j = steps; j > 0; j--) { fill(255, map(j, 0, steps, 0, v.alpha)); ellipse(v.x, v.y, v.size * (j / steps), v.size * (j / steps)); }
    v.size += 9.5; v.alpha -= 12; if (v.alpha <= 0) room5Voids.splice(i, 1);
  }
  pop();
}
function updateRoom5() {
  let mx = (mouseX - offsetX) / renderScale;
  let my = (mouseY - offsetY) / renderScale;
  c5_pos.x = lerp(c5_pos.x, mx, 0.02); c5_pos.y = lerp(c5_pos.y, my, 0.02);
  push(); translate(c5_pos.x + sin(frameCount * 0.03) * 40, c5_pos.y + cos(frameCount * 0.025) * 30); noStroke(); 
  fill(255, 230, 100, 180); ellipse(0, 0, 85, 85); // 사형의 피드백 반영: 메인 구체 비주얼 스케일업
  fill(255, 255, 255, 200); ellipse(0, 0, 40, 40); 
  pop();
}

// ─── WEB SERIAL API CONTROL ───────────────────────────────────
async function connectSerial() {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialConnected = true;
    readSerial();
  } catch (e) {
    console.warn('Serial connection failed:', e);
  }
}

async function readSerial() {
  const decoder = new TextDecoderStream();
  serialPort.readable.pipeTo(decoder.writable);
  serialReader = decoder.readable.getReader();
  try {
    while (true) {
      const { value, done } = await serialReader.read();
      if (done) break;
      serialBuffer += value;
      let lines = serialBuffer.split('\n');
      serialBuffer = lines.pop();
      for (let line of lines) { handleSerialLine(line.trim()); }
    }
  } catch (e) {
    console.warn('Serial read error:', e);
  }
}

function handleSerialLine(line) {
  if (!line) return;
  if (line === 'BACK') {
    if (currentRoom !== 0) { currentRoom = 0; createTouchEffect(V_WIDTH/2, V_HEIGHT/2); }
    sensorHeld.fill(false); return;
  }
  if (line.startsWith('T')) {
    let sensorNum = parseInt(line.slice(1));
    if (isNaN(sensorNum) || sensorNum < 1 || sensorNum > 5) return;

    if (currentRoom === 0) {
      currentRoom = sensorNum; initRooms(); playRoomSound(sensorNum);
      createTouchEffect(buttons[sensorNum-1].x, buttons[sensorNum-1].y);
    } else {
      let rx = random(100, V_WIDTH - 100); let ry = random(100, V_HEIGHT - 100);
      simulateRoomInteraction(rx, ry); createTouchEffect(rx, ry); playRoomSound(currentRoom);
    }
  }
}

function simulateRoomInteraction(rx, ry) {
  if (currentRoom === 1) {
    for (let d of room1Dots) {
      let dtc = dist(rx, ry, d.x, d.y);
      if (dtc < 350) {
        let a = atan2(d.y - ry, d.x - rx);
        d.vx = cos(a) * map(dtc, 0, 350, 80, 15); d.vy = sin(a) * map(dtc, 0, 350, 80, 15);
      }
    }
  } else if (currentRoom === 2) {
    r2_burstT = 1.0; 
  } else if (currentRoom === 3) {
    r3_blinkTimer = 18;
  } else if (currentRoom === 4 && c4_state === 'WANDER') {
    c4_state = 'FLEE';
    let tx = rx > V_WIDTH/2 ? 50 : V_WIDTH - 50;
    let ty = ry > V_HEIGHT/2 ? 150 : V_HEIGHT - 50;
    let a = atan2(ty - c4_pos.y, tx - c4_pos.x);
    c4_vel = createVector(cos(a)*25, sin(a)*25);
  } else if (currentRoom === 5) {
    room5Voids.push({ x: rx, y: ry, size: 45, alpha: 255 });
    c5_targetPos = createVector(rx, ry);
  }
}

function drawSerialButton() {
  push();
  let bx = V_WIDTH - 150, by = 20, bw = 130, bh = 40;
  fill(serialConnected ? color(50, 200, 100) : color(60, 60, 70));
  noStroke(); rect(bx, by, bw, bh, 8);
  fill(255); textSize(14); textAlign(CENTER, CENTER);
  text(serialConnected ? '● 연결됨' : '시리얼 연결', bx + bw/2, by + bh/2);
  pop();
}