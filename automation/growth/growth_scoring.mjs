import { trendPriorityScore } from "./trend_discovery.mjs";

const CATEGORY_MONETIZATION = {
  "Wealth Building": 8,
  "Trading Basics": 7,
  "Trading Platform Features": 6,
  "Investor Toolkit": 6,
  "Stock Market Basics": 5,
  "Investor Terminology": 5,
  "Market Vocabulary": 5,
  "Behavioral Finance": 7,
};

const CATEGORY_EVERGREEN = {
  "Wealth Building": 9,
  "Trading Basics": 8,
  "Trading Platform Features": 7,
  "Investor Toolkit": 7,
  "Stock Market Basics": 9,
  "Investor Terminology": 9,
  "Market Vocabulary": 9,
  "Behavioral Finance": 8,
};

function normalizeCategory(category) {
  if (category === "Trading Platform Features") {
    return "Investor Toolkit";
  }
  if (category === "Stock Market Basics" || category === "Investor Terminology") {
    return "Market Vocabulary";
  }
  return category;
}

function matchingTrend(topic, trends) {
  const category = normalizeCategory(topic.Category);
  return trends.find((trend) => trend.Category === category || trend.Topic.toLowerCase().includes(topic.Topic.toLowerCase()));
}

function matchingCompetitor(topic, competitors) {
  const category = normalizeCategory(topic.Category);
  return competitors.find((row) => row.ContentCategory === category);
}

export function buildGrowthScores(topics, trends, competitors) {
  return topics.map((topic) => {
    const normalizedCategory = normalizeCategory(topic.Category);
    const trend = matchingTrend(topic, trends);
    const competitor = matchingCompetitor(topic, competitors);
    const topicLength = String(topic.Topic).split(/\s+/u).length;
    const virality = Math.min(10, 4 + (trend ? trendPriorityScore(trend.Priority) : 1) + (competitor ? 2 : 0));
    const searchability = Math.min(10, 5 + (topicLength <= 3 ? 2 : 1) + (trend ? 1 : 0));
    const evergreenValue = CATEGORY_EVERGREEN[topic.Category] ?? CATEGORY_EVERGREEN[normalizedCategory] ?? 7;
    const monetizationPotential = CATEGORY_MONETIZATION[topic.Category] ?? CATEGORY_MONETIZATION[normalizedCategory] ?? 6;
    const total = virality + searchability + evergreenValue + monetizationPotential;

    return {
      Topic: topic.Topic,
      Category: topic.Category,
      GrowthCategory: normalizedCategory,
      Difficulty: topic.Difficulty,
      Platform: topic.Platform,
      Virality: virality,
      Searchability: searchability,
      EvergreenValue: evergreenValue,
      MonetizationPotential: monetizationPotential,
      TotalGrowthScore: total,
      GrowthTier: total >= 32 ? "High Growth" : total >= 26 ? "Medium Growth" : "Low Growth",
      TrendSignal: trend?.Topic ?? "No direct trend match",
      CompetitorSignal: competitor?.ChannelName ?? "No tracked competitor signal",
    };
  });
}
