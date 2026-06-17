import path from "node:path";
import { PATHS } from "../config.mjs";
import { readCsvObjects, toCsv, writeText } from "../utils/file_helpers.mjs";

const SEEDED_TRENDS = [
  {
    Date: "2026-06-17",
    Topic: "Emergency Fund Before Investing",
    Category: "Wealth Building",
    Signal: "Beginner money foundation",
    SourceType: "Manual research",
    Priority: "High",
  },
  {
    Date: "2026-06-17",
    Topic: "Position Sizing For Beginners",
    Category: "Trading Basics",
    Signal: "Risk education demand",
    SourceType: "Manual research",
    Priority: "High",
  },
  {
    Date: "2026-06-17",
    Topic: "Order Validity Explained",
    Category: "Investor Toolkit",
    Signal: "Platform feature education",
    SourceType: "Manual research",
    Priority: "Medium",
  },
  {
    Date: "2026-06-17",
    Topic: "Free Cash Flow Basics",
    Category: "Market Vocabulary",
    Signal: "Fundamental terminology",
    SourceType: "Manual research",
    Priority: "Medium",
  },
  {
    Date: "2026-06-17",
    Topic: "Loss Aversion In Investing",
    Category: "Behavioral Finance",
    Signal: "Decision psychology",
    SourceType: "Manual research",
    Priority: "High",
  },
];

export async function seedTrendingTopics() {
  const filePath = path.join(PATHS.marketIntelligence, "trending_topics.csv");
  const existing = await readCsvObjects(filePath);
  if (existing.length > 0) {
    return existing;
  }
  await writeText(filePath, toCsv(SEEDED_TRENDS));
  return SEEDED_TRENDS;
}

export function trendPriorityScore(priority) {
  if (priority === "High") {
    return 3;
  }
  if (priority === "Medium") {
    return 2;
  }
  return 1;
}
