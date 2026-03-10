"use client";

import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { formatCents } from "@/lib/money";
import type { ChartOptions } from "chart.js";

interface CategoryPieChartProps {
  data: { name: string; color: string; amount: number }[];
  totalExpenses: number;
}

export default function CategoryPieChart({
  data,
  totalExpenses,
}: CategoryPieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const labelColor = isDark ? "#D1D5DB" : "#374151";

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">No expenses in this period</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: data.map((d) => d.color),
        borderColor: isDark ? "#111827" : "#FFFFFF",
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: labelColor,
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const pct =
              totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0.0";
            return ` ${context.label}: ${formatCents(value)} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Expenses by Category
      </h3>
      <div className="mx-auto max-w-xs">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
