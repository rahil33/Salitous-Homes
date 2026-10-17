# Salitous Homes — Interior Walkthrough & Performance Handoff

**Updated:** 16 October 2026  
**Status:** Changes are in the frontend source and sandbox preview; they have **not** been deployed to the live business website.

## Summary

The performance-focused update is limited to the **“Interiors, designed to feel like home”** scroll section and the site’s reveal animations. The journey now moves indoors from the ground floor, up the staircase and onto the first floor; foundation, structure, envelope, MEP and exterior views are not part of the story. Existing site copy, global palette, fonts and unrelated page layout were preserved in this pass. Package tiers and inclusions remain; package prices are removed as previously requested.

The live section uses a compact, prebuilt model rather than generating the full house and PBR textures at page runtime. A portrait-specific fallback sequence prevents the mobile view from cropping the landscape walkthrough.

## Animation bundle: what was used and where

| Supplied bundle item | How it is used in the site |
| --- | --- |
| `SalitousCinematicCamera.ts` | Used by `src/components/ArchitecturalReveal.tsx` for eased, scroll-driven camera motion. Handheld sway and banking are disabled for a stable walkthrough. |
| `SalitousConstructionScene.ts`, `SalitousInteriorCamera.ts`, `salitousHouseLayout.mjs` and `.d.mts` | The procedural house/layout source and shared coordinates underpin the generated indoor model, continuous camera rail, progress mapping and geometry/collision tests. The rail is tested against walls, stairs, railings and furnishings. |
| `SalitousPbrUpgrade.ts` and `SalitousProceduralTextures.ts` | Used in the offline asset-preparation path for true-scale procedural material maps. Directional lighting/occlusion is baked into vertex colors before export. The resulting model uses 256px KTX2 textures. |
| `ArchitecturalReveal.tsx` and `salitousCinematic.css` | Their stage-card and letterbox ideas were adapted into the site’s `STAGE_DETAILS`, `.sx-detail` and `.sx-letterbox` treatment. The component itself was rewritten around the optimized model and fallbacks. |
| `ScrollReveal.tsx` (site implementation) | One shared `IntersectionObserver` triggers once-only opacity/20px translateY reveals, with 760ms eased transitions and 90–100ms sibling delays. Motion-based reveal imports were removed. |
| `SalitousAtmosphere.tsx` and `SalitousPostFX.tsx` | **Not loaded by the live walkthrough.** Their real-time shadows, procedural IBL/reflections, 9k grass/particles, god-rays, ambient-occlusion/depth-of-field/bloom/grain stack would conflict with the laptop performance requirement. Their visual direction is retained more cheaply through baked lighting, short distance fog and two simple lights. |

## Walkthrough behavior and runtime budget

- **Three chapters:** Ground floor → Staircase → First floor, mapped across a single continuous indoor camera rail from 0 to 100% scroll progress.
- **Interior composition:** The ground-floor living/dining and kitchen areas, staircase, and first-floor bedroom/study remain in view; exterior/site/service geometry is excluded. The scene integration tests confirm clearance for all sampled camera positions.
- **No sudden load reveal:** The section starts with a poster. The GLB is loaded when the section enters the viewport, rendered for three warm-up frames, then revealed. A lightweight Three.js distance fog (8–24 units) softens distant rooms and props as the camera approaches.
- **Viewport-gated rendering:** One `IntersectionObserver` mounts the Canvas only while the section is actually visible; it unmounts when it leaves. Scroll progress is read in the render loop, not a scroll-event handler. The image fallback has one RAF loop only while visible.
- **Adaptive graphics:** DPR is capped at 1.5, then reduced through 1.25/1/0.75 when frame rate is slow. If FPS remains below 40, or on low-memory/reduced-motion devices, the experience switches to a pre-rendered fallback. Reduced motion uses a static poster with no camera travel.
- **Low-cost scene:** The model uses Meshopt-compressed geometry, KTX2/Basis textures, GPU instancing for repeated items, 16 joined primitives, baked vertex-lighting/occlusion data, and no runtime shadow maps, reflections or post-processing. The KTX2 images are 256×256 at most (two auxiliary maps are 64×4).
- **Fallback assets:** 24 landscape frames (1280×720) and 24 portrait frames (720×1280) from the same camera rail. The appropriate sequence is selected for viewport width.

| Asset payload | Final size |
| --- | ---: |
| Optimized interior GLB | 1,473,948 bytes |
| Both Basis transcoder files | 584,862 bytes |
| 48 WebP fallback frames | 4,004,104 bytes |
| **Model + decoders + both fallback sequences** | **6,062,914 bytes (5.782 MiB)** |

The complete scene asset payload remains below the 8 MB budget. The compressed model and fallback frames are under `public/assets/`; the decoder files are under `public/basis/`.

## Before / after measurements

| Measurement | Before | After |
| --- | ---: | ---: |
| Production JavaScript bundle total | 1,825,139 bytes | 1,378,733 bytes (**−24.5%**) |
| Lazy 3D section chunk | 1,376,763 bytes (446.61 kB gzip) | 1,054,037 bytes (291.57 kB gzip; **−23.4% raw / −34.7% gzip**) |
| Standalone model | No separate model; geometry/material work was procedural at runtime | 1,473,948-byte Meshopt/KTX2 GLB |
| Total model + decoder + all fallback assets | No equivalent prebuilt asset pack | 6,062,914 bytes (**5.782 MiB**) |
| Headless Chromium frame rate | 0.3 FPS desktop / 0.4 FPS at 4× CPU throttle | The WebGL path falls back in this software-rendered environment; the sequence then sustains **58.8 FPS desktop / 58.5 FPS at 4×** |

**FPS limitation:** The benchmark ran in headless Chromium using SwiftShader, not on a physical integrated-GPU laptop. In that environment the initial WebGL sample was only 2.7 FPS desktop / 18.7 FPS at 4×, so the adaptive fallback activated. The steady numbers above are the image-sequence mode, not WebGL on laptop hardware. A real integrated-GPU laptop measurement remains outstanding; the production page automatically retains the smooth sequence fallback when WebGL is too slow.

## Validation

- `npm run build` — passed TypeScript and Vite production build. Vite still reports the lazily loaded section chunk above its 500 kB warning threshold; it is code-split and gzip is 291.57 kB.
- `npm run test:geometry` — **10 tests passed**, including 1,001 rail samples, scene visibility/clearance, Meshopt/instancing/KTX2, baked vertex colors, texture dimensions and the 8 MB combined asset budget.
- `npm run lint` — completed with **0 errors and 78 warnings**. Most warnings concern intentional imperative React Three Fiber render-loop/material updates and legacy scene/atmosphere modules; they do not fail the build.
- Final Chromium checks — no console errors; no horizontal overflow at **1280, 1440, 1860 and 390px mobile**. Desktop page CLS measured 0; mobile page CLS measured 0.0028. The desktop poster-to-component swap retained identical section bounds.
- The `/` preview and `/packages` route respond successfully in the sandbox preview.

## Preview and local run

[Open the current sandbox preview](https://5173-idxiqa2quyp8ho3233myr-f107adea.sg2.manus.computer/)

From the `salitous-live` directory:

```sh
npm ci
npm run dev
npm run test:geometry
npm run build
```
