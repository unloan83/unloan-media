import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "launch_pack");
const LOGO_PATH = "assets/logos/logo.png";
const BRAND_TAGLINE = "Build Wealth. Not Debt.";
const TARGET_AUDIENCE = "Young Investors (20-35)";
const DISCLAIMER = "Educational content only. This is not financial advice.";

const TOPICS = [
  {
    topic: "Rule of 72",
    category: "Wealth Building",
    angle: "A simple shortcut to understand how compounding time works.",
    keyPoints: ["It estimates doubling time", "Use 72 divided by rate", "It is only a rough learning tool"],
    caution: "Real returns are never fixed or guaranteed.",
  },
  {
    topic: "Power of Compounding",
    category: "Wealth Building",
    angle: "How time can make money growth easier to understand.",
    keyPoints: ["Growth can earn growth", "Time matters more than excitement", "Consistency beats prediction"],
    caution: "Compounding depends on time, discipline, and market reality.",
  },
  {
    topic: "SIP vs Saving Account",
    category: "Wealth Building",
    angle: "Explain purpose, risk, and behavior difference.",
    keyPoints: ["Savings accounts are for access and safety", "SIPs are market-linked investing routes", "Both can serve different goals"],
    caution: "Market-linked investing can go up and down.",
  },
  {
    topic: "Inflation Explained",
    category: "Wealth Building",
    angle: "Show why money can buy less over time.",
    keyPoints: ["Prices can rise over time", "Purchasing power can fall", "Planning must consider inflation"],
    caution: "Inflation impact varies by lifestyle and spending.",
  },
  {
    topic: "Emergency Fund",
    category: "Wealth Building",
    angle: "Why a cash buffer comes before aggressive money moves.",
    keyPoints: ["It covers unexpected expenses", "It reduces panic decisions", "It supports financial confidence"],
    caution: "The right amount depends on personal responsibilities.",
  },
  {
    topic: "Intraday vs Delivery",
    category: "Trading Basics",
    angle: "Compare same-day trading and holding beyond one day.",
    keyPoints: ["Intraday closes the same day", "Delivery carries positions forward", "Risk and mindset are different"],
    caution: "Trading can lead to losses and needs strong risk control.",
  },
  {
    topic: "Risk Reward Ratio",
    category: "Trading Basics",
    angle: "Explain risk before reward.",
    keyPoints: ["Risk is what you may lose", "Reward is what you may gain", "The ratio helps plan before entering"],
    caution: "A ratio does not guarantee success.",
  },
  {
    topic: "Market Order vs Limit Order",
    category: "Trading Basics",
    angle: "Teach the difference between speed and price control.",
    keyPoints: ["Market orders prioritize execution", "Limit orders set a price boundary", "Each has trade-offs"],
    caution: "Fast markets can behave differently than expected.",
  },
  {
    topic: "Why Most Traders Lose Money",
    category: "Trading Basics",
    angle: "Focus on behavior, risk, and process mistakes.",
    keyPoints: ["Overtrading hurts discipline", "No stop loss increases damage", "Emotions can override plans"],
    caution: "This is risk education, not trading advice.",
  },
  {
    topic: "Position Sizing Basics",
    category: "Trading Basics",
    angle: "Explain why trade size matters.",
    keyPoints: ["Size controls damage", "Small losses are easier to recover from", "Risk per trade should be planned"],
    caution: "Position size should match personal risk capacity.",
  },
  {
    topic: "What is GTT Order",
    category: "Investor Toolkit",
    angle: "Explain a trigger-based order feature simply.",
    keyPoints: ["GTT means Good Till Triggered", "It waits for a condition", "It can help plan entries or exits"],
    caution: "Order execution depends on platform rules and market conditions.",
  },
  {
    topic: "Stop Loss Explained",
    category: "Investor Toolkit",
    angle: "Show stop loss as a risk-control tool.",
    keyPoints: ["It defines an exit level", "It limits emotional hesitation", "It is part of planning"],
    caution: "Stop loss does not remove all risk.",
  },
  {
    topic: "Trailing Stop Loss",
    category: "Investor Toolkit",
    angle: "Explain a stop loss that adjusts with price movement.",
    keyPoints: ["It can move with favorable price action", "It helps protect part of a move", "It still needs rules"],
    caution: "It can trigger during normal volatility.",
  },
  {
    topic: "Watchlist Management",
    category: "Investor Toolkit",
    angle: "Teach how to keep a cleaner tracking list.",
    keyPoints: ["Group by purpose", "Avoid random additions", "Review names periodically"],
    caution: "A watchlist is not a recommendation list.",
  },
  {
    topic: "Portfolio Diversification",
    category: "Investor Toolkit",
    angle: "Explain not depending on one idea.",
    keyPoints: ["Spread exposure", "Reduce single-stock dependence", "Balance across goals and risk"],
    caution: "Diversification cannot eliminate all risk.",
  },
  {
    topic: "PE Ratio",
    category: "Investor Terminology",
    angle: "Decode price compared to earnings.",
    keyPoints: ["PE compares price and earnings", "High or low needs context", "It is not a standalone buy signal"],
    caution: "Never judge a stock using one metric alone.",
  },
  {
    topic: "ROE",
    category: "Investor Terminology",
    angle: "Explain return on equity in beginner language.",
    keyPoints: ["ROE shows profit relative to shareholder equity", "It can indicate efficiency", "Debt can distort interpretation"],
    caution: "ROE needs business and balance sheet context.",
  },
  {
    topic: "ROCE",
    category: "Investor Terminology",
    angle: "Explain return on capital employed.",
    keyPoints: ["ROCE looks at capital efficiency", "It helps compare capital-heavy businesses", "Consistency matters"],
    caution: "ROCE is educational, not a stock selection shortcut.",
  },
  {
    topic: "ETF",
    category: "Investor Terminology",
    angle: "Explain a basket-style market product.",
    keyPoints: ["ETF stands for exchange traded fund", "It can track a basket or index", "It trades like a market instrument"],
    caution: "ETFs still carry market risk.",
  },
  {
    topic: "Market Capitalization",
    category: "Investor Terminology",
    angle: "Explain company size in the stock market.",
    keyPoints: ["Market cap is price times shares", "It reflects market value", "Large, mid, and small cap have different risk profiles"],
    caution: "Size alone does not mean safety or quality.",
  },
];

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hashtags(item) {
  const categoryTags = {
    "Wealth Building": ["#WealthBuilding", "#MoneyBasics", "#PersonalFinance"],
    "Trading Basics": ["#TradingBasics", "#RiskManagement", "#StockMarketEducation"],
    "Investor Toolkit": ["#InvestorToolkit", "#InvestingTools", "#MarketBasics"],
    "Investor Terminology": ["#InvestorTerminology", "#StockMarketBasics", "#FinanceTerms"],
  };
  return [
    "#UNLOAN",
    "#BuildWealthNotDebt",
    "#YoungInvestors",
    "#BeginnerInvesting",
    "#FinancialEducation",
    ...(categoryTags[item.category] ?? []),
  ];
}

function thumbnailTitle(item) {
  const shortTitles = {
    "Power of Compounding": "Compounding Power",
    "SIP vs Saving Account": "SIP vs Savings",
    "Why Most Traders Lose Money": "Why Traders Lose",
    "Market Order vs Limit Order": "Market vs Limit",
    "Portfolio Diversification": "Diversify Smartly",
    "Market Capitalization": "Market Cap",
  };
  return shortTitles[item.topic] ?? item.topic;
}

function buildReelScript(item) {
  return [
    `# Reel Script: ${item.topic}`,
    "",
    "Duration: 30-45 seconds",
    "Format: Instagram Reel",
    `Audience: ${TARGET_AUDIENCE}`,
    "",
    "## Script",
    "",
    `Hook: ${item.topic} sounds complicated, but the beginner idea is simple.`,
    "",
    `Scene 1: ${item.angle}`,
    "",
    `Scene 2: ${item.keyPoints[0]}.`,
    "",
    `Scene 3: ${item.keyPoints[1]}.`,
    "",
    `Scene 4: ${item.keyPoints[2]}.`,
    "",
    `Risk note: ${item.caution}`,
    "",
    `CTA: Save this lesson and follow UNLOAN for simple investing education.`,
    "",
    `Disclaimer: ${DISCLAIMER}`,
  ].join("\n");
}

function buildShortScript(item) {
  return [
    `# YouTube Short Script: ${item.topic}`,
    "",
    "Duration: 30-45 seconds",
    "Format: YouTube Short",
    `Audience: ${TARGET_AUDIENCE}`,
    "",
    "## Script",
    "",
    `Opening: Here is ${item.topic} in plain English.`,
    "",
    `Point 1: ${item.keyPoints[0]}.`,
    "",
    `Point 2: ${item.keyPoints[1]}.`,
    "",
    `Point 3: ${item.keyPoints[2]}.`,
    "",
    `Remember: ${item.caution}`,
    "",
    `Close: ${BRAND_TAGLINE}`,
    "",
    `Disclaimer: ${DISCLAIMER}`,
  ].join("\n");
}

function buildCaption(item) {
  return [
    `${item.topic} in simple English.`,
    "",
    item.angle,
    "",
    `Remember: ${item.caution}`,
    "",
    "Save this for later and share it with a young investor who is learning the basics.",
    "",
    `${BRAND_TAGLINE}`,
    "",
    DISCLAIMER,
  ].join("\n");
}

function buildVisualBrief(item) {
  return [
    `Visual Brief: ${item.topic}`,
    "",
    `Logo: ${LOGO_PATH}`,
    "Logo rule: Use the official UNLOAN logo exactly as supplied. Do not modify, redraw, recolor, crop, replace, reinterpret, or recreate it.",
    `Brand tagline: ${BRAND_TAGLINE}`,
    "Format: 1080x1920 vertical video for Instagram Reels and YouTube Shorts.",
    "",
    "Scene 1: Clean title frame with the official logo in a safe corner and the topic headline.",
    `On-screen text: ${thumbnailTitle(item)}`,
    "",
    `Scene 2: Simple visual explanation of: ${item.keyPoints[0]}.`,
    "",
    `Scene 3: Beginner example showing: ${item.keyPoints[1]}.`,
    "",
    `Scene 4: Checklist card: ${item.keyPoints[2]}.`,
    "",
    `Scene 5: Risk note card: ${item.caution}`,
    "",
    "Final frame: Official logo, tagline, CTA, and educational disclaimer.",
  ].join("\n");
}

function buildMetadata(item) {
  return {
    topic: item.topic,
    category: item.category,
    brand: "UNLOAN",
    brandTagline: BRAND_TAGLINE,
    targetAudience: TARGET_AUDIENCE,
    language: "English",
    platforms: ["Instagram Reels", "YouTube Shorts"],
    status: "Ready",
    logo: LOGO_PATH,
    logoRules: "Use the official UNLOAN logo exactly as supplied. Do not modify, redraw, recolor, crop, replace, reinterpret, or recreate it.",
    thumbnailTitle: thumbnailTitle(item),
    disclaimer: DISCLAIMER,
    noStockRecommendations: true,
    noReturnGuarantees: true,
    files: {
      reelScript: "reel_script.md",
      shortScript: "short_script.md",
      caption: "caption.txt",
      hashtags: "hashtags.txt",
      thumbnail: "thumbnail.txt",
      visualBrief: "visual_brief.txt",
    },
  };
}

async function writeText(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${String(content).trimEnd()}\n`, "utf8");
}

async function main() {
  const written = [];
  for (const item of TOPICS) {
    const dir = path.join(OUTPUT_DIR, slugify(item.topic));
    const files = {
      "reel_script.md": buildReelScript(item),
      "short_script.md": buildShortScript(item),
      "caption.txt": buildCaption(item),
      "hashtags.txt": hashtags(item).join(" "),
      "thumbnail.txt": thumbnailTitle(item),
      "visual_brief.txt": buildVisualBrief(item),
      "metadata.json": JSON.stringify(buildMetadata(item), null, 2),
    };

    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(dir, fileName);
      await writeText(filePath, content);
      written.push(path.relative(ROOT, filePath));
    }
  }

  await writeText(
    path.join(OUTPUT_DIR, "README.md"),
    [
      "# UNLOAN Launch Pack v1",
      "",
      "Twenty ready-to-publish educational content packages for Instagram Reels and YouTube Shorts.",
      "",
      `Official logo: ${LOGO_PATH}`,
      "Logo rule: Use the official UNLOAN logo exactly as supplied. Do not modify, redraw, recolor, crop, replace, reinterpret, or recreate it.",
      `Brand tagline: ${BRAND_TAGLINE}`,
      `Target audience: ${TARGET_AUDIENCE}`,
      "Language: English",
      "",
      "Every topic folder contains reel script, short script, caption, hashtags, thumbnail title, visual brief, and metadata.",
    ].join("\n"),
  );
  written.push(path.relative(ROOT, path.join(OUTPUT_DIR, "README.md")));

  console.log(`Wrote ${TOPICS.length} UNLOAN Launch Pack v1 topics.`);
  for (const filePath of written) {
    console.log(filePath);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
