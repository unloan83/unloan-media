# UNLOAN Automated Video Rendering Engine

The engine converts `production_package.json` files into 1080x1920 videos for Instagram Reels and YouTube Shorts.

Production mode is the default for single, batch, pilot, weekly, local, and GitHub Actions rendering.

## Default Production Behavior

- Uses the original `assets/logos/logo.png` asset only.
- Hides scene numbers and debug boundaries.
- Simplifies long source text into one headline and one support statement.
- Preserves minimum mobile-readable font sizes.
- Uses the shared premium finance palette in `design_tokens.json`.
- Applies per-scene timing of 5, 5, 6, 6, 5, and 5 seconds.
- Produces a default 32-second video.
- Validates structure, logo path, contrast, density, safe zones, and typography before rendering.

## Design System

Shared rules live in:

- `design_tokens.json`
- `presets/production.json`
- `presets/debug.json`
- `validation/readability.mjs`

Minimum font sizes:

- Headline: 72px
- Secondary text: 40px
- Supporting text: 30px
- CTA: 42px
- Disclaimer: 22px

Content limits:

- Maximum two text blocks per scene
- Maximum 12 headline words
- Maximum 18 support words
- One main idea per scene

## Render One Video

Production mode:

```bash
node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json
```

Production dry run without FFmpeg:

```bash
node video_engine/render.mjs --input pilot_launch/rule_of_72/production_package.json --out publish_ready/rule_of_72 --mode production --dry-run
```

Debug mode:

```bash
node video_engine/render.mjs --input pilot_launch/rule_of_72/production_package.json --mode debug --dry-run
```

Debug mode may display scene numbers and safe boundaries. Never use debug output for publishing.

## Batch Rendering

Pilot launch:

```bash
node video_engine/render_batch.mjs --source pilot_launch --out-root publish_ready --mode production
```

Weekly production:

```bash
node video_engine/render_batch.mjs --source production/week_01 --out-root publish_ready --mode production
```

## Output

Each output folder contains:

- `video.mp4`
- `thumbnail.png`
- `caption.txt`
- `render_manifest.json`
- scene SVG and PNG files
- `preview.html`

The manifest records the preset, total duration, simplified scene copy, readability warnings, and design-token source.

## Validation

Rendering fails for:

- Incorrect logo path
- Missing or duplicate scenes
- Unsupported categories
- Empty required scene text
- Font sizes below minimums
- Insufficient contrast
- Unsafe margins
- More than two text blocks
- Production mode configured to show scene numbers

Long source copy is simplified before layout. Density near the comfortable reading limit produces a console warning.

## GitHub Rendering

GitHub Actions installs FFmpeg and renders into `/publish_ready`.

- **Render Single Video** renders one package.
- **Render Batch Videos** renders pilot, weekly, or topic folders.

Both workflows default to production mode and upload rendered files as downloadable artifacts.

No social media or Canva APIs are connected.
