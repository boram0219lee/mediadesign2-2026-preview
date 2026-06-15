let creatures  = [];
let incenseOn  = true;
let spawnTimer = 0;
const MAX = 100;  // 궤도 중 생성을 위해 상한 증가

let isOrbiting = false;
let orbitCenter;
let orbitTimer = 0;
const ORBIT_DURATION = 240; // 4초 (60fps 기준)
let GlobalOrbitRadius = 0;

const SCENTS = {
  sandalwood: { h: 32,  s: 18 },
  lavender:   { h: 260, s: 16 },
  oud:        { h: 22,  s: 14 },
};
let currentScent = 'sandalwood';

const SPD_MIN            = 1.2;
const SPD_MAX            = 2.4;
const SPD_APPROACH_MUL   = 5.0;
const ORBIT_SPD_MIN      = 0.016;
const ORBIT_SPD_MAX      = 0.030;
const HEAD_SWAY_NORMAL   = 1.2;
const HEAD_SWAY_APPROACH = 0.7;
const WAVE_SPD_MIN       = 0.005;
const WAVE_SPD_MAX       = 0.015;

const TRAIL_ALPHA = 18;

// 마우스 밀어내기
const REPEL_RADIUS = 160;
const REPEL_FORCE  = 6;

// 마우스 이전 위치 (속도 계산용)
let prevMouseX = 0;
let prevMouseY = 0;
let mouseVX = 0;
let mouseVY = 0;

class SmokeCreature {
  constructor() {
    this.init();
  }

  init() {
    // 출발 X: 좌우로 퍼질 수 있도록 캔버스 하단 넓은 범위
    this.startX = width * random(0.3, 0.6);
    this.startY = height - 54;

    this.totalLength = (0.7 + random(0.4)) * height;
    this.totalPts    = 60;
    this.segLength   = this.totalLength / this.totalPts;

    let strandRoll = random(1);
    this.strandCount = strandRoll < 0.4 ? 2 : 3;
    this.strandOffsets = [];
    for (let s = 0; s < this.strandCount; s++) {
      this.strandOffsets.push(random(-5, 5));
    }

    let bendRoll = random(1);
    if      (bendRoll < 0.15) this.bendCount = 3;
    else if (bendRoll < 0.57) this.bendCount = 1;
    else                      this.bendCount = 2;

    this.bendInterval = floor(this.totalPts / (this.bendCount + 1));
    this.bendDir      = random() < 0.5 ? 1 : -1;
    this.bendAngle    = radians(random(8, 22));

    // 좌우 퍼짐: 일부 크리쳐는 강한 수평 드리프트
    this.driftX = 0;
    let driftRoll = random(1);
    if (driftRoll < 0.35) {
      // 강한 좌우 드리프트 (캔버스 채움용)
      this.driftX = random([-1, 1]) * random(1.0, 2.2);
    } else if (driftRoll < 0.65) {
      // 약한 드리프트
      this.driftX = random([-1, 1]) * random(0.2, 0.8);
    }
    // 나머지는 driftX = 0 (거의 수직 상승)

    // 드리프트 크리쳐는 maxHeadRadius를 크게 허용
    this.maxHeadRadius = width * (abs(this.driftX) > 0.8 ? 0.5 : 0.12);
    this.headOriginX   = this.startX;

    this.spd       = random(SPD_MIN, SPD_MAX);
    this.nox       = random(9999);
    this.waveSpeed = random(WAVE_SPD_MIN, WAVE_SPD_MAX);

    this.alpha       = 0;
    this.targetAlpha = random(150, 220);
    this.age         = 0;
    this.pull        = 0;
    this.dissolve    = 0;
    this.baseThick   = random(0.6, 1.8);

    this.orbitAngle      = 0;
    this.orbitSpeed      = random(ORBIT_SPD_MIN, ORBIT_SPD_MAX);
    this.orbitRadiusOff  = random(-24, 24);
    this.orbitWaveNox    = random(9999);
    this.orbitWaveAmp    = random(8, 22);
    this.orbitWaveSpd    = random(0.003, 0.009);
    this.onTrack         = false;

    this.blendFactor = 0.0;
    this.blendTarget = 0.0;

    this.activeSegsF = 1.0;
    this.activeSegs  = 1;

    // 밀어내기 누적 속도 (관성)
    this.repelVX = 0;
    this.repelVY = 0;

    this.joints = [];
    for (let i = 0; i < this.totalPts; i++) {
      this.joints.push(createVector(this.startX, this.startY));
    }
  }

  getMyOrbitRadius() {
    return GlobalOrbitRadius + this.orbitRadiusOff;
  }

  getNearestPointOnOrbit() {
    let hx = this.joints[0].x;
    let hy = this.joints[0].y;
    let angle = atan2(hy - orbitCenter.y, hx - orbitCenter.x);
    let r = this.getMyOrbitRadius();
    return {
      x:     orbitCenter.x + cos(angle) * r,
      y:     orbitCenter.y + sin(angle) * r,
      angle: angle
    };
  }

  resolveBlended(blendFactor) {
    let n = this.activeSegs;

    let smokePos = [];
    smokePos.push({ x: this.joints[0].x, y: this.joints[0].y });

    for (let i = 1; i < n; i++) {
      let prev = smokePos[i - 1];
      let curr = this.joints[i];

      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      let actualAngle = atan2(dy, dx);

      let sectionIdx  = min(floor(i / this.bendInterval), this.bendCount);
      let dir         = (sectionIdx % 2 === 0) ? this.bendDir : -this.bendDir;
      let targetAngle = -HALF_PI + this.bendAngle * dir;
      let lerpedAngle = lerpAngle(actualAngle, targetAngle, 0.02);

      if (i > 1) {
        let pprev   = smokePos[i - 2];
        let prevAng = atan2(prev.y - pprev.y, prev.x - pprev.x);
        let diff    = angleDiff(lerpedAngle, prevAng);
        let maxDiff = this.bendAngle + radians(20);
        if (abs(diff) > maxDiff)
          lerpedAngle = prevAng + maxDiff * (diff > 0 ? 1 : -1);
      }

      smokePos.push({
        x: prev.x + cos(lerpedAngle) * this.segLength,
        y: prev.y + sin(lerpedAngle) * this.segLength
      });
    }

    let chainPos = [];
    chainPos.push({ x: this.joints[0].x, y: this.joints[0].y });

    for (let i = 1; i < n; i++) {
      let prev = chainPos[i - 1];
      let curr = this.joints[i];
      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      let d  = sqrt(dx * dx + dy * dy);
      if (d < 0.001) {
        chainPos.push({ x: prev.x, y: prev.y + this.segLength });
      } else {
        chainPos.push({
          x: prev.x + (dx / d) * this.segLength,
          y: prev.y + (dy / d) * this.segLength
        });
      }
    }

    for (let i = 1; i < n; i++) {
      this.joints[i].x = lerp(smokePos[i].x, chainPos[i].x, blendFactor);
      this.joints[i].y = lerp(smokePos[i].y, chainPos[i].y, blendFactor);
    }
  }

  update() {
    this.age++;

    if (this.age < 40)
      this.alpha += (this.targetAlpha - this.alpha) * 0.06;

    if (this.activeSegs < this.totalPts) {
      let headDist = dist(this.joints[0].x, this.joints[0].y, this.startX, this.startY);
      let needed   = headDist / this.segLength + 1;
      this.activeSegsF = constrain(
        lerp(this.activeSegsF, needed, 0.15),
        this.activeSegsF,
        this.totalPts
      );
      this.activeSegs = min(floor(this.activeSegsF) + 1, this.totalPts);
    }

    this.blendFactor += (this.blendTarget - this.blendFactor) * 0.04;

    if (isOrbiting) {
      if (!this.onTrack) {
        this.blendTarget = 0.55;

        let target = this.getNearestPointOnOrbit();
        let hx = this.joints[0].x;
        let hy = this.joints[0].y;
        let dx = target.x - hx;
        let dy = target.y - hy;
        let d  = sqrt(dx * dx + dy * dy);
        let approachSpd = this.spd * SPD_APPROACH_MUL;

        if (d > approachSpd) {
          let headSway = (noise(this.nox) * 2 - 1) * HEAD_SWAY_APPROACH;
          this.nox += this.waveSpeed;
          this.joints[0].x += (dx / d) * approachSpd + headSway;
          this.joints[0].y += (dy / d) * approachSpd;
        } else {
          this.joints[0].x = target.x;
          this.joints[0].y = target.y;
          this.orbitAngle   = target.angle;
          this.onTrack      = true;
        }

        this.pull += (1 - this.pull) * 0.08;
        this.resolveBlended(this.blendFactor);

      } else {
        this.blendTarget = 0.82;
        this.orbitAngle += this.orbitSpeed;
        this.orbitWaveNox += this.orbitWaveSpd;

        let waveDelta = (noise(this.orbitWaveNox) * 2 - 1) * this.orbitWaveAmp;
        let r = this.getMyOrbitRadius() + waveDelta;

        this.joints[0].x = orbitCenter.x + cos(this.orbitAngle) * r;
        this.joints[0].y = orbitCenter.y + sin(this.orbitAngle) * r;

        this.pull += (1 - this.pull) * 0.06;
        this.resolveBlended(this.blendFactor);
      }

    } else {
      // ── 일반 상승 ──
      this.blendTarget = 0.0;
      this.onTrack = false;

      let headSway = (noise(this.nox) * 2 - 1) * HEAD_SWAY_NORMAL;
      this.nox += this.waveSpeed;

      // 기본 이동: 위로 + 드리프트
      this.joints[0].y -= this.spd;
      this.joints[0].x += headSway + this.driftX;

      // ── 마우스 밀어내기 ──
      // 관성 감쇠
      this.repelVX *= 0.82;
      this.repelVY *= 0.82;

      let hx = this.joints[0].x;
      let hy = this.joints[0].y;
      let d  = dist(hx, hy, mouseX, mouseY);

      if (d < REPEL_RADIUS && d > 0.5) {
        // 마우스 이동 속도를 반영한 밀어내기
        let mouseSpdBoost = sqrt(mouseVX * mouseVX + mouseVY * mouseVY) * 0.3;
        let repelStr = map(d, 0, REPEL_RADIUS, REPEL_FORCE + mouseSpdBoost, 0);
        let nx = (hx - mouseX) / d;
        let ny = (hy - mouseY) / d;
        this.repelVX += nx * repelStr;
        this.repelVY += ny * repelStr;
        this.pull += (1 - this.pull) * 0.12;
      } else {
        this.pull += (0 - this.pull) * 0.04;
      }

      // 밀어내기 속도 적용 (상한 클램프)
      let repelMag = sqrt(this.repelVX * this.repelVX + this.repelVY * this.repelVY);
      if (repelMag > 12) {
        this.repelVX = (this.repelVX / repelMag) * 12;
        this.repelVY = (this.repelVY / repelMag) * 12;
      }
      this.joints[0].x += this.repelVX;
      this.joints[0].y += this.repelVY;

      // 드리프트 크리쳐는 화면 양쪽 끝에서 bounce
      if (this.joints[0].x < -50)       this.driftX = abs(this.driftX);
      if (this.joints[0].x > width + 50) this.driftX = -abs(this.driftX);

      this.resolveBlended(this.blendFactor);
    }
  }

  draw() {
    let sc = SCENTS[currentScent];
    push();
    noFill();
    colorMode(HSB, 360, 100, 100, 255);

    for (let s = 0; s < this.strandCount; s++) {
      let offset = this.strandOffsets[s];

      for (let i = 0; i < this.activeSegs - 1; i++) {
        let t = i / (this.totalPts - 1);

        let dissolveEdge = constrain(this.dissolve * 1.8 - (1 - t) * 0.8, 0, 1);
        let a = (this.alpha + this.pull * 35)
                * (t * 0.5 + 0.5)
                * (1 - dissolveEdge);

        let bloom = dissolveEdge * 5 * (1 - t);
        let strandThickMult = s === 0 ? 1.0 : random(0.4, 0.7);
        let sw = this.baseThick * strandThickMult
                 * (t * 0.6 + 0.4)
                 * (1 + this.pull * 0.25)
                 + bloom;

        stroke(sc.h + (1 - t) * 10, sc.s + s * 2, 88 + s * 3, a);
        strokeWeight(sw);

        let pt0 = this.joints[i];
        let pt1 = this.joints[i + 1];

        let perpAngle = p5.Vector.sub(pt1, pt0).heading() + HALF_PI;
        let ox = cos(perpAngle) * offset;
        let oy = sin(perpAngle) * offset;

        let x0 = pt0.x + ox, y0 = pt0.y + oy;
        let x1 = pt1.x + ox, y1 = pt1.y + oy;
        let mx0 = (x0 + x1) / 2;
        let my0 = (y0 + y1) / 2;

        if (i === 0) {
          line(x0, y0, mx0, my0);
        } else {
          let ptPrev = this.joints[i - 1];
          let px = ptPrev.x + ox, py = ptPrev.y + oy;
          let pmx = (px + x0) / 2;
          let pmy = (py + y0) / 2;
          beginShape();
          vertex(pmx, pmy);
          quadraticVertex(x0, y0, mx0, my0);
          endShape();
        }
      }
    }

    colorMode(RGB);
    pop();
  }

  isDead() {
    // 머리가 화면 위·왼쪽·오른쪽으로 완전히 벗어나면 제거
    return this.joints[0].y < -this.totalLength ||
           this.joints[0].x < -this.totalLength ||
           this.joints[0].x > width + this.totalLength;
  }
}

function lerpAngle(a, b, t) {
  let diff = angleDiff(b, a);
  return a + diff * t;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d < -PI) d += TWO_PI;
  while (d >  PI) d -= TWO_PI;
  return d;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  orbitCenter = createVector(0, 0);
  GlobalOrbitRadius = min(width, height) * 0.36;
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  for (let i = 0; i < 8; i++) {
    let c = new SmokeCreature();
    c.age         = floor(random(200));
    c.alpha       = random(c.targetAlpha);
    c.activeSegs  = c.totalPts;
    c.activeSegsF = c.totalPts;
    creatures.push(c);
  }
}

function draw() {
  noStroke();
  fill(0, TRAIL_ALPHA);
  rect(0, 0, width, height);

  // 마우스 속도 계산
  mouseVX = mouseX - prevMouseX;
  mouseVY = mouseY - prevMouseY;
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  if (isOrbiting) {
    orbitTimer--;
    if (orbitTimer <= 0) isOrbiting = false;
  }

  // 항상(궤도 중 포함) 크리쳐 생성
  if (incenseOn) {
    spawnTimer++;
    if (spawnTimer >= 14 && creatures.length < MAX) {
      spawnTimer = 0;
      creatures.push(new SmokeCreature());
    }
  }

  for (let i = creatures.length - 1; i >= 0; i--) {
    creatures[i].update();
    creatures[i].draw();
    if (creatures[i].isDead()) {
      creatures.splice(i, 1);
    }
  }
}

function mousePressed() {
  isOrbiting = true;
  orbitCenter.set(mouseX, mouseY);
  orbitTimer = ORBIT_DURATION;
  for (let c of creatures) c.onTrack = false;
}

function doubleClicked() {
  creatures = [];
  isOrbiting = false;
  background(0);
  for (let i = 0; i < 8; i++) {
    let c = new SmokeCreature();
    c.age         = 0;
    c.alpha       = 0;
    c.activeSegs  = 1;
    c.activeSegsF = 1;
    creatures.push(c);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  GlobalOrbitRadius = min(width, height) * 0.36;
}