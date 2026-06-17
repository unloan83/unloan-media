import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CALENDAR = path.join(ROOT, "content_calendar", "master_calendar.csv");
const PROMPT_DIR = path.join(ROOT, "templates", "prompts");
const OUTPUT_DIRS = {
  reel: path.join(ROOT, "content", "reels"),
  short: path.join(ROOT, "content", "shorts"),
  caption: path.join(ROOT, "content", "captions"),
  thumbnail: path.join(ROOT, "content", "thumbnails"),
};

const FIELD_ALIASES = {
  date: ["date", "publish_date", "scheduled_date"],
  category: ["category", "pillar", "content_pillar"],
  topic: ["topic", "title", "content_topic", "idea"],
  difficulty: ["difficulty", "level"],
  platform: ["platform", "channel"],
  status: ["status", "workflow_status"],
  angle: ["angle", "hook_angle", "creative_angle"],
  audience: ["audience", "audience_segment", "target_audience"],
  cta: ["cta", "call_to_action", "call_to-action"],
};

const CATEGORY_GUIDANCE = {
  "Wealth Building": "Explain how long-term money habits create financial freedom.",
  "Stock Market Basics": "Define the market concept in simple language with a beginner example.",
  "Trading Basics": "Teach the trading concept without encouraging frequent trading or quick profits.",
  "Trading Platform Features": "Explain what the order type does and when a learner should be careful.",
  "Investor Terminology": "Decode the metric or term without making stock selection claims.",
  "Behavioral Finance": "Show the emotion or bias and give a calmer decision rule.",
};

const DEFAULTS = {
  date: "unscheduled",
  category: "Wealth Building",
  difficulty: "Beginner",
  platform: "Both",
  status: "Planned",
  angle: "Make the idea simple, practical, and memorable.",
  audience: "Beginner investors and young wealth builders",
  cta: "Save this and follow UNLOAN for beginner-friendly investing education.",
};

const DISCLAIMER = "Educational content only. This is not financial advice.";

function parseArgs(argv) {
  const args = {
    calendar: DEFAULT_CALENDAR,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--calendar") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--calendar requires a path.");
      }
      args.calendar = path.isAbsolute(value) ? value : path.join(ROOT, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase();
}

function firstPresent(row, field) {
  for (const alias of FIELD_ALIASES[field]) {
    const value = row[alias];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return DEFAULTS[field] || "";
}

function slugify(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}

async function loadCalendar(calendarPath) {
  let text;
  try {
    text = await readFile(calendarPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `Calendar not found: ${calendarPath}. Create content_calendar/master_calendar.csv first.`,
      );
    }
    throw error;
  }

  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length === 0) {
    throw new Error(`Calendar is empty or missing a header row: ${calendarPath}`);
  }

  const headers = rows[0].map(normalizeHeader);
  return rows
    .slice(1)
    .map((values, rowIndex) => {
      const row = Object.fromEntries(
        headers.map((header, index) => [header, (values[index] || "").trim()]),
      );
      const topic = firstPresent(row, "topic");
      if (!topic) {
        return null;
      }

      const contentTopic = {
        index: rowIndex + 1,
        date: firstPresent(row, "date"),
        category: firstPresent(row, "category"),
        topic,
        difficulty: firstPresent(row, "difficulty"),
        platform: firstPresent(row, "platform"),
        status: firstPresent(row, "status"),
        angle: firstPresent(row, "angle"),
        audience: firstPresent(row, "audience"),
        cta: firstPresent(row, "cta"),
      };

      return {
        ...contentTopic,
        slug: `${slugify(contentTopic.date)}-${String(contentTopic.index).padStart(2, "0")}-${slugify(
          contentTopic.topic,
        )}`,
      };
    })
    .filter(Boolean);
}

async function loadPrompt(name) {
  return (await readFile(path.join(PROMPT_DIR, name), "utf8")).trim();
}

function fillTemplate(template, topic) {
  return template.replace(
    /\{\{(date|category|pillar|topic|difficulty|platform|status|angle|audience|cta|disclaimer)\}\}/g,
    (_match, key) => {
      if (key === "pillar") {
        return topic.category;
      }
      if (key === "disclaimer") {
        return DISCLAIMER;
      }
      return topic[key] ?? "";
    },
  );
}

function metadata(topic) {
  return [
    `- Date: ${topic.date}`,
    `- Topic: ${topic.topic}`,
    `- Category: ${topic.category}`,
    `- Difficulty: ${topic.difficulty}`,
    `- Platform: ${topic.platform}`,
    `- Status: ${topic.status}`,
  ].join("\n");
}

function humanizeTopic(topic) {
  return topic.charAt(0).toLowerCase() + topic.slice(1);
}

function makeHook(topic) {
  const category = topic.category.toLowerCase();
  const plainTopic = humanizeTopic(topic.topic);
  if (category.includes("trading platform")) {
    return `One wrong order click can change your risk before you even notice it.`;
  }
  if (category.includes("trading basics")) {
    return `Most trading mistakes start before the trade is placed.`;
  }
  if (category.includes("terminology")) {
    return `This one number can look smart, but mislead beginners fast.`;
  }
  if (category.includes("behavioral")) {
    return `Your portfolio is not the only thing moving. Your emotions are too.`;
  }
  if (category.includes("stock market")) {
    return `Before you buy your first stock, know what this term is really telling you.`;
  }
  return `What would you do differently if your next ₹10,000 had a clear job?`;
}

function makeRealLifeProblem(topic) {
  const category = topic.category.toLowerCase();
  const plainTopic = humanizeTopic(topic.topic);
  if (category.includes("trading")) {
    return `A young investor sees a fast-moving price, enters quickly, and only later asks, "How much could I lose here?"`;
  }
  if (category.includes("terminology") || category.includes("stock market")) {
    return `You see ${plainTopic} on an app, a post, or a portfolio screenshot, but you are not sure whether it actually helps your decision.`;
  }
  if (category.includes("behavioral")) {
    return `Your SIP is running, your portfolio is red for a week, and suddenly every social media post makes you doubt your plan.`;
  }
  return `You have ₹10,000 available, but you are split between spending it, saving it, starting a SIP, or keeping it for emergencies.`;
}

function makeSimpleExplanation(topic) {
  const category = topic.category.toLowerCase();
  const plainTopic = humanizeTopic(topic.topic);
  if (category.includes("trading platform")) {
    return `${topic.topic} is a feature that helps you control how an order behaves, but it still needs a clear plan and risk limit.`;
  }
  if (category.includes("trading basics")) {
    return `${topic.topic} is about deciding the risk before thinking about the possible reward.`;
  }
  if (category.includes("terminology") || category.includes("stock market")) {
    return `${topic.topic} is a lens for understanding a business or market idea, not a green signal to buy anything.`;
  }
  if (category.includes("behavioral")) {
    return `${topic.topic} is a behavior pattern that can push investors into rushed decisions.`;
  }
  return `${topic.topic} helps you give money a purpose instead of reacting emotionally to every choice.`;
}

function makePracticalExample(topic) {
  const category = topic.category.toLowerCase();
  if (category.includes("trading platform")) {
    return `If you are placing an order worth ₹10,000, decide the entry, exit, and maximum loss before using the feature. The tool should follow your plan, not replace it.`;
  }
  if (category.includes("trading basics")) {
    return `If a ₹10,000 trade can lose ₹500, ask whether the possible reward is worth that risk before entering. If the answer is unclear, the trade is unclear.`;
  }
  if (category.includes("terminology") || category.includes("stock market")) {
    return `If two companies are in your watchlist, do not use one metric alone. Combine it with debt, growth, cash flow, and your overall portfolio risk.`;
  }
  if (category.includes("behavioral")) {
    return `If your ₹10,000 SIP falls for a month, pause before stopping it. Ask whether your goal changed, or only your mood changed.`;
  }
  return `If you receive ₹10,000, you might split it between emergency cash, a SIP, and a goal-based bucket. The point is not excitement; it is direction.`;
}

function makeTakeaway(topic) {
  return `Use ${humanizeTopic(topic.topic)} as a decision filter, not as a shortcut.`;
}

function makeThumbnailTitle(topic) {
  const cleanTopic = topic.topic.replace(/\s+/g, " ").trim();
  if (cleanTopic.length <= 24) {
    return `${cleanTopic}: Learn It Simply`;
  }
  return cleanTopic;
}

function makeCaption(topic) {
  return [
    makeHook(topic),
    "",
    makeRealLifeProblem(topic),
    "",
    `Simple explanation: ${makeSimpleExplanation(topic)}`,
    "",
    `Example: ${makePracticalExample(topic)}`,
    "",
    makeTakeaway(topic),
    "",
    `CTA: ${topic.cta}`,
    "",
    DISCLAIMER,
  ].join("\n");
}

function buildHashtags(topic) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "before",
    "for",
    "from",
    "how",
    "of",
    "the",
    "to",
    "why",
    "with",
    "your",
  ]);
  const topicTags = topic.topic
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word && !stopWords.has(word.toLowerCase()))
    .slice(0, 5)
    .map((word) => `#${word.toLowerCase()}`);
  const categoryTags = topic.category
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word && !stopWords.has(word.toLowerCase()))
    .slice(0, 3)
    .map((word) => `#${word.toLowerCase()}`);
  const baseTags = [
    "#UNLOAN",
    "#BuildWealthNotDebt",
    "#UNLOANMedia",
    "#BeginnerInvesting",
    "#StockMarketBasics",
    "#PersonalFinance",
    "#InvestingEducation",
    "#NoFinancialAdvice",
  ];
  return [...new Set([...baseTags.slice(0, 3), ...topicTags, ...categoryTags, ...baseTags.slice(3)])].slice(0, 15);
}

function fenced(content) {
  return `\`\`\`text\n${content}\n\`\`\``;
}

async function buildReel(topic) {
  return [
    `# Reel Script: ${topic.topic}`,
    "",
    metadata(topic),
    "",
    "## Draft",
    "",
    "Duration: 30-45 seconds",
    "",
    "1. Attention-Grabbing Hook (0-3s)",
    `Voiceover: ${makeHook(topic)}`,
    `On-screen text: ${makeThumbnailTitle(topic)}`,
    "",
    "2. Real-Life Problem",
    `Voiceover: ${makeRealLifeProblem(topic)}`,
    "",
    "3. Simple Explanation",
    `Voiceover: ${makeSimpleExplanation(topic)}`,
    "",
    "4. Practical Example",
    `Voiceover: ${makePracticalExample(topic)}`,
    "",
    "5. Key Takeaway",
    `Voiceover: ${makeTakeaway(topic)}`,
    "",
    "6. CTA",
    `Voiceover: ${topic.cta}`,
    "",
    `Compliance Note: ${DISCLAIMER}`,
    "",
    "## Reusable Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("reel_script.md"), topic)),
  ].join("\n");
}

async function buildShort(topic) {
  return [
    `# YouTube Short Script: ${topic.topic}`,
    "",
    metadata(topic),
    "",
    "## Draft",
    "",
    "Duration: under 60 seconds",
    "",
    "1. Attention-Grabbing Hook (0-3s)",
    makeHook(topic),
    "",
    "2. Real-Life Problem",
    makeRealLifeProblem(topic),
    "",
    "3. Simple Explanation",
    makeSimpleExplanation(topic),
    "",
    "4. Practical Example",
    makePracticalExample(topic),
    "",
    "5. Key Takeaway",
    makeTakeaway(topic),
    "",
    "6. CTA",
    topic.cta,
    "",
    `Compliance Note: ${DISCLAIMER}`,
    "",
    "## Reusable Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("youtube_short_script.md"), topic)),
  ].join("\n");
}

async function buildCaption(topic) {
  return [
    `# Caption: ${topic.topic}`,
    "",
    metadata(topic),
    "",
    "## Draft Caption",
    "",
    makeCaption(topic),
    "",
    "## Hashtags",
    "",
    buildHashtags(topic).join(" "),
    "",
    "## Call To Action",
    "",
    topic.cta,
    "",
    "## Reusable Caption Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("caption.md"), topic)),
    "",
    "## Reusable Hashtag Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("hashtags.md"), topic)),
  ].join("\n");
}

async function buildThumbnail(topic) {
  return [
    `# Thumbnail: ${topic.topic}`,
    "",
    metadata(topic),
    "",
    "## Thumbnail Title",
    "",
    makeThumbnailTitle(topic),
    "",
    "## Supporting Text",
    "",
    `${topic.difficulty} guide. No hype. No stock tips.`,
    "",
    "## Visual Direction",
    "",
    "- Use clear, high-contrast text.",
    "- Show one concept only.",
    "- Avoid profit screenshots, guaranteed-return language, or specific stock logos.",
    "",
    "## Call To Action",
    "",
    topic.cta,
    "",
    "## Reusable Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("thumbnail_title.md"), topic)),
  ].join("\n");
}

async function writeOutputs(topics, dryRun) {
  const written = [];
  if (!dryRun) {
    await Promise.all(Object.values(OUTPUT_DIRS).map((dir) => mkdir(dir, { recursive: true })));
  }

  const builders = {
    reel: buildReel,
    short: buildShort,
    caption: buildCaption,
    thumbnail: buildThumbnail,
  };

  for (const topic of topics) {
    for (const [contentType, builder] of Object.entries(builders)) {
      const outputPath = path.join(OUTPUT_DIRS[contentType], `${topic.slug}.md`);
      written.push(outputPath);
      if (!dryRun) {
        await writeFile(outputPath, `${await builder(topic)}\n`, "utf8");
      }
    }
  }

  return written;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const topics = await loadCalendar(args.calendar);
  if (topics.length === 0) {
    throw new Error(`No usable topics found in ${args.calendar}. Add at least one topic row.`);
  }

  const written = await writeOutputs(topics, args.dryRun);
  const action = args.dryRun ? "Would generate" : "Generated";
  console.log(`${action} ${written.length} files from ${topics.length} topics.`);
  for (const outputPath of written) {
    console.log(path.relative(ROOT, outputPath));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
