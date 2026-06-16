const W = 1280;
const H = 720;
const BS = 0.22;
const SF = 6;

let no = 0;
let bg;
let bf = 0;

let creatures = [];
let ripples = [];
let spores = [];
let plants = [];

let nextAutoRippleFrame = 90;

const CREATURE_COUNT = 16;
const PLANT_COUNT = 5;
const MAX_SPORES = 80;
const MAX_RIPPLES = 10;

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  colorMode(RGB, 255, 255, 255, 255);
  noStroke();

  bg = createGraphics(floor(W * BS), floor(H * BS));
  bg.pixelDensity(1);

  for (let i = 0; i < CREATURE_COUNT; i++) {
    creatures.push(
      new Creature(
        random(120, W - 120),
        random(100, H - 100),
        randomSize(),
        i % 9
      )
    );
  }

  for (let i = 0; i < PLANT_COUNT; i++) {
    let scale;
    let s = random();

    if (s < 0.3) scale = random(0.22, 0.42);
    else if (s < 0.75) scale = random(0.5, 0.78);
    else scale = random(0.9, 1.25);

    plants.push(
      new WatercolorPlant(
        random(150, W - 150),
        random(120, H - 120),
        scale
      )
    );
  }
}

function draw() {
  if (bf % SF === 0) drawBG();

  image(bg, 0, 0, W, H);
  drawBackgroundMist();

  if (frameCount > nextAutoRippleFrame && ripples.length < MAX_RIPPLES) {
    ripples.push(new Ripple(random(120, W - 120), random(120, H - 120), true));
    nextAutoRippleFrame = frameCount + floor(random(80, 170));
  }

  for (let p of plants) {
    p.update();
    p.draw();
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].draw();
    if (ripples[i].dead) ripples.splice(i, 1);
  }

  for (let c of creatures) {
    c.update();
    c.checkRipples(ripples);
    c.draw();
  }

  for (let i = spores.length - 1; i >= 0; i--) {
    spores[i].update();
    spores[i].checkPlants(plants);
    spores[i].draw();

    if (spores[i].dead) spores.splice(i, 1);
  }

  if (spores.length > MAX_SPORES) {
    spores.splice(0, spores.length - MAX_SPORES);
  }

  no += 0.0007;
  bf++;
}

function randomSize() {
  let r = random();
  if (r < 0.25) return random(20, 30);
  if (r < 0.72) return random(36, 54);
  return random(65, 95);
}

function mousePressed() {
  if (ripples.length < MAX_RIPPLES) {
    ripples.push(new Ripple(mouseX, mouseY, false));
  }
}

function drawBG() {
  bg.loadPixels();

  let px = bg.pixels;
  let bw = bg.width;
  let bh = bg.height;
  let activeRipples = ripples.filter(rp => rp.life > 0.05);

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      let wx = x / BS;
      let wy = y / BS;

      let n =
        noise(x * 0.025, y * 0.025, no) * 0.62 +
        noise(x * 0.055 + 9, y * 0.055 + 9, no * 1.2) * 0.38;

      let shade = 0;
      let highlight = 0;

      for (let rp of activeRipples) {
        let dx = wx - rp.x;
        let dy = wy - rp.y;
        let d = sqrt(dx * dx + dy * dy);

        if (d > rp.maxR) continue;
        if (d > rp.r + rp.outerSoftness) continue;

        for (let k = 0; k < rp.ringCount; k++) {
          let ringR = rp.r - k * rp.ringGap;
          if (ringR <= 0) continue;
          if (ringR > rp.maxR) continue;

          let rim = abs(d - ringR);

          if (rim < rp.thickness) {
            let strength = 1 - rim / rp.thickness;
            let layerPower = pow(1 - k / rp.ringCount, 1.4);

            let angle = atan2(dy, dx);
            let organic = noise(
              cos(angle) * 1.7 + rp.seed,
              sin(angle) * 1.7 + rp.seed,
              rp.r * 0.012
            );

            let uneven = map(organic, 0, 1, 0.55, 1.25);

            shade += strength * rp.life * rp.darkPower * layerPower * uneven;
            highlight +=
              strength *
              rp.life *
              rp.lightPower *
              layerPower *
              (1.4 - uneven);
          }
        }
      }

      n = n - shade + highlight;
      n = min(1, pow(max(0.34, n), 0.82) * 1.32);

      let idx = (x + y * bw) * 4;

      px[idx] = floor(n * 42 + 18);
      px[idx + 1] = floor(n * 116 + 58);
      px[idx + 2] = floor(n * 78 + 48);
      px[idx + 3] = 255;
    }
  }

  bg.updatePixels();
}

function drawBackgroundMist() {
  noStroke();

  for (let i = 0; i < 22; i++) {
    let x = noise(i * 0.17, frameCount * 0.002) * width;
    let y = noise(i * 0.23, frameCount * 0.002 + 50) * height;
    let s = noise(i * 0.12, frameCount * 0.003) * 260 + 90;

    fill(130, 190, 160, 5);
    ellipse(x, y, s * 1.6, s * 0.8);
  }

  for (let y = height * 0.62; y < height; y += 10) {
    let a = map(y, height * 0.62, height, 0, 18);
    fill(145, 190, 125, a * 0.18);
    rect(0, y, width, 10);
  }
}

// ═════════════════════════════════════════════════════
// 수채화 식물
// ═════════════════════════════════════════════════════

class WatercolorPlant {
  constructor(x, y, scaleFactor = 0.6) {
    this.x = x;
    this.y = y;
    this.scaleFactor = scaleFactor;

    this.growth = 0;
    this.targetGrowth = 0.015;
    this.seed = random(1000);
    this.absorbRadius = 125 * scaleFactor;

    this.petals = [];
    this.softLeaves = [];
    this.mistDots = [];

    // 식물 전용 이미지 버퍼
    this.pgSize = floor(520 * scaleFactor + 160);
    this.pg = createGraphics(this.pgSize, this.pgSize);
    this.pg.pixelDensity(1);
    this.pg.colorMode(RGB, 255, 255, 255, 255);

    this.needsRedraw = true;
    this.redrawCooldown = 0;

    this.makePlant();
  }

  makePlant() {
    let count = 8;

    for (let i = 0; i < count; i++) {
      let a = (TWO_PI / count) * i + random(-0.25, 0.25);

      this.petals.push({
        angle: a,
        dist: random(45, 155) * this.scaleFactor,
        w: random(70, 130) * this.scaleFactor,
        h: random(38, 88) * this.scaleFactor,
        delay: 0.08 + i * 0.06 + random(-0.02, 0.02),
        rot: random(-0.9, 0.9),
        colorPick: random(),
        seed: random(1000)
      });
    }

    for (let i = 0; i < 4; i++) {
      let a = random(TWO_PI);

      this.softLeaves.push({
        angle: a,
        dist: random(115, 245) * this.scaleFactor,
        w: random(95, 185) * this.scaleFactor,
        h: random(34, 78) * this.scaleFactor,
        delay: 0.56 + i * 0.09 + random(-0.03, 0.03),
        rot: random(-1.2, 1.2),
        colorPick: random(),
        seed: random(1000)
      });
    }

    for (let i = 0; i < 10; i++) {
      let a = random(TWO_PI);
      let d = random(35, 250) * this.scaleFactor;

      this.mistDots.push({
        x: cos(a) * d,
        y: sin(a) * d * 0.72,
        s: random(1.4, 4.2) * this.scaleFactor,
        delay: random(0.38, 1),
        colorPick: random()
      });
    }
  }

  absorb(amount) {
    this.targetGrowth += amount;
    this.targetGrowth = constrain(this.targetGrowth, 0, 1);
    this.needsRedraw = true;
  }

  update() {
    let prev = this.growth;

    // 성장 속도: 낮을수록 천천히
    this.growth += (this.targetGrowth - this.growth) * 0.009;

    // 매 프레임 다시 그리지 않고, 변화가 있을 때만 갱신
    if (abs(prev - this.growth) > 0.0018) {
      this.redrawCooldown++;

      if (this.redrawCooldown >= 3) {
        this.needsRedraw = true;
        this.redrawCooldown = 0;
      }
    }
  }

  draw() {
    if (this.needsRedraw) {
      this.redrawPlant();
      this.needsRedraw = false;
    }

    imageMode(CENTER);
    image(this.pg, this.x, this.y);
  }

  redrawPlant() {
    let pg = this.pg;
    pg.clear();

    pg.push();
    pg.translate(pg.width / 2, pg.height / 2);

    this.drawSoftAura(pg);

    for (let leaf of this.softLeaves) {
      this.drawLeafBlob(pg, leaf, true);
    }

    for (let p of this.petals) {
      this.drawLeafBlob(pg, p, false);
    }

    this.drawDots(pg);
    this.drawCenter(pg);

    pg.pop();
  }

  drawSoftAura(pg) {
    let g = easeOut(constrain(this.growth * 1.3, 0, 1));

    pg.blendMode(MULTIPLY);
    pg.noStroke();

    for (let i = 3; i >= 1; i--) {
      let s = i * 38 * g * this.scaleFactor;
      pg.fill(90, 145, 95, 1.2);
      pg.ellipse(0, 0, s * 1.35, s);
    }

    pg.blendMode(BLEND);
  }

  drawLeafBlob(pg, data, outer) {
    let localG = map(this.growth, data.delay, 1, 0, 1, true);
    localG = easeOut(localG);

    if (localG <= 0.01) return;

    let moveD = data.dist * localG;

    let x = cos(data.angle) * moveD;
    let y = sin(data.angle) * moveD * 0.72;

    pg.push();
    pg.translate(x, y);
    pg.rotate(data.angle + data.rot * 0.35);

    let w = data.w * localG;
    let h = data.h * localG;

    let col = this.pickColor(data.colorPick, outer);

    // 레이어/점 수 줄여서 렉 감소
    for (let layer = 2; layer >= 1; layer--) {
      let sc = map(layer, 1, 2, 0.82, 1.3);
      let alpha = outer ? layer * 10 : layer * 14;

      pg.fill(col[0], col[1], col[2], alpha);
      pg.noStroke();

      pg.beginShape();

      for (let a = 0; a <= TWO_PI + 0.2; a += TWO_PI / 10) {
        let nx = cos(a);
        let ny = sin(a);

        let wobble = noise(
          nx * 1.6 + data.seed,
          ny * 1.6 + data.seed,
          layer * 0.1
        );

        let rr = map(wobble, 0, 1, 0.72, 1.18);

        let px = nx * w * 0.5 * sc * rr;
        let py = ny * h * 0.5 * sc * rr;

        pg.curveVertex(px, py);
      }

      pg.endShape(CLOSE);
    }

    // 중심맥 아주 약하게
    if (!outer) {
      pg.noFill();
      pg.stroke(110, 170, 100, 8);
      pg.strokeWeight(0.55 * this.scaleFactor);

      pg.beginShape();
      for (let i = 0; i <= 8; i++) {
        let t = i / 8;
        let xx = lerp(-w * 0.34, w * 0.34, t);
        let yy = sin(t * PI) * h * 0.06;
        pg.curveVertex(xx, yy);
      }
      pg.endShape();
    }

    pg.pop();
  }

  drawCenter(pg) {
    let g = easeOut(constrain(this.growth * 2.4, 0, 1));

    pg.blendMode(ADD);
    pg.noStroke();

    for (let i = 3; i >= 1; i--) {
      pg.fill(120, 210, 130, i * 0.55);
      pg.ellipse(
        0,
        0,
        i * 14 * g * this.scaleFactor,
        i * 10 * g * this.scaleFactor
      );
    }

    pg.blendMode(BLEND);
  }

  drawDots(pg) {
    pg.blendMode(ADD);
    pg.noStroke();

    for (let d of this.mistDots) {
      let g = map(this.growth, d.delay, 1, 0, 1, true);
      g = easeOut(g);

      if (g <= 0.01) continue;

      let x = d.x * g;
      let y = d.y * g;

      let col = d.colorPick < 0.5 ? [150, 230, 135] : [130, 210, 185];

      if (g > 0.2) {
        pg.blendMode(SCREEN);
        pg.noFill();

        pg.stroke(col[0], col[1], col[2], 13 * g);
        pg.strokeWeight(0.3 * this.scaleFactor);

        pg.beginShape();

        let midX = x * 0.45 + sin(d.x * 0.02 + this.seed) * 7;
        let midY = y * 0.45 + cos(d.y * 0.02 + this.seed) * 6;

        pg.curveVertex(0, 0);
        pg.curveVertex(0, 0);
        pg.curveVertex(midX, midY);
        pg.curveVertex(x, y);
        pg.curveVertex(x, y);

        pg.endShape();

        pg.blendMode(ADD);
        pg.noStroke();
      }

      pg.fill(col[0], col[1], col[2], 12 * g);
      pg.ellipse(x, y, d.s * 2.0 * g);

      pg.fill(230, 255, 190, 16 * g);
      pg.ellipse(x, y, d.s * 0.65 * g);
    }

    pg.blendMode(BLEND);
  }

  pickColor(t, outer) {
    if (outer) {
      if (t < 0.4) return [65, 145, 78];
      if (t < 0.75) return [78, 165, 88];
      return [92, 185, 115];
    } else {
      if (t < 0.35) return [50, 155, 62];
      if (t < 0.7) return [70, 180, 74];
      return [95, 200, 96];
    }
  }
}

// ═════════════════════════════════════════════════════
// 파동
// ═════════════════════════════════════════════════════

class Ripple {
  constructor(x, y, auto = false) {
    this.x = x;
    this.y = y;
    this.r = 0;
    this.life = 1;
    this.dead = false;
    this.auto = auto;

    this.id = random(1000000);
    this.seed = random(1000);

    this.maxR = auto ? random(90, 190) : random(170, 320);
    this.speed = auto ? random(0.9, 1.6) : random(1.8, 2.8);
    this.decay = auto ? random(0.006, 0.01) : random(0.004, 0.007);
    this.thickness = auto ? random(8, 16) : random(12, 24);

    this.ringCount = constrain(floor(map(this.maxR, 90, 320, 2, 6)), 2, 6);
    this.ringGap = this.maxR / random(5.5, 8.5);
    this.outerSoftness = this.thickness * 1.8;

    this.darkPower = auto ? 0.18 : 0.30;
    this.lightPower = auto ? 0.07 : 0.13;
  }

  update() {
    this.r += this.speed;

    let edgeFade = map(this.r, this.maxR * 0.65, this.maxR, 1, 1.8, true);
    this.life -= this.decay * edgeFade;

    if (this.life <= 0 || this.r > this.maxR) {
      this.dead = true;
    }
  }

  draw() {}
}

// ═════════════════════════════════════════════════════
// 생물
// ═════════════════════════════════════════════════════

class Creature {
  constructor(x, y, r, type) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.type = type;

    this.vx = 0;
    this.vy = 0;

    this.seed = random(1000);
    this.angle = random(TWO_PI);

    this.baseSpeed = map(r, 20, 95, 0.35, 0.1);
    this.speed = this.baseSpeed;

    this.level = 2;
    this.levelVisual = 2;

    this.energy = 0.75;
    this.lastWaveFrame = frameCount;

    this.lifespanLimit = floor(map(r, 20, 95, 420, 680) + random(-40, 60));

    this.squeeze = 0;
    this.hitMemory = [];

    this.lights = [];
    let count = floor(map(r, 20, 95, 5, 11));

    for (let i = 0; i < count; i++) {
      this.lights.push({
        a: random(TWO_PI),
        d: random(0.12, 0.58),
        lightSize: random(0.05, 0.1),
        phase: random(TWO_PI),
        huePick: random()
      });
    }

    this.aura = new AuraTexture(r, type);
  }

  receiveWave(power = 1) {
    this.energy = min(this.energy + 0.45 * power, 3.2);
    this.lastWaveFrame = frameCount;
    this.squeeze = 0.85 * power;

    if (this.energy > 2.5) this.level = 3;
    else this.level = 2;

    if (this.level === 3 && spores.length < MAX_SPORES) {
      let add = min(4, MAX_SPORES - spores.length);

      for (let i = 0; i < add; i++) {
        spores.push(new Spore(this.x, this.y, true, this.r));
      }
    }
  }

  update() {
    let decayRate = map(this.r, 20, 95, 0.0012, 0.0007);
    this.energy -= decayRate;
    this.energy = constrain(this.energy, 0, 3.2);

    if (
      frameCount - this.lastWaveFrame > this.lifespanLimit ||
      this.energy < 0.14
    ) {
      this.level = 1;
    } else if (this.energy > 1.5) {
      this.level = 3;
    } else {
      this.level = 2;
    }

    this.levelVisual += (this.level - this.levelVisual) * 0.045;

    let speedFactor;

    if (this.level === 1) speedFactor = 0.05;
    else if (this.level === 2) speedFactor = 1.0;
    else speedFactor = 2.2;

    this.speed += (this.baseSpeed * speedFactor - this.speed) * 0.045;

    let n = noise(this.seed, frameCount * 0.003);
    let turnAmount = map(this.levelVisual, 1, 3, 0.003, 0.05);
    this.angle += map(n, 0, 1, -turnAmount, turnAmount);

    let autoX = cos(this.angle) * this.speed;
    let autoY = sin(this.angle) * this.speed;

    if (this.level === 2) {
      let d = dist(this.x, this.y, mouseX, mouseY);

      if (d > this.r * 1.8) {
        let followAngle = atan2(mouseY - this.y, mouseX - this.x);
        let followPower = map(d, 0, width, 0.005, 0.035);
        followPower = constrain(followPower, 0.004, 0.028);

        autoX += cos(followAngle) * followPower;
        autoY += sin(followAngle) * followPower;
      }
    }

    this.x += autoX + this.vx;
    this.y += autoY + this.vy;

    this.vx *= 0.88;
    this.vy *= 0.88;

    if (this.x < 80) {
      this.angle = 0;
      this.vx *= -0.5;
    }

    if (this.x > width - 80) {
      this.angle = PI;
      this.vx *= -0.5;
    }

    if (this.y < 80) {
      this.angle = HALF_PI;
      this.vy *= -0.5;
    }

    if (this.y > height - 80) {
      this.angle = -HALF_PI;
      this.vy *= -0.5;
    }

    this.x = constrain(this.x, 70, width - 70);
    this.y = constrain(this.y, 70, height - 70);

    this.squeeze *= 0.86;

    if (
      this.level === 3 &&
      frameCount % 12 === 0 &&
      spores.length < MAX_SPORES
    ) {
      spores.push(new Spore(this.x, this.y, true, this.r));
    }
  }

  checkRipples(ripples) {
    for (let rp of ripples) {
      let d = dist(this.x, this.y, rp.x, rp.y);

      if (abs(d - rp.r) < rp.thickness * 0.9) {
        let key = rp.id;

        if (!this.hitMemory.includes(key)) {
          this.hitMemory.push(key);

          if (this.hitMemory.length > 10) {
            this.hitMemory.shift();
          }

          let pushAngle = atan2(this.y - rp.y, this.x - rp.x);
          let sizeWeight = map(this.r, 20, 95, 2.6, 0.75);
          let wavePower = rp.auto ? 0.28 : 1.0;
          let force = sizeWeight * wavePower * rp.life;

          this.vx += cos(pushAngle) * force;
          this.vy += sin(pushAngle) * force * 0.72;

          this.vx = constrain(this.vx, -6, 6);
          this.vy = constrain(this.vy, -5, 5);

          this.receiveWave(wavePower);
        }
      }
    }
  }

  draw() {
    push();
    translate(this.x, this.y);

    let active = map(this.levelVisual, 1, 3, 0, 1);
    let tired = map(this.levelVisual, 1, 2, 1, 0, true);

    let stateScale;

    if (this.levelVisual < 2) {
      stateScale = map(this.levelVisual, 1, 2, 0.75, 1.0);
    } else {
      stateScale = map(this.levelVisual, 2, 3, 1.0, 1.1);
    }

    rotate(
      sin(frameCount * 0.003 + this.seed) *
        map(this.levelVisual, 1, 3, 0.01, 0.09)
    );

    let breathe =
      sin(frameCount * map(this.levelVisual, 1, 3, 0.004, 0.035) + this.seed) *
      map(this.levelVisual, 1, 3, 0.003, 0.025);

    let baseScale = stateScale + breathe;

    let sx = baseScale * (1 + this.squeeze * 0.18);
    let sy = baseScale * (1 - this.squeeze * 0.2);

    scale(sx, sy);
    imageMode(CENTER);

    tint(
      lerp(255, 210, tired),
      lerp(255, 225, tired),
      lerp(255, 215, tired),
      lerp(230, 140, tired)
    );

    image(this.aura.pg, 0, 0);
    noTint();

    if (tired > 0.05) {
      this.drawDormantLayer(tired);
    }

    this.drawDynamicLights(active, tired);

    pop();
  }

  drawDormantLayer(tired) {
    blendMode(SCREEN);
    noStroke();

    for (let i = 8; i > 0; i--) {
      fill(220, 235, 210, tired * 8 * (i / 8));
      circle(0, 0, this.r * (1.35 + i * 0.07));
    }

    fill(230, 238, 215, tired * 18);
    circle(0, 0, this.r * 0.32);

    blendMode(BLEND);
  }

  drawDynamicLights(active, tired) {
    blendMode(ADD);
    noStroke();

    let lightPower = map(this.levelVisual, 1, 3, 0.45, 1.05);
    let speedMult = lerp(0.9, 1.45, active);
    let rangeExpand = lerp(1.05, 1.24, active);

    for (let i = 0; i < this.lights.length; i++) {
      let l = this.lights[i];

      let moveAmp = lerp(0.42, 0.9, active);

      let aa =
        l.a +
        sin(frameCount * 0.005 * speedMult + l.phase) * moveAmp +
        sin(frameCount * 0.0023 + this.seed + i) * 0.16;

      let dd =
        this.r *
        l.d *
        rangeExpand *
        (1 + sin(frameCount * 0.007 * speedMult + l.phase) * 0.11);

      let x = cos(aa) * dd;
      let y = sin(aa) * dd * 0.62;

      let pulseSpeed = lerp(0.014, 0.055, active);
      let pulse =
        sin(frameCount * pulseSpeed * speedMult + l.phase) * 0.5 + 0.5;

      let sz = this.r * l.lightSize * (1.1 + pulse * lerp(0.22, 0.68, active));

      let stageDim = lerp(0.5, 1.0, active);
      let alpha = (18 + pulse * 22 + active * 58) * lightPower * stageDim;

      let col = this.getLightColor(l.huePick, active, tired);

      fill(col[0], col[1], col[2], alpha * 0.13);
      ellipse(x, y, sz * 5.5, sz * 4.0);

      fill(col[0], col[1], col[2], alpha * 0.36);
      ellipse(x, y, sz * 2.45, sz * 1.75);

      fill(
        lerp(col[0], 255, 0.15),
        lerp(col[1], 255, 0.15),
        lerp(col[2], 240, 0.1),
        alpha * 0.82
      );
      ellipse(x, y, sz, sz * 0.85);
    }

    blendMode(BLEND);
  }

  getLightColor(h, active, tired) {
    if (tired > 0.45) {
      if (h < 0.4) return [120, 225, 210];
      if (h < 0.7) return [140, 210, 245];
      return [175, 235, 190];
    }

    if (active > 0.65) {
      if (h < 0.12) return [255, 60, 140];
      if (h < 0.25) return [0, 225, 255];
      if (h < 0.38) return [255, 190, 0];
      if (h < 0.5) return [255, 90, 50];
      if (h < 0.62) return [40, 255, 130];
      if (h < 0.75) return [160, 70, 255];
      if (h < 0.88) return [255, 50, 255];
      return [0, 255, 200];
    }

    if (h < 0.33) return [110, 245, 195];
    if (h < 0.66) return [130, 235, 150];
    return [95, 225, 240];
  }
}

// ═════════════════════════════════════════════════════
// 포자
// ═════════════════════════════════════════════════════

class Spore {
  constructor(x, y, active = false, parentSize = 50) {
    this.x = x;
    this.y = y;

    let a = random(TWO_PI);
    let d = random(parentSize * 0.1, parentSize * 0.9);

    this.x += cos(a) * d;
    this.y += sin(a) * d * 0.65;

    let sp = active ? random(1.1, 2.8) : random(0.5, 1.2);

    this.vx = cos(a) * sp;
    this.vy = sin(a) * sp * 0.7;

    this.life = active ? random(170, 250) : random(110, 170);
    this.maxLife = this.life;
    this.dead = false;

    let sizeMultiplier = map(parentSize, 20, 95, 0.45, 1.15);
    this.sz = (active ? random(2.0, 4.6) : random(1.4, 3.0)) * sizeMultiplier;

    this.active = active;
    this.windSeed = random(1000);
  }

  update() {
    let wind = sin(frameCount * 0.012 + this.windSeed) * 0.025;

    this.vx += wind;

    this.x += this.vx;
    this.y += this.vy;

    if (this.active) {
      this.vx *= 0.975;
      this.vy *= 0.972;
      this.life -= 2.0;
    } else {
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.life -= 3.2;
    }

    if (this.life <= 0) this.dead = true;
  }

  checkPlants(plants) {
    if (!this.active) return;

    for (let p of plants) {
      let d = dist(this.x, this.y, p.x, p.y);

      if (d < p.absorbRadius) {
        p.absorb(random(0.02, 0.045));
        this.dead = true;
        break;
      }
    }
  }

  draw() {
    let fade = map(this.life, 0, this.maxLife, 0, 1);

    blendMode(ADD);
    noStroke();

    for (let i = 5; i >= 1; i--) {
      let t = i / 5;
      let glowSize = this.sz * map(i, 1, 5, 2.0, 8.5);
      let glowAlpha = 10 * fade * t * t;

      fill(120, 245, 170, glowAlpha);
      ellipse(this.x, this.y, glowSize);
    }

    fill(210, 255, 200, 55 * fade);
    ellipse(this.x, this.y, this.sz * 1.4);

    fill(245, 255, 225, 90 * fade);
    ellipse(this.x, this.y, this.sz * 0.65);

    blendMode(BLEND);
  }
}

// ═════════════════════════════════════════════════════
// 오라 텍스처
// ═════════════════════════════════════════════════════

class AuraTexture {
  constructor(r, type) {
    this.r = r;
    this.type = type;
    this.seed = random(1000);

    this.pg = createGraphics(floor(r * 5.5), floor(r * 5.5));
    this.pg.pixelDensity(1);
    this.pg.colorMode(RGB, 255, 255, 255, 255);
    this.pg.noStroke();

    this.buildTexture();
  }

  buildTexture() {
    let pg = this.pg;
    let cx = pg.width / 2;
    let cy = pg.height / 2;
    let r = this.r;

    pg.clear();

    let palette = this.getPalette();

    for (let i = 0; i < 700; i++) {
      let a = random(TWO_PI);
      let d = pow(random(), 0.55) * r * 1.25;

      let wobble =
        noise(cos(a) * 2 + this.seed, sin(a) * 2 + this.seed) *
          (r * 0.3) -
        r * 0.15;

      let x = cx + cos(a) * (d + wobble);
      let y = cy + sin(a) * (d + wobble);

      let c = random(palette.outer);
      pg.fill(c[0], c[1], c[2], random(0.8, 3.2));
      pg.ellipse(x, y, random(r * 0.6, r * 1.8), random(r * 0.6, r * 1.8));
    }

    for (let i = 0; i < 450; i++) {
      let a = random(TWO_PI);
      let d = pow(random(), 0.9) * r * 0.85;

      let x = cx + cos(a) * d;
      let y = cy + sin(a) * d;

      let c = random(palette.mid);
      pg.fill(c[0], c[1], c[2], random(1.5, 5.5));
      pg.ellipse(x, y, random(r * 0.5, r * 1.4), random(r * 0.5, r * 1.4));
    }

    for (let i = 0; i < 140; i++) {
      let a = random(TWO_PI);
      let d = pow(random(), 1.8) * r * 0.45;

      let x = cx + cos(a) * d;
      let y = cy + sin(a) * d;

      let c = random(palette.core);
      pg.fill(c[0], c[1], c[2], random(3, 8));
      pg.ellipse(x, y, random(r * 0.35, r * 0.9), random(r * 0.35, r * 0.9));
    }

    for (let i = 0; i < 250; i++) {
      let a = random(TWO_PI);
      let d = random(r * 0.75, r * 1.05);

      let n = noise(cos(a) * 3 + this.seed, sin(a) * 3 + this.seed);
      d += map(n, 0, 1, -r * 0.2, r * 0.2);

      let x = cx + cos(a) * d;
      let y = cy + sin(a) * d;

      let c = random(palette.shell);
      pg.fill(c[0], c[1], c[2], random(1.5, 4.8));
      pg.ellipse(x, y, random(r * 0.45, r * 1.2), random(r * 0.45, r * 1.2));
    }

    if (this.type < 4) {
      this.drawFibers(pg, cx, cy, r, palette);
    }

    for (let i = 10; i > 0; i--) {
      let c = palette.core[0];
      pg.fill(c[0], c[1], c[2], i * 1.8);
      pg.circle(cx, cy, i * r * 0.055);
    }
  }

  drawFibers(pg, cx, cy, r, palette) {
    for (let i = 0; i < 70; i++) {
      let a = random(TWO_PI);
      let len = random(r * 0.28, r * 0.78);
      let start = random(r * 0.1, r * 0.28);
      let bend = random(-0.22, 0.22);

      let x1 = cx + cos(a) * start;
      let y1 = cy + sin(a) * start;

      let x2 = cx + cos(a + bend) * len;
      let y2 = cy + sin(a + bend) * len;

      let c = random(palette.fiber);

      pg.noFill();
      pg.stroke(c[0], c[1], c[2], random(12, 35));
      pg.strokeWeight(random(0.3, 0.8));

      pg.beginShape();
      pg.vertex(x1, y1);
      pg.quadraticVertex(
        cx + cos(a + bend * 0.5) * len * 0.55,
        cy + sin(a + bend * 0.5) * len * 0.55,
        x2,
        y2
      );
      pg.endShape();

      pg.noStroke();
    }
  }

  getPalette() {
    const palettes = [
      {
        outer: [[105, 155, 135], [130, 180, 155], [150, 200, 175]],
        mid: [[120, 205, 165], [150, 220, 180], [175, 235, 195]],
        core: [[220, 245, 190], [205, 240, 180]],
        shell: [[125, 185, 155], [155, 215, 185]],
        fiber: [[220, 240, 215], [175, 220, 195]]
      },
      {
        outer: [[65, 115, 88], [85, 140, 105], [105, 160, 120]],
        mid: [[95, 170, 125], [125, 190, 145]],
        core: [[205, 240, 175], [180, 230, 165]],
        shell: [[85, 145, 110], [120, 175, 135]],
        fiber: [[180, 220, 190], [140, 185, 155]]
      },
      {
        outer: [[75, 140, 130], [95, 165, 150], [120, 190, 170]],
        mid: [[115, 205, 180], [140, 220, 195]],
        core: [[205, 245, 215], [180, 240, 205]],
        shell: [[105, 175, 160], [135, 210, 190]],
        fiber: [[190, 235, 220], [150, 210, 195]]
      },
      {
        outer: [[90, 120, 88], [110, 145, 105], [130, 165, 120]],
        mid: [[120, 180, 130], [145, 205, 145]],
        core: [[215, 240, 170], [195, 230, 160]],
        shell: [[115, 160, 115], [145, 190, 140]],
        fiber: [[205, 225, 180], [180, 205, 165]]
      },
      {
        outer: [[135, 185, 170], [155, 205, 188], [175, 220, 200]],
        mid: [[165, 225, 200], [185, 235, 210]],
        core: [[235, 250, 225], [210, 245, 215]],
        shell: [[160, 215, 195], [185, 235, 215]],
        fiber: [[235, 250, 240], [205, 235, 220]]
      },
      {
        outer: [[75, 140, 130], [95, 165, 150], [115, 185, 168]],
        mid: [[110, 200, 180], [140, 220, 195]],
        core: [[195, 245, 215], [170, 235, 205]],
        shell: [[100, 175, 155], [130, 210, 185]],
        fiber: [[180, 225, 210], [145, 205, 190]]
      },
      {
        outer: [[125, 165, 110], [145, 185, 125], [165, 205, 140]],
        mid: [[170, 220, 150], [190, 235, 160]],
        core: [[235, 250, 175], [220, 245, 165]],
        shell: [[155, 200, 135], [180, 220, 155]],
        fiber: [[230, 245, 190], [205, 230, 175]]
      },
      {
        outer: [[140, 180, 170], [160, 200, 190], [180, 215, 205]],
        mid: [[175, 225, 210], [195, 235, 220]],
        core: [[235, 250, 235], [215, 245, 225]],
        shell: [[170, 215, 200], [195, 235, 220]],
        fiber: [[240, 250, 240], [220, 240, 230]]
      },
      {
        outer: [[80, 110, 88], [100, 135, 105], [120, 155, 118]],
        mid: [[115, 175, 125], [140, 195, 140]],
        core: [[205, 235, 170], [185, 225, 160]],
        shell: [[105, 150, 110], [140, 185, 140]],
        fiber: [[190, 220, 180], [160, 195, 160]]
      }
    ];

    return palettes[this.type % palettes.length];
  }
}

function easeOut(t) {
  return 1 - pow(1 - t, 3);
}

function randomFixed(seed, minV, maxV) {
  let n = noise(seed * 12.123, seed * 4.321);
  return map(n, 0, 1, minV, maxV);
}