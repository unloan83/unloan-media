import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BREEZE_API_KEY = process.env.BREEZE_API_KEY;
const BREEZE_SESSION_TOKEN = process.env.BREEZE_SESSION_TOKEN;

async function fetchFromCustomSource(ticker: string) {
  if (!BREEZE_API_KEY || !BREEZE_SESSION_TOKEN) {
    throw new Error('Custom credentials missing');
  }

  const response = await fetch(
    `https://api.icicidirect.com/breezeapi/v1/getquotes?stock_code=${ticker}&exchange_code=NSE`,
    {
      method: 'GET',
      headers: {
        'X-AppKey': BREEZE_API_KEY,
        'X-SessionToken': BREEZE_SESSION_TOKEN,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 5 }
    }
  );

  if (!response.ok) throw new Error('Primary API rejected request');
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
  throw new Error('Invalid packet shape');
}

async function fetchFromFinnhubFallback(ticker: string) {
  if (!FINNHUB_API_KEY) throw new Error('Finnhub key missing');

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${FINNHUB_API_KEY}`,
    { next: { revalidate: 10 } }
  );

  if (!response.ok) throw new Error('Fallback failed');
  const data = await response.json();
  
  if (!data.c) throw new Error('No data from Finnhub');

  return {
    source: 'Global Fallback',
    ticker: ticker.toUpperCase(),
    price: data.c || 0,
    change: data.d || 0,
    changePercent: data.dp || 0,
    high: data.h || 0,
    low: data.l || 0,
    volume: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }

  try {
    // 1. Attempt Custom Broker Connection
    const data = await fetchFromCustomSource(ticker);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    try {
      // 2. Attempt Free Finnhub API Connection
      const fallback = await fetchFromFinnhubFallback(ticker);
      return NextResponse.json(fallback, { status: 200 });
    } catch (fallbackErr) {
      
      // 3. SECURE SIMULATION MODE: If your tokens are totally blank right now, 
      // this returns safe, responsive dummy numbers so your UI doesn't crash or stay blank!
      const mockPrices: Record<string, number> = { RELIANCE: 2450.50, TCS: 3920.00, INFY: 1440.25, AAPL: 175.50 };
      const basePrice = mockPrices[ticker.toUpperCase()] || 100.00;
      const randomChange = (Math.random() * 4) - 2; // Random daily fluctuation

      return NextResponse.json({
        source: 'Simulation Data Feed',
        ticker: ticker.toUpperCase(),
        price: basePrice + randomChange,
        change: randomChange,
        changePercent: (randomChange / basePrice) * 100,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        volume: 450000,
        updatedAt: new Date().toISOString(),
      }, { status: 200 });
    }
  }
}
