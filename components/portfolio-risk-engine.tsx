"use client";

import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { analyzePortfolioRisk, type RiskStatus } from "@/lib/risk-engine";
import type { ManagedPortfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export function PortfolioRiskEngine({
  portfolio,
}: {
  portfolio: ManagedPortfolio;
}) {
  const risk = analyzePortfolioRisk(portfolio);
  const Icon = statusIcon[risk.riskStatus];

  return (
    <section
      className={cn(
        "space-y-3 rounded-md border bg-zinc-950 p-3 text-zinc-100 shadow-sm",
        statusClasses[risk.riskStatus].shell,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("flex items-center gap-2 text-sm font-semibold", statusClasses[risk.riskStatus].text)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>Portfolio Risk Status</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Concentration, sector, small-cap, cash, and correlation risk check.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("text-3xl font-semibold leading-none", statusClasses[risk.riskStatus].text)}>
            {risk.riskScore}
          </div>
          <div className="text-[11px] font-medium text-zinc-400">
            {risk.riskStatus} / 100
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <RiskMetric
          label="Top Stock"
          value={`${risk.metrics.maxStockSymbol} ${risk.metrics.maxStockAllocation.toFixed(1)}%`}
        />
        <RiskMetric
          label="Top Sector"
          value={`${risk.metrics.maxSectorName} ${risk.metrics.maxSectorAllocation.toFixed(1)}%`}
        />
        <RiskMetric
          label="Small Cap"
          value={`${risk.metrics.smallCapAllocation.toFixed(1)}%`}
        />
        <RiskMetric
          label="Cash"
          value={`${risk.metrics.cashAllocation.toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <RiskList title="Top Risks" items={risk.risks} riskStatus={risk.riskStatus} />
        <RiskList
          title="Recommended Actions"
          items={risk.recommendations}
          riskStatus={risk.riskStatus}
        />
      </div>
    </section>
  );
}

function RiskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-white/10 bg-white/5 p-2">
      <div className="text-[10px] uppercase tracking-normal text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function RiskList({
  title,
  items,
  riskStatus,
}: {
  title: string;
  items: string[];
  riskStatus: RiskStatus;
}) {
  return (
    <div className="space-y-2 rounded border border-white/10 bg-white/5 p-2">
      <div className={cn("flex items-center gap-1.5 text-xs font-semibold", statusClasses[riskStatus].text)}>
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </div>
      <ul className="space-y-1.5 text-[11px] leading-5 text-zinc-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const statusIcon = {
  GREEN: ShieldCheck,
  YELLOW: ShieldAlert,
  RED: ShieldX,
} as const;

const statusClasses: Record<
  RiskStatus,
  {
    shell: string;
    text: string;
  }
> = {
  GREEN: {
    shell: "border-emerald-400/50",
    text: "text-emerald-300",
  },
  YELLOW: {
    shell: "border-amber-300/50",
    text: "text-amber-300",
  },
  RED: {
    shell: "border-red-400/50",
    text: "text-red-300",
  },
};
