# Content Optimization

Phase 3 adds a repository-only content operations layer.

## Weekly Planner

The planner reads `content_calendar/master_calendar.csv` and writes balanced weekly schedules to:

```text
content/weekly_plans
```

The schedule rotates categories so each week covers a mix of wealth building, stock market basics, trading basics, platform education, investor terminology, and behavioral finance.

## Hook Generator

Reusable hooks are written to:

```text
content/hooks/reusable_hooks.md
```

Each topic receives 8 educational hooks. Hooks should create curiosity without hype, profit claims, or stock recommendations.

## Thumbnail Title Generator

Thumbnail title options are written to:

```text
content/hooks/thumbnail_titles.md
```

Titles should be clear and useful. Avoid clickbait, fear, urgency manipulation, and return promises.

## CTA Library

Reusable calls to action are written to:

```text
content/ctas/cta_library.md
```

CTAs should invite saving, sharing, commenting, following, or reviewing educational content.

## Recommendation Engine

Future topic recommendations are written to:

```text
content/recommendations/future_topics.md
```

Recommendations are based on category performance and should only guide future educational planning. They must not become investment advice or publishing automation.

## Repository-Only Rule

Do not connect to external APIs. Do not publish content. Do not authenticate with Instagram, YouTube, Google, Meta, or any third-party publishing tool.
