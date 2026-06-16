# UNLOAN Media

Mission:
Build Wealth. Not Debt.

Target Audience:
Beginner investors and young wealth builders

Platforms:

* Instagram (@live.unloan)
* YouTube (@live.unloan)

Content Categories:

1. Wealth Building
2. Stock Market Basics
3. Trading Basics
4. Trading Platform Features
5. Investor Terminology
6. Behavioral Finance

Publishing Frequency:

* 2 Reels daily
* 2 Shorts daily
* 1 Long-form video weekly

Primary Objective:
Build a scalable audience and monetize through education, sponsorships, memberships, and premium financial products.

## Content Engine

This repo includes a CSV-driven content engine for generating UNLOAN Media beginner investor education drafts.

Run from the repository root:

```bash
node automation/content_engine.mjs
```

The engine reads `content_calendar/master_calendar.csv` and writes drafts to:

* `content/reels`
* `content/shorts`
* `content/captions`
* `content/thumbnails`

Reusable prompt templates live in `templates/prompts`.

Workflow documentation:

* `docs/content_engine_workflow.md`
* `docs/content_categories.md`
* `docs/content_workflow.md`
* `docs/compliance_rules.md`

Analytics preparation lives in `analytics/tracking_template.csv`.

Phase 3 operations:

```bash
node automation/content_ops.mjs
```

This creates weekly plans, reusable hooks, thumbnail title options, CTA libraries,
topic scores, category performance summaries, and future-topic recommendations.

Phase 4 packaging:

```bash
node automation/package_engine.mjs
```

This creates visual briefs, Canva-ready specs, topic metadata, publishing
readiness tracking, and weekly production packages.

Use `assets/logo.svg` as the default UNLOAN logo for all branding and content packages.

Publishing integrations are intentionally excluded. Do not connect to,
authenticate with, or modify Instagram, Meta Business Suite, Facebook, YouTube,
Google APIs, Canva APIs, or third-party publishing tools from this version of the repo.
