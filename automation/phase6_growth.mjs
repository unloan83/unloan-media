import path from "node:path";
import { PATHS, ROOT } from "./config.mjs";
import { ensureDir, readCsvObjects, toCsv, writeText } from "./utils/file_helpers.mjs";
import { seedCompetitorIntelligence, summarizeCompetitors } from "./growth/competitor_intelligence.mjs";
import { seedTrendingTopics } from "./growth/trend_discovery.mjs";
import { buildGapAnalysis } from "./growth/gap_analysis.mjs";
import { buildAbTests } from "./growth/ab_testing.mjs";
import { buildGrowthScores } from "./growth/growth_scoring.mjs";
import { buildMonetizationDashboard } from "./growth/monetization_dashboard.mjs";

function topGrowthTopics(scores) {
  return [...scores].sort((a, b) => Number(b.TotalGrowthScore) - Number(a.TotalGrowthScore)).slice(0, 10);
}

function buildWeeklyRecommendations(scores, gaps, trends) {
  const topTopics = topGrowthTopics(scores).slice(0, 5);
  const gapsToAddress = gaps.filter((gap) => gap.Status === "Underrepresented");
  return [
    "# Weekly Growth Recommendations",
    "",
    "Use these recommendations for educational content planning only. Do not convert them into stock recommendations or automated engagement.",
    "",
    "## Priority Existing Topics",
    "",
    ...topTopics.map((row, index) => `${index + 1}. ${row.Topic} - ${row.GrowthTier}, score ${row.TotalGrowthScore}`),
    "",
    "## Content Gaps To Address",
    "",
    ...(gapsToAddress.length > 0
      ? gapsToAddress.map((row) => `- ${row.Category}: add ${row.Gap} topic(s). Ideas: ${row.RecommendedFutureTopics}`)
      : ["- Current category coverage is balanced enough for the next planning cycle."]),
    "",
    "## Trend-Led Ideas",
    "",
    ...trends.slice(0, 5).map((trend) => `- ${trend.Topic} (${trend.Category}, ${trend.Priority})`),
  ].join("\n");
}

function buildMonthlyStrategy(scores, competitorSummary, monetizationDashboard) {
  const highGrowth = scores.filter((row) => row.GrowthTier === "High Growth");
  return [
    "# Monthly Growth Strategy Report",
    "",
    "## Strategy Summary",
    "",
    `High growth topics identified: ${highGrowth.length}`,
    `Monetization readiness: ${monetizationDashboard.MonetizationReadiness}`,
    `Next milestone: ${monetizationDashboard.NextMilestone}`,
    "",
    "## Competitor Intelligence Signals",
    "",
    ...competitorSummary.map(
      (row) => `- ${row.ContentCategory}: ${row.TrackedChannels} tracked channel(s). Common topics: ${row.CommonTopics}`,
    ),
    "",
    "## Content Direction",
    "",
    "- Prioritize beginner-friendly series with repeatable formats.",
    "- Test hooks and thumbnail titles using saves, shares, retention, and watch time.",
    "- Keep all content educational and non-advisory.",
    "- Do not automate comments, likes, DMs, or engagement behavior.",
  ].join("\n");
}

async function main() {
  await Promise.all([
    ensureDir(PATHS.marketIntelligence),
    ensureDir(PATHS.growthData),
    ensureDir(PATHS.reports),
  ]);

  const topics = await readCsvObjects(PATHS.calendar);
  const competitors = await seedCompetitorIntelligence();
  const trends = await seedTrendingTopics();
  const performanceRows = await readCsvObjects(path.join(PATHS.processedData, "performance_scores.csv"));

  const competitorSummary = summarizeCompetitors(competitors);
  const gaps = buildGapAnalysis(topics, trends);
  const abTests = buildAbTests(topics);
  const growthScores = buildGrowthScores(topics, trends, competitors);
  const monetizationDashboard = buildMonetizationDashboard(performanceRows);

  await writeText(path.join(PATHS.marketIntelligence, "competitor_summary.csv"), toCsv(competitorSummary));
  await writeText(path.join(PATHS.growthData, "content_gap_analysis.csv"), toCsv(gaps));
  await writeText(path.join(PATHS.growthData, "ab_tests.csv"), toCsv(abTests));
  await writeText(path.join(PATHS.growthData, "growth_scores.csv"), toCsv(growthScores));
  await writeText(path.join(PATHS.reports, "monetization_dashboard.json"), JSON.stringify(monetizationDashboard, null, 2));
  await writeText(
    path.join(PATHS.reports, "weekly_growth_recommendations.md"),
    buildWeeklyRecommendations(growthScores, gaps, trends),
  );
  await writeText(
    path.join(PATHS.reports, "monthly_strategy_report.md"),
    buildMonthlyStrategy(growthScores, competitorSummary, monetizationDashboard),
  );

  const outputs = [
    "market_intelligence/competitors.csv",
    "market_intelligence/competitor_summary.csv",
    "market_intelligence/trending_topics.csv",
    "data/growth/content_gap_analysis.csv",
    "data/growth/ab_tests.csv",
    "data/growth/growth_scores.csv",
    "data/reports/monetization_dashboard.json",
    "data/reports/weekly_growth_recommendations.md",
    "data/reports/monthly_strategy_report.md",
  ];

  console.log(`Wrote Phase 6 growth intelligence system for ${topics.length} topics.`);
  console.log(`Tracked competitors: ${competitors.length}`);
  console.log(`Tracked trends: ${trends.length}`);
  for (const output of outputs) {
    console.log(path.relative(ROOT, path.join(ROOT, output)));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
