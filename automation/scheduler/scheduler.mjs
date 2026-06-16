import path from "node:path";
import { PATHS, WORKFLOW, packageSlug } from "../config.mjs";
import { readCsvObjects, toCsv, writeText } from "../utils/file_helpers.mjs";

function platformSlots(platform) {
  if (platform === "Instagram") {
    return ["Instagram"];
  }
  if (platform === "YouTube") {
    return ["YouTube"];
  }
  return ["Instagram", "YouTube"];
}

function contentTypeFor(platform) {
  return platform === "YouTube" ? "Short" : "Reel";
}

function nextTime(slotIndex) {
  return WORKFLOW.defaultPostTimes[slotIndex % WORKFLOW.defaultPostTimes.length];
}

export async function buildSchedulingPlan() {
  const rows = await readCsvObjects(PATHS.publishingStatus);
  const calendarRows = await readCsvObjects(PATHS.calendar);
  const calendarByTopicDate = new Map(
    calendarRows.map((row) => [`${row.Date}|${row.Topic}`.toLowerCase(), row]),
  );
  const seen = new Set();
  const schedule = [];
  const approvalQueue = [];

  for (const row of rows) {
    const calendarRow = calendarByTopicDate.get(`${row.Date}|${row.Topic}`.toLowerCase());
    const platforms = platformSlots(row.Platform || calendarRow?.Platform || "Both");
    for (const [slotIndex, platform] of platforms.entries()) {
      const key = `${row.Date}|${packageSlug(row)}|${platform}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const status = row.Status || "Draft";
      const approved = status === "Approved" || status === "Published";
      const item = {
        Date: row.Date,
        Time: nextTime(slotIndex),
        Timezone: WORKFLOW.timezone,
        Platform: platform,
        ContentType: contentTypeFor(platform),
        Topic: row.Topic,
        Category: row.Category,
        Package: packageSlug(row),
        Status: status,
        ApprovalRequired: WORKFLOW.approvalRequired ? "Yes" : "No",
        PublishEligible: approved ? "Yes" : "No",
        DuplicateCheckKey: key,
      };
      schedule.push(item);
      if (!approved) {
        approvalQueue.push({
          Date: row.Date,
          Platform: platform,
          Topic: row.Topic,
          Category: row.Category,
          Package: packageSlug(row),
          CurrentStatus: status,
          RequiredAction: "Review package, mark Ready, then mark Approved before scheduling for publishing.",
        });
      }
    }
  }

  await writeText(path.join(PATHS.processedData, "schedule.csv"), toCsv(schedule));
  await writeText(path.join(PATHS.processedData, "approval_queue.csv"), toCsv(approvalQueue));
  await writeText(
    path.join(PATHS.processedData, "schedule.json"),
    JSON.stringify(
      {
        timezone: WORKFLOW.timezone,
        approvalRequired: WORKFLOW.approvalRequired,
        publishWithoutApproval: WORKFLOW.publishWithoutApproval,
        generatedAt: new Date().toISOString(),
        items: schedule,
      },
      null,
      2,
    ),
  );

  return { schedule, approvalQueue };
}
