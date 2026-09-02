"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, ReceiptText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import AppShell, { AppBar } from "@/components/AppShell";
import { useActor } from "@/components/ActorContext";
import { ActorSwitch, Empty } from "@/components/ui";
import BalanceHero from "@/components/BalanceHero";
import Analytics from "@/components/Analytics";
import TxnRow from "@/components/TxnRow";
import TransactionFormModal from "@/components/TransactionFormModal";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

const RECENT_COUNT = 4;

export default function DashboardPage() {
  return (
    <AppShell>
      <HomeScreen />
    </AppShell>
  );
}

function HomeScreen() {
  const { actor, setActor } = useActor();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <AppBar sub="LEDGER / HOME" title="Balance" right={<ActorSwitch value={actor} onChange={setActor} />} />
      <QueryErrorBoundary fallbackMessage="Failed to load balance.">
        <BalanceHero />
      </QueryErrorBoundary>
      <Analytics />
      <div className="m-section-head">
        <span className="eyebrow">RECENT</span>
        <Link href="/transactions" className="m-link">
          SEE ALL →
        </Link>
      </div>
      <QueryErrorBoundary fallbackMessage="Failed to load transactions.">
        <Recent />
      </QueryErrorBoundary>

      <button type="button" className="gt-fab" onClick={() => setShowAdd(true)} aria-label="Add transaction">
        <Plus size={24} />
      </button>
      {showAdd && <TransactionFormModal mode="expense" onClose={() => setShowAdd(false)} />}
    </>
  );
}

function Recent() {
  const result = useQuery(api.transactions.listTransactions, { page: 1, pageSize: RECENT_COUNT });
  if (result === undefined) {
    return (
      <div className="m-list">
        {Array.from({ length: RECENT_COUNT }, (_, i) => (
          <div key={i} className="gt-skel" style={{ height: 66 }} />
        ))}
      </div>
    );
  }
  if (!result.transactions.length) {
    return <Empty icon={<ReceiptText size={22} />}>No transactions yet. Add one with +</Empty>;
  }
  return (
    <div className="m-list">
      {result.transactions.map((t) => (
        <TxnRow key={t._id} txn={t} />
      ))}
    </div>
  );
}
