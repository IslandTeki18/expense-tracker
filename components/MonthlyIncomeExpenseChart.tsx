"use client";

import { Bar } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { formatCents } from "@/lib/money";
import type { ChartOptions } from "chart.js";

interface MonthlyIncomeExpenseChartProps {
  data: { month: string; income: number; expenses: number }[];
}

function formatMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function MonthlyIncomeExpenseChart({
  data,
}: MonthlyIncomeExpenseChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const labelColor = isDark ? "#D1D5DB" : "#374151";
  const gridColor = isDark ? "#374151" : "#E5E7EB";

  const chartData = {
    labels: data.map((d) => formatMonthLabel(d.month)),
    datasets: [
      {
        label: "Income",
        data: data.map((d) => d.income),
        backgroundColor: "#22C55E",
      },
      {
        label: "Expenses",
        data: data.map((d) => d.expenses),
        backgroundColor: "#EF4444",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    animation: false,
    scales: {
      x: {
        stacked: true,
        ticks: { color: labelColor },
        grid: { color: gridColor },
      },
      y: {
        stacked: true,
        ticks: {
          color: labelColor,
          callback: (value) => formatCents(Number(value)),
        },
        grid: { color: gridColor },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: labelColor,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${formatCents(context.parsed.y ?? 0)}`,
        },
      },
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Monthly Income &amp; Expenses
      </h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}
