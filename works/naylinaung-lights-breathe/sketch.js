// --- BACKGROUND ---
const BG_DEEP       = [20,  8,  30];   // darkest bg color (top)
const BG_HIGH       = [55, 18,  75];   // lighter bg color (bottom)
const BG_CLOUD      = [200, 130, 200]; // cloud/fog glow color
const BG_CLOUD_TOP  = [180,  80, 180]; // top stage light color
const BG_FOG        = [100,  40, 140]; // bottom floor fog color

// --- FIREFLIES (M1) ---
const FF_CORE       = [220, 255, 100];  // firefly bright center dot
const FF_GLOW       = [136, 158,  62];  // firefly outer glow halo
const FF_MID        = [194, 224,  88];  // firefly mid glow ring
const FF_TRACE      = [132, 153,  60];  // firefly trail

// --- CHOSEN A / B / C RINGS ---
const RING_A        = [180, 255, 180];
const RING_B        = [255, 180, 255];
const RING_C        = [180, 220, 255];

// --- BUTTERFLY WING PALETTES (M2) ---
const BF_WINGS = [
  [180, 140, 255],[120, 220, 255],[255, 160, 220],[160, 255, 230],
];
const BF_GLOW = [
  [200, 100, 255],[ 60, 180, 255],[255, 100, 180],[ 80, 255, 200],
];

// --- PARTICLES (M2 trail) ---
const PARTICLE_COL  = [0, 205, 255];

const THEME_BG   = BG_DEEP;
const THEME_FF   = FF_CORE;
const THEME_GLOW = [140, 95, 255];

const PAL = {
  bgDeep: BG_DEEP, bgHigh: BG_HIGH,
  nebA:[THEME_GLOW[0]*.75,THEME_GLOW[1]*.45,THEME_GLOW[2]],
  nebB:[THEME_GLOW[0],THEME_GLOW[1]*.6,THEME_GLOW[2]*.88],
  fog:[THEME_GLOW[0]*.3,THEME_GLOW[1]*.2,THEME_GLOW[2]*.52],
  ffCore:FF_CORE, ffMid:FF_MID, ffGlow:FF_GLOW, ffTrace:FF_TRACE,
  chosen:[255,255,180], cA:RING_A, cB:RING_B, cC:RING_C,
  m2Cream:[255,242,198], m2Cyan:PARTICLE_COL,
};

const MARGIN = 100;
let state = -1, stateTimer = 0;
const OPEN_DUR = 10, TOTAL_FF = 80;
let fireflies = [], beings = [], particles = [], flock = [];
let previewBeings = [], previewFlock = [], previewParticles = [];
let bgAlpha = 0, blackAlpha = 0;
let spawnCount = 0, spawnTimer = 0;
let chosenA = null, chosenB = null, chosenC = null, chosenReady = false;
let chosenRevealTimer = 0;
const CHOSEN_REVEAL_DELAY = 200;
const CHOSEN_REVEAL_DUR   = 240;
let previewMode = 'none', previewTimer = 0;
let lastClickTarget = null, lastClickTime = 0;
const DBL_MS = 480;
let chosenButterfly = null;
let bfSpawnTimer = 0, bfSpawnCount = 0;
const TOTAL_BF = 38;
let chosenBird = null;
let xfTimer = 0;
const XF_DUR = 120;
let m2m3Phase = 0, m2m3Timer = 0;
const SCATTER_DUR = 140, SETTLE_DUR = 80;
let launchTimer = 0, loopTimer = 0;
let soloFF = null, soloTimer = 0, soloActive = false;
let mouseMoveDist = 0, lastMX = -1, lastMY = -1;
let allFlash = false, allFlashTimer = 0;
const ALL_FLASH_DUR = 180;
let rhythmActive = false;

function radialGlow(cx, cy, rx, ry, col, peakA, globalAlphaScale) {
  let ga = globalAlphaScale !== undefined ? globalAlphaScale : 1;
  let r = floor(col[0]), g = floor(col[1]), b = floor(col[2]);
  let pa = (peakA / 255) * ga;
  let grad = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0,   `rgba(${r},${g},${b},${pa})`);
  grad.addColorStop(0.35,`rgba(${r},${g},${b},${(pa*0.55).toFixed(3)})`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},${(pa*0.18).toFixed(3)})`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  let scaleY = ry / rx;
  drawingContext.save();
  drawingContext.translate(cx, cy);
  drawingContext.scale(1, scaleY);
  drawingContext.translate(-cx, -cy);
  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.ellipse(cx, cy, rx, rx, 0, 0, Math.PI * 2);
  drawingContext.fill();
  drawingContext.restore();
}

function glowDot(cx, cy, col, size, alpha) {
  let r = floor(col[0]), g = floor(col[1]), b = floor(col[2]);
  let a = alpha / 255;
  let grad = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, size);
  grad.addColorStop(0,   `rgba(255,255,245,${a})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${(a*0.8).toFixed(3)})`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, size, 0, Math.PI * 2);
  drawingContext.fill();
}

function setup() {
  createCanvas(1280, 720);
  colorMode(RGB, 255, 255, 255, 255);
  noStroke();
}

function draw() {
  stateTimer++;
  mouseMoveDist = lastMX >= 0 ? dist(mouseX, mouseY, lastMX, lastMY) : 0;
  lastMX = mouseX; lastMY = mouseY;
  drawBG();
  if      (state === -1) runOpening();
  else if (state ===  1) runM1();
  else if (state ===  2) runXfM2();
  else if (state ===  3) runM2();
  else if (state ===  4) runM2toM3();
  else if (state ===  5) runM3();
  else if (state ===  6) runLoop();
  overlayBlack();
  drawingContext.globalAlpha = 1.0;
}

// ============================================================
// INPUT
// ============================================================
function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('when_lights_breathe_thumbnail', 'png');
}

function mousePressed() {
  let now = millis();
  if (state === 1 && chosenReady) {
    if (chosenA && dist(mouseX, mouseY, chosenA.x, chosenA.y) < 50 + chosenA.size * 2) {
      allFlash = true; allFlashTimer = 0; rhythmActive = true;
      lastClickTarget = 'A'; lastClickTime = now; return;
    }
    if (chosenB && dist(mouseX, mouseY, chosenB.x, chosenB.y) < 50 + chosenB.size * 2) {
      if (lastClickTarget === 'B' && now - lastClickTime < DBL_MS) {
        initM2(); state = 2; xfTimer = 0; stateTimer = 0; previewBeings = [];
      } else {
        spawnPreviewBF(); previewMode = 'butterfly'; previewTimer = 0;
      }
      lastClickTarget = 'B'; lastClickTime = now; return;
    }
    if (chosenC && dist(mouseX, mouseY, chosenC.x, chosenC.y) < 50 + chosenC.size * 2) {
      if (lastClickTarget === 'C' && now - lastClickTime < DBL_MS) {
        initM3(); state = 5; stateTimer = 0; previewFlock = [];
      } else {
        spawnPreviewBirds(); previewMode = 'birds'; previewTimer = 0;
      }
      lastClickTarget = 'C'; lastClickTime = now; return;
    }
  }
  if (state === 3 && chosenButterfly) {
    let b = chosenButterfly;
    if (dist(mouseX, mouseY, b.x, b.y) < 55 + b.sc * 40) {
      for (let bb of beings) bb.scatter();
      initM3(); state = 4; m2m3Phase = 0; m2m3Timer = 0; stateTimer = 0;
    }
  }
}

// ============================================================
// BACKGROUND
// ============================================================
function drawBG() {
  background(...PAL.bgDeep);
  if (bgAlpha < 255) bgAlpha = min(255, bgAlpha + 1.1);
  let a = bgAlpha / 255;
  let vgrad = drawingContext.createLinearGradient(0, 0, 0, height);
  vgrad.addColorStop(0,   `rgba(${floor(150*a)},${floor(50*a)},${floor(140*a)},1)`);
  vgrad.addColorStop(0.4, `rgba(${floor(120*a)},${floor(40*a)},${floor(150*a)},1)`);
  vgrad.addColorStop(0.75,`rgba(${floor(BG_HIGH[0]*a)},${floor(BG_HIGH[1]*a)},${floor(BG_HIGH[2]*a)},1)`);
  vgrad.addColorStop(1,   `rgba(${floor(BG_DEEP[0]*a)},${floor(BG_DEEP[1]*a)},${floor(BG_DEEP[2]*a)},1)`);
  drawingContext.fillStyle = vgrad;
  drawingContext.fillRect(0, 0, width, height);
  blendMode(ADD); noStroke();
  radialGlow(width*.5,  height*.55, width*.55, height*.35, BG_CLOUD,     floor(55*a));
  radialGlow(width*.25, height*.65, width*.35, height*.25, BG_CLOUD,     floor(38*a));
  radialGlow(width*.78, height*.6,  width*.32, height*.22, BG_CLOUD,     floor(32*a));
  radialGlow(width*.5,  height*.05, width*.5,  height*.18, BG_CLOUD_TOP, floor(48*a));
  radialGlow(width*.2,  height*.1,  width*.3,  height*.14, BG_CLOUD_TOP, floor(30*a));
  radialGlow(width*.82, height*.08, width*.28, height*.12, BG_CLOUD_TOP, floor(28*a));
  radialGlow(width*.5,  height*.98, width*.6,  height*.18, BG_FOG,       floor(50*a));
  let [hr,hg,hb] = BG_CLOUD_TOP;
  for (let i = 0; i < 900; i++) {
    fill(hr, hg, hb, random(1,4)*a);
    ellipse(random(width), random(height), 1.5);
  }
  blendMode(BLEND);
}

function runOpening() {
  if (stateTimer < OPEN_DUR) return;
  if (fireflies.length === 0) { fireflies.push(new Firefly(random(100,width-100), random(80,height-80))); spawnCount = 1; bgAlpha = 0; }
  blendMode(ADD); drawingContext.globalAlpha = 1.0;
  for (let f of fireflies) { f.update(); f.display(); }
  blendMode(BLEND);
  spawnTimer++;
  if (spawnTimer > 1 && spawnCount < TOTAL_FF) {
    spawnTimer = 0;
    let cols = 10, rows = 8;
    let idx = spawnCount % (cols * rows);
    let col = idx % cols, row = floor(idx / cols);
    let cellW = (width - 140) / cols, cellH = (height - 120) / rows;
    let bx = 70 + col * cellW + random(cellW * 0.1, cellW * 0.9);
    let by = 60 + row * cellH + random(cellH * 0.1, cellH * 0.9);
    fireflies.push(new Firefly(bx, by));
    spawnCount++;
  }
  if (spawnCount >= TOTAL_FF) { pickChosen(); state = 1; stateTimer = 0; }
}

// ============================================================
// M1
// ============================================================
function runM1() {
  if (allFlash) {
    allFlashTimer++;
    if (allFlashTimer === 1) {
      for (let f of fireflies) {
        if (f.isChosen) continue;
        f.fs = 'peak'; f.litAlpha = 255; f.ft = 0;
        f.peakDur = floor(random(5, 180));
      }
    }
    if (allFlashTimer === ALL_FLASH_DUR) {
      for (let f of fireflies) {
        if (f.isChosen) continue;
        let phase = random(['off','rising','peak','decay']);
        f.offDur=floor(random(220,420)); f.riseDur=floor(random(20,40));
        f.peakDur=floor(random(15,35)); f.decayDur=floor(random(35,65));
        if (phase==='off'){f.fs='off';f.litAlpha=0;f.ft=floor(random(0,f.offDur));}
        else if(phase==='rising'){f.fs='rising';f.ft=floor(random(0,f.riseDur));f.litAlpha=map(f.ft,0,f.riseDur,0,255);}
        else if(phase==='peak'){f.fs='peak';f.litAlpha=255;f.ft=floor(random(0,f.peakDur));}
        else{f.fs='decay';f.ft=floor(random(0,f.decayDur));f.litAlpha=255*exp(-(f.ft/f.decayDur)*3.8);}
      }
      allFlash = false; allFlashTimer = 0;
    }
  }

  blendMode(ADD); drawingContext.globalAlpha = 1.0;
  let useRhythm = rhythmActive || allFlash;
  for (let f of fireflies) {
    useRhythm ? f.rhythmUpdate() : f.update();
    f.display();
  }
  if (soloFF) { soloFF.update(); soloFF.display(); }
  blendMode(BLEND);
  soloTimer++;
  if (!soloActive && soloTimer > 580) { soloTimer = 0; soloActive = true; soloFF = new SoloFirefly(); }
  if (soloActive && soloFF && soloFF.done) { soloActive = false; soloFF = null; }
  drawM1Rings();
  previewTimer++;
  chosenRevealTimer++;

  // B — independent
  if (previewMode === 'butterfly' || previewBeings.length > 0) {
    updatePPart(); spawnPPartFrom(previewBeings);
    blendMode(ADD); drawingContext.globalAlpha = 1.0; drawPPart();
    blendMode(BLEND); drawingContext.globalAlpha = 1.0;
    for (let b of previewBeings) { b.updatePassthrough(); b.display(); }
    previewBeings = previewBeings.filter(b => b.ptAlpha > 0.01);
  }

  // C — independent
  if (previewMode === 'birds' || previewFlock.length > 0) {
    blendMode(ADD); drawingContext.globalAlpha = 0.75;
    for (let b of previewFlock) b.runPreview();
    blendMode(BLEND); drawingContext.globalAlpha = 1.0;
    previewFlock = previewFlock.filter(b => b.pvAlpha > 0.01);
  }
}

function runXfM2() {
  xfTimer++;
  let prog = xfTimer / XF_DUR;
  blendMode(ADD); drawingContext.globalAlpha = constrain(1-prog, 0, 1);
  for (let f of fireflies) { f.update(); f.display(); }
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  updateParticles(); spawnBFWave();
  blendMode(ADD); drawingContext.globalAlpha = constrain(easeOut(prog), 0, 1);
  for (let b of beings) { b.update(); b.display(); }
  drawParticles(constrain(easeOut(prog), 0, 1));
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  if (xfTimer >= XF_DUR) { state = 3; stateTimer = 0; }
}

// ============================================================
// M2
// ============================================================
function runM2() {
  blendMode(ADD); drawingContext.globalAlpha = 0.4;
  for (let f of fireflies) { if (f.isChosen) continue; f.update(); f.display(); }
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  updateParticles(); spawnPartFrom(beings); spawnBFWave();
  blendMode(ADD); drawingContext.globalAlpha = 1.0;
  drawParticles(1.0);
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  for (let b of beings) { b.update(); b.display(); }
  if (chosenButterfly) drawBFRing();
}

// ============================================================
// M2 → M3
// ============================================================
function runM2toM3() {
  blendMode(ADD); drawingContext.globalAlpha = 0.4;
  for (let f of fireflies) { if (f.isChosen) continue; f.update(); f.display(); }
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  m2m3Timer++;
  if (m2m3Phase === 0) {
    let prog = m2m3Timer / SCATTER_DUR;
    updateParticles();
    blendMode(ADD); drawingContext.globalAlpha = 1.0;
    drawParticles(constrain(1-prog*1.5, 0, 1));
    for (let b of beings) { b.updateFlee(); b.display(); }
    blendMode(BLEND); drawingContext.globalAlpha = 1.0;
    if (prog > .35) {
      let ba = constrain(easeIn((prog-.35)/.65), 0, 1);
      launchTimer++; drawingContext.globalAlpha = ba; blendMode(ADD);
      flock.sort((a,b) => a.zDepth - b.zDepth);
      for (let bird of flock) bird.run(flock, false, launchTimer);
      blendMode(BLEND); drawingContext.globalAlpha = 1.0;
    }
    if (m2m3Timer >= SCATTER_DUR) { m2m3Phase = 1; m2m3Timer = 0; particles = []; }
  } else {
    launchTimer++; blendMode(ADD); drawingContext.globalAlpha = 1.0;
    flock.sort((a,b) => a.zDepth - b.zDepth);
    for (let bird of flock) bird.run(flock, false, launchTimer);
    blendMode(BLEND); drawingContext.globalAlpha = 1.0;
    let stillVisible = beings.filter(b => b.fleeAlpha > 0.01);
    if (stillVisible.length > 0) {
      for (let b of stillVisible) { b.updateFlee(); b.display(); }
    } else { beings = []; }
    if (m2m3Timer >= SETTLE_DUR && beings.length === 0) { state = 5; stateTimer = 0; }
  }
}

// ============================================================
// M3
// ============================================================
function runM3() {
  blendMode(ADD); drawingContext.globalAlpha = 0.4;
  for (let f of fireflies) { if (f.isChosen) continue; f.update(); f.display(); }
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  launchTimer++;
  let inC = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
  let panic = inC && mouseMoveDist > 2.5;
  if (!chosenBird) {
    let launched = flock.filter(b => b.isLaunched);
    if (launched.length > 30) {
      chosenBird = launched[floor(random(launched.length))];
      chosenBird.baseMaxSpeed *= .45; chosenBird.maxSpeed = chosenBird.baseMaxSpeed;
    }
  }
  if (chosenBird && chosenBird.isLaunched && inC) {
    let d = dist(mouseX, mouseY, chosenBird.position.x, chosenBird.position.y);
    if (d < chosenBird.size * 28) chosenBird.isFleeing = true;
    if (d < chosenBird.size * 14) { for (let b of flock) b.fleeAway(); state = 6; loopTimer = 0; return; }
  }
  blendMode(ADD); drawingContext.globalAlpha = 1.0;
  flock.sort((a,b) => a.zDepth - b.zDepth);
  for (let b of flock) b.run(flock, panic, launchTimer);
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  if (chosenBird && chosenBird.isLaunched) drawBirdRing();
}

function runLoop() {
  loopTimer++; launchTimer++;
  blendMode(ADD); drawingContext.globalAlpha = 1.0;
  flock.sort((a,b) => a.zDepth - b.zDepth);
  for (let bird of flock) bird.runFlee(launchTimer);
  blendMode(BLEND); drawingContext.globalAlpha = 1.0;
  let allGone = flock.every(b => !b.isLaunched || b.fleeAlpha <= 0);
  if (allGone || loopTimer > 200) resetAll();
}

function drawM1Rings() {
  let t = max(0, chosenRevealTimer - CHOSEN_REVEAL_DELAY);
  let alphaA = constrain(t / CHOSEN_REVEAL_DUR, 0, 1);
  let alphaB = constrain((t - 60) / CHOSEN_REVEAL_DUR, 0, 1);
  let alphaC = constrain((t - 120) / CHOSEN_REVEAL_DUR, 0, 1);
  if (chosenA && alphaA > 0) drawRing(chosenA, PAL.cA, rhythmActive, alphaA);
  if (chosenB && alphaB > 0) drawRing(chosenB, PAL.cB, previewMode === 'butterfly', alphaB);
  if (chosenC && alphaC > 0) drawRing(chosenC, PAL.cC, previewMode === 'birds', alphaC);
  blendMode(BLEND);
  if (chosenA && alphaA > 0) drawIconFirefly(chosenA,   PAL.cA, rhythmActive,               alphaA);
  if (chosenB && alphaB > 0) drawIconButterfly(chosenB, PAL.cB, previewMode === 'butterfly', alphaB);
  if (chosenC && alphaC > 0) drawIconBird(chosenC,      PAL.cC, previewMode === 'birds',     alphaC);
}

function drawRing(ff, col, active, revealAlpha) {
  if(revealAlpha===undefined) revealAlpha=1;
  let pulse = .5 + .5 * sin(frameCount * .07 + ff.sparklePhase);
  let sz = ff.size;
  let peakA = pulse * (active ? 140 : 100) * revealAlpha;
  let [cr, cg, cb] = col;
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let grad = drawingContext.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, sz * 5);
  grad.addColorStop(0,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},${(peakA/255).toFixed(3)})`);
  grad.addColorStop(0.5, `rgba(${floor(cr)},${floor(cg)},${floor(cb)},${(peakA/255*0.3).toFixed(3)})`);
  grad.addColorStop(1,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},0)`);
  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.arc(ff.x, ff.y, sz * 5, 0, Math.PI * 2);
  drawingContext.fill();
  drawingContext.restore();
  blendMode(ADD); noStroke();
  fill(255, 255, 250, (160 + pulse * 25) * revealAlpha); ellipse(ff.x, ff.y, sz * 1.1);
  blendMode(BLEND); noStroke();
}

function drawIconFirefly(ff, col, active, revealAlpha) {
  if(revealAlpha===undefined) revealAlpha=1;
  let pulse = .5 + .5 * sin(frameCount * .07 + ff.sparklePhase);
  let ic = ff.size * 0.11;
  let alpha = (active ? 255 : 200) * revealAlpha;
  let [r,g,b] = col;
  push(); translate(ff.x, ff.y - ff.size * 1.4);
  blendMode(ADD); noStroke();
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let ig = drawingContext.createRadialGradient(0, 0, 0, 0, 0, ic*1.5);
  ig.addColorStop(0, `rgba(${floor(r)},${floor(g)},${floor(b)},${(pulse*0.55).toFixed(3)})`);
  ig.addColorStop(1, `rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
  drawingContext.fillStyle = ig;
  drawingContext.beginPath(); drawingContext.arc(0, 0, ic*1.5, 0, Math.PI*2); drawingContext.fill();
  drawingContext.restore();
  fill(255,255,220,alpha); ellipse(0,0,ic*.55);
  stroke(r,g,b,alpha*.8); strokeWeight(max(ic*.09,0.8)); noFill();
  let spk = ic*.85;
  line(-spk,0,spk,0); line(0,-spk*.9,0,spk*.9);
  let ds = spk*.55; strokeWeight(max(ic*.05,0.5));
  line(-ds,-ds,ds,ds); line(ds,-ds,-ds,ds);
  noStroke(); blendMode(BLEND); pop();
}

function drawIconButterfly(ff, col, active, revealAlpha) {
  if(revealAlpha===undefined) revealAlpha=1;
  let pulse = .5 + .5 * sin(frameCount * .07 + ff.sparklePhase);
  let alpha = (active ? 255 : 220) * revealAlpha;
  let [r,g,b] = col;
  let flap = map(abs(sin(frameCount * .06 + ff.sparklePhase)), 0, 1, 0.35, 0.8);
  let r2=min(r+60,255), g2=min(g+55,255), b2=min(b+80,255);
  let sc = 0.38;
  push();
  translate(ff.x, ff.y - ff.size * 1.5);
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let og2 = drawingContext.createRadialGradient(0,0,0, 0,0, 42);
  og2.addColorStop(0, `rgba(${floor(r)},${floor(g)},${floor(b)},${(pulse*0.38).toFixed(3)})`);
  og2.addColorStop(1, `rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
  drawingContext.fillStyle = og2;
  drawingContext.beginPath(); drawingContext.arc(0,0,42,0,Math.PI*2); drawingContext.fill();
  let ig = drawingContext.createRadialGradient(0,0,0, 0,0, 20);
  ig.addColorStop(0, `rgba(${floor(r2)},${floor(g2)},${floor(b2)},${(pulse*0.55).toFixed(3)})`);
  ig.addColorStop(1, `rgba(${floor(r2)},${floor(g2)},${floor(b2)},0)`);
  drawingContext.fillStyle = ig;
  drawingContext.beginPath(); drawingContext.arc(0,0,20,0,Math.PI*2); drawingContext.fill();
  drawingContext.restore();
  blendMode(BLEND);
  for (let side of [-1, 1]) {
    push(); scale(side, 1);
    fill(r, g, b, alpha); stroke(r2, g2, b2, alpha*0.5); strokeWeight(0.8);
    beginShape();
    vertex(0, -10*sc);
    bezierVertex(40*flap*sc, -40*sc, 60*flap*sc, 10*sc, 0, 20*sc);
    bezierVertex(10*sc, 5*sc, 0, 0, 0, -10*sc);
    endShape(CLOSE);
    noStroke();
    fill(r2, g2, b2, alpha*0.5*flap);
    beginShape();
    vertex(0, -7*sc);
    bezierVertex(20*flap*sc, -25*sc, 30*flap*sc, 5*sc, 0, 12*sc);
    bezierVertex(5*sc, 3*sc, 0, 0, 0, -7*sc);
    endShape(CLOSE);
    pop();
  }
  noStroke();
  fill(r*0.25, g*0.2, b*0.3, alpha); ellipse(0, 0, 5*sc, 20*sc);
  fill(r2, g2, b2, alpha*0.9); ellipse(0, -11*sc, 4*sc, 4*sc);
  pop();
}

function drawIconBird(ff, col, active, revealAlpha) {
  if(revealAlpha===undefined) revealAlpha=1;
  let pulse = .5 + .5 * sin(frameCount * .07 + ff.sparklePhase);
  let sc = ff.size * 0.011;
  let alpha = (active ? 240 : 185) * revealAlpha;
  let [r,g,b] = col;
  let wFlap = map(sin(frameCount * .08 + ff.sparklePhase), -1, 1, -sc*18, sc*18);
  push(); translate(ff.x, ff.y - ff.size * 1.5);
  blendMode(ADD); noStroke();
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let og3 = drawingContext.createRadialGradient(0, 0, 0, 0, 0, sc*50);
  og3.addColorStop(0, `rgba(${floor(r)},${floor(g)},${floor(b)},${(pulse*0.22).toFixed(3)})`);
  og3.addColorStop(1, `rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
  drawingContext.fillStyle = og3;
  drawingContext.beginPath(); drawingContext.arc(0, 0, sc*50, 0, Math.PI*2); drawingContext.fill();
  let ig = drawingContext.createRadialGradient(0, 0, 0, 0, 0, sc*22);
  ig.addColorStop(0, `rgba(${floor(r)},${floor(g)},${floor(b)},${(pulse*0.30).toFixed(3)})`);
  ig.addColorStop(1, `rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
  drawingContext.fillStyle = ig;
  drawingContext.beginPath(); drawingContext.arc(0, 0, sc*28, 0, Math.PI*2); drawingContext.fill();
  drawingContext.restore();
  fill(r,g,b,alpha*.9); ellipse(0,0,sc*60,sc*26);
  fill(255,255,255,alpha*.5); ellipse(sc*10,0,sc*20,sc*12);
  fill(r,g,b,alpha*.85);
  beginShape(); vertex(0,0); vertex(-sc*55,wFlap-sc*10); vertex(-sc*100,wFlap); vertex(-sc*80,wFlap+sc*14); vertex(-sc*40,sc*8); endShape(CLOSE);
  beginShape(); vertex(0,0); vertex(sc*55,wFlap-sc*10); vertex(sc*100,wFlap); vertex(sc*80,wFlap+sc*14); vertex(sc*40,sc*8); endShape(CLOSE);
  fill(r,g,b,alpha*.8); triangle(-sc*18,sc*10, sc*18,sc*10, 0,sc*36);
  fill(r,g,b,alpha); ellipse(sc*28,-sc*4,sc*28,sc*24);
  fill(255,230,100,alpha); triangle(sc*38,-sc*4, sc*60,-sc*2, sc*40,sc*6);
  blendMode(BLEND); pop();
}

function drawBFRing() {
  let b = chosenButterfly;
  let pulse = .5 + .5 * sin(frameCount*.05 + b.sparklePhase);
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let r = b.sc * 180;
  let grad = drawingContext.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
  let pa = pulse * 0.38;
  grad.addColorStop(0,   `rgba(255,200,255,${pa.toFixed(3)})`);
  grad.addColorStop(0.4, `rgba(255,200,255,${(pa*0.35).toFixed(3)})`);
  grad.addColorStop(1,   `rgba(255,200,255,0)`);
  drawingContext.fillStyle = grad;
  drawingContext.beginPath(); drawingContext.arc(b.x, b.y, r, 0, Math.PI*2); drawingContext.fill();
  drawingContext.restore();
  blendMode(ADD); noStroke();
  fill(255,255,255, 180+pulse*75); ellipse(b.x, b.y, 8);
  let ph = (frameCount*.045 + b.sparklePhase*.5) % 1;
  stroke(230,180,255,(1-ph)*110); strokeWeight(1.5); noFill();
  ellipse(b.x, b.y, b.sc*(30+ph*80)*2); noStroke();
  blendMode(BLEND);
}

function drawBirdRing() {
  if (!chosenBird || !chosenBird.isLaunched) return;
  let b = chosenBird, bx = b.position.x, by = b.position.y;
  let pulse = .5 + .5 * sin(frameCount * .07);
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  let r = b.size * 18;
  let [cr,cg,cb] = PAL.chosen;
  let grad = drawingContext.createRadialGradient(bx, by, 0, bx, by, r);
  let pa = pulse * 0.45;
  grad.addColorStop(0,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},${pa.toFixed(3)})`);
  grad.addColorStop(0.35,`rgba(${floor(cr)},${floor(cg)},${floor(cb)},${(pa*0.4).toFixed(3)})`);
  grad.addColorStop(1,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},0)`);
  drawingContext.fillStyle = grad;
  drawingContext.beginPath(); drawingContext.arc(bx, by, r, 0, Math.PI*2); drawingContext.fill();
  drawingContext.restore();
  blendMode(ADD); noStroke();
  fill(255,255,245, 185+pulse*70); ellipse(bx, by, b.size*1.6);
  let ph1 = (frameCount*.055) % 1, ph2 = (ph1+.5) % 1;
  stroke(cr,cg,cb,(1-ph1)*130); strokeWeight(1.6); noFill(); ellipse(bx,by,b.size*(2.5+ph1*5.5)*2);
  stroke(cr,cg,cb,(1-ph2)*130); ellipse(bx,by,b.size*(2.5+ph2*5.5)*2);
  noStroke(); blendMode(BLEND);
}

function spawnPartFrom(list) {
  for (let b of list) {
    if (!b.spawning && !b.passthrough && random() < .45) {
      let pt={x:b.x+random(-16,16),y:b.y+random(-16,16),vx:random(-.4,.4),vy:random(-.7,-.05),life:random(35,90),maxLife:0,size:random(1.2,4.5),type:random()<.28?'glow':'dot'};
      pt.maxLife=pt.life; particles.push(pt);
    }
  }
  if (particles.length > 700) particles.splice(0, particles.length - 700);
}
function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    let pt=particles[i]; pt.x+=pt.vx; pt.y+=pt.vy; pt.vx+=random(-.04,.04); pt.vy+=random(-.02,.02); pt.life--;
    if (pt.life<=0) particles.splice(i,1);
  }
}
function drawParticles(alpha) {
  noStroke();
  for (let pt of particles) {
    let t=pt.life/pt.maxLife, a=t*alpha;
    let [r,g,b]=PAL.m2Cyan;
    if (pt.type==='glow') {
      drawingContext.save(); drawingContext.globalCompositeOperation='lighter';
      let g2=drawingContext.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pt.size*5.5);
      g2.addColorStop(0,`rgba(${floor(r)},${floor(g)},${floor(b)},${(a*0.55).toFixed(3)})`);
      g2.addColorStop(1,`rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
      drawingContext.fillStyle=g2; drawingContext.beginPath(); drawingContext.arc(pt.x,pt.y,pt.size*5.5,0,Math.PI*2); drawingContext.fill();
      drawingContext.restore();
      fill(200,240,255,a*180); ellipse(pt.x,pt.y,pt.size*.8);
    } else { fill(r,g,b,a*60); ellipse(pt.x,pt.y,pt.size*2.2); fill(220,248,255,a*200); ellipse(pt.x,pt.y,pt.size*.6); }
  }
}
function spawnPPartFrom(list) {
  for (let b of list) {
    if (b.ptActive && random()<.55) {
      let pt={x:b.x+random(-14,14),y:b.y+random(-14,14),vx:random(-.35,.35),vy:random(-.55,.05),life:random(30,80),maxLife:0,size:random(1,4.2),type:random()<.3?'glow':'dot'};
      pt.maxLife=pt.life; previewParticles.push(pt);
    }
  }
  if (previewParticles.length>800) previewParticles.splice(0,previewParticles.length-800);
}
function updatePPart() {
  for (let i=previewParticles.length-1;i>=0;i--) {
    let pt=previewParticles[i]; pt.x+=pt.vx; pt.y+=pt.vy; pt.vx+=random(-.03,.03); pt.vy+=random(-.015,.015); pt.life--;
    if (pt.life<=0) previewParticles.splice(i,1);
  }
}
function drawPPart() {
  noStroke();
  for (let pt of previewParticles) {
    let t=pt.life/pt.maxLife, a=t;
    if (pt.type==='glow') {
      drawingContext.save(); drawingContext.globalCompositeOperation='lighter';
      let g2=drawingContext.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pt.size*5.8);
      g2.addColorStop(0,`rgba(0,205,255,${(a*0.55).toFixed(3)})`);
      g2.addColorStop(1,'rgba(0,205,255,0)');
      drawingContext.fillStyle=g2; drawingContext.beginPath(); drawingContext.arc(pt.x,pt.y,pt.size*5.8,0,Math.PI*2); drawingContext.fill();
      drawingContext.restore();
      fill(180,240,255,a*200); ellipse(pt.x,pt.y,pt.size*.9);
    } else { fill(0,205,255,a*70); ellipse(pt.x,pt.y,pt.size*2); fill(200,248,255,a*220); ellipse(pt.x,pt.y,pt.size*.55); }
  }
}

function easeIn(t)  { return t*t; }
function easeOut(t) { return 1-(1-t)*(1-t); }

function overlayBlack() {
  if (blackAlpha<=0) return;
  drawingContext.globalAlpha=1.0; blendMode(BLEND);
  noStroke(); fill(0,0,0,blackAlpha); rect(0,0,width,height);
}

function pickChosen() {
  let pool = [...fireflies];
  for (let i = pool.length-1; i > 0; i--) {
    let j = floor(random(i+1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let picks = [];
  for (let c of pool) {
    if (picks.length >= 3) break;
    let tooClose = picks.some(p => dist(p.x,p.y,c.x,c.y) < 200);
    if (!tooClose) picks.push(c);
  }
  while (picks.length < 3) picks.push(pool[picks.length + 10]);
  [chosenA,chosenB,chosenC]=picks;
  for (let [ch,type] of [[chosenA,'A'],[chosenB,'B'],[chosenC,'C']]) {
    ch.isChosen=true; ch.chosenType=type; ch.sparklePhase=random(TWO_PI);
    ch.size=random(16,22); ch.walkR=random(8,15);
    ch.fs='off'; ch.litAlpha=0; ch.ft=0;
    ch.offDur=floor(random(20,60));
    ch.riseDur=180; ch.peakDur=99999; ch.decayDur=99999;
  }
  chosenReady=true;
}

function spawnBFWave() {
  bfSpawnTimer++;
  if (bfSpawnTimer%8===0 && bfSpawnCount<TOTAL_BF) {
    let side=floor(random(4)), b=new GoldenBF(0,0); b.spawning=true;
    if(side===0){b.x=random(-120,-40);b.y=random(60,height-60);}
    else if(side===1){b.x=random(width+40,width+120);b.y=random(60,height-60);}
    else if(side===2){b.x=random(60,width-60);b.y=random(-120,-40);}
    else{b.x=random(60,width-60);b.y=random(height+40,height+120);}
    b.baseX=random(MARGIN,width-MARGIN); b.baseY=random(MARGIN,height-MARGIN);
    b.targetX=b.baseX; b.targetY=b.baseY;
    beings.push(b); bfSpawnCount++;
    if (bfSpawnCount===floor(TOTAL_BF*.5)&&!chosenButterfly) {
      chosenButterfly=random(beings); chosenButterfly.isChosen=true; chosenButterfly.sparklePhase=random(TWO_PI);
    }
  }
}

function spawnPreviewBF() {
  previewBeings=[]; previewParticles=[];
  let ang=random([0,PI,PI*.25,PI*.75,-PI*.25,-PI*.75]);
  let spd=random(4,7), svx=cos(ang)*spd, svy=sin(ang)*spd, cx, cy;
  if(abs(svx)>abs(svy)){cx=svx>0?random(-300,-80):random(width+80,width+300);cy=height*random(.25,.75);}
  else{cx=width*random(.25,.75);cy=svy>0?random(-300,-80):random(height+80,height+300);}
  for (let i=0;i<50;i++) {
    let b=new GoldenBF(0,0); b.spawning=false; b.passthrough=true; b.ptAlpha=1.0;
    let dk = floor(random(4));
    b.wingTone = BF_WINGS[dk]; b.glowTone = BF_GLOW[dk];
    b.sc=random(.15,1.4); b.flapSpd=random(.08,.13);
    b.brightness=1.0; b.glowT=random(TWO_PI); b.wingPhase=random(TWO_PI);
    b.noiseOX=random(10000); b.noiseOY=random(10000);
    let spread=random(0,180), ca=random(TWO_PI);
    b.x=cx+cos(ca)*spread; b.y=cy+sin(ca)*spread*.7; b.baseX=b.x; b.baseY=b.y;
    let wob=random(-.22,.22), sv=map(b.sc,.15,1.4,1.3,0.6);
    b.ptVx=cos(ang+wob)*spd*sv; b.ptVy=sin(ang+wob)*spd*sv;
    b.ptDelay=i*2; b.ptActive=false; previewBeings.push(b);
  }
}

function spawnPreviewBirds() {
  previewFlock=[];
  for (let i=0;i<180;i++) {
    let bird=new AerialBird(i); bird.pvMode=true; bird.pvAlpha=1.0;
    bird.size=map(bird.zDepth,.4,.95,7,13); previewFlock.push(bird);
  }
}

function initM2() {
  beings=[]; particles=[]; bfSpawnTimer=0; bfSpawnCount=0; chosenButterfly=null;
  for (let i=0;i<6;i++) {
    let side=floor(random(4)), b=new GoldenBF(0,0); b.spawning=true;
    if(side===0){b.x=random(-120,-40);b.y=random(60,height-60);}
    else if(side===1){b.x=random(width+40,width+120);b.y=random(60,height-60);}
    else if(side===2){b.x=random(60,width-60);b.y=random(-120,-40);}
    else{b.x=random(60,width-60);b.y=random(height+40,height+120);}
    b.baseX=random(MARGIN,width-MARGIN); b.baseY=random(MARGIN,height-MARGIN);
    b.targetX=b.baseX; b.targetY=b.baseY; beings.push(b); bfSpawnCount++;
  }
}

function initM3() { flock=[]; launchTimer=0; chosenBird=null; for(let i=0;i<200;i++) flock.push(new AerialBird(i)); }

function resetAll() {
  fireflies=[]; beings=[]; particles=[]; flock=[];
  previewBeings=[]; previewFlock=[]; previewParticles=[];
  spawnCount=0; spawnTimer=0; bgAlpha=0; blackAlpha=0;
  soloFF=null; soloActive=false; soloTimer=0;
  chosenA=null; chosenB=null; chosenC=null; chosenReady=false;
  chosenButterfly=null; chosenBird=null; bfSpawnTimer=0; bfSpawnCount=0; launchTimer=0;
  state=-1; stateTimer=0; previewMode='none'; previewTimer=0; chosenRevealTimer=0;
  allFlash=false; allFlashTimer=0; rhythmActive=false;
  lastClickTarget=null; lastClickTime=0; lastMX=-1; lastMY=-1; mouseMoveDist=0; loopTimer=0;
}

// ============================================================
// FIREFLY
// ============================================================
class Firefly {
  constructor(bx, by) {
    this.baseX=bx; this.baseY=by; this.x=bx; this.y=by;
    this.size=random(3,8); this.nSeedX=random(10000); this.nSeedY=random(10000);
    this.nSpeed=random(.00025,.00065); this.walkR=random(55,110);
    this.vx=0; this.vy=0;
    this.fs='off'; this.ft=floor(random(0,300));
    this.offDur=floor(random(220,420)); this.riseDur=floor(random(20,40));
    this.peakDur=floor(random(15,35)); this.decayDur=floor(random(35,65));
    this.litAlpha=0; this.trail=[];
    this.isChosen=false; this.chosenType=null; this.sparklePhase=0;
    this.shyR=random(100,160); this.curiousR=random(200,320);
    this.curiosity=random(.3,1); this.brightBoost=0;
    this.rhythmPhase=random(TWO_PI); this.rhythmR=random(28,55); this.rhythmSpd=random(.008,.018);
  }
  update() {
    let t=frameCount*this.nSpeed;
    let nx=(noise(this.nSeedX,t)-.5)*2, ny=(noise(this.nSeedY+500,t)-.5)*2;
    let tx=this.baseX+nx*this.walkR, ty=this.baseY+ny*this.walkR*.6;
    let md=dist(this.x,this.y,mouseX,mouseY);
    if(md<this.shyR){let f=(.12+this.curiosity*.04)*(1-md/this.shyR)*2;tx+=(this.x-mouseX)*f;ty+=(this.y-mouseY)*f;this.brightBoost=lerp(this.brightBoost,map(md,0,this.shyR,130,20),.14);}
    else if(md<this.curiousR){tx+=(mouseX-this.x)*.018*this.curiosity;ty+=(mouseY-this.y)*.018*this.curiosity;this.brightBoost=lerp(this.brightBoost,map(md,this.shyR,this.curiousR,35,5),.06);}
    else{this.brightBoost=lerp(this.brightBoost,0,.05);}
    this.vx=lerp(this.vx,(tx-this.x)*.028,.1); this.vy=lerp(this.vy,(ty-this.y)*.028,.1);
    this.x+=this.vx; this.y+=this.vy; this._flash();
    if(this.litAlpha>10){this.trail.push({x:this.x,y:this.y,a:this.litAlpha});if(this.trail.length>10)this.trail.shift();}
    else if(this.trail.length>0) this.trail.shift();
  }
  rhythmUpdate() {
    this.rhythmPhase += this.rhythmSpd;
    let wave = sin(frameCount * .006 + this.rhythmPhase);
    let tx = this.baseX + cos(frameCount * .006 + this.rhythmPhase) * this.rhythmR;
    let ty = this.baseY + sin(frameCount * .005 + this.rhythmPhase * .8) * this.rhythmR * .7;
    this.vx = lerp(this.vx, (tx - this.x) * .018, .06);
    this.vy = lerp(this.vy, (ty - this.y) * .018, .06);
    this.x += this.vx; this.y += this.vy;
    this.brightBoost = lerp(this.brightBoost, abs(wave) * 60, .1);
    this._flash();
    if (this.litAlpha > 10) {
      this.trail.push({x: this.x, y: this.y, a: this.litAlpha});
      if (this.trail.length > 10) this.trail.shift();
    } else if (this.trail.length > 0) this.trail.shift();
  }
  _flash() {
    this.ft++;
    if(this.fs==='off'){
      this.litAlpha=0;
      if(this.ft>=this.offDur){
        this.fs='rising'; this.ft=0;
        this.offDur   = floor(random(220,420));
        this.riseDur  = floor(random(20,40));
        this.peakDur  = this.isChosen ? 99999 : floor(random(15,35));
        this.decayDur = this.isChosen ? 99999 : floor(random(35,65));
      }
    }
    else if(this.fs==='rising'){this.litAlpha=map(this.ft,0,this.riseDur,0,255);if(this.ft>=this.riseDur){this.litAlpha=255;this.fs='peak';this.ft=0;}}
    else if(this.fs==='peak'){this.litAlpha=255;if(this.ft>=this.peakDur){this.fs='decay';this.ft=0;}}
    else if(this.fs==='decay'){this.litAlpha=255*exp(-(this.ft/this.decayDur)*3.8);if(this.ft>=this.decayDur){this.litAlpha=0;this.fs='off';this.ft=0;}}
  }
  display() {
    if(this.litAlpha<3) return;
    let a=min((this.litAlpha+this.brightBoost)*(this.isChosen?1.8:1.0),255), sz=this.size;
    noStroke();
    for(let i=0;i<this.trail.length;i++){let pt=this.trail[i],t=i/this.trail.length;fill(PAL.ffTrace[0],PAL.ffTrace[1],PAL.ffTrace[2],pt.a*t*.22);ellipse(pt.x,pt.y,sz*.55*t);}
    drawingContext.save(); drawingContext.globalCompositeOperation='lighter';
    let gout=drawingContext.createRadialGradient(this.x,this.y,0,this.x,this.y,sz*9);
    let ga=a/255;
    gout.addColorStop(0,  `rgba(${floor(PAL.ffGlow[0])},${floor(PAL.ffGlow[1])},${floor(PAL.ffGlow[2])},${(ga*1.0).toFixed(3)})`);
    gout.addColorStop(0.18,`rgba(${floor(PAL.ffMid[0])},${floor(PAL.ffMid[1])},${floor(PAL.ffMid[2])},${(ga*0.55).toFixed(3)})`);
    gout.addColorStop(0.5,`rgba(${floor(PAL.ffGlow[0])},${floor(PAL.ffGlow[1])},${floor(PAL.ffGlow[2])},${(ga*0.18).toFixed(3)})`);
    gout.addColorStop(1,  `rgba(${floor(PAL.ffGlow[0])},${floor(PAL.ffGlow[1])},${floor(PAL.ffGlow[2])},0)`);
    drawingContext.fillStyle=gout;
    drawingContext.beginPath(); drawingContext.arc(this.x,this.y,sz*9,0,Math.PI*2); drawingContext.fill();
    drawingContext.restore();
    fill(PAL.ffCore[0],PAL.ffCore[1],PAL.ffCore[2],min(a*1.2,255)); ellipse(this.x,this.y,sz*.65);
    fill(255,255,248,min(a*1.6,255)); ellipse(this.x,this.y,sz*.2);
  }
}

class SoloFirefly extends Firefly {
  constructor() {
    super(random(200,width-200),random(120,height-140));
    this.size=random(8,13); this.soloTimer=0; this.soloDur=260; this.done=false;
    this.targetX=this.baseX; this.targetY=this.baseY; this.walkR=10;
    this.fs='peak'; this.litAlpha=255; this.peakDur=9999; this.trail=[];
  }
  update() {
    this.soloTimer++;
    if(this.soloTimer>this.soloDur){this.done=true;return;}
    this.x=lerp(this.x,this.targetX+sin(frameCount*.01)*12,.006);
    this.y=lerp(this.y,this.targetY+cos(frameCount*.008)*8,.006);
    this.litAlpha=255; this.trail.push({x:this.x,y:this.y,a:255});
    if(this.trail.length>18)this.trail.shift();
  }
}

class BaseMover {
  constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.mood='wandering';this.moodTimer=0;this.moodDur=floor(random(180,380));this.targetX=random(MARGIN,width-MARGIN);this.targetY=random(MARGIN,height-MARGIN);this.offset=random(TWO_PI);}
  updateMood(){this.moodTimer++;let d=dist(this.x,this.y,mouseX,mouseY);if(d<120&&this.mood!=='retreating'){this.mood='retreating';this.moodTimer=0;this.moodDur=100;}else if(d>180&&d<320&&this.mood==='wandering'&&random()<.006){this.mood='hovering';this.moodTimer=0;this.moodDur=floor(random(80,160));}else if(d>320&&this.mood==='hovering'&&random()<.01){this.mood='reaching';this.moodTimer=0;this.moodDur=floor(random(90,180));}if(this.moodTimer>this.moodDur){this.mood='wandering';this.moodTimer=0;this.moodDur=floor(random(160,400));this.targetX=random(MARGIN,width-MARGIN);this.targetY=random(MARGIN,height-MARGIN);}}
  moveBody(maxW,maxR){if(this.mood==='wandering'){this.vx+=(this.targetX-this.x)*.0004+sin(frameCount*.009+this.offset)*.045;this.vy+=(this.targetY-this.y)*.0004+cos(frameCount*.007+this.offset)*.04;}else if(this.mood==='hovering'){this.vx+=random(-.02,.02);this.vy+=random(-.02,.02);this.vx*=.88;this.vy*=.88;}else if(this.mood==='reaching'){this.vx+=(mouseX-this.x)*.00025;this.vy+=(mouseY-this.y)*.00025;}else if(this.mood==='retreating'){let d=dist(this.x,this.y,mouseX,mouseY);if(d>0){this.vx+=(this.x-mouseX)/d*.4;this.vy+=(this.y-mouseY)/d*.4;}}let spd=sqrt(this.vx*this.vx+this.vy*this.vy),ms=this.mood==='retreating'?maxR:maxW;if(spd>ms){this.vx=this.vx/spd*ms;this.vy=this.vy/spd*ms;}this.vx*=.96;this.vy*=.96;this.x+=this.vx;this.y+=this.vy;this.x=constrain(this.x,MARGIN,width-MARGIN);this.y=constrain(this.y,MARGIN,height-MARGIN);}
}

class GoldenBF extends BaseMover {
  constructor(x,y) {
    super(x,y);
    this.sc=random(0.5,1.0);
    this.noiseOX=random(1000); this.noiseOY=random(2000);
    this.wingPhase=random(TWO_PI); this.flapSpeed=random(0.2,0.35);
    this.bodyAngle=random(TWO_PI); this.targetAngle=this.bodyAngle;
    this.brightness=random(.65,1); this.glowT=random(TWO_PI);
    this.fleeing=false; this.fleeVx=0; this.fleeVy=0; this.fleeAlpha=1;
    this.spawning=true; this.targetX=random(MARGIN,width-MARGIN); this.targetY=random(MARGIN,height-MARGIN);
    this.isChosen=false; this.sparklePhase=0;
    this.orbitR=random(80,180); this.orbitAngle=random(TWO_PI);
    this.orbitSpd=random(.006,.018)*(random()<.5?1:-1); this.curiosityStr=random(.5,1);
    this.passthrough=false; this.ptAlpha=1; this.ptVx=0; this.ptVy=0; this.ptDelay=0; this.ptActive=false;
    let k=floor(random(4));
    this.wingTone=BF_WINGS[k]; this.glowTone=BF_GLOW[k];
    this.flapSpd=this.flapSpeed;
    this.wingVarA=random(-5,5); this.wingVarB=random(-4,4); this.wingVarC=random(-3,3);
    this.powerStroke=random(0.55,0.7);
    this.noiseFleeX=random(3000); this.noiseFleeY=random(4000);
    this.startleTimer=0;
    this.mouseInterest = random(0.3,1.0);
this.reactionDelay = random(0,120);
    
  }

  scatter() {
    this.fleeing=true; this.spawning=false; this.passthrough=false;
    let angle=atan2(this.y-height/2,this.x-width/2)+random(-.7,.7);
    let spd=random(1.2,2.4);
    this.fleeVx=cos(angle)*spd; this.fleeVy=sin(angle)*spd;
    this.flapSpeed=random(.30,.45); this.flapSpd=this.flapSpeed; this.fleeAlpha=1;
  }

  updatePassthrough() {
    if(this.ptDelay>0){this.ptDelay--;return;}
    this.ptActive=true;
    this.noiseOX+=0.008; this.noiseOY+=0.008;
    let wx=map(noise(this.noiseOX),0,1,-0.18,0.18);
    let wy=map(noise(this.noiseOY),0,1,-0.18,0.18);
    this.ptVx+=wx; this.ptVy+=wy;
    let spd=sqrt(this.ptVx*this.ptVx+this.ptVy*this.ptVy)||1;
    let ts=lerp(spd,6,.04); this.ptVx=this.ptVx/spd*ts; this.ptVy=this.ptVy/spd*ts;
    this.wingPhase+=this.flapSpeed*1.4;
    let ta=atan2(this.ptVy,this.ptVx), da=((ta-this.bodyAngle+PI*3)%TWO_PI)-PI;
    this.bodyAngle+=da*.1;
    this.x+=this.ptVx; this.y+=this.ptVy;
    let pad=60;
    if(this.x<-pad||this.x>width+pad||this.y<-pad||this.y>height+pad) this.ptAlpha=max(0,this.ptAlpha-.04);
  }

  updateFlee() {
    this.noiseFleeX+=0.018; this.noiseFleeY+=0.018;
    let nx=map(noise(this.noiseFleeX),0,1,-0.12,0.12);
    let ny=map(noise(this.noiseFleeY),0,1,-0.09,0.09);
    this.fleeVx+=nx; this.fleeVy+=ny;
    let spd=sqrt(this.fleeVx*this.fleeVx+this.fleeVy*this.fleeVy)||1;
    let ts=lerp(spd,3.5,.04); this.fleeVx=this.fleeVx/spd*ts; this.fleeVy=this.fleeVy/spd*ts;
    this.wingPhase+=this.flapSpeed*2.0;
    let ta=atan2(this.fleeVy,this.fleeVx), da=((ta-this.bodyAngle+PI*3)%TWO_PI)-PI;
    this.bodyAngle=lerp(this.bodyAngle, this.bodyAngle+da, 0.12);
    this.x+=this.fleeVx; this.y+=this.fleeVy;
    let pad=250;
    if(this.x<-pad||this.x>width+pad||this.y<-pad||this.y>height+pad)
      this.fleeAlpha=max(0,this.fleeAlpha-.015);
  }

  update() {
    if(this.fleeing)    { this.updateFlee(); return; }
    if(this.passthrough){ this.updatePassthrough(); return; }
    if(this.spawning) {
      this.vx=lerp(this.vx,(this.targetX-this.x)*.035,.12); this.vy=lerp(this.vy,(this.targetY-this.y)*.035,.12);
      this.vx*=.92; this.vy*=.92; this.x+=this.vx; this.y+=this.vy;
      this.bodyAngle=lerp(this.bodyAngle, atan2(this.vy,this.vx), 0.08);
      this.wingPhase+=this.flapSpeed*1.3; this.glowT+=.022;
      if(dist(this.x,this.y,this.targetX,this.targetY)<20){this.spawning=false;this.baseX=this.targetX;this.baseY=this.targetY;}
      if(random()<.3){let pt={x:this.x+random(-12,12),y:this.y+random(-12,12),vx:random(-.3,.3),vy:random(-.5,-.05),life:random(25,70),maxLife:0,size:random(1,3.5),type:random()<.25?'glow':'dot'};pt.maxLife=pt.life;particles.push(pt);}
      return;
    }
    let driftX=map(noise(this.noiseOX),0,1,-1.5,1.5);
    let driftY=map(noise(this.noiseOY),0,1,-1.5,1.5);
    this.vx+=driftX*0.1; this.vy+=driftY*0.1;
    this.vx*=0.95; this.vy*=0.95;

    let md=dist(this.x,this.y,mouseX,mouseY), inC=mouseX>0&&mouseX<width&&mouseY>0&&mouseY<height;
    if(inC) {
      if(md < this.orbitR*0.4) {
        // STARTLED — scatter away, wings flap fast
        this.vx+=(this.x-mouseX)*.008; this.vy+=(this.y-mouseY)*.008;
        this.flapSpd=lerp(this.flapSpd,.14,.08);
        this.glowT+=0.06;
        this.startleTimer=60;
      }else if(md < this.orbitR*2.5 && this.mouseInterest > 0.5) {

  // gentle attraction
  let dx = mouseX - this.x;
  let dy = mouseY - this.y;

  let distance = sqrt(dx*dx + dy*dy);

  if(distance > 0){
    dx /= distance;
    dy /= distance;
  }

  // weak pull toward mouse
  this.vx += dx * 0.035;
  this.vy += dy * 0.035;


  // organic floating movement
  this.noiseOX += 0.01;
  this.noiseOY += 0.01;

  let floatX = map(noise(this.noiseOX),0,1,-0.8,0.8);
  let floatY = map(noise(this.noiseOY),0,1,-0.8,0.8);

  this.vx += floatX;
  this.vy += floatY;


  // soft movement
  this.vx *= 0.93;
  this.vy *= 0.93;


  this.flapSpd = lerp(this.flapSpd,0.055,0.02);
} else {
        this.updateMood(); this.moveBody(.75,1.75);
      }
    } else {
      this.startleTimer=max(0,this.startleTimer-1);
      this.updateMood(); this.moveBody(.75,1.75);
    }

    this.x+=this.vx; this.y+=this.vy;
    this.noiseOX+=0.005; this.noiseOY+=0.005;
    let targetAng=atan2(this.vy,this.vx);
    this.bodyAngle=lerp(this.bodyAngle, targetAng, 0.1);
    this.x=constrain(this.x,MARGIN,width-MARGIN); this.y=constrain(this.y,MARGIN,height-MARGIN);
    let spd=sqrt(this.vx**2+this.vy**2);
    let cyclePos=(this.wingPhase%(TWO_PI))/TWO_PI;
    let strokeRate = cyclePos < this.powerStroke ? 1.6 : 0.7;
    this.wingPhase+=this.flapSpeed*strokeRate+(spd*0.05);
    this.glowT+=.022;
    if(random()<.35){let pt={x:this.x+random(-14,14),y:this.y+random(-14,14),vx:random(-.4,.4),vy:random(-.6,-.05),life:random(30,80),maxLife:0,size:random(1,3.8),type:random()<.28?'glow':'dot'};pt.maxLife=pt.life;particles.push(pt);}
  }

  display() {
    let pA=this.passthrough?this.ptAlpha:this.fleeing?this.fleeAlpha:this.spawning?map(dist(this.x,this.y,this.targetX,this.targetY),80,0,.4,1):1;
    if(!this.ptActive&&this.passthrough) return;
    if(pA<.01) return;
    let sc=this.sc;
    let [cr,cg,cb]=this.wingTone, [gr,gg,gb]=this.glowTone;
    let glow=(.6+.4*sin(this.glowT))*this.brightness*pA;
    let flap=map(abs(sin(this.wingPhase)), 0, 1, 0.35, 0.8);
    let cr2=min(cr+60,255), cg2=min(cg+55,255), cb2=min(cb+80,255);
    drawingContext.save(); drawingContext.globalCompositeOperation='lighter';
    let og=drawingContext.createRadialGradient(this.x,this.y,0,this.x,this.y,sc*90);
    og.addColorStop(0,   `rgba(${floor(gr)},${floor(gg)},${floor(gb)},${(glow*0.45).toFixed(3)})`);
    og.addColorStop(0.4, `rgba(${floor(gr)},${floor(gg)},${floor(gb)},${(glow*0.20).toFixed(3)})`);
    og.addColorStop(1,   `rgba(${floor(gr)},${floor(gg)},${floor(gb)},0)`);
    drawingContext.fillStyle=og;
    drawingContext.beginPath(); drawingContext.arc(this.x,this.y,sc*90,0,Math.PI*2); drawingContext.fill();
    let ig=drawingContext.createRadialGradient(this.x,this.y,0,this.x,this.y,sc*45);
    ig.addColorStop(0,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},${(glow*0.60).toFixed(3)})`);
    ig.addColorStop(0.5, `rgba(${floor(cr)},${floor(cg)},${floor(cb)},${(glow*0.25).toFixed(3)})`);
    ig.addColorStop(1,   `rgba(${floor(cr)},${floor(cg)},${floor(cb)},0)`);
    drawingContext.fillStyle=ig;
    drawingContext.beginPath(); drawingContext.arc(this.x,this.y,sc*45,0,Math.PI*2); drawingContext.fill();
    drawingContext.restore();
    push(); translate(this.x, this.y); rotate(this.bodyAngle + HALF_PI);
    for(let s of [-1,1]){
      push(); scale(s,1);
      fill(cr, cg, cb, 190*pA); stroke(cr2, cg2, cb2, 80*pA); strokeWeight(0.8*sc);
      beginShape();
      vertex(0,-10*sc);
      bezierVertex(40*flap*sc,-40*sc, 60*flap*sc,10*sc, 0,20*sc);
      bezierVertex(10*sc,5*sc, 0,0, 0,-10*sc);
      endShape(CLOSE);
      noStroke(); fill(cr2,cg2,cb2,100*flap*pA);
      beginShape();
      vertex(0,-7*sc);
      bezierVertex(20*flap*sc,-25*sc, 30*flap*sc,5*sc, 0,12*sc);
      bezierVertex(5*sc,3*sc, 0,0, 0,-7*sc);
      endShape(CLOSE);
      pop();
    }
    noStroke(); fill(cr*0.25,cg*0.2,cb*0.3,220*pA); ellipse(0,0,5*sc,20*sc);
    fill(cr2,cg2,cb2,200*pA); ellipse(0,-11*sc,4*sc,4*sc);
    pop(); blendMode(BLEND); noStroke();
  }
}

class AerialBird {
  constructor(index){this.index=index;this.isLaunched=false;this.speedModifier=random(.8,1.25);this.zDepth=random(.4,.95);this.size=map(this.zDepth,.4,.95,3.5,6.5);this.spawnSide=(index%2===0)?'LEFT':'RIGHT';this.launchDelay=floor(index*3.5)+(this.spawnSide==='RIGHT'?80:0);if(this.spawnSide==='LEFT'){this.position=createVector(random(-100,-40),random(height*.5,height*.85));this.velocity=createVector(random(4,6),random(-3,-1));}else{this.position=createVector(random(width+40,width+100),random(height*.5,height*.85));this.velocity=createVector(random(-6,-4),random(-3,-1));}this.acceleration=createVector(0,0);this.baseMaxSpeed=map(this.zDepth,.4,.95,3.5,6.5)*this.speedModifier;this.maxSpeed=this.baseMaxSpeed;this.maxForce=map(this.zDepth,.4,.95,.16,.28);this.colorOffset=random(1);this.wingPhase=random(TWO_PI);this.pNoise=random(5000);this.reunionStr=random(.08,.18);this.isFleeing=false;this.fleeing=false;this.fleeVel=null;this.fleeAlpha=1;this.pvMode=false;this.pvAlpha=1;}
  fleeAway(){this.fleeing=true;let angle=this.velocity.heading()+random(-.4,.4);this.fleeVel=createVector(cos(angle)*random(5,9),sin(angle)*random(5,9));this.fleeAlpha=1;}
  runFlee(timer){if(!this.isLaunched)return;if(this.fleeing&&this.fleeVel){this.fleeVel.mult(1.04);this.position.add(this.fleeVel);this.wingPhase+=this.velocity.mag()*.38;let pad=80;if(this.position.x<-pad||this.position.x>width+pad||this.position.y<-pad||this.position.y>height+pad)this.fleeAlpha=max(0,this.fleeAlpha-.06);drawingContext.globalAlpha=this.fleeAlpha;this.display(true);drawingContext.globalAlpha=1;}else{this.run([],false,timer);}}
  runPreview(){if(!this.isLaunched){this.launchDelay=max(0,this.launchDelay-1);if(this.launchDelay<=0){this.velocity.mult(4);this.isLaunched=true;}}if(!this.isLaunched)return;this.velocity.add(this.acceleration);this.velocity.limit(this.baseMaxSpeed*5.5);this.position.add(this.velocity);this.acceleration.mult(0);let pad=80;if(this.position.x<-pad||this.position.x>width+pad||this.position.y<-pad||this.position.y>height+pad)this.pvAlpha=max(0,this.pvAlpha-.05);drawingContext.globalAlpha=this.pvAlpha*.75;this.display(false);drawingContext.globalAlpha=1;}
  run(all,panic,timer){if(!this.isLaunched&&timer<this.launchDelay)return;if(this===chosenBird&&this.isLaunched&&this.isFleeing){let away=createVector(this.position.x-mouseX,this.position.y-mouseY);if(away.mag()>0)away.normalize().mult(this.maxSpeed*1.2);this.applyForce(p5.Vector.sub(away,this.velocity).limit(this.maxForce*2.5));this.isFleeing=false;}this.doFlock(all,panic);this.update(panic);this.display(panic);}
  update(panic){this.velocity.add(this.acceleration);this.velocity.limit(this.maxSpeed);this.position.add(this.velocity);this.acceleration.mult(0);if(!this.isLaunched){this.maxSpeed=this.baseMaxSpeed*1.4;if(this.spawnSide==='LEFT'&&this.position.x>width*.55)this.isLaunched=true;if(this.spawnSide==='RIGHT'&&this.position.x<width*.45)this.isLaunched=true;}else if(panic){this.maxSpeed=lerp(this.maxSpeed,this.baseMaxSpeed*2.3,.15);}else{this.maxSpeed=lerp(this.maxSpeed,this.baseMaxSpeed,.05);}if(this.isLaunched){let pad=this.size*4;if(this.position.x<-pad)this.position.x=width+pad;if(this.position.x>width+pad)this.position.x=-pad;if(this.position.y<-pad)this.position.y=height+pad;if(this.position.y>height+pad)this.position.y=-pad;}}
  applyForce(f){this.acceleration.add(f);}
  doFlock(all,panic){if(!this.isLaunched)return;let threat=createVector(mouseX,mouseY),dt=p5.Vector.dist(this.position,threat);let inC=mouseX>0&&mouseX<width&&mouseY>0&&mouseY<height;let fc=createVector(0,0),cnt=0;for(let o of all){if(o.isLaunched&&o!==this){fc.add(o.position);cnt++;}}if(cnt>0)fc.div(cnt);let d2c=cnt>0?p5.Vector.dist(this.position,fc):0;let rMult=map(d2c,0,400,.4,3.5);let reacting=inC&&mouseMoveDist>2&&dt<220;if(reacting||panic){this.applyForce(this.away(threat,280).mult(4));this.applyForce(this.sep(all,48).mult(2.2));this.applyForce(this.ali(all,85).mult(2.5));this.applyForce(this.coh(all,85).mult(.02));}else{let nx=noise(this.pNoise+frameCount*.006)*2-1,ny=noise(this.pNoise+3000+frameCount*.006)*2-1;this.applyForce(createVector(nx,ny).mult(.1));if(cnt>0){let tc=p5.Vector.sub(fc,this.position).normalize().mult(this.maxSpeed);this.applyForce(p5.Vector.sub(tc,this.velocity).limit(this.maxForce*rMult*this.reunionStr*1.6));}this.applyForce(this.sep(all,22).mult(1.3));this.applyForce(this.ali(all,90).mult(1.8));this.applyForce(this.coh(all,90).mult(2.2));}}
  away(t,r){let d=p5.Vector.dist(this.position,t);if(d>0&&d<r){let des=p5.Vector.sub(this.position,t).normalize().mult(this.maxSpeed);return p5.Vector.sub(des,this.velocity).limit(map(d,0,r,this.maxForce*3.5,this.maxForce*.5));}return createVector(0,0);}
  seek(t){return p5.Vector.sub(p5.Vector.sub(t,this.position).normalize().mult(this.maxSpeed),this.velocity).limit(this.maxForce);}
  sep(all,d){let s=createVector(0,0),c=0;for(let o of all){if(o.isLaunched){let dd=p5.Vector.dist(this.position,o.position);if(dd>0&&dd<d){s.add(p5.Vector.sub(this.position,o.position).normalize().div(dd));c++;}}}if(c>0)s.div(c);if(s.mag()>0)s.normalize().mult(this.maxSpeed).sub(this.velocity).limit(this.maxForce*1.5);return s;}
  ali(all,d){let s=createVector(0,0),c=0;for(let o of all){if(o.isLaunched){let dd=p5.Vector.dist(this.position,o.position);if(dd>0&&dd<d){s.add(o.velocity);c++;}}}if(c>0)return s.div(c).normalize().mult(this.maxSpeed).sub(this.velocity).limit(this.maxForce);return createVector(0,0);}
  coh(all,d){let s=createVector(0,0),c=0;for(let o of all){if(o.isLaunched){let dd=p5.Vector.dist(this.position,o.position);if(dd>0&&dd<d){s.add(o.position);c++;}}}if(c>0)return this.seek(s.div(c));return createVector(0,0);}
  display(panic){
    let t=frameCount*.0035+this.colorOffset,[r,g,b]=stageColor(t),av=map(this.zDepth,.4,.95,110,200);
    let cx=this.position.x, cy=this.position.y;
    drawingContext.save(); drawingContext.globalCompositeOperation='lighter';
    let bgl=drawingContext.createRadialGradient(cx,cy,0,cx,cy,this.size*6);
    bgl.addColorStop(0,`rgba(${floor(r)},${floor(g)},${floor(b)},${(av/255*0.30).toFixed(3)})`);
    bgl.addColorStop(0.4,`rgba(${floor(r)},${floor(g)},${floor(b)},${(av/255*0.12).toFixed(3)})`);
    bgl.addColorStop(1,`rgba(${floor(r)},${floor(g)},${floor(b)},0)`);
    drawingContext.fillStyle=bgl;
    drawingContext.beginPath(); drawingContext.arc(cx,cy,this.size*8,0,Math.PI*2); drawingContext.fill();
    drawingContext.restore();
    push();translate(this.position.x,this.position.y);rotate(this.velocity.heading());
    this.wingPhase+=this.velocity.mag()*(panic?.38:.16);
    let wl=this.size*2.2,ws=map(sin(this.wingPhase),-1,1,this.size*.2,this.size*2.6);
    fill(r,g,b,av*.15);ellipse(-wl*.2,0,wl*1.5,ws*1.2);
    fill(r,g,b,av*.75);ellipse(0,0,this.size*.8,ws*2);
    fill(r,g,b,av);ellipse(0,0,wl,this.size*.9);
    fill(255,255,255,av*1.5);ellipse(wl*.2,0,this.size*.5,this.size*.4);
    pop();
  }
}

function stageColor(t){t=((t%1)+1)%1;let r,g,b;if(t<.5){let p=t/.5;r=lerp(10,140,p);g=lerp(190,30,p);b=lerp(255,220,p);}else{let p=(t-.5)/.5;r=lerp(140,10,p);g=lerp(30,190,p);b=lerp(220,255,p);}return[r,g,b];}