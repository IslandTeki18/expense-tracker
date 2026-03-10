"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import "@/lib/chartjs-setup";
import DateRangePicker from "./DateRangePicker";
import DashboardSummaryCards from "./DashboardSummaryCards";
import CategoryPieChart from "./CategoryPieChart";
import MonthlyIncomeExpenseChart from "./MonthlyIncomeExpenseChart";
import TopCategoriesList from "./TopCategoriesList";

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

interface DashboardAnalyticsProps {
  isUnlocked: boolean;
}

export default function DashboardAnalytics({ isUnlocked }: DashboardAnalyticsProps) {
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

  const analytics = useQuery(
    api.dashboard.getDashboardAnalytics,
    isUnlocked && hydrated ? { startDate, endDate } : "skip",
  );

  function handleDateChange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
  }

  return (
    <div className="space-y-4">
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateChange}
      />

      {analytics === undefined ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : (
        <>
          <DashboardSummaryCards
            totalIncome={analytics.totalIncome}
            totalExpenses={analytics.totalExpenses}
            transactionCount={analytics.transactionCount}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryPieChart
              data={analytics.pieChartData}
              totalExpenses={analytics.totalExpenses}
            />
            <TopCategoriesList
              categories={analytics.topCategories}
              totalExpenses={analytics.totalExpenses}
            />
          </div>
          <MonthlyIncomeExpenseChart data={analytics.monthlyBarChartData} />
        </>
      )}
    </div>
  );
}
