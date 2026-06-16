import path from "node:path";
import { PATHS, PLATFORM_CONFIG } from "../config.mjs";
import { readCsvObjects, toCsv, toNumber, writeText } from "../utils/file_helpers.mjs";

function score(row) {
  const views = toNumber(row.Views);
  const likes = toNumber(row.Likes);
  const comments = toNumber(row.Comments);
  const shares = toNumber(row.Shares);
  const saves = toNumber(row.Saves);
  const followers = toNumber(row.Followers || row.FollowerCount || row.SubscriberCount);
  const watchTime = toNumber(row.WatchTimeMinutes);
  const reach = toNumber(row.Reach);
  const weighted = likes + comments * 2 + shares * 3 + saves * 4 + followers * 5 + watchTime * 0.2 + reach * 0.05;
  const rate = views > 0 ? weighted / views : 0;
  const total = Math.round(weighted + rate * 1000);
  const growthBand = total >= 80 || rate >= 0.08 ? "High Growth" : total >= 30 || rate >= 0.03 ? "Medium Growth" : "Low Growth";
  return { views, weighted, rate, total, growthBand };
}

function emptyMetricRows() {
  return Object.values(PLATFORM_CONFIG).flatMap((platform) =>
    platform.metrics.map((metric) => ({
      Platform: platform.label,
      Metric: metric,
      Source: "Manual import or future API collector",
      Required: "Yes",
    })),
  );
}

export async function collectLocalAnalytics() {
  const trackingRows = await readCsvObjects(path.join(PATHS.data, "raw", "manual_metrics.csv"));
  const rows = trackingRows.map((row) => {
    const result = score(row);
    return {
      Date: row.Date,
      Platform: row.Platform,
      Topic: row.Topic,
      Category: row.Category,
      Package: row.Package,
      Views: result.views,
      Likes: toNumber(row.Likes),
      Comments: toNumber(row.Comments),
      Shares: toNumber(row.Shares),
      Saves: toNumber(row.Saves),
      Followers: toNumber(row.Followers || row.FollowerCount || row.SubscriberCount),
      WatchTimeMinutes: toNumber(row.WatchTimeMinutes),
      Reach: toNumber(row.Reach),
      Score: result.total,
      EngagementRate: result.rate.toFixed(4),
      GrowthBand: result.growthBand,
    };
  });

  await writeText(path.join(PATHS.processedData, "analytics_metrics_catalog.csv"), toCsv(emptyMetricRows()));
  await writeText(path.join(PATHS.processedData, "performance_scores.csv"), toCsv(rows));
  return rows;
}
