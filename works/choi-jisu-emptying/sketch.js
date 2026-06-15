let thoughts = [];
let lights = [];
let smokeParticles = [];

const MAX_THOUGHTS = 58;

// 초기 화면: 색상별 8개씩, 총 24개
const INITIAL_THOUGHT_COUNT = 18;
const INITIAL_COUNT_PER_TYPE = 6;

const MAX_SMOKE_PARTICLES = 220;

const LIGHT_COLOR = "#F4F06D";

const PALETTE_LIGHT = "#ECE7EB";
const PALETTE_PINK = "#DCC7D0";
const PALETTE_SLATE = "#7F8FAE";

const LINE_COLOR = "#58647F";
const LINE_WEIGHT = 0.65;

// 색상별 처음 겹 수
const TYPE_LAYERS = [1, 4, 8];

// 색상별 기본 크기
// 베이지 < 핑크 < 남색
const TYPE_BASE_SCALE = [0.72, 0.9, 1.08];

// 같은 색끼리 합쳐졌을 때 가능한 최대 크기
// 베이지가 아무리 합쳐져도 남색보다 지나치게 커지지 않도록 제한
const TYPE_MAX_SCALE = [1.15, 1.55, 2.3];

const TIME_SPEED = 0.0024;

const BG_TIME_MIN = 0.14;
const BG_TIME_MAX = 0.92;
const BG_GRADIENT_SPAN = 0.2;

let timeValue = 0;
let timeDirection = 1;

let autoLightSpawnedThisDay = false;
let lastSmallSpawnFrame = 0;
let lastRepopulateFrame = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  rectMode(CENTER);
  ellipseMode(CENTER);
  angleMode(RADIANS);

  noStroke();

  addInitialThoughtSet();
}

function draw() {
  updateTime();
  drawBackground();

  handleAutoLightSpawn();
  handleNightRepopulation();
  handleSmallThoughtSpawn();

  updateThoughts();
  handleThoughtCollisions();
  updateLights();
  updateSmokeParticles();

  drawThoughts();
  drawLights();
  drawSmokeParticles();

  drawMouseCreature();
}

// ----------------------------------------------------
// 시간대 변화
// ----------------------------------------------------
function updateTime() {
  const phase = frameCount * TIME_SPEED;

  timeValue = map(
    sin(phase),
    -1,
    1,
    0,
    1
  );

  timeDirection =
    cos(phase) >= 0 ? 1 : -1;
}

function smoothstep(edge0, edge1, x) {
  const t = constrain(
    (x - edge0) / (edge1 - edge0),
    0,
    1
  );

  return t * t * (3 - 2 * t);
}

// ----------------------------------------------------
// 배경색
// ----------------------------------------------------
function getBgColorAt(t) {
  t = constrain(t, 0, 1);

  const cDeepNight = color(30, 28, 39);
  const cNightMauve = color(66, 55, 70);
  const cDarkMauve = color(102, 85, 99);
  const cMutedMauve = color(164, 148, 156);
  const cPaleYellow = color(248, 238, 199);
  const cWarmWhite = color(253, 249, 238);
  const cSoftDay = color(255, 254, 252);

  if (t < 0.18) {
    const k = smoothstep(
      0,
      1,
      t / 0.18
    );

    return lerpColor(
      cDeepNight,
      cNightMauve,
      k
    );
  }

  if (t < 0.32) {
    const k = smoothstep(
      0,
      1,
      (t - 0.18) / 0.14
    );

    return lerpColor(
      cNightMauve,
      cDarkMauve,
      k
    );
  }

  if (t < 0.43) {
    const k = smoothstep(
      0,
      1,
      (t - 0.32) / 0.11
    );

    return lerpColor(
      cDarkMauve,
      cMutedMauve,
      k
    );
  }

  if (t < 0.55) {
    const k = smoothstep(
      0,
      1,
      (t - 0.43) / 0.12
    );

    return lerpColor(
      cMutedMauve,
      cPaleYellow,
      k
    );
  }

  if (t < 0.7) {
    const k = smoothstep(
      0,
      1,
      (t - 0.55) / 0.15
    );

    return lerpColor(
      cPaleYellow,
      cWarmWhite,
      k
    );
  }

  const k = smoothstep(
    0,
    1,
    (t - 0.7) / 0.3
  );

  return lerpColor(
    cWarmWhite,
    cSoftDay,
    k
  );
}

function rgbaString(c) {
  return `rgba(${floor(red(c))}, ${floor(green(c))}, ${floor(
    blue(c)
  )}, ${(alpha(c) / 255).toFixed(4)})`;
}

function drawBackground() {
  const visualTime = map(
    timeValue,
    0,
    1,
    BG_TIME_MIN,
    BG_TIME_MAX
  );

  const halfSpan =
    BG_GRADIENT_SPAN * 0.5;

  let topTime =
    visualTime -
    halfSpan * timeDirection;

  let upperMiddleTime =
    visualTime -
    halfSpan * 0.3 * timeDirection;

  let lowerMiddleTime =
    visualTime +
    halfSpan * 0.3 * timeDirection;

  let bottomTime =
    visualTime +
    halfSpan * timeDirection;

  topTime = constrain(
    topTime,
    0.08,
    0.98
  );

  upperMiddleTime = constrain(
    upperMiddleTime,
    0.08,
    0.98
  );

  lowerMiddleTime = constrain(
    lowerMiddleTime,
    0.08,
    0.98
  );

  bottomTime = constrain(
    bottomTime,
    0.08,
    0.98
  );

  let topColor =
    getBgColorAt(topTime);

  let upperMiddleColor =
    getBgColorAt(upperMiddleTime);

  let lowerMiddleColor =
    getBgColorAt(lowerMiddleTime);

  let bottomColor =
    getBgColorAt(bottomTime);

  const lightAmount = smoothstep(
    0.72,
    0.92,
    visualTime
  );

  topColor = lerpColor(
    topColor,
    color(255, 254, 252),
    lightAmount
  );

  upperMiddleColor = lerpColor(
    upperMiddleColor,
    color(253, 249, 237),
    lightAmount
  );

  lowerMiddleColor = lerpColor(
    lowerMiddleColor,
    color(251, 243, 218),
    lightAmount
  );

  bottomColor = lerpColor(
    bottomColor,
    color(247, 234, 188),
    lightAmount
  );

  const darkAmount =
    1 -
    smoothstep(
      0.14,
      0.34,
      visualTime
    );

  topColor = lerpColor(
    topColor,
    color(27, 26, 36),
    darkAmount
  );

  upperMiddleColor = lerpColor(
    upperMiddleColor,
    color(40, 36, 48),
    darkAmount
  );

  lowerMiddleColor = lerpColor(
    lowerMiddleColor,
    color(57, 48, 61),
    darkAmount
  );

  bottomColor = lerpColor(
    bottomColor,
    color(78, 63, 79),
    darkAmount
  );

  const ctx = drawingContext;

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      height
    );

  gradient.addColorStop(
    0,
    rgbaString(topColor)
  );

  gradient.addColorStop(
    0.34,
    rgbaString(upperMiddleColor)
  );

  gradient.addColorStop(
    0.68,
    rgbaString(lowerMiddleColor)
  );

  gradient.addColorStop(
    1,
    rgbaString(bottomColor)
  );

  ctx.save();

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.restore();
}

function isNight() {
  return timeValue < 0.45;
}

function isDay() {
  return timeValue > 0.55;
}

// ----------------------------------------------------
// 생각크리쳐 색상
// ----------------------------------------------------
function hexToRgbObj(hex) {
  const c = color(hex);

  return {
    r: red(c),
    g: green(c),
    b: blue(c)
  };
}

function getThoughtBaseRGB(type) {
  if (type === 0) {
    return hexToRgbObj(
      PALETTE_LIGHT
    );
  }

  if (type === 1) {
    return hexToRgbObj(
      PALETTE_PINK
    );
  }

  return hexToRgbObj(
    PALETTE_SLATE
  );
}

function makeToneColor(
  base,
  offset,
  type
) {
  if (type === 0) {
    return color(
      constrain(
        base.r + offset * 0.65,
        0,
        255
      ),
      constrain(
        base.g + offset * 0.65,
        0,
        255
      ),
      constrain(
        base.b + offset * 0.7,
        0,
        255
      )
    );
  }

  if (type === 1) {
    return color(
      constrain(
        base.r + offset * 0.78,
        0,
        255
      ),
      constrain(
        base.g + offset * 0.72,
        0,
        255
      ),
      constrain(
        base.b + offset * 0.78,
        0,
        255
      )
    );
  }

  return color(
    constrain(
      base.r + offset,
      0,
      255
    ),
    constrain(
      base.g + offset * 0.95,
      0,
      255
    ),
    constrain(
      base.b + offset * 1.05,
      0,
      255
    )
  );
}

// ----------------------------------------------------
// 마우스 표시
// ----------------------------------------------------
function drawMouseCreature() {
  const r = 18;

  if (isDay()) {
    const blink =
      sin(frameCount * 0.16);

    if (blink > 0) {
      const s =
        15 +
        sin(frameCount * 0.28) *
          1.2;

      drawMouseSparkle(
        mouseX,
        mouseY,
        s
      );
    } else {
      drawMouseCircle(
        mouseX,
        mouseY,
        r
      );
    }
  } else {
    drawMouseCircle(
      mouseX,
      mouseY,
      r
    );
  }
}

function drawMouseCircle(
  x,
  y,
  r
) {
  push();

  translate(x, y);

  fill(255);
  stroke(LINE_COLOR);
  strokeWeight(LINE_WEIGHT);

  circle(
    0,
    0,
    r * 2
  );

  pop();
}

function drawMouseSparkle(
  x,
  y,
  s
) {
  drawDiamondLight(
    x,
    y,
    s * 0.72
  );
}

function drawDiamondLight(
  x,
  y,
  s
) {
  push();

  translate(x, y);

  fill(LIGHT_COLOR);
  stroke(LINE_COLOR);
  strokeWeight(LINE_WEIGHT);

  beginShape();

  vertex(0, -s);
  vertex(s, 0);
  vertex(0, s);
  vertex(-s, 0);

  endShape(CLOSE);

  pop();
}

// ----------------------------------------------------
// 낮과 밤 생성 규칙
// ----------------------------------------------------
function handleAutoLightSpawn() {
  if (
    isDay() &&
    !autoLightSpawnedThisDay
  ) {
    for (
      let i = 0;
      i < 3;
      i++
    ) {
      const p =
        getSafeRandomLightPosition();

      lights.push(
        new LightCreature(
          p.x,
          p.y
        )
      );
    }

    autoLightSpawnedThisDay =
      true;
  }

  if (isNight()) {
    autoLightSpawnedThisDay =
      false;
  }
}

function handleNightRepopulation() {
  if (!isNight()) {
    return;
  }

  const aliveCount =
    thoughts.filter(
      thought =>
        !thought.dead &&
        !thought.dissolving
    ).length;

  if (
    aliveCount >=
    INITIAL_THOUGHT_COUNT
  ) {
    return;
  }

  if (
    frameCount -
      lastRepopulateFrame <
    10
  ) {
    return;
  }

  const spawnCount = min(
    2,
    INITIAL_THOUGHT_COUNT -
      aliveCount
  );

  for (
    let i = 0;
    i < spawnCount;
    i++
  ) {
    spawnOneBalancedThought();
  }

  lastRepopulateFrame =
    frameCount;
}

function handleSmallThoughtSpawn() {
  if (!isNight()) {
    return;
  }

  const aliveCount =
    thoughts.filter(
      thought =>
        !thought.dead &&
        !thought.dissolving
    ).length;

  if (
    aliveCount >=
    MAX_THOUGHTS
  ) {
    return;
  }

  if (
    frameCount -
      lastSmallSpawnFrame <
    32
  ) {
    return;
  }

  const emptySpace =
    MAX_THOUGHTS -
    aliveCount;

  let spawnCount = min(
    2,
    emptySpace
  );

  if (
    emptySpace >= 3 &&
    random() < 0.45
  ) {
    spawnCount = 3;
  }

  for (
    let i = 0;
    i < spawnCount;
    i++
  ) {
    spawnOneSmallThought();
  }

  lastSmallSpawnFrame =
    frameCount;
}

function spawnOneBalancedThought() {
  const p =
    getSafeRandomPosition();

  const type =
    floor(random(3));

  const baby =
    new ThoughtCreature(
      p.x,
      p.y,
      type
    );

  baby.scale =
    getSpawnScale(
      type,
      0.9,
      1.05
    );

  baby.birthCooldown = 70;
  baby.collisionCooldown = 70;

  thoughts.push(baby);
}

function spawnOneSmallThought() {
  const p =
    getSafeRandomPosition();

  const typeChoices = [
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    2
  ];

  const type =
    random(typeChoices);

  const baby =
    new ThoughtCreature(
      p.x,
      p.y,
      type
    );

  baby.scale =
    getSpawnScale(
      type,
      0.78,
      0.95
    );

  baby.birthCooldown = 70;
  baby.collisionCooldown = 70;

  thoughts.push(baby);
}

function getSpawnScale(
  type,
  minRatio,
  maxRatio
) {
  return (
    TYPE_BASE_SCALE[type] *
    random(minRatio, maxRatio)
  );
}

// ----------------------------------------------------
// 위치
// ----------------------------------------------------
function getSafeRandomLightPosition() {
  return createVector(
    random(
      80,
      width - 80
    ),
    random(
      80,
      height - 80
    )
  );
}

function getSafeRandomPosition() {
  return createVector(
    random(
      80,
      width - 80
    ),
    random(
      80,
      height - 80
    )
  );
}

// ----------------------------------------------------
// 마우스 클릭
// ----------------------------------------------------
function mousePressed() {
  lights.push(
    new LightCreature(
      mouseX,
      mouseY
    )
  );
}

// ----------------------------------------------------
// 초기 생각크리쳐
// ----------------------------------------------------
function addInitialThoughtSet() {
  for (
    let type = 0;
    type < 3;
    type++
  ) {
    for (
      let i = 0;
      i < INITIAL_COUNT_PER_TYPE;
      i++
    ) {
      const p =
        getSafeRandomPosition();

      thoughts.push(
        new ThoughtCreature(
          p.x,
          p.y,
          type
        )
      );
    }
  }
}

// ----------------------------------------------------
// 육각형
// ----------------------------------------------------
function drawRegularPolygon(
  radius,
  sides
) {
  beginShape();

  for (
    let i = 0;
    i < sides;
    i++
  ) {
    const angle =
      -HALF_PI +
      (TWO_PI * i) / sides;

    const x =
      cos(angle) * radius;

    const y =
      sin(angle) * radius;

    vertex(x, y);
  }

  endShape(CLOSE);
}

// ----------------------------------------------------
// 생각크리쳐
// type 0 = 베이지 원, 가장 작음
// type 1 = 핑크 육각형, 중간 크기
// type 2 = 남색 원, 가장 큼
// ----------------------------------------------------
class ThoughtCreature {
  constructor(x, y, type) {
    this.pos =
      createVector(x, y);

    this.vel =
      p5.Vector.random2D();

    this.type = type;

    this.dead = false;
    this.dissolving = false;

    this.collisionCooldown = 0;
    this.birthCooldown = 35;
    this.mouseGrowCooldown = 0;

    this.scale =
      TYPE_BASE_SCALE[this.type] *
      random(0.95, 1.08);

    this.coreR = 16;

    this.layers =
      TYPE_LAYERS[this.type];

    this.ringGap = 5.4;

    this.ringToneOffsets = [];
    this.ringAppearProgress = [];

    this.turnNoise =
      random(1000);

    this.pulseOffset =
      random(TWO_PI);

    this.speedPulseOffset =
      random(TWO_PI);

    this.dissolveProgress = 0;

    this.dissolveSpeed =
      random(0.008, 0.012);

    this.dissolveTarget = null;

    for (
      let i = 0;
      i < this.layers;
      i++
    ) {
      this.ringToneOffsets.push(
        this.generateToneOffset()
      );

      this.ringAppearProgress.push(
        0
      );
    }

    this.resetMotionByLayer();
  }

  generateToneOffset() {
    return random([
      -24,
      -17,
      -10,
      -4,
      0,
      0,
      4,
      10,
      17,
      24
    ]);
  }

  updateRingAppear() {
    for (
      let i = 0;
      i < this.layers;
      i++
    ) {
      let canAppear = false;

      if (i === 0) {
        canAppear = true;
      } else if (
        this.ringAppearProgress[
          i - 1
        ] > 0.55
      ) {
        canAppear = true;
      }

      if (
        canAppear &&
        this.ringAppearProgress[
          i
        ] < 1
      ) {
        this.ringAppearProgress[
          i
        ] += 0.055;

        this.ringAppearProgress[
          i
        ] = constrain(
          this.ringAppearProgress[
            i
          ],
          0,
          1
        );
      }
    }
  }

  addOneLayer() {
    if (
      this.layers >= 10
    ) {
      return;
    }

    this.layers++;

    this.ringToneOffsets.push(
      this.generateToneOffset()
    );

    this.ringAppearProgress.push(
      0
    );

    this.resetMotionByLayer();
  }

  getRingToneColor(index) {
    const base =
      getThoughtBaseRGB(
        this.type
      );

    const offset =
      this.ringToneOffsets[
        index
      ] || 0;

    return makeToneColor(
      base,
      offset,
      this.type
    );
  }

  resetMotionByLayer() {
    const heaviness = constrain(
      this.layers,
      1,
      10
    );

    this.baseSpeed = map(
      heaviness,
      1,
      10,
      1.15,
      0.12
    );

    this.turnAmount = map(
      heaviness,
      1,
      10,
      0.11,
      0.012
    );

    this.noiseRate = map(
      heaviness,
      1,
      10,
      0.014,
      0.0035
    );

    this.motionWeight = map(
      heaviness,
      1,
      10,
      1,
      0.28
    );

    if (this.type === 0) {
      this.baseSpeed *= 1.5;
      this.turnAmount *= 1.55;
      this.noiseRate *= 1.25;
    } else if (
      this.type === 1
    ) {
      this.noiseRate *= 1.05;
    } else {
      this.baseSpeed *= 0.72;
      this.turnAmount *= 0.65;
    }

    this.vel.setMag(
      this.baseSpeed
    );
  }

  update() {
    if (this.dead) {
      return;
    }

    if (
      this.collisionCooldown > 0
    ) {
      this.collisionCooldown--;
    }

    if (
      this.birthCooldown > 0
    ) {
      this.birthCooldown--;
    }

    if (
      this.mouseGrowCooldown > 0
    ) {
      this.mouseGrowCooldown--;
    }

    this.updateRingAppear();

    if (this.dissolving) {
      this.updateDissolve();
      return;
    }

    const daySlow = map(
      timeValue,
      0,
      1,
      1,
      0.38
    );

    const nightEnergy =
      isNight() ? 1.35 : 1;

    const nightTurnEnergy =
      isNight() ? 1.25 : 1;

    const n = noise(
      this.turnNoise,
      frameCount *
        this.noiseRate *
        nightTurnEnergy
    );

    let turn = map(
      n,
      0,
      1,
      -this.turnAmount,
      this.turnAmount
    );

    turn *= nightTurnEnergy;

    if (
      isNight() &&
      this.layers <= 2 &&
      frameCount % 55 === 0
    ) {
      turn += random(
        -0.42,
        0.42
      );
    } else if (
      this.layers <= 2 &&
      frameCount % 75 === 0
    ) {
      turn += random(
        -0.35,
        0.35
      );
    } else if (
      this.layers <= 4 &&
      frameCount % 130 === 0
    ) {
      turn += random(
        -0.16,
        0.16
      );
    }

    const sway = sin(
      frameCount *
        this.noiseRate *
        3 +
        this.pulseOffset
    );

    turn +=
      sway *
      this.turnAmount *
      0.35 *
      nightTurnEnergy;

    this.vel.rotate(turn);

    this.growByMouse();

    let targetSpeed =
      this.baseSpeed *
      daySlow *
      nightEnergy;

    if (this.type === 0) {
      const beigePulse = map(
        sin(
          frameCount * 0.055 +
            this.speedPulseOffset
        ),
        -1,
        1,
        0.95,
        1.25
      );

      targetSpeed *=
        beigePulse;
    } else if (
      this.type === 1
    ) {
      const pinkPulse = map(
        sin(
          frameCount * 0.085 +
            this.speedPulseOffset
        ),
        -1,
        1,
        0.35,
        1.75
      );

      targetSpeed *=
        pinkPulse;
    }

    const currentSpeed =
      this.vel.mag();

    const newSpeed = lerp(
      currentSpeed,
      targetSpeed,
      0.08 *
        this.motionWeight
    );

    this.vel.setMag(newSpeed);

    this.pos.add(this.vel);

    this.bounceOnWall();
  }

  growByMouse() {
    if (
      this.layers >= 10 ||
      this.mouseGrowCooldown > 0
    ) {
      return;
    }

    const d = dist(
      mouseX,
      mouseY,
      this.pos.x,
      this.pos.y
    );

    const growRange =
      this.getRadius() + 18;

    if (d < growRange) {
      this.addOneLayer();

      this.mouseGrowCooldown =
        58;

      // 베이지는 커지더라도 정해진 최대 크기를 넘지 않음
      this.scale = min(
        this.scale + 0.025,
        TYPE_MAX_SCALE[this.type]
      );
    }
  }

  startDissolve(lightPos) {
    if (this.dissolving) {
      return;
    }

    this.dissolving = true;
    this.dissolveProgress = 0;

    this.dissolveTarget =
      lightPos.copy();

    this.vel.mult(0);

    this.collisionCooldown =
      9999;

    for (
      let i = 0;
      i <
      this.ringAppearProgress
        .length;
      i++
    ) {
      this.ringAppearProgress[
        i
      ] = max(
        this.ringAppearProgress[
          i
        ],
        0.25
      );
    }
  }

  updateDissolve() {
    this.dissolveProgress +=
      this.dissolveSpeed;

    if (this.dissolveTarget) {
      const pull =
        p5.Vector.sub(
          this.dissolveTarget,
          this.pos
        );

      pull.mult(0.0035);

      this.pos.add(pull);
    }

    if (
      frameCount % 2 === 0 &&
      smokeParticles.length <
        MAX_SMOKE_PARTICLES
    ) {
      const p =
        this.getDissolvingRingPoint();

      smokeParticles.push(
        new SmokeParticle(
          p.x,
          p.y,
          this.dissolveTarget
            ? this.dissolveTarget.copy()
            : this.pos.copy()
        )
      );
    }

    if (
      this.dissolveProgress >= 1
    ) {
      this.dead = true;
    }
  }

  getDissolvingRingPoint() {
    const progress = constrain(
      this.dissolveProgress,
      0,
      1
    );

    let ringIndex = floor(
      lerp(
        this.layers - 1,
        0,
        progress
      )
    );

    ringIndex = constrain(
      ringIndex,
      0,
      this.layers - 1
    );

    const r =
      this.coreR +
      ringIndex * this.ringGap;

    const a = random(TWO_PI);

    return createVector(
      this.pos.x +
        cos(a) *
          r *
          this.scale,
      this.pos.y +
        sin(a) *
          r *
          this.scale
    );
  }

  bounceOnWall() {
    const r =
      this.getRadius();

    if (this.pos.x < r) {
      this.pos.x = r;
      this.vel.x *= -1;
    }

    if (
      this.pos.x >
      width - r
    ) {
      this.pos.x =
        width - r;

      this.vel.x *= -1;
    }

    if (this.pos.y < r) {
      this.pos.y = r;
      this.vel.y *= -1;
    }

    if (
      this.pos.y >
      height - r
    ) {
      this.pos.y =
        height - r;

      this.vel.y *= -1;
    }
  }

  getVisualRadius() {
    return (
      this.coreR +
      (this.layers - 1) *
        this.ringGap
    );
  }

  getCollisionRadius() {
    return (
      this.getVisualRadius() +
      4
    );
  }

  getRadius() {
    return (
      this.getCollisionRadius() *
      this.scale
    );
  }

  canCollide() {
    return (
      !this.dead &&
      !this.dissolving &&
      this.collisionCooldown <=
        0 &&
      this.birthCooldown <= 0
    );
  }

  drawBaseShape(radius) {
    if (this.type === 1) {
      drawRegularPolygon(
        radius,
        6
      );
    } else {
      circle(
        0,
        0,
        radius * 2
      );
    }
  }

  draw() {
    if (this.dead) {
      return;
    }

    if (this.dissolving) {
      this.drawDissolvingShape();
    } else {
      this.drawNormalShape();
    }
  }

  drawNormalShape() {
    push();

    translate(
      this.pos.x,
      this.pos.y
    );

    scale(this.scale);

    strokeWeight(LINE_WEIGHT);

    for (
      let i =
        this.layers - 1;
      i >= 0;
      i--
    ) {
      const r =
        this.coreR +
        i * this.ringGap;

      const appear =
        easeInOut(
          this.ringAppearProgress[
            i
          ] || 0
        );

      if (appear <= 0) {
        continue;
      }

      const c =
        this.getRingToneColor(i);

      c.setAlpha(
        255 * appear
      );

      const lineC =
        color(LINE_COLOR);

      lineC.setAlpha(
        220 * appear
      );

      fill(c);
      stroke(lineC);

      push();

      scale(appear);

      this.drawBaseShape(r);

      pop();
    }

    pop();
  }

  drawDissolvingShape() {
    push();

    translate(
      this.pos.x,
      this.pos.y
    );

    scale(this.scale);

    const progress = constrain(
      this.dissolveProgress,
      0,
      1
    );

    strokeWeight(LINE_WEIGHT);

    for (
      let i =
        this.layers - 1;
      i >= 0;
      i--
    ) {
      const ringOrderFromOuter =
        this.layers -
        1 -
        i;

      const start =
        ringOrderFromOuter /
        this.layers;

      const end =
        (ringOrderFromOuter + 1) /
        this.layers;

      const localProgress = map(
        progress,
        start,
        end,
        0,
        1,
        true
      );

      let dissolveAlpha = map(
        localProgress,
        0,
        1,
        255,
        0,
        true
      );

      if (progress < start) {
        dissolveAlpha = 255;
      }

      if (progress > end) {
        continue;
      }

      const appear =
        easeInOut(
          this.ringAppearProgress[
            i
          ] || 0
        );

      const alpha =
        dissolveAlpha *
        appear;

      if (alpha <= 1) {
        continue;
      }

      const r =
        this.coreR +
        i * this.ringGap;

      const shrink = lerp(
        1,
        0.92,
        localProgress
      );

      const c =
        this.getRingToneColor(
          i
        );

      c.setAlpha(alpha);

      const lineC =
        color(LINE_COLOR);

      lineC.setAlpha(
        alpha * 0.85
      );

      fill(c);
      stroke(lineC);

      push();

      scale(shrink);

      this.drawBaseShape(r);

      pop();
    }

    pop();
  }
}

function easeInOut(t) {
  t = constrain(
    t,
    0,
    1
  );

  return (
    t *
    t *
    (3 - 2 * t)
  );
}

// ----------------------------------------------------
// 빛 크리쳐
// ----------------------------------------------------
class LightCreature {
  constructor(x, y) {
    this.pos =
      createVector(x, y);

    this.vel =
      p5.Vector.random2D().mult(
        0.7
      );

    this.acc =
      createVector(0, 0);

    this.r = 16;

    this.maxSpeed = 1.15;
    this.maxForce = 0.028;

    this.wanderSeed =
      random(1000);

    this.eraseCount = 0;
    this.maxEraseCount = 3;

    this.eatDistance = 120;

    this.lastEatPos =
      createVector(
        -9999,
        -9999
      );

    this.dead = false;
  }

  update() {
    if (this.dead) {
      return;
    }

    let nearest = null;
    let nearestDist =
      Infinity;

    if (isDay()) {
      for (
        const thought of thoughts
      ) {
        if (
          thought.dead ||
          thought.dissolving
        ) {
          continue;
        }

        const d =
          p5.Vector.dist(
            this.pos,
            thought.pos
          );

        if (
          d < nearestDist
        ) {
          nearestDist = d;
          nearest = thought;
        }
      }
    }

    let steer =
      createVector(0, 0);

    if (nearest) {
      const desired =
        p5.Vector.sub(
          nearest.pos,
          this.pos
        );

      desired.setMag(
        this.maxSpeed
      );

      steer =
        p5.Vector.sub(
          desired,
          this.vel
        );

      steer.limit(
        this.maxForce
      );
    }

    const wanderAngle =
      noise(
        this.wanderSeed,
        frameCount * 0.008
      ) *
      TWO_PI *
      2;

    const wanderPower = map(
      timeValue,
      0,
      1,
      0.006,
      0.018
    );

    const speedLimit = map(
      timeValue,
      0,
      1,
      0.18,
      this.maxSpeed
    );

    const wander =
      p5.Vector.fromAngle(
        wanderAngle
      ).mult(
        wanderPower
      );

    this.acc.add(steer);
    this.acc.add(wander);

    this.vel.add(this.acc);

    this.vel.limit(
      speedLimit
    );

    this.pos.add(this.vel);

    this.acc.mult(0);

    this.bounceOnWall();
  }

  bounceOnWall() {
    if (
      this.pos.x < this.r ||
      this.pos.x >
        width - this.r
    ) {
      this.vel.x *= -1;
    }

    if (
      this.pos.y < this.r ||
      this.pos.y >
        height - this.r
    ) {
      this.vel.y *= -1;
    }

    this.pos.x = constrain(
      this.pos.x,
      this.r,
      width - this.r
    );

    this.pos.y = constrain(
      this.pos.y,
      this.r,
      height - this.r
    );
  }

  canEatHere() {
    return (
      p5.Vector.dist(
        this.pos,
        this.lastEatPos
      ) >
      this.eatDistance
    );
  }

  registerErase() {
    this.eraseCount++;

    this.lastEatPos =
      this.pos.copy();

    if (
      this.eraseCount >=
      this.maxEraseCount
    ) {
      this.dead = true;
    }
  }

  isDead() {
    return this.dead;
  }

  draw() {
    if (this.dead) {
      return;
    }

    const nightSize = 4;
    const daySize = this.r;

    const s = lerp(
      nightSize,
      daySize,
      timeValue
    );

    if (!isDay()) {
      noStroke();

      fill(LIGHT_COLOR);

      circle(
        this.pos.x,
        this.pos.y,
        s * 2
      );
    } else {
      drawSparkle(
        this.pos.x,
        this.pos.y,
        s
      );
    }
  }
}

function drawSparkle(
  x,
  y,
  s
) {
  drawDiamondLight(
    x,
    y,
    s * 0.72
  );
}

// ----------------------------------------------------
// 사라질 때 생기는 작은 마름모
// ----------------------------------------------------
class SmokeParticle {
  constructor(x, y, target) {
    this.pos =
      createVector(
        x + random(-3, 3),
        y + random(-3, 3)
      );

    this.target = target
      ? target.copy()
      : null;

    const randomMove =
      p5.Vector.random2D().mult(
        random(0.2, 1)
      );

    let targetMove =
      createVector(0, -0.5);

    if (this.target) {
      targetMove =
        p5.Vector.sub(
          this.target,
          this.pos
        );

      targetMove.setMag(
        random(0.3, 1.05)
      );
    }

    this.vel =
      p5.Vector.add(
        randomMove,
        targetMove
      );

    this.acc =
      createVector(
        random(
          -0.003,
          0.003
        ),
        random(
          -0.006,
          -0.001
        )
      );

    this.r =
      random(3.2, 7.2);

    this.life =
      random(42, 78);

    this.maxLife =
      this.life;

    this.noiseSeed =
      random(1000);

    this.rot =
      random(TWO_PI);

    this.rotSpeed =
      random(-0.05, 0.05);
  }

  update() {
    const n = noise(
      this.noiseSeed,
      frameCount * 0.015
    );

    const drift = map(
      n,
      0,
      1,
      -0.035,
      0.035
    );

    this.vel.x += drift;

    if (this.target) {
      const pull =
        p5.Vector.sub(
          this.target,
          this.pos
        );

      if (pull.mag() > 1) {
        pull.setMag(0.012);

        this.vel.add(pull);
      }
    }

    this.vel.add(this.acc);
    this.pos.add(this.vel);

    this.vel.mult(0.975);

    this.rot +=
      this.rotSpeed;

    this.life--;
  }

  isDead() {
    return this.life <= 0;
  }

  draw() {
    const particleAlpha = map(
      this.life,
      0,
      this.maxLife,
      0,
      220
    );

    const size = map(
      this.life,
      0,
      this.maxLife,
      this.r * 0.25,
      this.r * 0.95
    );

    push();

    translate(
      this.pos.x,
      this.pos.y
    );

    rotate(this.rot);

    fill(
      244,
      240,
      109,
      particleAlpha
    );

    const diamondLine =
      color(LINE_COLOR);

    diamondLine.setAlpha(
      particleAlpha
    );

    stroke(diamondLine);
    strokeWeight(0.55);

    drawTinyDiamond(
      size * 0.7
    );

    pop();
  }
}

function drawTinyDiamond(s) {
  beginShape();

  vertex(0, -s);
  vertex(s, 0);
  vertex(0, s);
  vertex(-s, 0);

  endShape(CLOSE);
}

// ----------------------------------------------------
// 업데이트
// ----------------------------------------------------
function updateThoughts() {
  for (
    const thought of thoughts
  ) {
    thought.update();
  }

  thoughts =
    thoughts.filter(
      thought =>
        !thought.dead
    );
}

function updateLights() {
  for (
    const light of lights
  ) {
    light.update();

    if (
      light.isDead() ||
      !isDay() ||
      !light.canEatHere()
    ) {
      continue;
    }

    for (
      const thought of thoughts
    ) {
      if (
        thought.dead ||
        thought.dissolving
      ) {
        continue;
      }

      const d =
        p5.Vector.dist(
          light.pos,
          thought.pos
        );

      if (
        d <
        light.r +
          thought.getRadius()
      ) {
        thought.startDissolve(
          light.pos
        );

        light.registerErase();

        if (light.isDead()) {
          break;
        }
      }
    }
  }

  lights =
    lights.filter(
      light =>
        !light.isDead()
    );
}

function updateSmokeParticles() {
  for (
    const particle of
      smokeParticles
  ) {
    particle.update();
  }

  smokeParticles =
    smokeParticles.filter(
      particle =>
        !particle.isDead()
    );

  if (
    smokeParticles.length >
    MAX_SMOKE_PARTICLES
  ) {
    smokeParticles.splice(
      0,
      smokeParticles.length -
        MAX_SMOKE_PARTICLES
    );
  }
}

// ----------------------------------------------------
// 충돌 규칙
// 같은 색 = 합쳐져서 커짐
// 다른 색 = 남은 세 번째 색 생성
// ----------------------------------------------------
function handleThoughtCollisions() {
  for (
    let i = 0;
    i < thoughts.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < thoughts.length;
      j++
    ) {
      const a = thoughts[i];
      const b = thoughts[j];

      if (
        a.dead ||
        b.dead
      ) {
        continue;
      }

      if (
        !a.canCollide() ||
        !b.canCollide()
      ) {
        continue;
      }

      const d =
        p5.Vector.dist(
          a.pos,
          b.pos
        );

      const minD =
        a.getRadius() +
        b.getRadius();

      if (d < minD) {
        if (
          a.type === b.type
        ) {
          mergeThoughts(
            a,
            b
          );
        } else {
          spawnNewThoughtFromCollision(
            a,
            b
          );
        }

        a.collisionCooldown = 45;
        b.collisionCooldown = 45;
      }
    }
  }

  thoughts =
    thoughts.filter(
      thought =>
        !thought.dead
    );
}

function mergeThoughts(a, b) {
  const winner =
    a.scale >= b.scale
      ? a
      : b;

  const loser =
    winner === a
      ? b
      : a;

  const winnerArea = sq(
    winner.getRadius()
  );

  const loserArea = sq(
    loser.getRadius()
  );

  const totalArea =
    winnerArea +
    loserArea * 0.65;

  const baseArea = sq(
    winner.getCollisionRadius()
  );

  winner.scale = sqrt(
    totalArea /
      baseArea
  );

  // 색상별 최대 크기를 다르게 제한
  // 베이지는 남색보다 작은 크기로 유지됨
  winner.scale = constrain(
    winner.scale,
    TYPE_BASE_SCALE[winner.type] *
      0.72,
    TYPE_MAX_SCALE[winner.type]
  );

  winner.addOneLayer();

  winner.pos =
    p5.Vector.lerp(
      winner.pos,
      loser.pos,
      0.22
    );

  winner.vel
    .add(loser.vel)
    .mult(0.5);

  winner.vel.limit(
    winner.baseSpeed * 1.2
  );

  loser.dead = true;
}

function spawnNewThoughtFromCollision(
  a,
  b
) {
  if (!isNight()) {
    bounceApart(a, b);
    return;
  }

  if (
    thoughts.length >=
    MAX_THOUGHTS
  ) {
    bounceApart(a, b);
    return;
  }

  const mid =
    p5.Vector.add(
      a.pos,
      b.pos
    ).mult(0.5);

  const newType =
    3 -
    a.type -
    b.type;

  const babyPos =
    createVector(
      mid.x + random(-8, 8),
      mid.y + random(-8, 8)
    );

  const baby =
    new ThoughtCreature(
      babyPos.x,
      babyPos.y,
      newType
    );

  baby.scale =
    getSpawnScale(
      newType,
      0.72,
      0.88
    );

  baby.birthCooldown = 55;
  baby.collisionCooldown = 55;

  thoughts.push(baby);

  bounceApart(a, b);
}

function bounceApart(a, b) {
  let push =
    p5.Vector.sub(
      a.pos,
      b.pos
    );

  if (
    push.mag() < 0.001
  ) {
    push =
      p5.Vector.random2D();
  }

  push.normalize();
  push.mult(0.42);

  a.vel.add(push);
  b.vel.sub(push);

  a.vel.limit(
    a.baseSpeed * 1.2
  );

  b.vel.limit(
    b.baseSpeed * 1.2
  );
}

// ----------------------------------------------------
// 그리기
// ----------------------------------------------------
function drawThoughts() {
  for (
    const thought of thoughts
  ) {
    thought.draw();
  }
}

function drawLights() {
  for (
    const light of lights
  ) {
    light.draw();
  }
}

function drawSmokeParticles() {
  for (
    const particle of
      smokeParticles
  ) {
    particle.draw();
  }
}

// ----------------------------------------------------
// 화면 크기 대응
// ----------------------------------------------------
function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  for (
    const thought of thoughts
  ) {
    const r =
      thought.getRadius();

    thought.pos.x = constrain(
      thought.pos.x,
      r,
      width - r
    );

    thought.pos.y = constrain(
      thought.pos.y,
      r,
      height - r
    );
  }

  for (
    const light of lights
  ) {
    light.pos.x = constrain(
      light.pos.x,
      light.r,
      width - light.r
    );

    light.pos.y = constrain(
      light.pos.y,
      light.r,
      height - light.r
    );
  }
}