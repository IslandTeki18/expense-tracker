"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCents } from "@/lib/money";
import { daysAgoISO, monthLabel, todayISO } from "@/lib/display";
import { Segmented } from "@/components/ui";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

type Range = "1m" | "3m" | "6m" | "all";
const RANGE_DAYS: Record<Exclude<Range, "all">, number> = { "1m": 31, "3m": 93, "6m": 186 };
const RANGES = (["1m", "3m", "6m", "all"] as Range[]).map((r) => ({ value: r, label: r.toUpperCase() }));
const STORAGE_KEY = "analytics-range";

export default function Analytics() {
  const [range, setRange] = useState<Range>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return RANGES.some((r) => r.value === stored) ? (stored as Range) : "3m";
    } catch {
      return "3m";
    }
  });

  function pick(r: Range) {
    setRange(r);
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div className="m-section-head">
        <span className="eyebrow">ANALYTICS</span>
        <Segmented options={RANGES} value={range} onChange={pick} />
      </div>
      <QueryErrorBoundary fallbackMessage="Failed to load analytics.">
        <AnalyticsBody range={range} />
      </QueryErrorBoundary>
    </>
  );
}

function AnalyticsBody({ range }: { range: Range }) {
  const data = useQuery(api.dashboard.getDashboardAnalytics, {
    startDate: range === "all" ? undefined : daysAgoISO(RANGE_DAYS[range]),
    endDate: todayISO(),
  });

  if (data === undefined) {
    return (
      <>
        <div className="gt-skel" style={{ height: 58, marginBottom: 10 }} />
        <div className="gt-skel" style={{ height: 180, marginBottom: 10 }} />
        <div className="gt-skel" style={{ height: 160 }} />
      </>
    );
  }

  const { totalIncome, totalExpenses, pieChartData, monthlyBarChartData, topCategories } = data;
  const net = totalIncome - totalExpenses;
  const barMax = Math.max(1, ...monthlyBarChartData.map((b) => Math.max(b.income, b.expenses)));

  let acc = 0;
  const conic = pieChartData
    .map((s) => {
      const from = (acc / totalExpenses) * 360;
      acc += s.amount;
      return `${s.color} ${from}deg ${(acc / totalExpenses) * 360}deg`;
    })
    .join(", ");
  const topMax = Math.max(1, ...topCategories.map((c) => c.amount));

  return (
    <>
      <div className="m-stats3">
        <div>
          <span>IN</span>
          <b style={{ color: "var(--highlight)" }}>{formatCents(totalIncome)}</b>
        </div>
        <div>
          <span>OUT</span>
          <b>{formatCents(totalExpenses)}</b>
        </div>
        <div>
          <span>NET</span>
          <b style={{ color: net >= 0 ? "var(--highlight)" : "var(--danger)" }}>
            {net >= 0 ? "+" : ""}
            {formatCents(net)}
          </b>
        </div>
      </div>

      <div className="m-card">
        <div className="m-hero-row">
          <span className="eyebrow">IN VS OUT · MONTHLY</span>
          <div className="gt-mlegend">
            <span>
              <i style={{ background: "var(--highlight)" }} />
              IN
            </span>
            <span>
              <i style={{ background: "var(--accent)" }} />
              OUT
            </span>
          </div>
        </div>
        <div className="gt-mchart">
          {monthlyBarChartData.map((b) => (
            <div key={b.month} className="gt-mcol">
              <div className="gt-mbars">
                <div className="gt-mbar gt-mbar-in" style={{ height: `${(b.income / barMax) * 100}%` }} title={`In · ${formatCents(b.income)}`} />
                <div className="gt-mbar gt-mbar-out" style={{ height: `${(b.expenses / barMax) * 100}%` }} title={`Out · ${formatCents(b.expenses)}`} />
              </div>
              <span className="gt-mcol-label">{monthLabel(b.month)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="m-card">
        <span className="eyebrow">SPEND BY CATEGORY</span>
        <div className="gt-donut-wrap">
          <div className="gt-donut" style={{ background: totalExpenses ? `conic-gradient(${conic})` : "var(--bg-sunken)" }}>
            <div className="gt-donut-center">
              <span className="eyebrow" style={{ fontSize: 8 }}>
                TOTAL
              </span>
              <b style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{formatCents(totalExpenses)}</b>
            </div>
          </div>
          <div className="gt-legend">
            {pieChartData.slice(0, 5).map((s) => (
              <div key={s.name} className="gt-legend-row">
                <span className="gt-legend-dot" style={{ background: s.color }} />
                <span className="gt-legend-name">{s.name}</span>
                <span className="gt-legend-pct">{Math.round((s.amount / totalExpenses) * 100)}%</span>
              </div>
            ))}
            {!pieChartData.length && <div style={{ color: "var(--fg-subtle)", fontSize: 12 }}>No expenses in range.</div>}
          </div>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="m-card">
          <span className="eyebrow">TOP CATEGORIES</span>
          <div style={{ marginTop: 6 }}>
            {topCategories.map((c) => (
              <div key={c.name} className="gt-topcat-row">
                <span className="gt-legend-dot" style={{ background: c.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, width: 88, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                <span className="gt-topcat-bar">
                  <i style={{ width: `${(c.amount / topMax) * 100}%`, background: c.color }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 64 }}>{formatCents(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
