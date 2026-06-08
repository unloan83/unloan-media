"use client";

import Papa from "papaparse";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Download,
  FileUp,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ManagedPortfolio,
  PortfolioInputRow,
  PortfolioPosition,
  Recommendation,
  RecommendationStatus,
  calculatePortfolioMetrics,
  formatCurrency,
  formatPercent,
  generateRecommendations,
  samplePortfolio,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

const sectorColors = [
  "#0f8b8d",
  "#f4a261",
  "#4f7cac",
  "#d1495b",
  "#2a9d8f",
  "#6d597a",
  "#8ab17d",
  "#e76f51",
];

const portfoliosStorageKey = "multibagger-portfolios";
const historyStorageKey = "multibagger-recommendation-history";

type CsvRow = {
  list?: string;
  type?: string;
  stock?: string;
  name?: string;
  quantity?: string;
  qty?: string;
};

export function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState<ManagedPortfolio[]>([
    samplePortfolio,
  ]);
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [draftRows, setDraftRows] = useState<PortfolioInputRow[]>([
    { list: "current", stock: "", quantity: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPortfolios = window.localStorage.getItem(portfoliosStorageKey);
    const savedHistory = window.localStorage.getItem(historyStorageKey);

    if (savedPortfolios) {
      setPortfolios(JSON.parse(savedPortfolios) as ManagedPortfolio[]);
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory) as Recommendation[]);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(portfoliosStorageKey, JSON.stringify(portfolios));
    window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
  }, [hydrated, portfolios, history]);

  const totalValue = useMemo(
    () =>
      portfolios.reduce(
        (sum, portfolio) =>
          sum + calculatePortfolioMetrics(portfolio.positions).totalValue,
        0,
      ),
    [portfolios],
  );

  function updateDraftRow(index: number, nextRow: Partial<PortfolioInputRow>) {
    setDraftRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...nextRow } : row,
      ),
    );
  }

  function parseCsvRows(file: File) {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data
          .map((row) => {
            const listValue = (row.list ?? row.type ?? "current")
              .trim()
              .toLowerCase();
            const list: PortfolioInputRow["list"] = listValue.includes("watch")
              ? "watchlist"
              : "current";

            return {
              list,
              stock: (row.stock ?? row.name ?? "").trim(),
              quantity:
                list === "watchlist" ? 0 : Number(row.quantity ?? row.qty ?? 0),
            };
          })
          .filter(
            (row) =>
              row.stock &&
              (row.list === "watchlist" ||
                (Number.isFinite(row.quantity) && row.quantity > 0)),
          );

        if (parsed.length === 0) {
          setError("CSV needs list, stock, quantity columns.");
          return;
        }

        setDraftRows(parsed);
        setError(null);
      },
      error: (parseError) => setError(parseError.message),
    });
  }

  async function addPortfolio() {
    const cleanName = portfolioName.trim();
    const cleanRows = draftRows.filter(
      (row) =>
        row.stock.trim() &&
        (row.list === "watchlist" ||
          (Number.isFinite(row.quantity) && row.quantity > 0)),
    );

    if (!cleanName) {
      setError("Add a portfolio name.");
      return;
    }

    if (cleanRows.length === 0) {
      setError("Add at least one current holding or watchlist stock.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const positions = await fetchQuotePositions(cleanRows);
      const portfolio: ManagedPortfolio = {
        id: `${Date.now()}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: cleanName,
        inputs: cleanRows,
        positions,
        refreshedAt: new Date().toISOString(),
      };

      setPortfolios((items) => [...items, portfolio]);
      setHistory((items) => [
        ...generateRecommendationList(portfolio, items),
        ...items,
      ]);
      setPortfolioName("");
      setDraftRows([{ list: "current", stock: "", quantity: 0 }]);
      setIsAddOpen(false);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to fetch quote details.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshPortfolio(portfolio: ManagedPortfolio) {
    setIsLoading(true);
    setError(null);

    try {
      const positions = await fetchQuotePositions(portfolio.inputs);
      const refreshed = {
        ...portfolio,
        positions,
        refreshedAt: new Date().toISOString(),
      };

      setPortfolios((items) =>
        items.map((item) => (item.id === portfolio.id ? refreshed : item)),
      );
      setHistory((items) => [
        ...generateRecommendationList(refreshed, items),
        ...items,
      ]);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to refresh quote details.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchQuotePositions(rows: PortfolioInputRow[]) {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });
    const payload = (await response.json()) as {
      positions?: PortfolioPosition[];
      error?: string;
    };

    if (!response.ok || !payload.positions) {
      throw new Error(payload.error ?? "Unable to fetch quote details.");
    }

    return payload.positions;
  }

  function updateHistoryStatus(id: string, status: RecommendationStatus) {
    setHistory((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  function removePortfolio(id: string) {
    setPortfolios((items) => items.filter((item) => item.id !== id));
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fafb_0%,#eef3f3_46%,#f7f8f5_100%)]">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">
              Multi-portfolio strategy dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Portfolio Command Center
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Add portfolios, fetch CMP and previous close, compare allocation,
              and track recommendation hit rate over time.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={downloadHistoryCsv}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download History
            </Button>
            <Button type="button" onClick={() => setIsAddOpen((value) => !value)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Portfolio
            </Button>
          </div>
        </header>

        <div className="grid dashboard-grid gap-4">
          <SummaryCard
            title="Total Portfolio Value"
            value={formatCurrency(totalValue)}
            detail={`${portfolios.length} portfolios tracked`}
          />
          <SummaryCard
            title="Recommendation History"
            value={`${history.length} records`}
            detail="Hit/Miss/NA feedback improves future scoring"
          />
          <SummaryCard
            title="Live Quote Source"
            value="CMP + Prev Close"
            detail="Fetched on upload and refresh"
          />
        </div>

        {isAddOpen ? (
          <AddPortfolioPanel
            draftRows={draftRows}
            error={error}
            fileInputRef={fileInputRef}
            isLoading={isLoading}
            portfolioName={portfolioName}
            setPortfolioName={setPortfolioName}
            parseCsvRows={parseCsvRows}
            updateDraftRow={updateDraftRow}
            addDraftRow={() =>
              setDraftRows((rows) => [
                ...rows,
                { list: "current", stock: "", quantity: 0 },
              ])
            }
            removeDraftRow={(index) =>
              setDraftRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
            }
            addPortfolio={addPortfolio}
          />
        ) : null}

        {error && !isAddOpen ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {portfolios.map((portfolio) => (
            <PortfolioColumn
              key={portfolio.id}
              history={history}
              portfolio={portfolio}
              isLoading={isLoading}
              onRefresh={() => refreshPortfolio(portfolio)}
              onRemove={() => removePortfolio(portfolio.id)}
              onStatusChange={updateHistoryStatus}
            />
          ))}
        </section>
      </section>
    </main>
  );

  function downloadHistoryCsv() {
    const rows = [
      [
        "date",
        "portfolio",
        "section",
        "symbol",
        "company",
        "action",
        "horizon",
        "confidence",
        "status",
        "rationale",
      ],
      ...history.map((item) => [
        item.createdAt,
        item.portfolioName,
        item.section,
        item.symbol,
        item.company,
        item.action,
        item.horizon,
        String(item.confidence),
        item.status,
        item.rationale,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recommendation-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
}

function AddPortfolioPanel({
  draftRows,
  error,
  fileInputRef,
  isLoading,
  portfolioName,
  setPortfolioName,
  parseCsvRows,
  updateDraftRow,
  addDraftRow,
  removeDraftRow,
  addPortfolio,
}: {
  draftRows: PortfolioInputRow[];
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  portfolioName: string;
  setPortfolioName: (value: string) => void;
  parseCsvRows: (file: File) => void;
  updateDraftRow: (index: number, row: Partial<PortfolioInputRow>) => void;
  addDraftRow: () => void;
  removeDraftRow: (index: number) => void;
  addPortfolio: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Portfolio</CardTitle>
        <CardDescription>
          Enter stocks manually or upload CSV with columns: list, stock, quantity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <input
          value={portfolioName}
          onChange={(event) => setPortfolioName(event.target.value)}
          placeholder="Portfolio name"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="space-y-2">
          {draftRows.map((row, index) => (
            <div key={`${row.stock}-${index}`} className="grid gap-2 md:grid-cols-[140px_1fr_120px_40px]">
              <select
                value={row.list}
                onChange={(event) =>
                  updateDraftRow(index, {
                    list: event.target.value as PortfolioInputRow["list"],
                    quantity:
                      event.target.value === "watchlist" ? 0 : row.quantity,
                  })
                }
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="current">Current</option>
                <option value="watchlist">Watchlist</option>
              </select>
              <input
                value={row.stock}
                onChange={(event) =>
                  updateDraftRow(index, { stock: event.target.value })
                }
                placeholder="Stock name or NSE symbol"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={row.quantity || ""}
                disabled={row.list === "watchlist"}
                onChange={(event) =>
                  updateDraftRow(index, { quantity: Number(event.target.value) })
                }
                placeholder="Qty"
                type="number"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeDraftRow(index)}
                disabled={draftRows.length === 1}
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              parseCsvRows(file);
            }
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={addDraftRow}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Row
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Upload CSV
          </Button>
          <Button type="button" onClick={addPortfolio} disabled={isLoading}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "Fetching quotes" : "Create Portfolio"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PortfolioColumn({
  portfolio,
  history,
  isLoading,
  onRefresh,
  onRemove,
  onStatusChange,
}: {
  portfolio: ManagedPortfolio;
  history: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  onRemove: () => void;
  onStatusChange: (id: string, status: RecommendationStatus) => void;
}) {
  const metrics = calculatePortfolioMetrics(portfolio.positions);
  const recommendations = generateRecommendations(portfolio, history);
  const portfolioHistory = history.filter(
    (item) => item.portfolioId === portfolio.id,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{portfolio.name}</CardTitle>
            <CardDescription>
              {metrics.holdings.length} holdings | {formatCurrency(metrics.totalValue)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh quotes and recommendations"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRemove}
              aria-label="Remove portfolio"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <PortfolioMiniSummary metrics={metrics} />

        <RecommendationBlock
          title="1. Intraday Recommendations"
          items={recommendations.intraday}
        />
        <RecommendationBlock
          title="2. 1-3 Yr Portfolio Growth Plan"
          items={recommendations.longTermPlan}
        />
        <RecommendationBlock
          title="3. Potential Multibagger Stocks"
          items={recommendations.multibaggerCandidates}
        />
        <RecommendationBlock
          title="4. ETF Recommendations"
          items={recommendations.etfs}
        />
        <SectorAllocationBlock metrics={metrics} />
        <HistoryBlock
          history={portfolioHistory}
          onStatusChange={onStatusChange}
        />
      </CardContent>
    </Card>
  );
}

function PortfolioMiniSummary({
  metrics,
}: {
  metrics: ReturnType<typeof calculatePortfolioMetrics>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-md border bg-muted/40 p-3">
        <div className="text-muted-foreground">Day Change</div>
        <div
          className={cn(
            "font-semibold",
            metrics.dayChange >= 0 ? "text-emerald-700" : "text-destructive",
          )}
        >
          {formatCurrency(metrics.dayChange)}
        </div>
      </div>
      <div className="rounded-md border bg-muted/40 p-3">
        <div className="text-muted-foreground">Move</div>
        <div
          className={cn(
            "font-semibold",
            metrics.dayChange >= 0 ? "text-emerald-700" : "text-destructive",
          )}
        >
          {formatPercent(metrics.dayChangePercent)}
        </div>
      </div>
    </div>
  );
}

function RecommendationBlock({
  title,
  items,
}: {
  title: string;
  items: Recommendation[];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {item.symbol} · {item.action}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.company} | {item.horizon}
                </div>
              </div>
              <div className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                {item.confidence}%
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {item.rationale}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectorAllocationBlock({
  metrics,
}: {
  metrics: ReturnType<typeof calculatePortfolioMetrics>;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">5. Sector Allocation</h2>
      <div className="grid gap-3 md:grid-cols-[130px_1fr]">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.sectorAllocations}
                dataKey="value"
                nameKey="sector"
                innerRadius={30}
                outerRadius={58}
                paddingAngle={2}
              >
                {metrics.sectorAllocations.map((entry, index) => (
                  <Cell
                    key={entry.sector}
                    fill={sectorColors[index % sectorColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1">
          {metrics.sectorAllocations.map((sector) => (
            <div
              key={sector.sector}
              className="flex justify-between gap-3 text-xs"
            >
              <span className="truncate text-muted-foreground">{sector.sector}</span>
              <span className="font-semibold">{sector.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HistoryBlock({
  history,
  onStatusChange,
}: {
  history: Recommendation[];
  onStatusChange: (id: string, status: RecommendationStatus) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">6. Recommendation Performance</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.slice(0, 8).map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-xs">{item.section}</TableCell>
              <TableCell className="font-medium">{item.symbol}</TableCell>
              <TableCell>
                <select
                  value={item.status}
                  onChange={(event) =>
                    onStatusChange(
                      item.id,
                      event.target.value as RecommendationStatus,
                    )
                  }
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="NA">NA</option>
                  <option value="Hit">Hit</option>
                  <option value="Miss">Miss</option>
                </select>
              </TableCell>
            </TableRow>
          ))}
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                Refresh recommendations to start tracking performance.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function generateRecommendationList(
  portfolio: ManagedPortfolio,
  history: Recommendation[],
) {
  const recommendations = generateRecommendations(portfolio, history);

  return [
    ...recommendations.intraday,
    ...recommendations.longTermPlan,
    ...recommendations.multibaggerCandidates,
    ...recommendations.etfs,
  ];
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
