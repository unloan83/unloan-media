# UNLOAN Automated Video Rendering Engine

Phase 6.5 converts `production_package.json` files into short-form video assets for Instagram Reels and YouTube Shorts.

## Input

Any production package shaped like:

```json
{
  "topic": "",
  "category": "",
  "hook": "",
  "thumbnail": "",
  "slides": [],
  "cta": "",
  "logo": "assets/logos/logo.png"
}
```

Supported categories:

- Wealth Building
- Trading Basics
- Investor Toolkit
- Investor Terminology
- Behavioral Finance

## Output

Each render creates:

- `video.mp4`
- `thumbnail.png`
- `caption.txt`
- `render_manifest.json`
- `scenes/scene_01.svg` through `scenes/scene_06.svg`
- `scenes/scene_01.png` through `scenes/scene_06.png`
- `preview.html`

Generated media is written to `video_engine/outputs/<topic-slug>/`.

## Render Commands

Dry run, useful when FFmpeg is not installed:

```bash
node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json --dry-run
```

Render one package:

```bash
node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json
```

Render a pilot package:

```bash
node video_engine/render.mjs --input pilot_launch/rule_of_72/production_package.json --out video_engine/outputs/pilot_rule_of_72
```

Batch render packages:

```bash
node video_engine/render_batch.mjs --source production/week_01
```

## Renderer

The engine uses FFmpeg for:

- SVG scene card rasterization to PNG
- PNG scene sequencing to 1080x1920 MP4
- `yuv420p` output for broad mobile-platform compatibility

Install FFmpeg before full rendering. Without FFmpeg, use `--dry-run` to generate captions, SVG scene templates, preview HTML, and manifests.

## Brand Rules

- The official logo is always referenced as `assets/logos/logo.png`.
- The renderer validates that the production package uses this exact logo path.
- No social media APIs are connected.
- No Canva APIs are connected.
