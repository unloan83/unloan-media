# Video Readability Rules

## Density Limits

- Maximum key-message length: 8 words
- Maximum support length: 14 words
- Maximum total length: 20 words
- Maximum text blocks: 2
- Preferred line length: 3-7 words
- Maximum main ideas per scene: 1

The renderer extracts a concise key message and support statement from long source copy. The full educational copy remains available in `caption.txt`.

## Validation Severity

Hard failures:

- Font size below minimum
- Incorrect logo path
- Missing, empty, or duplicate scene
- Unsupported category
- Insufficient text contrast
- Unsafe canvas margins
- More than two text blocks
- Visible scene numbers in production mode

Warnings:

- Simplified scene copy is near the comfortable reading limit for its duration
- Optional compliance metadata is missing and the default must be applied

## Auto-Fit Policy

1. Normalize text and encoding.
2. Select one key message of no more than 8 words.
3. Select one support statement of no more than 14 words.
4. Wrap text using short mobile-readable lines.
5. Preserve minimum font sizes.
6. Discard excess on-screen detail rather than shrinking text.
7. Preserve the full source meaning in the caption and source package.

## Safe Zones

All production content remains inside the configured mobile-safe margins:

- Horizontal: 90px minimum
- Top: 120px minimum
- Bottom: 120px minimum

Logo placement uses `preserveAspectRatio` and never crops the official asset.
