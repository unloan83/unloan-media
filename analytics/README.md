# Analytics Tracking

This folder prepares UNLOAN Media for manual performance tracking.

No external analytics API is connected in this version.

Use `tracking_template.csv` to track:

- Views
- Likes
- Comments
- Shares
- Saves
- Subscribers
- Followers

Add one row per published content asset after manual review and posting outside this repository workflow.

Run Phase 3 operations with:

```bash
node automation/content_ops.mjs
```

Generated analytics outputs:

- `topic_scores.csv`
- `category_performance.csv`
