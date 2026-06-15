// =============================================================
// 해방촌 Haebangchon — Sunset to Night (p5.js port)
//
// 사용법: p5.js Web Editor(editor.p5js.org)나 p5.js가 로드된
// 프로젝트에서 이 파일 전체를 sketch.js로 붙여넣으세요.
// 원본 Canvas2D 드로잉 코드를 그대로 쓸 수 있도록
// p5의 drawingContext(=ctx)를 사용했습니다.
// =============================================================

const W = 1280, H = 720;
let ctx; // set to drawingContext in setup()


// ---------- palettes ----------
// weighted toward warm brick/terracotta + cream/white trim, like real Haebangchon facades
const PALETTE = [
  {base:'#c1614a', shade:'#9e4a37'}, // terracotta brick
  {base:'#b5573f', shade:'#954434'}, // deep brick red
  {base:'#d4906f', shade:'#b06f50'}, // salmon brick
  {base:'#e8ddc8', shade:'#cbbfa0'}, // cream
  {base:'#f0ebe0', shade:'#d6cdbb'}, // ivory / white render
  {base:'#c9a876', shade:'#ab8a5c'}, // tan
  {base:'#a8a39a', shade:'#8c877e'}, // gray
  {base:'#5f6e52', shade:'#4a5640'}  // dark green (rare accent)
];
const PALETTE_WEIGHTS = [3,3,2,2,2,2,1,1];
const TRIM_COLOR = '#f2ece0'; // white/cream window frames & cornices
const TRIM_NIGHT = '#3a3a3c';
const LIT_COLORS = ['#fff3c4','#ffdd99','#ffb15c','#ffce8f','#fff0c2','#eaf6ff'];
const LIT_WEIGHTS = [3,3,3,2,2,1];

// ---- sky / sun / cloud progression ----
// 7 stops: morning(vivid blue, ref photo 1) -> afternoon -> sunset begins -> sunset peak(golden, ref photo 2)
// -> dusk(deepening orange) -> evening(purple/navy) -> night
const STAGE_POS = [0, 0.22, 0.42, 0.58, 0.72, 0.85, 1.0];
const SKY_TOP_STOPS    = ['#5B9BD5','#4A8FD0','#6FA8D8','#6B9BC4','#A06880','#5A5470','#161D33'];
const SKY_MID_STOPS    = ['#8FBFE0','#7AB3E0','#B8CCD8','#E8A8A0','#D87858','#7A6080','#1E2740'];
const SKY_BOTTOM_STOPS = ['#D6EAF5','#C8E4F2','#F5D9A0','#F0A868','#E89868','#4A4060','#252F4A'];
const CLOUD_STOPS      = ['#ffffff','#ffffff','#FFE9C2','#F0C4A0','#C8806A','#6A5870','#1E2740'];
const SUN_COLOR_STOPS  = ['#fff8e6','#fffbf0','#FFE9A0','#FFEFC0','#FFE0A0','#C97A6A','#8A5C7A'];
const SUN_X_STOPS      = [0.70, 0.58, 0.45, 0.38, 0.32, 0.28, 0.28];
const SUN_Y_STOPS      = [0.45, 0.15, 0.55, 0.95, 1.20, 1.35, 1.35];

// fixed backdrop for everything below the sky strip (village surroundings) — never animates with time
const BG_FIXED = '#9ab0c4';
// mountain (ridge) silhouette: fixed hazy blue-gray — does NOT change with time of day (left alone, as requested)
const RIDGE_STOPS = ['#9ab0c4'];
// atmospheric haze over distant buildings: fixed (does not change with time of day)
const HAZE_STOPS  = ['#dceaf0'];
const HAZE_FAR = 0.35, HAZE_NEAR = 0.04;

const GLASS_START = '#bcdcec', GLASS_END = '#20242f'; // window glass: morning-sky reflection -> dark at night
const POLE_START = '#4a3f3a', POLE_END = '#06070c';
const TRUNK_START = '#4a3a2c', TRUNK_END = '#15140f';
const LEAF_START = ['#6e7a52','#7e8a5e','#5f6a48'];
const LEAF_END   = ['#1c2418','#222c1c','#192115'];

// left frame: old reddish-brick; right frame: concrete + metal
const BRICK_LEFT_START = '#ad5c40', BRICK_LEFT_END = '#26140f';
const CONCRETE_RIGHT_START = '#bcae98', CONCRETE_RIGHT_END = '#2a2622';
const METAL_START = '#a89c8c', METAL_END = '#1c1c20';
const WOOD_START = '#a87a4a', WOOD_END = '#2a1c10';
const AWNING_A_START = '#c75c4a', AWNING_A_END = '#3a1c16';
const AWNING_B_START = '#e8ddc8', AWNING_B_END = '#2c2824';
const POT_START = '#a8714f', POT_END = '#3a261a';
const RUST_METAL = '#9a7256';      // weathered balcony railings on the older left building
const TANK_MODERN = '#cfd3d6';     // small modern rooftop water tank on the right building
const PVC_PIPE = '#d9d5cb';        // lighter modern drainpipe on the right building
const LAUNDRY_COLORS = ['#eef0e8','#cdd6dc','#d9c8b8','#b8c4cc','#e8d9c8'];
const BUTTERFLY_COLORS = ['#f0d8b0','#e8b8c8','#f5e8a0','#c8d8ec','#fdfdfb'];
const CURTAIN_COLORS = ['#e8ddc8','#d8c4b0','#c8b8a4','#d4cdc0','#e0d4c8','#cdd0c4'];

const LEFT_FRAME_W = 120; // village boundary moved left 40px -> wider, more open center
const LEFT_BUILD_W = 160; // left building's own design width (unchanged "형태")
const LEFT_BOUND = LEFT_FRAME_W - LEFT_BUILD_W; // -40: building's outer edge now sits off-canvas (75% visible, cropped at the left edge)
const RIGHT_FRAME_W = 151;

// ---------- helpers ----------
function rand(a,b){ return a + Math.random()*(b-a); }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }
function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,u){ return a+(b-a)*u; }
function hexToRgb(hex){
  const v = hex.replace('#','');
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
}
function mix(hexA, hexB, u){
  u = clamp(u,0,1);
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0],b[0],u));
  const g = Math.round(lerp(a[1],b[1],u));
  const bb= Math.round(lerp(a[2],b[2],u));
  return `rgb(${r},${g},${bb})`;
}
function mixRGB(hexA, hexB, u){
  u = clamp(u,0,1);
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0],b[0],u));
  const g = Math.round(lerp(a[1],b[1],u));
  const bb= Math.round(lerp(a[2],b[2],u));
  return `${r},${g},${bb}`;
}
// find the bracketing pair of STAGE_POS for t, returning [index, localU]
function stageBracket(t){
  for(let i=0;i<STAGE_POS.length-1;i++){
    if(t <= STAGE_POS[i+1]){
      let u = (t-STAGE_POS[i])/(STAGE_POS[i+1]-STAGE_POS[i] || 1);
      u = u*u*(3-2*u); // smoothstep: ease in/out of each stage instead of linear
      return [i, u];
    }
  }
  return [STAGE_POS.length-2, 1];
}
function stageColor(stops, t){
  const [i,u] = stageBracket(t);
  return mix(stops[i], stops[i+1], u);
}
function stageRGB(stops, t){
  const [i,u] = stageBracket(t);
  return mixRGB(stops[i], stops[i+1], u);
}
function stageNum(stops, t){
  const [i,u] = stageBracket(t);
  return lerp(stops[i], stops[i+1], u);
}
function weightedLit(){
  let total = LIT_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<LIT_WEIGHTS.length;i++){
    if(r < LIT_WEIGHTS[i]) return LIT_COLORS[i];
    r -= LIT_WEIGHTS[i];
  }
  return LIT_COLORS[0];
}
function weightedPalette(){
  let total = PALETTE_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<PALETTE_WEIGHTS.length;i++){
    if(r < PALETTE_WEIGHTS[i]) return PALETTE[i];
    r -= PALETTE_WEIGHTS[i];
  }
  return PALETTE[0];
}
// interpolate the x of an edge curve (array of {x,y}, sorted by y) at a given y
function edgeXAt(pts, y){
  for(let i=1;i<pts.length;i++){
    if(y <= pts[i].y){
      const p0=pts[i-1], p1=pts[i];
      const u = (y-p0.y)/(p1.y-p0.y || 1);
      return lerp(p0.x, p1.x, u);
    }
  }
  return pts[pts.length-1].x;
}
// trace a smooth curve through points onto an existing path (pts ordered by y)
function tracePath(c, pts){
  c.lineTo(pts[0].x, pts[0].y);
  for(let i=1;i<pts.length;i++){
    const prev=pts[i-1], cur=pts[i];
    const midX=(prev.x+cur.x)/2, midY=(prev.y+cur.y)/2;
    c.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  c.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
}
// Build a stack of floor-blocks for a frame building: each floor has its own
// width (edgeTop/edgeBottom), so the silhouette steps in/out and slants slightly
// per floor instead of being one smooth rectangle. A gentle bias makes the
// building lean inward near the top and open outward near the bottom (V composition).
// side 'left': larger edge x = more wall. side 'right': smaller edge x = more wall.
function generateFloors(baseX, side){
  const floors = [];
  let y = 0;
  let curEdge = baseX + (side==='left' ? 38 : -40) + rand(-6,6);
  // left: older building, more irregular floor heights and a more uneven silhouette
  // right: newer building, more uniform floor heights and a more rectilinear silhouette
  const fhMin = side==='left' ? 68 : 88;
  const fhMax = side==='left' ? 148 : 122;
  const slantMax = side==='left' ? 10 : 4;
  while(y < H-4){
    const fh = rand(fhMin,fhMax);
    const y1 = Math.min(y+fh, H);
    const slant = rand(-slantMax,slantMax);
    floors.push({ y0:y, y1, edgeTop: curEdge, edgeBottom: curEdge+slant });
    const frac = y1/H;
    const bias = side==='left' ? lerp(38,-20,frac) : lerp(-40,20,frac);
    curEdge = clamp(baseX + bias + rand(-24,24), baseX-55, baseX+60);
    y = y1;
  }
  return floors;
}
// a point array (sorted by y) approximating the stepped edge, for edgeXAt-based lookups
function floorsToEdgeArr(floors){
  const pts = [];
  floors.forEach(f=>{
    pts.push({ x:f.edgeTop, y:f.y0 });
    pts.push({ x:f.edgeBottom, y:f.y1 });
  });
  return pts;
}
// the actual stepped wall outline (vertical faces + horizontal ledges between floors)
function floorWallPath(c, floors, side){
  c.beginPath();
  if(side==='left'){
    c.moveTo(LEFT_BOUND,0);
    floors.forEach(f=>{ c.lineTo(f.edgeTop,f.y0); c.lineTo(f.edgeBottom,f.y1); });
    c.lineTo(LEFT_BOUND,H);
  } else {
    c.moveTo(W,0);
    floors.forEach(f=>{ c.lineTo(f.edgeTop,f.y0); c.lineTo(f.edgeBottom,f.y1); });
    c.lineTo(W,H);
  }
  c.closePath();
}
// small windows, randomly sized/placed within each floor
function generateFloorWindows(floors, side){
  const windows = [];
  // left: more size/position variety (older, lived-in look); right: larger but more regular (modern)
  const wRange = side==='left' ? [22,58] : [32,52];
  const hRange = side==='left' ? [0.30,0.58] : [0.40,0.52];
  const jitter = side==='left' ? 0.11 : 0.05;
  floors.forEach(f=>{
    const fh = f.y1-f.y0;
    if(fh < 40) return;
    const edgeAvg = (f.edgeTop+f.edgeBottom)/2;
    const count = randInt(1,3);
    let cursor = side==='left' ? LEFT_BOUND+14 : edgeAvg+14;
    const limit = side==='left' ? edgeAvg-14 : W-14;
    for(let i=0;i<count;i++){
      const remaining = limit - cursor;
      if(remaining < 26) break;
      const ww = clamp(rand(wRange[0],wRange[1]), 16, remaining-8);
      const wh = clamp(fh*rand(hRange[0],hRange[1]), 18, fh-16);
      const wx = cursor + rand(3,12);
      const wy = f.y0 + (fh-wh)/2 + rand(-fh*jitter, fh*jitter);
      windows.push({ x:wx, y:wy, w:ww, h:wh, threshold: rand(0,1), lit: weightedLit(), flare: Math.random()<0.07,
        hasCurtain: Math.random()<0.85, curtainColor: choice(CURTAIN_COLORS) });
      cursor = wx + ww + rand(14,30);
    }
  });
  return windows;
}
// small attached elements (awning, AC unit, sign, plant, railing, pipe) on each floor's ledge
function generateFloorProtrusions(floors, side){
  const items = [];
  floors.forEach(f=>{
    if(Math.random() > 0.55) return;
    const fh = f.y1-f.y0;
    const edgeAvg = (f.edgeTop+f.edgeBottom)/2;
    const types = side==='left'
      ? ['awning','ac','plant','railing','pipe','balcony','laundry']
      : ['ac','plant','railing','pipe','balcony_modern','utilitybox'];
    const type = choice(types);
    let depth, along, yy;
    if(type==='railing'){ depth = rand(40,75); along = 14; yy = f.y1-16; }
    else if(type==='balcony'){ depth = rand(46,74); along = rand(50,82); yy = f.y0 + rand(2, Math.max(2,fh-along-2)); }
    else if(type==='balcony_modern'){ depth = rand(42,68); along = rand(55,85); yy = f.y0 + rand(2, Math.max(2,fh-along-2)); }
    else if(type==='laundry'){ depth = rand(36,58); along = 2; yy = f.y0 + rand(fh*0.18, fh*0.5); }
    else if(type==='utilitybox'){ depth = rand(13,18); along = rand(20,28); yy = f.y1-along-rand(6,18); }
    else if(type==='pipe'){ depth = 8; along = fh*0.9; yy = f.y0+fh*0.05; }
    else if(type==='awning'){ depth = rand(20,30); along = rand(40,65); yy = f.y0+rand(6,16); }
    else if(type==='ac'){ depth = rand(16,24); along = rand(26,36); yy = f.y0+fh*0.5; }
    else { depth = rand(14,20); along = rand(18,24); yy = f.y1-along-4; } // plant
    const x = side==='left' ? edgeAvg-2 : edgeAvg+2-depth;
    let laundryItems = null;
    if(type==='laundry'){
      laundryItems = [];
      const n = randInt(2,4);
      for(let i=0;i<n;i++){
        laundryItems.push({ t:(i+1)/(n+1)+rand(-0.06,0.06), w:rand(8,14), h:rand(12,20), color: choice(LAUNDRY_COLORS) });
      }
    }
    items.push({ type, x, y:yy, w:depth, h:along, side, stripe: Math.random()<0.5, laundryItems });
  });
  return items;
}
// a few short jagged crack lines for an aged/weathered wall
function generateCracks(xRange, yRange, count){
  const cracks = [];
  for(let i=0;i<count;i++){
    let cx = rand(xRange[0],xRange[1]);
    let cy = rand(yRange[0],yRange[1]);
    const pts = [{x:cx,y:cy}];
    const segs = randInt(3,5);
    for(let s=0;s<segs;s++){
      cx += rand(-8,8);
      cy += rand(10,22);
      pts.push({x:cx,y:cy});
    }
    cracks.push(pts);
  }
  return cracks;
}

// 1 = full daytime insect activity (wide roaming), 0 = settled/hidden for the night.
// Smoothstep ease from the sunset-begins stage through the evening stage.
function insectActivity(t){
  if(t<=0.42) return 1;
  if(t>=0.85) return 0;
  const u=(t-0.42)/(0.85-0.42);
  return 1-u*u*(3-2*u);
}
// small flying insects (butterflies/bees) that wander around flowers, trees and balconies
function generateInsects(anchors){
  const insects = [];
  const n = randInt(18,24);
  for(let i=0;i<n;i++){
    const a = choice(anchors);
    const isBee = Math.random()<0.5;
    insects.push({
      anchorX: a.x, anchorY: a.y,
      type: isBee ? 'bee' : 'butterfly',
      nocturnal: Math.random()<0.18, // a few stay faintly active after dark, like moths
      roam: isBee ? rand(14,26) : rand(28,55),
      f1x: rand(0.0006,0.0011), f2x: rand(0.0017,0.0027),
      f1y: rand(0.0007,0.0012), f2y: rand(0.0019,0.0030),
      p1x: rand(0,Math.PI*2), p2x: rand(0,Math.PI*2),
      p1y: rand(0,Math.PI*2), p2y: rand(0,Math.PI*2),
      wingFreq: isBee ? rand(0.025,0.04) : rand(0.008,0.014),
      wingPhase: rand(0,Math.PI*2),
      size: isBee ? rand(5,7.5) : rand(9,14),
      color: choice(BUTTERFLY_COLORS)
    });
  }
  return insects;
}
// at night, a few tiny gnats hover and circle around each light source
function generateGnatSwarms(anchors){
  return anchors.map(a=>{
    const count = randInt(3,6);
    const flies = [];
    for(let i=0;i<count;i++){
      flies.push({
        f1: rand(0.003,0.006), f2: rand(0.007,0.013),
        p1: rand(0,Math.PI*2), p2: rand(0,Math.PI*2),
        r: rand(4,10), size: rand(0.8,1.6)
      });
    }
    return { x:a.x, y:a.y, threshold:a.threshold, flies };
  });
}


let scene = null;
let allWindows = [];
let allLamps = [];

// ---- mouse-reactive wind for the utility wires ----
// windIntensity rises when the mouse moves and eases back to 0 when it stops (see draw()).
let windIntensity = 0;

// ---------- scene generation ----------
function generateScene(){
  const rows = 17;
  const topY = 200;
  const bottomY = H;
  const buildingsByRow = [];
  const poles = [];
  const trees = [];
  const stars = [];
  const ridgeLights = [];
  allWindows = [];
  allLamps = [];

  for(let i=0;i<320;i++){
    stars.push({
      x: rand(0,W), y: rand(0, topY*1.3), r: rand(0.4,1.6), a: rand(0.3,1),
      threshold: rand(0,1), phase: rand(0,Math.PI*2), speed: rand(0.6,2.2)
    });
  }

  const clouds = [];
  for(let i=0;i<14;i++){
    const baseR = rand(35,75);
    const n = randInt(3,5);
    const puffs = [];
    let px = 0;
    for(let k=0;k<n;k++){
      const r = baseR * rand(0.55,1.0);
      puffs.push({ dx: px, dy: rand(-6,6), r });
      px += r * rand(0.9,1.3);
    }
    const spanCenter = px/2;
    puffs.forEach(p=> p.dx -= spanCenter);
    clouds.push({
      x: rand(-60, W+60), y: rand(10, topY*0.55),
      puffs,
      a: rand(0.15,0.45)
    });
  }

  const ridgePoints = [];
  let rx = -10;
  while(rx < W+10){
    const lean = 1 - (rx/W);
    const baseH = lerp(topY*0.25, topY*1.5, lean);
    ridgePoints.push({ x: rx, y: baseH + rand(-10,10) });
    rx += rand(18, 46);
  }
  for(let i=0;i<8;i++){
    ridgeLights.push({ x: rand(0,W*0.6), y: rand(topY*0.3, topY*1.0), size: rand(1.5,3) });
  }

  for(let r=0;r<rows;r++){
    const t = r/(rows-1);
    const ease = Math.pow(t, 1.15);
    const baseline = topY + ease*(bottomY-topY);

    const minH = lerp(27, 105, ease);
    const maxH = lerp(51, 278, ease);
    const minW = lerp(33, 75, ease);
    const maxW = lerp(60, 210, ease);

    const buildings = [];
    const alleys = [];
    let x = -40;
    while(x < W+40){
      const w = rand(minW, maxW);
      let h = rand(minH, maxH);
      const colorSet = weightedPalette();
      const roofType = choice(['flat','flat','parapet','gable','shed']);
      const yJitter = rand(-5,5) * (0.4+ease*0.6);
      const baselineB = baseline + yJitter;
      // village sits on a rising slope: trim the tops of left buildings, extend the tops of right buildings
      const tiltMag = lerp(24, 50, ease);
      const topShift = lerp(tiltMag, -tiltMag, clamp((x+w*0.5)/W, 0, 1));
      h = Math.max(12, h - topShift);
      const top = baselineB - h;

      let facadeTop = top, gableH=0, skewH=0, parapetH=0;
      if(roofType==='gable'){ gableH = h*0.16; facadeTop = top+gableH; }
      else if(roofType==='shed'){ skewH = h*0.14; facadeTop = top+skewH; }
      else if(roofType==='parapet'){ parapetH = clamp(h*0.05,2,6); facadeTop = top+parapetH; }

      const winW = clamp(w/ Math.round(rand(3.2,5)), 4, 16);
      const winH = winW * rand(0.9,1.3);
      const cols = Math.max(1, Math.floor((w-6)/(winW+4)));
      const winRows = Math.max(1, Math.floor((h-14)/(winH+5)));
      const innerTop = facadeTop + 6;
      const gridW = (cols*(winW+4))-4;
      const startX = x + (w-gridW)/2;

      const windowRects = [];
      for(let c=0;c<cols;c++){
        for(let wr=0; wr<winRows; wr++){
          const wx = startX + c*(winW+4);
          const wy = innerTop + wr*(winH+5);
          if(wy+winH > baselineB-4) continue;
          if(Math.random() < 0.14) continue; // leave some slots as bare wall — breaks up the grid
          const ww = winW * rand(0.78,1.08);
          const wh = winH * rand(0.82,1.1);
          const faint = Math.random() < 0.32; // recedes toward the wall color, thin/no frame
          const willLight = Math.random() < 0.78;
          const rect = {
            x: wx + rand(-2.5,2.5), y: wy + rand(-2,2), w: ww, h: wh,
            willLight,
            lit: weightedLit(),
            threshold: rand(0,1),
            flare: willLight && Math.random() < 0.05,
            faint,
            faintGlass: mix(GLASS_START, colorSet.base, 0.55)
          };
          windowRects.push(rect);
          allWindows.push(rect);
        }
      }

      // thin white/cream trim lines marking the floor slabs between window rows
      const floorLines = [];
      for(let wr=1; wr<winRows; wr++){
        const wy = innerTop + wr*(winH+5);
        if(wy+winH > baselineB-4) continue;
        floorLines.push(wy - 2.5);
      }

      const hasTank = ease>0.15 && Math.random() < 0.18;
      const hasAntenna = Math.random() < 0.22;
      const hasBox = Math.random() < 0.16;
      const hasAC = Math.random() < 0.25;
      const hasRailing = !hasBox && Math.random() < 0.18;

      buildings.push({
        x, w, h, baseline: baselineB, top, colorSet,
        roofType, gableH, skewH, parapetH,
        windowRects, floorLines,
        hasTank, hasAntenna, hasBox, hasAC, hasRailing,
        tankSide: Math.random()<0.5? 'l':'r',
        acSide: Math.random()<0.5? 'l':'r',
        antennaX: rand(0.2,0.8),
        boxW: rand(0.3,0.5)
      });

      if(Math.random() < 0.14){
        // a narrow alley gap between buildings, opening down toward the street
        const gap = rand(3, 4+ease*10);
        alleys.push({ x: x+w, w: gap, topY: baselineB - lerp(minH,maxH,0.35), bottomY: baselineB,
          wallH: rand(10,18) * (0.5+ease*0.7), hasGate: Math.random()<0.5 });
        x += w + gap;
      } else {
        const overlap = rand(2, w*0.18);
        x += w - overlap;
      }
    }
    buildingsByRow.push({ baseline, ease, buildings, alleys });
  }

  for(let lane=0; lane<2; lane++){
    const baseline = topY + (bottomY-topY)*(0.86+lane*0.07);
    let x = rand(LEFT_FRAME_W+10, LEFT_FRAME_W+80);
    const lanePoles = [];
    while(x < W-RIGHT_FRAME_W-20){
      lanePoles.push({ x, y: baseline + rand(-4,4) });
      x += rand(150,260);
    }
    poles.push({ baseline, items: lanePoles });
  }

  for(let i=0;i<10;i++){
    const tt = rand(0.62,1);
    const baseline = topY + (bottomY-topY)*tt;
    trees.push({
      x: rand(LEFT_FRAME_W, W-RIGHT_FRAME_W),
      y: baseline + rand(-8,18),
      r: rand(10, 22) * (0.6+tt*0.6)
    });
  }

  const lane = poles[poles.length-1];
  lane.items.forEach((p,i)=>{
    if(i%2!==0) return;
    const lx = p.x + 60;
    if(lx > W-RIGHT_FRAME_W-10) return;
    allLamps.push({ x: lx+10, y: p.y-86, threshold: rand(0,1) });
  });

  // ---- left/right buildings as stacked floor-blocks (stepped silhouette) ----
  const leftFloors = generateFloors(LEFT_FRAME_W, 'left');
  const rightFloors = generateFloors(W-RIGHT_FRAME_W, 'right');
  const leftEdge = floorsToEdgeArr(leftFloors);
  const rightEdge = floorsToEdgeArr(rightFloors);
  const leftDetails = { windows: generateFloorWindows(leftFloors, 'left') };
  const rightDetails = { windows: generateFloorWindows(rightFloors, 'right') };
  const leftProtrusions = generateFloorProtrusions(leftFloors, 'left');
  const rightProtrusions = generateFloorProtrusions(rightFloors, 'right');

  // left rooftop: a small weathered 옥탑방 (rooftop room) + satellite dish near the roofline
  const leftTopF = leftFloors[0];
  const leftRoofX = Math.min(leftTopF.edgeTop, leftTopF.edgeBottom);
  const leftRoof = {
    shedX: leftRoofX - rand(50,58), shedW: rand(32,40), shedH: rand(20,26),
    satX: leftRoofX - rand(16,22), satY: rand(3,9)
  };

  // weathering streaks (rain/rust stains) running down the old brick facade — more of them for a worn look
  const leftWeathering = [];
  for(let i=0;i<8;i++){
    leftWeathering.push({
      x: rand(LEFT_BOUND+12, LEFT_BOUND+LEFT_BUILD_W-12),
      y: rand(0, H*0.5), w: rand(2,5), h: rand(H*0.18, H*0.42)
    });
  }
  // a few cracks in the old brick
  const leftCracks = generateCracks([LEFT_BOUND+15, LEFT_BOUND+LEFT_BUILD_W-15], [H*0.12, H*0.8], 3);

  // matching grime/water-stain streaks and cracks for the right building's concrete facade
  const rightWeathering = [];
  for(let i=0;i<7;i++){
    rightWeathering.push({
      x: rand(W-RIGHT_FRAME_W-30, W-12),
      y: rand(0, H*0.5), w: rand(2,5), h: rand(H*0.16, H*0.40)
    });
  }
  const rightCracks = generateCracks([W-RIGHT_FRAME_W-25, W-12], [H*0.12, H*0.8], 3);

  // right rooftop: a small rooftop garden (several pots), a compact modern water tank, and a satellite dish
  const rightTopF = rightFloors[0];
  const rightTopEx = Math.min(rightTopF.edgeTop, rightTopF.edgeBottom);
  const gardenPots = [];
  let gx = rightTopEx + rand(50,64);
  const gardenCount = randInt(2,3);
  for(let i=0;i<gardenCount;i++){
    gardenPots.push({ x: Math.min(gx, W-16), leafIdx: i%LEAF_START.length, r: rand(10,15) });
    gx += rand(28,38);
  }
  const rightRoof = {
    gardenPots,
    tankX: Math.min(gx+rand(8,16), W-36), tankW: rand(26,34), tankH: rand(22,28),
    satX: rightTopEx + rand(12,18), satY: rand(3,9)
  };

  // small flying insects: anchor them around tree canopies and any potted plants / balconies / laundry
  const insectAnchors = [];
  trees.forEach(tr=> insectAnchors.push({ x: tr.x, y: tr.y - tr.r*0.9 }));
  [...leftProtrusions, ...rightProtrusions].forEach(p=>{
    if(p.type==='plant' || p.type==='balcony' || p.type==='balcony_modern' || p.type==='laundry'){
      insectAnchors.push({ x: p.x + p.w*0.5, y: p.y + p.h*0.4 });
    }
  });
  // also scatter a few anchors up near the distant rooftops so insects aren't only near the ground
  for(let r=0;r<Math.min(2,buildingsByRow.length);r++){
    const rowBuildings = buildingsByRow[r].buildings;
    for(let i=0;i<rowBuildings.length;i+=3){
      const b = rowBuildings[i];
      insectAnchors.push({ x: b.x+b.w*0.5, y: b.top-rand(2,8) });
    }
  }
  const insects = generateInsects(insectAnchors);

  // external wall light on the right building
  const wallLampY = rand(H*0.3, H*0.65);
  const wallLamp = { x: edgeXAt(rightEdge, wallLampY)+6, y: wallLampY, threshold: rand(0,1) };

  // a couple of fire-escape landings on the right wall, following its curve
  const landings = [];
  [0.35, 0.6].forEach(f=>{
    const y0 = H*f;
    landings.push({ y: y0, ex: edgeXAt(rightEdge, y0), depth: rand(40,55) });
  });

  // foreground alley staircase, bounded by the two frame edges, reaching further back
  const alleySteps = [];
  let stepY = H;
  let inset = 0;
  while(stepY > H*0.50){
    alleySteps.push({
      y: stepY,
      left: edgeXAt(leftEdge, stepY) - 14 + inset,
      right: edgeXAt(rightEdge, stepY) + 14 - inset
    });
    stepY -= rand(14,22);
    inset += rand(1.5,3.5);
  }

  // wires that enter the scene from above, as if strung down from poles higher up the hill,
  // out of frame — origins are spread along a band just above the top edge (toward each
  // wire's own target) so they don't all converge to one unnatural point
  const centralWires = [];
  const wireTargets = [
    { x: edgeXAt(leftEdge, topY*0.6)+10, y: topY*0.55 },
    { x: edgeXAt(leftEdge, topY*1.1)+10, y: topY*1.05 },
    { x: edgeXAt(rightEdge, topY*0.5)-10, y: topY*0.45 },
    { x: edgeXAt(rightEdge, topY*1.0)-10, y: topY*0.95 },
    { x: W*0.3, y: topY*1.3 },
    { x: W*0.78, y: topY*1.45 }
  ];
  wireTargets.forEach(p=> centralWires.push({
    x0: clamp(p.x + rand(-90,90), 20, W-20), y0: rand(-28,-8),
    x1: p.x, y1: p.y, sag: rand(10,28)
  }));
  const centralPole = { wires: centralWires };

  // at night, small gnat swarms gather around each light source (street lamps and the wall lamp)
  const gnatAnchors = allLamps.map(l=>({ x:l.x, y:l.y, threshold:l.threshold }));
  gnatAnchors.push({ x: wallLamp.x, y: wallLamp.y, threshold: wallLamp.threshold });
  const gnatSwarms = generateGnatSwarms(gnatAnchors);

  return {
    rows: buildingsByRow, poles, trees, stars, clouds, ridgePoints, ridgeLights, topY, bottomY,
    leftEdge, rightEdge, leftFloors, rightFloors, leftDetails, rightDetails, leftProtrusions, rightProtrusions, wallLamp, landings, alleySteps, centralPole,
    leftRoof, rightRoof, leftWeathering, leftCracks, rightWeathering, rightCracks, insects, gnatSwarms
  };
}

// ---------- starburst ----------
function drawStarburst(x, y, size, alpha){
  if(alpha<=0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;

  const core = 'rgba(255,244,214,0.95)';
  const mid  = 'rgba(255,170,70,0)';

  const halo = ctx.createRadialGradient(x,y,0, x,y,size*2.4);
  halo.addColorStop(0, 'rgba(255,180,90,0.55)');
  halo.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x,y,size*2.4,0,Math.PI*2);
  ctx.fill();

  function spike(angle, length, width){
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = -dy, py = dx;
    const grad = ctx.createLinearGradient(x,y, x+dx*length, y+dy*length);
    grad.addColorStop(0, core);
    grad.addColorStop(1, mid);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+dx*length*0.12+px*width, y+dy*length*0.12+py*width);
    ctx.lineTo(x+dx*length, y+dy*length);
    ctx.lineTo(x+dx*length*0.12-px*width, y+dy*length*0.12-py*width);
    ctx.closePath();
    ctx.fill();
  }
  for(let i=0;i<4;i++) spike(i*(Math.PI/2), size*3.2, 0.9);
  for(let i=0;i<4;i++) spike(Math.PI/4 + i*(Math.PI/2), size*1.6, 0.6);

  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x,y, size*0.6, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// ---------- small flying insects (butterflies/bees) ----------
// tiny butterfly: two flapping wings around a thin body, drifting in an organic Lissajous-like path
function drawButterfly(x, y, ins, now){
  const flap = Math.sin(now*ins.wingFreq + ins.wingPhase); // -1..1
  const wingSpread = ins.size*(0.55 + 0.45*Math.abs(flap));
  const wingTilt = flap*0.5;
  ctx.fillStyle = ins.color;
  ctx.save();
  ctx.translate(x,y);
  ctx.beginPath();
  ctx.ellipse(-wingSpread*0.55, 0, wingSpread*0.6, ins.size*0.85, -0.5+wingTilt, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(wingSpread*0.55, 0, wingSpread*0.6, ins.size*0.85, 0.5-wingTilt, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(50,42,34,0.8)';
  ctx.fillRect(-ins.size*0.06, -ins.size*0.5, ins.size*0.12, ins.size);
  ctx.restore();
}
// tiny bee: dark striped body with a soft, fast-flickering wing blur
function drawBee(x, y, ins, now){
  const wingAlpha = 0.18 + 0.22*Math.abs(Math.sin(now*ins.wingFreq + ins.wingPhase));
  ctx.fillStyle = `rgba(232,232,238,${wingAlpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y-ins.size*0.35, ins.size*1.3, ins.size*0.65, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#3a2e18';
  ctx.beginPath();
  ctx.ellipse(x, y, ins.size*0.75, ins.size*0.5, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#e8b840';
  ctx.fillRect(x-ins.size*0.55, y-ins.size*0.16, ins.size*1.1, ins.size*0.32);
}
// butterflies/bees wander near flowers, trees and balconies by day, and settle into
// hiding around that same vegetation as evening turns to night (see insectActivity)
function drawInsects(t, now){
  const dayAct = insectActivity(t);
  if(dayAct<=0.02) return; // all butterflies/bees disappear once it's fully night
  scene.insects.forEach(ins=>{
    const roamR = ins.roam*dayAct;
    const dx = Math.sin(now*ins.f1x+ins.p1x)*roamR + Math.sin(now*ins.f2x+ins.p2x)*roamR*0.35;
    const dy = Math.cos(now*ins.f1y+ins.p1y)*roamR*0.6 + Math.sin(now*ins.f2y+ins.p2y)*roamR*0.25;
    const x = ins.anchorX+dx, y = ins.anchorY+dy;
    ctx.globalAlpha = dayAct*0.85;
    if(ins.type==='bee') drawBee(x,y,ins,now); else drawButterfly(x,y,ins,now);
    ctx.globalAlpha = 1;
  });
}
// tiny gnats circling each light source — they appear as the lamps/windows turn on at dusk
function drawGnats(t, now){
  const litProgress = clamp((t-0.55)/0.35, 0, 1);
  scene.gnatSwarms.forEach(sw=>{
    const fade = clamp((litProgress - sw.threshold)*5, 0, 1);
    if(fade<=0.02) return;
    ctx.globalAlpha = fade*0.7;
    ctx.fillStyle = '#2a241c';
    sw.flies.forEach(f=>{
      const dx = Math.sin(now*f.f1+f.p1)*f.r;
      const dy = Math.cos(now*f.f2+f.p2)*f.r*0.7;
      ctx.beginPath();
      ctx.arc(sw.x+dx, sw.y+dy, f.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  });
}

function drawWindow(win, glassColor, litProgress, tFlare, flares, t, ease){
  if(ease===undefined) ease = 1;
  const faint = !!win.faint;
  // window frame: full cream trim for normal windows; thin/translucent for "faint" windows so the wall reads through
  if(faint){
    ctx.fillStyle = 'rgba(242,236,224,0.35)';
    ctx.fillRect(win.x-0.5, win.y-0.5, win.w+1, win.h+1);
  } else {
    ctx.fillStyle = TRIM_COLOR;
    ctx.fillRect(win.x-1.5, win.y-1.5, win.w+3, win.h+3);
  }

  ctx.fillStyle = faint ? win.faintGlass : glassColor;
  ctx.fillRect(win.x, win.y, win.w, win.h);
  const fade = clamp((litProgress - win.threshold)*5, 0, 1) * (faint ? 0.6 : 1);
  if(fade>0.01){
    const glow = lerp(0.45, 1, ease); // distant windows glow smaller & dimmer
    ctx.save();
    ctx.globalAlpha = fade * glow;
    ctx.shadowColor = win.lit;
    ctx.shadowBlur = lerp(1.5, 5, ease);
    ctx.fillStyle = win.lit;
    ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.restore();
    if(fade>0.4){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (fade-0.4)*0.5*glow;
      ctx.fillStyle = win.lit;
      ctx.fillRect(win.x-1, win.y-1, win.w+2, win.h+2);
      ctx.restore();
    }
    if(win.flare){
      const fAlpha = tFlare * fade * glow;
      if(fAlpha>0.01) flares.push({ x: win.x+win.w/2, y: win.y+win.h/2, size: lerp(1.2,3.0, win.w/16)*lerp(0.5,1,ease), alpha: fAlpha });
    }
  }

  // curtains slide closed from each side as evening turns to night, staggered per window
  if(win.hasCurtain){
    const curtainProgress = clamp((litProgress - win.threshold*0.4)*1.8, 0, 1);
    if(curtainProgress>0.01){
      const cw = (win.w/2) * curtainProgress;
      ctx.fillStyle = win.curtainColor;
      ctx.fillRect(win.x, win.y, cw, win.h);
      ctx.fillRect(win.x+win.w-cw, win.y, cw, win.h);
      if(cw>3){
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(win.x+cw*0.6, win.y); ctx.lineTo(win.x+cw*0.6, win.y+win.h);
        ctx.moveTo(win.x+win.w-cw*0.6, win.y); ctx.lineTo(win.x+win.w-cw*0.6, win.y+win.h);
        ctx.stroke();
      }
    }
  }
}

function drawBalcony(b, metalColor){
  ctx.strokeStyle = metalColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x+b.w, b.y);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for(let px=b.x; px<=b.x+b.w; px+=8){
    ctx.beginPath();
    ctx.moveTo(px, b.y);
    ctx.lineTo(px, b.y+b.h);
    ctx.stroke();
  }
}

// small protruding street-level details: awning, AC unit, signboard, potted plant
function drawProtrusion(p, t, flares, tFlare){
  if(p.type==='awning'){
    const colA = AWNING_A_START;
    const colB = AWNING_B_START;
    ctx.fillStyle = p.stripe ? colA : colB;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = p.stripe ? colB : colA;
    const stripeW = p.w/4;
    ctx.fillRect(p.x, p.y, stripeW, p.h);
    ctx.fillRect(p.x+stripeW*2, p.y, stripeW, p.h);
    ctx.strokeStyle = '#5a4a40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.side==='left'? p.x : p.x+p.w, p.y);
    ctx.lineTo(p.side==='left'? p.x+p.w*0.6 : p.x+p.w*0.4, p.y+p.h+8);
    ctx.stroke();
  } else if(p.type==='ac'){
    ctx.fillStyle = '#cac6bd';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#8a857a';
    ctx.lineWidth = 1;
    for(let i=1;i<4;i++){
      ctx.beginPath();
      ctx.moveTo(p.x+2, p.y+i*p.h/4);
      ctx.lineTo(p.x+p.w-2, p.y+i*p.h/4);
      ctx.stroke();
    }
  } else if(p.type==='plant'){
    ctx.fillStyle = POT_START;
    ctx.fillRect(p.x, p.y+p.h*0.5, p.w, p.h*0.5);
    ctx.fillStyle = LEAF_START[1];
    ctx.beginPath();
    ctx.arc(p.x+p.w/2, p.y+p.h*0.35, p.w*0.55, 0, Math.PI*2);
    ctx.fill();
  } else if(p.type==='railing'){
    const metal = METAL_START;
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x+p.w, p.y);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for(let px=p.x; px<=p.x+p.w; px+=8){
      ctx.beginPath();
      ctx.moveTo(px, p.y);
      ctx.lineTo(px, p.y+p.h);
      ctx.stroke();
    }
  } else if(p.type==='pipe'){
    ctx.strokeStyle = p.side==='right' ? PVC_PIPE : '#7a756c';
    ctx.lineWidth = Math.max(3, p.w);
    ctx.beginPath();
    ctx.moveTo(p.x+p.w/2, p.y);
    ctx.lineTo(p.x+p.w/2, p.y+p.h);
    ctx.stroke();
  } else if(p.type==='balcony'){
    // old-building balcony: solid slab + weathered, slightly rusty railing bars
    ctx.fillStyle = '#8a8276';
    ctx.fillRect(p.x, p.y+p.h-3, p.w, 3);
    ctx.strokeStyle = RUST_METAL;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x+p.w, p.y); ctx.stroke();
    ctx.lineWidth = 1.5;
    for(let px=p.x; px<=p.x+p.w; px+=9){
      ctx.beginPath(); ctx.moveTo(px, p.y); ctx.lineTo(px, p.y+p.h-3); ctx.stroke();
    }
  } else if(p.type==='balcony_modern'){
    // newer-building balcony: solid slab + tinted glass balustrade
    ctx.fillStyle = '#c8c2b6';
    ctx.fillRect(p.x, p.y+p.h-3, p.w, 3);
    ctx.fillStyle = 'rgba(190,205,212,0.30)';
    ctx.fillRect(p.x, p.y, p.w, p.h-3);
    ctx.strokeStyle = METAL_START;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h-3);
  } else if(p.type==='laundry'){
    // a clothesline strung between two points, with a few hanging clothes
    ctx.strokeStyle = 'rgba(80,75,68,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x+p.w, p.y); ctx.stroke();
    (p.laundryItems||[]).forEach(li=>{
      const cx = p.x + p.w*li.t;
      ctx.fillStyle = li.color;
      ctx.fillRect(cx-li.w/2, p.y+1, li.w, li.h);
    });
  } else if(p.type==='utilitybox'){
    // small modern utility/electric meter box with an indicator light
    ctx.fillStyle = '#8a929a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#5e6670';
    ctx.lineWidth = 1;
    for(let i=1;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(p.x+2, p.y+i*p.h/3);
      ctx.lineTo(p.x+p.w-2, p.y+i*p.h/3);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(p.x+p.w-5, p.y+2, 2, 2);
  }
}

// ---------- main render ----------
function render(t){
  // t: 0=morning, 0.22=afternoon, 0.42=sunset begins, 0.58=sunset peak, 0.72=dusk(orange->red),
  // 0.85=evening(purple/navy), 1=night. ONLY the sky gradient, clouds and sun
  // animate with t. The village itself (buildings, wires, pole, railings, steps, windows, pots,
  // trees, road) keeps fixed "original" colors at all times — the only thing that changes there
  // is which window/lamp/sign LIGHTS turn on (litProgress/tFlare).
  const litProgress = clamp((t-0.55)/0.35, 0, 1);
  const tFlare = clamp((t-0.88)/0.12, 0, 1);
  const glassColor = GLASS_START;
  const haze = HAZE_STOPS[0]; // fixed atmospheric haze, does not change with time of day
  const hazeFar = HAZE_FAR;
  const hazeNear = HAZE_NEAR;
  const flares = [];

  // ---- sky layer: confined to the strip above the village (y < topY) ----
  const skyTop = stageColor(SKY_TOP_STOPS, t);
  const skyMid = stageColor(SKY_MID_STOPS, t);
  const skyBottom = stageColor(SKY_BOTTOM_STOPS, t);
  const skyH = scene.topY;
  const skyGrad = ctx.createLinearGradient(0,0,0,skyH);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(0.5, skyMid);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0,0,W,skyH);

  // fixed backdrop behind the village — constant color, never animates with time
  ctx.fillStyle = BG_FIXED;
  ctx.fillRect(0,skyH,W,H-skyH);

  // ---- clouds (puffy clusters, clipped to the sky strip, fade away by night) ----
  const cloudColor = stageColor(CLOUD_STOPS, t);
  const cloudAlpha = 0.35;
  const cloudFade = clamp(1 - (t-0.58)/0.27, 0, 1);
  if(cloudFade>0.01){
    ctx.save();
    ctx.beginPath();
    ctx.rect(0,0,W,skyH);
    ctx.clip();
    scene.clouds.forEach(c=>{
      c.puffs.forEach(p=>{
        const cx = c.x+p.dx, cy = c.y+p.dy, r = p.r;
        ctx.globalAlpha = c.a * cloudAlpha * cloudFade;
        const g = ctx.createRadialGradient(cx,cy,0, cx,cy, r);
        g.addColorStop(0, cloudColor);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fill();
      });
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ---- stars (appear one by one at dusk, then twinkle continuously) ----
  const starProgress = clamp((t-0.80)/0.20, 0, 1);
  if(starProgress>0.01){
    const now = performance.now();
    scene.stars.forEach(s=>{
      const appear = clamp((starProgress - s.threshold)*6, 0, 1);
      if(appear<=0.01) return;
      const twinkle = 0.55 + 0.45*Math.sin(now*0.0015*s.speed + s.phase);
      ctx.globalAlpha = s.a * appear * twinkle;
      ctx.fillStyle = '#f4ede0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ---- village buildings ----
  scene.rows.forEach(row=>{
    row.buildings.forEach(b=> drawBuildingShell(b, row.ease, haze, hazeFar, hazeNear, t));
    row.alleys.forEach(a=>{ drawAlley(a, row); drawAlleyWall(a, row); });
  });

  // ---- village windows ----
  scene.rows.forEach(row=>{
    row.buildings.forEach(b=> b.windowRects.forEach(win=> drawWindow(win, glassColor, litProgress, tFlare, flares, t, row.ease)));
  });

  // ---- trees ----
  const trunkColor = TRUNK_START;
  const leafColors = [ LEAF_START[0], LEAF_START[1], LEAF_START[2] ];
  scene.trees.forEach(tr=>{
    ctx.fillStyle = trunkColor;
    ctx.fillRect(tr.x-tr.r*0.08, tr.y-tr.r*0.6, tr.r*0.16, tr.r*0.6);
    [0,1,2].forEach(i=>{
      ctx.fillStyle = leafColors[i];
      ctx.beginPath();
      ctx.arc(tr.x + (i-1)*tr.r*0.35, tr.y - tr.r*0.55 - (i%2)*tr.r*0.12, tr.r*0.55, 0, Math.PI*2);
      ctx.fill();
    });
  });

  // ---- poles + wires ----
  const poleColor = POLE_START;
  const wireColor = '#46403b';
  const wireNow = performance.now();
  scene.poles.forEach((lane,laneIdx)=>{
    ctx.strokeStyle = poleColor;
    ctx.lineWidth = 2;
    lane.items.forEach(p=>{
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - 70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x-12, p.y-62);
      ctx.lineTo(p.x+12, p.y-62);
      ctx.stroke();
    });
    ctx.strokeStyle = wireColor;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    const laneDepth = lerp(0.28, 0.42, laneIdx/Math.max(1,scene.poles.length-1)); // distant background poles react less
    for(let i=0;i<lane.items.length-1;i++){
      const a = lane.items[i], b = lane.items[i+1];
      [-62,-50].forEach((off,wi)=>{
        const sag = (b.x-a.x)*0.12;
        drawSwayWire(a.x,a.y+off, (a.x+b.x)/2,a.y+off+sag, b.x,b.y+off, i*2.3+wi*0.9+laneIdx*5, laneDepth, wireNow, t);
      });
    }
    ctx.globalAlpha = 1;
  });

  // ---- street lamps ----
  scene.poles[scene.poles.length-1].items.forEach((p,i)=>{
    if(i%2!==0) return;
    const lx = p.x + 60;
    if(lx > W-RIGHT_FRAME_W-10) return;
    ctx.strokeStyle = poleColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, p.y);
    ctx.lineTo(lx, p.y-80);
    ctx.lineTo(lx+10, p.y-86);
    ctx.stroke();
  });
  allLamps.forEach(lamp=>{
    const fade = clamp((litProgress - lamp.threshold)*5, 0, 1);
    const offColor = '#5b5650';
    ctx.fillStyle = offColor;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI*2); ctx.fill();
    if(fade>0.01){
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffe0a0';
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      const fAlpha = tFlare * fade;
      if(fAlpha>0.01) flares.push({ x: lamp.x, y: lamp.y, size: 4.5, alpha: fAlpha });
    }
  });

  // ---- central utility pole with fanning wires ----
  drawCentralPole(t);

  // ---- left frame: old brick building, soft irregular silhouette ----
  drawLeftFrame(t, litProgress, tFlare, flares, glassColor);

  // ---- right frame: concrete building with metal railings, soft silhouette ----
  drawRightFrame(t, litProgress, tFlare, flares, glassColor);

  // ---- foreground alley floor ----
  drawAlleySteps(t);

  // ---- small flying insects (butterflies/bees) ----
  drawInsects(t, performance.now());

  // ---- night gnats around lights ----
  drawGnats(t, performance.now());

  // ---- starburst flares ----
  flares.forEach(f=> drawStarburst(f.x, f.y, f.size, f.alpha));
}

// a narrow shadowed gap between two buildings, like a tight alley running back from the street
function drawAlley(a, row){
  const grad = ctx.createLinearGradient(0, a.topY, 0, a.bottomY);
  grad.addColorStop(0, 'rgba(8,7,11,0.94)');
  grad.addColorStop(1, 'rgba(30,25,26,0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(a.x, a.topY, a.w, a.bottomY - a.topY);
}
// a low concrete-block partition wall (가벽) capping the alley's street-level entrance
function drawAlleyWall(a, row){
  const ext = a.w*0.4;
  const wx = a.x - ext, ww = a.w + ext*2;
  const wy = a.bottomY - a.wallH;
  ctx.fillStyle = '#a39888';
  ctx.fillRect(wx, wy, ww, a.wallH);
  if(a.hasGate){
    const gw = a.w*0.7;
    ctx.fillStyle = 'rgba(10,9,12,0.85)';
    ctx.fillRect(a.x+(a.w-gw)/2, wy, gw, a.wallH);
  }
}

function drawBuildingShell(b, ease, haze, hazeFar, hazeNear, t){
  const { x, w, h, baseline, top, colorSet, roofType, gableH, skewH, parapetH } = b;

  ctx.fillStyle = colorSet.base;
  if(roofType === 'gable'){
    ctx.fillRect(x, top+gableH, w, h-gableH);
    ctx.fillStyle = colorSet.shade;
    ctx.beginPath();
    ctx.moveTo(x-1, top+gableH+0.5);
    ctx.lineTo(x+w+1, top+gableH+0.5);
    ctx.lineTo(x+w/2, top);
    ctx.closePath();
    ctx.fill();
  } else if(roofType === 'shed'){
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x+w, top+skewH);
    ctx.lineTo(x+w, baseline);
    ctx.lineTo(x, baseline);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, top, w, h);
    if(roofType === 'parapet'){
      ctx.fillStyle = colorSet.shade;
      ctx.fillRect(x-1, top, w+2, parapetH);
    } else {
      // thin roof cap so flat roofs read as a distinct surface, not just a slab edge
      ctx.fillStyle = colorSet.shade;
      ctx.fillRect(x-1, top, w+2, Math.max(2, h*0.025));
    }
  }

  const facadeTop = top + gableH + skewH + parapetH;
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(x, facadeTop, Math.min(2.5,w*0.06), baseline-facadeTop);

  if(b.hasTank){
    const tw = clamp(w*0.16, 6, 16);
    const th = tw*1.1;
    const tx = b.tankSide==='l' ? x + w*0.12 : x + w*0.78 - tw;
    const ty = top - th*0.6;
    ctx.fillStyle = '#9a958c';
    ctx.fillRect(tx, ty+th*0.25, tw, th*0.6);
    ctx.beginPath();
    ctx.ellipse(tx+tw/2, ty+th*0.25, tw/2, th*0.22, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#7a766f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx+1, ty+th*0.85); ctx.lineTo(tx+1, top);
    ctx.moveTo(tx+tw-1, ty+th*0.85); ctx.lineTo(tx+tw-1, top);
    ctx.stroke();
  }

  if(b.hasBox){
    const bw = w*b.boxW;
    const bh = h*0.18;
    const bx = x + (w-bw)/2;
    ctx.fillStyle = colorSet.shade;
    ctx.fillRect(bx, top-bh, bw, bh);
    // small window on the rooftop room (옥탑방)
    ctx.fillStyle = GLASS_START;
    ctx.fillRect(bx+bw*0.28, top-bh*0.7, bw*0.3, bh*0.45);
  }

  // rooftop railing (옥상 난간) on some buildings
  if(b.hasRailing && w>30){
    ctx.strokeStyle = '#8a857a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x+2, top); ctx.lineTo(x+w-2, top);
    ctx.stroke();
    for(let px=x+4; px<x+w-2; px+=9){
      ctx.beginPath();
      ctx.moveTo(px, top); ctx.lineTo(px, top-4);
      ctx.stroke();
    }
  }

  if(b.hasAntenna){
    const ax = x + w*b.antennaX;
    const ah = clamp(h*0.18, 8, 22);
    ctx.strokeStyle = '#5a574f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, top);
    ctx.lineTo(ax, top-ah);
    ctx.moveTo(ax-ah*0.3, top-ah*0.65);
    ctx.lineTo(ax+ah*0.3, top-ah*0.65);
    ctx.moveTo(ax-ah*0.18, top-ah*0.35);
    ctx.lineTo(ax+ah*0.18, top-ah*0.35);
    ctx.stroke();
  }

  // outdoor AC unit (실외기)
  if(b.hasAC && h>40){
    const aw = clamp(w*0.28, 14, 30);
    const ah2 = aw*0.6;
    const ax = b.acSide==='l' ? x + w*0.08 : x + w*0.92 - aw;
    const ay = baseline - h*0.42;
    ctx.fillStyle = '#cac6bd';
    ctx.fillRect(ax, ay, aw, ah2);
    ctx.strokeStyle = '#8a857a';
    ctx.lineWidth = 1;
    for(let i=1;i<4;i++){
      ctx.beginPath();
      ctx.moveTo(ax+2, ay+i*ah2/4);
      ctx.lineTo(ax+aw-2, ay+i*ah2/4);
      ctx.stroke();
    }
  }

  const hazeAlpha = lerp(hazeFar, hazeNear, ease);
  if(hazeAlpha > 0.01){
    ctx.fillStyle = haze;
    ctx.globalAlpha = hazeAlpha;
    ctx.fillRect(x, top-25, w, baseline-top+25);
    ctx.globalAlpha = 1;
  }
}

// ---------- left frame: old red-brick Haebangchon house/shop, stepped floors ----------
function drawLeftFrame(t, litProgress, tFlare, flares, glassColor){
  const nightDark = clamp((t-0.55)/0.4, 0, 1) * 0.5; // buildings darken a bit as night falls
  const wallColor = mix(BRICK_LEFT_START, BRICK_LEFT_END, nightDark);
  const edge = scene.leftEdge;
  const floors = scene.leftFloors;

  floorWallPath(ctx, floors, 'left');
  ctx.fillStyle = wallColor;
  ctx.fill();

  // subtle per-floor shading + brick texture, clipped to the stepped wall shape
  ctx.save();
  floorWallPath(ctx, floors, 'left');
  ctx.clip();
  floors.forEach((f,i)=>{
    if(i%2===1){
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, f.y0, LEFT_FRAME_W+70, f.y1-f.y0);
    }
  });
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1;
  for(let yy=0; yy<H; yy+=12){
    ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(LEFT_FRAME_W+70,yy); ctx.stroke();
  }
  for(let yy=0; yy<H; yy+=24){
    const offset = (Math.floor(yy/24)%2===0) ? 0 : 12;
    for(let xx=offset; xx<LEFT_FRAME_W+70; xx+=24){
      ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx,yy+12); ctx.stroke();
    }
  }
  // weathering: rain/rust streaks and a few cracks running through the old brick facade
  ctx.fillStyle = 'rgba(20,12,8,0.12)';
  scene.leftWeathering.forEach(s=> ctx.fillRect(s.x, s.y, s.w, s.h));
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 0.75;
  scene.leftCracks.forEach(pts=>{
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  });
  // soft warm light wash near the inner edge at sunset
  const warmWash = clamp(1-t*1.6, 0, 1) * 0.35;
  if(warmWash>0.01){
    const g = ctx.createLinearGradient(LEFT_FRAME_W+30,0, LEFT_FRAME_W-120,0);
    g.addColorStop(0, `rgba(255,170,110,${warmWash})`);
    g.addColorStop(1, 'rgba(255,170,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,LEFT_FRAME_W+70,H);
  }
  ctx.restore();

  // soft drop-shadows behind windows/balconies for a sense of depth
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  scene.leftDetails.windows.forEach(win=> ctx.fillRect(win.x+2, win.y+3, win.w, win.h));

  // small windows, randomly placed per floor
  scene.leftDetails.windows.forEach(win=> drawWindow(win, glassColor, litProgress, tFlare, flares, t));

  // protruding street-level details: awnings, AC units, balconies, laundry, plants, railings, pipes
  scene.leftProtrusions.forEach(p=> drawProtrusion(p, t, flares, tFlare));

  // a continuous downpipe following the stepped edge
  ctx.strokeStyle = '#7a756c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for(let yy=0; yy<=H; yy+=20){
    const ex = edgeXAt(edge, yy) - 10;
    if(yy===0) ctx.moveTo(ex, yy); else ctx.lineTo(ex, yy);
  }
  ctx.stroke();

  // small weathered rooftop room (옥탑방) with a tiny window, plus a satellite dish on the roofline
  const lr = scene.leftRoof;
  ctx.fillStyle = '#cfc3b0';
  ctx.fillRect(lr.shedX, 4, lr.shedW, lr.shedH);
  ctx.fillStyle = glassColor;
  ctx.fillRect(lr.shedX+lr.shedW*0.18, 4+lr.shedH*0.28, lr.shedW*0.3, lr.shedH*0.4);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(lr.shedX, 4, lr.shedW, 2);
  ctx.strokeStyle = '#aaa39a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lr.satX, lr.satY+10, 8, Math.PI*0.95, Math.PI*1.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lr.satX, lr.satY+10); ctx.lineTo(lr.satX-1, lr.satY+22); ctx.stroke();

  // wires crossing from the frame edge into the scene — foreground wires, sway most with the wind
  ctx.strokeStyle = wireBaseColor(t);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  const leftWireNow = performance.now();
  [ [edgeXAt(edge,260),260, W*0.45,180, W*0.85,240],
    [edgeXAt(edge,330),330, W*0.5,400, W*0.95,330] ].forEach((p,i)=>{
    drawSwayWire(p[0],p[1], p[2],p[3], p[4],p[5], i*3.1+1.2, 0.9, leftWireNow, t);
  });
  ctx.globalAlpha = 1;
}
function wireBaseColor(t){ return '#46403b'; }

// ---- mouse-reactive wire sway ----
// u: 0..1 position along the wire. seed: per-wire phase offset so wires don't move in lockstep.
// depthFactor: 0=distant/far wires (react less), 1=near/foreground wires (react more).
// Wires are pinned at both ends (poles stay fixed) and sway most in the middle (taper).
function wireSway(u, seed, depthFactor, now, t){
  const nightBoost = clamp((t-0.55)/0.45, 0, 1) * 1.6; // wires drift more once night falls
  const amp = (0.6 + windIntensity*5.0 + nightBoost) * depthFactor; // ambient tremble + wind + night drift
  const taper = Math.sin(u*Math.PI); // 0 at both endpoints, max at the midpoint
  const slow = Math.sin(now*0.0011 + seed + u*4.2);
  const ripple = Math.sin(now*0.0027 + seed*1.9 + u*7.8) * 0.45; // faster, smaller vibration on top
  return (slow + ripple) * amp * taper;
}
// draws a quadratic-curve-shaped wire as a swaying polyline (ctx.strokeStyle/lineWidth set by caller)
function drawSwayWire(x0,y0, cx,cy, x1,y1, seed, depthFactor, now, t){
  const N = 10;
  ctx.beginPath();
  for(let i=0;i<=N;i++){
    const u = i/N, mu = 1-u;
    const bx = mu*mu*x0 + 2*mu*u*cx + u*u*x1;
    const by = mu*mu*y0 + 2*mu*u*cy + u*u*y1;
    const py = by + wireSway(u, seed, depthFactor, now, t);
    if(i===0) ctx.moveTo(bx,py); else ctx.lineTo(bx,py);
  }
  ctx.stroke();
}

// ---------- fanning wires that enter the scene from above ----------
function drawCentralPole(t){
  const p = scene.centralPole;
  const wireColor = wireBaseColor(t);

  // these sway gently with the wind, and more at night
  const now = performance.now();
  ctx.strokeStyle = wireColor;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.85;
  p.wires.forEach((w,i)=>{
    drawSwayWire(w.x0,w.y0, (w.x0+w.x1)/2,Math.max(w.y0,w.y1)+w.sag, w.x1,w.y1, i*1.7+0.4, 0.85, now, t);
  });
  ctx.globalAlpha = 1;
}

// ---------- right frame: concrete multi-family house, stepped floors, steel railings ----------
function drawRightFrame(t, litProgress, tFlare, flares, glassColor){
  const nightDark = clamp((t-0.55)/0.4, 0, 1) * 0.5; // buildings darken a bit as night falls
  const wallColor = mix(CONCRETE_RIGHT_START, CONCRETE_RIGHT_END, nightDark);
  const edge = scene.rightEdge;
  const floors = scene.rightFloors;

  floorWallPath(ctx, floors, 'right');
  ctx.fillStyle = wallColor;
  ctx.fill();

  // subtle per-floor shading + concrete seams, clipped to the stepped wall shape
  ctx.save();
  floorWallPath(ctx, floors, 'right');
  ctx.clip();
  floors.forEach((f,i)=>{
    if(i%2===1){
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(W-RIGHT_FRAME_W-70, f.y0, RIGHT_FRAME_W+70, f.y1-f.y0);
    }
  });
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = 1;
  for(let yy=0; yy<H; yy+=130){
    ctx.beginPath(); ctx.moveTo(W-RIGHT_FRAME_W-70,yy); ctx.lineTo(W,yy); ctx.stroke();
  }
  for(let xx=W-RIGHT_FRAME_W; xx<W; xx+=70){
    ctx.beginPath(); ctx.moveTo(xx,0); ctx.lineTo(xx,H); ctx.stroke();
  }
  // subtle precast-panel tone variation across floors
  floors.forEach((f,i)=>{
    if(i%3===0){
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(W-RIGHT_FRAME_W-70, f.y0, RIGHT_FRAME_W+70, f.y1-f.y0);
    }
  });
  // weathering: grime/water-stain streaks and a few cracks running through the concrete
  ctx.fillStyle = 'rgba(25,25,24,0.12)';
  scene.rightWeathering.forEach(s=> ctx.fillRect(s.x, s.y, s.w, s.h));
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 0.75;
  scene.rightCracks.forEach(pts=>{
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  });
  const warmWash = clamp(1-t*1.6, 0, 1) * 0.30;
  if(warmWash>0.01){
    const g = ctx.createLinearGradient(W-RIGHT_FRAME_W-30,0, W-RIGHT_FRAME_W+100,0);
    g.addColorStop(0, `rgba(255,170,110,${warmWash})`);
    g.addColorStop(1, 'rgba(255,170,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(W-RIGHT_FRAME_W-70,0,RIGHT_FRAME_W+70,H);
  }
  ctx.restore();

  // soft drop-shadows behind windows/balconies for a sense of depth
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  scene.rightDetails.windows.forEach(win=> ctx.fillRect(win.x+2, win.y+3, win.w, win.h));

  // small windows, randomly placed per floor
  scene.rightDetails.windows.forEach(win=> drawWindow(win, glassColor, litProgress, tFlare, flares, t));

  const metal = METAL_START;

  // protruding street-level details: glass balconies, AC units, utility boxes, plants, railings, pipes
  scene.rightProtrusions.forEach(p=> drawProtrusion(p, t, flares, tFlare));

  // external wall light (외부 조명)
  const wl = scene.wallLamp;
  const wlFade = clamp((litProgress - wl.threshold)*5, 0, 1);
  ctx.strokeStyle = metal;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wl.x-12, wl.y); ctx.lineTo(wl.x, wl.y); ctx.stroke();
  ctx.fillStyle = wlFade>0.05 ? '#ffe0a0' : '#5b5650';
  ctx.beginPath(); ctx.arc(wl.x+4, wl.y, 5, 0, Math.PI*2); ctx.fill();
  if(wlFade>0.05){
    const fAlpha = tFlare * wlFade;
    if(fAlpha>0.01) flares.push({ x: wl.x+4, y: wl.y, size: 4, alpha: fAlpha });
  }

  // rooftop terrace railing along the top of the building
  const topF = floors[0];
  const topEx = Math.min(topF.edgeTop, topF.edgeBottom);
  ctx.strokeStyle = metal;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(topEx-10, topF.y0+6); ctx.lineTo(W, topF.y0+6); ctx.stroke();
  ctx.lineWidth = 2;
  for(let px=topEx; px<W; px+=26){
    ctx.beginPath(); ctx.moveTo(px,topF.y0+6); ctx.lineTo(px,topF.y0-24); ctx.stroke();
  }
  // small rooftop garden: a few potted plants of varied size along the terrace
  scene.rightRoof.gardenPots.forEach(pot=>{
    ctx.fillStyle = POT_START;
    ctx.fillRect(pot.x-pot.r*0.6, topF.y0-pot.r*1.7, pot.r*1.2, pot.r*1.0);
    ctx.fillStyle = LEAF_START[pot.leafIdx];
    ctx.beginPath();
    ctx.arc(pot.x, topF.y0-pot.r*1.9, pot.r, 0, Math.PI*2);
    ctx.fill();
  });

  // compact modern water tank on the roof
  const rr = scene.rightRoof;
  ctx.fillStyle = TANK_MODERN;
  ctx.fillRect(rr.tankX, topF.y0-6-rr.tankH, rr.tankW, rr.tankH);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(rr.tankX, topF.y0-6-rr.tankH, rr.tankW, 3);
  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = 1;
  ctx.strokeRect(rr.tankX, topF.y0-6-rr.tankH, rr.tankW, rr.tankH);

  // satellite dish near the terrace edge
  ctx.strokeStyle = '#aaa39a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(rr.satX, topF.y0-24+rr.satY, 8, Math.PI*0.95, Math.PI*1.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rr.satX, topF.y0-24+rr.satY); ctx.lineTo(rr.satX-1, topF.y0-24+rr.satY+12); ctx.stroke();

  // fire-escape landings following the stepped wall
  ctx.strokeStyle = metal;
  ctx.lineWidth = 3;
  scene.landings.forEach(l=>{
    ctx.beginPath();
    ctx.moveTo(l.ex, l.y);
    ctx.lineTo(l.ex-l.depth, l.y+8);
    ctx.lineTo(l.ex-l.depth, l.y+44);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for(let px=l.ex-l.depth+4; px<l.ex; px+=8){
      ctx.beginPath(); ctx.moveTo(px,l.y+8); ctx.lineTo(px,l.y+2); ctx.stroke();
    }
    ctx.lineWidth = 3;
  });

  // a continuous modern (light PVC) downpipe following the stepped edge
  ctx.strokeStyle = PVC_PIPE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for(let yy=0; yy<=H; yy+=20){
    const ex = edgeXAt(edge, yy) + 9;
    if(yy===0) ctx.moveTo(ex, yy); else ctx.lineTo(ex, yy);
  }
  ctx.stroke();
}

// ---------- foreground alley staircase ----------
function drawAlleySteps(t){
  const tone = '#caa78a';
  const metal = METAL_START;

  scene.alleySteps.forEach(s=>{
    ctx.fillStyle = tone;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(s.left, s.y-3, s.right-s.left, 4);
    ctx.globalAlpha = 1;
  });

  // handrail posts along both sides of the staircase
  ctx.strokeStyle = metal;
  ctx.lineWidth = 1.5;
  const railPostsL = [], railPostsR = [];
  scene.alleySteps.forEach((s,i)=>{
    if(i%4===0){
      const ph = 22;
      ctx.beginPath(); ctx.moveTo(s.left+6, s.y); ctx.lineTo(s.left+6, s.y-ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.right-6, s.y); ctx.lineTo(s.right-6, s.y-ph); ctx.stroke();
      railPostsL.push({x:s.left+6, y:s.y-ph});
      railPostsR.push({x:s.right-6, y:s.y-ph});
    }
  });
  // handrail lines connecting the posts
  [railPostsL, railPostsR].forEach(posts=>{
    if(posts.length<2) return;
    ctx.beginPath();
    ctx.moveTo(posts[0].x, posts[0].y);
    for(let i=1;i<posts.length;i++) ctx.lineTo(posts[i].x, posts[i].y);
    ctx.stroke();
  });

  // small potted plants along the staircase
  scene.alleySteps.forEach((s,i)=>{
    if(i%7===2 || i%7===5){
      const side = i%2===0 ? 'l' : 'r';
      const px = side==='l' ? s.left-2 : s.right+2;
      ctx.fillStyle = POT_START;
      ctx.fillRect(px-7, s.y-13, 14, 12);
      ctx.fillStyle = LEAF_START[(i%3)];
      ctx.beginPath();
      ctx.arc(px, s.y-17, 10, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // low side walls with larger pots at the foot of the staircase
  const last = scene.alleySteps[scene.alleySteps.length-1];
  const wallY = last.y - 10;
  ctx.fillStyle = '#b89a78';
  ctx.fillRect(last.left, wallY-26, 90, 26);
  ctx.fillRect(last.right-90, wallY-26, 90, 26);
  [ [last.left+14, wallY-26], [last.right-30, wallY-26] ].forEach(p=>{
    ctx.fillStyle = POT_START;
    ctx.fillRect(p[0]-8, p[1]-14, 16, 14);
    ctx.fillStyle = LEAF_START[2];
    ctx.beginPath();
    ctx.arc(p[0], p[1]-18, 12, 0, Math.PI*2);
    ctx.fill();
  });
}


// ---------- p5 setup / draw ----------
const PERIOD = 60000; // ms for a full sunset -> night -> sunset cycle
let isPlaying = true;
let manualT = 0;
let startTime = 0;

function setup(){
  createCanvas(W, H);
  ctx = drawingContext;
  pixelDensity(1);
  startTime = millis();

  regenerate();
}

function regenerate(){
  scene = generateScene();
}

function currentT(){
  if(!isPlaying) return manualT;
  const phase = ((millis() - startTime) % PERIOD) / PERIOD;
  return (1 - Math.cos(2*Math.PI*phase)) / 2;
}

function draw(){
  const t = currentT();
  windIntensity *= 0.95; // smooth settle-back toward rest when the mouse stops moving
  render(t);
}

// ---- mouse/touch scrubbing: moving the pointer left->right over the scene scrubs morning->night ----
function scrubFromX(px){
  if(px < 0 || px > width) return;
  isPlaying = false;
  manualT = constrain(px / width, 0, 1);
}
// moving the pointer also stirs a light breeze that makes the utility wires sway
function bumpWind(dx, dy){
  const fdx = dx/width, fdy = dy/height;
  const dist = Math.sqrt(fdx*fdx + fdy*fdy);
  windIntensity = clamp(windIntensity + dist*11, 0, 1);
}
function mouseMoved(){ scrubFromX(mouseX); bumpWind(mouseX-pmouseX, mouseY-pmouseY); }
function touchMoved(){ scrubFromX(mouseX); bumpWind(mouseX-pmouseX, mouseY-pmouseY); return false; }
