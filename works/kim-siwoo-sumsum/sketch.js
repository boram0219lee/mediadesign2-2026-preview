// ══════════════════════════════════════════════════════════════════
//  ★ 위치 조절 가이드 ★
//
//  CFG.FURNITURE  → 각 가구의 3D 공간 위치 [x, y, z]
//  CFG.FURNITURE_HIT  → 마우스 클릭/호버 감지 영역 [x, y] (2D 화면 좌표)
//  CFG.ROUTINE_POS  → 캐릭터가 일과 행동을 하러 걷는 목표 위치 [x, z]
//  CFG.HIT_RADIUS   → 가구 클릭 감지 반경 (픽셀, 기본 68)
//
//  ★ 수정7: 손에 든 아이템 위치/기울기 조절 ★
//  CFG.HAND_ITEM_OFFSET → 각 아이템별 손 기준 오프셋 [x, y, z]와 회전 [rx, ry, rz], 스케일
//
//  ★ 수정4: 바닥에 놓이는 아이템 위치 조절 ★
//  CFG.DROP_OFFSET → 바닥에 떨어질 때 캐릭터 위치 기준 오프셋 [x, z]
// ══════════════════════════════════════════════════════════════════
 
const CFG = {
  W: 1280, H: 720,
  CAM: { fov:68, eyeX:0, eyeY:-90, eyeZ:450, centerX:0, centerY:-80, centerZ:-120 },
  ROOM: { floorW:1300, floorD:950, wallH:800 },
 
  COLOR: {
    bg: "#f2ebd7", ambientIn: "#F09B52", sunColor: "#F4D17C",
    fab: ["#F3E9D9","#c36e5f","#cdb99b","#87967d","#a58c9b","#e1b473","#8c9caa","#c89b8c","#738c82","#aa7d6e"],
    floor: "#78665C", wall: "#dcd2c3",
    bedding: ["#77716C","#DCDEC5","#586B78","#969389","#555771","#a0787d","#BCCC97","#EDEDED","#A9979F","#524C46"],
    pillow:  ["#7A514B","#647055","#605F90","#53727D","#8B6B50","#888B71","#4F667D","#454A4F","#68614E","#4D4547"],
    light: "rgba(253,228,152,0.4)", dust: "#FFFFFF",
    char: { skin:"#FEAF94", joint:"#A059AB", body:"#FBF9C4", brow:"#FD7CEE", ant:"#FD7CEE", pupil:"#A059AB" },
    bodyColors: ["#FBF9C4","#C4E8FB","#FBC4E8","#C4FBC4","#E8C4FB","#FBE8C4"],
  },
 
  DUST: { count:40, minR:2.5, maxR:5.0, speed:1, alpha:[80,200] },
  CHAR: { scale:0.55, walkSpeed:1.2, walkBobFreq:7.5, walkBobAmp:5, turnSpeed:4, blinkInterval:6, floorY:-18 },
 
  FURNITURE: {
    mirror  : [-240, -85, 155],
    shelf   : [300, -20, 120],
    desk    : [-50, -16, 221],
    bowl    : [-90, -32, 225],
    teacup  : [-20, -38, 255],
    lamp    : [-205, -10, 90],
    plant   : [230, -25, 95],
    radio   : [298, -37, 125],
  },
 
  FURNITURE_HIT: [
    { name:"mirror", x:-440, y:0 },
    { name:"shelf", x:480, y:-60 },
    { name:"desk", x:-240, y:180 },
    { name:"bowl", x:-220, y:150 },
    { name:"teacup", x:-80, y:100 },
    { name:"lamp", x:-300, y:-50 },
    { name:"plant", x:330, y:-0 },
    { name:"radio", x:480, y:40 },
  ],
 
  ROUTINE_POS: {
    mirror  : [-190, 170],
    shelf   : [222, 140],
    desk    : [20, 160],
    bowl    : [-170, 220],
    teacup  : [43, 210],
    lamp    : [-115, 94],
    plant   : [155, 115],
    radio   : [267, 175],
    viewer:   [0, 310],
  },
 
  HIT_RADIUS: 68,
 
  HOVER_ALPHA:  0.42,
  FADED_ALPHA:  0.38,
 
  NAV_OBSTACLES: [
    [-240, 155, 22],
    [-205,  90, 14],
    [ 300, 120, 28],
    [ 230,  95, 14],
    [ 295, 125, 14],
    [ -60, 200, 22],
    [  60, 140, 16],
  ],
 
  NAV_PUSH_STRENGTH: 0.85,
  NAV_MAX_STUCK_FRAMES: 20,
 
  VIEWER_ZONE: { cx:0, cy:240, hw:240, hh:110 },
  ITEM_FADE_TIME: 10000,
  LIGHT_BEAM: { topX:1100,topY:-1000,topW:30, botX:130,botY:0,botW:200 },
 
  DROP_OFFSET: {
    book:  [15, -0],
    snack: [15, -0],
    cup:   [15, -0],
  },
 
  HAND_ITEM_OFFSET: {
    book:  { x:10,  y:25, z:10,  rx:220,    ry:-220,   rz:280,  scale:1.0  },
    snack: { x:10,  y:35, z:25,  rx:0,    ry:260,   rz:240,    scale:0.8 },
    cup:   { x:5,  y:35, z:25,  rx:0,    ry:90,   rz:0,    scale:0.8 },
  },
 
  DROP_SCALE: {
    book:  0.6,
    snack: 0.8,
    cup:   0.7,
  },
 
  DRAPE_PANELS: [
    [-250,600,-40,270,220,0,-490,230,80],[330,300,-400,300,150,5,-430,180,30],
    [-250,400,-20,230,160,4,-360,210,80],[120,200,-280,350,160,1,-470,200,40],
    [-260,100,-50,300,165,1,-370,100,50],[210,180,30,150,80,3,-300,160,70],
    [-189,230,230,450,146,6,-320,180,80],[400,100,-80,400,130,2,-360,200,60],
    [15,250,-150,420,170,7,-460,220,80],
  ],
  WALL_FABRICS: [
    [-650,-500,-600,400,-500,10,3,45,210],[650,-500,600,450,-480,10,8,40,200],
    [-650,-400,-30,-360,-800,10,7,55,230],[-20,-380,657,-390,-800,10,4,50,220],
    [-300,-300,300,-220,-800,10,9,20,100],[-150,-280,200,-210,-800,10,0,20,50],
    [-600,-150,-200,-350,-800,10,7,20,120],[-550,-40,-400,-100,-800,10,0,6,130],
    [300,-300,700,-100,-800,10,2,20,120],
  ],
  BEDDING_LAYERS: [
    [0,60,0.08,570,485,14,0,"flat"],[-230,35,0.25,340,250,35,1,"crumple"],
    [230,30,-0.2,320,300,30,8,"crumple"],[-120,160,0.35,260,200,16,4,"flat"],
    [140,180,-0.25,280,210,15,2,"flat"],[10,240,0.05,440,230,12,3,"flat"],
    [-260,150,0.45,220,180,18,5,"crumple"],[270,140,-0.35,210,170,17,6,"crumple"],
    [-20,320,-0.05,300,160,13,9,"flat"],
  ],
  PILLOWS: [
    [-200,-32,50,0.4,0,1.25],[130,-29,20,-0.3,5,1.45],[170,-28,50,0.5,7,1.05],
    [-180,-32,10,0.1,9,1.35],[260,-21,200,0.3,5,0.8],[250,-26,20,-0.4,6,1.3],
    [-250,-24,220,-0.5,8,1.2],[40,-26,25,0.2,4,1.5],[85,-36,50,-0.5,0,0.95],
    [-310,-34,40,0.4,7,1.3],[-40,-23,120,0.5,7,1.2],[0,-23,10,-0.3,3,1.15],
    [120,-22,160,-0.1,8,1.35],[80,-20,230,0,0,1.15],[130,-25,220,0.7,2,0.95],[-150,-25,180,0.7,3,0.95],
    [0,-22,380,0.4,4,1.55],
  ],
};
 
const W = {
  light:[195,155,105], mid:[162,122,78], dark:[122,88,52], shadow:[95,68,38],
  glass:[200,215,220], plantLeaf:[110,145,100], plantPot:[185,115,75],
  lampShade:[255,240,190], radioBody:[135,150,125],
};
 
let FURNITURE_HIT_AREAS;
 
let sf = 1;
let breathT=0, gT=0;
let dustParticles=[];
let bgmSound, cursorImg;
 
let curX=0, curZ=200, tgtX=0, tgtZ=200;
let bodyAngle=0, moving=false, walkPhase=0;
let blinkPh=0, blinkT=0, eyelid=0, lastBlink=0;
let sitPrg=0, liftPrg=0, currentBodyColor, spinAngle=0;
 
let lastStepTime=0, stepSide=0;
let hoveredFurniture=null;
 
let stuckFrames = 0;
let lastCurX = 0, lastCurZ = 0;
let nudgeOffset = { x: 0, z: 0 };
 
const ROUTINES=["mirror","shelf","bowl","teacup","plant"];
let routineQueue=[], routineIdx=0;
let routineState="idle", currentRoutine=null;
let routineSubState="", routineSubTimer=0;
 
let droppedItem=null, handItem=null;
let isDragging=false, dragStartX=0, dragStartY=0, viewerInteracting=false;
let furnitureShake={}, furnitureFaded={}, pendingFurnitureAction=null;
let lastClickedFurniture = null;
 
let lampOn=true, lampT=1.0, radioOn=true, audioCtx=null;
let glanceViewer=false, glanceTimer=0, cursorInViewerZone=false;
 
// ★ 강화된 놀람 반응 변수들
let surprisePrg=0, surpriseTimer=0, surpriseActive=false, surpriseType="char";
let surpriseBubbleAlpha=0;
let joltTimer=0, joltActive=false;
let surpriseVariant = 0;
let glanceYaw = 0;
 
// ★ 번쩍(flash) 효과
let flashAlpha = 0;
let flashTimer = 0;
let flashColor = [255, 255, 255];
 
// ★ 몸통 색 강조 (거울 루틴)
let bodyColorFlashT = 0;
let prevBodyColor = null;
 
let danceTimer=0, dancePrg=0, danceDuration=0, dancePhase=0;
let singTimer=0, singActive=false, singPhase=0;
let nextDanceIn=0;
 
// ★ 라디오 재시작 타이머
let radioRestartTimer = 0;
 
let uiLayer;
 
let targetBodyAngle = 0;
let prevMoving = false;
 
function preload() {
  try { soundFormats('mp3','ogg'); bgmSound = loadSound('bgm.mp3'); } catch(e) {}
  try { cursorImg = loadImage('cursor1.png'); } catch(e) {}
}
 
function setup() {
  FURNITURE_HIT_AREAS = CFG.FURNITURE_HIT;
  sf = min(windowWidth / CFG.W, windowHeight / CFG.H);
  let cnv = createCanvas(CFG.W * sf, CFG.H * sf, WEBGL);
  uiLayer = createGraphics(CFG.W, CFG.H);
  colorMode(RGB,255,255,255,255);
  angleMode(RADIANS);
  smooth();
  noiseSeed(7);
  for(let i=0;i<CFG.DUST.count;i++) dustParticles.push(newDust());
  currentBodyColor = CFG.COLOR.char.body;
  shuffleRoutines();
  startNextRoutine();
  nextDanceIn = random(8, 18);
  try { audioCtx = new(window.AudioContext||window.webkitAudioContext)(); } catch(e){}
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}
 
function windowResized() {
  sf = min(windowWidth / CFG.W, windowHeight / CFG.H);
  resizeCanvas(CFG.W * sf, CFG.H * sf);
}
 
function draw() {
  if (routineState === "idle" || (routineState === "acting" && routineSubTimer > 25)) {
    routineState = "idle";
    startNextRoutine();
  }
  if (routineState === "acting" && currentRoutine && furnitureFaded[currentRoutine]) {
    furnitureFaded[currentRoutine] = false;
  }
 
  // ★ 라디오 재시작 처리
  if (radioRestartTimer > 0) {
    radioRestartTimer -= deltaTime / 1000;
    if (radioRestartTimer <= 0) {
      radioRestartTimer = 0;
      if (bgmSound) {
        bgmSound.stop();
        bgmSound.setLoop(true);
        bgmSound.setVolume(0.35);
        bgmSound.play();
      }
    }
  }
 
  const dt = min(deltaTime/1000, 0.05);
  gT += dt; breathT += 0.006;
 
  const c = CFG.CAM;
  perspective(radians(c.fov), CFG.W/CFG.H, 1, 6000);
  camera(c.eyeX,c.eyeY,c.eyeZ, c.centerX,c.centerY,c.centerZ, 0,1,0);
  lampT += ((lampOn?1:0)-lampT)*dt*3;
  applyLights();
  background(color(CFG.COLOR.bg));
  _bgFloorAndWall();
  _bgWallFabrics();
  _bgDrapedFabrics();
  _bgFloorBedding();
  drawFurnitureAll();
  drawDroppedItem();
  drawDust();
  drawLightBeam();
  updateCharacter(dt);
  drawChar(dt);
  drawOverlayLayer();
}
 
// ──────────────────────────────────────────────────────────────
//  2D UI 레이어
// ──────────────────────────────────────────────────────────────
function drawOverlayLayer() {
  uiLayer.clear();
  uiLayer.noStroke();
 
  for(let i=0;i<15;i++){
    uiLayer.fill(90, 55, 30, map(i,0,14,0,45));
    const o=map(i,0,14,0,160);
    uiLayer.rect(0, 0, CFG.W, o);
    uiLayer.rect(0, CFG.H-o, CFG.W, o);
    uiLayer.rect(0, 0, o, CFG.H);
    uiLayer.rect(CFG.W-o, 0, o, CFG.H);
  }
 
  // ★ 번쩍 효과
  if (flashAlpha > 0) {
    uiLayer.fill(flashColor[0], flashColor[1], flashColor[2], flashAlpha);
    uiLayer.rect(0, 0, CFG.W, CFG.H);
  }
 
  if(droppedItem && droppedItem.active && !viewerInteracting){
    uiLayer.fill(80,60,40,map(sin(gT*2),-1,1,80,190));
    uiLayer.textAlign(CENTER,CENTER); uiLayer.textSize(13);
  }
 
  if(surpriseActive && surpriseBubbleAlpha > 0){
    const bx = CFG.W/2 + 60;
    const by = CFG.H/2 - 120;
    const al = surpriseBubbleAlpha;
    uiLayer.fill(255,240,200,al);
    uiLayer.stroke(200,150,80,al); uiLayer.strokeWeight(2);
    uiLayer.rectMode(CENTER);
    uiLayer.rect(bx, by, 90, 44, 12);
    uiLayer.fill(255,240,200,al);
    uiLayer.triangle(bx-18, by+22, bx-8, by+36, bx+4, by+22);
    uiLayer.noStroke();
    uiLayer.fill(120,60,30,al);
    uiLayer.textAlign(CENTER,CENTER);
    uiLayer.textSize(16);
    uiLayer.textStyle(BOLD);
    uiLayer.textStyle(NORMAL);
    uiLayer.rectMode(CORNER);
  }
 
  push();
  resetMatrix(); camera(); noLights();
  if(typeof clearDepth==="function") clearDepth();
  imageMode(CENTER);
  image(uiLayer, 0, 0, width, height);
  pop();
 
  push();
  resetMatrix(); camera(); noLights();
  imageMode(CORNER);
  if(cursorImg) image(cursorImg, mouseX, mouseY);
  pop();
}
 
// ──────────────────────────────────────────────────────────────
//  마우스 이벤트
// ──────────────────────────────────────────────────────────────
function onMouseDown(e){
  if(audioCtx&&audioCtx.state==="suspended") audioCtx.resume();
  if(bgmSound&&!bgmSound.isPlaying()){ bgmSound.setLoop(true); bgmSound.setVolume(0.35); bgmSound.play(); }
 
  const rawX = mouseX / sf;
  const rawY = mouseY / sf;
  const centeredX = rawX - CFG.W / 2;
  const centeredY = rawY - CFG.H / 2;
 
  if(abs(centeredX) < 60 && abs(centeredY - 10) < 80){
    triggerSurpriseChar();
    return;
  }
 
  const vz = CFG.VIEWER_ZONE;
  if(abs(centeredX - vz.cx) < vz.hw && abs(centeredY - vz.cy) < vz.hh){
    if(droppedItem && droppedItem.active){ isDragging = true; dragStartX = rawX; dragStartY = rawY; }
    return;
  }
  const clicked = _detectFurniture(centeredX, centeredY);
  if(clicked){
    // ★ 달그락 나무 소리
    playSound("wood");
    furnitureShake[clicked]=1.0;
 
    if(lastClickedFurniture && lastClickedFurniture !== clicked){
      furnitureFaded[lastClickedFurniture] = false;
    }
    lastClickedFurniture = clicked;
    furnitureFaded[clicked] = true;
    pendingFurnitureAction = clicked;
 
    triggerSurpriseFurn();
  }
}
 
function onMouseMove(e){
  const rawX = mouseX / sf;
  const rawY = mouseY / sf;
  const centeredX = rawX - CFG.W / 2;
  const centeredY = rawY - CFG.H / 2;
 
  const vz = CFG.VIEWER_ZONE;
  cursorInViewerZone = abs(centeredX - vz.cx) < vz.hw && abs(centeredY - vz.cy) < vz.hh;
  hoveredFurniture = _detectFurniture(centeredX, centeredY);
 
  if(isDragging && droppedItem && droppedItem.active){
    const dx = rawX - dragStartX;
    const dy = rawY - dragStartY;
    if(sqrt(dx*dx + dy*dy) > 14 && !viewerInteracting){
      viewerInteracting = true;
      playSound(droppedItem.type==="book"?"book":droppedItem.type==="snack"?"snack":"cup");
    }
  }
}
 
function onMouseUp(e){
  isDragging = false;
  if(viewerInteracting){ if(droppedItem) droppedItem.fadeTimer=CFG.ITEM_FADE_TIME*0.7; viewerInteracting=false; }
}
 
function _detectFurniture(mx, my){
  for(const it of CFG.FURNITURE_HIT){
    if(dist(mx, my, it.x, it.y) < CFG.HIT_RADIUS) return it.name;
  }
  return null;
}
 
// ──────────────────────────────────────────────────────────────
//  ★ 강화된 놀람 반응 트리거
// ──────────────────────────────────────────────────────────────
function triggerSurpriseChar(){
  surpriseActive = true; surpriseType = "char";
  surpriseVariant = random();
  const dur = random(2.0, 3.0);
  surpriseTimer = dur; surpriseBubbleAlpha = 255;
  glanceViewer = true; glanceTimer = dur;
  joltActive = true; joltTimer = random(0.35, 0.55);
 
  // ★ 강한 흰 번쩍
  flashAlpha = 160 + random(0, 60);
  flashTimer = 0.18;
  flashColor = [255, 250, 220];
}
 
function triggerSurpriseFurn(){
  surpriseActive = true; surpriseType = "furn";
  surpriseVariant = random();
  const dur = random(1.2, 1.8);
  surpriseTimer = dur; surpriseBubbleAlpha = 0;
  glanceViewer = true;
  glanceTimer = dur + 0.3;
  glanceYaw = random(-0.22, 0.22);
  // ★ 약한 황금빛 번쩍
  joltActive = true;
  joltTimer = random(0.18, 0.30);
  flashAlpha = 70 + random(0, 40);
  flashTimer = 0.12;
  flashColor = [255, 230, 150];
}
 
// ──────────────────────────────────────────────────────────────
//  배경 렌더링
// ──────────────────────────────────────────────────────────────
function _pat(type,i,j,baseRGB){
  let[r,g,b]=baseRGB; const wR=245,wG=240,wB=230,mx=0.28;
  const lrp=(a,t,w)=>a+(w-a)*t;
  if(type==="stripe_v"&&i%2===0){r=lrp(r,mx,wR);g=lrp(g,mx,wG);b=lrp(b,mx,wB);}
  else if(type==="stripe_h"&&j%2===0){r=lrp(r,mx,wR);g=lrp(g,mx,wG);b=lrp(b,mx,wB);}
  else if(type==="check"){
    const h=i%2===0,v=j%2===0,m=h&&v?mx*1.3:h||v?mx*0.7:0;
    r=lrp(r,m,wR);g=lrp(g,m,wG);b=lrp(b,m,wB);
  }
  return[r,g,b];
}
 
function _bgFloorAndWall(){
  const{floorW,floorD,wallH}=CFG.ROOM; noStroke();
  const tW=floorW/10,tD=floorD/8, fc=color(CFG.COLOR.floor).levels;
  for(let xi=0;xi<10;xi++) for(let zi=0;zi<8;zi++){
    const v=noise(xi*0.35,zi*0.35)*24-12; fill(fc[0]+v,fc[1]+v*0.7,fc[2]+v*0.4);
    beginShape();
    vertex(-floorW/2+xi*tW,0,-floorD/2+zi*tD); vertex(-floorW/2+(xi+1)*tW,0,-floorD/2+zi*tD);
    vertex(-floorW/2+(xi+1)*tW,0,-floorD/2+(zi+1)*tD); vertex(-floorW/2+xi*tW,0,-floorD/2+(zi+1)*tD);
    endShape(CLOSE);
  }
  const wc=color(CFG.COLOR.wall).levels;
  for(let xi=0;xi<10;xi++){
    const x0=-floorW/2+xi*(floorW/10),sh=map(abs(xi-4.5),0,4.5,0.92,0.99); fill(wc[0]*sh,wc[1]*sh,wc[2]*sh);
    beginShape();
    vertex(x0,0,-floorD/2); vertex(x0+floorW/10,0,-floorD/2);
    vertex(x0+floorW/10,-wallH,-floorD/2); vertex(x0,-wallH,-floorD/2);
    endShape(CLOSE);
  }
}
 
function _bgWallFabrics(){
  noStroke();
  for(let wi=0;wi<CFG.WALL_FABRICS.length;wi++){
    const[x0,z0,x1,z1,yTop,yBot,colIdx,wave,alpha]=CFG.WALL_FABRICS[wi];
    const col=color(CFG.COLOR.fab[colIdx]).levels;
    const N=6; let pat="solid"; if(wi===1||wi===4||wi===7) pat="stripe_v"; if(wi===2||wi===6) pat="check";
    for(let i=0;i<N;i++){
      const t0=i/N,t1=(i+1)/N; let pts=[];
      for(let j=0;j<=1;j++){
        let t=j?t1:t0; let cx2=lerp(x0,x1,t),cz2=lerp(z0,z1,t);
        const wo=sin(t*PI*4+wi)*wave; cx2+=wo*0.3; cz2+=wo*0.7;
        pts.push({x:cx2,yTop:yTop+sin(t*PI)*15,yBot,z:cz2});
      }
      const sm=sin(t0*PI*2)*0.05+0.86; const[r,g,b]=_pat(pat,i,0,col);
      fill(r*sm,g*sm,b*sm,alpha);
      beginShape();
      vertex(pts[0].x,pts[0].yTop,pts[0].z); vertex(pts[1].x,pts[1].yTop,pts[1].z);
      vertex(pts[1].x,pts[1].yBot,pts[1].z); vertex(pts[0].x,pts[0].yBot,pts[0].z);
      endShape(CLOSE);
      stroke(col[0]-25,col[1]-25,col[2]-25,40); strokeWeight(0.5);
      line(pts[0].x,pts[0].yTop,pts[0].z,pts[0].x,pts[0].yBot,pts[0].z); noStroke();
    }
  }
}
 
function _bgDrapedFabrics(){
  for(let pi=0;pi<CFG.DRAPE_PANELS.length;pi++){
    const[cx,w,zFront,zBack,sag,colIdx,yTop,alpha,skew]=CFG.DRAPE_PANELS[pi];
    const col=color(CFG.COLOR.fab[colIdx]).levels;
    const N=7; let pat="solid"; if(pi===0||pi===3||pi===6) pat="check"; if(pi===2||pi===5) pat="stripe_h";
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      const u0=i/N,u1=(i+1)/N,v0=j/N,v1=(j+1)/N;
      const p00=_dPt(cx,w,zFront,zBack,yTop,sag,u0,v0,0,skew);
      const p10=_dPt(cx,w,zFront,zBack,yTop,sag,u1,v0,0,skew);
      const p11=_dPt(cx,w,zFront,zBack,yTop,sag,u1,v1,0,skew);
      const p01=_dPt(cx,w,zFront,zBack,yTop,sag,u0,v1,0,skew);
      const sm=sin(u0*PI*2.5+pi)*0.05+0.85; const[r,g,b]=_pat(pat,i,j,col);
      fill(r*sm,g*sm,b*sm,alpha); noStroke();
      beginShape();
      vertex(p00.x,p00.y,p00.z); vertex(p10.x,p10.y,p10.z);
      vertex(p11.x,p11.y,p11.z); vertex(p01.x,p01.y,p01.z);
      endShape(CLOSE);
    }
  }
}
 
function _dPt(cx,w,zF,zB,yT,sag,u,v,sw,skew){
  const us=u+sin(u*PI)*(skew*0.001);
  const x=cx-w/2+us*w+sw*sin(v*PI);
  const z=lerp(zF,zB,v);
  const pd=(u-(0.5+skew*0.002))*(u-(0.5+skew*0.002));
  const y=yT+sag*max(0,1-pd*4)*(1+u*0.15)+sag*0.35*sin(v*PI)+u*skew*0.3;
  return createVector(x,y,z);
}
 
function _bgFloorBedding(){
  const sorted=[...CFG.BEDDING_LAYERS].sort((a,b)=>a[1]-b[1]);
  for(let li=0;li<sorted.length;li++){
    const[x,z,rotY,w,d,thick,colIdx,type]=sorted[li];
    let pat="solid"; if(li===0) pat="check"; if(li===2||li===6) pat="stripe_v";
    const colHex=CFG.COLOR.bedding[colIdx];
    if(type==="crumple") _bgCrumple(x,z,rotY,w,d,thick,colHex,pat); else _bgFlat(x,z,rotY,w,d,thick,colHex,pat);
  }
  for(let pi=0;pi<CFG.PILLOWS.length;pi++){
    const[px,py,pz,rotY,colIdx,scl]=CFG.PILLOWS[pi];
    let pp="solid"; if(pi%3===1)pp="stripe"; if(pi%3===2)pp="check";
    _bgPillow(px,py,pz,rotY,CFG.COLOR.pillow[colIdx],scl,pp);
  }
}
 
function _bgFlat(x,z,rotY,w,d,thick,colHex,pat){
  const col=color(colHex).levels;
  push(); translate(x,-thick/2,z); rotateY(rotY); noStroke();
  fill(colHex); box(w,thick,d);
  if(pat!=="solid"){
    push(); translate(0,-thick/2-0.1,0); rotateX(HALF_PI);
    for(let xi=0;xi<6;xi++) for(let zi=0;zi<6;zi++){
      const[r,g,b]=_pat(pat,xi,zi,col); fill(r,g,b,150); rect(-w/2+xi*(w/6),-d/2+zi*(d/6),w/6,d/6);
    }
    pop();
  }
  fill(col[0]-15,col[1]-15,col[2]-15,160);
  push(); translate(0,0,d/2-4); box(w,thick*0.6,8); pop();
  push(); translate(0,0,-d/2+4); box(w,thick*0.5,6); pop();
  pop();
}
 
function _bgCrumple(x,z,rotY,w,d,thick,colHex,pat){
  const col=color(colHex).levels;
  push(); translate(x,0,z); rotateY(rotY); noStroke();
  for(let xi=0;xi<5;xi++) for(let zi=0;zi<4;zi++){
    const tw=w/5,td=d/4,bx=-w/2+xi*tw,bz=-d/2+zi*td;
    const h00=-noise(xi*0.8,zi*0.8,1)*thick*2, h10=-noise((xi+1)*0.8,zi*0.8,1)*thick*2;
    const h11=-noise((xi+1)*0.8,(zi+1)*0.8,1)*thick*2, h01=-noise(xi*0.8,(zi+1)*0.8,1)*thick*2;
    const br=map((h00+h10+h11+h01)/4,-thick*2.2,0,0.75,1.05);
    const[r,g,b]=_pat(pat,xi,zi,col); fill(r*br,g*br,b*br);
    beginShape(); vertex(bx,h00,bz); vertex(bx+tw,h10,bz); vertex(bx+tw,h11,bz+td); vertex(bx,h01,bz+td); endShape(CLOSE);
  }
  pop();
}
 
function _bgPillow(x,y,z,rotY,colHex,scl,pp){
  const col=color(colHex).levels;
  push(); translate(x,y,z); rotateY(rotY);
  const sfRot=sin(rotY)*15; fill(constrain(col[0]+sfRot,0,255),constrain(col[1]+sfRot,0,255),col[2]); noStroke();
  push(); scale(scl*1.1,scl*0.45,scl*0.9); sphere(28,6,5); pop();
  if(pp!=="solid"){
    const[r,g,b]=_pat(pp==="stripe"?"stripe_v":"check",2,2,col); fill(r,g,b,130);
    push(); scale(scl*1.12,scl*0.47,scl*0.92);
    if(pp==="check") torus(20,2.5,6,4); else{ rotateY(HALF_PI); torus(20,2.5,6,4); }
    pop();
  }
  pop();
}
 
// ──────────────────────────────────────────────────────────────
//  조명 및 사운드
// ──────────────────────────────────────────────────────────────
function applyLights(){
  const lt=lampT, F=CFG.FURNITURE;
  pointLight(floor(255*lt),floor(210*lt),floor(120*lt), F.lamp[0],F.lamp[1]-80,F.lamp[2]+40);
  const amb=color(CFG.COLOR.ambientIn); const sc=0.55+0.45*lt;
  ambientLight(floor(amb.levels[0]*sc),floor(amb.levels[1]*sc),floor(amb.levels[2]*sc));
  pointLight(floor(240*(0.5+0.5*lt)),floor(225*(0.5+0.5*lt)),floor(200*(0.5+0.5*lt)),400,-600,-150);
  const sun=color(CFG.COLOR.sunColor);
  directionalLight(floor(sun.levels[0]*sc),floor(sun.levels[1]*sc),floor(sun.levels[2]*sc),-0.4,0.6,-0.4);
}
 
function playSound(type){
  if(!audioCtx) return;
  if(audioCtx.state==="suspended") audioCtx.resume();
  const now=audioCtx.currentTime;
 
  if(type==="wood"){
    // ★ 달그락 나무 소리: 고주파 타격음 + 공명 + 잔향
    // 첫 번째 타격 (딱!)
    const buf1=audioCtx.createBuffer(1,audioCtx.sampleRate*0.08,audioCtx.sampleRate);
    const d1=buf1.getChannelData(0);
    for(let i=0;i<d1.length;i++){
      const decay=Math.exp(-i/(audioCtx.sampleRate*0.008));
      d1[i]=(Math.random()*2-1)*decay;
    }
    const src1=audioCtx.createBufferSource();
    const bp1=audioCtx.createBiquadFilter(); bp1.type="bandpass"; bp1.frequency.value=1800; bp1.Q.value=2.5;
    const hp1=audioCtx.createBiquadFilter(); hp1.type="highpass"; hp1.frequency.value=600;
    const g1=audioCtx.createGain(); g1.gain.setValueAtTime(0.7, now); g1.gain.exponentialRampToValueAtTime(0.001, now+0.09);
    src1.buffer=buf1; src1.connect(bp1); bp1.connect(hp1); hp1.connect(g1); g1.connect(audioCtx.destination);
    src1.start(now);
 
    // 두 번째 달그락 (그르르)
    const buf2=audioCtx.createBuffer(1,audioCtx.sampleRate*0.12,audioCtx.sampleRate);
    const d2=buf2.getChannelData(0);
    for(let i=0;i<d2.length;i++){
      const decay=Math.exp(-i/(audioCtx.sampleRate*0.025));
      d2[i]=(Math.random()*2-1)*decay;
    }
    const src2=audioCtx.createBufferSource();
    const bp2=audioCtx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=900; bp2.Q.value=3.0;
    const g2=audioCtx.createGain(); g2.gain.setValueAtTime(0.45, now+0.04); g2.gain.exponentialRampToValueAtTime(0.001, now+0.18);
    src2.buffer=buf2; src2.connect(bp2); bp2.connect(g2); g2.connect(audioCtx.destination);
    src2.start(now+0.04);
 
    // 세 번째 잔향 (락락)
    const buf3=audioCtx.createBuffer(1,audioCtx.sampleRate*0.06,audioCtx.sampleRate);
    const d3=buf3.getChannelData(0);
    for(let i=0;i<d3.length;i++){
      const decay=Math.exp(-i/(audioCtx.sampleRate*0.012));
      d3[i]=(Math.random()*2-1)*decay;
    }
    const src3=audioCtx.createBufferSource();
    const bp3=audioCtx.createBiquadFilter(); bp3.type="bandpass"; bp3.frequency.value=1400; bp3.Q.value=2.0;
    const g3=audioCtx.createGain(); g3.gain.setValueAtTime(0.3, now+0.10); g3.gain.exponentialRampToValueAtTime(0.001, now+0.22);
    src3.buffer=buf3; src3.connect(bp3); bp3.connect(g3); g3.connect(audioCtx.destination);
    src3.start(now+0.10);
 
    // 나무 공명음 (오실레이터)
    const osc=audioCtx.createOscillator(); const gOsc=audioCtx.createGain();
    osc.type="triangle"; osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now+0.15);
    gOsc.gain.setValueAtTime(0.12, now); gOsc.gain.exponentialRampToValueAtTime(0.001, now+0.2);
    osc.connect(gOsc); gOsc.connect(audioCtx.destination);
    osc.start(now); osc.stop(now+0.22);
 
  } else if(type==="step"){
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.06,audioCtx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(audioCtx.sampleRate*0.012));
    const src=audioCtx.createBufferSource(), g=audioCtx.createGain();
    g.gain.value=0.40;
    const f=audioCtx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=480;
    src.buffer=buf; src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start(now);
  } else if(type==="book"){
    for(let r=0;r<4;r++){
      const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.07,audioCtx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(audioCtx.sampleRate*0.025));
      const src=audioCtx.createBufferSource(), g=audioCtx.createGain();
      g.gain.value=0.12; const f=audioCtx.createBiquadFilter(); f.type="highpass"; f.frequency.value=2500;
      src.buffer=buf; src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start(now+r*0.11);
    }
  } else if(type==="snack"){
    for(let r=0;r<3;r++){
      const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.09,audioCtx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(audioCtx.sampleRate*0.018));
      const src=audioCtx.createBufferSource(), g=audioCtx.createGain();
      g.gain.value=0.22; const f=audioCtx.createBiquadFilter(); f.type="peaking"; f.frequency.value=700; f.gain.value=8;
      src.buffer=buf; src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start(now+r*0.17);
    }
  } else if(type==="cup"){
    for(let r=0;r<3;r++){
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type="sine"; o.frequency.value=1100+r*280;
      g.gain.setValueAtTime(0.13,now+r*0.14); g.gain.exponentialRampToValueAtTime(0.001,now+r*0.14+0.45);
      o.connect(g); g.connect(audioCtx.destination); o.start(now+r*0.14); o.stop(now+r*0.14+0.45);
    }
  } else if(type==="sing"){
    const notes=[440,494,523,587,523,494,440];
    for(let ni=0;ni<notes.length;ni++){
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type="sine"; o.frequency.value=notes[ni];
      const t0=now+ni*0.18;
      g.gain.setValueAtTime(0,t0);
      g.gain.linearRampToValueAtTime(0.1,t0+0.05);
      g.gain.linearRampToValueAtTime(0.08,t0+0.12);
      g.gain.linearRampToValueAtTime(0,t0+0.18);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0); o.stop(t0+0.2);
    }
  }
}
 
// ──────────────────────────────────────────────────────────────
//  루틴 & 캐릭터 업데이트
// ──────────────────────────────────────────────────────────────
function shuffleRoutines(){
  routineQueue=[...ROUTINES];
  for(let i=routineQueue.length-1;i>0;i--){
    const j=floor(random(i+1));
    [routineQueue[i],routineQueue[j]]=[routineQueue[j],routineQueue[i]];
  }
  routineIdx=0;
}
 
function startNextRoutine(){
  if(pendingFurnitureAction){
    currentRoutine=pendingFurnitureAction; pendingFurnitureAction=null;
  } else {
    if(routineIdx>=routineQueue.length) shuffleRoutines();
    currentRoutine=routineQueue[routineIdx++];
  }
  routineState="moving"; routineSubState="start"; routineSubTimer=0;
  const pos=CFG.ROUTINE_POS[currentRoutine]||CFG.ROUTINE_POS.plant;
  tgtX=pos[0]; tgtZ=pos[1]; moving=true;
 
  stuckFrames = 0;
  nudgeOffset = { x: 0, z: 0 };
 
  const dx=tgtX-curX, dz=tgtZ-curZ;
  const d=sqrt(dx*dx+dz*dz);
  if(d > 150) nextDanceIn = random(0.5, d/120);
  else nextDanceIn = 9999;
  danceTimer=0; dancePrg=0; singTimer=0; singActive=false;
}
 
function updateRoutine(dt){
  if(routineState==="moving"){
    if(moving){
      danceTimer += dt;
      if(danceTimer >= nextDanceIn && dancePrg === 0 && !singActive){
        danceDuration = random(1.5, 2.8);
        dancePhase = 0;
        dancePrg = 0.01;
        singTimer = 0;
        singActive = true;
        playSound("sing");
      }
      if(dancePrg > 0){
        dancePhase += dt * 6;
        dancePrg += dt / danceDuration;
        if(dancePrg >= 1){ dancePrg = 0; singActive = false; nextDanceIn = 9999; }
      }
    } else {
      dancePrg = 0; singActive = false;
    }
    if(!moving){
      if(furnitureFaded[currentRoutine]) furnitureFaded[currentRoutine]=false;
      routineState="acting"; routineSubState="start"; routineSubTimer=0;
      startGlance("viewer");
    }
  } else if(routineState==="acting"){
    routineSubTimer+=dt;
    _doAct();
  } else if(routineState==="delivering"){ _doDeliver(dt); }
  else if(routineState==="returning"){ if(!moving) routineState="idle"; }
}
 
function _doAct(){
  const r=currentRoutine;
 
  if(r==="mirror"){
    if(routineSubState==="start"){ routineSubState="spin"; spinAngle=bodyAngle; }
    if(routineSubState==="spin"){
      spinAngle += 0.07;
      if(routineSubTimer > 2.0){
        // ★ 몸통 색만 변경 (팔다리 제외)
        currentBodyColor = CFG.COLOR.bodyColors[floor(random(CFG.COLOR.bodyColors.length))];
        bodyColorFlashT = 1.0; // 색변환 번쩍 효과
        routineSubState = "done";
      }
    }
    if(routineSubState==="done" && routineSubTimer > 4.0) routineState="idle";
 
  } else if(r==="shelf"){
    if(routineSubState==="start"){ handItem="book"; routineSubState="reading"; }
    if(routineSubState==="reading" && routineSubTimer > 10){
      routineState="delivering"; routineSubTimer=0;
      const pos=CFG.ROUTINE_POS.viewer;
      tgtX=pos[0]; tgtZ=pos[1]; moving=true;
      stuckFrames=0; nudgeOffset={x:0,z:0};
    }
 
  } else if(r==="bowl"){
    if(routineSubState==="start"){ handItem="snack"; routineSubState="eating"; }
    if(routineSubState==="eating" && routineSubTimer > 10){
      routineState="delivering"; routineSubTimer=0;
      const pos=CFG.ROUTINE_POS.viewer;
      tgtX=pos[0]; tgtZ=pos[1]; moving=true;
      stuckFrames=0; nudgeOffset={x:0,z:0};
    }
 
  } else if(r==="teacup"){
    if(routineSubState==="start"){ handItem="cup"; routineSubState="drinking"; }
    if(routineSubState==="drinking" && routineSubTimer > 10){
      routineState="delivering"; routineSubTimer=0;
      const pos=CFG.ROUTINE_POS.viewer;
      tgtX=pos[0]; tgtZ=pos[1]; moving=true;
      stuckFrames=0; nudgeOffset={x:0,z:0};
    }
 
  } else if(r==="plant"){
    if(routineSubState==="start") routineSubState="caring";
    if(routineSubTimer > 8) routineState="idle";
 
  } else if(r==="lamp"){
    if(routineSubState==="start"){ lampOn=false; routineSubState="off"; }
    if(routineSubState==="off" && routineSubTimer > 1.5){ lampOn=true; routineState="idle"; }
 
  } else if(r==="radio"){
    if(routineSubState==="start"){
      radioOn=!radioOn;
      playSound("wood");
      // ★ BGM 1초 후 처음부터 재시작
      if(bgmSound && bgmSound.isPlaying()){
        bgmSound.stop();
      }
      radioRestartTimer = 1.0;
      routineState="idle";
    }
  }
}
 
function _doDeliver(dt){
  routineSubTimer+=dt;
  if(!moving){
    if(handItem&&!droppedItem){
      const off = CFG.DROP_OFFSET[handItem] || [0, -25];
      droppedItem={
        type:handItem,
        x:curX + off[0],
        z:curZ + off[1],
        alpha:255,
        fadeTimer:0,
        active:true
      };
      handItem=null;
      startGlance("viewer");
    }
    if(routineSubTimer>2){
      routineState="returning"; routineSubTimer=0;
      const pos=CFG.ROUTINE_POS[currentRoutine]||CFG.ROUTINE_POS.plant;
      tgtX=pos[0]; tgtZ=pos[1]; moving=true;
      stuckFrames=0; nudgeOffset={x:0,z:0};
    }
  }
}
 
function _moveCharacter(dt) {
  if (!moving) return;
 
  const moveDist = dist(curX, curZ, lastCurX, lastCurZ);
  if (moveDist < 0.3) {
    stuckFrames++;
  } else {
    stuckFrames = 0;
    nudgeOffset = { x: 0, z: 0 };
  }
  lastCurX = curX;
  lastCurZ = curZ;
 
  if (stuckFrames > CFG.NAV_MAX_STUCK_FRAMES) {
    stuckFrames = 0;
    nudgeOffset.x = random(-40, 40);
    nudgeOffset.z = random(-30, 30);
  }
 
  const effTgtX = tgtX + nudgeOffset.x * 0.5;
  const effTgtZ = tgtZ + nudgeOffset.z * 0.5;
 
  let dx = effTgtX - curX;
  let dz = effTgtZ - curZ;
  const d = sqrt(dx * dx + dz * dz);
  const speed = CFG.CHAR.walkSpeed * 60 * dt;
 
  if (d < speed + 2) {
    curX = tgtX; curZ = tgtZ;
    moving = false; walkPhase = 0;
    stuckFrames = 0; nudgeOffset = { x: 0, z: 0 };
    return;
  }
 
  let mx = (dx / d) * speed;
  let mz = (dz / d) * speed;
 
  let repX = 0, repZ = 0;
  for (const obs of CFG.NAV_OBSTACLES) {
    const ox = obs[0], oz = obs[1], r = obs[2] + 18;
    const ex = curX - ox, ez = curZ - oz;
    const od = sqrt(ex * ex + ez * ez);
    if (od < r && od > 0.001) {
      const ov = (r - od) / r;
      repX += (ex / od) * ov * CFG.NAV_PUSH_STRENGTH * speed * 2.2;
      repZ += (ez / od) * ov * CFG.NAV_PUSH_STRENGTH * speed * 2.2;
    }
  }
 
  curX += mx + repX;
  curZ += mz + repZ;
 
  walkPhase += dt * CFG.CHAR.walkBobFreq;
 
  const stepInterval = 0.50;
  if (gT - lastStepTime > stepInterval) {
    lastStepTime = gT;
    playSound("step");
  }
}
 
function updateCharacter(dt){
  if(surpriseActive){
    surpriseTimer -= dt;
    if(surpriseType === "char"){
      surpriseBubbleAlpha = map(surpriseTimer, 0.4, 0, 255, 0, true);
    }
    if(surpriseTimer <= 0){ surpriseActive=false; surpriseBubbleAlpha=0; }
  }
  if(joltActive){
    joltTimer -= dt;
    if(joltTimer <= 0) joltActive = false;
  }
 
  // ★ 번쩍 효과 페이드
  if(flashTimer > 0){
    flashTimer -= dt;
    flashAlpha = map(flashTimer, 0, 0.18, 0, flashAlpha, true);
    if(flashTimer <= 0){ flashAlpha = 0; }
  }
 
  // ★ 몸통 색 전환 번쩍
  if(bodyColorFlashT > 0){
    bodyColorFlashT = max(0, bodyColorFlashT - dt * 2.5);
  }
 
  _moveCharacter(dt);
 
  let tba = bodyAngle;
  if (moving) {
    const dx = tgtX - curX, dz = tgtZ - curZ;
    if (sqrt(dx*dx+dz*dz) > 2) {
      tba = atan2(dx, dz);
    }
  } else if (glanceViewer) {
    tba = atan2(0 - curX, 400 - curZ) + glanceYaw;
  } else if (currentRoutine === "mirror" && routineSubState === "spin") {
    bodyAngle = spinAngle;
  } else if (routineState === "acting") {
    const fp = CFG.FURNITURE[currentRoutine];
    if (fp) {
      const toFurn   = atan2(fp[0]-curX, fp[2]-curZ);
      const toViewer = atan2(0-curX, 400-curZ);
      let diff = toViewer - toFurn;
      while(diff>PI) diff-=TWO_PI; while(diff<-PI) diff+=TWO_PI;
      tba = toFurn + diff * 0.35;
    }
  }
 
  if (!(currentRoutine === "mirror" && routineSubState === "spin")) {
    const turnMult = moving ? 1.0 : 0.6;
    bodyAngle = lerpAngle(bodyAngle, tba, dt * CFG.CHAR.turnSpeed * turnMult);
  }
 
  sitPrg += ((0) - sitPrg) * dt * 3;
 
  const shouldLift = routineState === "acting" &&
    ((currentRoutine === "teacup" && routineSubState === "drinking") ||
     (currentRoutine === "bowl"   && routineSubState === "eating") ||
     (currentRoutine === "shelf"  && routineSubState === "reading"));
  liftPrg += ((shouldLift ? 1 : 0) - liftPrg) * dt * 3;
 
  if(blinkPh===0&&gT-lastBlink>CFG.CHAR.blinkInterval){ blinkPh=1; blinkT=0; lastBlink=gT; }
  if(blinkPh===1){ blinkT+=dt*6; eyelid=min(blinkT,1); if(eyelid>=1){blinkPh=2;blinkT=0;} }
  else if(blinkPh===2){ blinkT+=dt*6; eyelid=max(1-blinkT,0); if(eyelid<=0){blinkPh=0;eyelid=0;} }
 
  if(droppedItem&&droppedItem.active){
    droppedItem.fadeTimer+=dt*1000;
    if(droppedItem.fadeTimer>CFG.ITEM_FADE_TIME){ droppedItem.active=false; droppedItem=null; }
    else { droppedItem.alpha = map(droppedItem.fadeTimer, 0, CFG.ITEM_FADE_TIME, 255, 0); }
  }
 
  for(const k in furnitureShake){
    furnitureShake[k]=max(0,furnitureShake[k]-dt*2.5);
    if(furnitureShake[k]<=0) delete furnitureShake[k];
  }
 
  if(glanceTimer>0){ glanceTimer-=dt; if(glanceTimer<=0){ glanceViewer=false; glanceYaw=0; } }
  updateRoutine(dt);
 
  prevMoving = moving;
}
 
function lerpAngle(a,b,t){
  let d=b-a; while(d>PI)d-=TWO_PI; while(d<-PI)d+=TWO_PI; return a+d*t;
}
function startGlance(target){ glanceViewer=target==="viewer"; glanceTimer=1.5; }
 
// ──────────────────────────────────────────────────────────────
//  캐릭터 렌더링
// ──────────────────────────────────────────────────────────────
function drawChar(dt){
  const c=CFG.COLOR.char, ch=CFG.CHAR;
  let lLegR=0,rLegR=0,lArmZ=0.4,rArmZ=-0.4;
  let lArmFwd=0,rArmFwd=0,lArmUp=0,rArmUp=0;
  let bOffY=0,legOffY=0,pupilR=12,browOff=0,browL=-0.3,browR_=0.3;
  let mOpen=0,headBob=0,headYaw=0,nodPrg=0;
  let antR=sin(gT*3)*0.15;
 
  // ★ 강화된 표정 변수
  let eyeScale=1.0;
  let eyeSquintX = 1.0; // 눈 가로 좁힘 (놀람 반대)
  let bodySquash = 1.0, bodyStretch = 1.0;
  let browTiltL = 0, browTiltR = 0; // 눈썹 기울기 개별 제어
  let browRaiseL = 0, browRaiseR = 0; // 눈썹 높이 개별 제어
  let mCornerPull = 0; // 입꼬리 (양수=올라감)
  let headTilt = 0; // 머리 기울기 (Z축)
  let skinFlush = 0; // 얼굴 붉히기 0~1
 
  if(surpriseActive && surpriseTimer > 0){
    const totalDur = surpriseType === "char" ? random(2.0, 3.0) : random(1.2, 1.8);
    const sp = min(surpriseTimer / 0.5, 1.0);
    const rv = surpriseVariant;
 
    if(surpriseType === "char"){
      // ★★ 캐릭터 클릭: 깜짝 놀람 최대 강도
      eyeScale = 1.0 + sp * (0.7 + rv * 0.4);        // 눈 엄청 크게
      mOpen = sp * (20 + rv * 16);                    // 입 크게 벌림
      browRaiseL = -sp * (12 + rv * 10);              // 눈썹 확 올라감
      browRaiseR = -sp * (12 + rv * 10);
      browTiltL = sp * (rv > 0.5 ? -0.4 : 0.2);      // 눈썹 비대칭 기울기
      browTiltR = sp * (rv > 0.5 ? 0.2 : -0.4);
      headTilt = sp * (0.08 + rv * 0.12) * (rv > 0.5 ? 1 : -1);
      headYaw = sp * (0.10 + rv * 0.18) * (rv > 0.5 ? 1 : -1);
      bodySquash = 1.0 - sp * (0.08 + rv * 0.06);
      bodyStretch = 1.0 + sp * (0.06 + rv * 0.05);
      skinFlush = sp * 0.7;
    } else {
      // ★★ 가구 클릭: 살짝 놀람 + 의아함
      eyeScale = 1.0 + sp * (0.22 + rv * 0.18);
      mOpen = sp * (4 + rv * 6);                      // 입 살짝 벌어짐
      browRaiseL = -sp * (4 + rv * 5);
      browRaiseR = -sp * (8 + rv * 6);                // 한쪽 눈썹 더 올라감
      browTiltL = sp * 0.15;
      browTiltR = -sp * (0.2 + rv * 0.2);             // 의아함 표정
      headTilt = sp * 0.06 * (rv > 0.5 ? 1 : -1);
    }
  }
 
  let joltOffY = 0, joltOffX = 0, joltScaleY = 1.0;
  if(joltActive && joltTimer > 0){
    const joltDur = surpriseType === "char" ? 0.45 : 0.26;
    const jp = min(joltTimer / joltDur, 1.0);
    // ★ 캐릭터: 크게 튀어오름 / 가구: 살짝 튀어오름
    const jumpH = surpriseType === "char"
      ? (18 + surpriseVariant * 12)
      : (8 + surpriseVariant * 6);
    joltOffY = -sin(jp * PI) * jumpH;
    joltOffX = sin(jp * PI * 2.5) * (3 + surpriseVariant * 4);
    joltScaleY = 1.0 + sin(jp * PI) * (surpriseType === "char" ? 0.10 : 0.05);
    // 착지 눌림
    if(jp < 0.15){
      bodySquash = min(bodySquash, 1.0 - (0.15 - jp) * 0.5);
      bodyStretch = max(bodyStretch, 1.0 - (0.15 - jp) * 0.3);
    }
  }
 
  if(dancePrg > 0 && dancePrg < 1){
    const dp = dancePhase;
    bOffY += sin(dp*2)*12 + abs(sin(dp*3))*6;
    lArmFwd = abs(sin(dp))*1.1;
    rArmFwd = abs(cos(dp))*1.1;
    lArmZ = sin(dp*1.5)*0.5 + 0.3;
    rArmZ = -sin(dp*1.5)*0.5 - 0.3;
    headYaw += sin(dp*2)*0.3;
    if(singActive) mOpen = max(mOpen, (sin(dp*4)*0.5+0.5)*14);
  }
 
  if(moving){
    const wt=walkPhase;
    lLegR+=sin(wt)*0.55; rLegR-=sin(wt)*0.55;
    bOffY+=abs(sin(wt))*ch.walkBobAmp*0.45;
    headBob+=abs(sin(wt))*1.8;
    lArmFwd=abs(sin(wt+PI))*0.28; rArmFwd=abs(sin(wt))*0.28;
  }
 
  if(liftPrg>0.01){
    rArmFwd = constrain(liftPrg * 1.3, 0, PI * 0.55);
    rArmZ = -0.1;
    lArmFwd = constrain(liftPrg * 0.9, 0, PI * 0.45);
    lArmZ = 0.1;
  }
  if(currentRoutine==="shelf"&&routineSubState==="reading"&&liftPrg>0.01){
    lArmFwd=0.9; lArmZ=0.08;
    rArmFwd=0.9; rArmZ=-0.08;
    headYaw += -0.15;
  }
  if(currentRoutine==="mirror"&&routineSubState==="spin"&&routineState==="acting"){
    const at=routineSubTimer*1.2; lArmZ=0.05; rArmZ=-0.05;
    lArmFwd=1.0+abs(sin(at))*0.2; rArmFwd=1.0+abs(cos(at))*0.2;
  }
  if(currentRoutine==="plant"&&routineSubState==="caring"){
    const pt=routineSubTimer*2.2;
    lArmFwd=0.7+sin(pt)*0.18; rArmFwd=0.7+cos(pt)*0.18; nodPrg=sin(pt*1.4)*0.28;
  }
  if((currentRoutine==="teacup"||currentRoutine==="bowl")&&routineState==="acting"&&routineSubState!=="start")
    if(!surpriseActive) mOpen=max(mOpen, (sin(gT*2.2)*0.5+0.5)*10);
 
  lArmFwd=max(lArmFwd,0); rArmFwd=max(rArmFwd,0);
 
  // ★ 몸통 색 번쩍 (거울 옷 갈아입기)
  let renderBodyColor = currentBodyColor;
  if(bodyColorFlashT > 0){
    const flashBlend = sin(bodyColorFlashT * PI * 3) * bodyColorFlashT;
    const bc = color(currentBodyColor).levels;
    const r_ = floor(bc[0] + flashBlend * (255 - bc[0]));
    const g_ = floor(bc[1] + flashBlend * (255 - bc[1]));
    const b_ = floor(bc[2] + flashBlend * (200 - bc[2]));
    renderBodyColor = color(r_, g_, b_);
  }
 
  push();
  translate(curX + joltOffX, ch.floorY + joltOffY, curZ);
  rotateY(bodyAngle);
  scale(ch.scale * bodyStretch, ch.scale * bodySquash * joltScaleY, ch.scale);
  noStroke();
 
  // ★ 팔다리는 스킨 색 고정
  _leg(-9,bOffY+legOffY,lLegR,c.skin,c.joint);
  _leg( 9,bOffY+legOffY,rLegR,c.skin,c.joint);
 
  // 왼팔
  push(); translate(-26,-20+bOffY,0);
  rotateZ(lArmZ); rotateX(lArmFwd); rotateY(lArmUp);
  fill(c.skin); box(10,14,10);
  fill(c.joint); push(); translate(0,8.5,0); box(12,3,12); pop();
  if(currentRoutine==="shelf"&&routineSubState==="reading"&&liftPrg>0.01){
    const io = CFG.HAND_ITEM_OFFSET.book;
    push();
    translate(io.x, io.y, io.z);
    rotateX(io.rx); rotateY(io.ry); rotateZ(io.rz);
    scale(io.scale);
    drawModelOpenBook(255);
    pop();
  }
  pop();
 
  // 오른팔
  push(); translate(26,-20+bOffY,0);
  rotateZ(rArmZ); rotateX(rArmFwd); rotateY(rArmUp);
  fill(c.skin); box(10,14,10);
  fill(c.joint); push(); translate(0,8.5,0); box(12,3,12); pop();
  if(liftPrg>0.05){
    const itemType = handItem || (currentRoutine === "bowl" ? "snack" : currentRoutine === "teacup" ? "cup" : null);
    const io = CFG.HAND_ITEM_OFFSET[itemType] || CFG.HAND_ITEM_OFFSET.cup;
    push();
    translate(io.x, io.y, io.z);
    rotateX(io.rx); rotateY(io.ry); rotateZ(io.rz);
    scale(io.scale);
    if(handItem==="snack"||currentRoutine==="bowl"){
      drawModelSnack(255);
    } else if(handItem==="cup"||currentRoutine==="teacup"){
      drawModelCup(255);
    }
    pop();
  }
  pop();
 
  // ★ 몸통만 renderBodyColor 사용
  push(); fill(renderBodyColor); translate(0,-20+bOffY,0); cylinder(20,30,12,1); pop();
 
  // 머리
  push();
  translate(0,-61+bOffY+headBob,0); rotateY(headYaw); rotateX(nodPrg); rotateZ(headTilt);
 
  // ★ 얼굴 붉히기
  const skinR = color(c.skin).levels;
  fill(
    min(255, skinR[0] + skinFlush * 30),
    max(0, skinR[1] - skinFlush * 20),
    max(0, skinR[2] - skinFlush * 15)
  );
  push(); translate(0,0,4); sphere(48,6,3); pop();
 
  // ★ 눈썹: 개별 높이+기울기 제어
  fill(c.brow);
  push(); translate(-18, -24 + browOff + browRaiseL, 43); rotateZ(browL + browTiltL); box(10,7,6); pop();
  push(); translate( 18, -24 + browOff + browRaiseR, 43); rotateZ(browR_ + browTiltR); box(10,7,6); pop();
 
  // 눈
  push(); translate(0,-7,44);
  fill(255); push(); rotateX(HALF_PI); cylinder(18*eyeScale,4,8,1); pop();
  fill(c.pupil); push(); rotateX(HALF_PI); translate(0,1,0.5); cylinder(pupilR*eyeScale,4,9,1); pop();
  fill(255); push(); rotateX(HALF_PI); translate(-3,2,1); cylinder(4,3,6,1); pop();
  if(eyelid>0){ fill(c.skin); const lh=36*eyelid; push(); translate(0,-18+lh*0.5,2); box(38,lh+0.5,5); pop(); }
  pop();
 
  // ★ 입: mCornerPull로 입꼬리 제어 가능하게
  fill(40);
  push(); translate(0,27,45); box(28,1,2); pop();
  if(mOpen>0.5){
    push(); fill(40); translate(0,27+mOpen,45); box(28,1,2); pop();
    push(); fill(80,20,20); translate(0,27+mOpen*0.5,45); box(26,mOpen,2); pop();
    // 치아
    fill(240,235,230);
    push(); translate(0, 27+mOpen*0.15, 45.5); box(22, mOpen*0.25, 1.5); pop();
  }
  // 입꼬리 올라감 표현
  if(mCornerPull > 0.5){
    fill(40);
    push(); translate(-13, 27 - mCornerPull, 45); rotateZ(-0.3); box(5,2,2); pop();
    push(); translate( 13, 27 - mCornerPull, 45); rotateZ( 0.3); box(5,2,2); pop();
  }
  fill(255);
  push(); translate(-10,29.5,46); cone(3,5,4); pop();
  push(); translate( 10,29.5,46); cone(3,5,4); pop();
 
  // 더듬이
  push(); fill(c.ant); translate(0,-48,0);
  rotateZ(antR*0.05); box(6,6,6);
  translate(0,-10,-2); rotateZ(antR*0.3); box(6,6,6);
  translate(0,-8,-6); rotateX(-0.4); rotateZ(antR*0.7); box(6,6,6);
  translate(0,-2,-10); rotateX(-0.6); rotateZ(antR*1.2); box(6,6,6);
  translate(0,7,-8); rotateZ(antR*1.8); box(6,5,6); pop();
  pop(); pop();
}
 
function _leg(x,offY,rotX,cSkin,cJoint){
  push(); translate(x,-7.5+offY,0); rotateX(rotX);
  fill(cSkin); box(14,15,12);
  fill(cJoint); push(); translate(0,9,0); box(16,3,14); pop();
  pop();
}
 
// ──────────────────────────────────────────────────────────────
//  아이템 모델 함수
// ──────────────────────────────────────────────────────────────
function drawModelOpenBook(a) {
  const prevAlpha = drawingContext.globalAlpha;
  drawingContext.globalAlpha = (a / 255) * prevAlpha;
  push(); noStroke();
  const coverColor = color('#9F565B');
  const pageColor  = color('#FFFFFF');
  const bw = 17, bh = 22, bt = 5, openAngle = -0.55;
  push(); rotateY(-openAngle); translate(-bw/2,0,0);
  fill(coverColor.levels[0],coverColor.levels[1],coverColor.levels[2],a); box(bw,bh,bt);
  push(); translate(0,0,bt*0.5+0.3); fill(pageColor.levels[0],pageColor.levels[1],pageColor.levels[2],a); box(bw*0.9,bh*0.92,0.5); pop();
  fill(180,170,160,a*0.5);
  for(let li=-2;li<=2;li++){ push(); translate(0,li*3,bt*0.5+0.6); box(bw*0.68,0.6,0.3); pop(); }
  pop();
  push(); rotateY(openAngle); translate(bw/2,0,0);
  fill(coverColor.levels[0],coverColor.levels[1],coverColor.levels[2],a); box(bw,bh,bt);
  push(); translate(0,0,bt*0.5+0.3); fill(pageColor.levels[0],pageColor.levels[1],pageColor.levels[2],a); box(bw*0.9,bh*0.92,0.5); pop();
  fill(180,170,160,a*0.5);
  for(let li=-2;li<=2;li++){ push(); translate(0,li*3,bt*0.5+0.6); box(bw*0.68,0.6,0.3); pop(); }
  pop();
  fill(80,40,44,a); push(); rotateY(HALF_PI); box(bt,bh,2); pop();
  pop();
  drawingContext.globalAlpha = prevAlpha;
}
 
function drawModelBook(a) {
  const prevAlpha = drawingContext.globalAlpha;
  drawingContext.globalAlpha = (a / 255) * prevAlpha;
  push(); noStroke();
  const coverColor = color('#3C4F6A');
  const pageColor  = color('#F1FAEE');
  const bw=34, bh=24, bt=10, coverDepth=1.5;
  fill(pageColor.levels[0],pageColor.levels[1],pageColor.levels[2],a);
  box(bw-coverDepth*2,bh-coverDepth*2,bt-coverDepth*2);
  fill(coverColor.levels[0],coverColor.levels[1],coverColor.levels[2],a);
  push(); translate(0,0,bt/2-coverDepth/2); box(bw,bh,coverDepth); pop();
  push(); translate(0,0,-bt/2+coverDepth/2); box(bw,bh,coverDepth); pop();
  push(); translate(-bw/2+coverDepth/2,0,0); box(coverDepth,bh,bt); pop();
  fill(180,200,220,a*0.7);
  push(); translate(bw*0.1,-bh*0.15,bt/2-coverDepth+0.3); box(bw*0.55,1.2,0.5); pop();
  push(); translate(bw*0.1, bh*0.05,bt/2-coverDepth+0.3); box(bw*0.4, 0.8,0.5); pop();
  pop();
  drawingContext.globalAlpha = prevAlpha;
}
 
function drawModelSnack(a) {
  const prevAlpha = drawingContext.globalAlpha;
  drawingContext.globalAlpha = (a / 255) * prevAlpha;
  push(); noStroke();
  const radius=16, thickness=5, resolution=8;
  fill(219,197,142,a); push(); rotateX(HALF_PI); cylinder(radius,thickness,resolution,1); pop();
  fill(235,215,165,a); push(); rotateX(HALF_PI); translate(0,0,-thickness*0.5); cylinder(radius*0.95,0.8,resolution,1); pop();
  fill(43,45,66,a);
  const chipCount=5, chipDist=radius*0.55;
  for(let i=0;i<chipCount;i++){
    const ang=(TWO_PI/chipCount)*i;
    push(); translate(cos(ang)*chipDist,sin(ang)*chipDist,-(thickness/2+0.5)); box(3,3,1.5); pop();
  }
  pop();
  drawingContext.globalAlpha = prevAlpha;
}
 
function drawModelCup(a){
  push(); noStroke();
  fill(188,172,150,a); push(); cylinder(13,3,7); pop();
  const segs=5, rings=[[-3,8,1.0],[-9,11,0.95],[-16,12,0.9],[-22,11,0.88],[-27,9,0.85]];
  for(let ri=0;ri<rings.length-1;ri++){
    const[y0,r0,sh0]=rings[ri],[y1,r1,sh1]=rings[ri+1];
    for(let i=0;i<segs;i++){
      const a0=(i/segs)*TWO_PI,a1=((i+1)/segs)*TWO_PI;
      const sh=((sh0+sh1)/2)*map(cos(a0-0.5),-1,1,0.86,1.1);
      fill(floor(215*sh),floor(200*sh),floor(175*sh),a);
      beginShape();
      vertex(cos(a0)*r0,y0,sin(a0)*r0); vertex(cos(a1)*r0,y0,sin(a1)*r0);
      vertex(cos(a1)*r1,y1,sin(a1)*r1); vertex(cos(a0)*r1,y1,sin(a0)*r1);
      endShape(CLOSE);
    }
  }
  fill(188,172,150,a); push(); translate(12,-14,0); box(6,12,3); pop();
  fill(105,68,40,min(a*0.85,255)); push(); translate(0,-3.5,0); cylinder(7,1.5,6); pop();
  for(let s=0;s<3;s++){
    const st=breathT*1.6+s*1.3; fill(245,240,235,min(map(s,0,2,55,15),a));
    push(); translate(sin(st+s)*3,-28-s*9,0); rotateZ(sin(st)*0.2); box(2.5,5,1.5); pop();
  }
  pop();
}
 
// ──────────────────────────────────────────────────────────────
//  바닥 드롭 아이템
// ──────────────────────────────────────────────────────────────
function drawDroppedItem(){
  if(!droppedItem||!droppedItem.active) return;
  const scl = CFG.DROP_SCALE[droppedItem.type] || 1.0;
  push();
  translate(droppedItem.x, -17, droppedItem.z);
  if (droppedItem.type === "snack") {
    rotateX(radians(270)); 
  }
  if (droppedItem.type === "book") {
    rotateX(radians(90)); 
    rotateZ(radians(50));
  }
  scale(scl);
  noStroke();
  if(droppedItem.type==="book")  drawModelBook(droppedItem.alpha);
  else if(droppedItem.type==="snack") drawModelSnack(droppedItem.alpha);
  else if(droppedItem.type==="cup")   drawModelCup(droppedItem.alpha);
  pop();
}
 
// ──────────────────────────────────────────────────────────────
//  먼지
// ──────────────────────────────────────────────────────────────
function drawDust(){
  noStroke();
  const col=color(CFG.COLOR.dust).levels;
  for(let idx=0; idx<dustParticles.length; idx++){
    const d=dustParticles[idx];
    d.x+=d.vx+sin(breathT+d.phase)*0.08; d.y+=d.vy; d.z+=d.vz;
    if(d.y<-300||d.y>80||d.x<20||d.x>540) Object.assign(d,newDust());
    const inL=d.x>80&&d.x<500&&d.y>-260&&d.y<70;
    const al = inL?d.alpha:d.alpha*0.3;
    fill(col[0],col[1],col[2],al);
    push();
    translate(d.x,d.y,d.z);
    noStroke();
    if(idx % 2 === 0){ sphere(d.r, 4, 3); } else { box(d.r*1.6, d.r*1.6, d.r*1.6); }
    pop();
  }
}
 
function newDust(){
  return{
    x:random(50,500), y:random(-280,60), z:random(-250,100),
    r:random(CFG.DUST.minR,CFG.DUST.maxR),
    vx:random(-0.16,0.12)*CFG.DUST.speed,
    vy:random(-0.07,0.06)*CFG.DUST.speed,
    vz:random(-0.12,0.12)*CFG.DUST.speed,
    alpha:random(CFG.DUST.alpha[0],CFG.DUST.alpha[1]),
    phase:random(TWO_PI)
  };
}
 
function drawLightBeam(){
  const lb=CFG.LIGHT_BEAM, z0=-CFG.ROOM.floorD/2+10;
  noStroke(); noLights(); fill(color(CFG.COLOR.light));
  beginShape();
  vertex(lb.topX-lb.topW/2,lb.topY,z0); vertex(lb.topX+lb.topW/2,lb.topY,z0);
  vertex(lb.botX+lb.botW/2,lb.botY,150); vertex(lb.botX-lb.botW/2,lb.botY,150);
  endShape(CLOSE); applyLights();
}
 
// ──────────────────────────────────────────────────────────────
//  가구 렌더링
// ──────────────────────────────────────────────────────────────
function drawFurnitureAll() {
  const F = CFG.FURNITURE;
  _fItem("mirror", (a) => drawMirror(F.mirror[0], F.mirror[1], F.mirror[2], a));
  _fItem("shelf",  (a) => drawShelf( F.shelf[0],  F.shelf[1],  F.shelf[2],  a));
  _fItem("desk",   (a) => drawDesk(  F.desk[0],   F.desk[1],   F.desk[2],   a));
  _fItem("bowl",   (a) => drawBowl(  F.bowl[0],   F.bowl[1],   F.bowl[2],   a));
  _fItem("teacup", (a) => drawTeacup(F.teacup[0], F.teacup[1], F.teacup[2], a));
  _fItem("lamp",   (a) => drawLamp(  F.lamp[0],   F.lamp[1],   F.lamp[2],   a));
  _fItem("plant",  (a) => drawPlant( F.plant[0],  F.plant[1],  F.plant[2],  a));
  _fItem("radio",  (a) => drawRadio( F.radio[0],  F.radio[1],  F.radio[2],  a));
}
 
function _fItem(name, fn) {
  push();
  const sh = furnitureShake[name] || 0;
  if (sh > 0) translate(sin(gT * 42) * sh * 3.5, 0, 0);
 
  let alpha = 255;
  if (furnitureFaded[name] && name === lastClickedFurniture) {
    alpha = floor(255 * CFG.FADED_ALPHA);
  } else if (hoveredFurniture === name) {
    alpha = floor(255 * CFG.HOVER_ALPHA);
  }
 
  fn(alpha);
  pop();
}
 
// ── 전등 ──────────────────────────────────────────────────────
function drawLamp(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.8);
  fill(W.dark[0],   W.dark[1],   W.dark[2],   a);
  push(); cylinder(18, 6, 8); pop();
  fill(W.mid[0],    W.mid[1],    W.mid[2],    a);
  push(); translate(0, -60, 0); cylinder(3, 120, 6); pop();
  const lt = lampT;
  fill(
    floor(W.lampShade[0] * lt + 70 * (1 - lt)),
    floor(W.lampShade[1] * lt + 70 * (1 - lt)),
    floor(W.lampShade[2] * lt * 0.5 + 70 * (1 - lt)),
    a
  );
  push(); translate(0, -115, 0); rotateX(PI); cone(22, 35, 7, 1); pop();
  pop();
}
 
// ── 화분 ──────────────────────────────────────────────────────
function drawPlant(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.75);
  fill(W.plantPot[0], W.plantPot[1], W.plantPot[2], a);
  push(); translate(0, -15, 0); cylinder(16, 30, 6); pop();
  fill(W.plantPot[0]+20, W.plantPot[1]+20, W.plantPot[2]+20, a);
  push(); translate(0, -30, 0); cylinder(18, 4, 6); pop();
  fill(W.plantLeaf[0], W.plantLeaf[1], W.plantLeaf[2], a);
  push(); translate(0, -45, 0); sphere(22, 5, 4); pop();
  push(); translate(-12, -35, 12); sphere(18, 4, 4); pop();
  fill(W.plantLeaf[0]+15, W.plantLeaf[1]+15, W.plantLeaf[2]+15, a);
  push(); translate(15, -40, -5); sphere(16, 5, 3); pop();
  pop();
}
 
// ── 라디오 ────────────────────────────────────────────────────
function drawRadio(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.5); rotateY(-0.35);
  fill(W.radioBody[0], W.radioBody[1], W.radioBody[2], a); box(60, 40, 25);
  fill(50, 55, 50, a);
  push(); translate(-12, 0, 13); box(24, 28, 2); pop();
  fill(210, 210, 205, a);
  push(); translate(15,  5, 13); rotateX(HALF_PI); cylinder(5, 3, 8); pop();
  push(); translate(15, -8, 13); rotateX(HALF_PI); cylinder(4, 3, 8); pop();
  fill(240, 230, 210, a);
  push(); translate(15, -20, 10); box(30, 8, 18); pop();
  fill(160, 160, 170, a);
  push(); translate(22, -35, -5); rotateZ(0.2); rotateX(-0.1); cylinder(1.5, 45, 4); pop();
  if (radioOn) {
    fill(100, 220, 100, min(a, 200 + sin(gT * 5) * 30));
    push(); translate(20, 10, 13); sphere(3, 4, 4); pop();
  }
  pop();
}
 
// ── 거울 ──────────────────────────────────────────────────────
function drawMirror(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.45); rotateY(1.4);
  const R = 72, fr = 14, segs = 8;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * TWO_PI, a1 = ((i + 1) / segs) * TWO_PI;
    const sh = map(cos(a0 - 0.8), -1, 1, 0.75, 1.1);
    fill(W.mid[0]*sh, W.mid[1]*sh, W.mid[2]*sh, a);
    beginShape();
    vertex(cos(a0)*(R+fr), sin(a0)*(R+fr), 0); vertex(cos(a1)*(R+fr), sin(a1)*(R+fr), 0);
    vertex(cos(a1)*R, sin(a1)*R, 6); vertex(cos(a0)*R, sin(a0)*R, 6);
    endShape(CLOSE);
    fill(W.light[0]*sh, W.light[1]*sh, W.light[2]*sh, a);
    beginShape();
    vertex(cos(a0)*(R+fr), sin(a0)*(R+fr), 0); vertex(cos(a1)*(R+fr), sin(a1)*(R+fr), 0);
    vertex(cos(a1)*(R+fr), sin(a1)*(R+fr), 8); vertex(cos(a0)*(R+fr), sin(a0)*(R+fr), 8);
    endShape(CLOSE);
  }
  fill(W.glass[0]-10, W.glass[1]-5, W.glass[2]+10, min(a, 230));
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*R, sin((i/segs)*TWO_PI)*R, 7);
  endShape(CLOSE);
  fill(255, 255, 255, min(a, 120));
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*(R*0.45)-18, sin((i/segs)*TWO_PI)*(R*0.45)-20, 9);
  endShape(CLOSE);
  fill(255, 255, 255, min(a, 60));
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*(R*0.7)+5, sin((i/segs)*TWO_PI)*(R*0.7)+8, 8.5);
  endShape(CLOSE);
  fill(W.dark[0], W.dark[1], W.dark[2], a);
  push(); translate(0, R+fr+18, 3); box(12, 36, 10); pop();
  fill(W.shadow[0], W.shadow[1], W.shadow[2], a);
  push(); translate(0, R+fr+38, 3); box(52, 10, 18); pop();
  pop();
}
 
// ── 책장 ──────────────────────────────────────────────────────
function drawShelf(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.5); rotateY(-0.5);
  const W2 = 170, D = 32, T = 10, sideH = 280;
  for (const sx of [-W2/2-T/2, W2/2+T/2]) {
    fill(W.dark[0], W.dark[1], W.dark[2], a);
    push(); translate(sx, -sideH/2, D/2); box(T, sideH, D); pop();
  }
  for (const sy of [-10, -180, -270]) {
    fill(W.light[0], W.light[1], W.light[2], a);
    push(); translate(0, sy, D/2); box(W2, T, D); pop();
    fill(W.mid[0], W.mid[1], W.mid[2], a);
    push(); translate(0, sy-T/2, D-2); box(W2, 3, 4); pop();
  }
  fill(W.shadow[0], W.shadow[1], W.shadow[2], min(a, 180));
  push(); translate(0, -sideH/2, 1); box(W2+T*2, sideH, 4); pop();
  const books = [[100,110,140,-32],[180,170,100,0],[160,100,140,18],[90,100,180,36],[100,140,120,54],[160,140,210,72]];
  for (let i = 0; i < books.length; i++) {
    const [r, g, b, bx] = books[i];
    fill(r, g, b, a);
    push(); translate(bx, (-sideH/2)*1.55, D/2); rotateZ(i===0 ? 0.5 : 0); box(15, 70, 30); pop();
  }
  pop();
}
 
// ── 책상 ──────────────────────────────────────────────────────
function drawDesk(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.5); rotateY(-0.5);
  const DW = 240, DD = 110, TH = 10, legH = 30, topY = -legH;
  fill(W.light[0], W.light[1], W.light[2], a);
  push(); translate(0, topY-TH/2, DD/2-8); box(DW, TH, DD); pop();
  for (const [lx, lz] of [[-DW/2+10, DD/2-14],[DW/2-10, DD/2-14],[-DW/2+10, -DD/2+10],[DW/2-10, -DD/2+10]]) {
    const sh = lz > 0 ? W.mid : W.dark;
    fill(sh[0], sh[1], sh[2], a);
    push(); translate(lx, topY+TH/2+(legH/2)*0.6, DD/2-8+lz); box(12, legH, 12); pop();
  }
  pop();
}
 
// ── 그릇 ──────────────────────────────────────────────────────
function drawBowl(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.8);
  const segs = 5;
  const rings = [[0,6,0.7],[-4,18,0.8],[-10,26,0.9],[-16,30,1.0],[-21,28,0.95],[-26,20,0.85]];
  for (let ri = 0; ri < rings.length - 1; ri++) {
    const [y0, r0, sh0] = rings[ri], [y1, r1, sh1] = rings[ri+1];
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*TWO_PI, a1 = ((i+1)/segs)*TWO_PI;
      const sh = ((sh0+sh1)/2) * map(cos(a0-0.5), -1, 1, 0.82, 1.12);
      fill(W.mid[0]*sh, W.mid[1]*sh, W.mid[2]*sh, a);
      beginShape();
      vertex(cos(a0)*r0, y0, sin(a0)*r0); vertex(cos(a1)*r0, y0, sin(a1)*r0);
      vertex(cos(a1)*r1, y1, sin(a1)*r1); vertex(cos(a0)*r1, y1, sin(a0)*r1);
      endShape(CLOSE);
    }
  }
  fill(W.dark[0], W.dark[1], W.dark[2], a);
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*6, 0, sin((i/segs)*TWO_PI)*6);
  endShape(CLOSE);
  pop();
}
 
// ── 찻잔 ──────────────────────────────────────────────────────
function drawTeacup(x, y, z, a) {
  push(); translate(x, y, z); noStroke(); scale(0.6);
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const a0 = (i/segs)*TWO_PI, a1 = ((i+1)/segs)*TWO_PI;
    const sh = map(cos(a0-0.3), -1, 1, 0.8, 1.1);
    fill(W.light[0]*sh, W.light[1]*sh, W.light[2]*sh, a);
    beginShape();
    vertex(cos(a0)*20, 0, sin(a0)*20); vertex(cos(a1)*20, 0, sin(a1)*20);
    vertex(cos(a1)*22, -5, sin(a1)*22); vertex(cos(a0)*22, -5, sin(a0)*22);
    endShape(CLOSE);
  }
  fill(W.mid[0], W.mid[1], W.mid[2], a);
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*20, 0, sin((i/segs)*TWO_PI)*20);
  endShape(CLOSE);
  const cr = [[-5,8,0.85],[-10,14,0.95],[-18,15,1.0],[-24,14,0.97],[-28,12,0.9],[-36,11,0.85]];
  for (let ri = 0; ri < cr.length - 1; ri++) {
    const [y0, r0, sh0] = cr[ri], [y1, r1, sh1] = cr[ri+1];
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*TWO_PI, a1 = ((i+1)/segs)*TWO_PI;
      const sh = ((sh0+sh1)/2) * map(cos(a0-0.4), -1, 1, 0.85, 1.12);
      fill(W.light[0]*sh, W.light[1]*sh, W.light[2]*sh, a);
      beginShape();
      vertex(cos(a0)*r0, y0, sin(a0)*r0); vertex(cos(a1)*r0, y0, sin(a1)*r0);
      vertex(cos(a1)*r1, y1, sin(a1)*r1); vertex(cos(a0)*r1, y1, sin(a0)*r1);
      endShape(CLOSE);
    }
  }
  fill(W.mid[0], W.mid[1], W.mid[2], a);
  beginShape();
  for (let i = 0; i < segs; i++) vertex(cos((i/segs)*TWO_PI)*8, -5, sin((i/segs)*TWO_PI)*8);
  endShape(CLOSE);
  for (let s = 0; s < 3; s++) {
    const st = breathT*1.4 + s*1.2, sy = -38 - s*12 - (sin(st)*0.5+0.5)*6;
    fill(245, 240, 235, min(a, map(s, 0, 2, 70, 20)));
    beginShape();
    vertex(sin(st+s)*4-5, sy, -3); vertex(sin(st+s)*4+5, sy, -3);
    vertex(sin(st+s)*4+7, sy-10, -3); vertex(sin(st+s)*4-7, sy-10, -3);
    endShape(CLOSE);
  }
  pop();
}