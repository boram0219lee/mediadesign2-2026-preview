let imgA, imgB;
let pgA, pgB, pgImgMix, pgCreature, pgStage;
let clickGhost = null;

let t = 0;
let totalFrames = 900;
let cycleOffsetFrames = 0;

let cam;
let camW = 256;
let camH = 144;

let wake = 0;
let wakeFlash = 0;
let particleShock = 0;
let ghostAlpha = 0;
let shockRadius = 0;
let shockDensity = 0;

let clickCount = 0;
let lastClickFrame = -9999;

let grid = [];
let newGrid = [];
let gridMeta = [];
let cols, rows;

let scaleSize = 10;

let inks = [];
let creatures = [];
let dots = [];
let blobs = [];
let halftoneDots = [];

let minDist = 14;

let mixW = 640;
let mixH = 360;
let halftoneTile = 8;

let lastPhotoRenderFrame = -9999;
let photoRenderSkip = 2;

let palette = [
  [252, 248, 252],
  [247, 240, 250],
  [240, 230, 248],
  [226, 224, 248],
  [210, 230, 250],
  [190, 220, 246],
  [174, 202, 238],
  [158, 176, 222],
  [136, 144, 202],
  [116, 110, 176]
];

function preload() {
  imgA = loadImage("Untitled-2.png");
  imgB = loadImage("Untitled-1.png");
}

function setup() {
  createCanvas(1280, 720);
  pixelDensity(1);
  frameRate(30);
  noStroke();

  cam = createCapture(VIDEO);
  cam.size(camW, camH);
  cam.hide();

  pgA = createGraphics(mixW, mixH);
  pgB = createGraphics(mixW, mixH);
  pgImgMix = createGraphics(mixW, mixH);
  pgCreature = createGraphics(width, height);
  pgStage = createGraphics(width, height);

  pgA.pixelDensity(1);
  pgB.pixelDensity(1);
  pgImgMix.pixelDensity(1);
  pgCreature.pixelDensity(1);
  pgStage.pixelDensity(1);

  pgA.imageMode(CENTER);
  pgB.imageMode(CENTER);
  pgImgMix.imageMode(CENTER);
  pgCreature.imageMode(CENTER);
  pgStage.imageMode(CENTER);
  imageMode(CENTER);

  cols = ceil(width / scaleSize);
  rows = ceil(height / scaleSize);

  for (let x = 0; x < cols; x++) {
    grid[x] = [];
    newGrid[x] = [];
    gridMeta[x] = [];

    for (let y = 0; y < rows; y++) {
      grid[x][y] = 0;
      newGrid[x][y] = 0;

      let px = x * scaleSize + scaleSize * 0.5;
      let py = y * scaleSize + scaleSize * 0.5;
      let dx = px - width / 2;
      let dy = py - height / 2;
      let distValue = sqrt(dx * dx + dy * dy);

      gridMeta[x][y] = {
        px,
        py,
        distValue,
        nx: distValue > 0 ? dx / distValue : 0,
        ny: distValue > 0 ? dy / distValue : 0,
        ang: atan2(dy, dx)
      };
    }
  }

  for (let i = 0; i < 8; i++) {
    let ink = new Ink(random(cols), random(rows));
    ink.birth = i < 2 ? 0 : random(0.08, 0.42);
    inks.push(ink);
  }

  for (let i = 0; i < 13; i++) {
    let c = new Creature(random(cols), random(rows), random(1000));
    c.birth = i < 3 ? 0 : random(0.06, 0.46);
    creatures.push(c);
  }

  for (let y = -24; y < height + 24; y += 20) {
    for (let x = -24; x < width + 24; x += 20) {
      dots.push({
        x,
        y,
        n: random(1000),
        born: random(0.32, 0.48)
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    blobs.push({
      phase: random(TWO_PI),
      speed: random(0.18, 0.34),
      orbit: random(0.78, 1.2),
      seed: random(1000),
      born: random(0.34, 0.48)
    });
  }

  buildHalftoneDots();
}

function draw() {
  t += 0.012;

  if (frameCount % 4 === 0) {
    cam.loadPixels();
  }

  wake *= 0.82;
  wakeFlash *= 0.76;
  particleShock *= 0.84;
  ghostAlpha *= 0.962;
  shockRadius *= 0.9;
  shockDensity *= 0.92;

  let q = ((frameCount + cycleOffsetFrames) % totalFrames) / totalFrames;
  if (q < 0) q += 1;

  let rawCycle = q < 0.5 ? q * 2.0 : (1.0 - q) * 2.0;
  let cycle = smootherstep(0, 1, rawCycle);

  let cellGrow = smootherstep(0.0, 0.34, rawCycle);
  let cellAmount = 1.0 - smootherstep(0.52, 0.76, rawCycle);

  let ringAmount =
    smootherstep(0.24, 0.44, rawCycle) *
    (1.0 - smootherstep(0.58, 0.82, rawCycle));

  let creatureFlowAmount =
    smootherstep(0.28, 0.46, rawCycle) *
    (1.0 - smootherstep(0.6, 0.84, rawCycle));

  let imageAmount = smootherstep(0.62, 0.76, rawCycle);
  let imageMix = smootherstep(0.68, 0.82, rawCycle);

  let camVisibility =
    0.035 +
    (1.0 - smootherstep(0.16, 0.76, rawCycle)) * 0.86 +
    creatureFlowAmount * 0.08 -
    imageAmount * 0.3;

  camVisibility = constrain(camVisibility, 0.018, 0.94);

  let blink = pow(sin(t * 1.05) * 0.5 + 0.5, 3.0);

  background(252, 248, 252);

  drawWebcamBase(camVisibility, creatureFlowAmount, imageAmount);

  updateGridDream(cellAmount * max(0.08, cellGrow), creatureFlowAmount, rawCycle);

  drawGridDream(cellAmount, ringAmount, creatureFlowAmount, imageAmount, rawCycle, blink);
  drawCreatureFlowStage(creatureFlowAmount, imageAmount, rawCycle, blink);
  drawImageAsHalftoneStage(imageAmount, imageMix, rawCycle, blink);

  drawWebcamOverlay(camVisibility, creatureFlowAmount, imageAmount);

  drawColorVeil(blink);
  drawClickGhost();
  drawWakeInteraction();
  drawUnifiedTexture(imageAmount);
}

function buildHalftoneDots() {
  halftoneDots = [];

  for (let y = -halftoneTile * 2; y < height + halftoneTile * 2; y += halftoneTile) {
    for (let x = -halftoneTile * 2; x < width + halftoneTile * 2; x += halftoneTile) {
      let cx = x - width / 2;
      let cy = y - height / 2;

      halftoneDots.push({
        x,
        y,
        cx,
        cy,
        d: sqrt(cx * cx + cy * cy),
        a: atan2(cy, cx)
      });
    }
  }
}

class Ink {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.strength = random(0.34, 0.72);
    this.seed = random(1000);
    this.birth = random(0.08, 0.42);
    this.life = floor(random(900, 1500));
    this.dead = false;
  }

  move(d) {
    this.life--;

    if (this.life <= 0 || this.strength < 0.04) {
      this.dead = true;
      return;
    }

    let n = noise(this.x * 0.014, this.y * 0.014, t * 0.1 + this.seed);
    let angle = n * TWO_PI * lerp(0.12, 2.2, d);
    let speed = lerp(0.0001, 0.17, d);

    this.x += cos(angle) * speed;
    this.y += sin(angle) * speed;

    if (this.x < -80) this.x = cols + 80;
    if (this.x > cols + 80) this.x = -80;
    if (this.y < -80) this.y = rows + 80;
    if (this.y > rows + 80) this.y = -80;
  }

  spread(d, cycle) {
    if (this.dead) return;

    let birth = smootherstep(this.birth, this.birth + 0.16, cycle);
    let gx = floor(this.x);
    let gy = floor(this.y);

    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
      grid[gx][gy] += this.strength * birth * lerp(0.48, 1.08, d);
    }
  }
}

class Creature {
  constructor(x, y, seed) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.02, 0.02);
    this.vy = random(-0.02, 0.02);
    this.seed = seed;
    this.size = random(7, 17);
    this.strength = random(0.42, 0.96);
    this.phase = random(TWO_PI);
    this.birth = random(0.06, 0.46);
  }

  update(d) {
    let thresholdEnergy = sin(d * PI);
    let n = noise(this.x * 0.012, this.y * 0.012, t * 0.1 + this.seed);
    let angle = n * TWO_PI * lerp(0.2, 2.8, d);
    let speed = lerp(0.0001, 0.17, d) + thresholdEnergy * 0.12 + wake * 0.05;

    this.vx += cos(angle) * 0.007 * speed;
    this.vy += sin(angle) * 0.007 * speed;

    let maxSpeed = lerp(0.01, 0.42, d) + thresholdEnergy * 0.2 + wake * 0.16;
    let sp = sqrt(this.vx * this.vx + this.vy * this.vy);

    if (sp > maxSpeed) {
      this.vx = (this.vx / sp) * maxSpeed;
      this.vy = (this.vy / sp) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.997;
    this.vy *= 0.997;

    if (this.x < -50) this.x = cols + 50;
    if (this.x > cols + 50) this.x = -50;
    if (this.y < -50) this.y = rows + 50;
    if (this.y > rows + 50) this.y = -50;
  }

  spread(d, cycle) {
    let birth = smootherstep(this.birth, this.birth + 0.18, cycle);
    let pop = birth * (0.06 + 0.94 * (sin(t * 0.3 + this.phase) * 0.5 + 0.5));
    let radius = this.size * lerp(0.58, 1.48, d) * pop * (1 + particleShock * 0.1);
    let wobble = lerp(0.06, 0.5, d);

    for (let a = 0; a < TWO_PI; a += 0.84) {
      let n = noise(cos(a) + this.seed, sin(a) + this.seed, frameCount * 0.001);
      let r = radius + n * radius * wobble;
      let gx = floor(this.x + cos(a) * r);
      let gy = floor(this.y + sin(a) * r * lerp(0.58, 0.95, d));

      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        grid[gx][gy] += this.strength * birth * lerp(0.22, 0.82, d);
      }
    }

    let cx = floor(this.x);
    let cy = floor(this.y);

    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      grid[cx][cy] += this.strength * birth * lerp(0.38, 1.0, d);
    }
  }
}

function updateGridDream(cellAmount, creatureFlowAmount, cycle) {
  let d = constrain(cellAmount * 0.9 + creatureFlowAmount * 0.65 + cycle * 0.12, 0, 1);

  if (frameCount % 8 === 0) {
    if (inks.length > 1) repelInks(d);
    if (creatures.length > 1) repelCreatures(d);
  }

  for (let i = inks.length - 1; i >= 0; i--) {
    let ink = inks[i];
    ink.move(d);

    if (ink.dead) {
      inks.splice(i, 1);
    } else {
      ink.spread(d, cycle);
    }
  }

  for (let i = 0; i < creatures.length; i++) {
    let c = creatures[i];
    c.update(d);
    c.spread(d, cycle);
  }

  diffuse(d);

  let spawnRate = floor(lerp(100, 40, d));

  if (frameCount % spawnRate === 0 && inks.length < 24 && cycle < 0.5) {
    let ink = new Ink(random(cols), random(rows));
    ink.birth = min(0.5, cycle + random(0.02, 0.1));
    inks.push(ink);
  }
}

function repelInks(d) {
  let distanceValue = lerp(minDist, minDist * 0.65, d);
  let distanceSq = distanceValue * distanceValue;

  for (let i = 0; i < inks.length; i++) {
    let a = inks[i];
    if (a.dead) continue;

    for (let j = i + 1; j < inks.length; j++) {
      let b = inks[j];
      if (b.dead) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;

      if (distSq > 0 && distSq < distanceSq) {
        let distValue = sqrt(distSq);
        let overlap = distanceValue - distValue;
        let nx = dx / distValue;
        let ny = dy / distValue;
        let push = overlap * 0.08;

        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function repelCreatures(d) {
  let distanceValue = lerp(12, 7, d);
  let distanceSq = distanceValue * distanceValue;

  for (let i = 0; i < creatures.length; i++) {
    let a = creatures[i];

    for (let j = i + 1; j < creatures.length; j++) {
      let b = creatures[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;

      if (distSq > 0 && distSq < distanceSq) {
        let distValue = sqrt(distSq);
        let overlap = distanceValue - distValue;
        let nx = dx / distValue;
        let ny = dy / distValue;
        let push = overlap * 0.05;

        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function diffuse(d) {
  let centerWeight = lerp(0.6, 0.5, d);
  let neighborWeight = (1.0 - centerWeight) / 4.0;
  let decay = lerp(0.976, 0.964, d);

  for (let x = 0; x < cols; x++) {
    let gridX = grid[x];
    let newGridX = newGrid[x];
    let left = x > 0 ? grid[x - 1] : null;
    let right = x < cols - 1 ? grid[x + 1] : null;

    for (let y = 0; y < rows; y++) {
      let sum = gridX[y] * centerWeight;

      if (left) sum += left[y] * neighborWeight;
      if (right) sum += right[y] * neighborWeight;
      if (y > 0) sum += gridX[y - 1] * neighborWeight;
      if (y < rows - 1) sum += gridX[y + 1] * neighborWeight;

      newGridX[y] = sum * decay;
    }
  }

  let temp = grid;
  grid = newGrid;
  newGrid = temp;
}

function drawGridDream(cellAmount, ringAmount, creatureFlowAmount, imageAmount, cycle, blink) {
  let amount = constrain(cellAmount + creatureFlowAmount * 0.5 + ringAmount * 0.22, 0, 1);
  if (amount < 0.01) return;

  let d = smootherstep(0, 1, constrain(cycle * 1.2, 0, 1));
  let thresholdEnergy = sin(d * PI);
  let lowSat = 1.0 - smootherstep(0.0, 0.5, cycle) * 0.62;
  let flowTime = t * (0.12 + d * 0.48);
  let fadeIntoImage = 1.0 - smootherstep(0.34, 0.92, imageAmount);

  if (fadeIntoImage <= 0.001) return;

  for (let x = 0; x < cols; x++) {
    let gridX = grid[x];
    let metaX = gridMeta[x];

    for (let y = 0; y < rows; y++) {
      let v = gridX[y];
      let meta = metaX[y];

      let px = meta.px;
      let py = meta.py;
      let distC = meta.distValue;
      let ang = meta.ang;

      let ringPhase =
        distC * 0.018 -
        flowTime * 0.2 +
        sin(ang * 2.2 + flowTime * 0.16) * 0.22 +
        noise(x * 0.01, y * 0.01, t * 0.06) * 0.8;

      let ring = sin(ringPhase) * ringAmount * (0.08 + 0.08 * sin(t * 0.12 + distC * 0.003));

      let wave =
        sin(
          distC * lerp(0.008, 0.02, d) -
          flowTime * lerp(0.08, 0.32, d) +
          noise(x * 0.012, y * 0.012, t * 0.06) * 0.4
        ) * thresholdEnergy;

      let n = noise(x * 0.026 + sin(t * 0.1) * 0.16, y * 0.026 + cos(t * 0.09) * 0.16, t * 0.16);

      let value = v * 1.95 + wave * lerp(0.0, 0.12, d) + ring * 0.08 + n * lerp(0.02, 0.1, d);
      value = constrain(value, 0, 2.0);

      let alpha = smootherstep(0.012, 0.42, value) * amount * fadeIntoImage * (0.8 + blink * 0.14);

      if (alpha < 0.01) continue;

      let colorIndex = floor(constrain(value * 4, 0, palette.length - 1));
      let colorA = palette[colorIndex];
      let colorB = palette[min(palette.length - 1, colorIndex + 1)];
      let mixV = fractionPart(value * 4);

      let r = lerp(colorA[0], colorB[0], mixV);
      let g = lerp(colorA[1], colorB[1], mixV);
      let b = lerp(colorA[2], colorB[2], mixV);

      let gray = (r + g + b) / 3;

      r = lerp(r, gray + 16, lowSat * 0.34);
      g = lerp(g, gray + 16, lowSat * 0.34);
      b = lerp(b, gray + 20, lowSat * 0.34);

      r = lerp(r, 255, 0.1);
      g = lerp(g, 255, 0.1);
      b = lerp(b, 255, 0.1);

      let shockWave = sin(distC * 0.04 - frameCount * 0.26) * shockRadius * 1.4;
      let shockSpread = shockRadius * smootherstep(0, 1, 1.0 - abs(distC - shockRadius * 520) / 520);

      let drawX =
        sin(py * 0.01 + t * 0.44) * ringAmount * 0.5 +
        sin((x * 31.7 + y * 11.3) + t * 0.2) * creatureFlowAmount * 0.72 +
        meta.nx * shockSpread * 3.4;

      let drawY =
        cos(px * 0.012 - t * 0.42) * ringAmount * 0.46 +
        cos((x * 17.9 + y * 23.1) + t * 0.18) * creatureFlowAmount * 0.64 +
        meta.ny * shockSpread * 3.4;

      let size =
        scaleSize * lerp(0.78, 1.48, d) +
        thresholdEnergy * wave * 0.22 +
        ringAmount * (0.1 + sin(t * 0.16 + distC * 0.005) * 0.06) +
        particleShock * 0.6 +
        shockWave;

      size = max(1.8, size);

      fill(r, g, b, alpha * (210 + shockDensity * 60));
      ellipse(px + drawX, py + drawY, size * 1.08, size);
    }
  }
}

function drawCreatureFlowStage(amount, imageAmount, cycle, blink) {
  pgCreature.clear();
  pgCreature.noStroke();

  let imageBridge =
    imageAmount *
    (1.0 - smootherstep(0.72, 1.0, imageAmount)) *
    0.68;

  let presence =
    amount * (1.0 - smootherstep(0.58, 1.0, imageAmount)) +
    imageBridge;

  if (presence < 0.01) return;

  updateBlobs(presence);

  let activeBlobs = [];

  for (let i = 0; i < blobs.length; i++) {
    let b = blobs[i];
    let blobBorn = smootherstep(b.born, b.born + 0.14, cycle);

    if (blobBorn > 0.001) {
      activeBlobs.push({
        x: b.x,
        y: b.y,
        r2: b.r * b.r,
        born: blobBorn
      });
    }
  }

  if (activeBlobs.length === 0) return;

  let lowSat = 1.0 - smootherstep(0.1, 0.58, cycle) * 0.46;
  let transitionPull = imageBridge * 18;
  let alphaBase = (138 + shockDensity * 42) * (0.8 + blink * 0.1);

  for (let i = 0; i < dots.length; i++) {
    let p = dots[i];

    let x = p.x;
    let y = p.y;
    let born = smootherstep(p.born, p.born + 0.16, cycle);
    if (born <= 0.001) continue;

    let flowX =
      sin(y * 0.0045 + t * 0.76) * (12 + transitionPull) +
      sin((x + y) * 0.0026 + t * 0.78) * 8;

    let flowY =
      cos(x * 0.004 - t * 0.72) * (11 + transitionPull * 0.8) +
      sin((x - y) * 0.0034 - t * 0.74) * 8;

    let wx = x + flowX * presence;
    let wy = y + flowY * presence;

    let field = 0;

    for (let j = 0; j < activeBlobs.length; j++) {
      let b = activeBlobs[j];
      let dx = wx - b.x;
      let dy = wy - b.y;
      let d2 = dx * dx + dy * dy;

      field += (b.r2 / (d2 + 2200)) * b.born;
    }

    field += sin(wx * 0.008 + wy * 0.003 + t * 0.72) * 0.26;
    field += cos(wy * 0.009 - wx * 0.0026 - t * 0.68) * 0.22;
    field += sin((wx + wy) * 0.005 + t * 0.74) * 0.16;

    let v = field * 1.34;
    let visible = smootherstep(0.16, 0.9, v) * presence * born;

    if (visible < 0.018) continue;

    let colorIndex = floor(abs(v)) % palette.length;
    let nextIndex = (colorIndex + 1) % palette.length;
    let mixValue = smootherstep(0, 1, fractionPart(abs(v)));

    let c1 = palette[colorIndex];
    let c2 = palette[nextIndex];

    let rr = lerp(c1[0], c2[0], mixValue);
    let gg = lerp(c1[1], c2[1], mixValue);
    let bb = lerp(c1[2], c2[2], mixValue);

    let gray = (rr + gg + bb) / 3;

    rr = lerp(rr, gray + 12, lowSat * 0.32);
    gg = lerp(gg, gray + 12, lowSat * 0.32);
    bb = lerp(bb, gray + 16, lowSat * 0.32);

    rr = lerp(rr, 255, 0.12);
    gg = lerp(gg, 255, 0.12);
    bb = lerp(bb, 255, 0.12);

    let pulse = sin(p.n + t * 0.38) * 0.5 + 0.5;
    let s = 5.0 * lerp(0.65, 1.34, visible) * (1 + pulse * 0.08 + particleShock * 0.1 + shockRadius * 0.1);

    pgCreature.fill(rr, gg, bb, visible * alphaBase);
    pgCreature.ellipse(x, y, s * 1.08, s);
  }

  image(pgCreature, width / 2, height / 2);
}

function updateBlobs(amount) {
  let cx = width / 2;
  let cy = height / 2;

  for (let i = 0; i < blobs.length; i++) {
    let b = blobs[i];
    let dreamPulse = sin(t * 0.18 + i) * 0.5 + 0.5;

    let a =
      t * (0.16 + dreamPulse * 0.08 + wake * 0.04) * b.speed +
      b.phase +
      sin(t * 0.24 + i) * 0.28;

    let rx = width * (0.48 + 0.05 * sin(t * 0.16 + i));
    let ry = height * (0.52 + 0.06 * cos(t * 0.18 + i));

    b.x = cx + cos(a * b.orbit) * rx + sin(t * 0.22 + i * 2.1) * width * 0.08;
    b.y = cy + sin(a * 0.9) * ry + cos(t * 0.2 + i * 1.7) * height * 0.1;
    b.r = lerp(82, 108, amount) + sin(t * 0.42 + b.phase) * 10 + sin(t * 0.3 + i) * 7 + particleShock * 5;
  }
}

function drawImageAsHalftoneStage(amount, imageMix, cycle, blink) {
  if (amount < 0.01) return;

  let slowMix = smootherstep(0.0, 1.0, amount);
  let imageFade = smootherstep(0.0, 1.0, amount);

  let transitionMix =
    smootherstep(0.0, 0.62, amount) *
    (1.0 - smootherstep(0.72, 1.0, amount));

  let creatureFade =
    0.42 * (1.0 - smootherstep(0.76, 1.0, amount)) +
    transitionMix * 0.92;

  let shouldRenderPhoto =
    frameCount - lastPhotoRenderFrame >= photoRenderSkip ||
    transitionMix > 0.18 ||
    particleShock > 0.08 ||
    amount < 0.18 ||
    amount > 0.96;

  if (shouldRenderPhoto) {
    lastPhotoRenderFrame = frameCount;

    let breath =
      1.18 +
      sin(t * 3.2) * 0.16 +
      sin(t * 1.6 + 1.2) * 0.08 +
      sin(t * 5.2 + 3.0) * 0.03;

    let breathB = breath + imageMix * 0.03;

    renderImage(pgA, imgA, breath);
    renderImage(pgB, imgB, breathB);

    pgImgMix.clear();
    pgImgMix.imageMode(CENTER);

    pgImgMix.tint(255, 255 * (1.0 - imageMix * 0.78));
    pgImgMix.image(pgA, mixW / 2, mixH / 2);
    pgImgMix.noTint();

    pgImgMix.tint(255, 255 * imageMix);
    pgImgMix.image(pgB, mixW / 2, mixH / 2);
    pgImgMix.noTint();

    pgImgMix.loadPixels();

    pgStage.clear();
    pgStage.noStroke();

    let wScale = (mixW - 1) / (width - 1);
    let hScale = (mixH - 1) / (height - 1);
    let imageStrength = imageFade * 0.9;
    let transitionAlphaSize = 0.9 + blink * 0.04 + transitionMix * 0.14;

    for (let i = 0; i < halftoneDots.length; i++) {
      let p = halftoneDots[i];

      let x = p.x;
      let y = p.y;

      let cx = p.cx;
      let cy = p.cy;
      let d = p.d;
      let a = p.a;

      let dissolveField =
        noise(x * 0.004, y * 0.004, t * 0.1) * 0.18 +
        noise(x * 0.012, y * 0.012, t * 0.18) * 0.1 +
        sin(d * 0.01 - t * 0.5) * 0.04;

      let reveal = smootherstep(0.0, 1.0, slowMix + dissolveField * 0.14);

      if (reveal < 0.015) continue;

      let living =
        sin(d * 0.028 - t * 5.4) * 10.2 +
        sin(a * 8.5 + t * 4.0) * 8.0 +
        sin((cx - cy) * 0.015 + t * 3.5) * 5.2 +
        noise(x * 0.007, y * 0.007, t * 0.9) * 10.4 -
        5.2;

      let swirl =
        a +
        sin(d * 0.016 - t * 2.8) * 0.2 +
        sin(t * 1.3) * 0.16;

      let transitionWarp =
        transitionMix *
        (
          sin(d * 0.016 - t * 1.55) * 22 +
          sin(a * 6.0 + t * 0.9) * 14 +
          sin((x + y) * 0.004 + t * 0.7) * 9
        );

      let sx = floor(
        constrain(
          x +
            cos(swirl) * living * imageStrength +
            cos(swirl + HALF_PI) * transitionWarp,
          0,
          width - 1
        )
      );

      let sy = floor(
        constrain(
          y +
            sin(swirl) * living * imageStrength * 0.76 +
            sin(swirl + HALF_PI) * transitionWarp * 0.76,
          0,
          height - 1
        )
      );

      let mx = floor(sx * wScale);
      let my = floor(sy * hScale);
      let idx = (my * mixW + mx) * 4;

      let r = pgImgMix.pixels[idx];
      let g = pgImgMix.pixels[idx + 1];
      let b = pgImgMix.pixels[idx + 2];

      let br = (r + g + b) / 3;

      let darkness = 1.0 - br / 255;
      darkness = constrain((darkness - 0.34) * 1.55 + 0.4, 0.0, 1.0);
      darkness = pow(darkness, 0.9);

      let mx2 = min(mixW - 1, mx + 3);
      let my2 = min(mixH - 1, my + 3);

      let idxX = (my * mixW + mx2) * 4;
      let idxY = (my2 * mixW + mx) * 4;

      let brX =
        (pgImgMix.pixels[idxX] +
          pgImgMix.pixels[idxX + 1] +
          pgImgMix.pixels[idxX + 2]) / 3;

      let brY =
        (pgImgMix.pixels[idxY] +
          pgImgMix.pixels[idxY + 1] +
          pgImgMix.pixels[idxY + 2]) / 3;

      let detail =
        abs(br - brX) * 0.0046 +
        abs(br - brY) * 0.0042;

      detail = constrain(detail, 0, 0.58);

      let pIndex = floor(constrain(darkness * (palette.length - 1), 0, palette.length - 1));
      let c1 = palette[pIndex];
      let c2 = palette[min(palette.length - 1, pIndex + 1)];
      let m = fractionPart(darkness * (palette.length - 1));

      let rr = lerp(c1[0], c2[0], m);
      let gg = lerp(c1[1], c2[1], m);
      let bb = lerp(c1[2], c2[2], m);

      let tintMix = 0.5 + noise(x * 0.018, y * 0.018, t * 0.24) * 0.1;

      rr = lerp(r, rr, tintMix);
      gg = lerp(g, gg, tintMix);
      bb = lerp(b, bb, tintMix);

      rr = lerp(rr, 255, 0.09);
      gg = lerp(gg, 255, 0.09);
      bb = lerp(bb, 255, 0.09);

      rr = constrain((rr - 128) * 1.18 + 128, 0, 255);
      gg = constrain((gg - 128) * 1.18 + 128, 0, 255);
      bb = constrain((bb - 128) * 1.18 + 128, 0, 255);

      let deep = smootherstep(0.45, 0.95, darkness);
      rr = lerp(rr, palette[9][0], deep * 0.14);
      gg = lerp(gg, palette[9][1], deep * 0.14);
      bb = lerp(bb, palette[9][2], deep * 0.14);

      let grain = noise(x * 0.09, y * 0.09, t * 0.42);

      let shockCell =
        shockRadius *
        sin(d * 0.045 - frameCount * 0.3) *
        0.2;

      let dotSize =
        halftoneTile *
        (0.12 + darkness * 1.22 + detail * 0.48 + grain * 0.1 + shockCell) *
        transitionAlphaSize;

      dotSize = max(1.15, dotSize);

      let aValue =
        imageFade *
          reveal *
          lerp(170, 245, darkness + detail) +
        shockDensity * 10;

      pgStage.fill(rr, gg, bb, aValue);
      pgStage.ellipse(x, y, dotSize * 1.02, dotSize);
    }
  }

  if (creatureFade > 0.01) {
    blendMode(SCREEN);
    tint(255, creatureFade * 145);
    image(
      pgCreature,
      width / 2 + sin(t * 0.28) * 18 * transitionMix,
      height / 2 + cos(t * 0.23) * 12 * transitionMix,
      width * (1.0 + transitionMix * 0.055),
      height * (1.0 + transitionMix * 0.055)
    );
    noTint();
    blendMode(BLEND);
  }

  tint(255, imageFade * 255);
  image(pgStage, width / 2, height / 2);
  noTint();

  if (transitionMix > 0.01) {
    blendMode(MULTIPLY);
    tint(255, transitionMix * 48);
    image(
      pgCreature,
      width / 2 - sin(t * 0.32) * 10,
      height / 2 + cos(t * 0.27) * 7,
      width * 1.025,
      height * 1.025
    );
    noTint();
    blendMode(BLEND);
  }
}

function renderImage(pg, img, scaleAmount) {
  pg.clear();
  pg.imageMode(CENTER);
  pg.push();
  pg.translate(pg.width / 2, pg.height / 2);

  let canvasRatio = pg.width / pg.height;
  let imgRatio = img.width / img.height;

  let drawW, drawH;

  if (imgRatio > canvasRatio) {
    drawH = pg.height * scaleAmount;
    drawW = drawH * imgRatio;
  } else {
    drawW = pg.width * scaleAmount;
    drawH = drawW / imgRatio;
  }

  drawW *= 1.36;
  drawH *= 1.36;

  pg.image(img, 0, 0, drawW, drawH);
  pg.pop();
}

function drawWebcamBase(camVisibility, creatureFlowAmount, imageAmount) {
  if (!cam.pixels.length) return;

  let baseAlpha = constrain(camVisibility * 134 + creatureFlowAmount * 14 - imageAmount * 84 + wake * 42, 4, 185);

  push();
  translate(width, 0);
  scale(-1, 1);
  tint(255, baseAlpha);
  image(cam, width / 2, height / 2, width * 1.04, height * 1.04);
  noTint();
  pop();
}

function drawWebcamOverlay(camVisibility, creatureFlowAmount, imageAmount) {
  if (!cam.pixels.length) return;

  let overlayAlpha = constrain(creatureFlowAmount * 10 + camVisibility * 6 - imageAmount * 34, 0, 26);

  if (overlayAlpha > 1) {
    push();
    translate(width, 0);
    scale(-1, 1);

    blendMode(SCREEN);
    tint(255, overlayAlpha);
    image(cam, width / 2, height / 2, width * 1.04, height * 1.04);
    noTint();
    blendMode(BLEND);

    pop();
  }

  blendMode(SCREEN);
  fill(246, 236, 248, camVisibility * 7 + imageAmount * 18);
  rect(0, 0, width, height);
  blendMode(BLEND);
}

function drawClickGhost() {
  if (!clickGhost || ghostAlpha < 0.01) return;

  blendMode(BLEND);
  tint(235, 235, 240, ghostAlpha * 92);
  image(clickGhost, width / 2, height / 2, width, height);
  noTint();

  blendMode(SCREEN);
  fill(250, 246, 252, ghostAlpha * 28);
  rect(0, 0, width, height);

  blendMode(MULTIPLY);
  fill(188, 184, 202, ghostAlpha * 8);
  rect(0, 0, width, height);

  blendMode(BLEND);
}

function drawWakeInteraction() {
  if (wakeFlash < 0.01) return;

  blendMode(SCREEN);
  fill(255, 250, 254, wakeFlash * 20);
  rect(0, 0, width, height);

  for (let i = 0; i < 4; i++) {
    let x = random(width);
    let y = random(height);
    let s = random(8, 18) * wakeFlash;

    fill(238, 232, 252, random(4, 8) * wakeFlash);
    ellipse(x, y, s * 1.35, s * 0.62);
  }

  blendMode(BLEND);
}

function drawUnifiedTexture(imageAmount) {
  blendMode(MULTIPLY);

  let aBase = lerp(0.2, 0.48, imageAmount);

  for (let i = 0; i < 8; i++) {
    let x = random(width);
    let y = random(height);
    let a = random(0.1, aBase);

    if (random() < 0.45) {
      fill(130, 116, 158, a);
    } else {
      fill(162, 184, 218, a * 0.18);
    }

    rect(floor(x), floor(y), 1, 1);
  }

  blendMode(SCREEN);

  for (let y = 0; y < height; y += 36) {
    let a = 0.24 + imageAmount * 0.44 + sin(y * 0.04 + t * 1.8) * 0.16;

    fill(255, 250, 255, a);
    rect(0, y, width, 1);
  }

  blendMode(BLEND);
}

function drawColorVeil(blink) {
  blendMode(SCREEN);

  fill(252, 238, 248, 10);
  rect(0, 0, width, height);

  fill(218, 238, 252, 6 + blink * 2.5);
  rect(0, 0, width, height);

  fill(236, 228, 252, 3.5);
  rect(0, 0, width, height);

  blendMode(BLEND);
}

function mousePressed() {
  clickGhost = get(0, 0, width, height);
  ghostAlpha = 1.0;

  if (frameCount - lastClickFrame < 24) {
    clickCount++;
  } else {
    clickCount = 1;
  }

  lastClickFrame = frameCount;

  wake = 1.0;
  wakeFlash = 1.0;
  particleShock = 1.0;
  shockRadius = 1.0;
  shockDensity = 1.0;

  let q = ((frameCount + cycleOffsetFrames) % totalFrames) / totalFrames;
  if (q < 0) q += 1;

  let rawCycle = q < 0.5 ? q * 2.0 : (1.0 - q) * 2.0;
  let currentImgAmount = smootherstep(0.62, 0.76, rawCycle);

  if (currentImgAmount > 0.5) {
    if (clickCount >= 4) {
      cycleOffsetFrames = -frameCount;
      clickCount = 0;
    }
  } else {
    let goingForward = q < 0.5;

    if (clickCount === 1) {
      if (goingForward) cycleOffsetFrames -= 32;
      else cycleOffsetFrames += 32;
    }

    if (clickCount === 2) {
      if (goingForward) cycleOffsetFrames -= 96;
      else cycleOffsetFrames += 96;
    }

    if (clickCount === 3) {
      cycleOffsetFrames = -frameCount;
      clickCount = 0;
    }
  }
}

function fractionPart(x) {
  return x - floor(x);
}

function smoothstep(edge0, edge1, x) {
  x = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function smootherstep(edge0, edge1, x) {
  x = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}