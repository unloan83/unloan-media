import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CALENDAR_PATH = path.join(ROOT, "content_calendar", "master_calendar.csv");
const ANALYTICS_PATH = path.join(ROOT, "analytics", "tracking_template.csv");
const OUTPUTS = {
  weeklyPlans: path.join(ROOT, "content", "weekly_plans"),
  hooks: path.join(ROOT, "content", "hooks"),
  ctas: path.join(ROOT, "content", "ctas"),
  recommendations: path.join(ROOT, "content", "recommendations"),
  analytics: path.join(ROOT, "analytics"),
};

const CATEGORIES = [
  "Wealth Building",
  "Stock Market Basics",
  "Trading Basics",
  "Trading Platform Features",
  "Investor Terminology",
  "Behavioral Finance",
];

const REUSABLE_CTA_LIBRARY = [
  {
    intent: "Save",
    cta: "Save this for your beginner investing checklist.",
  },
  {
    intent: "Share",
    cta: "Share this with someone starting their stock market journey.",
  },
  {
    intent: "Comment",
    cta: "Comment LEARN if you want more simple investing lessons.",
  },
  {
    intent: "Follow",
    cta: "Follow UNLOAN for beginner-friendly investing education.",
  },
  {
    intent: "Review",
    cta: "Revisit this before using the term in a real money decision.",
  },
  {
    intent: "Reflect",
    cta: "Write down the one risk you should remember from this lesson.",
  },
];

const FUTURE_TOPIC_IDEAS = {
  "Wealth Building": [
    "Emergency Fund",
    "Asset Allocation",
    "Goal-Based Investing",
  ],
  "Stock Market Basics": [
    "Primary Market",
    "Secondary Market",
    "Index",
  ],
  "Trading Basics": [
    "Position Sizing",
    "Trade Journal",
    "Risk Reward Ratio",
  ],
  "Trading Platform Features": [
    "Order Validity",
    "AMO Orders",
    "Watchlist Setup",
  ],
  "Investor Terminology": [
    "Debt to Equity Ratio",
    "Free Cash Flow",
    "Operating Margin",
  ],
  "Behavioral Finance": [
    "Loss Aversion",
    "Anchoring Bias",
    "Herd Mentality",
  ],
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

  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])),
  );
}

async function readCsvObjects(filePath) {
  try {
    return rowsToObjects(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toNumber(value) {
  const number = Number.parseFloat(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
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

function topicKey(item) {
  return `${item.Topic}|${item.Category}`.toLowerCase();
}

function analyticsByTopic(rows) {
  return new Map(rows.map((row) => [topicKey(row), row]));
}

function scoreRow(row) {
  const views = toNumber(row.Views);
  const likes = toNumber(row.Likes);
  const comments = toNumber(row.Comments);
  const shares = toNumber(row.Shares);
  const saves = toNumber(row.Saves);
  const followers = toNumber(row.Followers);
  const engagement = likes + comments * 2 + shares * 3 + saves * 4 + followers * 5;
  const engagementRate = views > 0 ? engagement / views : 0;
  const score = Math.round(engagement + engagementRate * 1000);

  let growthBand = "Low Growth";
  if (score >= 80 || engagementRate >= 0.08) {
    growthBand = "High Growth";
  } else if (score >= 30 || engagementRate >= 0.03) {
    growthBand = "Medium Growth";
  }

  return {
    views,
    likes,
    comments,
    shares,
    saves,
    followers,
    engagement,
    engagementRate,
    score,
    growthBand,
  };
}

function buildBalancedWeeks(topics) {
  const queues = new Map(CATEGORIES.map((category) => [category, []]));
  for (const topic of topics) {
    const queue = queues.get(topic.Category) ?? [];
    queue.push(topic);
    queues.set(topic.Category, queue);
  }

  const weeks = [];
  let weekNumber = 1;
  while ([...queues.values()].some((queue) => queue.length > 0)) {
    const weekItems = [];
    for (const category of CATEGORIES) {
      const item = queues.get(category)?.shift();
      if (item) {
        weekItems.push(item);
      }
    }
    weeks.push({ weekNumber, items: weekItems });
    weekNumber += 1;
  }

  return weeks;
}

function makeHooks(topic) {
  return [
    `If you are new to investing, ${topic.Topic} is one term worth learning slowly.`,
    `${topic.Topic} sounds technical, but the beginner meaning is simple.`,
    `Before you use ${topic.Topic} in real money decisions, understand this first.`,
    `Most beginners hear ${topic.Topic} and overcomplicate it.`,
    `${topic.Topic} is not a shortcut. It is a concept to understand.`,
    `Here is ${topic.Topic} explained without jargon.`,
    `The mistake beginners make with ${topic.Topic} is treating it like a guarantee.`,
    `Learn ${topic.Topic} before you follow market noise.`,
  ];
}

function makeThumbnailTitles(topic) {
  return [
    `${topic.Topic} Explained Simply`,
    `${topic.Topic} For Beginners`,
    `Learn ${topic.Topic} First`,
    `${topic.Topic}: No Jargon`,
    `${topic.Topic} In One Minute`,
  ];
}

function buildWeeklyPlan(week) {
  const rows = week.items.map((item, index) => {
    const day = `Day ${index + 1}`;
    return `| ${day} | ${item.Topic} | ${item.Category} | ${item.Difficulty} | ${item.Platform} | ${item.Status} |`;
  });
  const categories = [...new Set(week.items.map((item) => item.Category))].join(", ");

  return [
    `# Weekly Content Plan ${String(week.weekNumber).padStart(2, "0")}`,
    "",
    `Balanced categories: ${categories}`,
    "",
    "| Slot | Topic | Category | Difficulty | Platform | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "Planning note: This schedule rotates categories to avoid overloading the audience with one type of content.",
    "",
    "Repository-only boundary: no scheduling, publishing, authentication, or external API connection is performed.",
  ].join("\n");
}

function buildHooksLibrary(topics) {
  return [
    "# Reusable Hook Library",
    "",
    "Use these hooks as starting points for educational short-form content. Avoid hype, profit claims, and stock recommendations.",
    "",
    ...topics.flatMap((topic) => [
      `## ${topic.Topic}`,
      "",
      `Category: ${topic.Category}`,
      "",
      ...makeHooks(topic).map((hook, index) => `${index + 1}. ${hook}`),
      "",
    ]),
  ].join("\n");
}

function buildThumbnailLibrary(topics) {
  return [
    "# Thumbnail Title Library",
    "",
    "Titles should be clear, educational, and phone-readable. Avoid clickbait, urgency manipulation, or profit promises.",
    "",
    ...topics.flatMap((topic) => [
      `## ${topic.Topic}`,
      "",
      ...makeThumbnailTitles(topic).map((title, index) => `${index + 1}. ${title}`),
      "",
    ]),
  ].join("\n");
}

function buildCtaLibrary(topics) {
  const categoryCtas = CATEGORIES.flatMap((category) => [
    {
      intent: `${category} Save`,
      cta: `Save this ${category.toLowerCase()} lesson for later review.`,
    },
    {
      intent: `${category} Share`,
      cta: `Share this with someone learning ${category.toLowerCase()}.`,
    },
  ]);

  return [
    "# CTA Library",
    "",
    "Reusable CTAs for UNLOAN Media education posts.",
    "",
    "## Core CTAs",
    "",
    ...REUSABLE_CTA_LIBRARY.map((item) => `- ${item.intent}: ${item.cta}`),
    "",
    "## Category CTAs",
    "",
    ...categoryCtas.map((item) => `- ${item.intent}: ${item.cta}`),
    "",
    "## Topic CTAs",
    "",
    ...topics.map((topic) => `- ${topic.Topic}: Save this ${topic.Topic} lesson before making related real-money decisions.`),
  ].join("\n");
}

function buildTopicScores(topics, analyticsRows) {
  const analyticsMap = analyticsByTopic(analyticsRows);
  return topics.map((topic) => {
    const row = analyticsMap.get(topicKey(topic)) ?? topic;
    const score = scoreRow(row);
    return {
      Topic: topic.Topic,
      Category: topic.Category,
      Difficulty: topic.Difficulty,
      Platform: topic.Platform,
      Views: score.views,
      Likes: score.likes,
      Comments: score.comments,
      Shares: score.shares,
      Saves: score.saves,
      Followers: score.followers,
      Engagement: score.engagement,
      EngagementRate: score.engagementRate.toFixed(4),
      Score: score.score,
      GrowthBand: score.growthBand,
    };
  });
}

function buildCategoryPerformance(topicScores) {
  return CATEGORIES.map((category) => {
    const rows = topicScores.filter((row) => row.Category === category);
    const totalScore = rows.reduce((sum, row) => sum + row.Score, 0);
    const totalViews = rows.reduce((sum, row) => sum + row.Views, 0);
    const averageScore = rows.length > 0 ? totalScore / rows.length : 0;
    return {
      Category: category,
      Topics: rows.length,
      TotalViews: totalViews,
      AverageScore: averageScore.toFixed(2),
      HighGrowthTopics: rows.filter((row) => row.GrowthBand === "High Growth").length,
      MediumGrowthTopics: rows.filter((row) => row.GrowthBand === "Medium Growth").length,
      LowGrowthTopics: rows.filter((row) => row.GrowthBand === "Low Growth").length,
    };
  });
}

function toCsv(rows) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function buildRecommendations(categoryPerformance) {
  const ranked = [...categoryPerformance].sort(
    (a, b) => Number(b.AverageScore) - Number(a.AverageScore),
  );
  const topCategories = ranked
    .filter((item) => Number(item.AverageScore) > 0)
    .slice(0, 3);
  const fallbackCategories = topCategories.length > 0 ? topCategories : ranked.slice(0, 3);

  return [
    "# Future Topic Recommendations",
    "",
    "Recommendations are based on category performance from `analytics/tracking_template.csv` and remain repository-only.",
    "",
    "## Priority Categories",
    "",
    ...fallbackCategories.map(
      (item, index) =>
        `${index + 1}. ${item.Category} - average score ${item.AverageScore}, high growth topics ${item.HighGrowthTopics}`,
    ),
    "",
    "## Recommended Future Topics",
    "",
    ...fallbackCategories.flatMap((item) => [
      `### ${item.Category}`,
      "",
      ...(FUTURE_TOPIC_IDEAS[item.Category] ?? []).map((topic) => `- ${topic}`),
      "",
    ]),
    "## Optimization Notes",
    "",
    "- Repeat formats from categories with higher saves, shares, and follower growth.",
    "- Improve low-growth topics by testing clearer hooks and simpler thumbnail titles.",
    "- Do not convert recommendations into buy/sell advice or publishing automation.",
  ].join("\n");
}

async function writeOutput(filePath, content, dryRun, written) {
  written.push(filePath);
  if (dryRun) {
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${content.trimEnd()}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const topics = await readCsvObjects(CALENDAR_PATH);
  const analyticsRows = await readCsvObjects(ANALYTICS_PATH);

  if (topics.length === 0) {
    throw new Error("No topics found in content_calendar/master_calendar.csv.");
  }

  const written = [];
  const weeks = buildBalancedWeeks(topics);
  for (const week of weeks) {
    await writeOutput(
      path.join(OUTPUTS.weeklyPlans, `week-${String(week.weekNumber).padStart(2, "0")}.md`),
      buildWeeklyPlan(week),
      args.dryRun,
      written,
    );
  }

  await writeOutput(path.join(OUTPUTS.hooks, "reusable_hooks.md"), buildHooksLibrary(topics), args.dryRun, written);
  await writeOutput(
    path.join(OUTPUTS.hooks, "thumbnail_titles.md"),
    buildThumbnailLibrary(topics),
    args.dryRun,
    written,
  );
  await writeOutput(path.join(OUTPUTS.ctas, "cta_library.md"), buildCtaLibrary(topics), args.dryRun, written);

  const topicScores = buildTopicScores(topics, analyticsRows);
  const categoryPerformance = buildCategoryPerformance(topicScores);
  await writeOutput(path.join(OUTPUTS.analytics, "topic_scores.csv"), toCsv(topicScores), args.dryRun, written);
  await writeOutput(
    path.join(OUTPUTS.analytics, "category_performance.csv"),
    toCsv(categoryPerformance),
    args.dryRun,
    written,
  );
  await writeOutput(
    path.join(OUTPUTS.recommendations, "future_topics.md"),
    buildRecommendations(categoryPerformance),
    args.dryRun,
    written,
  );

  const action = args.dryRun ? "Would write" : "Wrote";
  console.log(`${action} ${written.length} Phase 3 operations files.`);
  for (const outputPath of written) {
    console.log(path.relative(ROOT, outputPath));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
