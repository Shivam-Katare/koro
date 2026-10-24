import type { SalesSlip } from "@/lib/supabase/types";

export type SalesAnalyticsPeriod = "today" | "yesterday" | "week" | "month" | "all";

export interface SalesAnalyticsResult {
  period: SalesAnalyticsPeriod;
  periodLabel: string;
  totalRevenue: number;
  totalSlips: number;
  totalUnits: number;
  averageSlipValue: number;
  todayRevenue: number;
  todaySlipsCount: number;
  todayUnitsCount: number;
  filteredSlips: any[];
}

/**
 * Checks if two dates fall on the same calendar day in the local timezone.
 */
export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Filters slips that occurred on a specific date string (YYYY-MM-DD or ISO).
 */
export function getSalesForSpecificDay(slips: (SalesSlip | any)[], targetDate: Date | string) {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const validSlips = (slips || []).filter(
    (s) => s.status !== "cancelled" && isSameDay(s.slip_date || s.created_at, target)
  );

  const totalRevenue = validSlips.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const slipsCount = validSlips.length;
  const unitsCount = validSlips.reduce((sum, s) => {
    if (s.lines && Array.isArray(s.lines)) {
      return sum + s.lines.reduce((lSum: number, l: any) => lSum + Number(l.quantity || 1), 0);
    }
    return sum + Number(s.total_items || 1);
  }, 0);

  return { totalRevenue, slipsCount, unitsCount, slips: validSlips };
}

/**
 * Filters sales slips based on a standard period: today, yesterday, week, month, or all.
 */
export function filterSlipsByPeriod(
  slips: (SalesSlip | any)[],
  period: SalesAnalyticsPeriod = "today"
): (SalesSlip | any)[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (slips || []).filter((s) => {
    if (s.status === "cancelled") return false;

    const date = new Date(s.slip_date || s.created_at);
    if (isNaN(date.getTime())) return false;

    switch (period) {
      case "today":
        return date >= startOfToday;

      case "yesterday": {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        return date >= startOfYesterday && date < startOfToday;
      }

      case "week": {
        const startOfWeek = new Date(startOfToday);
        // Last 7 days
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        return date >= startOfWeek;
      }

      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= startOfMonth;
      }

      case "all":
      default:
        return true;
    }
  });
}

/**
 * Comprehensive, reusable sales analytics function.
 * Computes revenue, total slips, units sold, and average slip amount for any period or day.
 */
export function calculateSalesAnalytics(
  slips: (SalesSlip | any)[],
  period: SalesAnalyticsPeriod = "today"
): SalesAnalyticsResult {
  const allValidSlips = (slips || []).filter((s) => s.status !== "cancelled");

  // Always compute today's specific metrics for quick overview
  const now = new Date();
  const todaySlips = allValidSlips.filter((s) =>
    isSameDay(s.slip_date || s.created_at, now)
  );

  const todayRevenue = todaySlips.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const todaySlipsCount = todaySlips.length;
  const todayUnitsCount = todaySlips.reduce((sum, s) => {
    if (s.lines && Array.isArray(s.lines)) {
      return sum + s.lines.reduce((lSum: number, l: any) => lSum + Number(l.quantity || 1), 0);
    }
    return sum + Number(s.total_items || 1);
  }, 0);

  // Filter slips for requested period
  const filtered = filterSlipsByPeriod(allValidSlips, period);

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const totalSlips = filtered.length;
  const totalUnits = filtered.reduce((sum, s) => {
    if (s.lines && Array.isArray(s.lines)) {
      return sum + s.lines.reduce((lSum: number, l: any) => lSum + Number(l.quantity || 1), 0);
    }
    return sum + Number(s.total_items || 1);
  }, 0);

  const averageSlipValue = totalSlips > 0 ? Math.round(totalRevenue / totalSlips) : 0;

  const labels: Record<SalesAnalyticsPeriod, string> = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  return {
    period,
    periodLabel: labels[period] || "Today",
    totalRevenue,
    totalSlips,
    totalUnits,
    averageSlipValue,
    todayRevenue,
    todaySlipsCount,
    todayUnitsCount,
    filteredSlips: filtered,
  };
}
