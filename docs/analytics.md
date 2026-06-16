# Analytics

UNLOAN Media analytics are file-based in this phase.

No external analytics API is connected. Do not authenticate with Instagram, YouTube, Google, Meta, or third-party tools.

## Tracking Source

Manual performance data lives in:

```text
analytics/tracking_template.csv
```

Tracked fields:

- Views
- Likes
- Comments
- Shares
- Saves
- Followers

The Phase 3 operations engine reads the tracking CSV and writes:

```text
analytics/topic_scores.csv
analytics/category_performance.csv
```

## Run Analytics

From the repository root:

```bash
node automation/content_ops.mjs
```

Dry run:

```bash
node automation/content_ops.mjs --dry-run
```

## Performance Interpretation

Views show reach. Likes show light approval. Comments show discussion. Shares and saves are stronger signals because they indicate usefulness. Followers show audience conversion.

The scoring model weights deeper intent more heavily than simple views.
