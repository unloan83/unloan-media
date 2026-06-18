const QUESTION_PREFIXES = [
  /^what would you do differently if\s+/iu,
  /^what happens when\s+/iu,
  /^what if\s+/iu,
  /^have you ever\s+/iu,
  /^did you know\s+/iu,
  /^do you know\s+/iu,
  /^why does\s+/iu,
  /^why do\s+/iu,
  /^how does\s+/iu,
  /^how do\s+/iu,
];

const WEAK_ENDINGS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "because",
  "between",
  "but",
  "for",
  "from",
  "if",
  "in",
  "of",
  "or",
  "the",
  "to",
  "with",
  "your",
]);

const TOPIC_MESSAGES = {
  "rule of 72": [
    ["How fast can money double?", "Use one simple mental-math shortcut."],
    ["Growth rates feel abstract", "Doubling time is difficult to estimate quickly."],
    ["Divide 72 by the return", "The result estimates years needed to double."],
    ["At 8%: about 9 years", "72 divided by 8 equals 9."],
    ["It is only an estimate", "Fees, taxes, and changing returns affect results."],
    ["Save this investing shortcut", "Build Wealth. Not Debt."],
  ],
  "what is gtt order": [
    ["Set the trigger. Then wait.", "A GTT order watches the price for you."],
    ["Prices move while you are away", "Manual monitoring can miss planned entries or exits."],
    ["GTT means Good Till Triggered", "The order activates when its trigger price is reached."],
    ["Trigger price: Rs 100", "The exchange order is placed only after activation."],
    ["Automation is not risk control", "Review validity, limits, and broker rules."],
    ["Save this before using GTT", "Build Wealth. Not Debt."],
  ],
  "stop loss explained": [
    ["Define the loss before entry", "Risk planning starts before the trade."],
    ["Hope is not a risk plan", "Delaying an exit can increase losses."],
    ["Stop loss triggers an exit", "It helps limit downside when price moves against you."],
    ["Buy Rs 100. Stop Rs 95.", "Planned risk is roughly Rs 5 per share."],
    ["Stops manage risk, not certainty", "Fast markets can execute beyond the trigger."],
    ["Share this risk-management rule", "Build Wealth. Not Debt."],
  ],
  etf: [
    ["Diversify with one investment", "An ETF can hold a basket of assets."],
    ["One stock concentrates risk", "A basket spreads exposure across multiple holdings."],
    ["ETF trades like a stock", "Its portfolio tracks an index, sector, or asset."],
    ["Consider a Nifty 50 ETF", "One unit provides exposure to many large companies."],
    ["Check cost and tracking error", "Liquidity and index quality also matter."],
    ["Save this ETF explanation", "Build Wealth. Not Debt."],
  ],
  roe: [
    ["How efficiently is equity used?", "ROE connects profit with shareholder capital."],
    ["Profit alone misses efficiency", "Businesses use different amounts of shareholder money."],
    ["ROE equals profit divided by equity", "It measures returns generated from shareholder capital."],
    ["Rs 20 profit on Rs 100 equity", "ROE equals 20% for that period."],
    ["High ROE needs context", "Compare debt, consistency, and industry peers."],
    ["Save this ROE formula", "Build Wealth. Not Debt."],
  ],
};

function normalizeAcronyms(value) {
  return String(value)
    .replace(/\betf\b/giu, "ETF")
    .replace(/\broe\b/giu, "ROE")
    .replace(/\broce\b/giu, "ROCE")
    .replace(/\bgtt\b/giu, "GTT")
    .replace(/\bsip\b/giu, "SIP")
    .replace(/\bipo\b/giu, "IPO")
    .replace(/\beps\b/giu, "EPS")
    .replace(/\bcagr\b/giu, "CAGR")
    .replace(/\bxirr\b/giu, "XIRR");
}

export function normalizeText(value) {
  return normalizeAcronyms(String(value ?? "")
    .replace(/\u20b9/g, "Rs ")
    .replace(/\u00e2\u201a\u00b9/g, "Rs ")
    .replace(/\s+/g, " ")
    .trim());
}

export function textWords(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function cleanPhrase(value) {
  return normalizeText(value)
    .replace(/^["']|["']$/gu, "")
    .replace(/\s+([,.!?])/gu, "$1")
    .trim();
}

function stripQuestionLead(value) {
  let result = cleanPhrase(value);
  const jobQuestion = result.match(/^what would you do differently if your next (.+?) had (.+)$/iu);
  if (jobQuestion) {
    return cleanPhrase(`Give your next ${jobQuestion[1]} ${jobQuestion[2]}`);
  }
  for (const pattern of QUESTION_PREFIXES) {
    result = result.replace(pattern, "");
  }
  return result;
}

function compactLanguage(value) {
  return cleanPhrase(value)
    .replace(/\byou are split between\b/giu, "choose between")
    .replace(/\byou might\b/giu, "you can")
    .replace(/\bonly later asks\b/giu, "then asks")
    .replace(/\bin order to\b/giu, "to")
    .replace(/\ba feature that helps you\b/giu, "a tool to")
    .replace(/\bthe point is not\b/giu, "focus less on")
    .replace(/\bit still needs\b/giu, "it needs");
}

function splitMessage(value) {
  const normalized = compactLanguage(stripQuestionLead(value));
  const clauseMatch = normalized.match(/^(.+?)(?:,\s+|\s+(?:because|but|so|while|which|that)\s+)(.+)$/iu);
  if (clauseMatch) {
    return [cleanPhrase(clauseMatch[1]), cleanPhrase(clauseMatch[2])];
  }

  const sentenceParts = normalized
    .split(/(?<=[.!?])\s+|;\s+|:\s+/u)
    .map(cleanPhrase)
    .filter(Boolean);
  return [sentenceParts[0] ?? normalized, sentenceParts.slice(1).join(" ")];
}

function takePhrase(value, limit) {
  const tokens = textWords(value).slice(0, limit);
  while (tokens.length > 3 && WEAK_ENDINGS.has(tokens.at(-1).replace(/[,.!?]+$/gu, "").toLowerCase())) {
    tokens.pop();
  }
  return cleanPhrase(tokens.join(" "));
}

function sentenceCase(value) {
  const text = cleanPhrase(value);
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

export function buildTextHierarchy(text, options = {}) {
  const keyMaxWords = options.keyMaxWords ?? 8;
  const supportMaxWords = options.supportMaxWords ?? 14;
  const totalMaxWords = options.totalMaxWords ?? 20;
  const original = normalizeText(text);
  const topicKey = normalizeText(options.topic).toLowerCase();
  const curated = TOPIC_MESSAGES[topicKey]?.[Number(options.scene) - 1];
  if (curated) {
    return {
      keyMessage: curated[0],
      supportMessage: curated[1],
      simplified: true,
      originalText: original,
      source: "curated",
    };
  }
  const [primary, secondary] = splitMessage(original);
  let keyMessage = takePhrase(primary, keyMaxWords);

  const primaryRemainder = textWords(primary).slice(textWords(keyMessage).length);
  const supportSource = [...primaryRemainder, ...textWords(secondary)].join(" ");
  const supportBudget = Math.min(supportMaxWords, Math.max(0, totalMaxWords - textWords(keyMessage).length));
  let supportMessage = takePhrase(supportSource, supportBudget);

  keyMessage = sentenceCase(keyMessage);
  supportMessage = sentenceCase(supportMessage);

  return {
    keyMessage,
    supportMessage,
    simplified: normalizeText(`${keyMessage} ${supportMessage}`) !== original,
    originalText: original,
    source: "automatic",
  };
}

export function wrapByWordCount(value, wordsPerLine, maxLines) {
  const tokens = textWords(value);
  const lines = [];
  for (let index = 0; index < tokens.length && lines.length < maxLines; index += wordsPerLine) {
    lines.push(tokens.slice(index, index + wordsPerLine).join(" "));
  }
  return lines;
}
