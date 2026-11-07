import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

/**
 * A procedurally built living room that "gets designed" as the page scrolls.
 * Progress 0 → 1 drives construction, finishes, joinery, furniture, evening light and the camera.
 * Nothing is time-based, so the same scroll position always renders the same frame.
 *
 * Realism comes from: generated PBR-style textures (wood, plaster, boucle, marble, leaf), soft sun + window
 * area light, light shafts, ambient occlusion, bloom, a touch of depth of field, vignette and film grain.
 */

export const STAGES = [
  { from: 0, title: 'The shell', text: 'We start with bare walls and a floor plan: the footprint, the window, the ceiling height.' },
  { from: 0.14, title: 'Surfaces & ceiling', text: 'Plaster, timber flooring, curtains and a false ceiling with concealed cove lighting.' },
  { from: 0.32, title: 'Joinery', text: 'A fluted oak feature wall, a floating TV unit and a lit display tower, built to measure.' },
  { from: 0.5, title: 'Furnishing', text: 'Rug, sofa, armchair, plants and lamps, placed so the room is easy to live in.' },
  { from: 0.78, title: 'Lighting', text: 'The day fades and the layered lighting takes over: cove, spots, pendants and lamps.' },
]

export const CAMERAS = [
  { label: 'Aerial · corner cutaway', at: 0 },
  { label: 'High · front right', at: 0.14 },
  { label: 'Low · along the floor', at: 0.3 },
  { label: 'Detail · the TV wall', at: 0.46 },
  { label: 'Across the room', at: 0.62 },
  { label: 'Window side', at: 0.78 },
  { label: 'Hero · evening', at: 1 },
]

export type Quality = 'high' | 'medium' | 'low'

const W = 6
const D = 5.5
const H = 2.9
const T = 0.18

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Reveal = { obj: THREE.Object3D; a: number; b: number; mode: 'grow' | 'growXZ' | 'drop' | 'fade' | 'slide'; baseY: number; dist: number; mats: THREE.Material[] }

export type InteriorScene = {
  setProgress: (p: number) => void
  resize: (width: number, height: number) => void
  render: () => void
  setQuality: (level: Quality) => void
  degrade: () => Quality
  dispose: () => void
}

// ---------------------------------------------------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------------------------------------------------

function hash(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 982451653)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x); const yi = Math.floor(y)
  const xf = x - xi; const yf = y - yi
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed); const b = hash(xi + 1, yi, seed); const c = hash(xi, yi + 1, seed); const d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, seed: number, octaves = 4) {
  let sum = 0; let amp = 0.5; let freq = 1; let norm = 0
  for (let i = 0; i < octaves; i++) { sum += amp * vnoise(x * freq, y * freq, seed + i * 17); norm += amp; freq *= 2; amp *= 0.5 }
  return sum / norm
}
// periodic version so textures tile without seams
function pnoise(u: number, v: number, period: number, seed: number, octaves = 4) {
  let sum = 0; let amp = 0.5; let norm = 0; let p = period
  for (let i = 0; i < octaves; i++) {
    const x = u * p; const y = v * p
    const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi
    const s = seed + i * 17
    const w = (n: number) => ((n % p) + p) % p
    const a = hash(w(xi), w(yi), s); const b = hash(w(xi + 1), w(yi), s); const c = hash(w(xi), w(yi + 1), s); const d = hash(w(xi + 1), w(yi + 1), s)
    const uu = xf * xf * (3 - 2 * xf); const vv = yf * yf * (3 - 2 * yf)
    sum += amp * (a + (b - a) * uu + (c - a) * vv + (a - b - c + d) * uu * vv)
    norm += amp; p *= 2; amp *= 0.5
  }
  return sum / norm
}

type Shade = (u: number, v: number, x: number, y: number) => { r: number; g: number; b: number; h: number }

type SchedulerLike = { scheduler?: { yield?: () => Promise<void> } }
// Give the browser a chance to paint / handle scroll between slices of heavy work.
const yieldMain = (): Promise<void> => {
  const sched = (globalThis as unknown as SchedulerLike).scheduler
  return sched?.yield ? sched.yield() : new Promise<void>((resolve) => setTimeout(resolve, 0))
}

// Builds a colour map (+ optional bump map) from a per-pixel function, in ~6 ms slices so scrolling never stalls.
async function buildPairAsync(size: number, repeat: [number, number], shade: Shade, withBump = true, anisotropy = 8) {
  const make = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c }
  const cc = make(); const bc = withBump ? make() : null
  const cctx = cc.getContext('2d')!; const bctx = bc ? bc.getContext('2d')! : null
  const ci = cctx.createImageData(size, size); const bi = bctx ? bctx.createImageData(size, size) : null
  let slice = performance.now()
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = shade(x / size, y / size, x, y)
      const i = (y * size + x) * 4
      ci.data[i] = Math.max(0, Math.min(255, s.r)); ci.data[i + 1] = Math.max(0, Math.min(255, s.g)); ci.data[i + 2] = Math.max(0, Math.min(255, s.b)); ci.data[i + 3] = 255
      if (bi) { const h = Math.max(0, Math.min(255, s.h * 255)); bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = h; bi.data[i + 3] = 255 }
    }
    if ((y & 3) === 3 && performance.now() - slice > 6) { await yieldMain(); slice = performance.now() }
  }
  cctx.putImageData(ci, 0, 0)
  if (bctx && bi) bctx.putImageData(bi, 0, 0)
  const wrap = (t: THREE.CanvasTexture) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = anisotropy }
  const map = new THREE.CanvasTexture(cc); map.colorSpace = THREE.SRGBColorSpace; wrap(map)
  let bump: THREE.CanvasTexture | undefined
  if (bc) { bump = new THREE.CanvasTexture(bc); wrap(bump) }
  return { map, bump }
}

function woodShade(cols: number, seed: number, base: [number, number, number], jointsPerTile: number, vertical = true): Shade {
  return (u, v) => {
    const a = vertical ? u : v
    const b = vertical ? v : u
    const c = Math.floor(a * cols)
    const local = a * cols - c
    const segF = b * jointsPerTile + hash(c, 3, seed) * jointsPerTile
    const seg = Math.floor(segF)
    const segId = ((seg % jointsPerTile) + jointsPerTile) % jointsPerTile
    const tone = hash(c, segId, seed + 5)
    const gx = (c + local) * 6; const gy = b * 6
    const n = pnoise(((c + local) / cols) * 1, b, 6, seed + c * 3, 3)
    const grain = fbm(gx * 2.1, gy * 0.35 + segId * 9, seed, 4)
    const ring = 0.5 + 0.5 * Math.sin((local * 22 + grain * 7 + n * 3) * 1.0)
    const pores = vnoise(gx * 24, gy * 2.5, seed + 9)
    const f = 0.72 + 0.34 * (0.55 * grain + 0.3 * ring + 0.15 * pores)
    const shadeTone = 0.9 + 0.2 * tone
    const gap = local < 0.014 || local > 0.986 || ((segF % 1) < 0.005)
    const k = gap ? 0.36 : f * shadeTone
    return { r: base[0] * k, g: base[1] * k, b: base[2] * k, h: gap ? 0.05 : 0.72 + 0.22 * grain + 0.06 * pores }
  }
}

function plasterShade(seed: number): Shade {
  return (u, v) => {
    const big = pnoise(u, v, 4, seed, 3)
    const fine = pnoise(u, v, 64, seed + 3, 2)
    const k = 0.93 + 0.1 * big + 0.04 * fine
    return { r: 255 * k, g: 255 * k, b: 255 * k, h: 0.4 + 0.45 * fine + 0.15 * big }
  }
}

function bouclShade(seed: number, base: [number, number, number], contrast = 0.35): Shade {
  return (u, v) => {
    const a = pnoise(u, v, 96, seed, 1)
    const b = pnoise(u, v, 160, seed + 1, 1)
    const c = pnoise(u, v, 40, seed + 2, 2)
    const n = 0.45 * a + 0.35 * b + 0.2 * c
    const k = 1 - contrast / 2 + contrast * n
    return { r: base[0] * k, g: base[1] * k, b: base[2] * k, h: n }
  }
}

function marbleShade(seed: number, base: [number, number, number]): Shade {
  return (u, v) => {
    const warp = pnoise(u, v, 3, seed, 4)
    const t = Math.abs(Math.sin((u * 3 + v * 1.4 + warp * 2.6) * Math.PI))
    const vein = Math.pow(1 - t, 16)
    const fine = Math.pow(1 - Math.abs(Math.sin((u * 7 - v * 3 + warp * 4.5) * Math.PI)), 28)
    const cloud = pnoise(u, v, 5, seed + 4, 4)
    const k = 1 - 0.07 * cloud - 0.34 * vein - 0.16 * fine
    return { r: base[0] * k, g: base[1] * k * (1 - 0.02 * vein), b: base[2] * k * (1 - 0.06 * vein), h: 0.5 }
  }
}

function seeded(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, srgb = true) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d')!, size)
  const tex = new THREE.CanvasTexture(canvas)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function leafGeometry(len: number, wid: number) {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(wid * 1.5, len * 0.16, wid * 1.2, len * 0.72, 0, len)
  shape.bezierCurveTo(-wid * 1.2, len * 0.72, -wid * 1.5, len * 0.16, 0, 0)
  const g = new THREE.ShapeGeometry(shape, 12)
  const pos = g.attributes.position as THREE.BufferAttribute
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const y = pos.getY(i)
    uv.setXY(i, x / (wid * 3) + 0.5, y / len)
    pos.setZ(i, -Math.pow(y / len, 2) * 0.3 * len + Math.abs(x) * 0.35)
  }
  g.computeVertexNormals()
  return g
}

// pillow-like bulge for cushions
function puff(geo: THREE.BufferGeometry, hx: number, hz: number, amount: number) {
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i)
    const f = (1 - Math.min(1, (x / hx) ** 2)) * (1 - Math.min(1, (z / hz) ** 2))
    p.setY(i, y + Math.sign(y) * f * amount)
  }
  geo.computeVertexNormals()
}

const FinishShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, seed: { value: 0 }, vignette: { value: 0.3 }, grain: { value: 0.03 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float seed; uniform float vignette; uniform float grain; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.9, 0.18, length(d * vec2(1.15, 1.0)));
      c.rgb *= mix(1.0 - vignette, 1.0, v);
      float n = rnd(vUv * vec2(1920.0, 1080.0) + seed) - 0.5;
      c.rgb += n * grain;
      gl_FragColor = c;
    }`,
}

// ---------------------------------------------------------------------------------------------------------------------

export async function createInteriorScene(canvas: HTMLCanvasElement, opts: { pixelRatio?: number; shadows?: boolean; quality?: Quality } = {}): Promise<InteriorScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  const basePixelRatio = Math.min(opts.pixelRatio ?? 1.5, 2)
  renderer.setPixelRatio(basePixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = opts.shadows !== false
  renderer.shadowMap.type = THREE.PCFShadowMap
  RectAreaLightUniformsLib.init()

  const scene = new THREE.Scene()
  const BG = new THREE.Color('#1c241e')
  scene.background = BG
  await yieldMain()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTexture
  scene.environmentIntensity = 0.4
  await yieldMain()

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 80)
  const reveals: Reveal[] = []
  const disposables: { dispose: () => void }[] = [pmrem, envTexture]
  const track = <U extends { dispose: () => void }>(item: U) => { disposables.push(item); return item }

  const COLORS = {
    concrete: new THREE.Color('#a8a59e'),
    paint: new THREE.Color('#e3dac9'),
    oak: '#c19a6b',
    walnut: '#5e4130',
    greige: '#b7a995',
    sage: '#6b7e66',
    brass: '#b8a273',
    stone: '#ebe7de',
    ink: '#24292a',
  }

  // ---- textures -------------------------------------------------------------
  const wood = await buildPairAsync(768, [W / 3, D / 3], woodShade(12, 7, [196, 150, 104], 2))
  const oakSlat: Awaited<ReturnType<typeof buildPairAsync>>[] = []
  for (const [i, seed] of [3, 8, 13, 21].entries()) {
    const t = await buildPairAsync(256, [1, 1], woodShade(3, seed, [200, 152, 104], 1, true), true, 4)
    t.map.offset.set(i * 0.17, 0)
    oakSlat.push(t)
  }
  const walnutTex = await buildPairAsync(256, [1, 1], woodShade(4, 41, [112, 78, 58], 1, true), true, 4)
  const plaster = await buildPairAsync(384, [W / 2.2, H / 2.2], plasterShade(21))
  const plasterRight = await buildPairAsync(384, [D / 2.2, H / 2.2], plasterShade(25))
  const sofaTex = await buildPairAsync(384, [3, 3], bouclShade(31, [226, 218, 202]))
  const cushionTex = await buildPairAsync(256, [2, 2], bouclShade(33, [255, 255, 255], 0.28))
  const rugTex = await buildPairAsync(384, [3.5, 3.5], bouclShade(37, [222, 212, 192], 0.5))
  const marble = await buildPairAsync(384, [1, 1], marbleShade(51, [238, 234, 226]), false)
  const marbleDark = await buildPairAsync(256, [1, 1], marbleShade(57, [214, 206, 194]), false)
  const velvetTex = await buildPairAsync(256, [3, 3], bouclShade(61, [255, 255, 255], 0.12))
  const leafTexture = canvasTex(256, (ctx, size) => {
    const g = ctx.createLinearGradient(0, size, 0, 0)
    g.addColorStop(0, '#2f4a2e'); g.addColorStop(0.5, '#4a6e43'); g.addColorStop(1, '#6f9560')
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(200,225,170,.55)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(size / 2, size); ctx.lineTo(size / 2, 0); ctx.stroke()
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(200,225,170,.28)'
    for (let i = 1; i < 14; i++) { const y = size - (i / 14) * size; ctx.beginPath(); ctx.moveTo(size / 2, y); ctx.lineTo(size * 0.12, y - 26); ctx.moveTo(size / 2, y); ctx.lineTo(size * 0.88, y - 26); ctx.stroke() }
  })
  const skyTexture = (stops: [number, string][], tree: string) => canvasTex(512, (ctx, size) => {
    const g = ctx.createLinearGradient(0, 0, 0, size)
    stops.forEach(([o, c]) => g.addColorStop(o, c))
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
    const rnd = seeded(5)
    ctx.filter = 'blur(5px)'
    ctx.fillStyle = tree
    ctx.beginPath(); ctx.moveTo(0, size)
    for (let x = 0; x <= size; x += 14) ctx.lineTo(x, size * 0.66 - Math.sin(x * 0.018) * 18 - rnd() * 26)
    ctx.lineTo(size, size); ctx.fill()
    ctx.filter = 'blur(10px)'
    ctx.globalAlpha = 0.55
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(rnd() * size, size * (0.5 + rnd() * 0.12), 26 + rnd() * 34, 0, Math.PI * 2); ctx.fill() }
    ctx.filter = 'none'; ctx.globalAlpha = 1
  })
  const daySky = skyTexture([[0, '#9fc3e4'], [0.55, '#e8eff2'], [1, '#f6e8cf']], '#5f7e5c')
  const duskSky = skyTexture([[0, '#2c3350'], [0.55, '#b4617a'], [0.85, '#f2a36a'], [1, '#f6c58a']], '#2b3a38')
  const screenTexture = canvasTex(512, (ctx, size) => {
    const g = ctx.createLinearGradient(0, 0, 0, size)
    g.addColorStop(0, '#2a3b66'); g.addColorStop(0.55, '#e29a6a'); g.addColorStop(1, '#f6d29a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#1d2433'
    ctx.beginPath(); ctx.moveTo(0, size * 0.72)
    ;[[0.18, 0.5], [0.34, 0.66], [0.52, 0.42], [0.7, 0.62], [0.86, 0.5], [1, 0.7]].forEach(([x, y]) => ctx.lineTo(size * x, size * y))
    ctx.lineTo(size, size); ctx.lineTo(0, size); ctx.fill()
  })
  const artTexture = canvasTex(512, (ctx, size) => {
    ctx.fillStyle = '#efe8da'; ctx.fillRect(0, 0, size, size)
    const blobs: [number, number, number, string][] = [[0.34, 0.4, 0.26, '#6b7e66'], [0.62, 0.55, 0.2, '#b8a273'], [0.5, 0.72, 0.16, '#5e4130'], [0.7, 0.28, 0.1, '#c98d6a']]
    blobs.forEach(([x, y, r, c]) => { ctx.fillStyle = c; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(size * x, size * y, size * r, size * r * 1.15, 0.4, 0, Math.PI * 2); ctx.fill() })
    ctx.globalAlpha = 1
  })
  const textures = [wood, ...oakSlat, walnutTex, plaster, plasterRight, sofaTex, cushionTex, rugTex, marble, marbleDark, velvetTex]
  for (const t of textures) { disposables.push(t.map); if (t.bump) disposables.push(t.bump) }
  disposables.push(leafTexture, daySky, duskSky, screenTexture, artTexture)
  const toUpload: THREE.Texture[] = [leafTexture, daySky, duskSky, screenTexture, artTexture]
  for (const t of textures) { toUpload.push(t.map); if (t.bump) toUpload.push(t.bump) }
  await yieldMain()

  // ---- material + mesh helpers ---------------------------------------------
  const std = (color: string | THREE.Color, roughness = 0.7, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }))
  const phys = (params: THREE.MeshPhysicalMaterialParameters) => track(new THREE.MeshPhysicalMaterial(params))
  const brass = () => std(COLORS.brass, 0.28, 0.95)
  const emissive = (color: string, intensity: number) => track(new THREE.MeshStandardMaterial({ color: '#2a2218', emissive: color, emissiveIntensity: intensity, roughness: 0.6 }))
  const fabricMat = (tex: { map: THREE.Texture; bump?: THREE.Texture }, color: string, bumpScale = 1.2) =>
    phys({ color, map: tex.map, bumpMap: tex.bump, bumpScale, roughness: 1, sheen: 0.8, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') })
  const velvetMat = (color: string) =>
    phys({ color, map: velvetTex.map, bumpMap: velvetTex.bump, bumpScale: 0.4, roughness: 0.85, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color('#c9dcc0') })
  const marbleMat = (tex = marble) => phys({ map: tex.map, color: '#ffffff', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08 })
  const oakMat = (i = 0) => phys({ map: oakSlat[i % oakSlat.length].map, bumpMap: oakSlat[i % oakSlat.length].bump, bumpScale: 1.4, color: '#ffffff', roughness: 0.5, clearcoat: 0.18, clearcoatRoughness: 0.4 })
  const walnutMat = () => phys({ map: walnutTex.map, bumpMap: walnutTex.bump, bumpScale: 1.2, color: '#ffffff', roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.35 })

  const box = (w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0, cast = true, receive = true) => {
    const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), material)
    mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = receive
    return mesh
  }
  const rbox = (w: number, h: number, d: number, r: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 4) => {
    const geo = track(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)))
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true
    return mesh
  }
  const cyl = (rt: number, rb: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 32) => {
    const mesh = new THREE.Mesh(track(new THREE.CylinderGeometry(rt, rb, h, seg)), material)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true
    return mesh
  }
  const register = (obj: THREE.Object3D, a: number, b: number, mode: Reveal['mode'], dist = 1.2) => {
    const mats: THREE.Material[] = []
    if (mode === 'drop' || mode === 'fade' || mode === 'slide') {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh) return
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of list) { if (!mats.includes(m)) mats.push(m) }
      })
    }
    reveals.push({ obj, a, b, mode, baseY: obj.position.y, dist, mats })
    scene.add(obj)
    obj.visible = false
  }
  const group = (...children: THREE.Object3D[]) => { const g = new THREE.Group(); children.forEach((c) => g.add(c)); return g }
  const pivotBottom = (mesh: THREE.Mesh, height: number) => { mesh.geometry.translate(0, height / 2, 0); return mesh }

  // ---- lights ---------------------------------------------------------------
  const hemi = new THREE.HemisphereLight('#fff6e6', '#8b8070', 0.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff0d8', 2)
  sun.position.set(-9, 6, 2.2)
  sun.target.position.set(0.5, 0, -0.4)
  sun.castShadow = renderer.shadowMap.enabled
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera
  sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 24
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.03
  sun.shadow.radius = 5
  scene.add(sun, sun.target)

  const winZ0 = -1.55; const winZ1 = 1.05; const sillH = 0.4; const headY = 2.55
  const winW = winZ1 - winZ0; const winH = headY - sillH
  const windowLight = new THREE.RectAreaLight('#fff4e0', 2.4, winW, winH)
  windowLight.position.set(-W / 2 - 0.05, (sillH + headY) / 2, (winZ0 + winZ1) / 2)
  windowLight.lookAt(0.5, 0.9, -0.3)
  scene.add(windowLight)
  const tvLight = new THREE.PointLight('#ffc98a', 0, 6, 2); tvLight.position.set(0, 1.1, -2.2)
  const lampLight = new THREE.PointLight('#ffc98a', 0, 6, 2); lampLight.position.set(2.1, 1.45, -1.0)
  const coveLight = new THREE.PointLight('#ffd9a8', 0, 9, 2); coveLight.position.set(0, 2.55, 0)
  scene.add(tvLight, lampLight, coveLight)

  await yieldMain()
  // ---- shell ----------------------------------------------------------------
  const wallMat = phys({ color: COLORS.concrete.clone(), map: plaster.map, bumpMap: plaster.bump, bumpScale: 0.8, roughness: 0.94 })
  const slabMat = std('#2c332e', 0.9)
  register(box(W + 0.5, 0.22, D + 0.5, slabMat, 0, -0.11, 0, false, true), 0, 0.06, 'growXZ')

  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), phys({ color: '#ffffff', map: wood.map, bumpMap: wood.bump, bumpScale: 1.6, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.32 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; floor.receiveShadow = true
  register(floor, 0.16, 0.26, 'fade')

  const outline = new THREE.LineLoop(
    track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, 0.012, -D / 2), new THREE.Vector3(W / 2, 0.012, -D / 2), new THREE.Vector3(W / 2, 0.012, D / 2), new THREE.Vector3(-W / 2, 0.012, D / 2)])),
    track(new THREE.LineBasicMaterial({ color: COLORS.brass, transparent: true, opacity: 1 })),
  )
  scene.add(outline)
  const labelSprite = (text: string, x: number, y: number, z: number) => {
    const tex = canvasTex(256, (ctx, size) => {
      ctx.clearRect(0, 0, size, size)
      ctx.font = '600 40px Manrope, system-ui, sans-serif'; ctx.fillStyle = '#d0bd8e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(text, size / 2, size / 2)
    })
    disposables.push(tex)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    sprite.scale.set(1.3, 1.3, 1); sprite.position.set(x, y, z)
    sprite.layers.set(1)
    scene.add(sprite)
    return sprite
  }
  const dimA = labelSprite('6.0 m', 0, 0.2, D / 2 + 0.55)
  const dimB = labelSprite('5.5 m', W / 2 + 0.6, 0.2, 0)

  register(pivotBottom(box(W + 0.4, H, T, wallMat, 0, 0, -D / 2 - T / 2), H), 0.04, 0.11, 'grow')
  const wx = -W / 2 - T / 2
  const backLen = winZ0 - (-D / 2); const frontLen = D / 2 - winZ1
  const piece = (w: number, h: number, d: number, y0: number, z: number) => pivotBottom(box(w, h, d, wallMat, wx, y0, z), h)
  register(piece(T, H, backLen + T, 0, -D / 2 + backLen / 2 - T / 2), 0.06, 0.12, 'grow')
  register(piece(T, sillH, winW, 0, (winZ0 + winZ1) / 2), 0.08, 0.13, 'grow')
  register(piece(T, H - headY, winW, headY, (winZ0 + winZ1) / 2), 0.1, 0.14, 'grow')
  register(piece(T, H, frontLen, 0, winZ1 + frontLen / 2), 0.09, 0.14, 'grow')

  const innerWallMat = phys({ color: COLORS.paint.clone(), map: plasterRight.map, bumpMap: plasterRight.bump, bumpScale: 0.8, roughness: 0.92 })
  const rightWall = new THREE.Mesh(track(new THREE.PlaneGeometry(D, H)), innerWallMat)
  rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(W / 2, H / 2, 0); rightWall.receiveShadow = true
  const frontWall = new THREE.Mesh(track(new THREE.PlaneGeometry(W, H)), innerWallMat)
  frontWall.rotation.y = Math.PI; frontWall.position.set(0, H / 2, D / 2); frontWall.receiveShadow = true
  register(rightWall, 0.1, 0.14, 'fade'); register(frontWall, 0.1, 0.14, 'fade')

  const frameMat = std(COLORS.ink, 0.45, 0.5)
  const frame = group(
    box(0.08, 0.07, winW + 0.08, frameMat, 0, sillH, 0),
    box(0.08, 0.07, winW + 0.08, frameMat, 0, headY, 0),
    box(0.08, winH, 0.07, frameMat, 0, (sillH + headY) / 2, winZ0),
    box(0.08, winH, 0.07, frameMat, 0, (sillH + headY) / 2, winZ1),
    box(0.06, winH, 0.05, frameMat, 0, (sillH + headY) / 2, (winZ0 + winZ1) / 2),
    box(0.06, 0.05, winW, frameMat, 0, (sillH + headY) / 2 + 0.2, 0),
    box(0.22, 0.04, winW + 0.2, std('#e9e4d9', 0.5), 0.07, sillH - 0.01, 0),
  )
  frame.position.x = -W / 2 - T / 2
  register(frame, 0.13, 0.2, 'fade')

  const skyDay = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 7)), new THREE.MeshBasicMaterial({ map: daySky, toneMapped: false, transparent: true, opacity: 0 }))
  skyDay.rotation.y = Math.PI / 2; skyDay.position.set(-W / 2 - 3.2, 2.2, 0)
  const skyDusk = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 7)), new THREE.MeshBasicMaterial({ map: duskSky, toneMapped: false, transparent: true, opacity: 0 }))
  skyDusk.rotation.y = Math.PI / 2; skyDusk.position.set(-W / 2 - 3.15, 2.2, 0)
  scene.add(skyDay, skyDusk)

  // sun shafts coming through the window
  const shaftDir = new THREE.Vector3().subVectors(sun.target.position, sun.position).normalize()
  const wX = -W / 2 - 0.02
  const corners = [new THREE.Vector3(wX, sillH, winZ0), new THREE.Vector3(wX, sillH, winZ1), new THREE.Vector3(wX, headY, winZ1), new THREE.Vector3(wX, headY, winZ0)]
  const floorHit = corners.map((c) => c.clone().addScaledVector(shaftDir, c.y / -shaftDir.y))
  const sv: number[] = []; const sc4: number[] = []
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, a0: number, a1: number) => {
    const push = (v: THREE.Vector3, al: number) => { sv.push(v.x, v.y, v.z); sc4.push(1, 0.93, 0.78, al) }
    push(a, a0); push(b, a0); push(c, a1); push(a, a0); push(c, a1); push(d, a1)
  }
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(corners[i], corners[j], floorHit[j], floorHit[i], 0.5, 0.0) }
  const shaftGeo = track(new THREE.BufferGeometry())
  shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3))
  shaftGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc4, 4))
  const shaftMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }))
  const shafts = new THREE.Mesh(shaftGeo, shaftMat)
  shafts.visible = false
  shafts.layers.set(1)
  scene.add(shafts)

  // skirting
  const skirtMat = walnutMat()
  register(group(
    box(W, 0.1, 0.03, skirtMat, 0, 0.05, -D / 2 + 0.015, false, true),
    box(0.03, 0.1, D, skirtMat, -W / 2 + 0.015, 0.05, 0, false, true),
    box(0.03, 0.1, D, skirtMat, W / 2 - 0.015, 0.05, 0, false, true),
  ), 0.2, 0.27, 'fade')

  await yieldMain()
  // ---- ceiling --------------------------------------------------------------
  const ceilMat = phys({ color: '#f2eee6', map: plaster.map, bumpMap: plaster.bump, bumpScale: 0.5, roughness: 0.95, emissive: '#d9d3c7', emissiveIntensity: 0.14 })
  const ceilingPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), ceilMat)
  ceilingPlane.rotation.x = Math.PI / 2; ceilingPlane.position.y = H
  const tray = box(W - 1.5, 0.16, D - 1.5, std('#f7f3ec', 0.9, 0, { emissive: '#d9d3c7', emissiveIntensity: 0.12 }), 0, H - 0.08, 0, false, false)
  const coveMat = emissive('#ffd7a0', 0.5)
  const coveW = W - 1.5; const coveD = D - 1.5
  const cove = group(
    box(coveW + 0.12, 0.025, 0.06, coveMat, 0, H - 0.17, -coveD / 2 - 0.05, false, false),
    box(coveW + 0.12, 0.025, 0.06, coveMat, 0, H - 0.17, coveD / 2 + 0.05, false, false),
    box(0.06, 0.025, coveD + 0.12, coveMat, -coveW / 2 - 0.05, H - 0.17, 0, false, false),
    box(0.06, 0.025, coveD + 0.12, coveMat, coveW / 2 + 0.05, H - 0.17, 0, false, false),
  )
  const spotMat = emissive('#fff2dc', 0.6)
  const spotRim = brass()
  const spots = new THREE.Group()
  for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 3; iz++) {
    const x = -1.5 + ix * 1; const z = -1.4 + iz * 1.25
    const s = cyl(0.05, 0.05, 0.012, spotMat, x, H - 0.166, z, 20); s.castShadow = false
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.064, 0.007, 8, 24)), spotRim); ring.rotation.x = Math.PI / 2; ring.position.set(x, H - 0.162, z)
    spots.add(s, ring)
  }
  register(group(ceilingPlane, tray, cove, spots), 0.22, 0.34, 'slide', 1.6)

  // curtains with deeper folds
  const curtainGeo = track(new THREE.PlaneGeometry(1.1, 2.8, 70, 1))
  const cp = curtainGeo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i); cp.setZ(i, Math.sin(x * 19) * 0.05 + Math.sin(x * 7.3 + 1.2) * 0.03) }
  curtainGeo.computeVertexNormals()
  const curtainMat = phys({ color: '#f1ebe0', roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.82, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') })
  curtainMat.userData.fixedOpacity = 0.82
  const curtainA = new THREE.Mesh(curtainGeo, curtainMat); curtainA.position.set(-W / 2 + 0.16, 1.42, winZ0 - 0.5); curtainA.rotation.y = Math.PI / 2
  const curtainB = new THREE.Mesh(curtainGeo, curtainMat); curtainB.position.set(-W / 2 + 0.16, 1.42, winZ1 + 0.5); curtainB.rotation.y = Math.PI / 2
  curtainA.castShadow = curtainB.castShadow = true
  const rod = cyl(0.015, 0.015, winW + 2.3, brass(), -W / 2 + 0.14, 2.82, (winZ0 + winZ1) / 2, 12); rod.rotation.x = Math.PI / 2
  register(group(curtainA, curtainB, rod), 0.24, 0.31, 'drop', 0.8)

  await yieldMain()
  // ---- joinery --------------------------------------------------------------
  const slatCount = 34; const slatPitch = 3.0 / slatCount
  const slats = new THREE.Group()
  const slatMats = [0, 1, 2, 3].map((i) => oakMat(i))
  for (let i = 0; i < slatCount; i++) {
    const slat = pivotBottom(box(slatPitch * 0.68, 2.7, 0.06, slatMats[i % 4], -1.5 + slatPitch * (i + 0.5), 0.0, -D / 2 + 0.03), 2.7)
    const a = 0.3 + (i / slatCount) * 0.09
    reveals.push({ obj: slat, a, b: a + 0.05, mode: 'grow', baseY: 0, dist: 0, mats: [] })
    slat.visible = false; slats.add(slat)
  }
  scene.add(slats)
  register(box(3.0, 2.7, 0.03, std('#2a1e16', 0.8), 0, 1.35, -D / 2 + 0.015, false, true), 0.3, 0.34, 'fade')

  const greigeMat = phys({ color: COLORS.greige, map: cushionTex.map, bumpMap: cushionTex.bump, bumpScale: 0.5, roughness: 0.85, sheen: 0.3, sheenRoughness: 0.7 })
  const inlay = std(COLORS.brass, 0.25, 1)
  register(group(
    box(1.45, 2.7, 0.05, greigeMat, -2.25, 1.35, -D / 2 + 0.025),
    box(1.45, 2.7, 0.05, greigeMat, 2.25, 1.35, -D / 2 + 0.025),
    box(0.012, 2.7, 0.06, inlay, -1.52, 1.35, -D / 2 + 0.03, false, false),
    box(0.012, 2.7, 0.06, inlay, 1.52, 1.35, -D / 2 + 0.03, false, false),
  ), 0.38, 0.45, 'fade')

  const unitMat = phys({ color: '#d9d1c3', roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.25 })
  const unitTop = new THREE.Group()
  const tvUnit = group(
    rbox(2.6, 0.4, 0.46, 0.02, unitMat, 0, 0.5, -D / 2 + 0.31),
    box(2.64, 0.035, 0.5, oakMat(2), 0, 0.717, -D / 2 + 0.31),
    box(0.01, 0.34, 0.01, std('#4a4238'), -0.43, 0.5, -D / 2 + 0.545, false, false),
    box(0.01, 0.34, 0.01, std('#4a4238'), 0.43, 0.5, -D / 2 + 0.545, false, false),
    box(2.4, 0.012, 0.3, emissive('#ffcf94', 0.3), 0, 0.29, -D / 2 + 0.3, false, false),
    unitTop,
  )
  // styling on the unit: books, a bowl, a vase with stems
  unitTop.add(box(0.3, 0.035, 0.22, std('#3a4a52', 0.8), -0.9, 0.753, -D / 2 + 0.3))
  unitTop.add(box(0.27, 0.03, 0.2, std('#c98d6a', 0.8), -0.9, 0.787, -D / 2 + 0.31))
  unitTop.add(cyl(0.12, 0.06, 0.07, brass(), -0.6, 0.77, -D / 2 + 0.3, 28))
  const vase = cyl(0.05, 0.07, 0.24, phys({ color: '#d8cdb8', roughness: 0.25, clearcoat: 0.8 }), 0.95, 0.857, -D / 2 + 0.3, 24)
  unitTop.add(vase)
  for (let i = 0; i < 5; i++) {
    const stem = cyl(0.0035, 0.0035, 0.55, std('#8a7a55', 0.9), 0.95 + (i - 2) * 0.02, 1.2, -D / 2 + 0.3, 5)
    stem.rotation.z = (i - 2) * 0.09; stem.castShadow = false; unitTop.add(stem)
    const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.03, 10, 8)), std('#cdbb94', 0.95)); head.scale.set(0.7, 1.7, 0.7)
    head.position.set(0.95 + (i - 2) * 0.02 + (i - 2) * 0.055, 1.47, -D / 2 + 0.3); head.castShadow = true; unitTop.add(head)
  }
  register(tvUnit, 0.4, 0.48, 'drop', 0.9)

  const tvMat = phys({ color: '#0b0c0e', roughness: 0.18, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08 })
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture, color: '#000000', toneMapped: false })
  const tv = group(
    box(1.62, 0.93, 0.04, tvMat, 0, 1.52, -D / 2 + 0.1),
    new THREE.Mesh(track(new THREE.PlaneGeometry(1.56, 0.87)), screenMat),
  )
  ;(tv.children[1] as THREE.Mesh).position.set(0, 1.52, -D / 2 + 0.123)
  register(tv, 0.46, 0.52, 'drop', 0.7)

  const dispX = 1.95
  const towerMat = walnutMat()
  const glassShelf = phys({ color: '#dfe8e6', roughness: 0.05, transparent: true, opacity: 0.4, clearcoat: 1 })
  const warmBack = emissive('#ffc784', 0.5)
  const tower = new THREE.Group()
  tower.add(box(0.05, 2.3, 0.4, towerMat, dispX - 0.28, 1.15, -D / 2 + 0.2))
  tower.add(box(0.05, 2.3, 0.4, towerMat, dispX + 0.28, 1.15, -D / 2 + 0.2))
  tower.add(box(0.61, 0.05, 0.4, towerMat, dispX, 2.3, -D / 2 + 0.2))
  tower.add(box(0.61, 0.05, 0.4, towerMat, dispX, 0.025, -D / 2 + 0.2))
  tower.add(box(0.51, 2.25, 0.015, warmBack, dispX, 1.15, -D / 2 + 0.03, false, false))
  const objMats = [std('#e8e1d4', 0.5), std(COLORS.sage, 0.6), brass(), std('#c98d6a', 0.6), std('#2c2f31', 0.4)]
  for (let i = 1; i <= 5; i++) {
    const y = 0.1 + i * 0.37
    tower.add(box(0.52, 0.016, 0.36, glassShelf, dispX, y, -D / 2 + 0.2, false, true))
    const m = objMats[i % objMats.length]
    if (i % 2) tower.add(cyl(0.055, 0.07, 0.19, m, dispX - 0.1, y + 0.1, -D / 2 + 0.2, 24))
    else tower.add(rbox(0.2, 0.15, 0.16, 0.02, m, dispX - 0.08, y + 0.082, -D / 2 + 0.2))
    const orb = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 20, 14)), objMats[(i + 2) % objMats.length]); orb.castShadow = true
    orb.position.set(dispX + 0.12, y + 0.07, -D / 2 + 0.2); tower.add(orb)
  }
  register(tower, 0.44, 0.54, 'drop', 0.8)

  await yieldMain()
  // ---- furniture ------------------------------------------------------------
  const rugMat = fabricMat(rugTex, '#ddd2bf', 2.2)
  rugMat.sheen = 0.4
  const rug = new THREE.Mesh(track(new THREE.CylinderGeometry(1.75, 1.75, 0.022, 72)), rugMat)
  rug.position.set(0.2, 0.014, -0.45); rug.scale.set(1.1, 1, 0.92); rug.receiveShadow = true
  const rugEdge = new THREE.Mesh(track(new THREE.TorusGeometry(1.7, 0.014, 8, 90)), std('#8c7b62', 1)); rugEdge.rotation.x = Math.PI / 2; rugEdge.position.set(0.2, 0.027, -0.45); rugEdge.scale.set(1.1, 0.92, 1)
  register(group(rug, rugEdge), 0.5, 0.57, 'fade')

  const sofaFabric = fabricMat(sofaTex, '#d7cdbb', 1.4)
  const cushionFabric = fabricMat(cushionTex, '#ddd5c4', 1.0)
  const sofa = new THREE.Group()
  const legY = 0.12
  sofa.add(rbox(2.5, 0.38, 0.98, 0.08, sofaFabric, 0, legY + 0.19, 0, 6))
  sofa.add(rbox(0.22, 0.36, 0.98, 0.09, sofaFabric, -1.2, legY + 0.56, 0, 6))
  sofa.add(rbox(0.22, 0.36, 0.98, 0.09, sofaFabric, 1.2, legY + 0.56, 0, 6))
  sofa.add(rbox(0.95, 0.38, 0.95, 0.08, sofaFabric, 0.775, legY + 0.19, -0.94, 6))
  for (const x of [-0.72, 0.0, 0.72]) {
    const back = rbox(0.76, 0.46, 0.2, 0.08, cushionFabric, x, legY + 0.65, 0.34, 6)
    back.rotation.x = -0.22; puff(back.geometry, 0.38, 0.1, 0.03); sofa.add(back)
    const seat = rbox(0.76, 0.13, 0.76, 0.06, cushionFabric, x, legY + 0.44, -0.04, 6)
    puff(seat.geometry, 0.38, 0.38, 0.03); sofa.add(seat)
  }
  const chaiseSeat = rbox(0.8, 0.13, 0.8, 0.06, cushionFabric, 0.775, legY + 0.44, -0.94, 6); puff(chaiseSeat.geometry, 0.4, 0.4, 0.03); sofa.add(chaiseSeat)
  const pillows: [number, number, string, number][] = [[-0.88, 0.68, '#b88a5c', 0.3], [-0.48, 0.7, '#efe8da', -0.2], [0.58, 0.7, '#6b7e66', 0.25]]
  for (const [x, y, c, ry] of pillows) {
    const pil = rbox(0.42, 0.42, 0.13, 0.06, fabricMat(cushionTex, c, 0.9), x, legY + y, 0.14, 6)
    pil.rotation.set(-0.25, ry, 0.05); puff(pil.geometry, 0.21, 0.21, 0.04); sofa.add(pil)
  }
  const throwM = rbox(0.6, 0.05, 0.42, 0.025, fabricMat(cushionTex, '#c98d6a', 0.9), 0.78, legY + 0.52, -0.95); throwM.rotation.y = 0.35; puff(throwM.geometry, 0.3, 0.21, 0.015); sofa.add(throwM)
  for (const [x, z] of [[-1.15, 0.38], [1.15, 0.38], [-1.15, -0.4], [1.2, -1.35]] as number[][]) sofa.add(cyl(0.022, 0.016, legY, brass(), x, legY / 2, z, 12))
  sofa.position.set(0.0, 0, 1.15)
  register(sofa, 0.54, 0.64, 'drop', 1.4)

  const table = new THREE.Group()
  table.add(cyl(0.56, 0.56, 0.04, marbleMat(marble), 0, 0.4, 0, 64))
  table.add(cyl(0.34, 0.4, 0.38, phys({ color: '#cfc5b4', map: oakSlat[0].map, roughness: 0.55, clearcoat: 0.2 }), 0, 0.2, 0, 48))
  const ribMat = std('#b9ae9b', 0.8)
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; const r = box(0.012, 0.36, 0.02, ribMat, Math.cos(a) * 0.395, 0.2, Math.sin(a) * 0.395, false, false); r.rotation.y = -a; table.add(r) }
  table.add(cyl(0.09, 0.07, 0.15, phys({ color: '#efe9de', roughness: 0.25, clearcoat: 0.8 }), 0.15, 0.495, 0.05, 28))
  table.add(rbox(0.3, 0.035, 0.22, 0.008, std('#35403f', 0.7), -0.14, 0.438, -0.08))
  table.add(rbox(0.28, 0.03, 0.2, 0.008, std('#c9b99a', 0.7), -0.13, 0.472, -0.07))
  table.position.set(0.3, 0, -0.55)
  register(table, 0.6, 0.67, 'drop', 1.1)

  const chairFabric = velvetMat(COLORS.sage)
  const chair = new THREE.Group()
  chair.add(rbox(0.82, 0.3, 0.8, 0.1, chairFabric, 0, 0.29, 0, 6))
  const chairSeat = rbox(0.66, 0.12, 0.62, 0.06, chairFabric, 0, 0.5, 0.02, 6); puff(chairSeat.geometry, 0.33, 0.31, 0.03); chair.add(chairSeat)
  chair.add(rbox(0.82, 0.55, 0.18, 0.1, chairFabric, 0, 0.62, 0.34, 6))
  chair.add(rbox(0.12, 0.28, 0.76, 0.06, chairFabric, -0.4, 0.58, 0, 6))
  chair.add(rbox(0.12, 0.28, 0.76, 0.06, chairFabric, 0.4, 0.58, 0, 6))
  for (const [x, z] of [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]] as number[][]) chair.add(cyl(0.02, 0.012, 0.14, brass(), x, 0.07, z, 12))
  chair.position.set(-1.85, 0, -0.35); chair.rotation.y = Math.PI / 2 - 0.5
  register(chair, 0.64, 0.71, 'drop', 1.3)

  const sideTable = group(
    cyl(0.22, 0.22, 0.03, marbleMat(marbleDark), 0, 0.5, 0, 40), cyl(0.012, 0.012, 0.5, brass(), 0, 0.25, 0, 10), cyl(0.15, 0.15, 0.02, brass(), 0, 0.01, 0, 28),
    cyl(0.045, 0.06, 0.18, phys({ color: '#d9cdb9', roughness: 0.3, clearcoat: 0.7 }), 0.04, 0.6, 0, 20),
    cyl(0.04, 0.04, 0.07, phys({ color: '#efe6d3', roughness: 0.5 }), -0.07, 0.55, 0.05, 20),
  )
  sideTable.position.set(-2.3, 0, -1.25)
  register(sideTable, 0.68, 0.73, 'drop', 1.0)

  const lampShadeMat = track(new THREE.MeshStandardMaterial({ color: '#f3e3c6', emissive: '#ffcf94', emissiveIntensity: 0.25, side: THREE.DoubleSide, roughness: 0.9 }))
  const lamp = new THREE.Group()
  lamp.add(cyl(0.16, 0.16, 0.02, brass(), 0, 0.01, 0, 28), cyl(0.011, 0.011, 1.42, brass(), 0, 0.72, 0, 12))
  const shade = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.25, 0.3, 36, 1, true)), lampShadeMat); shade.position.y = 1.5; lamp.add(shade)
  lamp.position.set(2.1, 0, -1.0)
  register(lamp, 0.7, 0.76, 'drop', 1.2)

  const leafMats = ['#ffffff', '#e6f2dc', '#f2fbe8'].map((c) => std(c, 0.62, 0, { map: leafTexture, side: THREE.DoubleSide }))
  const leafGeos = [leafGeometry(0.85, 0.12), leafGeometry(1.05, 0.14), leafGeometry(0.7, 0.1)].map((g) => track(g))
  const makePlant = (x: number, z: number, scale: number, leaves: number, seed: number) => {
    const g = new THREE.Group(); const rnd = seeded(seed)
    g.add(cyl(0.2, 0.15, 0.4, phys({ color: '#d4c9b6', roughness: 0.55, clearcoat: 0.2 }), 0, 0.2, 0, 36))
    g.add(cyl(0.18, 0.18, 0.02, std('#2a211b', 1), 0, 0.395, 0, 24))
    for (let i = 0; i < leaves; i++) {
      const l = new THREE.Mesh(leafGeos[i % 3], leafMats[i % 3]); l.castShadow = true; l.receiveShadow = true
      l.rotation.order = 'YXZ'
      l.rotation.y = rnd() * Math.PI * 2
      l.rotation.x = 0.2 + rnd() * 0.65
      l.rotation.z = (rnd() - 0.5) * 0.3
      l.position.set((rnd() - 0.5) * 0.12, 0.4, (rnd() - 0.5) * 0.12)
      g.add(l)
    }
    g.position.set(x, 0, z); g.scale.setScalar(scale)
    return g
  }
  register(makePlant(2.45, -2.2, 1.25, 20, 3), 0.72, 0.78, 'drop', 1.2)
  register(makePlant(-2.4, 1.9, 1.0, 16, 9), 0.74, 0.79, 'drop', 1.2)

  const art = group(
    box(1.1, 0.8, 0.04, std(COLORS.ink, 0.5), 0, 0, 0),
    new THREE.Mesh(track(new THREE.PlaneGeometry(1.0, 0.7)), new THREE.MeshStandardMaterial({ map: artTexture, roughness: 0.9 })).translateZ(0.025),
  )
  art.position.set(W / 2 - 0.03, 1.65, -0.55); art.rotation.y = -Math.PI / 2
  register(art, 0.74, 0.79, 'fade')

  const ringMat = emissive('#ffe2b8', 0.8)
  const pendants = new THREE.Group()
  ;([[0.3, -0.55, 0.42, 1.95], [0.62, -0.7, 0.3, 1.7], [0.05, -0.35, 0.26, 2.2]] as number[][]).forEach(([x, z, r, y]) => {
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.012, 12, 72)), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); pendants.add(ring)
    for (const a of [0, 2.1, 4.2]) pendants.add(cyl(0.003, 0.003, H - y - 0.15, std('#222'), x + Math.cos(a) * r, y + (H - y - 0.15) / 2, z + Math.sin(a) * r, 4))
  })
  register(pendants, 0.8, 0.88, 'fade')

  await yieldMain()
  // ---- camera path ----------------------------------------------------------
  const camKeys: { p: [number, number, number]; t: [number, number, number]; fov: number }[] = [
    { p: [5.9, 5.5, 7.4], t: [0, 0.4, -0.3], fov: 36 },
    { p: [4.4, 3.5, 5.2], t: [-0.3, 0.8, -0.8], fov: 38 },
    { p: [2.3, 0.6, 3.5], t: [-1.1, 0.75, -2.0], fov: 44 },
    { p: [0.9, 1.5, -0.1], t: [-0.05, 1.35, -2.7], fov: 48 },
    { p: [-2.5, 1.55, 2.5], t: [0.7, 0.75, -1.6], fov: 54 },
    { p: [2.7, 1.55, 1.9], t: [-3, 1.15, -0.6], fov: 56 },
    { p: [2.85, 1.55, 3.35], t: [-0.5, 0.95, -1.3], fov: 50 },
  ]
  const camTimes = CAMERAS.map((c) => c.at)
  const posCurve = new THREE.CatmullRomCurve3(camKeys.map((k) => new THREE.Vector3(...k.p)), false, 'centripetal')
  const tgtCurve = new THREE.CatmullRomCurve3(camKeys.map((k) => new THREE.Vector3(...k.t)), false, 'centripetal')
  const tmpTarget = new THREE.Vector3()
  let focusDistance = 6

  const applyCamera = (p: number, aspect: number) => {
    let i = 0
    while (i < camTimes.length - 2 && p > camTimes[i + 1]) i++
    const s = range(p, camTimes[i], camTimes[i + 1])
    const e = s * s * s * (s * (s * 6 - 15) + 10)
    const u = (i + e) / (camTimes.length - 1)
    posCurve.getPoint(u, camera.position)
    tgtCurve.getPoint(u, tmpTarget)
    camera.lookAt(tmpTarget)
    camera.fov = lerp(camKeys[i].fov, camKeys[i + 1].fov, e) * Math.min(1.9, Math.max(1, 1.3 / aspect))
    camera.updateProjectionMatrix()
    focusDistance = camera.position.distanceTo(tmpTarget)
  }

  await yieldMain()
  // ---- post-processing ------------------------------------------------------
  let quality: Quality = opts.quality ?? 'high'
  let width = 1280; let height = 720
  const composer = new EffectComposer(renderer)
  const layerToggle = (on: boolean) => {
    const pass = new Pass()
    pass.needsSwap = false
    pass.render = () => { if (on) camera.layers.enable(1); else camera.layers.disable(1) }
    return pass
  }
  // light shafts and labels live on layer 1: drawn in the colour pass, hidden from the AO / depth-of-field depth passes
  composer.addPass(layerToggle(true))
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(layerToggle(false))
  const gtao = new GTAOPass(scene, camera, width, height)
  gtao.output = GTAOPass.OUTPUT.Default
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, radiusExponent: 1, rings: 2, samples: 16 })
  gtao.blendIntensity = 1
  composer.addPass(gtao)
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.2, 0.55, 0.92)
  composer.addPass(bloom)
  const bokeh = new BokehPass(scene, camera, { focus: 6, aperture: 0.0035, maxblur: 0.0045 })
  composer.addPass(bokeh)
  composer.addPass(new OutputPass())
  const finish = new ShaderPass(FinishShader)
  composer.addPass(finish)

  const applyQuality = () => {
    gtao.enabled = quality === 'high'
    bokeh.enabled = quality === 'high'
    bloom.enabled = quality !== 'low'
    sun.castShadow = quality !== 'low' && opts.shadows !== false
    renderer.setPixelRatio(quality === 'low' ? Math.min(1, basePixelRatio) : basePixelRatio)
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(width, height)
  }

  // ---- state ----------------------------------------------------------------
  const sunDay = new THREE.Color('#fff0d8'); const sunDusk = new THREE.Color('#ff9a5c')
  const hemiDaySky = new THREE.Color('#fff6e6'); const hemiDuskSky = new THREE.Color('#6a6f9a')
  const winDay = new THREE.Color('#fff4e0'); const winDusk = new THREE.Color('#ff9a7a')
  let progress = 0
  let aspect = 16 / 9

  const update = () => {
    const p = progress
    for (const r of reveals) {
      const t = outCubic(range(p, r.a, r.b))
      const vis = t > 0.002
      r.obj.visible = vis
      if (!vis) continue
      switch (r.mode) {
        case 'grow': r.obj.scale.y = Math.max(0.001, t); break
        case 'growXZ': r.obj.scale.set(Math.max(0.001, t), 1, Math.max(0.001, t)); break
        case 'drop': r.obj.position.y = r.baseY + (1 - t) * r.dist; break
        case 'slide': r.obj.position.y = r.baseY + (1 - t) * r.dist; break
        default: break
      }
      if (r.mats.length) {
        const o = smooth(t * 1.3)
        for (const m of r.mats) {
          const mm = m as THREE.MeshStandardMaterial
          const full = (mm.userData.fixedOpacity as number | undefined) ?? (mm.userData.baseOpacity as number | undefined) ?? (mm.opacity < 1 ? mm.opacity : 1)
          if (mm.userData.baseOpacity === undefined) mm.userData.baseOpacity = full
          mm.transparent = o < 0.99 || full < 1
          mm.opacity = full * o
          mm.depthWrite = o > 0.98
        }
      }
    }

    const bp = 1 - smooth(range(p, 0.07, 0.15))
    ;(outline.material as THREE.LineBasicMaterial).opacity = bp
    outline.visible = bp > 0.01
    for (const s of [dimA, dimB]) { (s.material as THREE.SpriteMaterial).opacity = bp * smooth(range(p, 0.0, 0.03)); s.visible = bp > 0.01 }

    const paintT = smooth(range(p, 0.16, 0.26))
    wallMat.color.copy(COLORS.concrete).lerp(COLORS.paint, paintT)
    slabMat.color.set('#2c332e').lerp(new THREE.Color('#373f39'), paintT)

    const L = smooth(range(p, 0.78, 1))
    const dayAmount = 1 - L
    hemi.intensity = lerp(0.5, 0.18, L); hemi.color.copy(hemiDaySky).lerp(hemiDuskSky, L)
    sun.intensity = lerp(2, 0.1, L); sun.color.copy(sunDay).lerp(sunDusk, L)
    windowLight.intensity = lerp(2.4, 0.9, L); windowLight.color.copy(winDay).lerp(winDusk, L)
    scene.environmentIntensity = lerp(0.3, 0.12, L)
    renderer.toneMappingExposure = lerp(0.9, 1.15, L)
    const skyIn = smooth(range(p, 0.1, 0.18))
    ;(skyDay.material as THREE.MeshBasicMaterial).opacity = skyIn
    ;(skyDusk.material as THREE.MeshBasicMaterial).opacity = L * skyIn
    skyDay.visible = skyIn > 0.01; skyDusk.visible = skyIn > 0.01
    const shaftIn = smooth(range(p, 0.2, 0.3)) * dayAmount
    shaftMat.opacity = shaftIn * 0.06
    shafts.visible = shaftIn > 0.01
    const ceilingOn = smooth(range(p, 0.3, 0.5))
    coveMat.emissiveIntensity = lerp(0.35, 2.4, Math.max(L, ceilingOn * 0.25))
    spotMat.emissiveIntensity = lerp(0.5, 2.6, Math.max(L, ceilingOn * 0.2))
    ringMat.emissiveIntensity = lerp(0.8, 2.8, L)
    warmBack.emissiveIntensity = lerp(0.5, 2.1, Math.max(L, smooth(range(p, 0.5, 0.6)) * 0.4))
    lampShadeMat.emissiveIntensity = lerp(0.25, 1.7, L)
    screenMat.color.setScalar(lerp(0.06, 1, smooth(range(p, 0.82, 0.95))))
    tvLight.intensity = 6 * L; lampLight.intensity = 5 * L; coveLight.intensity = 9 * L
    scene.background = BG
    applyCamera(p, aspect)
    ;(bokeh.uniforms as { focus: { value: number } }).focus.value = focusDistance
    finish.uniforms.seed.value = (p * 977) % 100
  }

  applyQuality()

  // Pre-upload textures and pre-compile every shader now (while the user is still scrolling elsewhere),
  // so nothing has to be uploaded or compiled the moment a new piece of furniture appears.
  for (let i = 0; i < toUpload.length; i++) {
    renderer.initTexture(toUpload[i])
    if (i % 2 === 1) await yieldMain()
  }
  const allVisible: { obj: THREE.Object3D; was: boolean }[] = []
  scene.traverse((o) => { allVisible.push({ obj: o, was: o.visible }); o.visible = true })
  camera.layers.enable(1)
  try { await renderer.compileAsync(scene, camera) } catch { /* compile on first draw instead */ }
  await yieldMain()
  if (quality !== 'low') {
    composer.setSize(96, 54)
    composer.render()
    composer.setSize(width, height)
  }
  for (const { obj, was } of allVisible) obj.visible = was
  await yieldMain()

  return {
    setProgress(p: number) { progress = clamp01(p) },
    resize(w: number, h: number) {
      width = w; height = h
      aspect = w / Math.max(1, h)
      renderer.setSize(w, h, false)
      composer.setSize(w, h)
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    },
    render() {
      update()
      if (quality === 'low') { camera.layers.enable(1); renderer.render(scene, camera) }
      else composer.render()
    },
    setQuality(level: Quality) { quality = level; applyQuality() },
    degrade() {
      quality = quality === 'high' ? 'medium' : 'low'
      applyQuality()
      return quality
    },
    dispose() {
      for (const d of disposables) d.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
