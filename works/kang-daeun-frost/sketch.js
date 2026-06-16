
// ======================================================================
// ⚙️ [1. 배경 및 환경 수치 조절 패널]
// ======================================================================
const BG_CONFIG = {
  colorTL: '#FFB7F1',     // 좌상단 색상 (차분한 연보라)
  colorTR: '#1277D1',     // 우상단 색상 (얼음빛 파랑)
  colorBL: '#E6F5F6',     // 좌하단 색상 (투명한 옥색)
  colorBR: '#FFD2AC',     // 우하단 색상 (옅은 살구빛)
  
  moveSpeed: 0.01,        // 하늘 그라데이션이 꿀렁이며 일렁이는 속도 (수치가 클수록 빨라짐)
  bgBlurAmount: 8,        // 뒷배경 렌즈 블러 정도 (0 = 블러 없음, 수치가 클수록 뒷배경이 뽀얗게 흐려짐)
  fogAlpha: 50,           // 화면 전체를 덮는 하얀 안개의 투명도 (0: 완전 투명 ~ 255: 완전 불투명 하얀색)
  
  dunes: [
    { baseY: 0.85, amplitude: 170, noiseScale: 0.001, noiseOffset: 200, colorTop: 'rgba(251,246,250,0.46)', colorBot: 'rgba(180,210,235,0.68)' },
    { baseY: 1.02, amplitude: 230, noiseScale: 0.001, noiseOffset: 300, colorTop: 'rgba(170,184,245,0.08)', colorBot: 'rgb(231,243,255)' }
  ]
};

// ======================================================================
// ⚙️ [2. 인터랙션 (움직임 감지 & 상태 전환) 조절 패널]
// ======================================================================
const INTERACT_CONFIG = {
  poseConfidence: 0.1,       // 웹캠이 사람을 인식하는 최소 신뢰도 (0~1)
  maxPeople: 1,              // 최대 인식 인원 수 (여러 명일 때 튀는 에러 방지)
  targetStopRadius: 110,     // 사람에게 다가갈 때 브레이크를 밟기 시작하는 '안전거리 반경' (떡짐, 떨림 방지)
  
  targetLerp: 0.1,           // 생명체가 관람객의 위치를 쫓아올 때의 부드러움 (1에 가까울수록 즉각적)
  
  fleeThreshold: 12.0,       // [상태 2 도망침] 관람객의 움직임 수치가 이 숫자 '이상'으로 오르면 기겁하고 도망갑니다.
  wanderThreshold: 2.0,      // [상태 0 배  회] 관람객 움직임이 '2.0 ~ 10.0 사이'면 경계하며 곁을 맴돕니다.
                             // [상태 1 호기심] 관람객 움직임이 '2.0 미만'으로 떨어져야(가만히 있어야) 다가옵니다.
  
  noPersonDelay: 80,         // 관람객이 카메라 밖으로 나간 뒤, 완전히 경계를 풀 때까지의 대기 프레임
  targetReturnSpeed: 0.05    // 관람객이 떠난 뒤 화면 중앙 허공으로 녀석들의 시선이 돌아가는 속도
};

// ======================================================================
// ⚙️ [2-1. 움직임 감지 & 상태 전환 안정화 전용 패널] (NEW!)
// ======================================================================
const STABILITY_CONFIG = {
  // 1. 카메라 노이즈 필터
  // 가만히 서있어도 카메라 노이즈 때문에 AI가 흔들림을 감지하는 것을 차단합니다.
  // - 가만히 있는데도 녀석들이 도망가면 -> 수치를 높이세요 (예: 4.0 ~ 6.0)
  // - 내가 살짝만 움직여도 바로 도망가게 하고 싶으면 -> 수치를 낮추세요 (예: 1.0)
  cameraNoiseFilter: 2.0,    

  // 2. 움직임 반응(관성) 속도
  // 팔을 크게 흔들었을 때 카메라에 잔상이 생겨 AI가 인식을 0.1초 놓치더라도 에러가 나지 않게 잡아줍니다.
  // - 반응이 너무 둔하면 -> motionSensitivityUp을 0.8까지 올리세요. (즉각 도망감)
  // - 움직이다 멈췄을 때 바로 다가와버리면 -> motionSensitivityDown을 0.01로 더 낮추세요. (도망 상태의 여운이 길어짐)
  motionSensitivityUp: 0.65,    // 움직임을 감지할 때 수치가 팍! 차오르는 속도
  motionSensitivityDown: 0.03, // 움직임이 멈췄을 때 수치가 스르륵 내려가는 속도

  // 3. 상태 전환 대기 시간 (버벅거림 방지 및 브레이크 타이밍)
  // 도망(상태 2)치다가 관람객이 가만히 멈췄을 때, "아, 진짜로 멈췄구나"라고 확신하기까지 기다리는 시간입니다.
  // ⚡️ [급제동 해결 가이드] 이 값이 너무 길면 대기시간 동안 계속 최고속도로 도망치다가 갑자기 툭 끊기듯 멈춥니다!
  // 도망치다가 부드럽고 자연스럽게 감속 단계로 이어지게 하려면 이 값을 과감히 낮춰보세요. (추천 수치: 5 ~ 12)
  calmDownFrames: 15,         

  // ⭐️ 4. 상태 1(호기심) 진입 시 몸집 커지는 속도 조절 패널 
  // 가만히 있어서 녀석들이 다가올 때, 몸이 부풀어 오르는 속도를 조절합니다.
  // - 너무 빨리 커져서 이상하다면 -> 0.005 ~ 0.001 정도로 더 낮춰주세요! (기존은 0.01 이었습니다)
  growSpeedToCurious: 0.003
};

// ======================================================================
// ⚙️ [3. 생명체 형태 및 군집 기본 조절 패널]
// ======================================================================
const BOID_CONFIG = {
  boidCount: 40,             // 화면에 띄울 생명체 총 마리 수
  baseRadiusMin: 3,          // 생명체의 기본 최소 크기
  baseRadiusMax: 15,         // 생명체의 기본 최대 크기
  
  baseColor: 'rgb(211,232,255)',            // 평상시 색상 기준점 (투명도 계산용)
  
  edgeBlurSpread: 1.8,       // 빛무리(블러)가 퍼지는 반경
  edgeBlurDensity: 0.4,      // 빛무리의 진한 정도
  
  sparkleDistanceState1: 130, // 상태 1(호기심)일 때 서로 부딪혔다고 인식할 범위 (몸집이 커지고 거리 유지를 하므로 범위를 확 늘렸습니다!)
  sparkleZMargin: 30,        // Z축(크기) 차이가 이 수치 이하일 때만 충돌(가까워짐)로 인정합니다.
  sparkleStateLerp: 0.1,     // 가까워질 때 sparkle 이미지로 교차 페이드 되는 부드러움 속도
  
  baseMaxSpeed: 2.0,         // 기준 유영 최대 속도
  maxForce: 0.03,            // 방향을 틀 때 가해지는 힘 (낮을수록 물속에 있는 것처럼 궤적이 우아해짐)
  noiseStrength: 0.1,        // 자체적인 꿀렁임(공기 저항 느낌) 강도
  
  alignDist: 100,            // 주변 친구들과 헤엄치는 방향을 맞추려는 인지 반경
  cohesionDist: 500          // 무리의 중심부로 모이려는 인지 반경
};

// ======================================================================
// ⭐️⭐️ [4-1. 생명체 상태(State)별 목표치 조절 패널] ⭐️⭐️
// ======================================================================
const STATE_CONFIG = {
  0: { 
    scaleTarget: 1.0,         // 원래 크기 유지
    speedMultiplier: 0.7,     // 기준 속도의 20%로 유유자적하게 돎
    alphaTarget: 220,         // 투명도 (약간 반투명)
    lerpScale: 0.01,          // 크기 변화 속도
    lerpSpeed: 0.05,          // 속도 변화 속도
    lerpAlpha: 0.02,          // 투명도 변화 속도
    separationDist: 20,       // [최소 유지 거리] 평소 겹치지 않게 밀어내는 거리
    weights: { sep: 2.0, ali: 1.0, coh: 0.05, seek: 0.0 } 
  },
  1: { 
    scaleTarget: 4.8,         // 호기심에 5배로 부풀어 오름
    speedMultiplier: 0.2,    // 사람을 관찰하느라 아주 느려짐
    alphaTarget: 255,         // 선명하게 드러남
    lerpScale: STABILITY_CONFIG.growSpeedToCurious, // ⭐️ 조절 패널에서 설정한 속도로 적용됩니다!
    lerpSpeed: 0.05,          
    lerpAlpha: 0.008,         
    separationDist: 50,       // [최소 유지 거리] 몸집이 커졌으므로 떡지지 않게 거리 벌림
    weights: { sep: 2.0, ali: 0.1, coh: 0.3, seek: 0.5 } // 사람을 향해 다가오며 둥글게 에워쌈
  },
  2: { 
    scaleTarget: 0.3,         // 놀라서 엄청 작게 쪼그라듦
    speedMultiplier: 10,      // 살기 위해 엄청나게 빨라짐
    alphaTarget: 160,         // 기척을 숨기기 위해 투명해짐
    lerpScale: 0.2,           // 순식간에 팍 쪼그라듦
    lerpSpeed: 0.3,           
    lerpAlpha: 0.3,           
    separationDist: 40,       // [최소 유지 거리] 쪼그라들었을 때의 거리
    weights: { sep: 2.0, ali: 0.5, coh: 0.1, seek: 0.0} // 거칠게 튕겨내며 사람 반대로 도망침
  }
};

// ======================================================================
// ⭐️⭐️ [4-2. 패닉 상태에서 진정(회복)할 때 전용 조절 패널] ⭐️⭐️
// ======================================================================
const RECOVERY_CONFIG = {
  lerpScale: 0.0007,  // 놀란 가슴을 진정하며 원래 크기로 부풀어 오르는 속도 (아주 천천히)
  
  // ⚡️ [급제동 해결 및 관성 제어 핵심 패널] 
  // 기존 수치(0.0001)는 너무 소수점이라 값을 변경해도 화면상 변화가 안 느껴졌던 것입니다!
  // - 도망치던 속도가 브레이크 없이 부드럽게 미끄러지며 줄어들게 하려면: 수치를 0.001 ~ 0.005 정도로 살짝 올리세요.
  // - 도망치다가 멈췄을 때 감속 제동을 확실하고 빠르게 걸고 싶다면: 수치를 0.02 ~ 0.05 정도로 대폭 올려보세요!
  lerpSpeed: 0.0005,  // 미친듯이 도망치던 가속도가 평온해지는 속도 (낮을수록 관성이 오래감)
  
  lerpAlpha: 0.0003  // 숨겼던 모습을 다시 서서히 드러내는 속도
};

// ======================================================================
// 🎵 [5. 사운드(Audio) 볼륨 및 크기 조건 조절 패널]
// ======================================================================
const AUDIO_CONFIG = {
  bgmVolume: 0.03,            // 배경 백색소음 볼륨 (0.0 ~ 1.0)
  
  state1Volume: 0.6,          // 다가왔을 때 커지는 풍경 소리의 최대 볼륨
  chimeTriggerScale: 3.5,     // 생명체들의 평균 크기가 이 수치 이상 커졌을 때 풍경 소리가 나기 시작합니다. (상태 1 목표 크기는 5.0)
  state1FadeInTime: 1.0,      // 조건 달성 후 소리가 서서히 커지는 데 걸리는 시간(초)
  state1FadeOutTime: 1.0,     // 상태 1에서 벗어날 때 즉시 소리가 잦아드는 데 걸리는 시간(초)
  
  gaspVolume: 0.03,           // 놀라서 헉! 하는 소리 볼륨
  gaspCooldown: 240           // 헉 소리 재생 연속 방지 쿨타임 (180프레임 = 약 3초)
};

// ======================================================================
// 🪧 [6. 화면 하단 안내 텍스트(UI) 조절 패널]
// ======================================================================
const UI_CONFIG = {
  text: "🎧헤드셋을 착용해주세요🎧",   
  fontSize: 17,               
  color: [255, 255, 255],     
  minAlpha: 50,               
  maxAlpha: 255,              
  pulseSpeed: 0.01,           
  yOffset: 40                 
};

// ======================================================================
// 🚀 [메인 시스템 변수 및 로직]
// ======================================================================
let boids = [];
let currentState = 0; 
let targetPt;

let video;
let bodyPose;
let poses = [];
let motionAmount = 0; 
let noPersonTimer = 0; 
let prevAvgX = 0; 
let prevAvgY = 0;

let prevKeypoints = { nose: null, left_wrist: null, right_wrist: null };

let imgNormal;
let imgSparkle;

let bgmSound;           
let chimeState1Sound;   
let gaspSound;          

let audioStarted = false; 
let lastGaspTime = -9999; 
let state1ChimeTriggered = false; 
let stateTransitionTimer = 0; 

function preload() {
  bodyPose = ml5.bodyPose("MoveNet");
  imgNormal = loadImage('normal_snowflake.png');     
  imgSparkle = loadImage('sparkle_snowflake.png');   

  soundFormats('mp3', 'ogg');
  bgmSound = loadSound('bgm_space_ambience.mp3'); 
  chimeState1Sound = loadSound('state1_chimes.mp3'); 
  gaspSound = loadSound('gasp_whoosh.mp3'); 
}

function setup() {
  createCanvas(1280, 720);
  noiseSeed(42); 

  video = createCapture(VIDEO);
  video.size(640, 480); 
  video.hide();

  bodyPose.detectStart(video, (results) => { poses = results; });

  targetPt = createVector(width / 2, height / 2);

  for (let i = 0; i < BOID_CONFIG.boidCount; i++) {
    boids.push(new Boid(random(width), random(height)));
  }
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio(); 
    bgmSound.loop();  
    bgmSound.setVolume(AUDIO_CONFIG.bgmVolume); 
    chimeState1Sound.loop(); 
    chimeState1Sound.setVolume(0.0); 
    audioStarted = true;
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function draw() {
  if (BG_CONFIG.bgBlurAmount > 0) drawingContext.filter = `blur(${BG_CONFIG.bgBlurAmount}px)`;
  drawSmoothBackground();
  drawStaticDunes(); 
  drawingContext.filter = 'none'; 

  if (BG_CONFIG.fogAlpha > 0) {
    noStroke(); fill(255, 255, 255, BG_CONFIG.fogAlpha); rect(0, 0, width, height);
  }

  let prevState = currentState;
  analyzeAudience();
  let isStateChanged = (prevState !== currentState);

  if (audioStarted) {
    if (isStateChanged) {
      if (currentState === 2 && frameCount - lastGaspTime > AUDIO_CONFIG.gaspCooldown) {
        gaspSound.play();
        gaspSound.setVolume(AUDIO_CONFIG.gaspVolume); 
        lastGaspTime = frameCount; 
      }
      
      if (currentState !== 1) {
        chimeState1Sound.setVolume(0.0, AUDIO_CONFIG.state1FadeOutTime); 
        state1ChimeTriggered = false;
      }
    }

    if (currentState === 1 && !state1ChimeTriggered) {
      let avgScale = 0;
      for (let b of boids) avgScale += b.currentScale;
      avgScale /= boids.length;

      if (avgScale >= AUDIO_CONFIG.chimeTriggerScale) {
        chimeState1Sound.setVolume(AUDIO_CONFIG.state1Volume, AUDIO_CONFIG.state1FadeInTime); 
        state1ChimeTriggered = true; 
      }
    }
  }

  for (let boid of boids) {
    boid.edges();
    boid.flock(boids, currentState, targetPt);
    boid.update(currentState, prevState, isStateChanged);
    boid.checkCollision(boids); 
    boid.display();
  }

  // ⭐️ 텍스트 UI 출력을 비활성화했습니다.
  // drawPulsingText();
}

function drawPulsingText() {
  let alphaVal = map(sin(frameCount * UI_CONFIG.pulseSpeed), -1, 1, UI_CONFIG.minAlpha, UI_CONFIG.maxAlpha);
  push();
  textAlign(CENTER, CENTER);
  textSize(UI_CONFIG.fontSize);
  fill(UI_CONFIG.color[0], UI_CONFIG.color[1], UI_CONFIG.color[2], alphaVal);
  noStroke();
  text(UI_CONFIG.text, width / 2, height - UI_CONFIG.yOffset);
  pop();
}

// ------------------------------------------
// 🧠 관람객 분석 및 상태 결정 함수
// ------------------------------------------
function analyzeAudience() {
  let validPoses = poses.filter(p => {
    let conf = p.confidence !== undefined ? p.confidence : p.score;
    let nose = p.keypoints ? p.keypoints.find(k => k.name === 'nose') : p.nose;
    let c = nose ? (nose.confidence !== undefined ? nose.confidence : nose.score) : 0;
    return c > INTERACT_CONFIG.poseConfidence;
  }).sort((a, b) => {
    // ⭐️ [가장 앞에 있는 주인공 1명만 트래킹하도록 전면 수정]
    // MoveNet은 자체 Bounding Box를 주지 않으므로, 유효 관절 포인트들의 상하좌우 실제 분포 면적을 수동 계산합니다.
    // 카메라 상에서 가장 넓은 면적을 차지하는(즉, 렌즈와 가장 가깝고 정중앙에 있는) 관람객만 1순위 타겟으로 고정합니다.
    let getArea = (pose) => {
      if (pose.box && pose.box.width) return pose.box.width * pose.box.height;
      if (!pose.keypoints || pose.keypoints.length === 0) return 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let kp of pose.keypoints) {
        let kConf = kp.confidence !== undefined ? kp.confidence : kp.score;
        if (kConf > INTERACT_CONFIG.poseConfidence) {
          if (kp.x < minX) minX = kp.x;
          if (kp.x > maxX) maxX = kp.x;
          if (kp.y < minY) minY = kp.y;
          if (kp.y > maxY) maxY = kp.y;
        }
      }
      return (maxX - minX) * (maxY - minY);
    };
    return getArea(b) - getArea(a); 
  });

  let mainPose = validPoses.length > 0 ? validPoses[0] : null;

  if (mainPose) {
    let kps = mainPose.keypoints;
    let currentKps = {
      nose: kps.find(k => k.name === 'nose'),
      left_wrist: kps.find(k => k.name === 'left_wrist'),
      right_wrist: kps.find(k => k.name === 'right_wrist')
    };

    let currentMotion = 0;
    
    for (let part of ['nose', 'left_wrist', 'right_wrist']) {
      let pt = currentKps[part];
      let prevPt = prevKeypoints[part];

      if (pt && (pt.confidence !== undefined ? pt.confidence : pt.score) > INTERACT_CONFIG.poseConfidence) {
        if (prevPt) {
          let d = dist(pt.x, pt.y, prevPt.x, prevPt.y);
          // ⭐️ 노이즈 필터 패널 적용
          if (d > STABILITY_CONFIG.cameraNoiseFilter && d > currentMotion) {
            currentMotion = d;
          }
        }
        prevKeypoints[part] = { x: pt.x, y: pt.y }; 
      } else {
        prevKeypoints[part] = null; 
      }
    }

    if (currentMotion > motionAmount) {
      motionAmount = lerp(motionAmount, currentMotion, STABILITY_CONFIG.motionSensitivityUp); 
    } else {
      motionAmount = lerp(motionAmount, currentMotion, STABILITY_CONFIG.motionSensitivityDown); 
    }
    
    if (currentKps.nose) {
      let nX = width - map(currentKps.nose.x, 0, video.width, 0, width); 
      let nY = map(currentKps.nose.y, 0, video.height, 0, height);
      targetPt.x = lerp(targetPt.x, nX, INTERACT_CONFIG.targetLerp);
      targetPt.y = lerp(targetPt.y, nY, INTERACT_CONFIG.targetLerp);
    }
    
    noPersonTimer = 0; 

    let rawTargetState = 0;
    if (motionAmount >= INTERACT_CONFIG.fleeThreshold) {
      rawTargetState = 2;
    } else if (motionAmount >= INTERACT_CONFIG.wanderThreshold) {
      rawTargetState = 0;
    } else {
      rawTargetState = 1;
    }

    if (rawTargetState === 2) {
      currentState = 2;
      stateTransitionTimer = 0;
    } else {
      if (rawTargetState !== currentState) {
        stateTransitionTimer++;
        // ⭐️ 버벅임 대기 시간 패널 적용
        if (stateTransitionTimer > STABILITY_CONFIG.calmDownFrames) {
          currentState = rawTargetState;
          stateTransitionTimer = 0;
        }
      } else {
        stateTransitionTimer = 0;
      }
    }
    
  } else {
    noPersonTimer++;
    if (noPersonTimer > INTERACT_CONFIG.noPersonDelay) { 
      currentState = 0; 
      targetPt.x = lerp(targetPt.x, width / 2, INTERACT_CONFIG.targetReturnSpeed); 
      targetPt.y = lerp(targetPt.y, height / 2, INTERACT_CONFIG.targetReturnSpeed);
      // ⭐️ 사람이 없을 때도 서서히(관성) 진정되도록 변경
      motionAmount = lerp(motionAmount, 0, STABILITY_CONFIG.motionSensitivityDown); 
      prevKeypoints = { nose: null, left_wrist: null, right_wrist: null };
    }
  }
}

// ------------------------------------------
// 🎨 배경 및 바닥 렌더링 함수들
// ------------------------------------------
function drawSmoothBackground() {
  let ctx = drawingContext; let t = frameCount * BG_CONFIG.moveSpeed;
  background(BG_CONFIG.colorTL);
  let r = width * 0.9; 
  drawSoftGradientCircle(ctx, width * 0.8 + cos(t)*150, height * 0.2 + sin(t)*150, r, BG_CONFIG.colorTR);
  drawSoftGradientCircle(ctx, width * 0.2 + sin(t*0.8)*150, height * 0.8 + cos(t*1.2)*150, r, BG_CONFIG.colorBL);
  drawSoftGradientCircle(ctx, width * 0.8 + cos(t*1.1)*150, height * 0.8 + sin(t*0.9)*150, r, BG_CONFIG.colorBR);
}
function drawSoftGradientCircle(ctx, x, y, r, colorHex) {
  let grad = ctx.createRadialGradient(x, y, 0, x, y, r); let c = color(colorHex);
  grad.addColorStop(0, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, 1)`);
  grad.addColorStop(1, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, 0)`);
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function drawStaticDunes() {
  let ctx = drawingContext; noStroke();
  for (let i = 0; i < BG_CONFIG.dunes.length; i++) {
    let conf = BG_CONFIG.dunes[i]; let baseYPos = height * conf.baseY;
    let grad = ctx.createLinearGradient(0, baseYPos - conf.amplitude, 0, height);
    grad.addColorStop(0, conf.colorTop); grad.addColorStop(1, conf.colorBot); ctx.fillStyle = grad;
    beginShape(); vertex(0, height); 
    for (let x = 0; x <= width; x += 10) { vertex(x, baseYPos - noise(x * conf.noiseScale, conf.noiseOffset) * conf.amplitude); }
    vertex(width, height); endShape(CLOSE);
  }
}

// ======================================================================
// ======================================================================
// 👾 [생명체(Boid) 클래스]
// ======================================================================
class Boid {
  constructor(x, y) {
    this.pos = createVector(x, y); this.vel = p5.Vector.random2D(); this.acc = createVector();
    this.baseR = random(BOID_CONFIG.baseRadiusMin, BOID_CONFIG.baseRadiusMax);
    this.currentScale = random(0.8, 1.2); 
    this.currentMaxSpeed = BOID_CONFIG.baseMaxSpeed * STATE_CONFIG[0].speedMultiplier;
    this.zOffset = random(1000); this.baseAlpha = STATE_CONFIG[0].alphaTarget;
    
    this.toSparkleAlpha = 0;   
    
    this.activeLerpScale = STATE_CONFIG[0].lerpScale;
    this.activeLerpSpeed = STATE_CONFIG[0].lerpSpeed;
    this.activeLerpAlpha = STATE_CONFIG[0].alphaTarget;
  }
  
  checkCollision(boids) {
    let minDist = BOID_CONFIG.sparkleDistanceState1;
    let hasCloseNeighbor = false;

    for (let other of boids) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < BOID_CONFIG.sparkleDistanceState1 && abs(this.currentScale - other.currentScale) < BOID_CONFIG.sparkleZMargin) {
          if (d < minDist) {
            minDist = d;
            hasCloseNeighbor = true;
          }
        }
      }
    }
    
    if (hasCloseNeighbor) {
      this.targetSparkleAlpha = map(minDist, 0, BOID_CONFIG.sparkleDistanceState1, 1.0, 0.0, true);
    } else {
      this.targetSparkleAlpha = 0.0;
    }
  }
  
  flock(boids, state, target) {
    let sep = this.separate(boids); 
    let ali = this.align(boids); 
    let coh = this.cohesion(boids);
    let settings = STATE_CONFIG[state].weights;
    let seekForce = createVector(0, 0);

    // ⭐️ [오류 해결] 패닉(상태 2)일 때 군대처럼 한 방향으로 뭉쳐서 날아가는 현상 강제 차단!
    if (state === 2) {
      ali.mult(0); // 옆 친구와 방향 맞추는 본능 끄기 (각자도생)
      coh.mult(0); // 뭉치는 본능 끄기
    } else {
      ali.mult(settings.ali); 
      coh.mult(settings.coh);
    }
    
    sep.mult(settings.sep); 
    seekForce = this.seek(target).mult(settings.seek); 

    this.applyForce(sep); 
    this.applyForce(ali); 
    this.applyForce(coh); 
    this.applyForce(seekForce);
    
    // ⭐️ [오류 해결] 패닉일 때는 벌레처럼 사방으로 흩어지게 개별 발버둥(노이즈) 폭발!
    let ns = (state === 2) ? 2.0 : BOID_CONFIG.noiseStrength;
    let nSpeed = (state === 2) ? 0.3 : 0.01;
    this.applyForce(createVector(map(noise(this.zOffset, frameCount * nSpeed), 0, 1, -ns, ns), map(noise(this.zOffset + 1000, frameCount * nSpeed), 0, 1, -ns, ns)));
  }
  
  update(state, prevState, isStateChanged) {
    let settings = STATE_CONFIG[state];
    
    if (state === 2) {
      this.activeLerpScale = settings.lerpScale;
      this.activeLerpSpeed = settings.lerpSpeed;
      this.activeLerpAlpha = settings.lerpAlpha;
    } else {
      if (this.currentScale < 0.9) {
        this.activeLerpScale = RECOVERY_CONFIG.lerpScale;
        this.activeLerpSpeed = RECOVERY_CONFIG.lerpSpeed;
        this.activeLerpAlpha = RECOVERY_CONFIG.lerpAlpha;
      } else {
        this.activeLerpScale = settings.lerpScale;
        this.activeLerpSpeed = settings.lerpSpeed;
        this.activeLerpAlpha = settings.lerpAlpha;
      }
    }
    
    this.currentMaxSpeed = lerp(this.currentMaxSpeed, BOID_CONFIG.baseMaxSpeed * settings.speedMultiplier, this.activeLerpSpeed);
    this.vel.add(this.acc); this.vel.limit(this.currentMaxSpeed); this.pos.add(this.vel); this.acc.mult(0); this.zOffset += 0.01;
    
    let targetScale = settings.scaleTarget;
    if (state === 0) targetScale += map(noise(this.zOffset), 0, 1, -0.2, 0.2); 
    
    this.currentScale = lerp(this.currentScale, targetScale, this.activeLerpScale);
    this.baseAlpha = lerp(this.baseAlpha, settings.alphaTarget, this.activeLerpAlpha);
    
    let targetAlpha = this.targetSparkleAlpha || 0.0;
    this.toSparkleAlpha = lerp(this.toSparkleAlpha, targetAlpha, BOID_CONFIG.sparkleStateLerp);
  }
  
  display() {
    push(); 
    translate(this.pos.x, this.pos.y); 
    scale(this.currentScale); 

    let baseA = this.baseAlpha / 255.0;
    let imgSize = this.baseR * 4;
    imageMode(CENTER);

    if (imgNormal) {
      drawingContext.globalAlpha = baseA * (1.0 - this.toSparkleAlpha); 
      image(imgNormal, 0, 0, imgSize, imgSize);
    }

    if (imgSparkle && this.toSparkleAlpha > 0.001) {
      drawingContext.globalAlpha = baseA * this.toSparkleAlpha; 
      image(imgSparkle, 0, 0, imgSize, imgSize);
    }

    drawingContext.globalAlpha = 1.0; 
    
    pop();
  }
  
  applyForce(force) { this.acc.add(force); }
  
  seek(target) { 
    let desired = p5.Vector.sub(target, this.pos); 
    let d = desired.mag();
    
    if (currentState === 1 && d < INTERACT_CONFIG.targetStopRadius) {
      let m = map(d, 0, INTERACT_CONFIG.targetStopRadius, 0, this.currentMaxSpeed);
      desired.setMag(m);
    } else {
      desired.setMag(this.currentMaxSpeed);
    }
    
    let steer = p5.Vector.sub(desired, this.vel); 
    // ⭐️ [오류 해결] 패닉일 때는 무거운 핸들 잠금을 풀어서(15배) 즉시 방향을 꺾고 흩어지게 함!
    let mForce = (currentState === 2) ? BOID_CONFIG.maxForce * 15 : BOID_CONFIG.maxForce;
    steer.limit(mForce); 
    return steer; 
  }
  
  separate(boids) { 
    let s = createVector(); let c = 0; 
    let currentSepDist = STATE_CONFIG[currentState].separationDist; 
    
    for (let o of boids) { 
      let d = dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y); 
      if (d > 0 && d < currentSepDist) { 
        let diff = p5.Vector.sub(this.pos, o.pos); diff.normalize(); diff.div(d); s.add(diff); c++; 
      } 
    } 
    if (c > 0) s.div(c); 
    if (s.mag() > 0) { 
      s.normalize(); s.mult(this.currentMaxSpeed); s.sub(this.vel); 
      let mForce = (currentState === 2) ? BOID_CONFIG.maxForce * 15 : BOID_CONFIG.maxForce;
      s.limit(mForce); 
    } 
    return s; 
  }
  
  align(boids) { 
    let s = createVector(); let c = 0; 
    for (let o of boids) { 
      let d = dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y); 
      if (d > 0 && d < BOID_CONFIG.alignDist) { s.add(o.vel); c++; } 
    } 
    if (c > 0) { 
      s.div(c); s.normalize(); s.mult(this.currentMaxSpeed); 
      let st = p5.Vector.sub(s, this.vel); 
      let mForce = (currentState === 2) ? BOID_CONFIG.maxForce * 15 : BOID_CONFIG.maxForce;
      st.limit(mForce); 
      return st; 
    } 
    return createVector(); 
  }
  
  cohesion(boids) { 
    let s = createVector(); let c = 0; 
    for (let o of boids) { 
      let d = dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y); 
      if (d > 0 && d < BOID_CONFIG.cohesionDist) { s.add(o.pos); c++; } 
    } 
    if (c > 0) { 
      s.div(c); return this.seek(s); 
    } 
    return createVector(); 
  }
  
  edges() { 
    let b = this.baseR * 4; 
    if (this.pos.x > width + b) this.pos.x = -b; 
    if (this.pos.x < -b) this.pos.x = width + b; 
    if (this.pos.y > height + b) this.pos.y = -b; 
    if (this.pos.y < -b) this.pos.y = height + b; 
  }
}