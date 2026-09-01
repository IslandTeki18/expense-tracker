import { query } from "./_generated/server";
import { v } from "convex/values";
import { loadLookups } from "./transactions";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SMALL_CATEGORY_THRESHOLD = 0.03; // 3% of total expenses

export const getDashboardAnalytics = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { startDate, endDate }) => {
    if (!DATE_REGEX.test(startDate)) {
      throw new Error("startDate must be YYYY-MM-DD.");
    }
    if (!DATE_REGEX.test(endDate)) {
      throw new Error("endDate must be YYYY-MM-DD.");
    }
    if (startDate > endDate) {
      throw new Error("startDate must be before or equal to endDate.");
    }

    const allTransactions = await ctx.db.query("transactions").collect();
    const { versionById, categoryById } = await loadLookups(ctx);

    // Build enriched rows filtered by date range
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    const categorySpending: Record<
      string,
      { name: string; color: string; amount: number }
    > = {};
    const monthlyData: Record<
      string,
      { income: number; expenses: number }
    > = {};

    for (const txn of allTransactions) {
      if (!txn.activeVersionId) continue;
      const version = versionById.get(txn.activeVersionId);
      if (!version) continue;

      // Exclude transactions with no date or outside range
      if (!version.entryDate) continue;
      if (version.entryDate < startDate || version.entryDate > endDate) continue;

      transactionCount++;
      const month = version.entryDate.slice(0, 7); // "YYYY-MM"

      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }

      if (txn.type === "income") {
        totalIncome += version.amountCents;
        monthlyData[month].income += version.amountCents;
      } else {
        totalExpenses += version.amountCents;
        monthlyData[month].expenses += version.amountCents;

        // Aggregate by category
        let catKey = "__uncategorized__";
        let catName = "Other";
        let catColor = "#9CA3AF";

        if (txn.categoryId) {
          const cat = categoryById.get(txn.categoryId);
          if (cat) {
            catKey = txn.categoryId;
            catName = cat.nameDisplay;
            catColor = cat.color;
          }
        }

        if (!categorySpending[catKey]) {
          categorySpending[catKey] = { name: catName, color: catColor, amount: 0 };
        }
        categorySpending[catKey].amount += version.amountCents;
      }
    }

    // Build pie chart data, folding small categories into "Other"
    const threshold = totalExpenses * SMALL_CATEGORY_THRESHOLD;
    const pieChartData: { name: string; color: string; amount: number }[] = [];
    let otherAmount = 0;

    for (const [key, entry] of Object.entries(categorySpending)) {
      if (key === "__uncategorized__" || entry.amount < threshold) {
        otherAmount += entry.amount;
      } else {
        pieChartData.push(entry);
      }
    }
    if (otherAmount > 0) {
      pieChartData.push({ name: "Other", color: "#9CA3AF", amount: otherAmount });
    }

    // Sort pie chart by amount descending
    pieChartData.sort((a, b) => b.amount - a.amount);

    // Build monthly bar chart data with all months in range
    const monthlyBarChartData: {
      month: string;
      income: number;
      expenses: number;
    }[] = [];

    const [startYear, startMonth] = startDate.split("-").map(Number);
    const [endYear, endMonth] = endDate.split("-").map(Number);
    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const data = monthlyData[key] || { income: 0, expenses: 0 };
      monthlyBarChartData.push({
        month: key,
        income: data.income,
        expenses: data.expenses,
      });
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    // Top categories by spending
    const topCategories = Object.entries(categorySpending)
      .filter(([key]) => key !== "__uncategorized__")
      .map(([, entry]) => entry)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      transactionCount,
      pieChartData,
      monthlyBarChartData,
      topCategories,
    };
  },
});
