# Scheduling Workflow

The scheduler reads `content/publishing_status.csv` and creates platform-level schedule files in `data/processed`.

## Schedule Rules

- Timezone: `Asia/Kolkata`
- Default slots: `09:00` and `18:30`
- Instagram content type: Reel
- YouTube content type: Short
- Platform `Both` creates one Instagram item and one YouTube item.
- Duplicate scheduling is prevented with `Date + Package + Platform`.

## Approval Rules

Only packages with status `Approved` are marked `PublishEligible = Yes`.

Statuses:

- Draft
- Ready
- Approved
- Published

The current Phase 5 implementation creates schedules and approval queues only. It does not publish or schedule posts on any platform.
