# Visual Briefing

Phase 4 visual briefs convert generated scripts into scene-by-scene production instructions.

Run:

```bash
node automation/package_engine.mjs
```

Dry run:

```bash
node automation/package_engine.mjs --dry-run
```

Visual briefs are written to:

```text
content/visual_briefs
```

## Supported Visual Systems

- Wealth Building
- Trading Basics
- Investor Toolkit
- Behavioral Finance
- Market Vocabulary

## Brief Structure

Each visual brief includes:

- Visual system
- Required logo asset: `assets/logo.svg`
- Mood
- Color use
- Primary icon language
- Scene-by-scene direction
- On-screen text
- Production notes
- Compliance notes

## Production Rules

- Keep visuals mobile-first.
- Use one concept per scene.
- Avoid broker screenshots, profit screenshots, stock logos, and platform endorsement signals.
- Include the educational disclaimer in readable text.
- Do not connect to external services or publishing tools.
