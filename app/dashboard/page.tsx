"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import BalanceHeader from "@/components/BalanceHeader";
import TransactionList from "@/components/TransactionList";
import TransactionFormModal from "@/components/TransactionFormModal";

export default function DashboardPage() {
  const { isUnlocked, isLoading, lock } = useAuth();
  const router = useRouter();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

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

        <BalanceHeader isUnlocked={isUnlocked} />

        <div className="flex gap-3">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Add Income
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Add Expense
          </button>
        </div>

        <TransactionList isUnlocked={isUnlocked} />

        {showIncomeModal && (
          <TransactionFormModal
            mode="income"
            onClose={() => setShowIncomeModal(false)}
          />
        )}

        {showExpenseModal && (
          <TransactionFormModal
            mode="expense"
            onClose={() => setShowExpenseModal(false)}
          />
        )}
      </div>
    </main>
  );
}
