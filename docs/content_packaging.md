# Content Packaging

Phase 4 turns generated content into weekly production-ready packages.

## Package Engine

Run from the repository root:

```bash
node automation/package_engine.mjs
```

Dry run:

```bash
node automation/package_engine.mjs --dry-run
```

## Generated Outputs

- `content/visual_briefs`
- `content/canva_packages`
- `content/metadata`
- `content/weekly_packages`
- `content/publishing_status.csv`

## Weekly Package Contents

Each topic package contains:

- `scripts.md`
- `caption_and_hashtags.md`
- `hooks.md`
- `thumbnail_titles.md`
- `visual_brief.md`
- `canva_package.md`
- `metadata.json`

Each weekly folder also includes:

- `manifest.json`

## Publishing Readiness Workflow

Allowed statuses:

- Draft
- Ready
- Approved
- Published

Phase 4 creates all packages as `Draft`. A human editor should move content through readiness states after review.

## Repository-Only Boundary

Do not connect to Instagram, YouTube, Canva APIs, Meta APIs, Google APIs, or external services.

This workflow prepares files only. It does not publish, schedule, authenticate, or upload content.
