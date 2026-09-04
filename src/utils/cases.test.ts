/**
 * @jest-environment node
 */

import {
  matchCase,
  getCases,
  getCaseById,
  formatDate,
  matchPatientProfile,
  similarCases,
} from "@/utils/cases";
import type { PastCase, PatientProfile } from "@/utils/cases";

const mockCases: PastCase[] = [
  {
    id: "case-1",
    patientAge: 45,
    patientGender: "M",
    admissionDate: "2024-01-15",
    dischargeDate: "2024-01-20",
    symptoms: ["Fever", "Chest pain", "Dyspnea"],
    diagnosis: "Acute Coronary Syndrome",
    treatment: "Aspirin, Clopidogrel, Heparin, PCI",
    outcome: "Discharged stable",
    tags: ["cardiac"],
  },
  {
    id: "case-2",
    patientAge: 62,
    patientGender: "F",
    admissionDate: "2024-02-10",
    dischargeDate: "2024-02-18",
    symptoms: ["Fever", "Cough", "Dyspnea"],
    diagnosis: "Community-Acquired Pneumonia",
    treatment: "Ceftriaxone, Azithromycin, Oxygen",
    outcome: "Discharged improved",
    tags: ["infectious", "respiratory"],
  },
  {
    id: "case-3",
    patientAge: 35,
    patientGender: "M",
    admissionDate: "2024-03-05",
    dischargeDate: null,
    symptoms: ["Headache", "Confusion", "Hypertension"],
    diagnosis: "Hypertensive Encephalopathy",
    treatment: "IV Labetalol, Nicardipine infusion, ICU monitoring",
    outcome: "Inpatient",
    tags: ["neurological", "cardiac"],
  },
];

const mockProfile: PatientProfile = {
  age: 50,
  symptoms: ["Fever", "Chest pain"],
  notes: "Patient with history of hypertension",
};

describe("cases utilities", () => {
  describe("matchCase", () => {
    it("returns true for empty query", () => {
      expect(matchCase(mockCases[0], "")).toBe(true);
      expect(matchCase(mockCases[0], "   ")).toBe(true);
    });

    it("matches symptoms case-insensitively", () => {
      expect(matchCase(mockCases[0], "fever")).toBe(true);
      expect(matchCase(mockCases[0], "FEVER")).toBe(true);
      expect(matchCase(mockCases[0], "Fever")).toBe(true);
    });

    it("matches tags", () => {
      expect(matchCase(mockCases[0], "cardiac")).toBe(true);
    });

    it("returns false for non-matching query", () => {
      expect(matchCase(mockCases[0], "diabetes")).toBe(false);
    });

    it("matches partial strings", () => {
      expect(matchCase(mockCases[0], "card")).toBe(true);
    });
  });

  describe("getCases", () => {
    it("returns all cases for empty query", () => {
      expect(getCases(mockCases, "")).toHaveLength(3);
    });

    it("filters cases by query", () => {
      const results = getCases(mockCases, "fever");
      expect(results).toHaveLength(2);
      expect(results.map((c) => c.id)).toEqual(["case-1", "case-2"]);
    });
  });

  describe("getCaseById", () => {
    it("returns case by id", () => {
      const case1 = getCaseById(mockCases, "case-1");
      expect(case1?.id).toBe("case-1");
    });

    it("returns undefined for non-existent id", () => {
      expect(getCaseById(mockCases, "non-existent")).toBeUndefined();
    });
  });

  describe("formatDate", () => {
    it("formats valid ISO date", () => {
      const formatted = formatDate("2024-01-15");
      expect(formatted).toMatch(/Jan\s+15/);
    });

    it("returns 'Inpatient' for null date", () => {
      expect(formatDate(null)).toBe("Inpatient");
    });

    it("returns 'Inpatient' for empty string", () => {
      expect(formatDate("")).toBe("Inpatient");
    });
  });

  describe("matchPatientProfile", () => {
    it("returns recommendation result with all fields", () => {
      const result = matchPatientProfile(mockCases, mockProfile);

      expect(result).toHaveProperty("matchCount");
      expect(result).toHaveProperty("pathway");
      expect(result).toHaveProperty("complications");
      expect(result).toHaveProperty("stats");

      expect(result.pathway).toHaveProperty("label");
      expect(result.pathway).toHaveProperty("steps");
      expect(Array.isArray(result.pathway.steps)).toBe(true);
      expect(result.pathway.steps.length).toBeGreaterThan(0);
      expect(result.pathway.steps.length).toBeLessThanOrEqual(5);

      expect(result.stats).toHaveProperty("recovery");
      expect(result.stats).toHaveProperty("stayDays");
      expect(result.stats).toHaveProperty("confidence");

      expect(result.stats.confidence).toBeGreaterThanOrEqual(0);
      expect(result.stats.confidence).toBeLessThanOrEqual(1);
    });

    it("returns empty result for empty cases", () => {
      const result = matchPatientProfile([], mockProfile);
      expect(result.matchCount).toBe(0);
      expect(result.pathway.label).toBe("Awaiting assessment");
    });

    it("finds best matching case", () => {
      const result = matchPatientProfile(mockCases, mockProfile);
      expect(result.pathway.label).toContain("Acute Coronary Syndrome");
    });

    it("favors a profile matching symptoms and age (score rises with overlap)", () => {
      const closeProfile: PatientProfile = {
        age: 45,
        symptoms: ["Fever", "Chest pain", "Dyspnea"],
        notes: "",
      };
      const farProfile: PatientProfile = {
        age: 80,
        symptoms: ["Headache"],
        notes: "",
      };
      const close = similarCases(mockCases, closeProfile);
      const far = similarCases(mockCases, farProfile);
      expect(close[0].match).toBeGreaterThan(far[0].match);
    });

    it("produces unique, bounded complications from the best match", () => {
      const result = matchPatientProfile(mockCases, mockProfile);
      const unique = new Set(result.complications);
      expect(unique.size).toBe(result.complications.length);
      expect(result.complications.length).toBeGreaterThan(0);
      expect(result.complications.length).toBeLessThanOrEqual(2);
    });
  });

  describe("similarCases", () => {
    it("returns top 4 similar cases with match scores", () => {
      const results = similarCases(mockCases, mockProfile);

      expect(results.length).toBeLessThanOrEqual(4);
      expect(results.length).toBeGreaterThan(0);

      results.forEach((r) => {
        expect(r).toHaveProperty("caseId");
        expect(r).toHaveProperty("hospital");
        expect(r).toHaveProperty("diagnosis");
        expect(r).toHaveProperty("age");
        expect(r).toHaveProperty("match");
        expect(r.match).toBeGreaterThanOrEqual(0);
        expect(r.match).toBeLessThanOrEqual(1);
      });
    });

    it("sorts by match score descending", () => {
      const results = similarCases(mockCases, mockProfile);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].match).toBeGreaterThanOrEqual(results[i].match);
      }
    });
  });
});