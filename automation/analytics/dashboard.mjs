import path from "node:path";
import { PATHS } from "../config.mjs";
import { toCsv, writeText } from "../utils/file_helpers.mjs";

function groupByCategory(rows) {
  const map = new Map();
  for (const row of rows) {
    const current = map.get(row.Category) ?? {
      Category: row.Category,
      Posts: 0,
      Views: 0,
      Score: 0,
      HighGrowth: 0,
      MediumGrowth: 0,
      LowGrowth: 0,
    };
    current.Posts += 1;
    current.Views += Number(row.Views || 0);
    current.Score += Number(row.Score || 0);
    current.HighGrowth += row.GrowthBand === "High Growth" ? 1 : 0;
    current.MediumGrowth += row.GrowthBand === "Medium Growth" ? 1 : 0;
    current.LowGrowth += row.GrowthBand === "Low Growth" ? 1 : 0;
    map.set(row.Category, current);
  }
  return [...map.values()].map((row) => ({
    ...row,
    AverageScore: row.Posts > 0 ? (row.Score / row.Posts).toFixed(2) : "0.00",
  }));
}

export async function buildPerformanceDashboard(performanceRows, scheduleSummary) {
  const categoryRows = groupByCategory(performanceRows);
  const topRows = [...performanceRows].sort((a, b) => Number(b.Score) - Number(a.Score)).slice(0, 10);
  const dashboard = {
    generatedAt: new Date().toISOString(),
    scheduledItems: scheduleSummary.schedule.length,
    pendingApprovals: scheduleSummary.approvalQueue.length,
    performanceRows: performanceRows.length,
    topPackages: topRows,
    categorySummary: categoryRows,
  };

  await writeText(path.join(PATHS.reports, "dashboard.json"), JSON.stringify(dashboard, null, 2));
  await writeText(path.join(PATHS.reports, "category_summary.csv"), toCsv(categoryRows));
  await writeText(
    path.join(PATHS.reports, "weekly_report.md"),
    [
      "# Weekly Performance Report",
      "",
      `Generated: ${dashboard.generatedAt}`,
      "",
      `Scheduled items: ${dashboard.scheduledItems}`,
      `Pending approvals: ${dashboard.pendingApprovals}`,
      `Tracked performance rows: ${dashboard.performanceRows}`,
      "",
      "## Top Packages",
      "",
      ...(topRows.length > 0
        ? topRows.map((row, index) => `${index + 1}. ${row.Topic} (${row.Platform}) - ${row.GrowthBand}, score ${row.Score}`)
        : ["No performance rows yet. Add local metrics to `data/raw/manual_metrics.csv`."]),
      "",
      "## Category Summary",
      "",
      ...(categoryRows.length > 0
        ? categoryRows.map((row) => `- ${row.Category}: ${row.Posts} posts, average score ${row.AverageScore}`)
        : ["No category performance yet."]),
    ].join("\n"),
  );

  return dashboard;
}
