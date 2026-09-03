export interface DailyAdmissionData {
  date: string;
  admissions: number;
  discharges: number;
  occupancy: number;
}

export interface MedicineStock {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  monthlyUsageHistory: number[];
  reorderPoint: number;
}

/**
 * Simple linear regression using least squares.
 * Returns slope and intercept for y = slope * x + intercept.
 */
export function linearRegression(data: number[]): {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
} {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, predict: () => 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  };
}

/**
 * Predict occupancy N hours from now using linear regression on daily occupancy.
 * Assumes 1 data point per day, projects forward by hours/24 days.
 */
export function predictOccupancy(
  dailyData: DailyAdmissionData[],
  hoursAhead: number
): number {
  const occupancies = dailyData.map((d) => d.occupancy);
  const reg = linearRegression(occupancies);
  const daysAhead = hoursAhead / 24;
  const predicted = reg.predict(occupancies.length - 1 + daysAhead);
  return Math.round(Math.max(0, Math.min(200, predicted)));
}

/**
 * Compute average daily usage from 3 months of monthly usage history.
 */
export function avgDailyUsage(monthlyHistory: number[]): number {
  if (monthlyHistory.length === 0) return 0;
  const avgMonthly = monthlyHistory.reduce((a, b) => a + b, 0) / monthlyHistory.length;
  return avgMonthly / 30;
}

/**
 * Calculate days until stockout given current stock and average daily usage.
 */
export function daysUntilStockout(
  currentStock: number,
  monthlyHistory: number[]
): number {
  const daily = avgDailyUsage(monthlyHistory);
  if (daily <= 0) return Infinity;
  return Math.floor(currentStock / daily);
}

/**
 * Stock status: critical (<7 days), warning (<14 days), adequate (>=14 days)
 */
export function stockStatus(daysLeft: number): "critical" | "warning" | "adequate" {
  if (daysLeft < 7) return "critical";
  if (daysLeft < 14) return "warning";
  return "adequate";
}

export const STATUS_COLORS = {
  critical: { bg: "#FEF2F2", text: "#B91C1C", dot: "#DC2626" },
  warning: { bg: "#FFFBEB", text: "#B45309", dot: "#D97706" },
  adequate: { bg: "#F0FDF4", text: "#15803D", dot: "#16A34A" },
} as const;
