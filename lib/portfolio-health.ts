import { analyzePortfolioRisk } from "@/lib/risk-engine";
import {
  calculatePortfolioMetrics,
  type ManagedPortfolio,
  type PortfolioMetrics,
} from "@/lib/portfolio";

export type PortfolioHealthGrade = "Excellent" | "Good" | "Average" | "Weak";

export type PortfolioHealthScoreResult = {
  healthScore: number;
  grade: PortfolioHealthGrade;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  components: Array<{
    label: string;
    score: number;
    weight: number;
  }>;
  placeholders: string[];
};

type QualityMetric = {
  roe: number;
  roce: number;
  debtToEquity: number;
  revenueGrowth: number;
  earningsGrowth: number;
};

const qualityPlaceholders: Record<string, QualityMetric> = {
  HDFCBANK: { roe: 16, roce: 11, debtToEquity: 0.9, revenueGrowth: 14, earningsGrowth: 16 },
  ICICIBANK: { roe: 17, roce: 12, debtToEquity: 0.8, revenueGrowth: 15, earningsGrowth: 18 },
  INFY: { roe: 29, roce: 36, debtToEquity: 0.1, revenueGrowth: 8, earningsGrowth: 7 },
  RELIANCE: { roe: 9, roce: 10, debtToEquity: 0.4, revenueGrowth: 7, earningsGrowth: 6 },
  SBIN: { roe: 15, roce: 9, debtToEquity: 1.0, revenueGrowth: 13, earningsGrowth: 15 },
  TCS: { roe: 48, roce: 58, debtToEquity: 0.1, revenueGrowth: 6, earningsGrowth: 5 },
};

export function analyzePortfolioHealthScore(
  portfolio: ManagedPortfolio,
): PortfolioHealthScoreResult {
  const metrics = calculatePortfolioMetrics(portfolio.positions);
  const risk = analyzePortfolioRisk(portfolio);
  const diversification = scoreDiversification(metrics);
  const sectorBalance = scoreSectorBalance(metrics);
  const portfolioQuality = scorePortfolioQuality(metrics);
  const momentum = scoreMomentum(metrics);
  const cashManagement = scoreCashManagement(metrics);
  const riskIntegration = risk.riskScore;
  const components = [
    { label: "Diversification", score: diversification, weight: 0.25 },
    { label: "Sector Balance", score: sectorBalance, weight: 0.2 },
    { label: "Portfolio Quality", score: portfolioQuality.score, weight: 0.2 },
    { label: "Momentum", score: momentum, weight: 0.15 },
    { label: "Cash Management", score: cashManagement, weight: 0.1 },
    { label: "Risk Integration", score: riskIntegration, weight: 0.1 },
  ];
  const healthScore = Math.round(
    components.reduce((sum, component) => sum + component.score * component.weight, 0),
  );

  return {
    healthScore,
    grade: getGrade(healthScore),
    strengths: buildStrengths({
      diversification,
      sectorBalance,
      portfolioQuality: portfolioQuality.score,
      momentum,
      cashManagement,
      riskIntegration,
      metrics,
    }),
    weaknesses: buildWeaknesses({
      diversification,
      sectorBalance,
      portfolioQuality: portfolioQuality.score,
      momentum,
      cashManagement,
      risk,
    }),
    opportunities: buildOpportunities({
      diversification,
      sectorBalance,
      portfolioQuality: portfolioQuality.score,
      momentum,
      cashManagement,
      risk,
      metrics,
    }),
    components,
    placeholders: portfolioQuality.placeholders,
  };
}

function scoreDiversification(metrics: PortfolioMetrics) {
  const count = metrics.holdings.length;

  if (count >= 14) return 100;
  if (count >= 10) return 88;
  if (count >= 7) return 74;
  if (count >= 5) return 62;
  if (count >= 3) return 46;
  if (count > 0) return 28;
  return 0;
}

function scoreSectorBalance(metrics: PortfolioMetrics) {
  const topSector = metrics.sectorAllocations[0]?.percentage ?? 0;
  const sectorCount = metrics.sectorAllocations.length;
  const sectorDepth = Math.min(25, sectorCount * 5);
  const concentrationPenalty = Math.max(0, topSector - 25) * 1.4;

  return clamp(80 + sectorDepth - concentrationPenalty);
}

function scorePortfolioQuality(metrics: PortfolioMetrics) {
  const placeholders: string[] = [];

  if (metrics.holdings.length === 0) {
    return {
      score: 0,
      placeholders: ["Quality metrics unavailable until holdings are added."],
    };
  }

  const weightedScore = metrics.holdings.reduce((sum, holding) => {
    const quality = qualityPlaceholders[holding.symbol] ?? estimateQualityFromData(holding);

    if (!qualityPlaceholders[holding.symbol]) {
      placeholders.push(`${holding.symbol}: placeholder quality score used.`);
    }

    return sum + scoreQualityMetric(quality) * holding.portfolioWeight;
  }, 0);

  return {
    score: clamp(weightedScore / 100),
    placeholders: [...new Set(placeholders)].slice(0, 4),
  };
}

function estimateQualityFromData(holding: PortfolioMetrics["holdings"][number]): QualityMetric {
  const dataQuality = Number(holding.currentPrice > 0) + Number(holding.previousClose > 0);
  const trendBoost = holding.dayChangePercent > 0 ? 2 : -1;
  const sectorBase = holding.sector.includes("Information Technology")
    ? 16
    : holding.sector.includes("Financial")
      ? 13
      : holding.sector.includes("Healthcare")
        ? 15
        : 11;

  return {
    roe: sectorBase + dataQuality + trendBoost,
    roce: sectorBase + dataQuality + trendBoost,
    debtToEquity: holding.sector.includes("Financial") ? 0.9 : 0.45,
    revenueGrowth: 8 + trendBoost,
    earningsGrowth: 7 + trendBoost,
  };
}

function scoreQualityMetric(metric: QualityMetric) {
  const roeScore = clamp(metric.roe * 3);
  const roceScore = clamp(metric.roce * 2.6);
  const debtScore = clamp(100 - metric.debtToEquity * 45);
  const revenueScore = clamp(45 + metric.revenueGrowth * 3);
  const earningsScore = clamp(45 + metric.earningsGrowth * 3);

  return Math.round(
    roeScore * 0.22 +
      roceScore * 0.22 +
      debtScore * 0.2 +
      revenueScore * 0.18 +
      earningsScore * 0.18,
  );
}

function scoreMomentum(metrics: PortfolioMetrics) {
  if (metrics.holdings.length === 0) {
    return 0;
  }

  const weightedMomentum = metrics.holdings.reduce((sum, holding) => {
    const closes = holding.bars?.map((bar) => bar.close).filter((close) => close > 0) ?? [];
    const current = holding.currentPrice || closes.at(-1) || 0;
    const threeMonthBase = closes.at(-60) ?? closes[0] ?? holding.previousClose;
    const sixMonthBase = closes.at(-120) ?? closes[0] ?? holding.previousClose;
    const threeMonthReturn =
      threeMonthBase > 0 ? ((current - threeMonthBase) / threeMonthBase) * 100 : 0;
    const sixMonthReturn =
      sixMonthBase > 0 ? ((current - sixMonthBase) / sixMonthBase) * 100 : threeMonthReturn;
    const niftyProxy = 5;
    const outperformance = threeMonthReturn - niftyProxy;
    const stockScore = clamp(
      55 + threeMonthReturn * 1.4 + sixMonthReturn * 0.8 + outperformance * 1.2,
    );

    return sum + stockScore * holding.portfolioWeight;
  }, 0);

  return Math.round(weightedMomentum / 100);
}

function scoreCashManagement(metrics: PortfolioMetrics) {
  const cashAllocation = getCashAllocation(metrics);

  if (cashAllocation >= 5 && cashAllocation <= 15) {
    return 95;
  }

  if (cashAllocation > 15 && cashAllocation <= 25) {
    return 78;
  }

  if (cashAllocation < 2) {
    return 42;
  }

  return 66;
}

function getCashAllocation(metrics: PortfolioMetrics) {
  const cashValue = metrics.holdings
    .filter((holding) => {
      const haystack = `${holding.symbol} ${holding.company} ${holding.sector}`.toLowerCase();
      return haystack.includes("cash") || haystack.includes("liquid") || haystack.includes("overnight");
    })
    .reduce((sum, holding) => sum + holding.marketValue, 0);

  return metrics.totalValue === 0 ? 0 : (cashValue / metrics.totalValue) * 100;
}

function buildStrengths({
  diversification,
  sectorBalance,
  portfolioQuality,
  momentum,
  cashManagement,
  riskIntegration,
  metrics,
}: {
  diversification: number;
  sectorBalance: number;
  portfolioQuality: number;
  momentum: number;
  cashManagement: number;
  riskIntegration: number;
  metrics: PortfolioMetrics;
}) {
  const strengths: string[] = [];

  if (diversification >= 75) strengths.push("Strong diversification.");
  if (sectorBalance >= 75) strengths.push("Good capital allocation across sectors.");
  if (portfolioQuality >= 75) strengths.push("Quality score is supported by balance-sheet placeholders and live data.");
  if (momentum >= 70) strengths.push("Recent momentum is supportive.");
  if (cashManagement >= 75) strengths.push("Healthy cash position.");
  if (riskIntegration >= 80) strengths.push("Risk engine shows controlled construction risk.");
  if (metrics.totalValue > 0) strengths.push("Portfolio value data is available for weighted scoring.");

  return strengths.length ? strengths.slice(0, 4) : ["Health model is ready; add more holdings for stronger scoring."];
}

function buildWeaknesses({
  diversification,
  sectorBalance,
  portfolioQuality,
  momentum,
  cashManagement,
  risk,
}: {
  diversification: number;
  sectorBalance: number;
  portfolioQuality: number;
  momentum: number;
  cashManagement: number;
  risk: ReturnType<typeof analyzePortfolioRisk>;
}) {
  const weaknesses: string[] = [];

  if (diversification < 60) weaknesses.push("Low diversification.");
  if (sectorBalance < 65) weaknesses.push(risk.risks[0] ?? "Sector balance needs improvement.");
  if (portfolioQuality < 60) weaknesses.push("Low earnings or balance-sheet quality confidence.");
  if (momentum < 55) weaknesses.push("Weak momentum versus NIFTY proxy.");
  if (cashManagement < 60) weaknesses.push("Cash management needs improvement.");
  if (risk.riskScore < 70) weaknesses.push("Risk score integration is dragging health score.");

  return weaknesses.length ? weaknesses.slice(0, 4) : ["No major health weakness detected from current data."];
}

function buildOpportunities({
  diversification,
  sectorBalance,
  portfolioQuality,
  momentum,
  cashManagement,
  risk,
  metrics,
}: {
  diversification: number;
  sectorBalance: number;
  portfolioQuality: number;
  momentum: number;
  cashManagement: number;
  risk: ReturnType<typeof analyzePortfolioRisk>;
  metrics: PortfolioMetrics;
}) {
  const opportunities: string[] = [];

  if (diversification < 70) opportunities.push("Add 3-5 uncorrelated quality holdings.");
  if (sectorBalance < 70) opportunities.push("Add Capital Goods exposure after valuation validation.");
  if (portfolioQuality < 70) opportunities.push("Increase Quality Score by preferring high ROE, high ROCE, low debt names.");
  if (momentum < 60) opportunities.push("Improve momentum by rotating out of persistent underperformers.");
  if (cashManagement < 70) opportunities.push("Maintain 5-10% cash or liquid allocation.");
  if (risk.riskScore < 80) opportunities.push(risk.recommendations[0] ?? "Reduce concentration risk.");
  if (!metrics.sectorAllocations.some((sector) => sector.sector.includes("Information Technology"))) {
    opportunities.push("Add IT sector exposure if trend and valuation are supportive.");
  }

  return opportunities.length ? [...new Set(opportunities)].slice(0, 4) : ["Maintain quality discipline and review weekly."];
}

function getGrade(score: number): PortfolioHealthGrade {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Average";
  return "Weak";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
