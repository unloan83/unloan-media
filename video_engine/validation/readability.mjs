import { OFFICIAL_LOGO, SCENE_PLAN, SUPPORTED_CATEGORIES } from "../config.mjs";

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/u).filter(Boolean).length;
}

function hexToRgb(hex) {
  const value = String(hex).replace("#", "");
  if (!/^[0-9a-f]{6}$/iu.test(value)) return null;
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const firstLum = relativeLuminance(first);
  const secondLum = relativeLuminance(second);
  if (firstLum === null || secondLum === null) return 0;
  const lighter = Math.max(firstLum, secondLum);
  const darker = Math.min(firstLum, secondLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function lineCount(value, wordsPerLine) {
  const words = wordCount(value);
  return words === 0 ? 0 : Math.ceil(words / wordsPerLine);
}

export function validatePackageStructure(pkg) {
  const errors = [];
  const warnings = [];

  if (!pkg || typeof pkg !== "object") errors.push("Production package must be a JSON object.");
  if (!pkg?.topic) errors.push("Missing topic.");
  if (!SUPPORTED_CATEGORIES.has(pkg?.category)) errors.push(`Unsupported category: ${pkg?.category ?? "missing"}.`);
  if (pkg?.logo !== OFFICIAL_LOGO) errors.push(`Logo path must be exactly ${OFFICIAL_LOGO}.`);
  if (!Array.isArray(pkg?.slides)) errors.push("slides must be an array.");

  for (const plan of SCENE_PLAN) {
    const matches = pkg?.slides?.filter((slide) => Number(slide.scene) === plan.scene) ?? [];
    if (matches.length !== 1) {
      errors.push(`Scene ${plan.scene} must appear exactly once.`);
    } else if (!String(matches[0].text ?? "").trim()) {
      errors.push(`Scene ${plan.scene} (${plan.label}) has no text.`);
    }
  }

  if (!pkg?.compliance?.disclaimer) warnings.push("Compliance disclaimer is missing; the renderer will apply the standard disclaimer.");
  if (pkg?.compliance?.noStockRecommendations !== true) warnings.push("noStockRecommendations should be true.");
  if (pkg?.compliance?.noReturnGuarantees !== true) warnings.push("noReturnGuarantees should be true.");

  return { errors, warnings };
}

export function validateReadableScenes(scenes, tokens, preset) {
  const errors = [];
  const warnings = [];
  const type = tokens.typography;
  const density = tokens.density;

  if (type.headline_preferred < type.headline_min) errors.push("Headline font is below the configured minimum.");
  if (type.secondary_preferred < type.secondary_min) errors.push("Secondary font is below the configured minimum.");
  if (type.supporting_preferred < type.supporting_min) errors.push("Supporting font is below the configured minimum.");
  if (type.cta_preferred < type.cta_min) errors.push("CTA font is below the configured minimum.");
  if (type.disclaimer_preferred < type.disclaimer_min) errors.push("Disclaimer font is below the configured minimum.");
  if (contrastRatio(tokens.colors.text_primary, tokens.colors.background_primary) < 4.5) errors.push("Primary text contrast is below WCAG AA.");
  if (contrastRatio(tokens.colors.text_accent, tokens.colors.background_primary) < 4.5) errors.push("Accent text contrast is below WCAG AA.");
  if (tokens.canvas.safe_margin_x < 72 || tokens.canvas.safe_margin_top < 96 || tokens.canvas.safe_margin_bottom < 96) {
    errors.push("Canvas safe margins are too small for vertical mobile video.");
  }

  for (const scene of scenes) {
    const headlineWords = wordCount(scene.keyMessage);
    const supportWords = wordCount(scene.supportMessage);
    const totalWords = headlineWords + supportWords;
    const blocks = [scene.keyMessage, scene.supportMessage].filter((value) => String(value ?? "").trim()).length;
    const duration = Number(scene.duration);
    const readableWords = Math.floor(duration * 4);
    const headlineLines = lineCount(scene.keyMessage, density.headline_words_per_line);
    const supportLines = lineCount(scene.supportMessage, density.support_words_per_line);

    if (headlineWords > density.headline_max_words) errors.push(`Scene ${scene.scene} key message exceeds ${density.headline_max_words} words.`);
    if (supportWords > density.support_max_words) errors.push(`Scene ${scene.scene} support message exceeds ${density.support_max_words} words.`);
    if (totalWords > density.total_max_words) errors.push(`Scene ${scene.scene} exceeds ${density.total_max_words} total words.`);
    if (blocks > density.max_text_blocks) errors.push(`Scene ${scene.scene} exceeds ${density.max_text_blocks} text blocks.`);
    if (headlineLines > density.headline_max_lines) errors.push(`Scene ${scene.scene} key message exceeds ${density.headline_max_lines} lines.`);
    if (supportLines > density.support_max_lines) errors.push(`Scene ${scene.scene} support message exceeds ${density.support_max_lines} lines.`);
    if (totalWords > readableWords) warnings.push(`Scene ${scene.scene} is dense for ${duration}s (${totalWords} words).`);
    if (preset.name === "production" && preset.show_scene_numbers) errors.push("Production mode cannot show scene numbers.");
  }

  if (type.headline_preferred < type.secondary_preferred * 1.75) errors.push("Key message is not visually dominant over support text.");
  if (preset.alignment !== tokens.layout.alignment) errors.push("Preset alignment is inconsistent with the design tokens.");
  if (tokens.layout.key_x < tokens.canvas.safe_margin_x) errors.push("Key text overlaps the horizontal safe margin.");
  if (tokens.layout.key_y < tokens.canvas.safe_margin_top) errors.push("Key text overlaps the top safe margin.");
  const maximumSupportBottom =
    tokens.layout.key_y +
    tokens.density.headline_max_lines * tokens.layout.key_line_gap +
    tokens.layout.support_gap +
    (tokens.density.support_max_lines - 1) * tokens.layout.support_line_gap +
    tokens.typography.secondary_preferred;
  const footerSafeStart = tokens.canvas.height - tokens.canvas.safe_margin_bottom - 280;
  if (maximumSupportBottom >= footerSafeStart) errors.push("Text hierarchy can overlap the final-scene branding safe zone.");

  return { errors, warnings };
}

export function printValidationReport(report) {
  for (const warning of report.warnings) console.warn(`READABILITY WARNING: ${warning}`);
  if (report.errors.length > 0) {
    throw new Error(`Readability validation failed:\n- ${report.errors.join("\n- ")}`);
  }
}
