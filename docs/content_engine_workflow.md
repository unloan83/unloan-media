# UNLOAN Media Content Engine Workflow

The content engine turns planned beginner-investor education topics into reviewable short-form content drafts.

It generates:

- Instagram Reel scripts in `content/reels`
- YouTube Short scripts in `content/shorts`
- Captions with hashtags and calls to action in `content/captions`
- Thumbnail titles and visual direction in `content/thumbnails`

Publishing APIs are intentionally out of scope for this version.

Do not connect to, authenticate with, or modify any external service, including
Instagram, Meta Business Suite, Facebook, YouTube, Google APIs, or third-party
publishing tools. All work in this version must stay limited to files and code
within this repository.

## Source Calendar

The engine reads:

```text
content_calendar/master_calendar.csv
```

Calendar columns:

- `Date`
- `Topic`
- `Category`
- `Difficulty`
- `Platform`
- `Status`
- `Angle`
- `Audience`
- `CTA`

The engine also accepts older aliases such as `pillar`, `content_pillar`, `title`, `audience_segment`, and `call_to_action`.

## Generate Content

From the repository root, run:

```bash
node automation/content_engine.mjs
```

To validate the calendar without writing files:

```bash
node automation/content_engine.mjs --dry-run
```

To use a different CSV:

```bash
node automation/content_engine.mjs --calendar path/to/calendar.csv
```

## Output Structure

For each usable calendar row, the engine writes four Markdown files:

```text
content/reels/{date}-{row-number}-{topic}.md
content/shorts/{date}-{row-number}-{topic}.md
content/captions/{date}-{row-number}-{topic}.md
content/thumbnails/{date}-{row-number}-{topic}.md
```

Each file includes:

- Calendar metadata
- Beginner-friendly draft content
- Call to action
- Compliance-safe disclaimer where applicable
- Reusable prompt material

## Prompt Templates

Reusable prompt templates live in:

```text
templates/prompts
```

Current templates:

- `reel_script.md`
- `youtube_short_script.md`
- `caption.md`
- `hashtags.md`
- `thumbnail_title.md`

Supported placeholders:

- `{{date}}`
- `{{category}}`
- `{{topic}}`
- `{{difficulty}}`
- `{{platform}}`
- `{{status}}`
- `{{angle}}`
- `{{audience}}`
- `{{cta}}`
- `{{disclaimer}}`

## Editorial Guardrails

UNLOAN content should stay aligned with:

- Mission: Build Wealth. Not Debt.
- Audience: beginner investors and young wealth builders.
- Tone: simple, practical, calm, direct, and educational.
- Compliance posture: no guaranteed returns, no stock tips, no profit claims, no buy/sell recommendations, and no personalized financial advice.

## Future Extensions

Good next additions:

- Editorial review status fields and owner assignment.
- Batch quality checks for missing CTAs, missing disclaimers, or overly long scripts.
- Manual analytics summaries from `analytics/tracking_template.csv`.

Do not add scheduling or publishing APIs until the content generation workflow is stable.
