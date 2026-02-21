"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCents } from "@/lib/money";

export default function BalanceHeader() {
  const result = useQuery(api.transactions.getBalance);

  if (result === undefined) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Working Balance</p>
        <div className="mt-1 h-9 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const { balanceCents } = result;
  const isNegative = balanceCents < 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Working Balance</p>
      <p
        className={`mt-1 text-3xl font-bold ${isNegative ? "text-red-600" : "text-gray-900"}`}
      >
        {formatCents(balanceCents)}
      </p>
    </div>
  );
}
