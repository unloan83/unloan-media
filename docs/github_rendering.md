# GitHub Rendering

UNLOAN video rendering can run entirely inside GitHub Actions, so local machines do not need FFmpeg installed.

Rendered files are staged in `/publish_ready` during the workflow and uploaded as GitHub Action artifacts.

## Render One Video

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Select **Render Single Video**.
4. Click **Run workflow**.
5. Enter a `production_package.json` path, for example:

```text
production/topics/2026-01-06-02-rule-of-72/production_package.json
```

6. Optionally set `output_name`, `fps`, and render `mode`.
7. Run the workflow.

The workflow will:

- Check out the repository.
- Install Node.js.
- Install FFmpeg.
- Validate the production package.
- Apply the production readability preset by default.
- Render `video.mp4`, `thumbnail.png`, and `caption.txt`.
- Upload the output folder as an artifact.

## Download Artifacts

1. Open the completed workflow run.
2. Scroll to **Artifacts**.
3. Download the artifact named like:

```text
unloan-render-single_render
```

4. Unzip it locally. The folder contains:

- `video.mp4`
- `thumbnail.png`
- `caption.txt`
- `render_manifest.json`
- scene PNG/SVG files
- `preview.html`

## Render Pilot Launch Packages

Use the batch workflow:

1. Go to **Actions**.
2. Select **Render Batch Videos**.
3. Click **Run workflow**.
4. Keep `source_dir` as:

```text
pilot_launch
```

5. Leave `limit` blank to render all pilot launch packages.
6. Keep `mode` set to `production`.
7. Run the workflow.

The downloadable artifact will contain one folder per package under `/publish_ready`, including all MP4s, thumbnails, captions, and manifests.

## Render Another Batch

Set `source_dir` to any folder that contains nested `production_package.json` files, such as:

```text
production/week_01
production/week_02
production/topics
```

Use `limit` for a smaller test run.

## Validation Rules

Rendering fails if:

- `logo` is not exactly `assets/logos/logo.png`.
- The package category is not supported.
- Any required scene is missing.
- A required scene has no text.
- The official logo asset is missing.
- FFmpeg cannot render the video.

Supported categories:

- Wealth Building
- Trading Basics
- Investor Toolkit
- Investor Terminology
- Behavioral Finance

## Troubleshooting

### Workflow Fails With Logo Error

Check the package:

```json
"logo": "assets/logos/logo.png"
```

Do not use `assets/logo.png` or any alternate logo path.

### Workflow Fails With Missing Scene

Open the package and confirm `slides` includes scenes `1` through `6` with text:

- Scene 1: Hook
- Scene 2: Problem
- Scene 3: Explanation
- Scene 4: Example
- Scene 5: Takeaway
- Scene 6: CTA + Logo

### Artifact Is Missing

Open the workflow logs and check the **Verify rendered outputs** step. The workflow requires:

- `video.mp4`
- `thumbnail.png`
- `caption.txt`

### Batch Render Is Too Large

Run the batch workflow again with a `limit`, or render weekly folders separately:

```text
production/week_01
production/week_02
```

### Local FFmpeg Is Still Missing

That is expected. GitHub installs FFmpeg inside the workflow, so local FFmpeg is not required for GitHub rendering.
