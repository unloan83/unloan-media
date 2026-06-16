# Topic Scoring

The topic scoring system classifies content into:

- High Growth
- Medium Growth
- Low Growth

## Inputs

The scoring model uses:

- Views
- Likes
- Comments
- Shares
- Saves
- Followers

## Score Logic

The operations engine uses weighted engagement:

```text
likes + comments*2 + shares*3 + saves*4 + followers*5
```

It also calculates engagement rate:

```text
weighted engagement / views
```

Growth bands:

- High Growth: score >= 80 or engagement rate >= 8%
- Medium Growth: score >= 30 or engagement rate >= 3%
- Low Growth: below medium threshold

## Why Saves And Shares Matter

UNLOAN Media is educational. Saves and shares often signal that a topic is useful, understandable, and worth revisiting. They are weighted higher than likes.

## Compliance Boundary

A high score does not make a topic a recommendation. It only means the educational content format performed well.
