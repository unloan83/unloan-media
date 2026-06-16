import { SafePublisherConnector } from "./base_connector.mjs";

export class InstagramPublisher extends SafePublisherConnector {
  constructor() {
    super("instagram");
  }

  buildPayloadPreview(item) {
    return {
      platform: "Instagram",
      contentType: "Reel",
      package: item.Package,
      topic: item.Topic,
      captionSource: `content/weekly_packages/.../${item.Package}/caption_and_hashtags.md`,
      thumbnailSource: `content/thumbnails/${item.Package}.md`,
      status: item.Status,
      publishMode: "disabled-local-preview-only",
    };
  }
}
