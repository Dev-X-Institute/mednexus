import type {
  DailyAdmissionData,
  MedicineStock,
  PastCase,
  BloodBankEntry,
  StaffMember,
  TheatreSlot,
  PredictionItem,
  Recommendation,
} from "@/utils/types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

function baseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function baseUrl(endpoint: string): string {
  if (!isConfigured()) {
    throw new Error("Supabase credentials not configured");
  }
  return `${SUPABASE_URL}/rest/v1/${endpoint}`;
}

async function fetchJSON<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${baseUrl(endpoint)}?select=*`, {
    headers: baseHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);
  const data = (await res.json()) as T[];
  return data ?? [];
}

async function upsert<T>(endpoint: string, rows: T[]): Promise<void> {
  const res = await fetch(`${baseUrl(endpoint)}?on_conflict=id`, {
    method: "POST",
    headers: { ...baseHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status}`);
}

export const api = {
  isConfigured,

  async getAdmissions(): Promise<DailyAdmissionData[]> {
    return fetchJSON<DailyAdmissionData>("admissions");
  },

  async getMedicineStock(): Promise<MedicineStock[]> {
    return fetchJSON<MedicineStock>("medicine_stock");
  },

  async getPastCases(): Promise<PastCase[]> {
    return fetchJSON<PastCase>("past_cases");
  },

  async getBloodBank(): Promise<BloodBankEntry[]> {
    return fetchJSON<BloodBankEntry>("blood_bank");
  },

  async getStaff(): Promise<StaffMember[]> {
    return fetchJSON<StaffMember>("staff");
  },

  async getTheatreSchedule(): Promise<TheatreSlot[]> {
    return fetchJSON<TheatreSlot>("theatre_schedule");
  },

  async getPredictions(): Promise<PredictionItem[]> {
    return fetchJSON<PredictionItem>("predictions");
  },

  async getRecommendations(): Promise<Recommendation[]> {
    return fetchJSON<Recommendation>("recommendations");
  },

  async upsertAdmissions(data: DailyAdmissionData[]): Promise<void> {
    await upsert<DailyAdmissionData>("admissions", data);
  },

  async upsertMedicineStock(data: MedicineStock[]): Promise<void> {
    await upsert<MedicineStock>("medicine_stock", data);
  },

  async upsertRecommendations(data: Recommendation[]): Promise<void> {
    await upsert<Recommendation>("recommendations", data);
  },
};

export const demoApi: DataService = {
  async getAdmissions(): Promise<DailyAdmissionData[]> {
    const mod = await import("@/data/admissions.json");
    return mod.default.dailyData as DailyAdmissionData[];
  },

  async getMedicineStock(): Promise<MedicineStock[]> {
    const mod = await import("@/data/medicineStock.json");
    return mod.default.medicines as MedicineStock[];
  },

  async getPastCases(): Promise<PastCase[]> {
    const mod = await import("@/data/pastCases.json");
    return mod.default.cases as PastCase[];
  },

  async getBloodBank(): Promise<BloodBankEntry[]> {
    const mod = await import("@/data/bloodBank.json");
    return mod.default.entries as BloodBankEntry[];
  },

  async getStaff(): Promise<StaffMember[]> {
    const mod = await import("@/data/staff.json");
    return mod.default.staff as StaffMember[];
  },

  async getTheatreSchedule(): Promise<TheatreSlot[]> {
    const mod = await import("@/data/theatreSchedule.json");
    return mod.default.slots as TheatreSlot[];
  },

  async getPredictions(): Promise<PredictionItem[]> {
    const mod = await import("@/data/predictions.json");
    return mod.default.predictions as PredictionItem[];
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const mod = await import("@/data/resourceRecommendations.json");
    return mod.default.recommendations as Recommendation[];
  },

  isConfigured: () => false,

  async upsertAdmissions(_data: DailyAdmissionData[]): Promise<void> {
    throw new Error("upsert not available in demo mode");
  },
  async upsertMedicineStock(_data: MedicineStock[]): Promise<void> {
    throw new Error("upsert not available in demo mode");
  },
  async upsertRecommendations(_data: Recommendation[]): Promise<void> {
    throw new Error("upsert not available in demo mode");
  },
};

export function createDataService(useLive: boolean) {
  return useLive && api.isConfigured() ? api : demoApi;
}

export type DataService = {
  isConfigured: () => boolean;
  getAdmissions: () => Promise<DailyAdmissionData[]>;
  getMedicineStock: () => Promise<MedicineStock[]>;
  getPastCases: () => Promise<PastCase[]>;
  getBloodBank: () => Promise<BloodBankEntry[]>;
  getStaff: () => Promise<StaffMember[]>;
  getTheatreSchedule: () => Promise<TheatreSlot[]>;
  getPredictions: () => Promise<PredictionItem[]>;
  getRecommendations: () => Promise<Recommendation[]>;
  upsertAdmissions: (data: DailyAdmissionData[]) => Promise<void>;
  upsertMedicineStock: (data: MedicineStock[]) => Promise<void>;
  upsertRecommendations: (data: Recommendation[]) => Promise<void>;
};
