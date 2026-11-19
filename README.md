# Vice Heat Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Brengsek27/gta6-cover-art-01-r2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/Brengsek27/gta6-cover-art-01-r2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Your city. Your cover. An offline cover-art studio for sunburnt streets, neon nights and the people at the centre of the story. Turn your own photographs into an original cinematic crime-poster cover, with cream panel gutters, sunset lettering, neon subtitles, collectible seals and a little coastal chaos.

Nine live canvas layouts: Slash, Collage, Magazine, Filmstrip, Diptych, Grid, Hero, Duo and Tilt. Tilt builds a dusk skyline and palm backdrop behind shadowed, rotated snapshots. Magazine becomes **HEAT INDEX**, an original editorial cover. Filmstrip gives four photographs a numbered 35 mm treatment.

Seven actual pixel treatments: Vice Sunset, Neon Night, Golden Hour, Duotone, Comic Ink, Halftone Print and Natural. Duotone maps luminance to two inks; Comic Ink combines posterization with edge detection; Halftone Print makes a real dot screen. Each treatment includes deterministic film grain, a vignette and a subtle shared warm wash. The slash opening scene uses a Neon Night accent panel.

## Make a cover

1. Pick a layout in the left rail. Every thumbnail renders the actual composition.
2. Click a panel, then choose a sample or add a local image. Six sample photos are included. Replace or remove photos using the frame controls.
3. Drag the photograph to reframe it; adjust zoom or reset to the layout's tailored crop.
4. Write your title, neon subtitle and review quote. Choose a grade and grain level.
5. Choose landscape (1920 × 1080), portrait (1080 × 1350), or square (1080 × 1080). Export the current PNG, export all three sizes, or copy a PNG in browsers with image clipboard support. Your browser may ask permission for multiple downloads or clipboard access.

Photos remain on your device. No accounts, uploads, remote fonts, analytics, dependencies or network services. New images use local object URLs. The project lives in the current browser session; exported PNGs are yours to keep. All lettering, wording, seals, skyline and palms are original canvas drawings. This is an independent cover-art tool, with no affiliation to a game publisher.

## Run

Node 22.18+ (or Node 24) runs the TypeScript entry points directly. No install or build step.

```sh
node serve.ts
```

Open `http://127.0.0.1:8080`. Serve the files locally so ES modules and canvas exports work consistently. The static app is entirely in `app/`.

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This packages `app/`, the four judged images in `screenshots/`, and `dossier.json` using the byte-identical kit library. `out/` is ignored by Git.

## Deliberate scenes and verification

`shots.json` defines exact capture sizes. `?shot=cover` shows the Vice Sunset slash poster, `?shot=editor` shows the studio, `?shot=magazine` shows the portrait Duotone editorial, and `?shot=filmstrip` shows the square Night Drive cover. Cover-only scenes use the viewport dimensions directly.

```sh
node tools/capture.mjs
```

The capture tool uses Node's native WebSocket support to drive local headless Chromium over CDP, checks browser errors, exercises all layouts and grades, verifies PNG creation, and writes four JPEGs under the 256 KiB cap. It detects the installed system or cached testing browser; set `CHROMIUM_PATH` to choose another local Chromium executable. `CAPTURE_PORT` and `CDP_PORT` can override its local ports. Browser profiles are temporary and removed after capture. The small WebGL policy file enables the optional Muse Chromium fallback without granting WebGL access to any domains; this app uses only Canvas 2D.

Sample images and kit library are included under the accompanying license. No packages or external assets are downloaded.
