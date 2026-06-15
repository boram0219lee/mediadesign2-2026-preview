let sourceImg;
let srcPixels;
 
let breathPhase = 0;
let breathSpeed = 0.025;
 
let lightX = 0;
let lightY = 0;
let lightIntensity = 0;
let lightDecay = 0.94;
let prevMX = 0;
let prevMY = 0;

// ── 사운드 관련 변수 추가 ──────────────────────
let ambientNoise;  // 배경에 깔릴 화이트 노이즈
let ambientFilter; // 호흡 주기에 맞춰 먹먹함을 조절할 필터
let grainOsc;      // 마우스 속도에 반응해 잘게 쪼개질 오실레이터
let grainFilter;   // 그레이니한 고주파를 걸러줄 필터
 
function preload() {
  sourceImg = loadImage('source.jpg');
}
 
function setup() {
  createCanvas(960, 540);
  pixelDensity(1);
  frameRate(30);
 
  // 원본 픽셀 저장 — loadPixels()는 여기서만
  image(sourceImg, 0, 0, width, height);
  loadPixels();
  srcPixels = new Uint8ClampedArray(pixels);
 
  lightX = width / 2;
  lightY = height / 2;
  prevMX = width / 2;
  prevMY = height / 2;

  // ── 사운드 객체 초기화 및 연결 ─────────────────
  // 1. 앰비언트 노이즈 설정 (배경 바탕음)
  ambientNoise = new p5.Noise('white');
  ambientFilter = new p5.LowPass();
  ambientNoise.disconnect(); 
  ambientNoise.connect(ambientFilter); // 노이즈 -> 필터 연결
  ambientNoise.amp(0.08);              // 기본 볼륨 잔잔하게 설정
  
  // 2. 그레이니 사운드 설정 (인터랙션 마찰음)
  grainOsc = new p5.Oscillator('triangle');
  grainFilter = new p5.BandPass();
  grainOsc.disconnect();
  grainOsc.connect(grainFilter);       // 오실레이터 -> 밴드패스 필터 연결
  grainOsc.amp(0.0);                   // 처음엔 음소거
  
  // 사운드 시작 (브라우저 정책 상 첫 클릭이나 인터랙션 후 소리가 출력됨)
  ambientNoise.start();
  grainOsc.start();
}
 
function draw() {
  // 브라우저 오디오 컨텍스트 안전하게 재개 (사용자 인터랙션 대응)
  if (getAudioContext().state !== 'running') {
    text('Click to sound on', 20, 20);
  }

  // 원본 픽셀을 canvas에 복원
  for (let i = 0; i < srcPixels.length; i++) {
    pixels[i] = srcPixels[i];
  }
 
  // ── 호흡 ──────────────────────────────────────
  breathPhase += breathSpeed;
  let breathe = sin(breathPhase);         // -1 ~ 1
  // [수정사항 반영]: 기본 미세 움직임의 크기를 30% 증가 (22 * 1.3 = 28.6)
  let baseLow  = 55 + breathe * 30;
  let baseHigh = 210 - breathe * 30;
 
  // ── 빛의 강도 ─────────────────────────────────
  let dx = mouseX - prevMX;
  let dy = mouseY - prevMY;
  let mouseSpeed = sqrt(dx * dx + dy * dy); // '순간' 속도
  lightIntensity = min(1.0, lightIntensity + mouseSpeed * 0.05);
  lightIntensity *= lightDecay;
  lightX = mouseX;
  lightY = mouseY;
  prevMX = mouseX;
  prevMY = mouseY;

  // ── 사운드 실시간 제어 (제시된 인터랙션 연동) ───
  // 1. 호흡 주기에 맞춰 앰비언트 노이즈의 먹먹함(주파수)을 변조 (숨쉬는 듯한 배경음)
  let noiseFreq = map(breathe, -1, 1, 200, 700);
  ambientFilter.freq(noiseFreq);

  // 2. 마우스 속도에 반응하는 그레이니 사운드 제어
  if (mouseSpeed > 0.5) {
    // 속도가 빠를수록 고주파의 서각거리는 거친 톤이 나오도록 매핑
    let targetFreq = map(min(mouseSpeed, 30), 0, 30, 100, 1500);
    grainOsc.freq(targetFreq);
    
    // 잘게 쪼개지는 노이즈 질감(Grain)을 만들기 위해 필터 대역폭과 주파수를 무작위 변조
    grainFilter.freq(targetFreq + random(-200, 200));
    grainFilter.res(random(5, 25)); // 좁은 대역폭으로 공명감 형성
    
    // 마우스 속도 및 노란색 범위 강도(lightIntensity)에 맞춰 볼륨 실시간 조절
    let targetAmp = map(lightIntensity, 0, 1, 0.0, 0.4);
    grainOsc.amp(targetAmp, 0.05); // 0.05초 페이드로 부드럽게 연결
  } else {
    grainOsc.amp(0.0, 0.1); // 마우스가 멈추면 인터랙션 소리 해제
  }
 
  // ── 열마다 정렬 ───────────────────────────────
  for (let x = 0; x < width; x++) {
    let distToLight = abs(x - lightX) / width;
    
    // [수정사항 반영]: 아무리 빨라도 뭉개지지 않게 최솟값을 8.0으로 제한하고, 느려지면 자연스럽게 좁아지도록 매핑
    let attenuation = map(min(mouseSpeed, 15), 0, 15, 18.0, 8.0);
    let currentInfluence = lightIntensity * max(0, 1.0 - distToLight * attenuation);
    
    let tLow  = baseLow  - currentInfluence * 55;
    let tHigh = baseHigh + currentInfluence * 55;
    
    sortColumn(x, tLow, tHigh, currentInfluence);
  }
 
  updatePixels();
}
 
function sortColumn(x, tLow, tHigh, influence) {
  let y = 0;
  while (y < height) {
    let b = getLuma(x, y);
    if (b > tLow && b < tHigh) {
      let start = y;
      let seg = [];
      while (y < height) {
        let bv = getLuma(x, y);
        if (bv > tLow && bv < tHigh) {
          let idx = (y * width + x) * 4;
          
          let origR = pixels[idx];
          let origG = pixels[idx + 1];
          let origB = pixels[idx + 2];
          
          let distY = abs(y - lightY) / height;
          let yAttenuation = 5.0; 
          let localInfluence = influence * max(0, 1.0 - distY * yAttenuation);
          
          let yellowR = 255;
          let yellowG = 255;
          let yellowB = 160 - localInfluence * 40; 
          
          let mixFactor = localInfluence * 0.85;
          let targetR = lerp(origR, yellowR, mixFactor);
          let targetG = lerp(origG, yellowG, mixFactor);
          let targetB = lerp(origB, yellowB, mixFactor);
          
          let targetLum = (targetR * 299 + targetG * 587 + targetB * 114) / 1000;
          
          seg.push({
            r: targetR,
            g: targetG,
            b: targetB,
            a: pixels[idx + 3],
            lum: targetLum
          });
          y++;
        } else { break; }
      }
      
      seg.sort((a, b) => a.lum - b.lum);
      
      for (let i = 0; i < seg.length; i++) {
        let idx = ((start + i) * width + x) * 4;
        pixels[idx]     = seg[i].r;
        pixels[idx + 1] = seg[i].g;
        pixels[idx + 2] = seg[i].b;
        pixels[idx + 3] = seg[i].a;
      }

      // [수정된 안전장치]: 내부 루프 탈출 조건과 상관없이 세그먼트가 수집되었다면 
      // y 값을 최소 1 혹은 수집된 세그먼트 길이만큼 확실히 밀어주어 무한 루프를 원천 차단합니다.
      y = start + max(1, seg.length);

    } else { 
      y++; 
    }
  }
}
 
function getLuma(x, y) {
  let idx = (y * width + x) * 4;
  return (pixels[idx] * 299 + pixels[idx + 1] * 587 + pixels[idx + 2] * 114) / 1000;
}

// 브라우저 오디오 정책 상, 화면을 한 번 클릭해 주어야 사운드가 정상 출력됩니다.
function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}