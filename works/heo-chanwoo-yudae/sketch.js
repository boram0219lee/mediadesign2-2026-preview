// 🌟 1. 전역 변수 (Global Variables) - 공간 전체의 상태를 기억하는 곳

let particles = [];      // 만들어진 파티클(입자)들을 담아두는 거대한 상자(배열)입니다.
let sphereR = 300;       // 🎛️ 구(Sphere)의 기본 반지름입니다. 키우면 전체 덩어리가 커집니다.
let autoRotX = 0;        // 카메라(공간)의 상하 X축 회전 각도입니다.
let autoRotY = 0;        // 카메라(공간)의 좌우 Y축 회전 각도입니다.
let isDragging = false;  // 현재 마우스로 화면을 드래그하며 돌리고 있는지 확인하는 스위치입니다.
let prevMouseX, prevMouseY; // 바로 직전 프레임의 마우스 위치를 기억해서 드래그 방향을 알아냅니다.

let mouseVel = 0;        // 💡 핵심! 웹캠의 움직임을 바탕으로 계산된 최종 '활동량(속도)'입니다.
let spikeHeight = 0;     // 현재 파티클 구체가 뾰족해진 정도(가시 높이)입니다.
let spikeFreq = 50;      // 🎛️ 가시의 개수/빈도입니다. 숫자를 높이면 자잘한 가시가 촘촘하게 생깁니다.
let spikePow = 0.2;      // 🎛️ 가시가 튀어나오는 형태(곡선)입니다. 낮을수록 날카롭게 뽑힙니다.

let idleFrames = 0;      // 움직임이 멈춘 상태가 몇 프레임째 지속되고 있는지 세는 카운터입니다.
let idleProgress = 0;    // 평온 상태(Idle)로 넘어가는 진행도(0.0 ~ 1.0)입니다. 부드러운 전환을 위해 쓰입니다.

let video;               // 웹캠 화면 데이터를 받아올 변수입니다.
let prevPixels;          // 움직임 감지를 위해 '직전 프레임'의 웹캠 픽셀 색상들을 저장합니다.
let camVel = 0;          // 웹캠에서 순수하게 계산된 날것의 움직임 수치입니다.
let bgWarmth = 0;        // 🎛️ 배경의 온도감(0.0~1.0)입니다. 격렬할 땐 차갑게(0), 고요할 땐 따뜻하게(1) 바뀝니다.
let gridScroll = 0;      // 바닥의 그리드(선)가 내 쪽으로 다가온 누적 거리입니다.
let smoothSunset = 0; // 👈 노을이 부드럽게 켜지고 꺼지게 할 변수 추가

// 🌟 2. 셋업 함수 - 프로그램이 켜질 때 딱 1번 실행됩니다.
function setup() {
  createCanvas(1280, 720); // 🎛️ 도화지(화면)의 가로 세로 픽셀 크기입니다.
  colorMode(RGB, 255, 255, 255, 255); // 색상을 R,G,B,Alpha(투명도) 0~255 범위로 씁니다.
  buildParticles(1000);    // 🎛️ 파티클 1000개를 생성합니다. (숫자를 늘리면 촘촘해지지만 버벅일 수 있습니다)
  
  video = createCapture(VIDEO); // 웹캠 켜기
  video.size(80, 60);           // 💡 픽셀 비교 연산을 가볍게 하기 위해 웹캠 해상도를 일부러 뭉갰습니다.
  video.hide();                 // 웹캠 원본 영상이 화면에 뜨지 않게 숨깁니다.
}

// 🌟 3. 웹캠 모션 인식 함수 - 움직임이 얼마나 거친지 숫자로 뽑아냅니다.
function getCamVelocity() {
  video.loadPixels();
  if (!video.pixels.length) return 0; // 카메라가 덜 켜졌으면 움직임 0 반환

  // 처음 켜졌을 땐 직전 픽셀이 없으므로 현재 픽셀을 저장하고 끝냅니다.
  if (!prevPixels) {
    prevPixels = new Uint8ClampedArray(video.pixels);
    return 0;
  }

  let diff = 0; // 이번 프레임의 전체 색상 변화량 누적
  let total = video.pixels.length / 4; // 전체 픽셀 개수 (R,G,B,A 4개가 1세트라 4로 나눔)

  // 모든 픽셀을 돌면서 직전 화면과 현재 화면의 R,G,B 차이를 계산합니다.
  for (let i = 0; i < video.pixels.length; i += 4) {
    let dr = abs(video.pixels[i]     - prevPixels[i]);
    let dg = abs(video.pixels[i + 1] - prevPixels[i + 1]);
    let db = abs(video.pixels[i + 2] - prevPixels[i + 2]);
    diff += (dr + dg + db) / 3;
  }

  prevPixels = new Uint8ClampedArray(video.pixels); // 현재 화면을 다시 '과거'로 저장
  return diff / total; // 전체 픽셀의 평균 색상 변화량 = 즉, 현재 활동량!
}


// 🌟 4. 배경 & 그리드 그리기 함수
function drawBackground() {
  let darknessFactor = constrain(map(spikeHeight, 20, 150, 0, 1), 0, 1);
  let calmingRatio = constrain(idleFrames / 119, 0, 1);
  let chaos = constrain(mouseVel / 30, 0, 1);

  // ── 🌑 [배경 전체 색상 3단 변화] ──────────────────────────────
  let bgR_base = lerp(15, 0, darknessFactor);
  let bgG_base = lerp(20, 0, darknessFactor);
  let bgB_base = lerp(40, 0, darknessFactor);

  // [1단계] 진정 중: 옅은 온기
  let bgR_faint = lerp(bgR_base, 15, calmingRatio);
  let bgG_faint = lerp(bgG_base, 18, calmingRatio);
  let bgB_faint = lerp(bgB_base, 25, calmingRatio);

  // [2단계] 완전 평온: 따뜻한 다크 브라운/옐로우
  let finalBgR = lerp(bgR_faint, 40, idleProgress);
  let finalBgG = lerp(bgG_faint, 35, idleProgress);
  let finalBgB = lerp(bgB_faint, 10, idleProgress);

  background(finalBgR, finalBgG, finalBgB);

  let cx = width / 2;
  let horizonY = height * 0.5;

  // ── 🌅 [통합된 지평선 & 노을 띠 로직] ─────────────────────────
  // smoothSunset: 0(불안정) ~ 1(안심) 사이를 오가는 비율
  let targetSunset = constrain(idleFrames / 119, 0, 1);
  smoothSunset = lerp(smoothSunset, targetSunset, 0.03);
  
  let sunsetLerpSpeed = (targetSunset === 0) ? 0.12 : 0.03;
  smoothSunset = lerp(smoothSunset, targetSunset, sunsetLerpSpeed);

  noStroke();

  // 1️⃣ 색상 결정 (3단 변화)
  let alertR = lerp(80, 112, darknessFactor);
  let alertG = lerp(120, 128, darknessFactor);
  let alertB = lerp(160, 144, darknessFactor);

  // 지평선 변화색
  let faintR = lerp(alertR, 175, calmingRatio);
  let faintG = lerp(alertG, 200, calmingRatio);
  let faintB = lerp(alertB, 230, calmingRatio);
  
  // 지평선 노란색
  let finalR = lerp(faintR, 255, idleProgress);
  let finalG = lerp(faintG, 210, idleProgress);
  let finalB = lerp(faintB, 80, idleProgress);

  // 2️⃣ 간격과 두께 계산 (중간에 꼬이지 않게 단순화!)
  let maxDist = max(horizonY, height - horizonY);
  
  // 간격: 불안할 땐 촘촘하게(5), 진정되면 넓게(화면 끝까지)
  let baseSpacing = lerp(0, (maxDist / 17), smoothSunset); 

  // 두께 배율: 불안할 땐 0.0(수축), 진정되면 4.5(팽창)
  let heightMultiplier = lerp(0.0, 4.5, smoothSunset);
  

 rectMode(CENTER);
  
  for(let i = 0; i < 15; i++) {
    let maxAlpha = lerp(150, 70, smoothSunset);
    let alpha = map(i, 0, 15, maxAlpha, 0);
    // 중심(i=0)에서 바깥쪽(i=15)으로 갈수록 파도가 자연스럽게 커집니다.
    let waveAmp = idleProgress * (15 - i) * 0.8;
    let waveOffset = sin(frameCount * 0.04 - i * 0.8) * waveAmp;

    fill(finalR, finalG, finalB, alpha);

    // 전체가 천천히 숨을 쉬는 크기 변화 (1.0 ~ 1.05 정도)
    let breath = (sin(frameCount * 0.015) + 1) / 2; 
    let sizePulse = 1.0 + (idleProgress * breath * (0.1 + i * 0.02));

    // 최종 두께: 간격 * 배율 * 호흡
    let rectHeight = baseSpacing * heightMultiplier * sizePulse;
    
    // 두께가 0.1보다 작으면 아예 안 그림 (완전 수축)
    if (rectHeight < 0.1) rectHeight = 0; 

    // 위치 계산 (waveOffset 같은 흔들림 제거)
    let topY = horizonY - (i * baseSpacing) - waveOffset;
    rect(width / 2, topY, width, rectHeight);
  if (i > 0) {
      let bottomY = horizonY + (i * baseSpacing) + waveOffset;
      rect(width / 2, bottomY, width, rectHeight);
  }
}

    
  
  // ── 🚨 [그리드 색상 반응 3단 변화] ──────────────────────────────
  let baseGridAlpha = lerp(180, 80, chaos);
  let currentGridAlpha = lerp(baseGridAlpha, 40, idleProgress);
  let currentWeight = lerp(2.5, 1.0, idleProgress);
  strokeWeight(currentWeight);

  let gridAlertFactor = constrain(map(spikeHeight, 20, 150, 0, 1), 0, 1);

  // [불안 상태] 그리드 색상 -> 클래식 청회색
  let baseGridR = lerp(100, 112, gridAlertFactor);
  let baseGridG = lerp(140, 128, gridAlertFactor);
  let baseGridB = lerp(180, 144, gridAlertFactor);

  // [1단계] 진정 중: 창백한 파란색
  let faintGridR = lerp(baseGridR, 175, calmingRatio);
  let faintGridG = lerp(baseGridG, 200, calmingRatio);
  let faintGridB = lerp(baseGridB, 230, calmingRatio);

  // [2단계] 완전 평온: 노란색
  let finalGridR = lerp(faintGridR, 255, idleProgress);
  let finalGridG = lerp(faintGridG, 220, idleProgress);
  let finalGridB = lerp(faintGridB, 100, idleProgress);

  for (let i = -15; i <= 15; i++) {
    let xBottom = cx + i * 180;
    let sway = sin(frameCount * 0.01 + i * 0.2) * (60 * idleProgress);
    let segments = 12;
    for (let j = 0; j < segments; j++) {
      let t1 = j / segments;
      let t2 = (j + 1) / segments;
      let x1 = lerp(cx, xBottom + sway, t1);
      let y1 = lerp(horizonY, height, t1);
      let x2 = lerp(cx, xBottom + sway, t2);
      let y2 = lerp(horizonY, height, t2);
      let fadeAlpha = currentGridAlpha * constrain(map(t1, 0, 0.3, 0, 1), 0, 1);
      stroke(finalGridR, finalGridG, finalGridB, fadeAlpha);
      line(x1, y1, x2, y2);
    }
  }

  for (let i = 0; i < 20; i++) {
    let z = (i * 10 - gridScroll) % 200;
    if (z < 0) z += 200;
    let depthT = pow(z / 200, 2);
    let y = horizonY + depthT * (height - horizonY);
    let distance = y - horizonY;
    let fade = constrain(map(distance, 0, 50, 0, 1), 0, 1);
    stroke(finalGridR, finalGridG, finalGridB, currentGridAlpha * fade);
    line(0, y, width, y);
  }

  // ── 📺 [가로줄 노이즈 (CRT & Glitch) 효과] ──────────────────────────────
  strokeWeight(1);
  for (let y = 0; y < height; y += 4) {
    let scanAlpha = lerp(8, 25, darknessFactor);
    stroke(255, scanAlpha);
    line(0, y, width, y);
  }

  let glitchCount = floor(lerp(0, 8, darknessFactor));
  noStroke();
  for (let i = 0; i < glitchCount; i++) {
    let noiseY = random(height);
    let noiseH = random(1, 5);
    let noiseW = random(width * 0.1, width * 0.4);
    let noiseX = random(width - noiseW);

    let nR = lerp(220, 180, darknessFactor);
    let nG = lerp(220, 240, darknessFactor);
    let nB = lerp(255, 255, darknessFactor);

    let finalGlitchR = lerp(nR, 255, calmingRatio);
    let finalGlitchG = lerp(nG, 240, calmingRatio);
    let finalGlitchB = lerp(nB, 150, calmingRatio);

    let nAlpha = random(10, lerp(20, 50, darknessFactor));
    fill(finalGlitchR, finalGlitchG, finalGlitchB, nAlpha);
    rect(noiseX, noiseY, noiseW, noiseH);
  }
}


// 🌟 5. 파티클 설계도 (Class) - 각각의 입자가 어떻게 행동할지 정의
class Particle {
  constructor(phi, theta) {
    // phi(상하 각도), theta(좌우 각도)는 구의 표면상 위치를 정해줍니다.
    this.phi = phi;
    this.theta = theta;
    
    // 처음에 스폰될 때 -200~200 박스 안에서 무작위로 태어납니다.
    this.x = random(-200, 200);
    this.y = random(-200, 200);
    this.z = random(-200, 200);
    
    this.size = random(1, 5);        // 🎛️ 각 파티클의 크기 (2~10 사이)
    this.speed = random(0.03, 0.08);  // 🎛️ 목표 위치로 쫓아가는 각자의 기본 관성(복원력) 속도
    this.noiseOffset = random(1000);  // 파티클마다 떨림의 모양이 다르게 만들기 위한 랜덤 주민번호
    this.turbulence = 0;              // 현재 이 파티클이 얼마나 발작하고 있는지 상태값

    // 🎛️ 평온 상태(Idle)일 때 우주처럼 사방으로 둥글게 퍼져나갈 최종 반경 (기본 구의 2~3.5배 넓이)
    this.expandR = sphereR * random(2, 3.5);
    
    // 퍼져나간 상태에서의 최종 목표 좌표값들을 미리 계산해 둡니다.
    this.expandX = this.expandR * sin(this.phi) * cos(this.theta);
    this.expandY = this.expandR * sin(this.phi) * sin(this.theta); 
    this.expandZ = this.expandR * cos(this.phi);

    this.updateTarget();
  }

  // 자신의 원래 자리(목표 좌표)를 계산하는 함수
  updateTarget(t) {
    // 1️⃣ [1단계: 숨 참기] 119프레임 동안 0에서 1까지 실시간으로 차오르는 '압축 수치'입니다.
    let calmingFactor = constrain(idleFrames / 119, 0, 1);
    
    // 가시(spikeHeight)가 솟아날수록 위협을 크게 느끼는 것으로 판단합니다. (0.0 안전 ~ 1.0 최대 불안)
    let threatFactor = constrain(spikeHeight / 150, 0, 1);

    // 가시(Spike)가 튀어나오게 만드는 찌그러짐 수학 연산
    let v = sin(this.phi * spikeFreq) * sin(this.theta * spikeFreq);
    let spike = pow(max(0, v), spikePow) * spikeHeight;
    
    // ─── 🔵 구체 덩어리 전체 크기 조절 로직 ────────────────────
    // 💡 1. 불안정할 때 방어 태세로 팍 쪼그라드는 크기 (원래 구체의 40% 크기)
    let anxiousRadius = sphereR * 0.8; 
    
    // 💡 2. 진정될 때 서서히 안심하며 부풀어오르는 크기 (1.8배까지 팽창)
    let relaxedRadius = lerp(sphereR, sphereR * 1.8, calmingFactor);
    
    // 💡 3. 위협 정도(threatFactor)에 따라 두 크기를 자연스럽게 섞어줍니다.
    // 위협을 받으면 anxiousRadius(작음)로 수축하고, 위협이 사라지면 relaxedRadius(큼)로 돌아갑니다.
    let baseRadius = lerp(relaxedRadius, anxiousRadius, threatFactor);
    
    // 최종 베이스 크기에서 가시(spike) 모양을 빼서 울퉁불퉁하게 만듭니다.
    let shrunkRadius = baseRadius - spike;
    
    // 기괴한 버그가 생길 수 있으므로, 최소 크기를 10으로 막아줍니다(방어 코드).
    shrunkRadius = max(10, shrunkRadius);

    // 압축된 반지름을 기반으로 한 3D 구 표면 좌표 계산
    let sx = shrunkRadius * sin(this.phi) * cos(this.theta);
    let sy = shrunkRadius * sin(this.phi) * sin(this.theta);
    let sz = shrunkRadius * cos(this.phi);

    // 2️⃣ [2단계: 폭발/해방] 119프레임이 지나 진짜 완전히 안심하면(idleProgress가 0에서 1로 변하면),
    // 방금 전까지 똘똘 뭉쳐있던 구체(sx, sy, sz)가 우주 공간 전체(expandX, Y, Z)로 거대하게 확 퍼집니다!
    this.targetX = lerp(sx, this.expandX, idleProgress);
    this.targetY = lerp(sy, this.expandY, idleProgress);
    this.targetZ = lerp(sz, this.expandZ, idleProgress);
  }

  // 매 프레임 파티클을 이동시키는 연산 엔진
  // 매 프레임 파티클을 이동시키는 연산 엔진
  update(t) {
    this.updateTarget(); // 타겟 좌표 업데이트

    // 🎛️ 흔들림(떨림) 반경 설정입니다.
    let shakeAmplitude = 7.0; 

    // ── 🫀 [불안/떨림 수치 부드럽게 깎기] ─────────────────────────
    if (mouseVel > 20) {
      // 1. 위협을 느낄 땐 즉각적으로 발작 수치(turbulence)가 올라갑니다.
      let intensity = mouseVel * 2.0;
      this.turbulence = lerp(this.turbulence, intensity, 0.05);
    } else {
      // 2. 마우스가 멈췄을 때! 바로 0이 되지 않고 서서히 진정합니다.
      // idleFrames가 0에서 119까지 차오르는 비율(0.0 ~ 1.0)을 계산합니다.
      let calmingRatio = constrain(idleFrames / 119, 0, 1);
      
      // 시간이 지나 안심할수록(calmingRatio가 커질수록) 0으로 깎이는 가속도가 붙습니다.
      this.turbulence = lerp(this.turbulence, 0, calmingRatio * 0.05); 
    }

    // 움직임이 20 이상이면 1(보라색)로 켜지고, 멈추면 0(파란색)으로 즉각적(0.1 속도)으로 돌아옵니다.
    if (this.colorIntensity === undefined) this.colorIntensity = 0;
    this.colorIntensity = lerp(this.colorIntensity, mouseVel > 20 ? 1 : 0, 0.1);
    
    // 펄린 노이즈(부드러운 무작위 함수)
    let nx = (noise(this.noiseOffset,        t * 0.8) - 0.5) * 2;
    let ny = (noise(this.noiseOffset + 100,  t * 0.8) - 0.5) * 2;
    let nz = (noise(this.noiseOffset + 200,  t * 0.8) - 0.5) * 2;


    // ── 🫁 [입자 호흡/파동(Amplitude) 로직 추가!] ─────────────────────────
    // 💡 idleProgress(안심 상태)가 될수록 입자들이 물결치듯 숨을 쉬게 만듭니다.
    // t(시간)와 this.phi(위아래 위치), this.theta(좌우 위치)를 섞어 구면 전체에 파동을 만듭니다.
    // 🎛️ 20.0은 호흡의 깊이(진폭)입니다. 더 크게 꿀렁이길 원하면 40.0 등으로 올려보세요!
    let breathAmp = sin(t * 3.0 + this.phi * 4.0 - this.theta * 2.0) * 40.0 * idleProgress;
    
    // 입자들이 위아래로만 움직이지 않고, 중심에서 바깥쪽으로 부풀었다 줄어들게(방사형) 방향을 잡아줍니다.
    let bx = sin(this.phi) * cos(this.theta) * breathAmp;
    let by = sin(this.phi) * sin(this.theta) * breathAmp;
    let bz = cos(this.phi) * breathAmp;
    // ──────────────────────────────────────────────────────────────────

    // 타겟 좌표에 꼬물거리는 노이즈(nx)와 방금 만든 호흡 진폭(bx)을 함께 더해줍니다!
    let tx = this.targetX + nx * this.turbulence + bx;
    let ty = this.targetY + ny * this.turbulence + by;
    let tz = this.targetZ + nz * this.turbulence + bz;

    // 속도 계산: 움직임이 거칠수록 복귀하는 속도도 빨라져서 탄력감(쫀득함)이 생깁니다.
    let spd = this.speed + mouseVel * 0.006;
    
    // 현재 위치를 타겟 위치로 서서히 끌고 옵니다 (Easing).
    this.x += (tx - this.x) * spd;
    this.y += (ty - this.y) * spd;
    this.z += (tz - this.z) * spd;
    
    // 진정하는 비율 (0: 완전 불안 ~ 1: 119프레임 도달로 완전 진정)
    let calmingFactor = constrain(idleFrames / 119, 0, 1);
    
    // 떨림의 최대 강도 (숫자가 클수록 격렬해집니다. 2~5 사이를 추천합니다)
    let maxJitter = 7.0; 
    
    // 진정 비율을 반대로 뒤집어서(1 - calmingFactor) 떨림을 적용합니다.
    // idleFrames가 119에 도달해 calmingFactor가 1이 되면 떨림(jitter)은 0이 되어 멈춥니다.
    let jitter = (1 - calmingFactor) * maxJitter; 

    // 최종 입자 좌표에 계산된 떨림(무작위 값)을 더해줍니다.
    this.x += random(-jitter, jitter);
    this.y += random(-jitter, jitter);
    this.z += random(-jitter, jitter);
  }
  
  // 화면에 그리는 함수
  draw(rx, ry) {
    // 3D 회전 수학(Matrix Rotation): 카메라 각도 rx, ry에 따라 파티클 좌표를 돌립니다.
    let y1 = this.y * cos(rx) - this.z * sin(rx);
    let z1 = this.y * sin(rx) + this.z * cos(rx);
    let x2 = this.x * cos(ry) + z1 * sin(ry);
    let z2 = -this.x * sin(ry) + z1 * cos(ry);
    
    // 🎛️ 원근법(Perspective) 값입니다. 
    // fov가 작으면 광각 렌즈처럼 왜곡이 심해지고, 크면 망원 렌즈처럼 평면적으로 보입니다.
    let fov = 500; 
    let sc = fov / (fov + z2 + sphereR * 1.5); // 거리에 따른 크기 배율(Scale)
    
    // 최종적으로 2D 모니터에 찍힐 x, y 위치
    let sx = x2 * sc;
    let sy = y1 * sc;
    
    // 💡 [핵심 변경점] 20 이하일 때 0으로 뚝 끊기던 로직을 지웠습니다!
    // 대신, 위에서 서서히 식어가도록 만든 this.turbulence 값을 직접 사용합니다.
    // (turbulence 수치가 기존 mouseVel보다 크기 때문에 0.2 대신 0.1을 곱해 밸런스를 맞췄습니다)
    let trembleAmt = this.turbulence * 0.1 * (1 - idleProgress);
    
    // 🎛️ frameCount * 0.3: 숫자가 클수록 떨리는 속도가 빨라집니다.
    let tx = (noise(this.noiseOffset + 119, frameCount * 0.3) - 0.5) * 2 * trembleAmt;
    let ty = (noise(this.noiseOffset + 400, frameCount * 0.3) - 0.5) * 2 * trembleAmt;
    sx += tx;
    sy += ty;

    // 파티클이 내 눈(카메라)에서 얼마나 멀리 있는지 0.0 ~ 1.0 사이로 계산합니다 (가까우면 0, 멀면 1)
    let depth = constrain((z2 + sphereR * 2) / (sphereR * 4), 0, 1);
    
    // 🥶 1. 불안 상태 (클래식 청회색)
    let alertR = 112 - depth * 20; 
    let alertG = 128 - depth * 20; 
    let alertB = 144 - depth * 10; 

    // 🌤️ 2. 진정 중인 상태 (창백하고 투명한 파란색)
    let faintR = 175;            
    let faintG = 200;            
    let faintB = 230; 

    // 🟡 3. 완전한 idle 상태 (샛노란 금빛)
    let crystalR = 255;            
    let crystalG = 225;            
    let crystalB = 80; 
    
    // [1단계 믹스] 마우스 멈춤 + 119프레임 동안: 창백함 -> 옅은 온기
    let calmingFactor = constrain(idleFrames / 119, 0, 1);
    let warmingFactor = 1 - this.colorIntensity;
    let stage1Mix = warmingFactor * calmingFactor;

    let midR = lerp(alertR, faintR, stage1Mix);
    let midG = lerp(alertG, faintG, stage1Mix);
    let midB = lerp(alertB, faintB, stage1Mix);

    // [2단계 믹스] 완전한 idle 상태 진입 시: 옅은 온기 -> 샛노란색
    let finalR = lerp(midR, crystalR, idleProgress);
    let finalG = lerp(midG, crystalG, idleProgress);
    let finalB = lerp(midB, crystalB, idleProgress);
    
    // 최종 색상 칠하기
    noStroke();
    let alpha = 80 + (1 - depth) * 175; 
    fill(finalR, finalG, finalB, alpha);

    // ─── (이하 크기 조절 및 circle 그리는 코드 유지) ───────────
    let shakeFactor = this.colorIntensity;
    let unstableScale = lerp(1.0, 0.4, shakeFactor);
    let particleScale = lerp(unstableScale, 1.5, calmingFactor);
    particleScale = lerp(particleScale, 1.0, idleProgress);

    circle(sx, sy, this.size * sc * 2.5 * particleScale);
  }
}


// 🌟 6. 파티클 뭉치 생성 함수 - 해바라기씨 배열(Fibonacci Sphere) 알고리즘
function buildParticles(n) {
  particles = [];
  let golden = PI * (3 - sqrt(5)); // 황금각 (파티클들이 겹치지 않고 예쁘게 구 표면을 채우는 마법의 각도)
  for (let i = 0; i < n; i++) {
    let y = 1 - (i / (n - 1)) * 2; // y좌표를 -1에서 1 사이로 균등하게 분배
    let phi = acos(constrain(y, -1, 1)); // 위아래 상하 각도 계산
    let theta = golden * i; // 황금각을 곱해 좌우로 뱅글뱅글 돌아가며 위치시킴
    particles.push(new Particle(phi, theta)); // 배열에 쏙 집어넣습니다.
  }
}


// 🌟 7. 메인 그리기 루프 - 모니터 주사율에 맞춰 초당 60번씩 반복 실행됩니다.
function draw() {
  let rawVel = getCamVelocity(); // 웹캠 모션 계산값을 가져옵니다.
  camVel = lerp(camVel, rawVel, 0.8); // 튈 수 있는 값을 부드럽게 보정합니다.
  mouseVel = camVel * 10; // 🎛️ 전체 활동량의 민감도 증폭! (너무 둔하면 8을 15~20으로 올리세요)

  // [이전 코드 지우기]
  // let targetScrollSpeed = lerp(0.2 + (mouseVel * 0.05), 0.01, idleProgress);
  // gridScroll += targetScrollSpeed;

  // [아래 코드로 교체]
  // ── 🐢 [그리드 스크롤 서서히 감속 로직] ──────────────────────────────
  // idleFrames가 0부터 119까지 차오르는 비율(0.0 ~ 1.0)을 계산합니다.
  let calmingRatio = constrain(idleFrames / 119, 0, 1); 
  
  // 1차: 움직일 땐 빠르다가, 진정하는 동안(calmingRatio) 기본 속도를 0.05까지 브레이크 밟듯 줄입니다.
  let baseSpeed = lerp(1.2 + (mouseVel * 0.05), 0.05, calmingRatio);
  
  // 2차: 119프레임이 지나 완전히 평온해지면(idleProgress) 궁극적으로 0.01까지 거의 멈추듯 느려집니다.
  let targetScrollSpeed = lerp(baseSpeed, 0.01, idleProgress);
  
  gridScroll += targetScrollSpeed;

  drawBackground(); // 배경 렌더링 호출

  // 🎛️ 뾰족한 가시가 솟아나는 목표 높이 (150이 한계선)
  let targetSpike = mouseVel > 20 ? constrain(mouseVel * 10.5, 0, 119) : 0;
  spikeHeight = lerp(spikeHeight, targetSpike, 0.05); // 서서히 솟아나고 서서히 들어감

  // 움직임이 20 이하로 얌전해지면 카운터를 올립니다.
  if (mouseVel < 20) {
    idleFrames++;
  } else {
    idleFrames = 0; // 크게 움직이면 카운터 초기화
  }
  
  // 🎛️ 119프레임(약 5초) 동안 얌전하면 완벽한 평온 상태(1) 타겟 설정
  let targetIdle = idleFrames > 119 ? 1 : 0; 
  idleProgress = lerp(idleProgress, targetIdle, 0.03); // 서서히 평온해짐
  
  // 💡 [수정] 다시 불안정해질 때(targetIdle === 0)는 lerp 속도를 0.2로 확 올려서 
  // 노란 배경과 우주로 퍼졌던 파티클들이 순식간에 수축/암전되도록 만듭니다.
  let idleLerpSpeed = (targetIdle === 0) ? 0.12 : 0.03; 
  idleProgress = lerp(idleProgress, targetIdle, idleLerpSpeed);

  // 마우스 드래그와 자동 공간 회전 처리
  if (isDragging) {
    // 🎛️ 마우스로 드래그할 때 돌아가는 감도 (0.005)
    autoRotY += (mouseX - prevMouseX) * 0.005 * (1 - idleProgress);
    autoRotX += (mouseY - prevMouseY) * 0.005 * (1 - idleProgress);
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  } else {
    // 💡 숨을 참을 때(smoothSunset)는 서서히 멈췄다가, 해방될 때(idleProgress) 다시 우아하게 돕니다!
    let rotSpeed = lerp(0.004, 0.0, smoothSunset); 
    rotSpeed = lerp(rotSpeed, 0.002, idleProgress); // 폭발 후에는 기존보다 아주 살짝 빠르게!
    autoRotY += rotSpeed; 
  }

  // 💡 z-index(깊이) 정렬 알고리즘: 뒤에 있는 파티클을 먼저, 앞에 있는 걸 나중에 그려야 겹칠 때 자연스럽습니다.
  particles.sort((a, b) => {
    let az = a.z * cos(autoRotX) + a.y * sin(autoRotX);
    let bz = b.z * cos(autoRotX) + b.y * sin(autoRotX);
    return az - bz;
  });

  let t = frameCount * 0.01; // 전체 시간 흐름 변수

  push(); // 현재 화면 좌표계 상태 저장
  translate(width / 2, height * 0.5); // 모든 그림의 중심점을 화면 한가운데 정중앙으로 이동
  
  // 배열 안의 모든 파티클(1000개)에게 "계산하고(update), 그려라(draw)" 라고 명령 내림
  particles.forEach(pt => { 
    pt.update(t); 
    pt.draw(autoRotX, autoRotY); 
  });
  pop(); // 화면 좌표계 원래대로 복구
}

// 🌟 8. 마우스 클릭 이벤트 함수
// 마우스를 꾹 누르면 드래그 스위치를 켜고 현재 위치를 기억합니다.
function mousePressed()  { isDragging = true;  prevMouseX = mouseX; prevMouseY = mouseY; }
// 마우스를 떼면 드래그 스위치를 끕니다.
function mouseReleased() { isDragging = false; }