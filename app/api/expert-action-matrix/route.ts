import { NextResponse } from "next/server";
import {
  analyzeStockSignal,
  buildSignalRemark,
  getSignalAction,
  type PriceBar,
  type StockSignalMetrics,
} from "@/lib/analysis";

export const dynamic = "force-dynamic";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketVolume?: number;
        shortName?: string;
        longName?: string;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

type ExpertQuote = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  volumeShock: number;
  target: number;
  upside: number;
  score: number;
  action: "Accumulate" | "Urgent Sell";
  remark: string;
  caveats: string[];
  metrics: StockSignalMetrics;
};

type ExpertCategory = {
  key: string;
  title: string;
  longTermUpsides: ExpertQuote[];
  intradayBreakouts: ExpertQuote[];
};

const expertUniverse = {
  largeCap: [
    "RELIANCE",
    "HDFCBANK",
    "TCS",
    "ICICIBANK",
    "INFY",
    "NTPC",
    "POWERGRID",
    "SBIN",
    "SUNPHARMA",
    "BHARTIARTL",
    "PATANJALI",
    "MAXHEALTH",
    "RECLTD",
    "VBL",
  ],
  midCap: ["AHLUCONT", "BALAMINES", "POLYCAB", "DIXON", "PERSISTENT", "CUMMINSIND"],
  smallCap: [
    "GIPCL",
    "NUCLEUS",
    "TEXRAIL",
    "ORISSAMINE",
    "RAMASTEEL",
    "DWARKESH",
    "MOREPENLAB",
    "SUZLON",
    "IREDA",
    "RVNL",
  ],
  etf: ["GOLDBEES", "AUTOBEES", "ITBEES", "NIFTYBEES", "BANKBEES", "JUNIORBEES"],
};

const categoryMeta = {
  largeCap: {
    title: "Large-Cap Bluechips",
    targetFloor: 1.15,
    targetCeiling: 1.45,
  },
  midCap: {
    title: "Mid-Cap Momentum",
    targetFloor: 1.12,
    targetCeiling: 1.32,
  },
  smallCap: {
    title: "Small-Cap Alpha",
    targetFloor: 1.15,
    targetCeiling: 2.35,
  },
  etf: {
    title: "ETFs & Index BeES",
    targetFloor: 1.08,
    targetCeiling: 1.08,
  },
};

export async function GET() {
  const categories = await Promise.all(
    Object.entries(expertUniverse).map(async ([key, symbols]) => {
      const quotes = (
        await Promise.all(
          symbols.map((symbol) =>
            fetchExpertQuote(symbol, categoryMeta[key as keyof typeof categoryMeta].title),
          ),
        )
      ).filter((quote) => quote.price > 0);

      return {
        key,
        title: categoryMeta[key as keyof typeof categoryMeta].title,
        longTermUpsides: [...quotes]
          .sort((a, b) => b.score + b.upside - (a.score + a.upside))
          .slice(0, 5),
        intradayBreakouts: [...quotes]
          .sort((a, b) => b.metrics.finalScore + b.volumeShock * 5 - (a.metrics.finalScore + a.volumeShock * 5))
          .slice(0, 5),
      } satisfies ExpertCategory;
    }),
  );

  return NextResponse.json({
    title: "Expert Action Matrix",
    verified: "NSE quote, EMA20/50, VWAP, ATR, volume shock, target, risk and caveat scoring",
    source: "Adapted from unloan83/Expert_insight recommendation matrix style",
    asOf: new Date().toISOString(),
    refreshCycle: "Intraday breakout signals refresh every 5 minutes; long-term targets refresh every 15 minutes.",
    caveat: "For research and screening only. Validate with fundamentals, news, liquidity, and risk controls before investing.",
    categories,
  });
}

async function fetchExpertQuote(symbol: string, segment: string): Promise<ExpertQuote> {
  const fallback = {
    symbol,
    name: symbol,
    price: 0,
    previousClose: 0,
    changePercent: 0,
    volume: 0,
    volumeShock: 0,
    target: 0,
    upside: 0,
    score: 0,
    action: "Urgent Sell" as const,
    remark: "Quote unavailable.",
    caveats: ["Quote unavailable; do not act without live validation."],
    metrics: analyzeStockSignal({ symbol, price: 0, previousClose: 0 }),
  };

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        `${symbol}.NS`,
      )}?range=3mo&interval=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? 0;
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? 0;
    const changePercent =
      previousClose === 0 ? 0 : ((price - previousClose) / previousClose) * 100;
    const volume = meta?.regularMarketVolume ?? 0;
    const bars = buildPriceBars(data.chart?.result?.[0]?.indicators?.quote?.[0]);
    const metrics = analyzeStockSignal({
      symbol,
      price,
      previousClose,
      volume,
      bars,
      segment,
      profile: "intraday",
    });

    return {
      symbol,
      name: meta?.shortName ?? meta?.longName ?? symbol,
      price,
      previousClose,
      changePercent,
      volume,
      volumeShock: metrics.volumeShock,
      target: metrics.target,
      upside: metrics.upsidePercent,
      score: metrics.finalScore,
      action: getSignalAction(metrics, "intraday"),
      remark: buildSignalRemark(metrics, "intraday"),
      caveats: metrics.caveats,
      metrics,
    };
  } catch {
    return fallback;
  }
}

function buildPriceBars(quote?: {
  close?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  volume?: Array<number | null>;
}): PriceBar[] {
  const closes = quote?.close ?? [];

  return closes
    .map((close, index) => ({
      close: close ?? 0,
      high: quote?.high?.[index] ?? close ?? 0,
      low: quote?.low?.[index] ?? close ?? 0,
      volume: quote?.volume?.[index] ?? 0,
    }))
    .filter((bar) => bar.close > 0 && bar.high > 0 && bar.low > 0);
}
