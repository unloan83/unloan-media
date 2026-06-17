import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ENGINE_ROOT = path.join(ROOT, "video_engine");
export const OUTPUT_ROOT = path.join(ENGINE_ROOT, "outputs");
export const OFFICIAL_LOGO = "assets/logos/logo.png";

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  sceneDurationSeconds: 3.5,
  format: "1080x1920 vertical",
};

export const BRAND = {
  name: "UNLOAN",
  tagline: "Build Wealth. Not Debt.",
  primary: "#0F172A",
  secondary: "#FFFFFF",
  accent: "#D4AF37",
  headlineFont: "Montserrat, Arial, sans-serif",
  bodyFont: "Poppins, Arial, sans-serif",
};

export const SUPPORTED_CATEGORIES = new Set([
  "Wealth Building",
  "Trading Basics",
  "Investor Toolkit",
  "Investor Terminology",
  "Behavioral Finance",
]);

export const SCENE_PLAN = [
  { scene: 1, label: "Hook", purpose: "Hook" },
  { scene: 2, label: "Problem", purpose: "Real-Life Problem" },
  { scene: 3, label: "Explanation", purpose: "Simple Explanation" },
  { scene: 4, label: "Example", purpose: "Practical Example" },
  { scene: 5, label: "Takeaway", purpose: "Key Takeaway" },
  { scene: 6, label: "CTA + Logo", purpose: "CTA + Logo" },
];
