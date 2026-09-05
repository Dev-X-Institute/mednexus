import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Patient,
  Diagnosis,
  Prescription,
  MedicationLog,
  Hospital,
  HospitalStatus,
  FamilyContact,
  FamilyNotificationLog,
  ReminderLog,
} from "@/utils/types";
import {
  SEED_PATIENTS,
  SEED_DIAGNOSES,
  SEED_PRESCRIPTIONS,
  SEED_HOSPITALS,
  SEED_FAMILY_CONTACTS,
  SEED_FAMILY_NOTIFICATION_LOGS,
  SEED_REMINDER_LOGS,
} from "@/data/care-seed";
import { makeId } from "@/utils/id";
import { scheduleMedicationReminders } from "@/utils/med-reminders";

/* ----------------------------- date helpers ----------------------------- */

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

const TODAY = () => dateKey(new Date());

/** Number of past days (including today) to pre-seed medication history for. */
const HISTORY_DAYS = 5;

/* --------------------------- derived helpers ----------------------------- */

/** Beds ratio → status. Full at 0, Limited under 20% of capacity, else Available. */
export function deriveHospitalStatus(available: number, total: number): HospitalStatus {
  if (available <= 0) return "Full";
  if (total > 0 && available < total * 0.2) return "Limited";
  return "Available";
}

/**
 * Build an initial medication history: for each prescription, one log per day
 * for the last HISTORY_DAYS days. Past days are marked taken (to seed a streak);
 * today starts pending so the patient has something to check off.
 */
function seedMedicationLogs(prescriptions: Prescription[]): MedicationLog[] {
  const logs: MedicationLog[] = [];
  for (const rx of prescriptions) {
    for (let n = HISTORY_DAYS - 1; n >= 0; n--) {
      const date = daysAgoKey(n);
      const isToday = n === 0;
      logs.push({
        id: `log-${rx.id}-${date}`,
        prescriptionId: rx.id,
        patientId: rx.patientId,
        date,
        taken: !isToday,
        takenAt: isToday ? undefined : new Date(`${date}T08:00:00`).toISOString(),
      });
    }
  }
  return logs;
}

/* ------------------------------- context --------------------------------- */

export interface TodayItem {
  prescription: Prescription;
  taken: boolean;
}

export interface Adherence {
  /** 0..1 fraction of logged doses taken. */
  rate: number;
  /** Consecutive fully-adherent days ending today (today counts once taken). */
  streak: number;
}

interface CareContextValue {
  patients: Patient[];
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  medicationLogs: MedicationLog[];
  hospitals: Hospital[];
  familyContacts: FamilyContact[];
  familyNotificationLogs: FamilyNotificationLog[];
  reminderLogs: ReminderLog[];

  // selectors
  getPatient: (patientId: string) => Patient | undefined;
  getDiagnoses: (patientId: string) => Diagnosis[];
  getPrescriptions: (patientId: string) => Prescription[];
  getTodayItems: (patientId: string) => TodayItem[];
  getAdherence: (patientId: string) => Adherence;
  getFamilyContact: (patientId: string) => FamilyContact | undefined;
  getFamilyNotificationLogs: (patientId: string) => FamilyNotificationLog[];
  getReminderLogs: (patientId: string) => ReminderLog[];

  // mutations
  addDiagnosis: (input: {
    patientId: string;
    condition: string;
    notes: string;
    doctor: string;
  }) => void;
  addPrescription: (input: {
    patientId: string;
    drug: string;
    dosage: string;
    frequency: string;
    timesPerDay: number;
    doseTimes: string[];
    instructions?: string;
    prescribedBy: string;
  }) => void;
  toggleMedicationTaken: (prescriptionId: string) => void;
  updateHospitalBeds: (hospitalId: string, availableBeds: number) => void;
}

const CareContext = createContext<CareContextValue | undefined>(undefined);

export function CareProvider({ children }: { children: ReactNode }) {
  const [patients] = useState<Patient[]>(SEED_PATIENTS);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(SEED_DIAGNOSES);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(SEED_PRESCRIPTIONS);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>(() =>
    seedMedicationLogs(SEED_PRESCRIPTIONS)
  );
  const [hospitals, setHospitals] = useState<Hospital[]>(() =>
    [...SEED_HOSPITALS]
      .map((h) => ({ ...h, status: deriveHospitalStatus(h.availableBeds, h.totalBeds) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  );
  const [familyContacts] = useState<FamilyContact[]>(SEED_FAMILY_CONTACTS);
  const [familyNotificationLogs] = useState<FamilyNotificationLog[]>(SEED_FAMILY_NOTIFICATION_LOGS);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>(SEED_REMINDER_LOGS);

  const getPatient = useCallback(
    (patientId: string) => patients.find((p) => p.id === patientId),
    [patients]
  );

  const getDiagnoses = useCallback(
    (patientId: string) =>
      diagnoses
        .filter((d) => d.patientId === patientId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [diagnoses]
  );

  const getPrescriptions = useCallback(
    (patientId: string) => prescriptions.filter((r) => r.patientId === patientId),
    [prescriptions]
  );

  const getTodayItems = useCallback(
    (patientId: string): TodayItem[] => {
      const today = TODAY();
      return prescriptions
        .filter((r) => r.patientId === patientId)
        .map((prescription) => {
          const log = medicationLogs.find(
            (l) => l.prescriptionId === prescription.id && l.date === today
          );
          return { prescription, taken: log?.taken ?? false };
        });
    },
    [prescriptions, medicationLogs]
  );

  const getAdherence = useCallback(
    (patientId: string): Adherence => {
      const logs = medicationLogs.filter((l) => l.patientId === patientId);
      const total = logs.length;
      const takenCount = logs.filter((l) => l.taken).length;
      const rate = total === 0 ? 0 : takenCount / total;

      // Streak: walk back from today. A day counts when it has logs and every
      // logged dose was taken. Today, if still pending, doesn't break the run.
      let streak = 0;
      for (let n = 0; n < 90; n++) {
        const key = daysAgoKey(n);
        const dayLogs = logs.filter((l) => l.date === key);
        if (dayLogs.length === 0) {
          if (n === 0) continue;
          break;
        }
        const allTaken = dayLogs.every((l) => l.taken);
        if (allTaken) {
          streak++;
        } else if (n === 0) {
          continue; // today not finished yet — keep the historical streak
        } else {
          break;
        }
      }
      return { rate, streak };
    },
    [medicationLogs]
  );

  const getFamilyContact = useCallback(
    (patientId: string) => familyContacts.find((contact) => contact.patientId === patientId),
    [familyContacts]
  );

  const getFamilyNotificationLogs = useCallback(
    (patientId: string) => familyNotificationLogs.filter((entry) => entry.patientId === patientId),
    [familyNotificationLogs]
  );

  const getReminderLogs = useCallback(
    (patientId: string) =>
      reminderLogs
        .filter((entry) => entry.patientId === patientId)
        .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1)),
    [reminderLogs]
  );

  const addDiagnosis = useCallback<CareContextValue["addDiagnosis"]>((input) => {
    setDiagnoses((prev) => [
      {
        id: makeId("d"),
        patientId: input.patientId,
        condition: input.condition,
        notes: input.notes,
        date: TODAY(),
        doctor: input.doctor,
      },
      ...prev,
    ]);
  }, []);

  const addPrescription = useCallback<CareContextValue["addPrescription"]>((input) => {
    const rx: Prescription = {
      id: makeId("rx"),
      patientId: input.patientId,
      drug: input.drug,
      dosage: input.dosage,
      frequency: input.frequency,
      timesPerDay: input.timesPerDay,
      doseTimes: input.doseTimes,
      startDate: TODAY(),
      instructions: input.instructions,
      prescribedBy: input.prescribedBy,
    };
    setPrescriptions((prev) => [...prev, rx]);
    // Schedule the live device reminders (notifications + calendar). This is
    // fire-and-forget: the store answers immediately and the demo ReminderLog
    // entries appear once the native calls settle (or degrade to "unavailable").
    scheduleMedicationReminders(rx).then((outcome) => {
      if (outcome.logs.length > 0) {
        setReminderLogs((prev) => [...outcome.logs, ...prev]);
      }
    });
  }, []);

  const toggleMedicationTaken = useCallback<CareContextValue["toggleMedicationTaken"]>(
    (prescriptionId) => {
      const today = TODAY();
      setMedicationLogs((prev) => {
        const idx = prev.findIndex(
          (l) => l.prescriptionId === prescriptionId && l.date === today
        );
        if (idx === -1) {
          // No log yet for today (e.g. a just-added prescription) — create it taken.
          const rx = prescriptions.find((p) => p.id === prescriptionId);
          if (!rx) return prev;
          return [
            ...prev,
            {
              id: `log-${prescriptionId}-${today}`,
              prescriptionId,
              patientId: rx.patientId,
              date: today,
              taken: true,
              takenAt: new Date().toISOString(),
            },
          ];
        }
        return prev.map((l, i) =>
          i === idx
            ? {
                ...l,
                taken: !l.taken,
                takenAt: !l.taken ? new Date().toISOString() : undefined,
              }
            : l
        );
      });
    },
    [prescriptions]
  );

  const updateHospitalBeds = useCallback<CareContextValue["updateHospitalBeds"]>(
    (hospitalId, availableBeds) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id !== hospitalId) return h;
          const clamped = Math.max(0, Math.min(h.totalBeds, availableBeds));
          return {
            ...h,
            availableBeds: clamped,
            status: deriveHospitalStatus(clamped, h.totalBeds),
          };
        })
      );
    },
    []
  );

  const value = useMemo<CareContextValue>(
    () => ({
      patients,
      diagnoses,
      prescriptions,
      medicationLogs,
      hospitals,
      familyContacts,
      familyNotificationLogs,
      reminderLogs,
      getPatient,
      getDiagnoses,
      getPrescriptions,
      getTodayItems,
      getAdherence,
      getFamilyContact,
      getFamilyNotificationLogs,
      getReminderLogs,
      addDiagnosis,
      addPrescription,
      toggleMedicationTaken,
      updateHospitalBeds,
    }),
    [
      patients,
      diagnoses,
      prescriptions,
      medicationLogs,
      hospitals,
      familyContacts,
      familyNotificationLogs,
      reminderLogs,
      getPatient,
      getDiagnoses,
      getPrescriptions,
      getTodayItems,
      getAdherence,
      getFamilyContact,
      getFamilyNotificationLogs,
      getReminderLogs,
      addDiagnosis,
      addPrescription,
      toggleMedicationTaken,
      updateHospitalBeds,
    ]
  );

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}

export function useCare(): CareContextValue {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error("useCare must be used within a CareProvider");
  return ctx;
}
