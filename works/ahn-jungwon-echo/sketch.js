let fluidShader;
let cPos = [];
let seeds = [];
let NUM = 20;
let started = false;
let track1, track2, track3, track4, track5;

// 오디오
let mic, fft;
let smoothEnergy = 0;
let prevEnergy = 0;
let punch = 0;
let smoothWarp = 0;

// QWER 효과용 변수
let qPressed = false, wPressed = false, ePressed = false, rPressed = false;
let cloudFade = 0;      // 0 = 구름 보임, 1 = 구름 사라짐
let skyDark = 0;        // 0 = 원래 하늘, 1 = 검정
let creatureFade = 0;   // 0 = 크리쳐 보임, 1 = 크리쳐 사라짐
let buildingOpacity = 0.8; // 건물 이미지 opacity
let buildingBlur = 0;
let imgEl;

let vertSrc = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

let fragSrc = `
precision highp float;
varying vec2 vTexCoord;
uniform float u_time;
uniform float u_energy;
uniform float u_punch;
uniform float u_warp;
uniform float u_cloudFade;
uniform float u_skyDark;
uniform float u_creatureFade;

uniform vec4 u_cp0, u_cp1, u_cp2, u_cp3, u_cp4;
uniform vec4 u_cp5, u_cp6, u_cp7, u_cp8, u_cp9;
uniform vec4 u_sd0, u_sd1, u_sd2, u_sd3, u_sd4;

vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 0.5 + 0.5 * n_xy;
}

float noise3d(vec2 p, float z) {
  return cnoise(p + vec2(z * 1.7, z * 2.3));
}

float fbm3(vec2 p, float z) {
  float v = 0.0;
  v += 0.5 * noise3d(p, z);
  v += 0.25 * noise3d(p * 2.0, z);
  v += 0.125 * noise3d(p * 4.0, z);
  return v;
}

vec3 checkCreature(vec2 uv, vec2 cpos, float t, float seed) {
  vec2 delta = uv - cpos;
  float aspect = 0.6 + fract(seed * 1.23) * 0.9;
  float baseRot = fract(seed * 4.56) * 3.14159;
  float rot = baseRot + t * 0.08 * (fract(seed * 7.89) - 0.5);
  float cs = cos(rot);
  float sn = sin(rot);
  vec2 rd = vec2(delta.x * cs - delta.y * sn, delta.x * sn + delta.y * cs);
  rd.x *= aspect;
  float d = length(rd);
  float sizeMul = 1.0 + pow(fract(seed * 2.34), 3.0) * 3.0;
  float bn = cnoise(uv * 12.0 + cpos * 8.0 + t * 0.2);
  float r = (0.012 + bn * 0.006) * sizeMul;
  float inf = smoothstep(r * 2.5, r * 0.3, d);
  float glow = smoothstep(r * 7.0, r * 0.5, d) * 0.3;
  float edgeFade = smoothstep(-0.02, 0.06, cpos.x) * smoothstep(1.02, 0.94, cpos.x) *
                   smoothstep(-0.02, 0.06, cpos.y) * smoothstep(1.02, 0.94, cpos.y);
  inf *= edgeFade;
  glow *= edgeFade;
  return vec3(inf + glow, inf * 0.4, glow);
}

void main() {
  vec2 uv = vTexCoord;
  float t = u_time;
  float energy = u_energy;
  float pnch = u_punch;
  float warp = u_warp;

  vec3 ci = vec3(0.0);
  ci += checkCreature(uv, u_cp0.xy, t, u_sd0.x);
  ci += checkCreature(uv, u_cp0.zw, t, u_sd0.y);
  ci += checkCreature(uv, u_cp1.xy, t, u_sd0.z);
  ci += checkCreature(uv, u_cp1.zw, t, u_sd0.w);
  ci += checkCreature(uv, u_cp2.xy, t, u_sd1.x);
  ci += checkCreature(uv, u_cp2.zw, t, u_sd1.y);
  ci += checkCreature(uv, u_cp3.xy, t, u_sd1.z);
  ci += checkCreature(uv, u_cp3.zw, t, u_sd1.w);
  ci += checkCreature(uv, u_cp4.xy, t, u_sd2.x);
  ci += checkCreature(uv, u_cp4.zw, t, u_sd2.y);
  ci += checkCreature(uv, u_cp5.xy, t, u_sd2.z);
  ci += checkCreature(uv, u_cp5.zw, t, u_sd2.w);
  ci += checkCreature(uv, u_cp6.xy, t, u_sd3.x);
  ci += checkCreature(uv, u_cp6.zw, t, u_sd3.y);
  ci += checkCreature(uv, u_cp7.xy, t, u_sd3.z);
  ci += checkCreature(uv, u_cp7.zw, t, u_sd3.w);
  ci += checkCreature(uv, u_cp8.xy, t, u_sd4.x);
  ci += checkCreature(uv, u_cp8.zw, t, u_sd4.y);
  ci += checkCreature(uv, u_cp9.xy, t, u_sd4.z);
  ci += checkCreature(uv, u_cp9.zw, t, u_sd4.w);

  float creatureInfluence = clamp(ci.x, 0.0, 1.0);
  float creatureDistort = ci.y;
  float creatureGlow = clamp(ci.z, 0.0, 1.0);

  float nx = uv.x * 5.0;
  float ny = uv.y * 3.0;
  float totalDistort = creatureDistort + warp * 0.6;
  nx += totalDistort * cnoise(uv * 8.0 + t * 0.5);
  ny += totalDistort * cnoise(uv * 8.0 + t * 0.5 + 50.0);

  vec2 center = vec2(2.5, 1.5);
  vec2 fromCenter = vec2(nx, ny) - center;
  float dist = length(fromCenter);
  float angle = atan(fromCenter.y, fromCenter.x);
  float warpMul = 1.0 + warp * 0.8;

  float w1x = fbm3(vec2(nx + sin(angle + t * 0.04) * dist * 0.3,
                         ny + cos(angle - t * 0.04) * dist * 0.3),
                    t * 0.06) * 3.0 * warpMul;
  float w1y = fbm3(vec2(nx + cos(angle - t * 0.03) * dist * 0.3 + 50.0,
                         ny + sin(angle + t * 0.03) * dist * 0.3 + 50.0),
                    t * 0.06) * 3.0 * warpMul;

  float w2x = noise3d(vec2(nx + w1x + 100.0, ny + w1y), t * 0.02) * 2.5;
  float w2y = noise3d(vec2(nx + w1x, ny + w1y + 150.0), t * 0.02) * 2.5;

  float n = fbm3(vec2(nx + w2x, ny + w2y), t * 0.04);
  float cloud = fbm3(vec2(nx * 0.7 + w2x * 0.8, ny * 0.7 + w2y * 0.8), t * 0.025);
  float detail = noise3d(vec2(nx * 3.0 + w2x, ny * 3.0 + w2y), t * 0.03);

  // ---- 색상 (3번: 밝기 올림) ----
  vec3 deepBlue = vec3(0.09, 0.11, 0.26);
  vec3 midBlue = vec3(0.15, 0.22, 0.46);
  vec3 skyBlue = vec3(0.22, 0.32, 0.58);
  vec3 lavender = vec3(0.62, 0.55, 0.7);
  vec3 softPink = vec3(0.76, 0.63, 0.68);
  vec3 warmPink = vec3(0.84, 0.68, 0.7);
  vec3 cloudWhite = vec3(0.8, 0.76, 0.83);
  vec3 peach = vec3(0.86, 0.7, 0.63);

  deepBlue = mix(deepBlue, vec3(0.04, 0.06, 0.2), warp);
  midBlue = mix(midBlue, vec3(0.18, 0.15, 0.5), warp);
  lavender = mix(lavender, vec3(0.7, 0.55, 0.75), warp * 0.7);

  float sky = fbm3(vec2(nx + w1x * 1.8 + 300.0, ny + w1y * 1.8), t * 0.008);
  float cloudAmount = smoothstep(0.38, 0.55, sky);
  cloudAmount = pow(cloudAmount, 0.7);

  float skyDepth = noise3d(vec2(nx * 0.8 + 400.0, ny * 0.8), t * 0.01);
  vec3 skyCol = mix(deepBlue, midBlue, skyDepth);
  skyCol = mix(skyCol, skyBlue, smoothstep(0.3, 0.6, sky) * 0.4);

  // ---- W: 하늘을 검정으로 ----
  skyCol = mix(skyCol, vec3(0.0, 0.0, 0.0), u_skyDark);

  float cloudVar = cloud * 0.4 + detail * 0.6;
  float grain = pow(detail, 0.8);

  vec3 cloudCol = mix(lavender, softPink, cloudVar);
  cloudCol = mix(cloudCol, cloudWhite, smoothstep(0.45, 0.75, grain));

  float edgeGlow = smoothstep(0.3, 0.5, cloudAmount) - smoothstep(0.5, 0.75, cloudAmount);
  cloudCol = mix(cloudCol, warmPink, edgeGlow * 0.45);

  float highlight = smoothstep(0.55, 0.85, grain) * cloudAmount;
  cloudCol = mix(cloudCol, peach, highlight * 0.2);

  // ---- Q: 구름이 사라지면서 하늘만 남음 ----
  float effCloudAmount = cloudAmount * (1.0 - u_cloudFade);

  vec3 col = mix(skyCol, cloudCol, effCloudAmount);

  vec3 edgeBlue = vec3(0.28, 0.42, 0.62);
  float borderGlow = smoothstep(0.2, 0.42, cloudAmount) - smoothstep(0.42, 0.62, cloudAmount);
  col = mix(col, edgeBlue, borderGlow * 0.2 * (1.0 - u_cloudFade));

  // ---- 4번: 상단 틸/터콰이즈 포인트 ----
  float topGrad = smoothstep(0.7, 0.0, uv.y);
  vec3 tealAccent = vec3(0.12, 0.3, 0.35);
  col = mix(col, col + tealAccent, topGrad * 0.5 * (1.0 - u_skyDark));

  // ---- 2번: 하단 도시 불빛 따뜻한 글로우 ----
  float bottomGrad = smoothstep(0.35, 1.0, uv.y);
  vec3 cityWarm = vec3(0.35, 0.2, 0.1);
  col = mix(col, col + cityWarm, bottomGrad * 0.5 * (1.0 - u_skyDark));

  // ---- 크리쳐 ----
  vec3 starCore = vec3(0.95, 0.93, 1.0);
  vec3 starGlow = vec3(0.5, 0.48, 0.7);
  float glowBoost = 1.0 + pnch * 0.8 + energy * 0.4;
  float coreBoost = 0.7 + pnch * 0.1;
  float spreadBoost = 1.0 + pnch * 0.8;

  // ---- R: 크리쳐가 사라짐 ----
  float creatureVis = 1.0 - u_creatureFade;
  float effCreatureInfluence = creatureInfluence * creatureVis;
  float effCreatureGlow = creatureGlow * creatureVis;

  col += starGlow * effCreatureGlow * 0.9 * spreadBoost;
  vec3 creatureCol = mix(col, starCore * (1.0 + pnch * 0.3), effCreatureInfluence * coreBoost);
  col = mix(col, creatureCol, effCreatureInfluence);

  col += vec3(0.02, 0.01, 0.03) * warp;

  gl_FragColor = vec4(col, 1.0);
}
`;

function preload() {
  track1 = loadSound('1.mp3');
  track2 = loadSound('2.mp3');
  track3 = loadSound('3.mp3');
  track4 = loadSound('4.mp3');
  track5 = loadSound('5.mp3');
}

function setup() {
  let canvas = createCanvas(1280, 720, WEBGL);
  canvas.position(0, 0);
  fluidShader = createShader(vertSrc, fragSrc);
  noStroke();

  // ---- 이미지 HTML로 올리기 ----
  imgEl = createImg('buildings.png', '');
  imgEl.style('position', 'fixed');
  imgEl.style('top', '0');
  imgEl.style('left', '0');
  imgEl.style('width', '1280px');
  imgEl.style('height', '720px');
  imgEl.style('pointer-events', 'none');
  imgEl.style('opacity', '0.8');

  // 브라우저 기본 입력 장치 사용
  mic = new p5.AudioIn();

  // 크리쳐 초기화
  let cols = 5;
  let rows = 4;
  for (let i = 0; i < NUM; i++) {
    let col = i % cols;
    let rowIdx = floor(i / cols);
    cPos.push({
      x: (col + 0.5) / cols * 0.9 + 0.05 + random(-0.06, 0.06),
      y: (rowIdx + 0.5) / rows * 0.9 + 0.05 + random(-0.06, 0.06),
      ox: random(10000),
      oy: random(20000),
    });
    seeds.push(random());
  }
}

function mousePressed() {
  if (!started) {
    userStartAudio().then(() => {
      mic.start();
      fft = new p5.FFT(0.8, 256);
      fft.setInput(mic);
      track1.loop(); track2.loop(); track3.loop(); track4.loop(); track5.loop();
      started = true;
    });
  }
}

function keyPressed() {
  if (key === 'q' || key === 'Q') { track1.setVolume(0); track2.setVolume(0); qPressed = true; }
  if (key === 'w' || key === 'W') { track3.setVolume(0); wPressed = true; }
  if (key === 'e' || key === 'E') { track4.setVolume(0); ePressed = true; }
  if (key === 'r' || key === 'R') { track5.setVolume(0); rPressed = true; }
}

function keyReleased() {
  if (key === 'q' || key === 'Q') { track1.setVolume(1); track2.setVolume(1); qPressed = false; }
  if (key === 'w' || key === 'W') { track3.setVolume(1); wPressed = false; }
  if (key === 'e' || key === 'E') { track4.setVolume(1); ePressed = false; }
  if (key === 'r' || key === 'R') { track5.setVolume(1); rPressed = false; }
}

window.addEventListener('blur', function() {
  qPressed = false;
  wPressed = false;
  ePressed = false;
  rPressed = false;
  if (track1) { track1.setVolume(1); track2.setVolume(1); }
  if (track3) track3.setVolume(1);
  if (track4) track4.setVolume(1);
  if (track5) track5.setVolume(1);
});

// 보조: 매 프레임 실제로 눌려있는 키 set과 비교해서
// 누락된 keyup을 보정 (동시에 여러 키를 뗄 때 일부 keyup이 드랍되는 문제 대응)
let activeKeys = new Set();
window.addEventListener('keydown', function(e) {
  activeKeys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', function(e) {
  activeKeys.delete(e.key.toLowerCase());
});

function syncKeyStates() {
  if (qPressed && !activeKeys.has('q')) {
    track1.setVolume(1); track2.setVolume(1); qPressed = false;
  }
  if (wPressed && !activeKeys.has('w')) {
    track3.setVolume(1); wPressed = false;
  }
  if (ePressed && !activeKeys.has('e')) {
    track4.setVolume(1); ePressed = false;
  }
  if (rPressed && !activeKeys.has('r')) {
    track5.setVolume(1); rPressed = false;
  }
}

function draw() {
  syncKeyStates();
  let t = millis() / 1000.0;

  let energy = 0;
  if (started && fft) {
    let gaini = 3;
    let spectrum = fft.analyze();
    let totalEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      let weight = i < spectrum.length * 0.25 ? 3.0 : (i < spectrum.length * 0.5 ? 1.5 : 1.0);
      totalEnergy += spectrum[i] * weight;
    }
    let weightSum = spectrum.length * 0.25 * 3.0 + spectrum.length * 0.25 * 1.5 + spectrum.length * 0.5 * 1.0;
    energy = (totalEnergy / weightSum) * gaini;
    energy = constrain(energy, 0, 255);
  }

  smoothEnergy = lerp(smoothEnergy, energy, 0.25);

  let delta = smoothEnergy - prevEnergy;
  if (delta > 2) {
    let newPunch = map(delta, 2, 40, 0.15, 1.0, true);
    punch = constrain(punch + newPunch, 0, 1);
  }
  punch *= 0.94;
  let minPunch = map(smoothEnergy, 0, 100, 0, 0.3, true);
  if (punch < minPunch) punch = lerp(punch, minPunch, 0.1);
  prevEnergy = smoothEnergy;

  let normEnergy = smoothEnergy / 255.0;
  let normPunch = punch;
  let warpTarget = normPunch * 0.5 + normEnergy * 0.3;
  let warpSpeed = warpTarget > smoothWarp ? 0.08 : 0.03;
  smoothWarp = lerp(smoothWarp, warpTarget, warpSpeed);

  // ---- QWER 효과 부드럽게 전환 ----
  let fadeSpeed = 0.04;
  cloudFade = lerp(cloudFade, qPressed ? 1 : 0, fadeSpeed);
  skyDark = lerp(skyDark, wPressed ? 1 : 0, fadeSpeed);
  creatureFade = lerp(creatureFade, rPressed ? 1 : 0, fadeSpeed);

  // E: 건물 이미지가 블러되며 페이드 아웃
  let fadeSpeedE = 0.04;
  let targetOpacity = ePressed ? 0 : 0.8;
  let targetBlur = ePressed ? 18 : 0;
  buildingOpacity = lerp(buildingOpacity, targetOpacity, fadeSpeedE);
  buildingBlur = lerp(buildingBlur, targetBlur, fadeSpeedE);
  if (imgEl) {
    imgEl.style('opacity', buildingOpacity.toString());
    imgEl.style('filter', `blur(${buildingBlur}px)`);
  }

  for (let i = 0; i < NUM; i++) {
    let c = cPos[i];
    let dx = noise(c.ox, c.y * 2, t * 0.04) - 0.5;
    let dy = noise(c.oy, c.x * 2, t * 0.04) - 0.5;
    let speedi = 0.003 + noise(c.ox + 500, t * 0.02) * 0.002;
    speedi += normPunch * 0.003;
    c.x += dx * speedi;
    c.y += dy * speedi;

    for (let j = 0; j < NUM; j++) {
      if (i === j) continue;
      let other = cPos[j];
      let ddx = c.x - other.x;
      let ddy = c.y - other.y;
      let disti = sqrt(ddx * ddx + ddy * ddy);
      if (disti < 0.08 && disti > 0.001) {
        let force = (0.08 - disti) * 0.002;
        c.x += (ddx / disti) * force;
        c.y += (ddy / disti) * force;
      }
    }

    if (c.x < -0.05) c.x = 1.05;
    if (c.x > 1.05) c.x = -0.05;
    if (c.y < -0.05) c.y = 1.05;
    if (c.y > 1.05) c.y = -0.05;
  }

  shader(fluidShader);
  fluidShader.setUniform('u_time', t);
  fluidShader.setUniform('u_energy', normEnergy);
  fluidShader.setUniform('u_punch', normPunch);
  fluidShader.setUniform('u_warp', smoothWarp);
  fluidShader.setUniform('u_cloudFade', cloudFade);
  fluidShader.setUniform('u_skyDark', skyDark);
  fluidShader.setUniform('u_creatureFade', creatureFade);

  fluidShader.setUniform('u_cp0', [cPos[0].x, cPos[0].y, cPos[1].x, cPos[1].y]);
  fluidShader.setUniform('u_cp1', [cPos[2].x, cPos[2].y, cPos[3].x, cPos[3].y]);
  fluidShader.setUniform('u_cp2', [cPos[4].x, cPos[4].y, cPos[5].x, cPos[5].y]);
  fluidShader.setUniform('u_cp3', [cPos[6].x, cPos[6].y, cPos[7].x, cPos[7].y]);
  fluidShader.setUniform('u_cp4', [cPos[8].x, cPos[8].y, cPos[9].x, cPos[9].y]);
  fluidShader.setUniform('u_cp5', [cPos[10].x, cPos[10].y, cPos[11].x, cPos[11].y]);
  fluidShader.setUniform('u_cp6', [cPos[12].x, cPos[12].y, cPos[13].x, cPos[13].y]);
  fluidShader.setUniform('u_cp7', [cPos[14].x, cPos[14].y, cPos[15].x, cPos[15].y]);
  fluidShader.setUniform('u_cp8', [cPos[16].x, cPos[16].y, cPos[17].x, cPos[17].y]);
  fluidShader.setUniform('u_cp9', [cPos[18].x, cPos[18].y, cPos[19].x, cPos[19].y]);

  fluidShader.setUniform('u_sd0', [seeds[0], seeds[1], seeds[2], seeds[3]]);
  fluidShader.setUniform('u_sd1', [seeds[4], seeds[5], seeds[6], seeds[7]]);
  fluidShader.setUniform('u_sd2', [seeds[8], seeds[9], seeds[10], seeds[11]]);
  fluidShader.setUniform('u_sd3', [seeds[12], seeds[13], seeds[14], seeds[15]]);
  fluidShader.setUniform('u_sd4', [seeds[16], seeds[17], seeds[18], seeds[19]]);

  rect(0, 0, width, height);
}