"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import BalanceHeader from "@/components/BalanceHeader";
import TransactionList from "@/components/TransactionList";

export default function DashboardPage() {
  const { isUnlocked, isLoading, lock } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isLoading, isUnlocked, router]);

  if (isLoading || !isUnlocked) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => {
              lock();
              router.replace("/unlock");
            }}
            className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
          >
            Lock
          </button>
        </div>

        <BalanceHeader />

        <div className="flex gap-3">
          <button
            disabled
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            Add Income
          </button>
          <button
            disabled
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            Add Expense
          </button>
        </div>

        <TransactionList />
      </div>
    </main>
  );
}
