"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import BalanceHeader from "@/components/BalanceHeader";
import TransactionList from "@/components/TransactionList";
import TransactionFormModal from "@/components/TransactionFormModal";
import ThemeToggle from "@/components/ThemeToggle";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import DateRangePicker from "@/components/DateRangePicker";

const STORAGE_KEY = "dashboard-date-range";

function getDefaultRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function DashboardPage() {
  const { isUnlocked, isLoading, lock } = useAuth();
  const router = useRouter();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const defaultRange = getDefaultRange();
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.startDate && parsed.endDate) {
          setStartDate(parsed.startDate);
          setEndDate(parsed.endDate);
        }
      }
    } catch {
      // Ignore invalid localStorage data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, endDate }));
    } catch {
      // Ignore storage errors
    }
  }, [startDate, endDate, hydrated]);

  useEffect(() => {
    if (!isLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isLoading, isUnlocked, router]);

  if (isLoading || !isUnlocked) return null;

  function handleDateChange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/categories"
              className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Categories
            </Link>
            <ThemeToggle />
            <button
              onClick={() => {
                lock();
                router.replace("/unlock");
              }}
              className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Lock
            </button>
          </div>
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

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
        />

        <DashboardAnalytics
          isUnlocked={isUnlocked}
          startDate={startDate}
          endDate={endDate}
          hydrated={hydrated}
        />

        <TransactionList
          isUnlocked={isUnlocked}
          startDate={startDate}
          endDate={endDate}
        />

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
