import path from "node:path";
import { PATHS } from "../config.mjs";
import { appendJsonLine, writeText } from "../utils/file_helpers.mjs";

export async function recordAutomationRun({ scheduleSummary, performanceRows }) {
  const alerts = [];
  if (scheduleSummary.approvalQueue.length > 0) {
    alerts.push({
      level: "info",
      type: "approval_pending",
      message: `${scheduleSummary.approvalQueue.length} scheduled platform items require approval before publishing.`,
    });
  }
  const lowGrowth = performanceRows.filter((row) => row.GrowthBand === "Low Growth");
  if (lowGrowth.length > 0) {
    alerts.push({
      level: "warning",
      type: "low_performance",
      message: `${lowGrowth.length} local analytics rows are currently Low Growth.`,
    });
  }

  const event = {
    timestamp: new Date().toISOString(),
    event: "phase5_local_operations_run",
    scheduledItems: scheduleSummary.schedule.length,
    pendingApprovals: scheduleSummary.approvalQueue.length,
    analyticsRows: performanceRows.length,
    alerts,
  };

  await appendJsonLine(path.join(PATHS.logs, "automation_log.jsonl"), event);
  await writeText(path.join(PATHS.reports, "alerts.json"), JSON.stringify(alerts, null, 2));
  return alerts;
}
