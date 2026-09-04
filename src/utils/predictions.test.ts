/**
 * @jest-environment node
 */

import {
  linearRegression,
  predictOccupancy,
  avgDailyUsage,
  daysUntilStockout,
  stockStatus,
  formatCapacity,
  capacityPercent,
  trendDirection,
  staffingRatio,
  confidenceGrade,
  TOTAL_BEDS,
} from "@/utils/predictions";
import type { DailyAdmissionData } from "@/utils/types";

describe("predictions utilities", () => {
  describe("linearRegression", () => {
    it("returns zero slope and intercept for empty data", () => {
      const result = linearRegression([]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.predict(10)).toBe(0);
    });

    it("calculates correct regression for linear data", () => {
      const data = [10, 12, 14, 16, 18];
      const result = linearRegression(data);
      expect(result.slope).toBeCloseTo(2, 1);
      expect(result.intercept).toBeCloseTo(10, 1);
    });

    it("predicts next value correctly", () => {
      const data = [10, 12, 14, 16, 18];
      const result = linearRegression(data);
      expect(result.predict(5)).toBeCloseTo(20, 0);
    });

    it("handles constant data", () => {
      const data = [5, 5, 5, 5];
      const result = linearRegression(data);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(5);
      expect(result.predict(10)).toBe(5);
    });

    it("handles single data point", () => {
      const data = [42];
      const result = linearRegression(data);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(42);
    });
  });

  describe("predictOccupancy", () => {
    const mockDailyData: DailyAdmissionData[] = [
      { date: "2024-01-01", admissions: 15, discharges: 10, occupancy: 150, icuOccupancy: 20, emergencyVisits: 25 },
      { date: "2024-01-02", admissions: 18, discharges: 12, occupancy: 156, icuOccupancy: 22, emergencyVisits: 28 },
      { date: "2024-01-03", admissions: 20, discharges: 14, occupancy: 162, icuOccupancy: 24, emergencyVisits: 30 },
      { date: "2024-01-04", admissions: 22, discharges: 16, occupancy: 168, icuOccupancy: 26, emergencyVisits: 32 },
      { date: "2024-01-05", admissions: 24, discharges: 18, occupancy: 174, icuOccupancy: 28, emergencyVisits: 34 },
    ];

    it("predicts occupancy based on trend", () => {
      const predicted = predictOccupancy(mockDailyData, 24);
      expect(predicted).toBeGreaterThan(174);
      expect(predicted).toBeLessThanOrEqual(TOTAL_BEDS);
    });

    it("clamps prediction to max beds", () => {
      const highData: DailyAdmissionData[] = [
        { date: "2024-01-01", admissions: 50, discharges: 0, occupancy: 190, icuOccupancy: 25, emergencyVisits: 30 },
        { date: "2024-01-02", admissions: 50, discharges: 0, occupancy: 195, icuOccupancy: 27, emergencyVisits: 32 },
      ];
      const predicted = predictOccupancy(highData, 48);
      expect(predicted).toBeLessThanOrEqual(TOTAL_BEDS);
    });

    it("clamps prediction to minimum 0", () => {
      const lowData: DailyAdmissionData[] = [
        { date: "2024-01-01", admissions: 0, discharges: 50, occupancy: 10, icuOccupancy: 2, emergencyVisits: 5 },
        { date: "2024-01-02", admissions: 0, discharges: 50, occupancy: 5, icuOccupancy: 1, emergencyVisits: 3 },
      ];
      const predicted = predictOccupancy(lowData, 24);
      expect(predicted).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 for empty data", () => {
      expect(predictOccupancy([], 24)).toBe(0);
    });
  });

  describe("avgDailyUsage", () => {
    it("calculates average daily usage from monthly history", () => {
      const monthlyHistory = [300, 330, 360];
      const daily = avgDailyUsage(monthlyHistory);
      expect(daily).toBeCloseTo(11, 0);
    });

    it("returns 0 for empty history", () => {
      expect(avgDailyUsage([])).toBe(0);
    });

    it("handles single month", () => {
      expect(avgDailyUsage([300])).toBe(10);
    });
  });

  describe("daysUntilStockout", () => {
    it("calculates days until stockout", () => {
      const days = daysUntilStockout(100, [300, 300, 300]);
      expect(days).toBe(10);
    });

    it("returns Infinity for zero usage", () => {
      expect(daysUntilStockout(100, [0, 0, 0])).toBe(Infinity);
    });

    it("returns Infinity for empty history", () => {
      expect(daysUntilStockout(100, [])).toBe(Infinity);
    });

    it("returns 0 when stock is 0", () => {
      expect(daysUntilStockout(0, [300, 300, 300])).toBe(0);
    });
  });

  describe("stockStatus", () => {
    it("returns critical for < 7 days", () => {
      expect(stockStatus(3)).toBe("critical");
      expect(stockStatus(6)).toBe("critical");
    });

    it("returns warning for 7-13 days", () => {
      expect(stockStatus(7)).toBe("warning");
      expect(stockStatus(13)).toBe("warning");
    });

    it("returns adequate for >= 14 days", () => {
      expect(stockStatus(14)).toBe("adequate");
      expect(stockStatus(30)).toBe("adequate");
      expect(stockStatus(Infinity)).toBe("adequate");
    });
  });

  describe("formatCapacity", () => {
    it("formats percentage with % sign", () => {
      expect(formatCapacity(87.3)).toBe("87%");
      expect(formatCapacity(87.6)).toBe("88%");
    });

    it("clamps to 0-100", () => {
      expect(formatCapacity(-10)).toBe("0%");
      expect(formatCapacity(150)).toBe("100%");
    });

    it("rounds correctly", () => {
      expect(formatCapacity(87.4)).toBe("87%");
      expect(formatCapacity(87.5)).toBe("88%");
    });
  });

  describe("capacityPercent", () => {
    it("calculates percentage of total beds", () => {
      expect(capacityPercent(100)).toBe(50);
      expect(capacityPercent(200)).toBe(100);
      expect(capacityPercent(0)).toBe(0);
    });

    it("handles edge cases", () => {
      expect(capacityPercent(174)).toBe(87);
    });
  });

  describe("trendDirection", () => {
    it("returns up for increasing values", () => {
      expect(trendDirection([10, 12, 15, 18])).toBe("up");
    });

    it("returns down for decreasing values", () => {
      expect(trendDirection([20, 18, 15, 12])).toBe("down");
    });

    it("returns flat for equal values", () => {
      expect(trendDirection([10, 10, 10])).toBe("flat");
    });

    it("returns flat for single value", () => {
      expect(trendDirection([42])).toBe("flat");
    });

    it("returns flat for empty array", () => {
      expect(trendDirection([])).toBe("flat");
    });
  });

  describe("staffingRatio", () => {
    it("calculates staffing percentage", () => {
      expect(staffingRatio(8, 10)).toBe(80);
      expect(staffingRatio(10, 10)).toBe(100);
      expect(staffingRatio(5, 10)).toBe(50);
    });

    it("returns 0 for zero target", () => {
      expect(staffingRatio(5, 0)).toBe(0);
    });
  });

  describe("confidenceGrade", () => {
    it("returns high for >= 0.8", () => {
      expect(confidenceGrade(0.8)).toBe("high");
      expect(confidenceGrade(0.95)).toBe("high");
    });

    it("returns medium for 0.6-0.79", () => {
      expect(confidenceGrade(0.6)).toBe("medium");
      expect(confidenceGrade(0.75)).toBe("medium");
    });

    it("returns low for < 0.6", () => {
      expect(confidenceGrade(0.5)).toBe("low");
      expect(confidenceGrade(0.0)).toBe("low");
    });
  });
});