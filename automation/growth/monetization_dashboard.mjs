import { toNumber } from "../utils/file_helpers.mjs";

export function buildMonetizationDashboard(performanceRows) {
  const totals = performanceRows.reduce(
    (acc, row) => {
      acc.Followers += toNumber(row.Followers || row.FollowerCount);
      acc.Subscribers += toNumber(row.Subscribers || row.SubscriberCount);
      acc.Views += toNumber(row.Views);
      acc.WatchTime += toNumber(row.WatchTimeMinutes);
      acc.Engagement += toNumber(row.Likes) + toNumber(row.Comments) + toNumber(row.Shares) + toNumber(row.Saves);
      return acc;
    },
    { Followers: 0, Subscribers: 0, Views: 0, WatchTime: 0, Engagement: 0 },
  );

  const engagementRate = totals.Views > 0 ? totals.Engagement / totals.Views : 0;
  return {
    Followers: totals.Followers,
    Subscribers: totals.Subscribers,
    Views: totals.Views,
    WatchTimeMinutes: totals.WatchTime,
    Engagement: totals.Engagement,
    EngagementRate: engagementRate.toFixed(4),
    MonetizationReadiness:
      totals.Views >= 100000 && totals.WatchTime >= 1000
        ? "Scaling"
        : totals.Views >= 10000
          ? "Early Traction"
          : "Foundation",
    NextMilestone:
      totals.Views >= 100000
        ? "Build sponsorship and product-readiness review."
        : "Increase repeatable educational series and improve save/share rate.",
  };
}
