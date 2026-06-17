import path from "node:path";
import { ROOT, PATHS, slugify } from "./config.mjs";
import { ensureDir, readCsvObjects, readOptional, toCsv, writeText } from "./utils/file_helpers.mjs";

const LOGO_PATH = "assets/logos/logo.png";
const BRAND_TAGLINE = "Build Wealth. Not Debt.";
const AUDIENCE = "Young Investors (20-35)";
const LANGUAGE = "English";
const PRODUCTION_DIR = path.join(ROOT, "production");
const PILOT_DIR = path.join(ROOT, "pilot_launch");
const CANVA_TEMPLATE_DIR = path.join(ROOT, "templates", "canva");
const BRANDING_DIR = path.join(ROOT, "assets", "branding");

const CANVA_CATEGORIES = [
  "Wealth Building",
  "Trading Basics",
  "Investor Toolkit",
  "Investor Terminology",
  "Behavioral Finance",
];

const CATEGORY_TEMPLATE = {
  "Wealth Building": {
    intro: "Open with a money habit or goal-based question over a clean navy background.",
    content: "Use simple growth charts, SIP calendars, savings buckets, and comparison slides.",
    outro: "Close with a calm wealth-building reminder, CTA, disclaimer, and official logo.",
  },
  "Trading Basics": {
    intro: "Open with a risk-first trading situation that a beginner may recognize.",
    content: "Use risk meters, order decision cards, position examples, and checklist slides.",
    outro: "Close with a risk discipline takeaway, CTA, disclaimer, and official logo.",
  },
  "Investor Toolkit": {
    intro: "Open with a platform action or order-type decision that needs clarity.",
    content: "Use order-ticket mockups, toggle-style panels, step cards, and caution labels.",
    outro: "Close with a tool-use reminder, CTA, disclaimer, and official logo.",
  },
  "Investor Terminology": {
    intro: "Open with a market term investors see often but may misunderstand.",
    content: "Use term cards, simple formulas, comparison panels, and one practical example.",
    outro: "Close with a one-line definition in plain English, CTA, disclaimer, and official logo.",
  },
  "Behavioral Finance": {
    intro: "Open with an emotional investing moment such as fear, FOMO, or overconfidence.",
    content: "Use decision forks, emotion meters, before/after behavior cards, and pause prompts.",
    outro: "Close with a behavior reset, CTA, disclaimer, and official logo.",
  },
};

function topicSlug(topic) {
  return `${slugify(topic.Date)}-${String(topic.index).padStart(2, "0")}-${slugify(topic.Topic)}`;
}

function launchSlug(topicName) {
  return slugify(topicName).replace(/-/g, "_");
}

function productionCategory(category) {
  if (category === "Trading Platform Features") return "Investor Toolkit";
  if (category === "Stock Market Basics") return "Investor Terminology";
  return CANVA_CATEGORIES.includes(category) ? category : "Investor Terminology";
}

function section(text, startPattern, endPatterns = []) {
  const startMatch = text.match(startPattern);
  if (!startMatch || startMatch.index === undefined) return "";
  const start = startMatch.index + startMatch[0].length;
  const end = endPatterns
    .map((pattern) => {
      const match = text.slice(start).match(pattern);
      return match && match.index !== undefined ? start + match.index : -1;
    })
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  return text.slice(start, end ?? undefined).trim();
}

function voiceover(sectionText) {
  const match = sectionText.match(/Voiceover:\s*(.+)/u);
  return (match?.[1] ?? sectionText.split("\n")[0] ?? "").trim();
}

function extractScriptParts(script) {
  const draft = section(script, /## Draft\s*/u, [/## Reusable Prompt/u]);
  const hookBlock = section(draft, /1\.\s*Attention-Grabbing Hook[^\n]*\n/u, [/2\.\s*Real-Life Problem/u]);
  const problemBlock = section(draft, /2\.\s*Real-Life Problem\s*/u, [/3\.\s*Simple Explanation/u]);
  const explanationBlock = section(draft, /3\.\s*Simple Explanation\s*/u, [/4\.\s*Practical Example/u]);
  const exampleBlock = section(draft, /4\.\s*Practical Example\s*/u, [/5\.\s*Key Takeaway/u]);
  const takeawayBlock = section(draft, /5\.\s*Key Takeaway\s*/u, [/6\.\s*CTA/u]);
  const ctaBlock = section(draft, /6\.\s*CTA\s*/u, [/Compliance Note:/u]);
  return {
    hook: voiceover(hookBlock),
    problem: voiceover(problemBlock),
    explanation: voiceover(explanationBlock),
    example: voiceover(exampleBlock),
    takeaway: voiceover(takeawayBlock),
    cta: voiceover(ctaBlock),
  };
}

function extractCaption(captionFile) {
  return section(captionFile, /## Draft Caption\s*/u, [/## Hashtags/u]);
}

function extractHashtags(captionFile) {
  return section(captionFile, /## Hashtags\s*/u, [/## Call To Action/u]).replace(/\s+/g, " ").trim();
}

function extractThumbnail(thumbnailFile, fallback) {
  return section(thumbnailFile, /## Thumbnail Title\s*/u, [/## Supporting Text/u]) || fallback;
}

function makeSlides(topic, parts, thumbnail) {
  return [
    {
      screen: "Intro Screen",
      scene: 1,
      purpose: "Hook",
      text: parts.hook,
      visual: `Use ${LOGO_PATH} exactly as supplied, topic title, and one clean visual cue.`,
    },
    {
      screen: "Content Screen",
      scene: 2,
      purpose: "Real-Life Problem",
      text: parts.problem,
      visual: "Show a relatable young investor decision with simple labels and large mobile-readable text.",
    },
    {
      screen: "Content Screen",
      scene: 3,
      purpose: "Simple Explanation",
      text: parts.explanation,
      visual: "Use a plain-English explainer card with one idea only.",
    },
    {
      screen: "Content Screen",
      scene: 4,
      purpose: "Practical Example",
      text: parts.example,
      visual: "Use a practical example card with portfolio, SIP, risk, or Rs 10,000 decision framing.",
    },
    {
      screen: "Content Screen",
      scene: 5,
      purpose: "Key Takeaway",
      text: parts.takeaway,
      visual: "Use a strong one-line takeaway with accent highlight.",
    },
    {
      screen: "Outro Screen",
      scene: 6,
      purpose: "CTA + Logo",
      text: parts.cta,
      visual: `Show CTA, disclaimer, tagline "${BRAND_TAGLINE}", and ${LOGO_PATH} without editing the logo.`,
    },
  ].map((slide) => ({
    ...slide,
    thumbnailContext: thumbnail,
    format: "1080x1920 vertical",
  }));
}

function makeStoryboard(topic, parts) {
  return [
    `# Storyboard: ${topic.Topic}`,
    "",
    `Category: ${productionCategory(topic.Category)}`,
    `Brand Tagline: ${BRAND_TAGLINE}`,
    `Audience: ${AUDIENCE}`,
    `Logo: ${LOGO_PATH}`,
    "",
    "Scene 1:",
    `Hook: ${parts.hook}`,
    "",
    "Scene 2:",
    `Problem: ${parts.problem}`,
    "",
    "Scene 3:",
    `Explanation: ${parts.explanation}`,
    "",
    "Scene 4:",
    `Example: ${parts.example}`,
    "",
    "Scene 5:",
    `Takeaway: ${parts.takeaway}`,
    "",
    "Scene 6:",
    `CTA + Logo: ${parts.cta} Use ${LOGO_PATH} exactly as supplied. Add: Educational content only. This is not financial advice.`,
  ].join("\n");
}

function makeProductionPackage(topic, parts, thumbnail) {
  return {
    topic: topic.Topic,
    category: productionCategory(topic.Category),
    hook: parts.hook,
    thumbnail,
    slides: makeSlides(topic, parts, thumbnail),
    cta: parts.cta || topic.CTA,
    logo: LOGO_PATH,
    brand: {
      name: "UNLOAN",
      tagline: BRAND_TAGLINE,
      audience: AUDIENCE,
      language: LANGUAGE,
    },
    compliance: {
      disclaimer: "Educational content only. This is not financial advice.",
      noStockRecommendations: true,
      noReturnGuarantees: true,
      noProfitClaims: true,
    },
    productionStatus: {
      packageReady: true,
      storyboardReady: true,
      thumbnailReady: true,
      canvaReady: false,
      videoProduced: false,
      published: false,
    },
  };
}

function makeCanvaTemplate(category) {
  const spec = CATEGORY_TEMPLATE[category];
  return [
    `# Canva Production Template: ${category}`,
    "",
    "Format: 1080x1920 vertical video or carousel frame.",
    `Brand Tagline: ${BRAND_TAGLINE}`,
    `Audience: ${AUDIENCE}`,
    `Language: ${LANGUAGE}`,
    "",
    "## Intro Screen",
    "",
    spec.intro,
    "",
    "## Content Screens",
    "",
    spec.content,
    "",
    "## Outro Screen",
    "",
    spec.outro,
    "",
    "## Logo Placement",
    "",
    `Use ${LOGO_PATH} exactly as supplied. Place it in the safe top-left or bottom-right area with clear padding. Do not crop, recolor, redesign, recreate, or substitute the logo.`,
    "",
    "## CTA Placement",
    "",
    "Place CTA on the final screen and optionally as a small footer on content screens. Keep CTA short and mobile readable.",
    "",
    "## Typography",
    "",
    "- Headlines: Montserrat Bold.",
    "- Body: Poppins Regular or Medium.",
    "- No font substitutions in branded templates.",
    "",
    "## Color Usage",
    "",
    "- Primary: #0F172A",
    "- Secondary: #FFFFFF",
    "- Accent: #D4AF37",
    "- Use high contrast and avoid decorative clutter.",
  ].join("\n");
}

function makeLogoUsage() {
  return [
    "# UNLOAN Logo Usage",
    "",
    `Official logo asset: ${LOGO_PATH}`,
    "",
    "## Required Rules",
    "",
    "- Use the official UNLOAN logo exactly as supplied.",
    "- Do not recolor the logo.",
    "- Do not redesign the logo.",
    "- Do not recreate the logo with AI.",
    "- Do not crop the logo.",
    "- Do not create alternate logo versions.",
    "- Do not substitute the logo typography.",
    "",
    "## Placement",
    "",
    "- Use clear spacing around the logo.",
    "- Place on clean, high-contrast areas only.",
    "- Keep the logo readable on mobile screens.",
    "",
    "## Production Reminder",
    "",
    "Every production package must reference the original asset path and must not embed modified logo variants.",
  ].join("\n");
}

function makeQaChecklist() {
  return [
    "# QA Checklist",
    "",
    "Use this checklist before moving any asset from Draft to Ready.",
    "",
    "- ✓ Hook is engaging",
    "- ✓ Content is accurate",
    "- ✓ Example is relatable",
    `- ✓ Logo is correct and uses ${LOGO_PATH}`,
    "- ✓ CTA included",
    "- ✓ Disclaimer included",
    "- ✓ Mobile readable",
    "- ✓ Suitable for Instagram Reels",
    "- ✓ Suitable for YouTube Shorts",
    "",
    "Compliance reminder: no stock recommendations, no return guarantees, no profit claims, and no personalized financial advice.",
  ].join("\n");
}

function makeDashboard(topics) {
  const rows = topics.map((topic) => ({
    Topic: topic.Topic,
    Category: productionCategory(topic.Category),
    "Package Ready": "Yes",
    "Storyboard Ready": "Yes",
    "Thumbnail Ready": "Yes",
    "Canva Ready": "Pending",
    "Video Produced": "No",
    Published: "No",
  }));
  const headers = Object.keys(rows[0] ?? {});
  return [
    "# Production Dashboard",
    "",
    `Goal: 14 videos per week using the official UNLOAN brand system and ${LOGO_PATH}.`,
    "",
    `Brand Tagline: ${BRAND_TAGLINE}`,
    `Audience: ${AUDIENCE}`,
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => row[header]).join(" | ")} |`),
  ].join("\n");
}

async function sourceFilesFor(topic, slug) {
  const [reel, short, captionFile, thumbnailFile] = await Promise.all([
    readOptional(path.join(ROOT, "content", "reels", `${slug}.md`)),
    readOptional(path.join(ROOT, "content", "shorts", `${slug}.md`)),
    readOptional(path.join(ROOT, "content", "captions", `${slug}.md`)),
    readOptional(path.join(ROOT, "content", "thumbnails", `${slug}.md`)),
  ]);
  const parts = extractScriptParts(reel);
  const thumbnail = extractThumbnail(thumbnailFile, topic.Topic);
  return {
    reel,
    short,
    caption: extractCaption(captionFile),
    hashtags: extractHashtags(captionFile),
    thumbnail,
    storyboard: makeStoryboard(topic, parts),
    productionPackage: makeProductionPackage(topic, parts, thumbnail),
  };
}

async function writeTopicProduction(topic) {
  const slug = topicSlug(topic);
  const files = await sourceFilesFor(topic, slug);
  const topicDir = path.join(PRODUCTION_DIR, "topics", slug);
  await writeText(path.join(topicDir, "storyboard.md"), files.storyboard);
  await writeText(path.join(topicDir, "production_package.json"), JSON.stringify(files.productionPackage, null, 2));
  return { topic, slug, files };
}

async function writeWeeklyBundle(weekNumber, items) {
  const weekDir = path.join(PRODUCTION_DIR, `week_${String(weekNumber).padStart(2, "0")}`);
  const manifest = [];
  for (const item of items) {
    const bundleDir = path.join(weekDir, item.slug);
    manifest.push({
      topic: item.topic.Topic,
      category: productionCategory(item.topic.Category),
      path: `production/week_${String(weekNumber).padStart(2, "0")}/${item.slug}`,
      logo: LOGO_PATH,
      status: "Ready for Canva creation",
    });
    await writeText(path.join(bundleDir, "scripts.md"), [`# Scripts: ${item.topic.Topic}`, "", "## Reel", "", item.files.reel, "", "## YouTube Short", "", item.files.short].join("\n"));
    await writeText(path.join(bundleDir, "caption.txt"), item.files.caption);
    await writeText(path.join(bundleDir, "hashtags.txt"), item.files.hashtags);
    await writeText(path.join(bundleDir, "storyboard.md"), item.files.storyboard);
    await writeText(path.join(bundleDir, "thumbnail.txt"), item.files.thumbnail);
    await writeText(path.join(bundleDir, "production_package.json"), JSON.stringify(item.files.productionPackage, null, 2));
  }
  await writeText(path.join(weekDir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function writePilotPack(topicItems) {
  const pilotNames = new Set(["Rule of 72", "GTT Orders", "Stop Loss", "ETF", "ROE"]);
  const selected = topicItems.filter((item) => pilotNames.has(item.topic.Topic));
  const manifest = selected.map((item) => ({
    topic: item.topic.Topic === "GTT Orders" ? "What is GTT Order" : item.topic.Topic === "Stop Loss" ? "Stop Loss Explained" : item.topic.Topic,
    sourceTopic: item.topic.Topic,
    category: productionCategory(item.topic.Category),
    path: `pilot_launch/${launchSlug(item.topic.Topic === "GTT Orders" ? "What is GTT Order" : item.topic.Topic === "Stop Loss" ? "Stop Loss Explained" : item.topic.Topic)}`,
    logo: LOGO_PATH,
    status: "Ready for first video creation test",
  }));

  for (const item of selected) {
    const displayName = item.topic.Topic === "GTT Orders" ? "What is GTT Order" : item.topic.Topic === "Stop Loss" ? "Stop Loss Explained" : item.topic.Topic;
    const pilotDir = path.join(PILOT_DIR, launchSlug(displayName));
    await writeText(path.join(pilotDir, "scripts.md"), [`# Scripts: ${displayName}`, "", "## Reel", "", item.files.reel, "", "## YouTube Short", "", item.files.short].join("\n"));
    await writeText(path.join(pilotDir, "caption.txt"), item.files.caption);
    await writeText(path.join(pilotDir, "hashtags.txt"), item.files.hashtags);
    await writeText(path.join(pilotDir, "thumbnail.txt"), item.files.thumbnail);
    await writeText(path.join(pilotDir, "storyboard.md"), item.files.storyboard.replace(`# Storyboard: ${item.topic.Topic}`, `# Storyboard: ${displayName}`));
    await writeText(path.join(pilotDir, "production_package.json"), JSON.stringify({ ...item.files.productionPackage, topic: displayName }, null, 2));
  }
  await writeText(path.join(PILOT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function main() {
  const topics = await readCsvObjects(PATHS.calendar);
  const logoFile = await readOptional(path.join(ROOT, LOGO_PATH));
  if (!logoFile) {
    throw new Error(`Missing required official logo asset: ${LOGO_PATH}`);
  }

  await Promise.all([
    ensureDir(CANVA_TEMPLATE_DIR),
    ensureDir(BRANDING_DIR),
    ensureDir(PRODUCTION_DIR),
    ensureDir(PILOT_DIR),
  ]);

  for (const category of CANVA_CATEGORIES) {
    await writeText(path.join(CANVA_TEMPLATE_DIR, `${slugify(category)}.md`), makeCanvaTemplate(category));
  }

  await writeText(path.join(BRANDING_DIR, "colors.json"), JSON.stringify({
    primary: "#0F172A",
    secondary: "#FFFFFF",
    accent: "#D4AF37",
    usage: {
      primary: "Backgrounds, headers, high-contrast title screens",
      secondary: "Text on dark backgrounds and clean content panels",
      accent: "Highlights, CTA accents, key terms, and separators",
    },
  }, null, 2));
  await writeText(path.join(BRANDING_DIR, "typography.json"), JSON.stringify({
    headline: "Montserrat",
    body: "Poppins",
    restrictions: ["No font substitutions in branded templates"],
  }, null, 2));
  await writeText(path.join(BRANDING_DIR, "layout_rules.json"), JSON.stringify({
    format: "1080x1920 vertical",
    safeArea: "Keep key text and logo inside central mobile-safe zones with generous padding.",
    logo: LOGO_PATH,
    introScreen: "Hook, category, and official logo.",
    contentScreens: "One idea per screen, large text, clear hierarchy.",
    outroScreen: "CTA, disclaimer, tagline, and official logo.",
  }, null, 2));
  await writeText(path.join(BRANDING_DIR, "logo_usage.md"), makeLogoUsage());

  const productionItems = [];
  for (const topic of topics) {
    productionItems.push(await writeTopicProduction(topic));
  }

  await writeWeeklyBundle(1, productionItems.slice(0, 14));
  await writeWeeklyBundle(2, productionItems.slice(14, 28));
  await writePilotPack(productionItems);
  await writeText(path.join(ROOT, "docs", "production_dashboard.md"), makeDashboard(topics));
  await writeText(path.join(ROOT, "docs", "qa_checklist.md"), makeQaChecklist());
  await writeText(path.join(PRODUCTION_DIR, "production_manifest.csv"), toCsv(productionItems.map((item, index) => ({
    Week: index < 14 ? "week_01" : index < 28 ? "week_02" : "backlog",
    Topic: item.topic.Topic,
    Category: productionCategory(item.topic.Category),
    Package: `production/topics/${item.slug}`,
    Storyboard: `production/topics/${item.slug}/storyboard.md`,
    "Production Package": `production/topics/${item.slug}/production_package.json`,
    Logo: LOGO_PATH,
  }))));

  console.log(`Wrote production layer for ${productionItems.length} topics.`);
  console.log("Canva templates: 5");
  console.log("Weekly bundles: week_01, week_02");
  console.log("Pilot topics: 5");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
