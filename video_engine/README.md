# UNLOAN Automated Video Rendering Engine

The engine converts `production_package.json` files into 1080x1920 videos for Instagram Reels and YouTube Shorts.

Production mode is the default for single, batch, pilot, weekly, local, and GitHub Actions rendering.

## Default Production Behavior

- Uses the original `assets/logos/logo.png` asset only.
- Hides scene numbers and debug boundaries.
- Converts long source text into one dominant key phrase and one support statement.
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
- `validation/readability_score.mjs`
- `utils/text_hierarchy.mjs`

Minimum font sizes:

- Key message: 78px minimum, 94px preferred
- Supporting message: 34px minimum, 42px preferred
- CTA: 40px
- Disclaimer: 20px

Content limits:

- Maximum two text blocks per scene
- Maximum 8 key-message words
- Maximum 14 support words
- Maximum 20 total words
- Maximum two lines per layer
- One main idea per scene

Production alignment is consistently left aligned. Category and scene labels are hidden, and footer branding is reserved for the final CTA scene.

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

Batch output also includes `batch_summary.json` and `batch_summary.md`.

## Output

Each output folder contains:

- `video.mp4`
- `thumbnail.png`
- `caption.txt`
- `readability_report.json`
- `readability_report.md`
- `render_manifest.json`
- scene SVG and PNG files
- `preview.html`

The manifest records the preset, total duration, production status, readability score, simplified scene copy, warnings, and design-token source.

## Readability Scoring

Every render receives a score from 0 to 100:

- Text hierarchy: 25 points
- Content density: 25 points
- Typography: 15 points
- Layout and safe zones: 15 points
- Pacing: 10 points
- Brand and compliance: 10 points

Production requires at least 90 points and no hard failures.

- Passing production render: `Production Ready`
- Production render below 90 or with a hard failure: `Not Production Ready`
- Debug render: `Preview Only`

Hard failures override the score. They include incorrect logo usage, missing disclaimers, stock recommendations, guaranteed-profit claims, unsafe text placement, visible production diagnostics, undersized key text, and absolute density-limit violations.

Not-ready renders still generate preview output and score reports. The console and reports show failed categories and recommended fixes.

## Validation

Malformed packages still stop rendering when required scenes, categories, or scene text are missing.

Quality failures still generate preview and report output, but mark the render Not Production Ready:

- Incorrect logo path
- Font sizes below minimums
- Unsafe margins or overlap
- More than two text blocks
- Absolute word-limit violations
- Visible production diagnostics
- Missing disclaimer
- Stock recommendations
- Guaranteed-return or profit claims

The report records all scoring deductions and hard-failure overrides.

## GitHub Rendering

GitHub Actions installs FFmpeg and renders into `/publish_ready`.

- **Render Single Video** renders one package.
- **Render Batch Videos** renders pilot, weekly, or topic folders.

Both workflows default to production mode and upload rendered files as downloadable artifacts.

No social media or Canva APIs are connected.
