import {
  calculatePortfolioMetrics,
  type ManagedPortfolio,
  type PortfolioMetrics,
} from "@/lib/portfolio";

export type RiskStatus = "GREEN" | "YELLOW" | "RED";

export type PortfolioRiskResult = {
  riskScore: number;
  riskStatus: RiskStatus;
  risks: string[];
  recommendations: string[];
  metrics: {
    maxStockAllocation: number;
    maxStockSymbol: string;
    maxSectorAllocation: number;
    maxSectorName: string;
    smallCapAllocation: number;
    cashAllocation: number;
    correlationThemes: string[];
  };
};

const smallCapSymbols = new Set([
  "BEML",
  "DWARKESH",
  "GIPCL",
  "GRAVITA",
  "HBLPOWER",
  "IREDA",
  "JWL",
  "KPEL",
  "MOREPENLAB",
  "MTARTECH",
  "NUCLEUS",
  "RAMASTEEL",
  "RVNL",
  "SENCO",
  "SUZLON",
  "TEXRAIL",
]);

const cashSymbols = new Set(["CASH", "LIQUIDBEES", "LIQUIDCASE", "OVERNIGHT"]);

const themeKeywords: Array<{
  label: string;
  keywords: string[];
}> = [
  {
    label: "Banking concentration detected.",
    keywords: ["bank", "financial services"],
  },
  {
    label: "IT concentration detected.",
    keywords: ["information technology", "software", "tech"],
  },
  {
    label: "Power and energy concentration detected.",
    keywords: ["power", "energy", "oil gas", "fuel"],
  },
  {
    label: "Auto concentration detected.",
    keywords: ["automobile", "auto", "motors"],
  },
  {
    label: "Healthcare concentration detected.",
    keywords: ["healthcare", "pharma", "hospital"],
  },
];

export function analyzePortfolioRisk(portfolio: ManagedPortfolio): PortfolioRiskResult {
  const portfolioMetrics = calculatePortfolioMetrics(portfolio.positions);
  const holdings = portfolioMetrics.holdings;
  const totalValue = portfolioMetrics.totalValue;
  const topHolding = holdings[0];
  const topSector = portfolioMetrics.sectorAllocations[0];
  const cashValue = holdings
    .filter(isCashLikeHolding)
    .reduce((sum, holding) => sum + holding.marketValue, 0);
  const cashAllocation = totalValue === 0 ? 0 : (cashValue / totalValue) * 100;
  const smallCapValue = holdings
    .filter(isSmallCapHolding)
    .reduce((sum, holding) => sum + holding.marketValue, 0);
  const smallCapAllocation = totalValue === 0 ? 0 : (smallCapValue / totalValue) * 100;
  const correlationThemes = detectCorrelationThemes(portfolioMetrics);
  const risks: string[] = [];
  const recommendations: string[] = [];
  let penalty = 0;

  if ((topHolding?.portfolioWeight ?? 0) > 30) {
    risks.push(`${topHolding?.symbol} allocation ${formatPercent(topHolding?.portfolioWeight ?? 0)}.`);
    recommendations.push(`Reduce ${topHolding?.symbol} by 5-10%.`);
    penalty += 28;
  } else if ((topHolding?.portfolioWeight ?? 0) > 20) {
    risks.push(`${topHolding?.symbol} allocation above 20% at ${formatPercent(topHolding?.portfolioWeight ?? 0)}.`);
    recommendations.push(`Trim ${topHolding?.symbol} gradually below 20%.`);
    penalty += 14;
  }

  if ((topSector?.percentage ?? 0) > 45) {
    risks.push(`${topSector?.sector} exposure ${formatPercent(topSector?.percentage ?? 0)}.`);
    recommendations.push(`Reduce ${topSector?.sector} exposure and diversify into uncorrelated sectors.`);
    penalty += 24;
  } else if ((topSector?.percentage ?? 0) > 35) {
    risks.push(`${topSector?.sector} exposure above 35% at ${formatPercent(topSector?.percentage ?? 0)}.`);
    recommendations.push(`Add exposure outside ${topSector?.sector}.`);
    penalty += 12;
  }

  if (smallCapAllocation > 65) {
    risks.push(`Small cap allocation ${formatPercent(smallCapAllocation)}.`);
    recommendations.push("Shift part of small-cap exposure into large-cap or diversified ETFs.");
    penalty += 20;
  } else if (smallCapAllocation > 50) {
    risks.push(`Small cap allocation above 50% at ${formatPercent(smallCapAllocation)}.`);
    recommendations.push("Cap small-cap exposure and rebalance toward steadier holdings.");
    penalty += 10;
  }

  if (cashAllocation < 2) {
    risks.push(`Cash allocation only ${formatPercent(cashAllocation)}.`);
    recommendations.push("Increase cash allocation to at least 5% for risk control.");
    penalty += 16;
  } else if (cashAllocation < 5) {
    risks.push(`Cash allocation below 5% at ${formatPercent(cashAllocation)}.`);
    recommendations.push("Keep a 5-10% cash buffer for staggered buying and drawdowns.");
    penalty += 8;
  }

  correlationThemes.forEach((theme) => {
    risks.push(theme);
    penalty += 6;
  });

  if (correlationThemes.length > 0) {
    recommendations.push("Reduce correlated positions or add exposure to a different sector theme.");
  }

  if (!portfolioMetrics.sectorAllocations.some((sector) => isItSector(sector.sector))) {
    recommendations.push("Add exposure to IT sector after valuation and trend validation.");
  }

  if (risks.length === 0) {
    risks.push("No major concentration or construction risk detected.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current allocation discipline and review after each refresh.");
  }

  const riskScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    riskScore,
    riskStatus: getRiskStatus(riskScore),
    risks: unique(risks).slice(0, 6),
    recommendations: unique(recommendations).slice(0, 6),
    metrics: {
      maxStockAllocation: topHolding?.portfolioWeight ?? 0,
      maxStockSymbol: topHolding?.symbol ?? "NA",
      maxSectorAllocation: topSector?.percentage ?? 0,
      maxSectorName: topSector?.sector ?? "NA",
      smallCapAllocation,
      cashAllocation,
      correlationThemes,
    },
  };
}

function detectCorrelationThemes(metrics: PortfolioMetrics) {
  const themes = themeKeywords.flatMap((theme) => {
    const matchingHoldings = metrics.holdings.filter((holding) => {
      const haystack = `${holding.symbol} ${holding.company} ${holding.sector}`.toLowerCase();
      return theme.keywords.some((keyword) => haystack.includes(keyword));
    });
    const allocation = matchingHoldings.reduce(
      (sum, holding) => sum + holding.portfolioWeight,
      0,
    );

    return matchingHoldings.length >= 3 || allocation > 35 ? [theme.label] : [];
  });

  return unique(themes);
}

function isSmallCapHolding(holding: PortfolioMetrics["holdings"][number]) {
  const haystack = `${holding.symbol} ${holding.company} ${holding.sector}`.toLowerCase();

  return (
    smallCapSymbols.has(holding.symbol) ||
    haystack.includes("small cap") ||
    haystack.includes("smallcap") ||
    haystack.includes("micro cap")
  );
}

function isCashLikeHolding(holding: PortfolioMetrics["holdings"][number]) {
  const haystack = `${holding.symbol} ${holding.company} ${holding.sector}`.toLowerCase();

  return (
    cashSymbols.has(holding.symbol) ||
    haystack.includes("cash") ||
    haystack.includes("liquid") ||
    haystack.includes("overnight")
  );
}

function isItSector(sector: string) {
  return sector.toLowerCase().includes("information technology");
}

function getRiskStatus(score: number): RiskStatus {
  if (score >= 80) {
    return "GREEN";
  }

  if (score >= 60) {
    return "YELLOW";
  }

  return "RED";
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function unique(values: string[]) {
  return [...new Set(values)];
}
