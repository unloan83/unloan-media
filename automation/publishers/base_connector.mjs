import { PLATFORM_CONFIG, WORKFLOW } from "../config.mjs";

export class SafePublisherConnector {
  constructor(platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIG[platform];
    if (!this.config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  credentialStatus(env = process.env) {
    return Object.fromEntries(
      this.config.credentialKeys.map((key) => [key, env[key] ? "configured" : "missing"]),
    );
  }

  validatePackage(item) {
    const approved = item.Status === "Approved";
    return {
      platform: this.config.label,
      package: item.Package,
      approved,
      publishEligible: approved && !WORKFLOW.publishWithoutApproval,
      status: item.Status,
      reason: approved
        ? "Approved package can be queued by a future publisher."
        : "Package is blocked until approval is recorded.",
    };
  }

  async publish() {
    throw new Error(
      `${this.config.label} publishing is intentionally disabled in Phase 5 scaffolding. Add explicit approval and platform API implementation in a future phase.`,
    );
  }
}
