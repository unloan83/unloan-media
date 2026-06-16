import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CALENDAR_PATH = path.join(ROOT, "content_calendar", "master_calendar.csv");
const CONTENT_DIR = path.join(ROOT, "content");
const OUTPUT_DIRS = {
  visualBriefs: path.join(CONTENT_DIR, "visual_briefs"),
  canvaPackages: path.join(CONTENT_DIR, "canva_packages"),
  metadata: path.join(CONTENT_DIR, "metadata"),
  packages: path.join(CONTENT_DIR, "weekly_packages"),
};

const READINESS_STATUSES = ["Draft", "Ready", "Approved", "Published"];

const CATEGORY_TO_VISUAL_SYSTEM = {
  "Wealth Building": "Wealth Building",
  "Trading Basics": "Trading Basics",
  "Trading Platform Features": "Investor Toolkit",
  "Behavioral Finance": "Behavioral Finance",
  "Stock Market Basics": "Market Vocabulary",
  "Investor Terminology": "Market Vocabulary",
};

const VISUAL_SYSTEMS = {
  "Wealth Building": {
    mood: "Calm, aspirational, disciplined",
    icon: "Growth curve, calendar, savings jar, target",
    colorUse: "Use deep navy base with emerald highlights.",
  },
  "Trading Basics": {
    mood: "Cautious, practical, risk-aware",
    icon: "Chart line, shield, checklist, risk meter",
    colorUse: "Use deep navy base with amber risk highlights.",
  },
  "Investor Toolkit": {
    mood: "Utility-led, precise, platform education",
    icon: "Order ticket, slider, toggle, dashboard panel",
    colorUse: "Use charcoal panels with cyan functional highlights.",
  },
  "Behavioral Finance": {
    mood: "Reflective, human, emotionally intelligent",
    icon: "Brain, pause button, mirror, decision fork",
    colorUse: "Use navy base with violet insight highlights.",
  },
  "Market Vocabulary": {
    mood: "Clear, dictionary-like, beginner friendly",
    icon: "Book, label, magnifier, definition card",
    colorUse: "Use white space, navy text, and gold term highlights.",
  },
};

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
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

function rowsToObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/u, ""));
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((values, rowIndex) => ({
    index: rowIndex + 1,
    ...Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])),
  }));
}

async function readCsvObjects(filePath) {
  return rowsToObjects(await readFile(filePath, "utf8"));
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function slugify(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}

function topicSlug(topic) {
  return `${slugify(topic.Date)}-${String(topic.index).padStart(2, "0")}-${slugify(topic.Topic)}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function makeKeywords(topic) {
  return [
    "UNLOAN",
    "beginner investing",
    topic.Topic,
    topic.Category,
    topic.Difficulty,
    "financial education",
    "no financial advice",
  ].map((item) => String(item).toLowerCase());
}

function visualSystemFor(topic) {
  const name = CATEGORY_TO_VISUAL_SYSTEM[topic.Category] ?? "Market Vocabulary";
  return {
    name,
    ...VISUAL_SYSTEMS[name],
  };
}

function makeThumbnail(topic) {
  if (topic.Topic.length <= 20) {
    return `${topic.Topic} Explained Simply`;
  }
  return topic.Topic;
}

function makeSceneBrief(topic) {
  const system = visualSystemFor(topic);
  return [
    `# Visual Brief: ${topic.Topic}`,
    "",
    `Visual System: ${system.name}`,
    `Mood: ${system.mood}`,
    `Color Use: ${system.colorUse}`,
    `Primary Icon Language: ${system.icon}`,
    "",
    "## Scene-By-Scene Instructions",
    "",
    "| Scene | Duration | Visual Direction | On-Screen Text | Production Notes |",
    "| --- | --- | --- | --- | --- |",
    `| 1 | 0-3s | Open with a clean title card and one simple symbol. | ${makeThumbnail(topic)} | Keep text large and readable on mobile. |`,
    `| 2 | 3-10s | Show the concept as a simple diagram or two-column comparison. | What it means | Avoid broker screens, profit screenshots, or stock logos. |`,
    `| 3 | 10-25s | Use a beginner example with plain shapes, labels, and arrows. | Beginner example | Explain the concept without recommending action. |`,
    `| 4 | 25-35s | Show a caution card or checklist. | Remember the risk | Reinforce no guarantees and no buy/sell signal. |`,
    `| 5 | 35-45s | End with branded CTA frame. | ${topic.CTA} | Add educational disclaimer in small readable text. |`,
    "",
    "## Compliance Notes",
    "",
    "- No stock recommendations.",
    "- No return guarantees.",
    "- No profit claims.",
    "- Include: Educational content only. This is not financial advice.",
  ].join("\n");
}

function makeCanvaPackage(topic) {
  const system = visualSystemFor(topic);
  return [
    `# Canva Package: ${topic.Topic}`,
    "",
    "## Canva-Ready Specification",
    "",
    `Headline: ${makeThumbnail(topic)}`,
    `Format: 1080x1920 vertical short-form package`,
    `Visual System: ${system.name}`,
    `CTA: ${topic.CTA}`,
    "",
    "## Slide Structure",
    "",
    "1. Cover slide: topic headline, category tag, UNLOAN mark.",
    "2. Definition slide: one plain-English meaning.",
    "3. Example slide: simple beginner scenario or analogy.",
    "4. Risk slide: what not to assume.",
    "5. CTA slide: save, share, comment, or follow prompt.",
    "",
    "## Branding Notes",
    "",
    "- Use UNLOAN navy as the dominant background.",
    "- Use emerald for wealth-building confidence, amber for risk notes, cyan for tools, violet for behavior, and gold for vocabulary terms.",
    "- Keep layouts spacious with large mobile-readable headlines.",
    "- Keep all visuals educational, not promotional.",
    "- Do not use platform logos as proof of publishing or performance.",
  ].join("\n");
}

function makeMetadata(topic, slug) {
  return {
    topic: topic.Topic,
    category: topic.Category,
    difficulty: topic.Difficulty,
    platform: topic.Platform,
    status: "Draft",
    allowedStatuses: READINESS_STATUSES,
    cta: topic.CTA,
    thumbnail: makeThumbnail(topic),
    keywords: makeKeywords(topic),
    sourceFiles: {
      reel: `content/reels/${slug}.md`,
      short: `content/shorts/${slug}.md`,
      caption: `content/captions/${slug}.md`,
      thumbnail: `content/thumbnails/${slug}.md`,
      visualBrief: `content/visual_briefs/${slug}.md`,
      canvaPackage: `content/canva_packages/${slug}.md`,
    },
  };
}

function buildBalancedWeeks(topics) {
  const weeks = [];
  for (let index = 0; index < topics.length; index += 6) {
    weeks.push({
      weekNumber: Math.floor(index / 6) + 1,
      items: topics.slice(index, index + 6),
    });
  }
  return weeks;
}

function sectionForTopic(library, topic) {
  const marker = `## ${topic.Topic}`;
  const start = library.indexOf(marker);
  if (start === -1) {
    return "";
  }
  const next = library.indexOf("\n## ", start + marker.length);
  return library.slice(start, next === -1 ? undefined : next).trim();
}

async function buildTopicPackage(topic, slug, libraries) {
  const [reel, short, caption, thumbnail, visualBrief, canvaPackage, metadata] = await Promise.all([
    readOptional(path.join(CONTENT_DIR, "reels", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "shorts", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "captions", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "thumbnails", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "visual_briefs", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "canva_packages", `${slug}.md`)),
    readOptional(path.join(CONTENT_DIR, "metadata", `${slug}.json`)),
  ]);
  const hooks = sectionForTopic(libraries.hooks, topic);
  const thumbnailTitles = sectionForTopic(libraries.thumbnailTitles, topic);

  return {
    scripts: [
      `# Scripts: ${topic.Topic}`,
      "",
      "## Reel",
      "",
      reel,
      "",
      "## YouTube Short",
      "",
      short,
    ].join("\n").trim(),
    caption,
    hooks,
    thumbnailTitles: [thumbnailTitles, "", "## Existing Thumbnail Asset", "", thumbnail].join("\n").trim(),
    visualBrief,
    canvaPackage,
    metadata,
  };
}

async function writeOutput(filePath, content, dryRun, written) {
  written.push(filePath);
  if (dryRun) {
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${String(content).trimEnd()}\n`, "utf8");
}

function statusCsv(topics) {
  const headers = ["Date", "Topic", "Category", "Package", "Status", "NextStep"];
  const rows = topics.map((topic) => [
    topic.Date,
    topic.Topic,
    topic.Category,
    topicSlug(topic),
    "Draft",
    "Review scripts, visual brief, Canva package, metadata, and compliance notes.",
  ]);
  return [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const topics = await readCsvObjects(CALENDAR_PATH);
  const written = [];
  const libraries = {
    hooks: await readOptional(path.join(CONTENT_DIR, "hooks", "reusable_hooks.md")),
    thumbnailTitles: await readOptional(path.join(CONTENT_DIR, "hooks", "thumbnail_titles.md")),
  };

  for (const topic of topics) {
    const slug = topicSlug(topic);
    const visualBrief = makeSceneBrief(topic);
    const canvaPackage = makeCanvaPackage(topic);
    const metadata = JSON.stringify(makeMetadata(topic, slug), null, 2);

    await writeOutput(path.join(OUTPUT_DIRS.visualBriefs, `${slug}.md`), visualBrief, args.dryRun, written);
    await writeOutput(path.join(OUTPUT_DIRS.canvaPackages, `${slug}.md`), canvaPackage, args.dryRun, written);
    await writeOutput(path.join(OUTPUT_DIRS.metadata, `${slug}.json`), metadata, args.dryRun, written);
  }

  await writeOutput(path.join(CONTENT_DIR, "publishing_status.csv"), statusCsv(topics), args.dryRun, written);

  for (const week of buildBalancedWeeks(topics)) {
    const weekDir = path.join(OUTPUT_DIRS.packages, `week-${String(week.weekNumber).padStart(2, "0")}`);
    const manifest = [];
    for (const topic of week.items) {
      const slug = topicSlug(topic);
      const topicPackage = await buildTopicPackage(topic, slug, libraries);
      const packageDir = path.join(weekDir, slug);
      manifest.push({
        topic: topic.Topic,
        category: topic.Category,
        difficulty: topic.Difficulty,
        status: "Draft",
        packagePath: `content/weekly_packages/week-${String(week.weekNumber).padStart(2, "0")}/${slug}`,
      });
      await writeOutput(path.join(packageDir, "scripts.md"), topicPackage.scripts, args.dryRun, written);
      await writeOutput(path.join(packageDir, "caption_and_hashtags.md"), topicPackage.caption, args.dryRun, written);
      await writeOutput(path.join(packageDir, "hooks.md"), topicPackage.hooks, args.dryRun, written);
      await writeOutput(path.join(packageDir, "thumbnail_titles.md"), topicPackage.thumbnailTitles, args.dryRun, written);
      await writeOutput(path.join(packageDir, "visual_brief.md"), topicPackage.visualBrief, args.dryRun, written);
      await writeOutput(path.join(packageDir, "canva_package.md"), topicPackage.canvaPackage, args.dryRun, written);
      await writeOutput(path.join(packageDir, "metadata.json"), topicPackage.metadata, args.dryRun, written);
    }
    await writeOutput(path.join(weekDir, "manifest.json"), JSON.stringify(manifest, null, 2), args.dryRun, written);
  }

  const action = args.dryRun ? "Would write" : "Wrote";
  console.log(`${action} ${written.length} Phase 4 package files.`);
  for (const filePath of written) {
    console.log(path.relative(ROOT, filePath));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
