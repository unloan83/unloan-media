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
    return `${topic.topic} is a tool, not a shortcut to profit.`;
  }
  if (category.includes("trading basics")) {
    return `Before trying ${plainTopic}, learn the risk first.`;
  }
  if (category.includes("terminology")) {
    return `${topic.topic} sounds complex, but beginners can understand it in one minute.`;
  }
  if (category.includes("behavioral")) {
    return `The hardest part of investing is often your own reaction.`;
  }
  if (category.includes("stock market")) {
    return `If you are new to stocks, ${plainTopic} is one term you should know.`;
  }
  return `${topic.topic} is a beginner money concept that can change how you plan.`;
}

function makeSimpleDefinition(topic) {
  return `${topic.topic} means understanding the concept clearly before using it in real money decisions.`;
}

function makeTakeaway(topic) {
  return `Learn ${humanizeTopic(topic.topic)} first, then make calm and informed decisions.`;
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
    CATEGORY_GUIDANCE[topic.category] ?? topic.angle,
    "",
    `Simple meaning: ${makeSimpleDefinition(topic)}`,
    "",
    "Beginner rule:",
    "- Understand the term.",
    "- Know the risk.",
    "- Avoid decisions based on hype.",
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
    `Hook: ${makeHook(topic)}`,
    "",
    "Scene Plan:",
    `1. Open with on-screen text: "${makeThumbnailTitle(topic)}".`,
    `2. Define the concept: ${makeSimpleDefinition(topic)}`,
    `3. Beginner example: Use a simple daily-money or investing situation, without naming stocks.`,
    "4. Risk reminder: Do not use this as a buy/sell signal or profit promise.",
    `5. Close with: "${makeTakeaway(topic)}"`,
    "",
    `CTA: ${topic.cta}`,
    `Disclaimer: ${DISCLAIMER}`,
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
    `Opening Hook: ${makeHook(topic)}`,
    "",
    "Script:",
    `- ${topic.topic} is not something to memorize. It is something to understand.`,
    `- Simple meaning: ${makeSimpleDefinition(topic)}`,
    `- Why it matters: ${CATEGORY_GUIDANCE[topic.category] ?? topic.angle}`,
    "- Beginner check: never treat one term, ratio, or order type as a guaranteed result.",
    `- ${makeTakeaway(topic)}`,
    "",
    "Pattern Interrupt: Show the term on screen, then replace jargon with a one-line plain-English meaning.",
    `Closing CTA: ${topic.cta}`,
    `Disclaimer: ${DISCLAIMER}`,
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
