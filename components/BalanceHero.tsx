"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCents } from "@/lib/money";

export default function BalanceHero() {
  const data = useQuery(api.transactions.getBalance, {});

  if (data === undefined) return <div className="gt-skel" style={{ height: 210 }} />;

  const { balanceCents, totalIncome, totalExpenses, count, series } = data;
  const min = Math.min(0, ...series);
  const max = Math.max(1, ...series);
  const span = max - min || 1;

  return (
    <div className="m-hero">
      <div className="m-hero-row">
        <span className="eyebrow">WORKING BALANCE</span>
        <span className="m-badge-live">
          <span className="m-dot" />
          LIVE
        </span>
      </div>
      <div className="m-hero-val" data-neg={balanceCents < 0 ? "1" : "0"}>
        {formatCents(balanceCents)}
      </div>
      <div className="m-hero-spark" aria-hidden>
        {series.map((p, i) => (
          <span key={i} style={{ height: `${12 + ((p - min) / span) * 88}%` }} />
        ))}
      </div>
      <div className="m-split">
        <div>
          <span className="eyebrow">TOTAL IN</span>
          <b style={{ color: "var(--highlight)" }}>{formatCents(totalIncome)}</b>
        </div>
        <div>
          <span className="eyebrow">TOTAL OUT</span>
          <b>{formatCents(totalExpenses)}</b>
        </div>
        <div>
          <span className="eyebrow">ENTRIES</span>
          <b>{count}</b>
        </div>
      </div>
    </div>
  );
}
