import pastCasesData from "@/data/pastCases.json";

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

const CASES: PastCase[] = pastCasesData.cases;

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

export function getCases(query: string): PastCase[] {
  return CASES.filter((c) => matchCase(c, query));
}

export function getCaseById(id: string): PastCase | undefined {
  return CASES.find((c) => c.id === id);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Inpatient";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
