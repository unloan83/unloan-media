import path from "node:path";
import { PATHS, ROOT } from "./config.mjs";
import { ensureDir, readOptional, writeText } from "./utils/file_helpers.mjs";
import { buildSchedulingPlan } from "./scheduler/scheduler.mjs";
import { collectLocalAnalytics } from "./analytics/collector.mjs";
import { buildPerformanceDashboard } from "./analytics/dashboard.mjs";
import { recordAutomationRun } from "./alerts/notifications.mjs";
import { InstagramPublisher } from "./publishers/instagram_publisher.mjs";
import { YouTubePublisher } from "./publishers/youtube_publisher.mjs";

async function seedManualMetricsTemplate() {
  const metricsPath = path.join(PATHS.rawData, "manual_metrics.csv");
  const existing = await readOptional(metricsPath);
  if (existing.trim() !== "") {
    return;
  }
  const headers = [
    "Date",
    "Platform",
    "Topic",
    "Category",
    "Package",
    "Views",
    "Likes",
    "Comments",
    "Shares",
    "Saves",
    "Reach",
    "WatchTimeMinutes",
    "Followers",
  ];
  await writeText(metricsPath, `${headers.join(",")}`);
}

async function writeConnectorPreview(schedule) {
  const instagram = new InstagramPublisher();
  const youtube = new YouTubePublisher();
  const previews = schedule.slice(0, 12).map((item) => {
    const connector = item.Platform === "YouTube" ? youtube : instagram;
    return {
      validation: connector.validatePackage(item),
      payloadPreview: connector.buildPayloadPreview(item),
      credentialStatus: connector.credentialStatus(),
    };
  });
  await writeText(path.join(PATHS.processedData, "publisher_payload_previews.json"), JSON.stringify(previews, null, 2));
}

async function main() {
  await Promise.all([
    ensureDir(path.join(PATHS.rawData, "instagram")),
    ensureDir(path.join(PATHS.rawData, "youtube")),
    ensureDir(PATHS.processedData),
    ensureDir(PATHS.reports),
    ensureDir(PATHS.logs),
  ]);

  await seedManualMetricsTemplate();
  const scheduleSummary = await buildSchedulingPlan();
  const performanceRows = await collectLocalAnalytics();
  const dashboard = await buildPerformanceDashboard(performanceRows, scheduleSummary);
  const alerts = await recordAutomationRun({ scheduleSummary, performanceRows });
  await writeConnectorPreview(scheduleSummary.schedule);

  const outputs = [
    "data/raw/manual_metrics.csv",
    "data/processed/schedule.csv",
    "data/processed/schedule.json",
    "data/processed/approval_queue.csv",
    "data/processed/analytics_metrics_catalog.csv",
    "data/processed/performance_scores.csv",
    "data/processed/publisher_payload_previews.json",
    "data/reports/dashboard.json",
    "data/reports/category_summary.csv",
    "data/reports/weekly_report.md",
    "data/reports/alerts.json",
    "logs/automation_log.jsonl",
  ];

  console.log(`Wrote Phase 5 local operations system with ${scheduleSummary.schedule.length} scheduled platform items.`);
  console.log(`Pending approvals: ${scheduleSummary.approvalQueue.length}`);
  console.log(`Tracked analytics rows: ${dashboard.performanceRows}`);
  console.log(`Alerts: ${alerts.length}`);
  for (const output of outputs) {
    console.log(path.relative(ROOT, path.join(ROOT, output)));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
