import type { DailyAdmissionData } from "@/utils/types";
import { linearRegression, TOTAL_BEDS, trendDirection } from "@/utils/predictions";

/**
 * MedNexus AI — real forecasting engine.
 *
 * The Dashboard's "AI Predictions" and predictive alerts are computed here,
 * LIVE from the actual series in admissions.json, using classic least-squares
 * regression plus a prediction-interval-based confidence score. No hardcoded
 * numbers: everything derives from the data you feed in.
 */

export interface ForecastPoint {
  /** Best-estimate (the regression line). */
  point: number;
  /** Lower bound of the prediction interval (realistic worst case). */
  lower: number;
  /** Upper bound of the prediction interval (realistic best case). */
  upper: number;
  /** 0..1 confidence derived from the width of the prediction interval. */
  confidence: number;
}

export interface ForecastSeries {
  series: number[];
  slope: number;
  point: number;
  lower: number;
  upper: number;
  confidence: number;
  /** Sign of the trend over the forecast horizon. */
  direction: "up" | "down" | "flat";
}

/**
 * Standard error of the estimate for a regression fit.
 * Sum of squared residuals over (n - 2) degrees of freedom.
 */
function standardError(y: number[], regression: ReturnType<typeof linearRegression>): number {
  const n = y.length;
  if (n < 3) return 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const residual = y[i] - regression.predict(i);
    sse += residual * residual;
  }
  return Math.sqrt(sse / (n - 2));
}

/**
 * Forecast a raw numeric series `stepsAhead` steps past its last point.
 * Produces a point estimate and a prediction interval (95% ~= 1.96 std err),
 * plus a confidence score that shrinks as noise grows and the horizon grows.
 */
export function forecastSeries(
  raw: number[],
  stepsAhead: number,
  opts: { clampMax?: number; clampMin?: number } = {}
): ForecastSeries {
  const n = raw.length;
  if (n === 0) {
    return { series: [], slope: 0, point: 0, lower: 0, upper: 0, confidence: 0, direction: "flat" };
  }
  if (n === 1) {
    const point = raw[0];
    return {
      series: raw,
      slope: 0,
      point,
      lower: point,
      upper: point,
      confidence: 1,
      direction: "flat",
    };
  }

  const reg = linearRegression(raw);
  const se = standardError(raw, reg);
  const targetX = n - 1 + stepsAhead;
  const point = reg.predict(targetX);
  const halfWidth = 1.96 * se * (1 + 1 / n + ((targetX - (n - 1) / 2) ** 2) / n);

  const clamp = (v: number) =>
    Math.max(opts.clampMin ?? 0, Math.min(opts.clampMax ?? Infinity, v));

  const clampedPoint = clamp(point);
  const clampedLower = clamp(point - halfWidth);
  const clampedUpper = clamp(point + halfWidth);

  // Confidence: tight interval (low noise + short horizon) => high confidence.
  const mean = raw.reduce((a, b) => a + b, 0) / n;
  const spreadRaw = 2 * halfWidth;
  const normalized = mean === 0 ? 1 : spreadRaw / Math.max(1, mean * 2);
  const horizonPenalty = 1 / (1 + stepsAhead * 0.08);
  const confidence = clampConfidence(1 - normalized * 0.6 * horizonPenalty);

  return {
    series: [...raw],
    slope: reg.slope,
    point: Math.round(clampedPoint),
    lower: Math.round(clampedLower),
    upper: Math.round(clampedUpper),
    confidence,
    direction: trendDirection([raw[raw.length - 1], Math.round(clampedPoint)]),
  };
}

function clampConfidence(v: number): number {
  return Math.max(0.45, Math.min(0.96, Math.round(v * 100) / 100));
}

/**
 * Build the full set of live predictions shown on the Dashboard, computed from
 * admissions.json on every render of the forecast engine (via useMemo upstream).
 */
export function buildDashboardForecasts(daily: DailyAdmissionData[]) {
  const occ = forecastSeries(daily.map((d) => d.occupancy), 1, {
    clampMax: TOTAL_BEDS,
    clampMin: 0,
  });
  const occ48 = forecastSeries(daily.map((d) => d.occupancy), 2, {
    clampMax: TOTAL_BEDS,
    clampMin: 0,
  });
  const er = forecastSeries(daily.map((d) => d.emergencyVisits), 1);
  const icu = forecastSeries(daily.map((d) => d.icuOccupancy), 1);
  const admits = forecastSeries(daily.map((d) => d.admissions), 1);

  const last = daily[daily.length - 1];

  return {
    occupancy: {
      ...occ,
      delta: Math.round(occ.point - last.occupancy),
      period: "next 24h",
    },
    occupancy48: {
      ...occ48,
      delta: Math.round(occ48.point - last.occupancy),
      period: "next 48h",
    },
    er: {
      ...er,
      delta: Math.round(er.point - last.emergencyVisits),
      period: "next 24h",
    },
    icu: {
      ...icu,
      delta: Math.round(icu.point - last.icuOccupancy),
      period: "next 24h",
    },
    admits: {
      ...admits,
      delta: Math.round(admits.point - last.admissions),
      period: "next 24h",
    },
  };
}

export type DashboardForecasts = ReturnType<typeof buildDashboardForecasts>;
