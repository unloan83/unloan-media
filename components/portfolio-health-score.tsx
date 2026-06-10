"use client";

import { Activity, HeartPulse, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  analyzePortfolioHealthScore,
  type PortfolioHealthGrade,
} from "@/lib/portfolio-health";
import type { ManagedPortfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type HealthHistoryPoint = {
  portfolioId: string;
  portfolioName: string;
  score: number;
  capturedAt: string;
};

const healthHistoryStorageKey = "unloan-portfolio-health-score-history";

export function PortfolioHealthScore({
  portfolio,
  compact = false,
}: {
  portfolio: ManagedPortfolio;
  compact?: boolean;
}) {
  const health = useMemo(() => analyzePortfolioHealthScore(portfolio), [portfolio]);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const change = previousScore === null ? 0 : health.healthScore - previousScore;
  const tone = getTone(health.grade);

  useEffect(() => {
    const history = readHealthHistory();
    const portfolioHistory = history
      .filter((item) => item.portfolioId === portfolio.id)
      .sort(
        (a, b) =>
          new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
      );
    const previous = portfolioHistory.find((item) => item.score !== health.healthScore);

    setPreviousScore(previous?.score ?? portfolioHistory[0]?.score ?? null);
    writeHealthHistory([
      {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        score: health.healthScore,
        capturedAt: new Date().toISOString(),
      },
      ...history,
    ]);
  }, [health.healthScore, portfolio.id, portfolio.name]);

  if (compact) {
    return (
      <section
        className={cn(
          "rounded-lg border bg-zinc-950 p-4 text-left text-zinc-100 shadow-sm",
          toneClasses[tone].shell,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-400">Portfolio Health Score</div>
            <div className={cn("mt-2 text-3xl font-semibold leading-none", toneClasses[tone].text)}>
              {health.healthScore}
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-300">
              {health.grade}
            </div>
          </div>
          <HeartPulse className={cn("h-5 w-5 shrink-0", toneClasses[tone].text)} aria-hidden="true" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
          <div>
            <span className="block text-zinc-500">Last Week</span>
            <span className="font-semibold">{previousScore ?? "NA"}</span>
          </div>
          <div>
            <span className="block text-zinc-500">Change</span>
            <span className={cn("font-semibold", change >= 0 ? "text-emerald-300" : "text-red-300")}>
              {previousScore === null ? "NA" : `${change >= 0 ? "+" : ""}${change}`}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "space-y-3 rounded-md border bg-zinc-950 p-3 text-zinc-100 shadow-sm",
        toneClasses[tone].shell,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("flex items-center gap-2 text-sm font-semibold", toneClasses[tone].text)}>
            <HeartPulse className="h-4 w-4" aria-hidden="true" />
            <span>Portfolio Health Score</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Quality-first score using diversification, sector balance, quality,
            momentum, cash management, and risk integration.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("text-3xl font-semibold leading-none", toneClasses[tone].text)}>
            {health.healthScore}
          </div>
          <div className="text-[11px] font-medium text-zinc-400">{health.grade}</div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <TrendTile label="Current Score" value={String(health.healthScore)} />
        <TrendTile label="Previous Score" value={previousScore === null ? "NA" : String(previousScore)} />
        <TrendTile
          label="Change"
          value={previousScore === null ? "NA" : `${change >= 0 ? "+" : ""}${change}`}
          positive={change >= 0}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-6">
        {health.components.map((component) => (
          <div key={component.label} className="rounded border border-white/10 bg-white/5 p-2">
            <div className="truncate text-[10px] uppercase tracking-normal text-zinc-500">
              {component.label}
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-sm font-semibold">{component.score}</span>
              <span className="text-[10px] text-zinc-500">
                {(component.weight * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <HealthList title="Strengths" items={health.strengths} tone="up" />
        <HealthList title="Weaknesses" items={health.weaknesses} tone="flat" />
        <HealthList title="Improvement Opportunities" items={health.opportunities} tone="down" />
      </div>

      {health.placeholders.length > 0 ? (
        <div className="rounded border border-sky-300/30 bg-sky-300/10 px-2 py-1.5 text-[11px] leading-4 text-sky-100">
          Placeholder quality architecture active for unavailable fundamentals:
          {" "}
          {health.placeholders.join(" ")}
        </div>
      ) : null}
    </section>
  );
}

function TrendTile({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/5 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-normal text-zinc-500">
        {label === "Change" ? (
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Activity className="h-3 w-3" aria-hidden="true" />
        )}
        {label}
      </div>
      <div className={cn("mt-1 text-sm font-semibold", positive === undefined ? "text-zinc-100" : positive ? "text-emerald-300" : "text-red-300")}>
        {value}
      </div>
    </div>
  );
}

function HealthList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: keyof typeof listToneClasses;
}) {
  return (
    <div className="space-y-2 rounded border border-white/10 bg-white/5 p-2">
      <div className={cn("text-xs font-semibold", listToneClasses[tone])}>{title}</div>
      <ul className="space-y-1.5 text-[11px] leading-5 text-zinc-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function readHealthHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(healthHistoryStorageKey) ?? "[]",
    ) as HealthHistoryPoint[];
  } catch {
    return [];
  }
}

function writeHealthHistory(history: HealthHistoryPoint[]) {
  if (typeof window === "undefined") {
    return;
  }

  const latestByDay = history.reduce<Record<string, HealthHistoryPoint>>((acc, item) => {
    const day = item.capturedAt.slice(0, 10);
    const key = `${item.portfolioId}-${day}`;

    if (!acc[key] || new Date(item.capturedAt) > new Date(acc[key].capturedAt)) {
      acc[key] = item;
    }

    return acc;
  }, {});

  window.localStorage.setItem(
    healthHistoryStorageKey,
    JSON.stringify(Object.values(latestByDay).slice(0, 365)),
  );
}

function getTone(grade: PortfolioHealthGrade) {
  if (grade === "Excellent" || grade === "Good") return "up";
  if (grade === "Average") return "flat";
  return "down";
}

const toneClasses = {
  up: {
    shell: "border-emerald-400/50",
    text: "text-emerald-300",
  },
  flat: {
    shell: "border-amber-300/50",
    text: "text-amber-300",
  },
  down: {
    shell: "border-red-400/50",
    text: "text-red-300",
  },
} as const;

const listToneClasses = {
  up: "text-emerald-300",
  flat: "text-amber-300",
  down: "text-sky-300",
} as const;
