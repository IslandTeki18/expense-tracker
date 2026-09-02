"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Plus, ReceiptText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { monthLabel } from "@/lib/display";
import AppShell, { AppBar } from "@/components/AppShell";
import { Chip, Empty } from "@/components/ui";
import TxnRow, { type TxnRowData } from "@/components/TxnRow";
import TransactionFormModal from "@/components/TransactionFormModal";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

type Filter = null | "income" | "expense" | "uncategorized" | Id<"categories">;
type Sort = "date" | "amount";
const PAGE_SIZE = 50;

export default function TransactionsPage() {
  return (
    <AppShell>
      <QueryErrorBoundary fallbackMessage="Failed to load transactions.">
        <LedgerScreen />
      </QueryErrorBoundary>
    </AppShell>
  );
}

function LedgerScreen() {
  const [filter, setFilterState] = useState<Filter>(null);
  const [sort, setSort] = useState<Sort>("date");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const setFilter = (f: Filter) => {
    setFilterState(f);
    setPage(1);
  };

  // Id<> is a branded string, so TS cannot narrow it away from the literals; return literals explicitly.
  const typeFilter = filter === "income" ? "income" : filter === "expense" ? "expense" : null;
  const categoryFilter = typeFilter ? null : (filter as Id<"categories"> | "uncategorized" | null);
  const categories = useQuery(api.categories.listCategories, {});
  const result = useQuery(api.transactions.listTransactions, {
    page,
    pageSize: PAGE_SIZE,
    sortField: sort,
    sortDirection: "desc",
    typeFilter,
    categoryFilter,
  });

  // Group by entry month when sorted by date; single group otherwise.
  const groups: { key: string; items: TxnRowData[] }[] = [];
  for (const t of result?.transactions ?? []) {
    const key = sort === "date" ? (t.entryDate?.slice(0, 7) ?? "undated") : "ALL";
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(t);
    else groups.push({ key, items: [t] });
  }

  return (
    <>
      <AppBar
        sub={result ? `${result.totalCount} ENTRIES` : "LEDGER"}
        title="Transactions"
        right={
          <button
            type="button"
            className="m-icon-btn"
            onClick={() => setSort((s) => (s === "date" ? "amount" : "date"))}
            title={`Sorted by ${sort}`}
            aria-label={`Sort by ${sort === "date" ? "amount" : "date"}`}
          >
            <ArrowUpDown size={16} />
          </button>
        }
      />

      <div className="m-chips-scroll">
        <Chip active={filter === null} onClick={() => setFilter(null)}>
          All
        </Chip>
        <Chip active={filter === "income"} color="var(--highlight)" onClick={() => setFilter("income")}>
          Income
        </Chip>
        <Chip active={filter === "expense"} color="var(--accent)" onClick={() => setFilter("expense")}>
          Expenses
        </Chip>
        {categories?.map((c) => (
          <Chip key={c._id} active={filter === c._id} color={c.color} onClick={() => setFilter(c._id)}>
            {c.nameDisplay}
          </Chip>
        ))}
        <Chip active={filter === "uncategorized"} color="var(--fg-subtle)" onClick={() => setFilter("uncategorized")}>
          Uncategorized
        </Chip>
      </div>

      {result === undefined ? (
        <div className="m-list" style={{ marginTop: 18 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="gt-skel" style={{ height: 66 }} />
          ))}
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <div key={g.key}>
              <div className="m-section-head" style={{ margin: "18px 2px 10px" }}>
                <span className="eyebrow">
                  {g.key === "ALL" ? `SORTED BY ${sort.toUpperCase()}` : g.key === "undated" ? "UNDATED" : monthLabel(g.key)}
                </span>
                <span className="eyebrow" style={{ color: "var(--fg-subtle)" }}>
                  {g.items.length}
                </span>
              </div>
              <div className="m-list">
                {g.items.map((t) => (
                  <TxnRow key={t._id} txn={t} />
                ))}
              </div>
            </div>
          ))}
          {!result.transactions.length && <Empty icon={<ReceiptText size={22} />}>No transactions match this filter.</Empty>}
          {result.totalPages > 1 && (
            <div className="gt-pager">
              <span>
                Page {result.page} of {result.totalPages}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="gt-page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="gt-page-btn" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <button type="button" className="gt-fab" onClick={() => setShowAdd(true)} aria-label="Add transaction">
        <Plus size={24} />
      </button>
      {showAdd && <TransactionFormModal mode="expense" onClose={() => setShowAdd(false)} />}
    </>
  );
}
