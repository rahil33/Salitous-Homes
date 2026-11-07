import type { Quality } from './interiorScene'

/**
 * Picks a starting quality tier for the 3D room from the graphics hardware.
 * Integrated / software GPUs start on a lighter tier so the first scroll through the room is already smooth;
 * the scene still measures real frame times and steps down further if needed.
 */
export function detectQuality(): Quality {
  let renderer = ''
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    return 'low'
  }

  const nav = navigator as Navigator & { deviceMemory?: number }
  const weakDevice = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
  const mobile = window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(pointer: coarse)').matches

  let tier: Quality
  if (/swiftshader|llvmpipe|software|basic render|microsoft/i.test(renderer)) tier = 'low'
  else if (/intel.*(hd|uhd)\b|intel\(r\) (hd|uhd)|mali|adreno|powervr|videocore/i.test(renderer)) tier = 'low'
  else if (/geforce|rtx|gtx|quadro|radeon (rx|pro)|nvidia|amd radeon\(tm\) (rx|pro)/i.test(renderer)) tier = 'high'
  else tier = 'medium' // Intel Iris / Arc, Apple, unknown

  if (mobile && tier === 'high') tier = 'medium'
  if (weakDevice) tier = tier === 'high' ? 'medium' : 'low'
  return tier
}
