import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

function isConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

async function fetchJSON<T>(endpoint: string): Promise<T[]> {
  const client = getClient();
  const { data, error } = await client.from(endpoint).select("*");
  if (error) throw error;
  return (data ?? []) as T[];
}

async function fetchSingle<T>(endpoint: string, id: string): Promise<T | null> {
  const client = getClient();
  const { data, error } = await client.from(endpoint).select("*").eq("id", id).single();
  if (error) throw error;
  return data as T | null;
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
    const client = getClient();
    const { error } = await client.from("admissions").upsert(data);
    if (error) throw error;
  },

  async upsertMedicineStock(data: MedicineStock[]): Promise<void> {
    const client = getClient();
    const { error } = await client.from("medicine_stock").upsert(data);
    if (error) throw error;
  },

  async upsertRecommendations(data: Recommendation[]): Promise<void> {
    const client = getClient();
    const { error } = await client.from("recommendations").upsert(data);
    if (error) throw error;
  },
};

export const demoApi = {
  async getAdmissions(): Promise<DailyAdmissionData[]> {
    const mod = await import("@/data/admissions.json");
    return mod.default.dailyData;
  },

  async getMedicineStock(): Promise<MedicineStock[]> {
    const mod = await import("@/data/medicineStock.json");
    return mod.default.medicines;
  },

  async getPastCases(): Promise<PastCase[]> {
    const mod = await import("@/data/pastCases.json");
    return mod.default.cases;
  },

  async getBloodBank(): Promise<BloodBankEntry[]> {
    const mod = await import("@/data/bloodBank.json");
    return mod.default.entries;
  },

  async getStaff(): Promise<StaffMember[]> {
    const mod = await import("@/data/staff.json");
    return mod.default.staff;
  },

  async getTheatreSchedule(): Promise<TheatreSlot[]> {
    const mod = await import("@/data/theatreSchedule.json");
    return mod.default.slots;
  },

  async getPredictions(): Promise<PredictionItem[]> {
    const mod = await import("@/data/predictions.json");
    return mod.default.predictions;
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const mod = await import("@/data/resourceRecommendations.json");
    return mod.default.recommendations;
  },
};

export function createDataService(useLive: boolean) {
  return useLive && api.isConfigured() ? api : demoApi;
}

export type DataService = typeof api;