import { NextResponse } from "next/server";
import {
  PortfolioInputRow,
  PortfolioList,
  PortfolioPosition,
  resolveStockProfile,
} from "@/lib/portfolio";

export const dynamic = "force-dynamic";

type QuoteRequest = {
  rows?: Array<Partial<PortfolioInputRow>>;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        symbol?: string;
      };
    }>;
    error?: {
      description?: string;
    };
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as QuoteRequest;
  const rows = normalizeRows(body.rows ?? []);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid stocks found in the uploaded CSV." },
      { status: 400 },
    );
  }

  const positions = await Promise.all(rows.map(resolveQuote));
  const unresolved = positions.filter((position) => !position.currentPrice);

  return NextResponse.json({
    positions,
    unresolved: unresolved.map((position) => position.stock),
    refreshedAt: new Date().toISOString(),
  });
}

function normalizeRows(rows: Array<Partial<PortfolioInputRow>>): PortfolioInputRow[] {
  return rows
    .map((row) => {
      const list: PortfolioList = row.list === "watchlist" ? "watchlist" : "current";
      const stock = String(row.stock ?? "").trim();
      const quantity = list === "watchlist" ? 0 : Number(row.quantity);

      return {
        list,
        stock,
        quantity,
      };
    })
    .filter((row) => row.stock && (row.list === "watchlist" || row.quantity > 0));
}

async function resolveQuote(row: PortfolioInputRow): Promise<PortfolioPosition> {
  const profile = resolveStockProfile(row.stock);
  const yahooSymbol = `${profile.symbol}.NS`;
  const quote = await fetchYahooQuote(yahooSymbol);

  return {
    list: row.list,
    stock: row.stock,
    symbol: profile.symbol,
    company: profile.company,
    sector: profile.sector,
    quantity: row.list === "current" ? row.quantity : 0,
    currentPrice: quote.currentPrice,
    previousClose: quote.previousClose,
    currency: "INR",
  };
}

async function fetchYahooQuote(symbol: string) {
  const fallback = {
    currentPrice: 0,
    previousClose: 0,
  };

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    const currentPrice = meta?.regularMarketPrice ?? 0;
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? 0;

    return {
      currentPrice,
      previousClose,
    };
  } catch {
    return fallback;
  }
}
