# Performance Dashboard

Phase 5 prepares local performance tracking and reporting.

## Manual Metrics

Add platform performance data to:

```text
data/raw/manual_metrics.csv
```

Tracked fields include:

- Views
- Likes
- Comments
- Shares
- Saves
- Reach
- Watch time
- Followers or subscribers

## Scoring

`automation/analytics/collector.mjs` calculates a weighted score using engagement, saves, shares, followers, reach, and watch time.

Growth bands:

- High Growth
- Medium Growth
- Low Growth

## Reports

Generated report files:

- `data/processed/performance_scores.csv`
- `data/reports/dashboard.json`
- `data/reports/category_summary.csv`
- `data/reports/weekly_report.md`
- `data/reports/alerts.json`

These files are local reporting artifacts. They do not collect data from external APIs.
