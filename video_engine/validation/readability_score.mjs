import { BRAND, OFFICIAL_LOGO, SCENE_PLAN } from "../config.mjs";

export const PRODUCTION_THRESHOLD = 90;

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/u).filter(Boolean).length;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function includesRecommendation(text) {
  return /\b(?:we\s+recommend|strong\s+buy|stock\s+pick|buy\s+(?:this|now|today|the\s+stock|these?\s+shares?)|sell\s+(?:this|now|today|the\s+stock|these?\s+shares?))\b/iu.test(text);
}

function includesGuarantee(text) {
  return /\b(?:guaranteed?\s+(?:returns?|profits?|income)|assured\s+(?:returns?|profits?)|risk[- ]free\s+returns?|cannot\s+lose|sure[- ]shot\s+profit)\b/iu.test(text);
}

function check(id, label, passed, points, fix, hardFailure = false) {
  return { id, label, passed, points: passed ? points : 0, maxPoints: points, fix, hardFailure };
}

function proportionalCheck(id, label, matches, total, points, fix) {
  const awarded = total > 0 ? Math.round((matches / total) * points * 10) / 10 : 0;
  return { id, label, passed: matches === total, points: awarded, maxPoints: points, fix, hardFailure: false };
}

function ratingBand(score) {
  if (score >= 90) return "Production Ready";
  if (score >= 80) return "Review Required";
  if (score >= 70) return "Revise Before Rendering";
  return "Rejected";
}

export function calculateReadabilityScore({ pkg, scenes, tokens, preset, validation }) {
  const density = tokens.density;
  const type = tokens.typography;
  const layout = tokens.layout;
  const sceneCount = scenes.length;
  const allText = [
    pkg.topic,
    pkg.hook,
    pkg.cta,
    ...scenes.flatMap((scene) => [scene.originalText, scene.keyMessage, scene.supportMessage]),
  ].join(" ");

  const keyPreferred = scenes.filter((scene) => {
    const count = wordCount(scene.keyMessage);
    return count >= density.headline_preferred_min_words && count <= density.headline_preferred_max_words;
  }).length;
  const supportPreferred = scenes.filter((scene) => {
    const count = wordCount(scene.supportMessage);
    return count >= density.support_preferred_min_words && count <= density.support_preferred_max_words;
  }).length;
  const totalPreferred = scenes.filter((scene) => {
    const count = wordCount(scene.keyMessage) + wordCount(scene.supportMessage);
    return count >= density.total_preferred_min_words && count <= density.total_preferred_max_words;
  }).length;
  const twoBlocks = scenes.filter((scene) => [scene.keyMessage, scene.supportMessage].filter(Boolean).length <= density.max_text_blocks).length;
  const keyLinesValid = scenes.filter((scene) => Math.ceil(wordCount(scene.keyMessage) / density.headline_words_per_line) <= density.headline_max_lines).length;
  const supportLinesValid = scenes.filter((scene) => Math.ceil(wordCount(scene.supportMessage) / density.support_words_per_line) <= density.support_max_lines).length;
  const readablePacing = scenes.filter((scene) => wordCount(scene.keyMessage) + wordCount(scene.supportMessage) <= scene.duration * 4).length;
  const defaultTiming = scenes.every((scene) => scene.duration === SCENE_PLAN.find((plan) => plan.scene === scene.scene)?.duration);
  const totalDuration = scenes.reduce((total, scene) => total + Number(scene.duration), 0);
  const hierarchyDominant = type.headline_preferred >= type.secondary_preferred * 1.75;
  const safeMargins =
    layout.key_x >= tokens.canvas.safe_margin_x &&
    layout.key_y >= tokens.canvas.safe_margin_top &&
    layout.panel_x >= 0 &&
    layout.panel_y >= 0 &&
    layout.panel_x + layout.panel_width <= tokens.canvas.width &&
    layout.panel_y + layout.panel_height <= tokens.canvas.height;
  const maximumSupportBottom =
    layout.key_y +
    density.headline_max_lines * layout.key_line_gap +
    layout.support_gap +
    (density.support_max_lines - 1) * layout.support_line_gap +
    type.secondary_preferred;
  const noOverlap = maximumSupportBottom < tokens.canvas.height - tokens.canvas.safe_margin_bottom - 280;
  const productionLabelsHidden = preset.name !== "production" || (!preset.show_scene_numbers && !preset.show_category_label);
  const disclaimerPresent = Boolean(String(pkg.compliance?.disclaimer ?? "").trim());
  const recommendationFree = !includesRecommendation(allText);
  const guaranteeFree = !includesGuarantee(allText);

  const categoryChecks = {
    textHierarchy: [
      check("hierarchy_dominance", "Key message is visually dominant", hierarchyDominant, 10, "Increase key-message size or reduce support-message size.", true),
      proportionalCheck("key_preferred_words", "Key messages use 3-6 words", keyPreferred, sceneCount, 5, "Shorten each key message to 3-6 memorable words."),
      proportionalCheck("support_preferred_words", "Support messages use 6-12 words", supportPreferred, sceneCount, 5, "Keep support statements between 6 and 12 words."),
      check("single_idea", "Each scene communicates one idea", scenes.every((scene) => wordCount(scene.keyMessage) <= density.headline_max_words && wordCount(scene.supportMessage) <= density.support_max_words), 5, "Remove secondary ideas from dense scenes."),
    ],
    contentDensity: [
      proportionalCheck("total_preferred_words", "Scene text uses 10-16 words", totalPreferred, sceneCount, 10, "Reduce or expand scene copy into the 10-16 word preferred range."),
      check("two_text_groups", "Scenes use no more than two text groups", twoBlocks === sceneCount, 5, "Limit scenes to one key message and one support message.", true),
      check("key_line_limit", "Key messages use no more than two lines", keyLinesValid === sceneCount, 5, "Shorten key messages or improve phrase wrapping.", true),
      check("support_line_limit", "Support messages use no more than two lines", supportLinesValid === sceneCount, 5, "Shorten support messages or improve phrase wrapping.", true),
    ],
    typography: [
      check("key_font_minimum", "Key-message font meets minimum", type.headline_preferred >= type.headline_min, 6, `Use at least ${type.headline_min}px for key messages.`, true),
      check("support_font_minimum", "Support font meets minimum", type.secondary_preferred >= type.secondary_min, 4, `Use at least ${type.secondary_min}px for support text.`),
      check("cta_font_minimum", "CTA font meets minimum", type.cta_preferred >= type.cta_min, 2, `Use at least ${type.cta_min}px for CTA text.`),
      check("disclaimer_font_minimum", "Disclaimer font meets minimum", type.disclaimer_preferred >= type.disclaimer_min, 1, `Use at least ${type.disclaimer_min}px for disclaimers.`),
      check("font_dominance_ratio", "Key font is at least 1.75x support font", hierarchyDominant, 2, "Increase the key/support font-size ratio.", true),
    ],
    layout: [
      check("alignment", "Alignment matches production tokens", preset.alignment === layout.alignment, 4, `Use consistent ${layout.alignment} alignment.`),
      check("horizontal_safe_zone", "Horizontal safe margin is preserved", layout.key_x >= tokens.canvas.safe_margin_x, 3, "Move text inside the horizontal safe margin.", true),
      check("canvas_safe_zones", "Top and bottom safe zones are preserved", safeMargins, 3, "Move content inside configured canvas safe zones.", true),
      check("no_overlap", "Text does not overlap branding safe zone", noOverlap, 3, "Increase spacing or shorten text to prevent overlap.", true),
      check("production_labels_hidden", "Production labels are hidden", productionLabelsHidden, 2, "Hide scene and category labels in production mode.", true),
    ],
    pacing: [
      check("readable_scene_duration", "Scene duration supports reading", readablePacing === sceneCount, 5, "Shorten text or increase scene duration."),
      check("default_scene_timing", "Default 5/5/6/6/5/5 pacing is used", defaultTiming, 3, "Restore the default scene timing."),
      check("target_total_duration", "Total duration is 30-35 seconds", totalDuration >= 30 && totalDuration <= 35, 2, "Keep total duration between 30 and 35 seconds."),
    ],
    brandCompliance: [
      check("official_logo", "Official logo path is exact", pkg.logo === OFFICIAL_LOGO, 4, `Set logo to ${OFFICIAL_LOGO}.`, true),
      check("tagline", "Brand tagline is correct", pkg.brand?.tagline === BRAND.tagline, 2, `Use the tagline "${BRAND.tagline}".`),
      check("disclaimer", "Educational disclaimer is present", disclaimerPresent, 2, "Add the standard educational disclaimer.", true),
      check("claims", "No recommendations or guaranteed-profit claims", recommendationFree && guaranteeFree, 2, "Remove stock recommendations and guaranteed-return or profit claims.", true),
    ],
  };

  const hardLimitFailures = [];
  for (const scene of scenes) {
    const keyWords = wordCount(scene.keyMessage);
    const supportWords = wordCount(scene.supportMessage);
    const totalWords = keyWords + supportWords;
    if (keyWords > density.headline_max_words) hardLimitFailures.push(`Scene ${scene.scene} key message exceeds ${density.headline_max_words} words.`);
    if (supportWords > density.support_max_words) hardLimitFailures.push(`Scene ${scene.scene} support message exceeds ${density.support_max_words} words.`);
    if (totalWords > density.total_max_words) hardLimitFailures.push(`Scene ${scene.scene} exceeds ${density.total_max_words} total words.`);
    if (totalWords > scene.duration * 4) hardLimitFailures.push(`Scene ${scene.scene} text is too dense for ${scene.duration} seconds.`);
  }
  if (!recommendationFree) hardLimitFailures.push("Content contains a stock recommendation.");
  if (!guaranteeFree) hardLimitFailures.push("Content contains a guaranteed-return or profit claim.");

  const categories = Object.fromEntries(
    Object.entries(categoryChecks).map(([key, checks]) => {
      const score = checks.reduce((total, item) => total + item.points, 0);
      const maxScore = checks.reduce((total, item) => total + item.maxPoints, 0);
      return [key, { score, maxScore, checks }];
    }),
  );
  const score = Math.round(Object.values(categories).reduce((total, category) => total + category.score, 0));
  const failedChecks = Object.values(categories).flatMap((category) => category.checks.filter((item) => !item.passed));
  const hardFailures = [
    ...failedChecks.filter((item) => item.hardFailure).map((item) => item.label),
    ...hardLimitFailures,
    ...(validation?.errors ?? []),
  ];
  const warnings = [...(validation?.warnings ?? [])];
  const mode = preset.name;
  const productionReady = mode === "production" && score >= PRODUCTION_THRESHOLD && hardFailures.length === 0;
  const status = mode === "production" ? (productionReady ? "Production Ready" : "Not Production Ready") : "Preview Only";

  return {
    version: 1,
    threshold: PRODUCTION_THRESHOLD,
    score,
    ratingBand: ratingBand(score),
    status,
    productionReady,
    mode,
    hardFailureOverride: hardFailures.length > 0,
    categories,
    failedChecks: failedChecks.map(({ id, label, points, maxPoints, fix, hardFailure }) => ({
      id,
      label,
      pointsLost: Math.round((maxPoints - points) * 10) / 10,
      fix,
      hardFailure,
    })),
    hardFailures: [...new Set(hardFailures)],
    warnings: [...new Set(warnings)],
    recommendedFixes: [...new Set(failedChecks.map((item) => item.fix).filter(Boolean))],
    metrics: {
      sceneCount,
      totalDurationSeconds: totalDuration,
      averageWordsPerScene: Math.round(average(scenes.map((scene) => wordCount(scene.keyMessage) + wordCount(scene.supportMessage))) * 10) / 10,
      preferredKeyScenes: keyPreferred,
      preferredSupportScenes: supportPreferred,
      preferredDensityScenes: totalPreferred,
    },
  };
}

export function readabilityReportMarkdown(pkg, report) {
  const categoryRows = Object.entries(report.categories)
    .map(([name, category]) => `| ${name.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())} | ${category.score} | ${category.maxScore} |`)
    .join("\n");
  const failed = report.failedChecks.length
    ? report.failedChecks.map((item) => `- ${item.label}: ${item.fix}${item.hardFailure ? " (hard failure)" : ""}`).join("\n")
    : "- None";
  const hard = report.hardFailures.length ? report.hardFailures.map((item) => `- ${item}`).join("\n") : "- None";
  const warnings = report.warnings.length ? report.warnings.map((item) => `- ${item}`).join("\n") : "- None";
  const fixes = report.recommendedFixes.length ? report.recommendedFixes.map((item) => `- ${item}`).join("\n") : "- None";

  return `# Readability Report: ${pkg.topic}

Status: **${report.status}**

Score: **${report.score}/100**

Rating Band: **${report.ratingBand}**

Production Threshold: ${report.threshold}

## Category Scores

| Category | Score | Maximum |
| --- | ---: | ---: |
${categoryRows}

## Failed Checks

${failed}

## Hard Failures

${hard}

## Warnings

${warnings}

## Recommended Fixes

${fixes}

## Metrics

- Mode: ${report.mode}
- Scenes: ${report.metrics.sceneCount}
- Duration: ${report.metrics.totalDurationSeconds} seconds
- Average words per scene: ${report.metrics.averageWordsPerScene}
`;
}

export function printScoreSummary(pkg, report) {
  const line = `${pkg.topic}: ${report.score}/100 - ${report.status} (${report.ratingBand})`;
  if (report.productionReady) console.log(line);
  else console.warn(line);
  if (!report.productionReady) {
    for (const failure of report.hardFailures) console.warn(`HARD FAILURE: ${failure}`);
    for (const failed of report.failedChecks) console.warn(`FAILED CHECK: ${failed.label}. Fix: ${failed.fix}`);
  }
  for (const warning of report.warnings) console.warn(`WARNING: ${warning}`);
}
