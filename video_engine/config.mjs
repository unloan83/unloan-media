import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ENGINE_ROOT = path.join(ROOT, "video_engine");
export const OUTPUT_ROOT = path.join(ENGINE_ROOT, "outputs");
export const OFFICIAL_LOGO = "assets/logos/logo.png";
export const DESIGN_TOKENS = JSON.parse(readFileSync(path.join(ENGINE_ROOT, "design_tokens.json"), "utf8"));

export const VIDEO = {
  width: DESIGN_TOKENS.canvas.width,
  height: DESIGN_TOKENS.canvas.height,
  fps: DESIGN_TOKENS.canvas.fps,
  format: "1080x1920 vertical",
};

export const BRAND = {
  name: "UNLOAN",
  tagline: "Build Wealth. Not Debt.",
  primary: DESIGN_TOKENS.colors.background_primary,
  panel: DESIGN_TOKENS.colors.background_secondary,
  secondary: DESIGN_TOKENS.colors.text_primary,
  accent: DESIGN_TOKENS.colors.text_accent,
  positive: DESIGN_TOKENS.colors.positive,
  negative: DESIGN_TOKENS.colors.negative,
  headlineFont: `${DESIGN_TOKENS.typography.headline_font}, Arial, sans-serif`,
  bodyFont: `${DESIGN_TOKENS.typography.body_font}, Arial, sans-serif`,
};

export const SUPPORTED_CATEGORIES = new Set([
  "Wealth Building",
  "Trading Basics",
  "Investor Toolkit",
  "Investor Terminology",
  "Behavioral Finance",
]);

export const SCENE_PLAN = [
  { scene: 1, label: "Hook", purpose: "Hook", duration: DESIGN_TOKENS.timing_seconds["1"] },
  { scene: 2, label: "Problem", purpose: "Real-Life Problem", duration: DESIGN_TOKENS.timing_seconds["2"] },
  { scene: 3, label: "Explanation", purpose: "Simple Explanation", duration: DESIGN_TOKENS.timing_seconds["3"] },
  { scene: 4, label: "Example", purpose: "Practical Example", duration: DESIGN_TOKENS.timing_seconds["4"] },
  { scene: 5, label: "Takeaway", purpose: "Key Takeaway", duration: DESIGN_TOKENS.timing_seconds["5"] },
  { scene: 6, label: "CTA", purpose: "CTA + Logo", duration: DESIGN_TOKENS.timing_seconds["6"] },
];

export function loadPreset(name = "production") {
  if (!["production", "debug"].includes(name)) {
    throw new Error(`Unsupported render mode: ${name}. Use production or debug.`);
  }
  return JSON.parse(readFileSync(path.join(ENGINE_ROOT, "presets", `${name}.json`), "utf8"));
}
