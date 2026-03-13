"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import "@/lib/chartjs-setup";
import DashboardSummaryCards from "./DashboardSummaryCards";
import CategoryPieChart from "./CategoryPieChart";
import MonthlyIncomeExpenseChart from "./MonthlyIncomeExpenseChart";
import TopCategoriesList from "./TopCategoriesList";
import QueryErrorBoundary from "./QueryErrorBoundary";

interface DashboardAnalyticsProps {
  isUnlocked: boolean;
  startDate: string;
  endDate: string;
  hydrated: boolean;
}

export default function DashboardAnalytics({
  isUnlocked,
  startDate,
  endDate,
  hydrated,
}: DashboardAnalyticsProps) {
  const analytics = useQuery(
    api.dashboard.getDashboardAnalytics,
    isUnlocked && hydrated ? { startDate, endDate } : "skip",
  );

  return (
    <QueryErrorBoundary fallbackMessage="Failed to load dashboard analytics. Please try again.">
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
          {analytics.transactionCount === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No transactions found in this date range.
              </p>
            </div>
          )}
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
    </QueryErrorBoundary>
  );
}
