# Content Workflow

The content engine reads `content_calendar/master_calendar.csv` and generates reviewable Markdown content assets.

## Calendar Schema

Required columns:

- `Date`
- `Topic`
- `Category`
- `Difficulty`
- `Platform`
- `Status`

Supported values:

- Difficulty: `Beginner`, `Intermediate`, `Advanced`
- Platform: `Instagram`, `YouTube`, `Both`
- Status: recommended values are `Planned`, `Drafted`, `Reviewed`, `Approved`, `Published`

Optional columns:

- `Angle`
- `Audience`
- `CTA`

## Generate Content

From the repository root:

```bash
node automation/content_engine.mjs
```

Dry run without writing files:

```bash
node automation/content_engine.mjs --dry-run
```

Use a different CSV:

```bash
node automation/content_engine.mjs --calendar path/to/calendar.csv
```

## Outputs

The engine creates one file per topic in each output folder:

- `content/reels`
- `content/shorts`
- `content/captions`
- `content/thumbnails`

Each generated asset includes metadata, a deterministic first draft, a call to action, compliance-safe disclaimer text, and reusable prompt material where relevant.

## Repository-Only Boundary

Do not connect to, authenticate with, or modify any external service, including Instagram, Meta Business Suite, Facebook, YouTube, Google APIs, or third-party publishing tools.

All work in this version remains inside repository files.
