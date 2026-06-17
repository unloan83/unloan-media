import path from "node:path";
import { PATHS } from "../config.mjs";
import { readCsvObjects, toCsv, writeText } from "../utils/file_helpers.mjs";

export const COMPETITOR_CATEGORIES = [
  "Wealth Building",
  "Trading Basics",
  "Investor Toolkit",
  "Market Vocabulary",
  "Behavioral Finance",
];

const SEEDED_CREATORS = [
  {
    ChannelName: "Finance Education Creator A",
    ContentCategory: "Wealth Building",
    TopPerformingTopics: "SIP discipline; compounding basics; money habits",
    PostingFrequency: "5-7 shorts per week",
    Notes: "Track education formats only. Do not copy scripts, claims, or recommendations.",
  },
  {
    ChannelName: "Market Basics Channel B",
    ContentCategory: "Market Vocabulary",
    TopPerformingTopics: "PE ratio; market cap; IPO basics",
    PostingFrequency: "3-5 shorts per week",
    Notes: "Observe topic packaging, not stock opinions.",
  },
  {
    ChannelName: "Risk First Trading Educator C",
    ContentCategory: "Trading Basics",
    TopPerformingTopics: "Stop loss; position sizing; trade journal",
    PostingFrequency: "4-6 shorts per week",
    Notes: "Keep UNLOAN content beginner-friendly and non-advisory.",
  },
  {
    ChannelName: "Investor Psychology Creator D",
    ContentCategory: "Behavioral Finance",
    TopPerformingTopics: "FOMO; panic selling; overtrading",
    PostingFrequency: "2-4 shorts per week",
    Notes: "Use as signal for education gaps, not engagement automation.",
  },
  {
    ChannelName: "Platform Tools Explainer E",
    ContentCategory: "Investor Toolkit",
    TopPerformingTopics: "GTT orders; limit orders; trailing stop loss",
    PostingFrequency: "3-5 shorts per week",
    Notes: "Avoid broker endorsement or platform claims.",
  },
];

export async function seedCompetitorIntelligence() {
  const filePath = path.join(PATHS.marketIntelligence, "competitors.csv");
  const existing = await readCsvObjects(filePath);
  if (existing.length > 0) {
    return existing;
  }
  await writeText(filePath, toCsv(SEEDED_CREATORS));
  return SEEDED_CREATORS;
}

export function summarizeCompetitors(rows) {
  const map = new Map();
  for (const row of rows) {
    const current = map.get(row.ContentCategory) ?? {
      ContentCategory: row.ContentCategory,
      TrackedChannels: 0,
      CommonTopics: [],
      PostingFrequencySignal: [],
    };
    current.TrackedChannels += 1;
    current.CommonTopics.push(row.TopPerformingTopics);
    current.PostingFrequencySignal.push(row.PostingFrequency);
    map.set(row.ContentCategory, current);
  }

  return [...map.values()].map((row) => ({
    ContentCategory: row.ContentCategory,
    TrackedChannels: row.TrackedChannels,
    CommonTopics: row.CommonTopics.join(" | "),
    PostingFrequencySignal: row.PostingFrequencySignal.join(" | "),
  }));
}
