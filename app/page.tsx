import React from 'react';
import StockTickerCard from './components/StockTickerCard';

// Force the server to re-fetch and generate fresh data on every page load
export const dynamic = 'force-dynamic';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BREEZE_API_KEY = process.env.BREEZE_API_KEY;
const BREEZE_SESSION_TOKEN = process.env.BREEZE_SESSION_TOKEN;

// Server-side internal data engine
async function getStockMetrics(ticker: string) {
  try {
    // 1. Attempt Custom Broker Call
    if (!BREEZE_API_KEY || !BREEZE_SESSION_TOKEN) throw new Error('No custom configurations');
    
    const response = await fetch(
      `https://api.icicidirect.com/breezeapi/v1/getquotes?stock_code=${ticker}&exchange_code=NSE`,
      {
        headers: {
          'X-AppKey': BREEZE_API_KEY,
          'X-SessionToken': BREEZE_SESSION_TOKEN,
          'Content-Type': 'application/json',
        }
      }
    );
    const data = await response.json();
    if (data.status === 200 && data.Success?.length > 0) {
      const raw = data.Success[0];
      return {
        source: 'NSE Live',
        ticker: ticker.toUpperCase(),
        price: parseFloat(raw.ltp),
        change: parseFloat(raw.change),
        changePercent: parseFloat(raw.pChange),
        high: parseFloat(raw.high),
        low: parseFloat(raw.low),
        volume: parseInt(raw.volume, 10),
        updatedAt: new Date().toISOString(),
      };
    }
    throw new Error('Fallback triggered');
  } catch {
    try {
      // 2. Attempt Fallback Global API
      if (!FINNHUB_API_KEY) throw new Error('No API Key');
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${FINNHUB_API_KEY}`);
      const data = await response.json();
      if (!data.c) throw new Error('Empty dataset');
      
      return {
        source: 'Global Fallback',
        ticker: ticker.toUpperCase(),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        volume: 0,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      // 3. Absolute Safe Simulation Mode
      const mockPrices: Record<string, number> = { RELIANCE: 2450.50, TCS: 3920.00, INFY: 1440.25, AAPL: 175.50 };
      const basePrice = mockPrices[ticker.toUpperCase()] || 150.00;
      return {
        source: 'Simulation Mode',
        ticker: ticker.toUpperCase(),
        price: basePrice,
        change: 12.50,
        changePercent: 0.85,
        high: basePrice * 1.01,
        low: basePrice * 0.99,
        volume: 250000,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export default async function DashboardHome() {
  const targetWatchlist = ['RELIANCE', 'TCS', 'INFY', 'AAPL'];
  
  // Fetch all stock rows simultaneously directly on the server
  const activeGridData = await Promise.all(
    targetWatchlist.map((ticker) => getStockMetrics(ticker))
  );

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              OpenStock <span className="text-sm font-normal text-zinc-500 px-2 border border-zinc-800 rounded ml-2">Custom Replica</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Real-time asset validation and cross-provider terminal matrix.</p>
          </div>
        </header>

        <section>
          <h2 className="text-xs font-bold text-zinc-500 mb-6 tracking-widest uppercase">Active Workspace Monitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeGridData.map((stock) => (
              <StockTickerCard key={stock.ticker} data={stock} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
