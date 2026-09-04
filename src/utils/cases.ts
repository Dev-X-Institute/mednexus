export interface PastCase {
  id: string;
  patientAge: number;
  patientGender: string;
  admissionDate: string;
  dischargeDate: string | null;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  outcome: string;
  tags: string[];
}

const normalize = (s: string) => s.toLowerCase().trim();

/**
 * Case-insensitive substring search across a case's symptoms and tags.
 * Returns a filter function that keeps a case when any symptom or tag
 * contains the query substring.
 */
export function matchCase(c: PastCase, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return [...c.symptoms, ...c.tags].some((field) =>
    normalize(field).includes(q)
  );
}

export function getCases(cases: PastCase[], query: string): PastCase[] {
  return cases.filter((c) => matchCase(c, query));
}

export function getCaseById(cases: PastCase[], id: string): PastCase | undefined {
  return cases.find((c) => c.id === id);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Inpatient";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export interface PatientProfile {
  age: number;
  symptoms: string[];
  notes: string;
}

export interface SimilarCase {
  caseId: string;
  hospital: string;
  diagnosis: string;
  age: string;
  match: number; // 0..1 percent match
}

export interface TreatmentPathway {
  label: string;
  steps: string[];
}

export interface RecommendationResult {
  matchCount: number;
  pathway: TreatmentPathway;
  complications: string[];
  stats: { recovery: number; stayDays: number; confidence: number };
}

const SIMILAR_HOSPITALS = [
  "Korle Bu Teaching Hospital · Accra",
  "Komfo Anokye Teaching Hospital · Kumasi",
  "Tamale Teaching Hospital · Tamale",
  "Cape Coast Teaching Hospital · Cape Coast",
] as const;

const COMPLICATIONS: Record<string, string[]> = {
  cardiac: ["Post-procedural arrhythmia", "Contrast-induced nephropathy"],
  infectious: [
    "Secondary infection risk",
    "Persistent fever requiring escalation",
    "Delayed response to first-line antibiotics",
  ],
  respiratory: [
    "Supplemental oxygen dependence",
    "Bronchospasm recurrence within 48h",
  ],
  neurological: [
    "Delayed neurological recovery",
    "Seizure recurrence in first 72h",
  ],
  surgical: [
    "Surgical site infection risk",
    "Delayed wound healing",
    "Post-operative bleeding",
  ],
  geriatric: [
    "Delirium during admission",
    "Increased fall risk",
    "Pressure injury risk",
  ],
};

const COMPLICATION_POOL = [
  "Elevated inflammatory markers",
  "Fluid and electrolyte imbalance",
  "Early relapse requiring readmission",
  "Medication intolerance",
];

function symptomOverlap(a: string[], b: string[]): number {
  const aNorm = a.map(normalize);
  const bNorm = b.map(normalize);
  return aNorm.filter((s) => bNorm.some((x) => x.includes(s) || s.includes(x)))
    .length;
}

function scoreCase(profile: PatientProfile, c: PastCase): number {
  const ageDiff = Math.abs(profile.age - c.patientAge);
  const ageScore = Math.max(0, 1 - ageDiff / 40);
  const symScore = Math.min(
    1,
    symptomOverlap(profile.symptoms, c.symptoms) / Math.max(1, profile.symptoms.length)
  );
  return 0.6 * symScore + 0.4 * ageScore;
}

function buildSteps(treatment: string): string[] {
  const cleaned = treatment.replace(/\.$/, "");
  const parts = cleaned.match(/[^,]+(?: and [^,]+)?(?=,|$)/g) ?? [cleaned];
  const steps = parts.map((p) => p.trim().replace(/^,?\s*/, ""));
  if (steps.length === 0 || steps[0] === "") return [cleaned.trim()];
  return steps.slice(0, 5);
}

function pickComplications(c: PastCase): string[] {
  const fromTags = c.tags
    .map((t) => COMPLICATIONS[t])
    .filter(Boolean)
    .flat();
  const merged = [...fromTags, ...COMPLICATION_POOL];
  const index = c.symptoms.length % merged.length;
  const second = (index + 1 + (c.symptoms.length % 2)) % merged.length;
  return [merged[index], merged[second]].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );
}

/**
 * Deterministic profile matching and treatment pathway simulation.
 * Scores every past case by shared symptoms and age proximity, then builds
 * a plausible treatment pathway from the best matching case.
 */
export function matchPatientProfile(cases: PastCase[], profile: PatientProfile): RecommendationResult {
  const empty: RecommendationResult = {
    matchCount: 0,
    pathway: {
      label: "Awaiting assessment",
      steps: ["Full clinical evaluation", "Confirm working diagnosis", "Initiate supportive care"],
    },
    complications: [],
    stats: { recovery: 70, stayDays: 3, confidence: 0.7 },
  };

  if (cases.length === 0) return empty;

  const scored = cases.map((c) => ({ c, score: scoreCase(profile, c) })).sort(
    (a, b) => b.score - a.score
  );

  const top = scored[0].c;
  const matchers = scored.filter((s) => s.score > 0);
  const matchCount = Math.max(1, matchers.length);

  const steps = buildSteps(top.treatment);
  const recovery = Math.round(
    70 + Math.min(25, (top.patientAge % 5) * 3 + (profile.symptoms.length % 3) * 5)
  );
  const stayDays = Math.round(
    3 + ((top.patientAge + profile.symptoms.length) % 7)
  );
  const confidence = Math.round(
    (0.7 + Math.min(0.22, 0.03 * matchers.length)) * 100
  ) / 100;

  return {
    matchCount,
    pathway: {
      label: `${top.diagnosis} - Recommended pathway`,
      steps,
    },
    complications: pickComplications(top),
    stats: { recovery, stayDays, confidence },
  };
}

/**
 * Return the top ~4 anonymized similar cases for a profile with match %.
 */
export function similarCases(cases: PastCase[], profile: PatientProfile): SimilarCase[] {
  return cases.map((c) => ({ c, score: scoreCase(profile, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ c, score }, i) => ({
      caseId: c.id,
      hospital: SIMILAR_HOSPITALS[i % SIMILAR_HOSPITALS.length],
      diagnosis: c.diagnosis,
      age: `age ${c.patientAge}`,
      match: Math.round(score * 100) / 100,
    }));
}