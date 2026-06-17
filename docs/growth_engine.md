# Growth Engine

Phase 6 adds a local Growth Intelligence System for improving UNLOAN Media content strategy using structured performance, trend, competitor, and gap signals.

Run from the repository root:

```bash
node automation/phase6_growth.mjs
```

## What It Creates

- `market_intelligence/competitors.csv`
- `market_intelligence/competitor_summary.csv`
- `market_intelligence/trending_topics.csv`
- `data/growth/content_gap_analysis.csv`
- `data/growth/ab_tests.csv`
- `data/growth/growth_scores.csv`
- `data/reports/monetization_dashboard.json`
- `data/reports/weekly_growth_recommendations.md`
- `data/reports/monthly_strategy_report.md`

## Growth Scoring

Each topic receives scores for:

- Virality
- Searchability
- Evergreen value
- Monetization potential

Scores are planning signals only. They do not create buy/sell recommendations, profit claims, or automated engagement.

## Content Gap Analysis

The engine maps existing topics into five growth categories:

- Wealth Building
- Trading Basics
- Investor Toolkit
- Market Vocabulary
- Behavioral Finance

Underrepresented categories are flagged with future educational topic ideas.

## A/B Testing

The system creates draft variants for:

- Hooks
- Thumbnail titles
- CTAs

Winning metrics should be saves, shares, retention, watch time, and engagement quality.

## Boundaries

- Do not automate engagement.
- Do not automate comments.
- Do not generate stock recommendations.
- Do not copy competitor content.
- Use competitor and trend data as planning signals only.
