function makeHook(topic, variant) {
  const hooks = [
    `Most beginners hear ${topic.Topic} and miss the simple meaning.`,
    `${topic.Topic} sounds technical, but you can understand it in one minute.`,
    `Before using ${topic.Topic} in real money decisions, learn this basic idea.`,
  ];
  return hooks[variant % hooks.length];
}

function makeThumbnail(topic, variant) {
  const titles = [
    `${topic.Topic} Explained Simply`,
    `${topic.Topic} For Beginners`,
    `Learn ${topic.Topic} First`,
  ];
  return titles[variant % titles.length];
}

function makeCta(topic, variant) {
  const ctas = [
    `Save this ${topic.Topic} lesson for later review.`,
    "Share this with someone learning investing basics.",
    "Follow UNLOAN for beginner-friendly financial education.",
  ];
  return ctas[variant % ctas.length];
}

export function buildAbTests(topics) {
  return topics.flatMap((topic) =>
    [0, 1, 2].map((variantIndex) => ({
      Topic: topic.Topic,
      Category: topic.Category,
      Variant: `Variant ${String.fromCharCode(65 + variantIndex)}`,
      Hook: makeHook(topic, variantIndex),
      ThumbnailTitle: makeThumbnail(topic, variantIndex),
      CTA: makeCta(topic, variantIndex),
      TestStatus: "Draft",
      WinningMetric: "Saves and shares",
      ComplianceNote: "Educational only. No stock recommendations, return guarantees, or profit claims.",
    })),
  );
}
