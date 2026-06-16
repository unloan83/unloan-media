# UNLOAN Media Content Engine Workflow

The initial content engine turns planned content topics into reviewable short-form content drafts.

It currently generates:

- Instagram Reel scripts in `content/reels`
- YouTube Short scripts in `content/shorts`
- Captions with hashtags in `content/captions`

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

Required column:

- `topic`

Recommended columns:

- `date`
- `pillar`
- `angle`
- `audience`
- `cta`

The engine also accepts common aliases such as `publish_date`, `content_pillar`, `title`, `audience_segment`, and `call_to_action`.

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

For each usable calendar row, the engine writes three Markdown files:

```text
content/reels/{date}-{row-number}-{topic}.md
content/shorts/{date}-{row-number}-{topic}.md
content/captions/{date}-{row-number}-{topic}.md
```

Each file includes:

- Calendar metadata
- A first-pass deterministic draft
- The reusable prompt used for higher-quality AI-assisted generation

The deterministic draft is meant to make the pipeline useful immediately. Editors can keep it, rewrite it, or paste the included prompt into an AI writing workflow.

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

Supported placeholders:

- `{{date}}`
- `{{pillar}}`
- `{{topic}}`
- `{{angle}}`
- `{{audience}}`
- `{{cta}}`

## Editorial Guardrails

UNLOAN content should stay aligned with:

- Mission: Build Wealth. Not Debt.
- Audience: young investors aged 20 to 35.
- Tone: practical, calm, direct, and educational.
- Compliance posture: no guaranteed returns, no stock tips, no exaggerated claims, and no personalized financial advice.

## Future Extensions

Good next additions:

- AI provider adapter that consumes the prompt templates.
- Editorial review status fields in the calendar.
- Batch quality checks for missing CTAs, missing disclaimers, or overly long scripts.
- Platform-specific export formats.

Do not add scheduling or publishing APIs until the content generation workflow is stable.
