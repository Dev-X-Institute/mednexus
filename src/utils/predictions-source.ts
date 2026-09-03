import predictionsData from "@/data/predictions.json";
import type { DailyAdmissionData } from "@/utils/types";
import { buildDashboardForecasts } from "@/utils/forecast";

/**
 * MedNexus AI — prediction source switcher.
 *
 * Two modes:
 *  - "demo": curated, hand-tuned values from predictions.json (clean demo numbers).
 *  - "live": REAL forecasts computed from admissions data via the regression
 *            engine in forecast.ts (forecastSeries + prediction intervals).
 *
 * Both return the same DisplayPrediction shape so the UI can swap between
 * them without changing the rendering code.
 */
export type DemoMode = "demo" | "live";

export interface DisplayPrediction {
  id: string;
  title: string;
  value: string;
  range: string;
  delta: string;
  direction: "up" | "down" | "flat";
  over: string;
  confidence: number;
}

function sign(n: number): string {
  return n > 0 ? "+" : n < 0 ? "" : "";
}

/** Curated numbers for a clean presentation (demo mode). */
function demoPredictions(): DisplayPrediction[] {
  return predictionsData.predictions.map((p) => ({
    id: p.id,
    title: p.title,
    value: p.value,
    range: "simulated",
    delta: p.delta,
    direction: p.direction as DisplayPrediction["direction"],
    over: p.over,
    confidence: p.confidence,
  }));
}

/** Real regression-based forecasts computed live from admissions data. */
function livePredictions(daily: DailyAdmissionData[]): DisplayPrediction[] {
  const f = buildDashboardForecasts(daily);
  return [
    {
      id: "PRED-BED",
      title: "Bed demand",
      value: `${f.occupancy.point} beds`,
      range: `${f.occupancy.lower}–${f.occupancy.upper}`,
      delta: `${sign(f.occupancy.delta)}${f.occupancy.delta} vs today`,
      direction: f.occupancy.direction,
      over: f.occupancy.period,
      confidence: f.occupancy.confidence,
    },
    {
      id: "PRED-BED48",
      title: "Bed demand · 48h",
      value: `${f.occupancy48.point} beds`,
      range: `${f.occupancy48.lower}–${f.occupancy48.upper}`,
      delta: `${sign(f.occupancy48.delta)}${f.occupancy48.delta} vs today`,
      direction: f.occupancy48.direction,
      over: f.occupancy48.period,
      confidence: f.occupancy48.confidence,
    },
    {
      id: "PRED-ER",
      title: "ER admissions",
      value: `${f.er.point} visits`,
      range: `${f.er.lower}–${f.er.upper}`,
      delta: `${sign(f.er.delta)}${f.er.delta} vs today`,
      direction: f.er.direction,
      over: f.er.period,
      confidence: f.er.confidence,
    },
    {
      id: "PRED-ICU",
      title: "ICU load",
      value: `${f.icu.point} beds`,
      range: `${f.icu.lower}–${f.icu.upper}`,
      delta: `${sign(f.icu.delta)}${f.icu.delta} vs today`,
      direction: f.icu.direction,
      over: f.icu.period,
      confidence: f.icu.confidence,
    },
    {
      id: "PRED-ADM",
      title: "Admissions",
      value: `${f.admits.point}`,
      range: `${f.admits.lower}–${f.admits.upper}`,
      delta: `${sign(f.admits.delta)}${f.admits.delta} vs today`,
      direction: f.admits.direction,
      over: f.admits.period,
      confidence: f.admits.confidence,
    },
  ];
}

export function getPredictions(
  mode: DemoMode,
  daily: DailyAdmissionData[]
): DisplayPrediction[] {
  return mode === "demo" ? demoPredictions() : livePredictions(daily);
}

/** Short human label + readonly explanation used by the mode toggle. */
export const MODE_LABELS: Record<DemoMode, { label: string; note: string }> = {
  demo: { label: "Demo", note: "Curated demo values" },
  live: { label: "Live", note: "Real regression on today's data" },
};
