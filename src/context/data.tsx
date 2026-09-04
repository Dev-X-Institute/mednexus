import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createDataService, type DataService } from "@/lib/api";
import { useDemo } from "@/context/demo";
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

interface DataContextValue {
  admissions: DailyAdmissionData[];
  medicineStock: MedicineStock[];
  pastCases: PastCase[];
  bloodBank: BloodBankEntry[];
  staff: StaffMember[];
  theatreSchedule: TheatreSlot[];
  predictions: PredictionItem[];
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { mode } = useDemo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataContextValue["admissions"]>([]);
  const [medicineStock, setMedicineStock] = useState<MedicineStock[]>([]);
  const [pastCases, setPastCases] = useState<PastCase[]>([]);
  const [bloodBank, setBloodBank] = useState<BloodBankEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [theatreSchedule, setTheatreSchedule] = useState<TheatreSlot[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const service = useMemo(() => createDataService(mode === "live"), [mode]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        admissions,
        medicineStock,
        pastCases,
        bloodBank,
        staff,
        theatreSchedule,
        predictions,
        recommendations,
      ] = await Promise.all([
        service.getAdmissions(),
        service.getMedicineStock(),
        service.getPastCases(),
        service.getBloodBank(),
        service.getStaff(),
        service.getTheatreSchedule(),
        service.getPredictions(),
        service.getRecommendations(),
      ]);
      setData(admissions);
      setMedicineStock(medicineStock);
      setPastCases(pastCases);
      setBloodBank(bloodBank);
      setStaff(staff);
      setTheatreSchedule(theatreSchedule);
      setPredictions(predictions);
      setRecommendations(recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [mode]);

  const value = useMemo(
    () => ({
      admissions: data,
      medicineStock,
      pastCases,
      bloodBank,
      staff,
      theatreSchedule,
      predictions,
      recommendations,
      loading,
      error,
      refresh: loadAll,
    }),
    [
      data,
      medicineStock,
      pastCases,
      bloodBank,
      staff,
      theatreSchedule,
      predictions,
      recommendations,
      loading,
      error,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}