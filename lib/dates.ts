const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateRange(
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } {
  if (!DATE_REGEX.test(startDate)) {
    return { valid: false, error: "Start date must be YYYY-MM-DD." };
  }
  if (!DATE_REGEX.test(endDate)) {
    return { valid: false, error: "End date must be YYYY-MM-DD." };
  }
  if (startDate > endDate) {
    return { valid: false, error: "Start date must be before or equal to end date." };
  }
  return { valid: true };
}

export interface MonthBucket {
  month: string;
  start: string;
  end: string;
}

export function getMonthBuckets(
  startDate: string,
  endDate: string,
): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const lastDay = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, "0");

    buckets.push({
      month: `${year}-${monthStr}`,
      start: `${year}-${monthStr}-01`,
      end: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return buckets;
}
