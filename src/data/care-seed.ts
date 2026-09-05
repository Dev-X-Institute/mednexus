/**
 * Seed data for the care store (src/context/care.tsx).
 * Fictional patients for the demo. Med logs are generated at runtime relative
 * to "today" so the checklist is always current.
 *
 * Hospitals are real Ghanaian facilities; only their bed availability is
 * simulated for the demo (see the NOTE above SEED_HOSPITALS).
 */
import type {
  Patient,
  Diagnosis,
  Prescription,
  Hospital,
} from "@/utils/types";

export const SEED_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Ama Boateng",
    age: 34,
    gender: "Female",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    conditions: ["Type 2 Diabetes", "Hypertension"],
  },
  {
    id: "p2",
    name: "Kwesi Mensah",
    age: 52,
    gender: "Male",
    bloodGroup: "B+",
    allergies: [],
    conditions: ["Asthma"],
  },
];

export const SEED_DIAGNOSES: Diagnosis[] = [
  {
    id: "d1",
    patientId: "p1",
    condition: "Type 2 Diabetes Mellitus",
    notes: "Managed with oral therapy and lifestyle changes. HbA1c trending down.",
    date: "2025-11-10",
    doctor: "Dr. Ama Osei",
  },
  {
    id: "d2",
    patientId: "p1",
    condition: "Essential Hypertension",
    notes: "Stage 1. Started on a single agent; monitoring home readings.",
    date: "2026-02-03",
    doctor: "Dr. Ama Osei",
  },
  {
    id: "d3",
    patientId: "p2",
    condition: "Mild Persistent Asthma",
    notes: "Well controlled on a daily preventer. No recent exacerbations.",
    date: "2026-01-15",
    doctor: "Dr. Kwabena Owusu",
  },
];

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx1",
    patientId: "p1",
    drug: "Metformin",
    dosage: "500 mg",
    frequency: "Twice daily",
    timesPerDay: 2,
    startDate: "2025-11-10",
    instructions: "Take with meals.",
    prescribedBy: "Dr. Ama Osei",
  },
  {
    id: "rx2",
    patientId: "p1",
    drug: "Lisinopril",
    dosage: "10 mg",
    frequency: "Once daily",
    timesPerDay: 1,
    startDate: "2026-02-03",
    instructions: "Take in the morning.",
    prescribedBy: "Dr. Ama Osei",
  },
  {
    id: "rx3",
    patientId: "p2",
    drug: "Budesonide Inhaler",
    dosage: "200 mcg",
    frequency: "Once daily",
    timesPerDay: 1,
    startDate: "2026-01-15",
    instructions: "Rinse mouth after use.",
    prescribedBy: "Dr. Kwabena Owusu",
  },
  {
    id: "rx4",
    patientId: "p2",
    drug: "Cetirizine",
    dosage: "10 mg",
    frequency: "Once daily",
    timesPerDay: 1,
    startDate: "2026-01-15",
    prescribedBy: "Dr. Kwabena Owusu",
  },
];

/**
 * NOTE: Hospital names/locations are real (sourced from Ghana's public
 * facility data). Bed/department availability numbers are simulated —
 * no public real-time bed data source exists in Ghana today.
 * Seeded ascending-ish by distanceKm; status is re-derived by the store on load.
 */
export const SEED_HOSPITALS: Hospital[] = [
  {
    id: "h2",
    name: "Greater Accra Regional Hospital (Ridge Hospital)",
    region: "Greater Accra",
    address: "Guggisberg Avenue, Accra",
    distanceKm: 2.8,
    availableBeds: 0,
    totalBeds: 75,
    status: "Full",
    services: ["Emergency/Trauma", "Maternity", "General"],
    phone: "+233 30 662 4151",
  },
  {
    id: "h1",
    name: "Korle Bu Teaching Hospital",
    region: "Greater Accra",
    address: "Korle Bu Road, Accra",
    distanceKm: 4.1,
    availableBeds: 108,
    totalBeds: 450,
    status: "Available",
    services: ["Emergency/Trauma", "Maternity", "General", "ICU", "Pediatrics"],
    phone: "+233 30 665 1111",
  },
  {
    id: "h5",
    name: "LEKMA Hospital",
    region: "Greater Accra",
    address: "Ledzokuku-Krowor, Accra",
    distanceKm: 10.2,
    availableBeds: 19,
    totalBeds: 50,
    status: "Available",
    services: ["Emergency/Trauma", "General"],
    phone: "+233 30 393 6400",
  },
  {
    id: "h4",
    name: "Cape Coast Teaching Hospital",
    region: "Central",
    address: "Cape Coast",
    distanceKm: 142,
    availableBeds: 17,
    totalBeds: 145,
    status: "Limited",
    services: ["Emergency/Trauma", "Maternity", "General", "Pediatrics"],
    phone: "+233 33 211 2919",
  },
  {
    id: "h3",
    name: "Komfo Anokye Teaching Hospital (KATH)",
    region: "Ashanti",
    address: "Okomfo Anokye Road, Kumasi",
    distanceKm: 255,
    availableBeds: 50,
    totalBeds: 205,
    status: "Available",
    services: ["Emergency/Trauma", "Maternity", "General", "ICU"],
    phone: "+233 32 204 5811",
  },
  {
    id: "h6",
    name: "Tamale Teaching Hospital",
    region: "Northern",
    address: "Tamale",
    distanceKm: 430,
    availableBeds: 48,
    totalBeds: 170,
    status: "Available",
    services: ["Emergency/Trauma", "Maternity", "General"],
    phone: "+233 37 226 1111",
  },
];
