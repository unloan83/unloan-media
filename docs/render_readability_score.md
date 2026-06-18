# Render Readability Score

The UNLOAN Render Readability Score measures whether a production render is suitable for mobile viewing before video export.

## Score

Each render receives a score from 0 to 100.

| Area | Points |
| --- | ---: |
| Text hierarchy | 25 |
| Content density | 25 |
| Typography | 15 |
| Layout and safe zones | 15 |
| Pacing | 10 |
| Brand and compliance | 10 |

Production approval requires:

- Score of 90 or higher
- No hard validation failures
- Official logo path exactly `assets/logos/logo.png`

## Text Hierarchy: 25 Points

- Key message is visually dominant: 10
- Key message contains 3-6 words: 5
- Support message contains 6-12 words: 5
- Key and support messages communicate one idea: 5

Hard limit:

- Key message must not exceed 8 words.
- Support message must not exceed 14 words.

## Content Density: 25 Points

- Total scene text contains 10-16 words: 10
- No more than two text groups: 5
- Key message uses no more than two lines: 5
- Support message uses no more than two lines: 5

Hard limit:

- Total scene text must not exceed 20 words.
- Paragraph-style scene copy is not permitted.

## Typography: 15 Points

- Key message is at least 78px: 6
- Support message is at least 34px: 4
- CTA is at least 40px: 2
- Disclaimer is at least 20px: 1
- Key font is at least 1.75 times the support font: 2

## Layout And Safe Zones: 15 Points

- Consistent left alignment: 4
- Horizontal safe margin is preserved: 3
- Top and bottom safe margins are preserved: 3
- Text layers do not overlap: 3
- Production output contains no scene or category labels: 2

## Pacing: 10 Points

- Scene duration supports comfortable reading: 5
- Default 5/5/6/6/5/5-second pacing is preserved: 3
- Total duration remains approximately 30-35 seconds: 2

## Brand And Compliance: 10 Points

- Official logo asset is used without modification: 4
- Tagline is correct: 2
- Educational disclaimer is present: 2
- No recommendations, guarantees, or profit claims: 2

## Rating Bands

| Score | Status |
| --- | --- |
| 90-100 | Production Ready |
| 80-89 | Review Required |
| 70-79 | Revise Before Rendering |
| Below 70 | Rejected |

Any hard validation failure overrides the numeric score and rejects the render.

## Current Production Gates

The rendering engine automatically enforces:

- Maximum 8 key-message words
- Maximum 14 support-message words
- Maximum 20 total words
- Maximum two lines per text layer
- Minimum font sizes
- Visual dominance ratio
- Consistent alignment
- Safe-zone boundaries
- Correct logo path
- Six required scenes
- No visible scene numbers in production mode

The score complements these hard gates by providing a consistent quality benchmark for future render automation and reporting.

## Automated Reports

Every render creates:

- `readability_report.json`
- `readability_report.md`

Reports include the overall score, rating band, production status, category scores, failed checks, hard failures, warnings, recommended fixes, and scene metrics.

Production mode returns **Production Ready** only when the score is at least 90 and there are no hard failures. A lower score still permits preview and media generation, but the status becomes **Not Production Ready**.

Debug mode always reports **Preview Only**, regardless of numeric score.

## Batch Reports

Batch rendering creates:

- `batch_summary.json`
- `batch_summary.md`

The summary contains total videos, production-ready and not-ready counts, preview-only count, average score, lowest score, failed topics, common failure reasons, and individual report paths.

## Hard-Failure Overrides

Hard failures include:

- Scene or category labels visible in production
- Incorrect official logo path
- Key-message font below minimum
- Absolute key, support, or total word limits exceeded
- Text density beyond readable pacing
- Stock recommendations
- Guaranteed-return or profit claims
- Missing disclaimer
- Text outside safe zones or overlapping branding
