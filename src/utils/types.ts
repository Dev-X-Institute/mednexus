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

export interface Session {
  role: RoleId;
  hospital: string;
  userName: string;
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
