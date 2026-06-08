import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockData {
  source: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  updatedAt: string;
}

export default function StockTickerCard({ data }: { data: StockData }) {
  const isPositive = data.change >= 0;

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl transition-all hover:border-zinc-700">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
            {data.source}
          </span>
          <h3 className="text-xl font-bold text-white mt-2 tracking-tight">{data.ticker}</h3>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
          isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
        }`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(data.changePercent).toFixed(2)}%
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-3xl font-black text-white">
          ₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        <span className={`text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}{data.change.toFixed(2)}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-[11px] text-zinc-500 font-medium">
        <div>High: <span className="text-zinc-300">₹{data.high}</span> | Low: <span className="text-zinc-300">₹{data.low}</span></div>
        <div className="text-zinc-400 font-mono">
          {new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
