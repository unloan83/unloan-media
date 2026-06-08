export type PortfolioList = "current" | "watchlist";

export type PortfolioInputRow = {
  list: PortfolioList;
  stock: string;
  quantity: number;
};

export type PortfolioPosition = {
  list: PortfolioList;
  stock: string;
  symbol: string;
  company: string;
  sector: string;
  quantity: number;
  currentPrice: number;
  previousClose: number;
  currency: "INR";
};

export type SectorAllocation = {
  sector: string;
  value: number;
  percentage: number;
};

export type GrowthPoint = {
  month: string;
  value: number;
};

export type HoldingWithMetrics = PortfolioPosition & {
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  portfolioWeight: number;
};

export type PortfolioMetrics = {
  holdings: HoldingWithMetrics[];
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  sectorAllocations: SectorAllocation[];
  growth: GrowthPoint[];
};

export type StockProfile = {
  symbol: string;
  company: string;
  sector: string;
};

const numberFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
  maximumFractionDigits: 0,
});

const compactInrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
});

const stockProfiles: Record<string, StockProfile> = {
  ASIANPAINT: {
    symbol: "ASIANPAINT",
    company: "Asian Paints",
    sector: "Consumer Discretionary",
  },
  AXISBANK: {
    symbol: "AXISBANK",
    company: "Axis Bank",
    sector: "Financial Services",
  },
  BAJFINANCE: {
    symbol: "BAJFINANCE",
    company: "Bajaj Finance",
    sector: "Financial Services",
  },
  BHARTIARTL: {
    symbol: "BHARTIARTL",
    company: "Bharti Airtel",
    sector: "Telecommunication",
  },
  HCLTECH: {
    symbol: "HCLTECH",
    company: "HCL Technologies",
    sector: "Information Technology",
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    company: "HDFC Bank",
    sector: "Financial Services",
  },
  HINDUNILVR: {
    symbol: "HINDUNILVR",
    company: "Hindustan Unilever",
    sector: "Fast Moving Consumer Goods",
  },
  ICICIBANK: {
    symbol: "ICICIBANK",
    company: "ICICI Bank",
    sector: "Financial Services",
  },
  INFY: {
    symbol: "INFY",
    company: "Infosys",
    sector: "Information Technology",
  },
  ITC: {
    symbol: "ITC",
    company: "ITC",
    sector: "Fast Moving Consumer Goods",
  },
  KOTAKBANK: {
    symbol: "KOTAKBANK",
    company: "Kotak Mahindra Bank",
    sector: "Financial Services",
  },
  LT: {
    symbol: "LT",
    company: "Larsen & Toubro",
    sector: "Construction",
  },
  MARUTI: {
    symbol: "MARUTI",
    company: "Maruti Suzuki India",
    sector: "Automobile and Auto Components",
  },
  NESTLEIND: {
    symbol: "NESTLEIND",
    company: "Nestle India",
    sector: "Fast Moving Consumer Goods",
  },
  NTPC: {
    symbol: "NTPC",
    company: "NTPC",
    sector: "Power",
  },
  RELIANCE: {
    symbol: "RELIANCE",
    company: "Reliance Industries",
    sector: "Oil Gas and Consumable Fuels",
  },
  SBIN: {
    symbol: "SBIN",
    company: "State Bank of India",
    sector: "Financial Services",
  },
  SUNPHARMA: {
    symbol: "SUNPHARMA",
    company: "Sun Pharmaceutical Industries",
    sector: "Healthcare",
  },
  TCS: {
    symbol: "TCS",
    company: "Tata Consultancy Services",
    sector: "Information Technology",
  },
  TATAMOTORS: {
    symbol: "TATAMOTORS",
    company: "Tata Motors",
    sector: "Automobile and Auto Components",
  },
  TATASTEEL: {
    symbol: "TATASTEEL",
    company: "Tata Steel",
    sector: "Metals and Mining",
  },
  TITAN: {
    symbol: "TITAN",
    company: "Titan Company",
    sector: "Consumer Durables",
  },
  ULTRACEMCO: {
    symbol: "ULTRACEMCO",
    company: "UltraTech Cement",
    sector: "Construction Materials",
  },
  WIPRO: {
    symbol: "WIPRO",
    company: "Wipro",
    sector: "Information Technology",
  },
};

const stockAliases: Record<string, string> = {
  "ASIAN PAINTS": "ASIANPAINT",
  "AXIS BANK": "AXISBANK",
  "BAJAJ FINANCE": "BAJFINANCE",
  "BHARTI AIRTEL": "BHARTIARTL",
  "HCL TECHNOLOGIES": "HCLTECH",
  "HDFC BANK": "HDFCBANK",
  "HINDUSTAN UNILEVER": "HINDUNILVR",
  "ICICI BANK": "ICICIBANK",
  INFOSYS: "INFY",
  "KOTAK MAHINDRA BANK": "KOTAKBANK",
  "LARSEN & TOUBRO": "LT",
  "LARSEN AND TOUBRO": "LT",
  "MARUTI SUZUKI": "MARUTI",
  "MARUTI SUZUKI INDIA": "MARUTI",
  "NESTLE INDIA": "NESTLEIND",
  "RELIANCE INDUSTRIES": "RELIANCE",
  "STATE BANK OF INDIA": "SBIN",
  SBI: "SBIN",
  "SUN PHARMA": "SUNPHARMA",
  "SUN PHARMACEUTICAL": "SUNPHARMA",
  "SUN PHARMACEUTICAL INDUSTRIES": "SUNPHARMA",
  "TATA CONSULTANCY SERVICES": "TCS",
  "TATA MOTORS": "TATAMOTORS",
  "TATA STEEL": "TATASTEEL",
  "TITAN COMPANY": "TITAN",
  "ULTRATECH CEMENT": "ULTRACEMCO",
};

const companySectorKeywords: Array<[string, string]> = [
  ["bank", "Financial Services"],
  ["finance", "Financial Services"],
  ["financial", "Financial Services"],
  ["insurance", "Financial Services"],
  ["technologies", "Information Technology"],
  ["technology", "Information Technology"],
  ["software", "Information Technology"],
  ["pharma", "Healthcare"],
  ["hospital", "Healthcare"],
  ["motors", "Automobile and Auto Components"],
  ["auto", "Automobile and Auto Components"],
  ["steel", "Metals and Mining"],
  ["cement", "Construction Materials"],
  ["power", "Power"],
  ["energy", "Oil Gas and Consumable Fuels"],
  ["oil", "Oil Gas and Consumable Fuels"],
  ["gas", "Oil Gas and Consumable Fuels"],
  ["telecom", "Telecommunication"],
  ["consumer", "Fast Moving Consumer Goods"],
  ["foods", "Fast Moving Consumer Goods"],
];

export function formatCurrency(value: number) {
  return numberFormatter.format(value);
}

export function formatCompactInr(value: number) {
  if (Math.abs(value) >= 10000000) {
    return `INR ${compactInrFormatter.format(value / 10000000)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `INR ${compactInrFormatter.format(value / 100000)}L`;
  }

  return `INR ${compactInrFormatter.format(value / 1000)}k`;
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function calculatePortfolioMetrics(
  positions: PortfolioPosition[],
): PortfolioMetrics {
  const currentPositions = positions.filter(
    (position) => position.list === "current" && position.quantity > 0,
  );
  const baseHoldings = currentPositions.map((holding) => {
    const marketValue = holding.quantity * holding.currentPrice;
    const dayChange = holding.quantity * (holding.currentPrice - holding.previousClose);
    const dayChangePercent =
      holding.previousClose === 0
        ? 0
        : ((holding.currentPrice - holding.previousClose) / holding.previousClose) *
          100;

    return {
      ...holding,
      marketValue,
      dayChange,
      dayChangePercent,
      portfolioWeight: 0,
    };
  });

  const totalValue = baseHoldings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );
  const dayChange = baseHoldings.reduce(
    (sum, holding) => sum + holding.dayChange,
    0,
  );
  const dayChangePercent =
    totalValue - dayChange === 0
      ? 0
      : (dayChange / (totalValue - dayChange)) * 100;

  const holdingsWithWeights = baseHoldings
    .map((holding) => ({
      ...holding,
      portfolioWeight:
        totalValue === 0 ? 0 : (holding.marketValue / totalValue) * 100,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);

  const sectorMap = holdingsWithWeights.reduce<Record<string, number>>(
    (acc, holding) => {
      acc[holding.sector] = (acc[holding.sector] ?? 0) + holding.marketValue;
      return acc;
    },
    {},
  );

  const sectorAllocations = Object.entries(sectorMap)
    .map(([sector, value]) => ({
      sector,
      value,
      percentage: totalValue === 0 ? 0 : (value / totalValue) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    holdings: holdingsWithWeights,
    totalValue,
    dayChange,
    dayChangePercent,
    sectorAllocations,
    growth: buildGrowthSeries(totalValue - dayChange, totalValue),
  };
}

function buildGrowthSeries(previousValue: number, totalValue: number): GrowthPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const start = previousValue * 0.94;
  const end = totalValue;

  return months.map((month, index) => {
    const progress = index / (months.length - 1);
    const wave = Math.sin(index * 1.4) * totalValue * 0.01;
    return {
      month,
      value: Math.round(start + (end - start) * progress + wave),
    };
  });
}

export function resolveStockProfile(stock: string): StockProfile {
  const normalizedStock = normalizeStockKey(stock);
  const symbol = stockAliases[normalizedStock] ?? normalizedStock;
  const cleanSymbol = symbol.replace(/\.NS$|\.BO$/u, "");

  if (stockProfiles[cleanSymbol]) {
    return stockProfiles[cleanSymbol];
  }

  return {
    symbol: cleanSymbol,
    company: stock.trim(),
    sector: identifySector(cleanSymbol, stock),
  };
}

export function identifySector(symbol: string, company = "", fallback = "Unclassified") {
  const normalizedSymbol = symbol
    .trim()
    .toUpperCase()
    .replace(/\.NS$|\.BO$/u, "");

  if (stockProfiles[normalizedSymbol]) {
    return stockProfiles[normalizedSymbol].sector;
  }

  const normalizedCompany = company.trim().toLowerCase();
  const match = companySectorKeywords.find(([keyword]) =>
    normalizedCompany.includes(keyword),
  );

  return match?.[1] ?? fallback;
}

function normalizeStockKey(stock: string) {
  return stock
    .trim()
    .toUpperCase()
    .replace(/\.NS$|\.BO$/u, "")
    .replace(/[^A-Z0-9& ]/gu, "")
    .replace(/\s+/gu, " ");
}

export const sampleInputs: PortfolioInputRow[] = [
  { list: "current", stock: "Reliance Industries", quantity: 42 },
  { list: "current", stock: "TCS", quantity: 28 },
  { list: "current", stock: "HDFC Bank", quantity: 68 },
  { list: "current", stock: "Infosys", quantity: 54 },
  { list: "current", stock: "ICICI Bank", quantity: 82 },
  { list: "watchlist", stock: "Maruti Suzuki India", quantity: 0 },
  { list: "watchlist", stock: "Sun Pharma", quantity: 0 },
  { list: "watchlist", stock: "Titan Company", quantity: 0 },
];

export const samplePositions: PortfolioPosition[] = [
  {
    list: "current",
    stock: "Reliance Industries",
    symbol: "RELIANCE",
    company: "Reliance Industries",
    sector: "Oil Gas and Consumable Fuels",
    quantity: 42,
    currentPrice: 2864,
    previousClose: 2838,
    currency: "INR",
  },
  {
    list: "current",
    stock: "TCS",
    symbol: "TCS",
    company: "Tata Consultancy Services",
    sector: "Information Technology",
    quantity: 28,
    currentPrice: 3925,
    previousClose: 3898,
    currency: "INR",
  },
  {
    list: "current",
    stock: "HDFC Bank",
    symbol: "HDFCBANK",
    company: "HDFC Bank",
    sector: "Financial Services",
    quantity: 68,
    currentPrice: 1668,
    previousClose: 1656,
    currency: "INR",
  },
  {
    list: "current",
    stock: "Infosys",
    symbol: "INFY",
    company: "Infosys",
    sector: "Information Technology",
    quantity: 54,
    currentPrice: 1516,
    previousClose: 1502,
    currency: "INR",
  },
  {
    list: "current",
    stock: "ICICI Bank",
    symbol: "ICICIBANK",
    company: "ICICI Bank",
    sector: "Financial Services",
    quantity: 82,
    currentPrice: 1118,
    previousClose: 1106,
    currency: "INR",
  },
  {
    list: "watchlist",
    stock: "Maruti Suzuki India",
    symbol: "MARUTI",
    company: "Maruti Suzuki India",
    sector: "Automobile and Auto Components",
    quantity: 0,
    currentPrice: 12680,
    previousClose: 12592,
    currency: "INR",
  },
  {
    list: "watchlist",
    stock: "Sun Pharma",
    symbol: "SUNPHARMA",
    company: "Sun Pharmaceutical Industries",
    sector: "Healthcare",
    quantity: 0,
    currentPrice: 1512,
    previousClose: 1496,
    currency: "INR",
  },
  {
    list: "watchlist",
    stock: "Titan Company",
    symbol: "TITAN",
    company: "Titan Company",
    sector: "Consumer Durables",
    quantity: 0,
    currentPrice: 3538,
    previousClose: 3508,
    currency: "INR",
  },
];
