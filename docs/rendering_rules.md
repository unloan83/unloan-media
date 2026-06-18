# Video Rendering Rules

## Scene Order

1. Hook
2. Problem
3. Explanation
4. Example
5. Takeaway
6. CTA + Logo

## Default Timing

| Scene | Duration |
| --- | --- |
| Hook | 5 seconds |
| Problem | 5 seconds |
| Explanation | 6 seconds |
| Example | 6 seconds |
| Takeaway | 5 seconds |
| CTA + Logo | 5 seconds |

Default total duration is 32 seconds.

## Production Rules

- Production is the default render mode.
- Scene numbers are hidden.
- Source paragraphs are converted into a key message and supporting message before layout.
- Text is never reduced below the configured minimum sizes.
- Every scene communicates one primary idea.
- Key messages contain no more than 8 words.
- Support messages contain no more than 14 words.
- Total scene text contains no more than 20 words.
- Every scene contains at most two primary text blocks.
- The official logo path must be exactly `assets/logos/logo.png`.
- The standard financial-education disclaimer appears on the final CTA scene.
- The output remains educational and avoids recommendations, guarantees, or profit claims.

## Render Commands

Single:

```bash
node video_engine/render.mjs --input <package-path> --mode production
```

Batch:

```bash
node video_engine/render_batch.mjs --source <package-folder> --out-root publish_ready --mode production
```

Use `--dry-run` to generate SVG previews, captions, and manifests without FFmpeg.
