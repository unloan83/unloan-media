# UNLOAN Media

Mission:
Build Wealth. Not Debt.

Target Audience:
Young investors (20–35 years)

Platforms:

* Instagram (@live.unloan)
* YouTube (@live.unloan)

Content Pillars:

1. Wealth Building
2. Investing Fundamentals
3. Behavioural Finance
4. Financial Freedom
5. UNLOAN Wealth Blueprint

Publishing Frequency:

* 2 Reels daily
* 2 Shorts daily
* 1 Long-form video weekly

Primary Objective:
Build a scalable audience and monetize through education, sponsorships, memberships, and premium financial products.

## Content Engine

This repo includes an initial CSV-driven content engine for generating UNLOAN Media short-form drafts.

Run from the repository root:

```bash
node automation/content_engine.mjs
```

The engine reads `content_calendar/master_calendar.csv` and writes drafts to:

* `content/reels`
* `content/shorts`
* `content/captions`

Reusable prompt templates live in `templates/prompts`.

Workflow documentation: `docs/content_engine_workflow.md`

Publishing integrations are intentionally excluded. Do not connect to,
authenticate with, or modify Instagram, Meta Business Suite, Facebook, YouTube,
Google APIs, or third-party publishing tools from this version of the repo.
