import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

window.addEventListener('error', () => {});

/* ==================================================================
   DEVICE / ACCESSIBILITY
================================================================== */
const isMobile = matchMedia('(max-width:800px)').matches;
const lowPower = isMobile || navigator.hardwareConcurrency <= 4;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const QUALITY = {
  dpr: lowPower ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2),
  shadowMapSize: lowPower ? 1024 : 2048,
  ssao: !lowPower,
  bloom: true
};

/* ==================================================================
   LOADING
================================================================== */
const TOTAL_STEPS = 30;
let buildProgress = 0;
const loadingBar = document.getElementById('loading-bar');
const loadingPct = document.getElementById('loading-pct');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');

function tickLoading() {
  buildProgress = Math.min(buildProgress + 1, TOTAL_STEPS);
  const pct = Math.round((buildProgress / TOTAL_STEPS) * 100);
  loadingBar.style.width = pct + '%';
  loadingPct.textContent = pct + '%';
}
function finishLoading() {
  document.getElementById('scene').classList.add('ready');
  loadingEl.classList.add('hidden');
}
function showFatalError() {
  loadingEl.classList.add('hidden');
  errorEl.style.display = 'flex';
}

/* ==================================================================
   TEXTURE HELPERS
================================================================== */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function noiseHeightCanvas(size, cells, contrast, base, blur) {
  size = size || 256;
  cells = cells || 50;
  contrast = contrast || 36;
  base = base || 128;
  blur = blur === undefined ? 3 : blur;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(' + base + ',' + base + ',' + base + ')';
  ctx.fillRect(0, 0, size, size);
  ctx.filter = 'blur(' + blur + 'px)';
  for (let i = 0; i < cells; i++) {
    const v = Math.max(0, Math.min(255, base + (Math.random() * 2 - 1) * contrast));
    ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.55)';
    const r = size * (0.04 + Math.random() * 0.1);
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  return c;
}

function heightToNormalCanvas(heightCanvas, strength) {
  strength = strength || 1.4;
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const sctx = heightCanvas.getContext('2d');
  const src = sctx.getImageData(0, 0, w, h).data;
  const out = makeCanvas(w, h);
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);

  function getH(x, y) {
    x = (x + w) % w;
    y = (y + h) % h;
    const i = (y * w + x) * 4;
    return src[i] / 255;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hL = getH(x - 1, y);
      const hR = getH(x + 1, y);
      const hU = getH(x, y - 1);
      const hD = getH(x, y + 1);
      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const i = (y * w + x) * 4;
      img.data[i] = (dx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (dz / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

function makeNormalTexture(opts) {
  opts = opts || {};
  const h = noiseHeightCanvas(opts.size || 256, opts.cells || 50, opts.contrast || 36, 128, opts.blur === undefined ? 3 : opts.blur);
  const n = heightToNormalCanvas(h, opts.strength === undefined ? 1.2 : opts.strength);
  const tex = new THREE.CanvasTexture(n);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat, opts.repeat);
  tickLoading();
  return tex;
}

const NORMAL_FINE = makeNormalTexture({ size: 256, cells: 90, contrast: 20, blur: 2, strength: 0.9, repeat: 4 });
const NORMAL_COARSE = makeNormalTexture({ size: 256, cells: 36, contrast: 46, blur: 4, strength: 1.6, repeat: 3 });

function makeWoodTexture(tint, dark) {
  tint = tint || '#7a5338';
  dark = dark || '#3c2516';
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * 512;
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.05 + Math.random() * 0.12;
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6 + (Math.random() * 4 - 2));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < 512; x += 64) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeMarbleTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2ede3';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = 'rgba(150,140,120,' + (0.12 + Math.random() * 0.2) + ')';
    ctx.lineWidth = 0.6 + Math.random() * 2.2;
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < 512) {
      x += (Math.random() - 0.5) * 60;
      y += 20 + Math.random() * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeStoneSlabTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9c9188';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 86) {
    for (let x = 0; x < 512; x += 2) {
      const v = 150 + Math.random() * 40;
      ctx.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + (v - 12) + ',0.5)';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = 'rgba(60,54,48,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeHexTileTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e9e2d4';
  ctx.fillRect(0, 0, 512, 512);
  const r = 28;
  const hx = r * 1.73;
  const hy = r * 1.5;
  ctx.strokeStyle = 'rgba(120,108,88,0.5)';
  ctx.lineWidth = 2;
  for (let row = -1; row < 512 / hy + 1; row++) {
    for (let col = -1; col < 512 / hx + 1; col++) {
      const cx = col * hx + (row % 2 ? hx / 2 : 0);
      const cy = row * hy;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = Math.random() > 0.9 ? '#ded3bd' : '#efe9dc';
      ctx.fill();
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makePlasterTexture(base) {
  base = base || '#a8572f';
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.filter = 'blur(1.5px)';
  for (let i = 0; i < 300; i++) {
    const v = Math.random() * 20 - 10;
    const c2 = v > 0 ? 255 : 0;
    ctx.fillStyle = 'rgba(' + c2 + ',' + c2 + ',' + c2 + ',' + (Math.abs(v) / 120) + ')';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  ctx.filter = 'none';
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeStoneFloorTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9bfaf';
  ctx.fillRect(0, 0, 512, 512);
  const cell = 128;
  for (let y = 0; y < 512; y += cell) {
    for (let x = 0; x < 512; x += cell) {
      const v = 190 + Math.random() * 25;
      ctx.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 18) + ')';
      ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
    }
  }
  ctx.strokeStyle = 'rgba(90,82,70,0.5)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += cell) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += cell) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeGeoRugTexture(base, line) {
  base = base || '#9c7a52';
  line = line || '#3c2a18';
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = line;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 6;
  const step = 64;
  for (let i = -512; i < 1024; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = line;
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 472, 472);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeWallPatternTexture(baseHex, accentHex, style) {
  style = style || 'stripe';
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = accentHex;
  ctx.globalAlpha = 0.14;

  if (style === 'stripe') {
    ctx.lineWidth = 2;
    for (let x = 0; x <= size; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  } else if (style === 'diamond') {
    ctx.lineWidth = 1.6;
    const step = 46;
    for (let i = -size; i < size * 2; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
  } else if (style === 'grid') {
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= size; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else if (style === 'arch') {
    ctx.lineWidth = 2;
    for (let x = -40; x <= size + 40; x += 80) {
      ctx.beginPath();
      ctx.arc(x, size, 60, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tickLoading();
  return tex;
}

function makeShadowTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.42)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tickLoading();
  return tex;
}

/* ==================================================================
   SCENE / RENDERER
================================================================== */
const canvas = document.getElementById('scene');
let renderer, scene, camera, composer;

try {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(QUALITY.dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} catch (e) {
  showFatalError();
  throw e;
}

RectAreaLightUniformsLib.init();

scene = new THREE.Scene();
scene.background = new THREE.Color(0xeee6d6);
scene.fog = new THREE.Fog(0xf3ead9, 9, 26);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);

/* ==================================================================
   LIGHTING
================================================================== */
scene.add(new THREE.HemisphereLight(0xfff3e2, 0xc9c2b4, 0.55));

const sun = new THREE.DirectionalLight(0xffe9c7, 1.1);
sun.position.set(6, 10, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize);
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.bias = -0.0015;
scene.add(sun);

/* ==================================================================
   GEOMETRY / HELPERS
================================================================== */
function rbox(w, h, d, r, seg) {
  r = r === undefined ? 0.04 : r;
  seg = seg || 3;
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
}
function mesh(geo, mat, x, y, z, ry) {
  ry = ry || 0;
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function cyl(r1, r2, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function sph(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function pillow(r, len, mat, x, y, z, rz) {
  rz = rz === undefined ? Math.PI / 2 : rz;
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
  m.position.set(x, y, z);
  m.rotation.z = rz;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function torus(r, tube, mat, x, y, z, rx) {
  rx = rx === undefined ? Math.PI / 2 : rx;
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 32), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.castShadow = true;
  return m;
}
function group(x, y, z, ry) {
  x = x || 0; y = y || 0; z = z || 0; ry = ry || 0;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}
function shadowBlob(size, shadowTex, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}
function book(w, h, d, color, x, y, z, ry) {
  ry = ry || 0;
  const m = new THREE.Mesh(rbox(w, h, d, 0.01, 1), new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 }));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function bookStack(x, y, z, count) {
  count = count || 4;
  const g = group(x, y, z);
  const palette = [0x8a3b2b, 0x2f4a3c, 0x3c3a5e, 0xa88142, 0x5e2f2f];
  let h = 0;
  for (let i = 0; i < count; i++) {
    const bh = 0.045 + Math.random() * 0.03;
    const b = book(0.26 + Math.random() * 0.05, bh, 0.19, palette[i % palette.length], 0, h + bh / 2, 0, (Math.random() - 0.5) * 0.08);
    g.add(b);
    h += bh;
  }
  return g;
}

const SHADOW_TEX = makeShadowTexture();

function coveStrip(length, color, x, y, z, ry) {
  ry = ry || 0;
  const g = group(x, y, z, ry);
  const bar = mesh(new THREE.BoxGeometry(length, 0.03, 0.05),
    new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4 }), 0, 0, 0);
  g.add(bar);
  const light = new THREE.RectAreaLight(color, 1.6, length, 0.06);
  light.position.set(0, -0.02, 0.03);
  light.rotation.x = Math.PI / 2;
  g.add(light);
  return g;
}

function woodSlatWall(width, height, mat, slatW, gap) {
  slatW = slatW || 0.09;
  gap = gap || 0.05;
  const count = Math.floor(width / (slatW + gap));
  const geo = new THREE.BoxGeometry(slatW, height, 0.06);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const start = -width / 2 + slatW / 2;
  for (let i = 0; i < count; i++) {
    dummy.position.set(start + i * (slatW + gap), height / 2, 0);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

function flutedPanel(width, height, mat, fluteR) {
  fluteR = fluteR || 0.045;
  const count = Math.floor(width / (fluteR * 1.7));
  const geo = new THREE.CylinderGeometry(fluteR, fluteR, height, 10, 1, true, 0, Math.PI);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const start = -width / 2 + fluteR;
  for (let i = 0; i < count; i++) {
    dummy.position.set(start + i * fluteR * 1.7, height / 2, 0);
    dummy.rotation.y = Math.PI / 2;
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

function archPortal(x, y, z, width, height, mat) {
  const g = group(x, y, z);
  const postW = 0.22, postD = 0.3;
  g.add(mesh(rbox(postW, height, postD, 0.02), mat, -width / 2 - postW / 2, height / 2, 0));
  g.add(mesh(rbox(postW, height, postD, 0.02), mat, width / 2 + postW / 2, height / 2, 0));
  g.add(mesh(rbox(width + postW * 2, 0.26, postD, 0.02), mat, 0, height + 0.13, 0));
  const threshold = mesh(new THREE.BoxGeometry(width + postW * 2, 0.02, postD), MAT.brass, 0, 0.01, 0);
  g.add(threshold);
  return g;
}

/* ==================================================================
   MATERIALS
================================================================== */
const walnutTex = makeWoodTexture('#5a3b26', '#2a180d');
const oakTex = makeWoodTexture('#c9a876', '#8a6a44');
const darkWoodTex = makeWoodTexture('#2c2420', '#120d0a');
walnutTex.repeat.set(2, 2);
oakTex.repeat.set(2, 2);
darkWoodTex.repeat.set(1.5, 1.5);

const marbleTex = makeMarbleTexture();
const stoneSlabTex = makeStoneSlabTexture();
stoneSlabTex.repeat.set(2, 1);
const hexTileTex = makeHexTileTexture();
hexTileTex.repeat.set(1.4, 1.4);
const plasterTerracotta = makePlasterTexture('#a8572f');
plasterTerracotta.repeat.set(2, 1.4);
const stoneFloorTex = makeStoneFloorTexture();
stoneFloorTex.repeat.set(3, 6);
const rugBedroomTex = makeGeoRugTexture('#9c7a52', '#3c2a18');
const rugLivingTex = makeGeoRugTexture('#8a6a52', '#c99a5a');

const wallPatternBedroom = makeWallPatternTexture('#e9ddc8', '#b98a52', 'stripe');
const wallPatternKitchen = makeWallPatternTexture('#eef0e6', '#8a9a7a', 'grid');
const wallPatternLiving = makeWallPatternTexture('#e7d7c3', '#a8623c', 'diamond');
const wallPatternEntrance = makeWallPatternTexture('#e3d6bd', '#8a6a44', 'arch');
[wallPatternBedroom, wallPatternKitchen, wallPatternLiving, wallPatternEntrance].forEach(function (t) {
  t.repeat.set(2.4, 1.1);
});

const MAT = {
  walnut: new THREE.MeshStandardMaterial({ map: walnutTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.25, 0.25), roughness: 0.55, metalness: 0.05 }),
  oak: new THREE.MeshStandardMaterial({ map: oakTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.22, 0.22), roughness: 0.5, metalness: 0.05 }),
  darkWood: new THREE.MeshStandardMaterial({ map: darkWoodTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.2, 0.2), roughness: 0.4, metalness: 0.08 }),
  flutedWood: new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.5, metalness: 0.05 }),

  marble: new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.25, metalness: 0.05 }),
  stoneFloor: new THREE.MeshStandardMaterial({ map: stoneFloorTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.75 }),
  stoneSlab: new THREE.MeshStandardMaterial({ map: stoneSlabTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.8 }),
  hexTile: new THREE.MeshStandardMaterial({ map: hexTileTex, roughness: 0.35, metalness: 0.02 }),
  plaster: new THREE.MeshStandardMaterial({ map: plasterTerracotta, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.85 }),

  wallBedroom: new THREE.MeshStandardMaterial({ map: wallPatternBedroom, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.9 }),
  wallKitchen: new THREE.MeshStandardMaterial({ map: wallPatternKitchen, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.9 }),
  wallLiving: new THREE.MeshStandardMaterial({ map: wallPatternLiving, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.9 }),
  wallEntrance: new THREE.MeshStandardMaterial({ map: wallPatternEntrance, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.9 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf3ead9, roughness: 0.95 }),

  linen: new THREE.MeshStandardMaterial({ color: 0xe8ded0, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.85 }),
  bedding: new THREE.MeshStandardMaterial({ color: 0xf3ede1, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.75 }),
  throwRust: new THREE.MeshStandardMaterial({ color: 0xaf5a3a, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.8 }),
  sofaIvory: new THREE.MeshStandardMaterial({ color: 0xe9e1d2, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.82 }),
  sofaOlive: new THREE.MeshStandardMaterial({ color: 0x6b6b4a, normalMap: NORMAL_FINE, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.82 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x6b4228, roughness: 0.4, metalness: 0.03 }),

  rugBedroom: new THREE.MeshStandardMaterial({ map: rugBedroomTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.95 }),
  rugLiving: new THREE.MeshStandardMaterial({ map: rugLivingTex, normalMap: NORMAL_COARSE, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.95 }),

  matteCab: new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.4, metalness: 0.03 }),
  darkCab: new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.35, metalness: 0.08 }),

  metal: new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.3, metalness: 0.85 }),
  blackMetal: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.3, metalness: 0.7 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb08d4f, roughness: 0.3, metalness: 0.9 }),
  frameWarm: new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.35, metalness: 0.4 }),

  leafDark: new THREE.MeshStandardMaterial({ color: 0x33502f, roughness: 0.6 }),
  leafLight: new THREE.MeshStandardMaterial({ color: 0x4e7247, roughness: 0.6 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xb15c3a, roughness: 0.8 }),
  planter: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 }),

  bulb: new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffdca0, emissiveIntensity: 2 }),
  coveLight: new THREE.MeshStandardMaterial({ color: 0xffe9c0, emissive: 0xffd89a, emissiveIntensity: 1.5 }),
  ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.3 }),
  glassGlobe: new THREE.MeshPhysicalMaterial({ color: 0xfff6e4, transparent: true, opacity: 0.5, roughness: 0.1, transmission: 0.6, thickness: 0.2 })
};

/* ==================================================================
   DECOR HELPERS
================================================================== */
function potPlant(x, y, z, scale) {
  scale = scale || 1;
  const g = group(x, y, z);
  g.add(cyl(0.22 * scale, 0.18 * scale, 0.3 * scale, 16, MAT.terracotta, 0, 0.15 * scale, 0));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = mesh(new THREE.ConeGeometry(0.05 * scale, 0.45 * scale, 6),
      i % 2 ? MAT.leafDark : MAT.leafLight,
      Math.cos(a) * 0.1 * scale, 0.5 * scale, Math.sin(a) * 0.1 * scale);
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
    g.add(leaf);
  }
  g.add(shadowBlob(0.6 * scale, SHADOW_TEX, 0, 0.01, 0));
  return g;
}

function hangingPlant(x, y, z) {
  const g = group(x, y, z);
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), MAT.darkWood, 0, 0.25, 0);
  g.add(cord);
  const pot = cyl(0.14, 0.1, 0.16, 12, MAT.terracotta, 0, -0.08, 0);
  g.add(pot);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const vine = mesh(new THREE.ConeGeometry(0.03, 0.3, 5), MAT.leafDark,
      Math.cos(a) * 0.1, -0.22, Math.sin(a) * 0.1);
    vine.rotation.x = Math.PI - 0.3;
    g.add(vine);
  }
  return g;
}

function wallArt(w, h, color, x, y, z, ry) {
  ry = ry || 0;
  const g = group(x, y, z, ry);
  g.add(mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03), MAT.frameWarm, 0, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.02), new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 }), 0, 0, 0.02));
  return g;
}

function galleryWall(x, y, z, ry) {
  ry = ry || 0;
  const g = group(x, y, z, ry);
  const palette = [0xb6693f, 0x3c4a3c, 0xc9a876, 0x6b4a30];
  g.add(wallArt(0.5, 0.65, palette[0], -0.55, 0.1, 0));
  g.add(wallArt(0.4, 0.4, palette[1], 0.15, -0.1, 0));
  g.add(wallArt(0.35, 0.5, palette[2], 0.55, 0.15, 0));
  return g;
}

function pendantDome(x, y, z, color) {
  color = color || 0x2b2622;
  const g = group(x, y, z);
  g.add(cyl(0.002, 0.002, 1.2, 6, MAT.blackMetal, 0, 0.6, 0));
  g.add(mesh(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.7),
    new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide }), 0, 0, 0));
  const bulb = sph(0.045, MAT.bulb, 0, -0.03, 0);
  g.add(bulb);
  const light = new THREE.PointLight(0xffd9a0, 0.9, 4.5, 2);
  light.position.set(0, -0.05, 0);
  g.add(light);
  return g;
}

function pendantCluster(x, y, z) {
  const g = group(x, y, z);
  const offsets = [[-0.3, 0.08], [0.1, -0.05], [0.4, 0.15]];
  offsets.forEach(function (o) {
    const ox = o[0], oy = o[1];
    const sub = group(ox, oy, 0);
    sub.add(cyl(0.002, 0.002, 0.8, 6, MAT.blackMetal, 0, 0.4, 0));
    sub.add(sph(0.09, MAT.glassGlobe, 0, 0, 0));
    sub.add(sph(0.035, MAT.bulb, 0, 0, 0));
    const light = new THREE.PointLight(0xffe4b5, 0.7, 3.5, 2);
    sub.add(light);
    g.add(sub);
  });
  return g;
}

function tableLamp(x, y, z) {
  const g = group(x, y, z);
  g.add(cyl(0.06, 0.08, 0.05, 16, MAT.brass, 0, 0.025, 0));
  g.add(cyl(0.01, 0.01, 0.22, 8, MAT.brass, 0, 0.16, 0));
  g.add(mesh(new THREE.ConeGeometry(0.1, 0.16, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe9ddc8, side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.33, 0));
  const light = new THREE.PointLight(0xffd9a0, 0.6, 3, 2);
  light.position.set(0, 0.3, 0);
  g.add(light);
  return g;
}

function arcLamp(x, y, z, ry) {
  ry = ry || 0;
  const g = group(x, y, z, ry);
  g.add(cyl(0.1, 0.12, 0.03, 20, MAT.blackMetal, 0, 0.015, 0));
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1.9, 0.1),
    new THREE.Vector3(0.9, 1.7, 0.9)
  );
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.018, 8, false), MAT.blackMetal);
  tube.castShadow = true;
  g.add(tube);
  const head = group(0.9, 1.7, 0.9);
  head.add(mesh(new THREE.ConeGeometry(0.11, 0.16, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1b1b1b, side: THREE.DoubleSide, roughness: 0.4 }), 0, -0.05, 0));
  const light = new THREE.PointLight(0xffd9a0, 1.1, 5, 2);
  light.position.set(0, -0.1, 0);
  head.add(light);
  g.add(head);
  return g;
}

/* ==================================================================
   ROOM SHELL
================================================================== */
const ROOM_WIDTH = 7.2, ROOM_HEIGHT = 3.1, TOTAL_LENGTH = 34;
const floorCenterZ = -(TOTAL_LENGTH / 2) + 11;

const floorGroup = new THREE.Group();
const wallGroup = new THREE.Group();
scene.add(floorGroup, wallGroup);

function floorSegment(mat, z1, z2) {
  const len = Math.abs(z1 - z2);
  const cz = (z1 + z2) / 2;
  const f = mesh(new THREE.PlaneGeometry(ROOM_WIDTH, len), mat, 0, 0, cz);
  f.rotation.x = -Math.PI / 2;
  f.receiveShadow = true;
  floorGroup.add(f);
}
floorSegment(MAT.walnut, 11, 1.5);
floorSegment(MAT.marble, 1.5, -6.5);
floorSegment(MAT.oak, -6.5, -15);
floorSegment(MAT.stoneFloor, -15, -27);

const ceil = mesh(new THREE.PlaneGeometry(ROOM_WIDTH, TOTAL_LENGTH), MAT.ceiling, 0, ROOM_HEIGHT, floorCenterZ);
ceil.rotation.x = Math.PI / 2;
ceil.receiveShadow = true;
scene.add(ceil);

function wallSegment(mat, z1, z2, side) {
  const len = Math.abs(z1 - z2);
  const cz = (z1 + z2) / 2;
  const w = mesh(new THREE.PlaneGeometry(len, ROOM_HEIGHT), mat, side * ROOM_WIDTH / 2, ROOM_HEIGHT / 2, cz);
  w.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  w.receiveShadow = true;
  wallGroup.add(w);
}
wallSegment(MAT.wallBedroom, 11, 1.5, -1);
wallSegment(MAT.wallBedroom, 11, 1.5, 1);
wallSegment(MAT.wallKitchen, 1.5, -6.5, -1);
wallSegment(MAT.wallKitchen, 1.5, -6.5, 1);
wallSegment(MAT.wallLiving, -6.5, -15, -1);
wallSegment(MAT.wallLiving, -6.5, -15, 1);
wallSegment(MAT.wallEntrance, -15, -27, -1);
wallSegment(MAT.wallEntrance, -15, -27, 1);

function trimStrip(z1, z2, side, y, h) {
  const len = Math.abs(z1 - z2);
  const cz = (z1 + z2) / 2;
  const t = mesh(new THREE.BoxGeometry(0.03, h, len), MAT.ceramicWhite, side * (ROOM_WIDTH / 2 - 0.015), y, cz);
  wallGroup.add(t);
}
const roomRanges = [[11, 1.5], [1.5, -6.5], [-6.5, -15], [-15, -27]];
roomRanges.forEach(function (r) {
  trimStrip(r[0], r[1], -1, 0.06, 0.12);
  trimStrip(r[0], r[1], 1, 0.06, 0.12);
  trimStrip(r[0], r[1], -1, ROOM_HEIGHT - 0.06, 0.12);
  trimStrip(r[0], r[1], 1, ROOM_HEIGHT - 0.06, 0.12);
});

for (let z = 8; z >= -24; z -= 3) {
  const spot = new THREE.SpotLight(0xfff0d8, 0.9, 7, Math.PI / 6, 0.5, 1.4);
  spot.position.set(0, ROOM_HEIGHT - 0.05, z);
  spot.target.position.set(0, 0, z);
  scene.add(spot, spot.target);
  const housing = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), MAT.darkCab, 0, ROOM_HEIGHT - 0.02, z);
  scene.add(housing);
}

function addWindow(z, side) {
  const g = group(side * (ROOM_WIDTH / 2 - 0.02), 1.7, z, side > 0 ? -Math.PI / 2 : Math.PI / 2);
  const glow = mesh(new THREE.PlaneGeometry(1.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xfaf3df, emissive: 0xfff3d8, emissiveIntensity: 0.6, side: THREE.DoubleSide }), 0, 0, 0.01);
  g.add(glow);
  g.add(mesh(new THREE.BoxGeometry(1.2, 1.6, 0.06), MAT.frameWarm, 0, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.04, 1.5, 0.07), MAT.frameWarm, 0, 0, 0.02));
  const curtain = mesh(new THREE.PlaneGeometry(1.3, 1.7),
    new THREE.MeshStandardMaterial({ color: 0xf2ece0, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), 0.75, 0, 0.1);
  g.add(curtain);
  const light = new THREE.RectAreaLight(0xfff3df, 2.2, 1.1, 1.5);
  light.position.set(0, 0, 0.02);
  light.rotation.y = Math.PI;
  g.add(light);
  scene.add(g);
}
addWindow(5.5, 1);
addWindow(-2.5, -1);
addWindow(-10, 1);
addWindow(-19, -1);

/* ==================================================================
   BEDROOM
================================================================== */
const bedZ = 4.6;
(function () {
  const g = group(0, 0, bedZ);

  const slats = woodSlatWall(ROOM_WIDTH - 0.3, 1.4, MAT.walnut);
  slats.position.set(0, 0, -2.49);
  g.add(slats);
  const plasterPanel = mesh(new THREE.PlaneGeometry(ROOM_WIDTH - 0.3, ROOM_HEIGHT - 1.4), MAT.plaster, 0, 1.4 + (ROOM_HEIGHT - 1.4) / 2, -2.48);
  g.add(plasterPanel);
  g.add(coveStrip(ROOM_WIDTH - 0.6, 0xffdca0, 0, 1.4, -2.46));

  const rug = mesh(new THREE.PlaneGeometry(3.4, 2.4), MAT.rugBedroom, 0, 0.012, 0.6);
  rug.rotation.x = -Math.PI / 2;
  g.add(rug);

  const bed = group(0, 0, 0.4);
  bed.add(mesh(rbox(2.0, 0.3, 2.3, 0.06), MAT.walnut, 0, 0.15, 0));
  bed.add(mesh(rbox(1.9, 0.25, 2.1, 0.05), MAT.bedding, 0, 0.42, 0.02));
  bed.add(mesh(rbox(2.0, 0.9, 0.18, 0.08), MAT.linen, 0, 0.85, -1.15));
  bed.add(pillow(0.16, 0.55, MAT.bedding, -0.45, 0.58, -0.85));
  bed.add(pillow(0.16, 0.55, MAT.bedding, 0.1, 0.58, -0.85));
  bed.add(pillow(0.13, 0.4, MAT.throwRust, -0.2, 0.58, -0.55, Math.PI / 2 + 0.3));
  bed.add(mesh(rbox(1.9, 0.08, 0.7, 0.04), MAT.throwRust, 0, 0.5, 0.75));
  bed.add(shadowBlob(2.6, SHADOW_TEX, 0, 0.02, 0.4));
  g.add(bed);

  const bench = group(0, 0, 1.55);
  bench.add(mesh(rbox(1.2, 0.08, 0.45, 0.03), MAT.walnut, 0, 0.38, 0));
  const legPos = [[-0.5, -0.18], [0.5, -0.18], [-0.5, 0.18], [0.5, 0.18]];
  legPos.forEach(function (p) {
    bench.add(mesh(rbox(0.05, 0.36, 0.05, 0.02), MAT.walnut, p[0], 0.18, p[1]));
  });
  bench.add(mesh(rbox(1.1, 0.06, 0.38, 0.03), MAT.throwRust, 0, 0.43, 0));
  g.add(bench);

  [-1.55, 1.55].forEach(function (x) {
    const ns = group(x, 0, -1.3);
    ns.add(mesh(rbox(0.5, 0.55, 0.42, 0.03), MAT.walnut, 0, 0.275, 0));
    ns.add(mesh(rbox(0.46, 0.015, 0.4), MAT.brass, 0, 0.55, 0));
    ns.add(bookStack(x > 0 ? -0.12 : 0.12, 0.558, 0.05, 3));
    g.add(ns);
    g.add(tableLamp(x, 0.56, -1.3));
  });

  g.add(pendantDome(-0.8, ROOM_HEIGHT, -0.4));
  g.add(pendantDome(0.8, ROOM_HEIGHT, -0.4));

  const wardrobe = group(-ROOM_WIDTH / 2 + 0.5, 0, 1.7);
  wardrobe.add(mesh(rbox(0.9, 2.2, 0.55, 0.03), MAT.walnut, 0, 1.1, 0));
  wardrobe.add(mesh(rbox(0.02, 2.0, 0.02), MAT.brass, 0.2, 1.1, 0.28));
  g.add(wardrobe);

  g.add(galleryWall(1.0, 1.9, -2.3));
  g.add(potPlant(ROOM_WIDTH / 2 - 0.6, 0, 1.9, 1.1));
  g.add(hangingPlant(ROOM_WIDTH / 2 - 0.5, ROOM_HEIGHT, -1.3));

  scene.add(g);
})();

/* ==================================================================
   KITCHEN
================================================================== */
const islandZ = -2.6;
(function () {
  const g = group(0, 0, islandZ);

  const backsplash = mesh(new THREE.PlaneGeometry(2.2, 0.9), MAT.hexTile, -1.2, 1.55, -3.58);
  g.add(backsplash);

  const lower = mesh(rbox(ROOM_WIDTH - 0.5, 0.9, 0.55, 0.03), MAT.matteCab, 0, 0.45, -3.3);
  g.add(lower);
  const counter = mesh(rbox(ROOM_WIDTH - 0.4, 0.06, 0.6, 0.02), MAT.marble, 0, 0.93, -3.3);
  g.add(counter);
  const upper = mesh(rbox(ROOM_WIDTH - 1.6, 0.7, 0.35, 0.03), MAT.matteCab, -1.2, 2.2, -3.45);
  g.add(upper);

  g.add(mesh(rbox(0.6, 0.4, 0.4, 0.03), MAT.blackMetal, -1.2, 2.5, -3.3));
  g.add(mesh(rbox(0.6, 0.65, 0.58, 0.03), MAT.darkCab, 1.6, 0.56, -3.3));
  g.add(mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.15, metalness: 0.3 }), 1.6, 0.56, -3.0));

  g.add(mesh(rbox(0.75, 2.3, 0.6, 0.03), MAT.darkCab, ROOM_WIDTH / 2 - 0.7, 1.15, -3.1));
  g.add(mesh(rbox(0.02, 1.2, 0.02), MAT.brass, ROOM_WIDTH / 2 - 0.35, 1.15, -2.8));

  const island = group(0, 0, 0.1);
  const flutes = flutedPanel(1.6, 0.85, MAT.flutedWood);
  flutes.position.set(0, 0, 0.58);
  island.add(flutes);
  const flutesB = flutedPanel(1.6, 0.85, MAT.flutedWood);
  flutesB.rotation.y = Math.PI;
  flutesB.position.set(0, 0, -0.58);
  island.add(flutesB);
  island.add(mesh(rbox(1.8, 0.85, 1.3, 0.04), MAT.darkCab, 0, 0.425, 0));
  island.add(mesh(rbox(2.0, 0.07, 1.5, 0.02), MAT.marble, 0, 0.885, 0));
  island.add(coveStrip(1.6, 0xffdca0, 0, 0.1, 0.66));
  island.add(cyl(0.02, 0.02, 0.3, 10, MAT.blackMetal, -0.7, 1.05, -0.5));
  island.add(sph(0.08, MAT.ceramicWhite, 0.4, 0.95, 0));
  island.add(bookStack(0.0, 0.92, 0.3, 3));
  island.add(potPlant(0.75, 0.92, 0.4, 0.5));
  island.add(shadowBlob(2.2, SHADOW_TEX, 0, 0.02, 0));
  g.add(island);

  [-0.6, 0, 0.6].forEach(function (x) {
    const stool = group(x, 0, 1.0);
    stool.add(cyl(0.16, 0.16, 0.05, 20, MAT.darkWood, 0, 0.72, 0));
    stool.add(cyl(0.025, 0.025, 0.7, 8, MAT.blackMetal, 0, 0.36, 0));
    g.add(stool);
  });

  g.add(pendantCluster(0, ROOM_HEIGHT - 0.1, 0.3));
  g.add(wallArt(0.6, 0.45, 0x4e7247, ROOM_WIDTH / 2 - 0.05, 1.8, 1.4, -Math.PI / 2));

  [-0.3, 0, 0.3].forEach(function (dx) {
    g.add(potPlant(ROOM_WIDTH / 2 - 0.35, 1.0, -2.5 + dx, 0.3));
  });

  scene.add(g);
})();

/* ==================================================================
   LIVING ROOM
================================================================== */
const sofaZ = -10.5;
(function () {
  const g = group(0, 0, sofaZ);

  const plasterAccent = mesh(new THREE.PlaneGeometry(2.6, ROOM_HEIGHT - 0.2), MAT.plaster, 1.8, (ROOM_HEIGHT - 0.2) / 2, -3.58);
  g.add(plasterAccent);

  const rug = mesh(new THREE.PlaneGeometry(3.6, 2.6), MAT.rugLiving, -0.3, 0.012, 0.3);
  rug.rotation.x = -Math.PI / 2;
  g.add(rug);

  const sofa = group(-0.9, 0, 0.6);
  sofa.add(mesh(rbox(2.6, 0.45, 1.0, 0.08), MAT.sofaIvory, 0, 0.225, 0));
  sofa.add(mesh(rbox(2.6, 0.55, 0.22, 0.08), MAT.sofaIvory, 0, 0.6, -0.4));
  sofa.add(mesh(rbox(0.22, 0.55, 1.4, 0.08), MAT.sofaIvory, 1.3, 0.6, 0.6));
  sofa.add(mesh(rbox(1.0, 0.45, 1.3, 0.08), MAT.sofaIvory, 1.0, 0.225, 0.95));
  [-0.8, -0.2, 0.4].forEach(function (x, i) {
    sofa.add(pillow(0.15, 0.45, i % 2 ? MAT.sofaOlive : MAT.throwRust, x, 0.52, 0.0, Math.PI / 2));
  });
  sofa.add(mesh(rbox(0.7, 0.05, 1.1, 0.03), MAT.sofaOlive, 1.0, 0.5, 1.2));
  sofa.add(shadowBlob(3.2, SHADOW_TEX, 0.2, 0.02, 0.4));
  g.add(sofa);

  g.add(arcLamp(-2.6, 0, 1.6, Math.PI / 4));

  const ottoman = group(0.6, 0, 1.9);
  ottoman.add(mesh(rbox(0.7, 0.4, 0.7, 0.08), MAT.leather, 0, 0.2, 0));
  ottoman.add(mesh(rbox(0.5, 0.1, 0.5, 0.04), MAT.throwRust, 0, 0.44, 0));
  g.add(ottoman);

  const table = group(-1.0, 0, 1.6);
  table.add(mesh(rbox(1.1, 0.05, 0.6, 0.02), MAT.marble, 0, 0.4, 0));
  table.add(mesh(rbox(0.9, 0.35, 0.4, 0.03), MAT.walnut, 0, 0.18, 0));
  table.add(bookStack(-0.3, 0.43, 0.1, 3));
  table.add(torus(0.07, 0.02, MAT.brass, 0.25, 0.46, -0.05));
  table.add(potPlant(0.0, 0.43, -0.15, 0.3));
  g.add(table);

  const media = group(1.8, 0, -3.3);
  media.add(mesh(rbox(1.6, 0.55, 0.45, 0.03), MAT.darkCab, 0, 0.275, 0));
  media.add(mesh(new THREE.PlaneGeometry(1.5, 0.85), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, emissive: 0x11151c, emissiveIntensity: 0.5 }), 0, 1.1, 0.23));
  media.add(mesh(rbox(0.02, 0.9, 0.02), MAT.blackMetal, -0.78, 1.1, 0.22));
  media.add(potPlant(0.9, 0.55, 0.1, 0.5));
  g.add(media);

  const vertFlute = flutedPanel(ROOM_HEIGHT, 2.4, MAT.flutedWood);
  vertFlute.rotation.z = Math.PI / 2;
  vertFlute.rotation.y = Math.PI / 2;
  vertFlute.position.set(-ROOM_WIDTH / 2 + 0.15, 1.2, -2.0);
  g.add(vertFlute);

  [1.3, 1.9].forEach(function (y, i) {
    const shelf = mesh(rbox(1.0, 0.04, 0.22, 0.02), MAT.walnut, ROOM_WIDTH / 2 - 0.3, y, -1.0 + i * 0.6);
    g.add(shelf);
    g.add(book(0.05, 0.18, 0.15, 0x8a3b2b, ROOM_WIDTH / 2 - 0.55, y + 0.11, -1.0 + i * 0.6));
    g.add(sph(0.06, MAT.ceramicWhite, ROOM_WIDTH / 2 - 0.2, y + 0.07, -1.0 + i * 0.6));
  });

  g.add(galleryWall(-1.6, 1.9, -3.58));
  g.add(potPlant(-ROOM_WIDTH / 2 + 0.6, 0, -3.5, 1.3));
  g.add(hangingPlant(1.2, ROOM_HEIGHT, 1.8));
  g.add(pendantDome(0, ROOM_HEIGHT - 0.1, 0.6, 0x3c3a2e));

  scene.add(g);
})();

/* ==================================================================
   ENTRANCE HALL
================================================================== */
const consoleZ = -19.5;
(function () {
  const g = group(0, 0, consoleZ);

  const slatsLower = woodSlatWall(ROOM_WIDTH - 0.3, 1.5, MAT.oak);
  slatsLower.position.set(0, 0, -3.3);
  g.add(slatsLower);
  const stonePanel = mesh(new THREE.PlaneGeometry(ROOM_WIDTH - 0.3, ROOM_HEIGHT - 1.5), MAT.stoneSlab, 0, 1.5 + (ROOM_HEIGHT - 1.5) / 2, -3.29);
  g.add(stonePanel);
  g.add(coveStrip(ROOM_WIDTH - 0.6, 0xffdca0, 0, 1.5, -3.27));

  const console_ = group(0, 0, -2.8);
  const flutesC = flutedPanel(1.6, 0.75, MAT.flutedWood);
  console_.add(flutesC);
  console_.add(mesh(rbox(1.8, 0.06, 0.45, 0.02), MAT.oak, 0, 0.78, 0));
  [-0.75, 0.75].forEach(function (x) {
    console_.add(cyl(0.015, 0.015, 0.75, 8, MAT.brass, x, 0.375, 0.18));
  });
  console_.add(potPlant(-0.6, 0.81, 0, 0.5));
  console_.add(cyl(0.12, 0.1, 0.03, 16, MAT.walnut, 0.1, 0.815, 0.05));
  console_.add(sph(0.05, MAT.brass, 0.4, 0.82, 0.05));
  console_.add(bookStack(0.6, 0.81, -0.05, 2));
  g.add(console_);

  const mirror = group(0, 1.8, -3.25);
  mirror.add(torus(0.42, 0.03, MAT.brass, 0, 0, 0));
  mirror.add(mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshStandardMaterial({ color: 0xcfd6da, roughness: 0.05, metalness: 0.9 }), 0, 0, 0.02));
  g.add(mirror);

  g.add(potPlant(-ROOM_WIDTH / 2 + 0.5, 0, -1.5, 1.4));
  g.add(potPlant(ROOM_WIDTH / 2 - 0.5, 0, -1.5, 1.4));
  g.add(galleryWall(-1.6, 1.9, -3.27));
  g.add(pendantCluster(0, ROOM_HEIGHT - 0.1, -1.0));

  const bench = group(1.8, 0, 0.6);
  bench.add(mesh(rbox(1.0, 0.45, 0.4, 0.04), MAT.walnut, 0, 0.225, 0));
  bench.add(mesh(rbox(0.9, 0.08, 0.32, 0.03), MAT.linen, 0, 0.47, 0));
  g.add(bench);
  g.add(cyl(0.12, 0.15, 0.4, 16, MAT.darkCab, -1.8, 0.2, 0.9));

  scene.add(g);
})();

/* ==================================================================
   ARCHWAY FINALE
================================================================== */
const archZ = -25.3;
(function () {
  const arch = archPortal(0, 0, archZ, 2.6, 2.6, MAT.frameWarm);
  scene.add(arch);

  const glow = new THREE.PointLight(0xffd9a0, 2.4, 10, 2);
  glow.position.set(0, 1.4, archZ - 1.5);
  scene.add(glow);

  const glowPlane = mesh(new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({ color: 0xfff3df, transparent: true, opacity: 0.85 }), 0, 1.3, archZ - 2.2);
  scene.add(glowPlane);
  const glowPlane2 = mesh(new THREE.PlaneGeometry(4, 4),
    new THREE.MeshBasicMaterial({ color: 0xfff8ea, transparent: true, opacity: 0.4 }), 0, 1.3, archZ - 3);
  scene.add(glowPlane2);
})();

/* ==================================================================
   CAMERA PATH
================================================================== */
const camCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.3, 1.65, 8.5),
  new THREE.Vector3(0.2, 1.62, 5.8),
  new THREE.Vector3(-0.3, 1.6, 3.0),
  new THREE.Vector3(0.4, 1.6, 0.8),
  new THREE.Vector3(0.0, 1.58, -1.8),
  new THREE.Vector3(-0.5, 1.6, -4.2),
  new THREE.Vector3(0.3, 1.62, -6.8),
  new THREE.Vector3(0.0, 1.65, -9.2),
  new THREE.Vector3(-0.4, 1.6, -11.6),
  new THREE.Vector3(0.3, 1.6, -14.0),
  new THREE.Vector3(0.0, 1.62, -16.5),
  new THREE.Vector3(-0.2, 1.65, -19.5),
  new THREE.Vector3(0.1, 1.68, -22.5),
  new THREE.Vector3(0.0, 1.72, -25.0),
  new THREE.Vector3(0.0, 1.75, -27.8)
]);

const targetCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.5, 4),
  new THREE.Vector3(0, 1.45, 1.5),
  new THREE.Vector3(0, 1.45, -1),
  new THREE.Vector3(0, 1.4, -2.5),
  new THREE.Vector3(0, 1.4, -4),
  new THREE.Vector3(0, 1.4, -6.5),
  new THREE.Vector3(0, 1.4, -9),
  new THREE.Vector3(0, 1.4, -11),
  new THREE.Vector3(0, 1.4, -13.5),
  new THREE.Vector3(0, 1.4, -16),
  new THREE.Vector3(0, 1.4, -18.5),
  new THREE.Vector3(0, 1.4, -21),
  new THREE.Vector3(0, 1.45, -24),
  new THREE.Vector3(0, 1.45, -28),
  new THREE.Vector3(0, 1.45, -33)
]);

/* ==================================================================
   POST PROCESSING
================================================================== */
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

if (QUALITY.ssao) {
  const ssao = new SSAOPass(scene, camera, innerWidth, innerHeight);
  ssao.kernelRadius = 0.35;
  ssao.minDistance = 0.001;
  ssao.maxDistance = 0.12;
  composer.addPass(ssao);
}
if (QUALITY.bloom) {
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.6, 0.9);
  composer.addPass(bloom);
}
composer.addPass(new OutputPass());

/* ==================================================================
   SCROLL (VIRTUAL)
================================================================== */
let progress = 0;
let targetProgress = 0;
const DAMPING = reducedMotion ? 1 : 0.055;
const SENS = reducedMotion ? 0.0009 : 0.00042;

addEventListener('wheel', function (e) {
  targetProgress = Math.min(1, Math.max(0, targetProgress + e.deltaY * SENS));
}, { passive: true });

let touchStartY = null;
addEventListener('touchstart', function (e) {
  touchStartY = e.touches[0].clientY;
}, { passive: true });
addEventListener('touchmove', function (e) {
  if (touchStartY === null) return;
  const dy = touchStartY - e.touches[0].clientY;
  touchStartY = e.touches[0].clientY;
  targetProgress = Math.min(1, Math.max(0, targetProgress + dy * SENS * 2.4));
}, { passive: true });

addEventListener('keydown', function (e) {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') targetProgress = Math.min(1, targetProgress + 0.035);
  if (e.key === 'ArrowUp' || e.key === 'PageUp') targetProgress = Math.max(0, targetProgress - 0.035);
});

/* ==================================================================
   LABELS - fade in & out within their own section
================================================================== */
const labelEls = Array.from(document.querySelectorAll('.room-label'));
const labels = [
  { el: labelEls[0], range: [0, 0.24], cur: 0 },
  { el: labelEls[1], range: [0.22, 0.46], cur: 0 },
  { el: labelEls[2], range: [0.44, 0.70], cur: 0 },
  { el: labelEls[3], range: [0.68, 0.90], cur: 0 }
];
const FADE_MARGIN = 0.045;
function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function labelTargetOpacity(p, range) {
  const a = range[0], b = range[1];
  if (p < a - FADE_MARGIN || p > b + FADE_MARGIN) return 0;
  if (p < a) return smoothstep(a - FADE_MARGIN, a, p);
  if (p > b) return 1 - smoothstep(b, b + FADE_MARGIN, p);
  return 1;
}
function updateLabels(p) {
  labels.forEach(function (l) {
    const target = labelTargetOpacity(p, l.range);
    l.cur += (target - l.cur) * (reducedMotion ? 1 : 0.12);
    l.el.style.opacity = l.cur.toFixed(3);
    const lift = (1 - l.cur) * 16;
    l.el.style.transform = 'translate(-50%, ' + lift + 'px)';
  });
}

/* ==================================================================
   OUTRO
================================================================== */
const OUTRO_START = 0.90, OUTRO_END = 0.985;
const outroEl = document.getElementById('outro');
const uiEl = document.getElementById('ui');
function updateOutro(p) {
  const t = Math.min(1, Math.max(0, (p - OUTRO_START) / (OUTRO_END - OUTRO_START)));
  outroEl.style.opacity = t;
  outroEl.classList.toggle('visible', t > 0.5);
  uiEl.style.opacity = 1 - t;
}

function enterWebsite() {
  try { sessionStorage.setItem('salitous-entered', '1'); } catch (err) {}
  const fade = document.body;
  fade.style.transition = 'opacity .5s ease';
  fade.style.opacity = '0';
  setTimeout(function () { (window.top || window).location.replace('/'); }, 450);
}
document.getElementById('outro-cta').addEventListener('click', enterWebsite);
document.getElementById('skip-btn').addEventListener('click', enterWebsite);
addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && progress > 0.97 && document.activeElement === document.body) enterWebsite();
});

/* ==================================================================
   ANIMATE
================================================================== */
const progressBar = document.getElementById('progress-bar');
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  clock.getDelta();

  if (reducedMotion) {
    progress = targetProgress;
  } else {
    progress += (targetProgress - progress) * DAMPING;
  }
  const t = Math.min(1, Math.max(0, progress));

  const pos = camCurve.getPointAt(t);
  const look = targetCurve.getPointAt(t);

  camera.position.copy(pos);
  if (!reducedMotion) {
    camera.position.y += Math.sin(performance.now() * 0.0012) * 0.01;
  }
  camera.lookAt(look);

  updateLabels(t);
  updateOutro(t);
  progressBar.style.width = (t * 100) + '%';

  composer.render();
}

/* ==================================================================
   RESIZE
================================================================== */
addEventListener('resize', function () {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ==================================================================
   KICKOFF
================================================================== */
for (let i = buildProgress; i < TOTAL_STEPS; i++) tickLoading();
requestAnimationFrame(function () {
  finishLoading();
  animate();
});