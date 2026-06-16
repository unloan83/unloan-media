import { SafePublisherConnector } from "./base_connector.mjs";

export class YouTubePublisher extends SafePublisherConnector {
  constructor() {
    super("youtube");
  }

  buildPayloadPreview(item) {
    return {
      platform: "YouTube",
      contentType: "Short",
      package: item.Package,
      topic: item.Topic,
      titleSource: `content/weekly_packages/.../${item.Package}/thumbnail_titles.md`,
      descriptionSource: `content/weekly_packages/.../${item.Package}/caption_and_hashtags.md`,
      thumbnailSource: `content/thumbnails/${item.Package}.md`,
      status: item.Status,
      publishMode: "disabled-local-preview-only",
    };
  }
}
