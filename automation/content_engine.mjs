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
};

const FIELD_ALIASES = {
  date: ["date", "publish_date", "scheduled_date"],
  pillar: ["pillar", "content_pillar", "category"],
  topic: ["topic", "title", "content_topic", "idea"],
  angle: ["angle", "hook_angle", "creative_angle"],
  audience: ["audience", "audience_segment", "target_audience"],
  cta: ["cta", "call_to_action", "call_to-action"],
};

const DEFAULTS = {
  date: "unscheduled",
  pillar: "Wealth Building",
  angle: "Make the idea simple, practical, and memorable.",
  audience: "Young investors aged 20 to 35",
  cta: "Save this and follow UNLOAN for practical wealth-building ideas.",
};

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
        pillar: firstPresent(row, "pillar"),
        topic,
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
  return template.replace(/\{\{(date|pillar|topic|angle|audience|cta)\}\}/g, (_match, key) => {
    return topic[key];
  });
}

function metadata(topic) {
  return [
    `- Date: ${topic.date}`,
    `- Pillar: ${topic.pillar}`,
    `- Audience: ${topic.audience}`,
    `- Angle: ${topic.angle}`,
  ].join("\n");
}

function makeHook(topic) {
  const pillar = topic.pillar.toLowerCase();
  const plainTopic = humanizeTopic(topic.topic);
  if (pillar.includes("behaviour") || pillar.includes("behavior")) {
    return `The biggest investing risk around ${plainTopic} may be your own reaction.`;
  }
  if (pillar.includes("freedom")) {
    return `${topic.topic} is not about escaping work. It is about buying choices.`;
  }
  if (pillar.includes("fundamental") || pillar.includes("invest")) {
    return `Before you act on ${plainTopic}, understand this first.`;
  }
  return `${topic.topic} matters more than most new investors think.`;
}

function makeTakeaway(topic) {
  return `Build wealth with systems, patience, and clear rules around ${humanizeTopic(topic.topic)}.`;
}

function humanizeTopic(topic) {
  return topic.charAt(0).toLowerCase() + topic.slice(1);
}

function makeCaption(topic) {
  return [
    makeHook(topic),
    "",
    topic.angle,
    "",
    "The goal is not to look rich for a weekend.",
    "The goal is to make decisions your future self will thank you for.",
    "",
    makeTakeaway(topic),
    "",
    topic.cta,
    "",
    "Educational content only. This is not investment advice.",
  ].join("\n");
}

function buildHashtags(topic) {
  const stopWords = new Set(["a", "an", "and", "are", "before", "for", "from", "how", "the", "to", "why", "with", "your"]);
  const topicTags = topic.topic
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word && !stopWords.has(word.toLowerCase()))
    .slice(0, 5)
    .map((word) => `#${word.toLowerCase()}`);
  const baseTags = [
    "#UNLOAN",
    "#BuildWealthNotDebt",
    "#UNLOANMedia",
    "#PersonalFinance",
    "#InvestingBasics",
    "#WealthBuilding",
    "#FinancialFreedom",
    "#MoneyMindset",
  ];
  return [...new Set([...baseTags.slice(0, 3), ...topicTags, ...baseTags.slice(3)])].slice(0, 13);
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
    `Hook: ${makeHook(topic)}`,
    "",
    "Scene Plan:",
    `1. Open with on-screen text: "${topic.topic}".`,
    `2. Name the money mistake or opportunity: ${topic.angle}`,
    "3. Break it into one simple wealth-building principle.",
    "4. Give a practical example a young investor can recognize.",
    `5. Close with: "${makeTakeaway(topic)}"`,
    "",
    `CTA: ${topic.cta}`,
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
    `Opening Hook: ${makeHook(topic)}`,
    "",
    "Script:",
    `- Most people hear "${topic.topic}" and make it complicated.`,
    `- Here is the simpler lens: ${topic.angle}`,
    "- Wealth is built by repeatable decisions, not one lucky move.",
    "- Learn the rule, apply it calmly, and review it often.",
    `- ${makeTakeaway(topic)}`,
    "",
    "Pattern Interrupt: Show a before/after text overlay with the old belief crossed out.",
    `Closing CTA: ${topic.cta}`,
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
    "## Reusable Caption Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("caption.md"), topic)),
    "",
    "## Reusable Hashtag Prompt",
    "",
    fenced(fillTemplate(await loadPrompt("hashtags.md"), topic)),
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
