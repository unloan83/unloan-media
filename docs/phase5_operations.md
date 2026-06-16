# Phase 5 Operations Workflow

Phase 5 adds a local content operations layer for planning, approval control, scheduling readiness, analytics tracking, and reporting.

Run from the repository root:

```bash
node automation/phase5_ops.mjs
```

This command writes local files only. It does not authenticate with Instagram, YouTube, Meta, Google, Canva, or any external service.

## Outputs

- `data/processed/schedule.csv` - platform-level schedule with date, time, timezone, content type, package, status, and duplicate key.
- `data/processed/approval_queue.csv` - items that cannot publish because they are not approved.
- `data/processed/publisher_payload_previews.json` - safe payload previews for future connectors.
- `data/raw/manual_metrics.csv` - manual analytics import template.
- `data/processed/performance_scores.csv` - local scoring output from imported metrics.
- `data/reports/dashboard.json` - local dashboard data.
- `data/reports/weekly_report.md` - weekly report summary.
- `data/reports/alerts.json` - local alerts.
- `logs/automation_log.jsonl` - automation audit trail.

## Approval Gate

Content must move through:

1. Draft
2. Ready
3. Approved
4. Published

Phase 5 treats only `Approved` items as publish-eligible. The publisher connectors still do not publish; they only validate readiness and generate local payload previews.

## Security

- Do not commit API keys, tokens, or credentials.
- Use environment variables or GitHub Secrets in a future integration phase.
- Keep `config.yaml` values as placeholders only.
- Do not enable live publishing without explicit approval and a separate implementation phase.
