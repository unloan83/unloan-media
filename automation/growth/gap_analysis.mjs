const TARGET_CATEGORIES = [
  "Wealth Building",
  "Trading Basics",
  "Investor Toolkit",
  "Market Vocabulary",
  "Behavioral Finance",
];

function normalizeCategory(category) {
  if (category === "Trading Platform Features") {
    return "Investor Toolkit";
  }
  if (category === "Stock Market Basics" || category === "Investor Terminology") {
    return "Market Vocabulary";
  }
  return category;
}

export function buildGapAnalysis(topics, trends) {
  const currentCounts = new Map(TARGET_CATEGORIES.map((category) => [category, 0]));
  for (const topic of topics) {
    const category = normalizeCategory(topic.Category);
    currentCounts.set(category, (currentCounts.get(category) ?? 0) + 1);
  }

  const total = [...currentCounts.values()].reduce((sum, value) => sum + value, 0);
  const targetCount = total / TARGET_CATEGORIES.length;

  return TARGET_CATEGORIES.map((category) => {
    const current = currentCounts.get(category) ?? 0;
    const gap = Math.max(0, Math.ceil(targetCount - current));
    const trendIdeas = trends.filter((trend) => trend.Category === category).map((trend) => trend.Topic);
    return {
      Category: category,
      CurrentTopics: current,
      TargetTopics: targetCount.toFixed(1),
      Gap: gap,
      Status: gap > 0 ? "Underrepresented" : "Covered",
      RecommendedFutureTopics: trendIdeas.length > 0 ? trendIdeas.join(" | ") : `Add more ${category.toLowerCase()} explainers`,
    };
  });
}
