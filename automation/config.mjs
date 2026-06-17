import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PATHS = {
  calendar: path.join(ROOT, "content_calendar", "master_calendar.csv"),
  publishingStatus: path.join(ROOT, "content", "publishing_status.csv"),
  metadata: path.join(ROOT, "content", "metadata"),
  weeklyPackages: path.join(ROOT, "content", "weekly_packages"),
  data: path.join(ROOT, "data"),
  rawData: path.join(ROOT, "data", "raw"),
  processedData: path.join(ROOT, "data", "processed"),
  reports: path.join(ROOT, "data", "reports"),
  growthData: path.join(ROOT, "data", "growth"),
  marketIntelligence: path.join(ROOT, "market_intelligence"),
  logs: path.join(ROOT, "logs"),
};

export const WORKFLOW = {
  timezone: "Asia/Kolkata",
  statuses: ["Draft", "Ready", "Approved", "Published"],
  approvalRequired: true,
  publishWithoutApproval: false,
  defaultPostTimes: ["09:00", "18:30"],
};

export const PLATFORM_CONFIG = {
  instagram: {
    label: "Instagram",
    enabled: false,
    credentialKeys: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_ACCOUNT_ID"],
    metrics: ["Views", "Likes", "Comments", "Shares", "Saves", "Reach", "ProfileVisits", "FollowerCount"],
  },
  youtube: {
    label: "YouTube",
    enabled: false,
    credentialKeys: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"],
    metrics: ["Views", "Likes", "Comments", "Shares", "WatchTimeMinutes", "Impressions", "CTR", "SubscriberCount"],
  },
};

export function packageSlug(item) {
  return item.Package || `${item.Date}-${String(item.index ?? 0).padStart(2, "0")}-${slugify(item.Topic)}`;
}

export function slugify(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}
