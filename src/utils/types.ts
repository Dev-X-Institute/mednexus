/**
 * MedNexus AI — shared domain types.
 * Screens and synthetic data import from here so the contracts stay in one place.
 * Field names here MUST match the shapes in src/data/*.json.
 */

export type RoleId =
  | "admin"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab_scientist"
  | "finance_officer";

export interface Role {
  id: RoleId;
  label: string;
  icon: string;
}

/** Which of the two interfaces a signed-in session is using. */
export type Audience = "staff" | "patient";

export interface Session {
  /** "staff" (clinical roles) or "patient" (self-service companion). Defaults to staff. */
  audience: Audience;
  userName: string;
  /** Staff only — clinical role. */
  role?: RoleId;
  /** Staff only — facility. */
  hospital?: string;
  /** Patient only — which Patient in the care store this session represents. */
  patientId?: string;
}

export interface DailyAdmissionData {
  date: string;
  admissions: number;
  discharges: number;
  occupancy: number;
  icuOccupancy: number;
  emergencyVisits: number;
}

export interface MedicineStock {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  monthlyUsageHistory: number[];
  reorderPoint: number;
  supplier?: string;
}

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

export interface BloodBankEntry {
  id: string;
  group: string;
  unit: number;
  capacity: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: "morning" | "afternoon" | "night";
  onDuty: boolean;
  available: number; // 0..1 availability this period
  avatarColor: string;
}

export type TheatreStatus = "scheduled" | "in-progress" | "delayed";

export interface TheatreSlot {
  id: string;
  theatre: string;
  procedure: string;
  surgeon: string;
  time: string;
  durationMin: number;
  status: TheatreStatus;
}

export interface PredictionItem {
  id: string;
  title: string;
  value: string;
  delta: string;
  direction: "up" | "down" | "flat";
  over: string;
  confidence: number;
  period: string;
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  detail: string;
  savings: string;
  impact: "high" | "medium" | "low";
  applied: boolean;
}

/* ------------------------------------------------------------------ *
 * Care store — patient-facing companion + doctor patient management.
 * Shared live between the staff and patient interfaces (see care.tsx).
 * ------------------------------------------------------------------ */

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  /** Drug/substance allergies — surfaced as flags when prescribing. */
  allergies: string[];
  /** Ongoing chronic conditions shown on the patient's health history. */
  conditions: string[];
}

export interface Diagnosis {
  id: string;
  patientId: string;
  condition: string;
  notes: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  doctor: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  drug: string;
  /** e.g. "500 mg". Kept as free text — never rendered as a dosing instruction. */
  dosage: string;
  /** Human-readable schedule, e.g. "Twice daily". */
  frequency: string;
  /** Doses expected per day — drives the daily checklist. */
  timesPerDay: number;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  instructions?: string;
  prescribedBy: string;
}

export interface MedicationLog {
  id: string;
  prescriptionId: string;
  patientId: string;
  /** ISO date (YYYY-MM-DD) the dose was due. */
  date: string;
  taken: boolean;
  /** ISO timestamp when marked taken, if it was. */
  takenAt?: string;
}

export type HospitalStatus = "Available" | "Limited" | "Full";

export interface Hospital {
  id: string;
  name: string;
  region: string;
  address: string;
  /** Mock straight-line distance in km. */
  distanceKm: number;
  availableBeds: number;
  totalBeds: number;
  /** Derived from the beds ratio — see deriveHospitalStatus in care.tsx. */
  status: HospitalStatus;
  services: string[];
  phone: string;
}
