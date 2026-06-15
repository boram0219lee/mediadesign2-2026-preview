let mouseMovedYet = false; 
let particles = []; 
const numParticles = 2600; 

let resolution = 20; 
let cols, rows; 
let zOffset = 0; 

let currentModeLerp = 0; 

let sharedColors = {
  baseColors: [],
  highlightColors: [],
  blueLine: null
};

let pulsePhase = 0;
let pulseRings = [];

let leftSound, rightSound;
let leftPanNode, rightPanNode;
let audioContextReady = false;
let musicReady = false;

function preload() {
  soundFormats('mp3');
  leftSound  = loadSound('ikoliks_aj-acoustic-spring-mothers-day-music-320427.mp3');
  rightSound = loadSound('Sufjan Stevens - Mystery of Love (Official Instrumental) (mp3cut.net).mp3');
}

function initAudio() {
  if (audioContextReady) return;
  audioContextReady = true;

  let ac = getAudioContext();

  leftPanNode = ac.createStereoPanner();
  leftPanNode.pan.value = -1;
  leftPanNode.connect(ac.destination);

  rightPanNode = ac.createStereoPanner();
  rightPanNode.pan.value = 1;
  rightPanNode.connect(ac.destination);

  leftSound.disconnect();
  rightSound.disconnect();
  leftSound.connect(leftPanNode);
  rightSound.connect(rightPanNode);

  leftSound.setVolume(0);
  rightSound.setVolume(0);
}

function startMusic() {
  musicReady = true;
  leftSound.setVolume(0);
  rightSound.setVolume(0);
  leftSound.loop();
  rightSound.loop();
  setTimeout(() => {
    leftSound.setVolume(1.0, 1.5);
    rightSound.setVolume(0.0, 1.5);
  }, 400);
}

function updateAudio() {
  if (!musicReady) return;
  let t = constrain(mouseX / width, 0, 1);
  leftSound.setVolume(1.0 - t, 0.05);
  rightSound.setVolume(t * 1.4, 0.05);
}

function playBurstSound() {
  let ac = getAudioContext();
  if (!ac) return;

  let now = ac.currentTime;
  let clickPan = map(mouseX, 0, width, -1, 1);

  let panner = ac.createStereoPanner();
  panner.pan.value = clickPan;
  panner.connect(ac.destination);

  [880, 887].forEach(freq => {
    let osc = ac.createOscillator();
    let g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.01);
    g.gain.setValueAtTime(0.22, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.connect(g);
    g.connect(panner);
    osc.start(now);
    osc.stop(now + 0.9);
  });
}

function setup() { 
  createCanvas(1280, 720); 
  background(255, 254, 250); 

  cols = floor(width / resolution) + 2; 
  rows = floor(height / resolution) + 2; 

  for (let i = 0; i < numParticles; i++) { 
    particles.push(new ImageInspiredSpore()); 
  } 
} 

function draw() { 
  let targetMode = constrain(mouseX / width, 0, 1); 
  let adjustedTarget = map(targetMode, 0.1, 0.9, 0, 1, true);
  currentModeLerp = lerp(currentModeLerp, adjustedTarget, 0.1); 

  let bgLeft       = color(255, 254, 248, 8);
  let bgPinkOrange = color(255, 235, 215, 12);
  let bgMid        = color(85, 125, 175, 22);
  let bgRight      = color(18, 28, 72, 30);
  
  let currentBg;
  if (currentModeLerp < 0.6) {
    currentBg = lerpColor(bgLeft, bgPinkOrange, map(currentModeLerp, 0, 0.45, 0, 1));
  } else if (currentModeLerp < 0.62) {
    currentBg = lerpColor(bgPinkOrange, bgMid, map(currentModeLerp, 0.45, 0.62, 0, 1));
  } else if (currentModeLerp < 0.75) {
  currentBg = lerpColor(bgMid, bgRight,
    map(currentModeLerp, 0.62, 0.75, 0, 1));

} else {
  currentBg = bgRight;
}
  background(currentBg);

  updateAudio();
  updateSharedColors(currentModeLerp);

  let flowDetail   = lerp(map(mouseX, 0, width, 0.001, 0.004), map(mouseX, 0, width, 0.002, 0.007), currentModeLerp);
  let distortForce = lerp(map(mouseY, 0, height, 0.5, 3.0), map(mouseY, 0, height, 0.3, 3.0), currentModeLerp);
  zOffset += lerp(0.004, 0.002, currentModeLerp); 

  for (let p of particles) { 
    p.followField(flowDetail, distortForce, currentModeLerp); 
    p.update(distortForce); 
    p.display(currentModeLerp); 
  } 

  drawPulsingCore(width / 2, height / 2 + 50, currentModeLerp); 
}

function mousePressed() { 
  if (!audioContextReady) {
    userStartAudio().then(() => {
      initAudio();
      playBurstSound();
      setTimeout(startMusic, 1500);
    });
  } else {
    playBurstSound();
  }

  mouseMovedYet = true; 
  noiseSeed(random(10000)); 
  for (let p of particles) { 
    p.burst(); 
  }
  pulseRings.push({ r: 0, alpha: 1.0, born: frameCount });
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
  cols = floor(width / resolution) + 2; 
  rows = floor(height / resolution) + 2; 
  background(255, 254, 245); 
} 

function updateSharedColors(lerpVal) {
  let proto = particles[0];
  let getTripleLerp = (cLeft, cMid, cRight, val) => {
    let adjustedVal = map(val, 0.1, 0.9, 0, 1, true);
    if (adjustedVal < 0.5) {
      return lerpColor(cLeft, cMid, adjustedVal * 2);
    } else {
      return lerpColor(cMid, cRight, (adjustedVal - 0.5) * 2);
    }
  };
  for (let i = 0; i < 4; i++) {
    sharedColors.baseColors[i] = getTripleLerp(proto.leftColorPalette[i], proto.midColorPalette[i], proto.rightColorPalette[i], lerpVal);
  }
  for (let i = 0; i < 3; i++) {
    sharedColors.highlightColors[i] = getTripleLerp(proto.leftHighlightPalette[i], proto.midHighlightPalette[i], proto.rightHighlightPalette[i], lerpVal);
  }
  sharedColors.blueLine = getTripleLerp(proto.baseBlueLineLeft, proto.baseBlueLineMid, proto.baseBlueLineRight, lerpVal);
}

function drawPulsingCore(x, y, lerpVal) {
  push();
  noStroke();

  pulsePhase += 0.045;

  let dayBeat   = sin(pulsePhase * 1.8) * 0.5 + 0.5;
  let nightBeat = sin(pulsePhase * 0.9) * 0.5 + 0.5;
  let beat = lerp(dayBeat, nightBeat, lerpVal);

  for (let i = 0; i < 6; i++) { 
    let r = random(80, 160); 
    let offsetX = sin(frameCount * 0.01 + i) * 20; 
    let offsetY = cos(frameCount * 0.02 + i) * 20; 
    fill(255, 120, 165, random(1, 4)); 
    ellipse(x + offsetX, y + offsetY, r * 1.5, r * 1.8); 
  } 
  for (let i = 0; i < 4; i++) { 
    let r = random(100, 200); 
    let offsetX = cos(frameCount * 0.015 + i) * 15; 
    let offsetY = sin(frameCount * 0.015 + i) * 30; 
    fill(190, 240, 210, random(1, 3) * lerpVal); 
    ellipse(x + offsetX, y - 20 + offsetY, r * 1.6, r * 2.2); 
  }

  let ringR = 60 + beat * lerp(14, 22, lerpVal);
  let ringAlpha = beat * lerp(5, 9, lerpVal);
  noFill();
  let ringDayC   = color(255, 140, 180, ringAlpha);
  let ringNightC = color(100, 130, 220, ringAlpha);
  stroke(lerpColor(ringDayC, ringNightC, lerpVal));
  strokeWeight(0.8);
  ellipse(x, y, ringR * 2, ringR * 2.3);
  noStroke();

  noFill();
  for (let i = pulseRings.length - 1; i >= 0; i--) {
    let ring = pulseRings[i];
    ring.r += lerp(2.8, 2.0, lerpVal);
    ring.alpha -= lerp(0.022, 0.013, lerpVal);
    if (ring.alpha <= 0 || ring.r > 260) { pulseRings.splice(i, 1); continue; }
    let a = ring.alpha * 255;
    stroke(lerpColor(color(255, 140, 180, a * 0.5), color(100, 140, 240, a * 0.6), lerpVal));
    strokeWeight(1.2 * ring.alpha);
    ellipse(x, y, ring.r * 2, ring.r * 2.3);
  }

  // 중심 코어 작은 원
  let coreSize = lerp(10, 6, lerpVal) + beat * lerp(9, 5, lerpVal);
  let corePulse = sin(pulsePhase * 2.1) * 0.5 + 0.5;
  let coreAlpha = lerp(20,12, lerpVal) + corePulse * lerp(20,10, lerpVal);
  fill(lerpColor(color(255, 130, 170, coreAlpha), color(120, 150, 240, coreAlpha), lerpVal));
  ellipse(x, y, coreSize * 2, coreSize * 2.4);

  pop();
}

class ImageInspiredSpore { 
  constructor() { 
    this.leftColorPalette = [ 
      color(160, 200, 255, 18),
      color(255, 110, 155, 22),
      color(200, 155, 255, 18),
      color(255, 230, 100, 20)
    ]; 
    this.leftHighlightPalette = [ 
      color(80, 60, 220, 65),
      color(230, 100, 180, 100),
      color(120, 210, 180, 140)
    ]; 
    this.baseBlueLineLeft = color(120, 180, 255, 22);

    this.midColorPalette = [
      color(150, 200, 230, 16),
      color(230, 130, 180, 16),
      color(160, 180, 240, 15),
      color(200, 235, 200, 18)
    ];
    this.midHighlightPalette = [
      color(120, 210, 230, 90),
      color(212, 129, 186, 80),
      color(200, 220, 240, 120)
    ];
    this.baseBlueLineMid = color(150, 180, 235, 20);

    this.rightColorPalette = [
  color(60, 140, 110, 18),
  color(200, 60, 120, 18),
  color(80, 120, 210, 16),
  color(140, 200, 175, 20)
];

this.rightHighlightPalette = [
  color(100, 220, 170, 120),
  color(180, 90, 160, 90),
  color(160, 200, 240, 140)
];

this.baseBlueLineRight = color(173, 152, 230, 30);

    this.init(); 
  } 

  init() { 
    let angle = random(TWO_PI); 
    let r = random(0, 150); 
    this.pos = createVector( 
      width / 2 + cos(angle) * r, 
      height / 2 + 50 + sin(angle) * r 
    ); 
    this.vel = createVector(0, 0); 
    this.acc = createVector(0, 0); 
    this.seed = random(10000); 
    this.lifespan = random(250, 500); 
    this.isBursting = false; 
    this.cIdx = floor(random(4));
    this.hIdx = floor(random(3));
  } 

  followField(flowDetail, distortForce, currentModeLerp) { 
    let n1 = noise(this.pos.x * flowDetail, this.pos.y * flowDetail, zOffset); 
    let n2 = noise(this.pos.y * flowDetail + 100, this.pos.x * flowDetail + 100, zOffset * 0.8); 
    let angle = (n1 + n2) * TWO_PI * distortForce; 
    let flowVector = createVector(cos(angle), sin(angle)); 
    let forceMult = lerp(0.22, 0.18, currentModeLerp);
    flowVector.mult(forceMult); 
    this.acc.add(flowVector); 

    if (!this.isBursting) {
      let target = createVector(mouseX, mouseY);
      let dir = p5.Vector.sub(target, this.pos);
      let d = dir.mag();
      if (d < 400) {
        dir.normalize();
        let pullStrength = map(d, 0, 400, 0.6, 0.1); 
        dir.mult(pullStrength);
        this.acc.add(dir);
      }
    }
  } 

  burst() { 
    this.isBursting = true;
    this.vel = p5.Vector.random2D().mult(random(12, 22)); 
    this.lifespan = random(45, 90); 
  } 

  update(distortForce) { 
    this.acc.add(createVector(0, -0.005)); 
    this.vel.add(this.acc); 
    if (this.isBursting) {
      this.vel.limit(25); 
      this.vel.mult(0.95); 
    } else {
      this.vel.limit(distortForce + 2.0); 
    }
    this.pos.add(this.vel); 
    this.acc.mult(0); 
    this.lifespan--; 
    if ( 
      this.lifespan <= 0 || 
      this.pos.y < -50 || 
      this.pos.x < -50 || 
      this.pos.x > width + 50 || 
      this.pos.y > height + 50 
    ) { 
      this.init(); 
    } 
  } 

  display(currentModeLerp) { 
    push(); 
    let activeBaseColor      = sharedColors.baseColors[this.cIdx];
    let activeHighlightColor = sharedColors.highlightColors[this.hIdx];
    let activeBlueLine       = sharedColors.blueLine;
    let colorTrigger = noise(this.pos.x * 0.01, this.pos.y * 0.01, this.seed); 
    let minLength = lerp(0.5, 2.0, currentModeLerp);
    let maxLength = lerp(2.5, 5.0, currentModeLerp);
    let lineLength = random(minLength, maxLength); 

    if (colorTrigger > 0.70) { 
      stroke(activeHighlightColor); 
      strokeWeight(random(2.0, 4.0)); 
      point(this.pos.x, this.pos.y); 
    } else { 
      let strokeVec = this.vel.copy().normalize().mult(lineLength);
      stroke(activeBlueLine); 
      strokeWeight(random(1.0, 2.5)); 
      line(this.pos.x - strokeVec.x, this.pos.y - strokeVec.y, this.pos.x + strokeVec.x, this.pos.y + strokeVec.y); 
      if (random(1) > 0.985) { 
        stroke(activeBaseColor); 
        strokeWeight(random(2.0, 3.5)); 
        line(this.pos.x - strokeVec.x * 1.5, this.pos.y - strokeVec.y * 1.5, this.pos.x + strokeVec.x * 1.5, this.pos.y + strokeVec.y * 1.5); 
      } 
    } 
    pop(); 
  } 
}