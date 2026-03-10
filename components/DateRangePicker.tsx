"use client";

import { validateDateRange } from "@/lib/dates";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getThisMonthRange(): [string, string] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return [`${year}-${month}-01`, `${year}-${month}-${String(lastDay).padStart(2, "0")}`];
}

function getLast3MonthsRange(): [string, string] {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const lastDay = new Date(endYear, endMonth, 0).getDate();
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const startDate = new Date(endYear, endMonth - 3, 1);
  const startYear = startDate.getFullYear();
  const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
  const start = `${startYear}-${startMonth}-01`;

  return [start, end];
}

function getThisYearRange(): [string, string] {
  const year = new Date().getFullYear();
  return [`${year}-01-01`, `${year}-12-31`];
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const validation = validateDateRange(startDate, endDate);

  function handleChange(newStart: string, newEnd: string) {
    const result = validateDateRange(newStart, newEnd);
    if (result.valid) {
      onChange(newStart, newEnd);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => handleChange(e.target.value, endDate)}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => handleChange(startDate, e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["This Month", getThisMonthRange],
          ["Last 3 Months", getLast3MonthsRange],
          ["This Year", getThisYearRange],
        ] as const).map(([label, getRangeFn]) => (
          <button
            key={label}
            onClick={() => {
              const [s, e] = getRangeFn();
              onChange(s, e);
            }}
            className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {validation.valid
          ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
          : validation.error}
      </p>
    </div>
  );
}
