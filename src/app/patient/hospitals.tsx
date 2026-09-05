import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCare } from "@/context/care";
import { Card, Badge, ProgressBar, Chip } from "@/components/ui";
import { haversineKm } from "@/utils/geo";
import type { Hospital, HospitalStatus } from "@/utils/types";
import { fetchNearbyHospitals, type NearbyHospital } from "@/services/nearby-hospitals";

const STATUS_ORDER: Record<HospitalStatus, number> = { Available: 0, Limited: 1, Full: 2 };

type LocationState = "locating" | "granted" | "denied";
type LookupState = "idle" | "loading" | "live" | "failed";

export default function PatientHospitalsScreen() {
  const { colors: c } = useTheme();
  const { hospitals } = useCare();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [emergencyMode, setEmergencyMode] = useState(mode === "emergency");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locState, setLocState] = useState<LocationState>("locating");
  const [locationLabel, setLocationLabel] = useState("Getting your current location…");
  const [nearby, setNearby] = useState<NearbyHospital[]>([]);
  const [lookupState, setLookupState] = useState<LookupState>("idle");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status !== "granted") {
          setLocState("denied");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        const currentCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(currentCoords);
        setLocState("granted");
        try {
          const [place] = await Location.reverseGeocodeAsync(currentCoords);
          if (!mounted) return;
          const placeName = [place.name, place.street, place.district, place.city, place.region]
            .filter(Boolean)
            .filter((part, index, items) => items.indexOf(part) === index)
            .slice(0, 3)
            .join(", ");
          setLocationLabel(placeName || `${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`);
        } catch {
          if (mounted) setLocationLabel(`${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`);
        }
        setLookupState("loading");
        try {
          const results = await fetchNearbyHospitals(currentCoords.latitude, currentCoords.longitude);
          if (!mounted) return;
          setNearby(results);
          setLookupState("live");
        } catch {
          if (mounted) setLookupState("failed");
        }
      } catch {
        if (mounted) setLocState("denied");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshNearby = async () => {
    if (!coords) return;
    setLookupState("loading");
    try {
      const results = await fetchNearbyHospitals(coords.latitude, coords.longitude);
      setNearby(results);
      setLookupState("live");
    } catch {
      setLookupState("failed");
    }
  };

  const statusColor = (s: HospitalStatus) =>
    s === "Available" ? c.success : s === "Limited" ? c.warning : c.critical;
  const statusTone = (s: HospitalStatus): "success" | "warning" | "critical" =>
    s === "Available" ? "success" : s === "Limited" ? "warning" : "critical";

  /** GPS-distance when available, otherwise the curated seed distance. */
  const actualKm = (h: Hospital): number =>
    coords && h.latitude !== undefined && h.longitude !== undefined
      ? haversineKm(coords.latitude, coords.longitude, h.latitude, h.longitude)
      : h.distanceKm;

  // In Emergency Mode: only facilities with emergency/trauma capacity that
  // aren't completely full — routing someone to a full ER is the "No Bed
  // Syndrome" failure this mode exists to prevent. Sorted by availability,
  // then distance (GPS when available).
  const pool = useMemo(
    () =>
      emergencyMode
        ? hospitals.filter((h) => h.services.includes("Emergency/Trauma") && h.status !== "Full")
        : hospitals,
    [hospitals, emergencyMode]
  );

  const sorted = useMemo(() => {
    const distance = (h: Hospital): number =>
      coords && h.latitude !== undefined && h.longitude !== undefined
        ? haversineKm(coords.latitude, coords.longitude, h.latitude, h.longitude)
        : h.distanceKm;
    return [...pool].sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || distance(a) - distance(b)
    );
  }, [pool, coords]);
  const visibleNearby = useMemo(
    () => nearby.filter((hospital) => !emergencyMode || hospital.emergency),
    [nearby, emergencyMode]
  );

  const call = (phone: string) => {
    const num = phone.replace(/[^+\d]/g, "");
    Linking.openURL(`tel:${num}`).catch(() => {});
  };
  const openMap = (latitude: number, longitude: number, label: string) => {
    const query = encodeURIComponent(`${latitude},${longitude} (${label})`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }]}>Hospitals Near You</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Nearby facilities from your location
            </Text>
          </View>
          {locState === "granted" ? <TouchableOpacity onPress={refreshNearby} style={styles.refresh} accessibilityLabel="Refresh nearby hospitals"><Ionicons name="refresh" size={19} color={c.primary} /></TouchableOpacity> : null}
        </View>
        <View style={styles.modeRow}>
          <Chip
            label="All facilities"
            selected={!emergencyMode}
            onPress={() => setEmergencyMode(false)}
          />
          <Chip
            label="Emergency mode"
            selected={emergencyMode}
            onPress={() => setEmergencyMode(true)}
          />
        </View>

        {locState !== "denied" ? (
          <TouchableOpacity
            disabled={!coords}
            onPress={() => coords && openMap(coords.latitude, coords.longitude, "Your location")}
            style={[styles.locationCard, { backgroundColor: c.card, borderColor: c.border }, !coords && styles.locationLoading]}
            accessibilityRole="button"
            accessibilityLabel="Open your current location in maps"
          >
            <View style={[styles.locationIcon, { backgroundColor: `${c.primary}18` }]}>
              {locState === "locating" ? <ActivityIndicator size="small" color={c.primary} /> : <Ionicons name="location" size={20} color={c.primary} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationTitle, { color: c.text }]}>Your location</Text>
              <Text style={[styles.locationText, { color: c.textSecondary }]} numberOfLines={2}>{locationLabel}</Text>
            </View>
            {coords ? <Ionicons name="map-outline" size={21} color={c.primary} /> : null}
          </TouchableOpacity>
        ) : null}

        <View style={styles.note}>
          <Ionicons
            name={lookupState === "loading" ? "sync" : locState === "locating" ? "location" : emergencyMode ? "medkit" : "navigate"}
            size={14}
            color={locState === "locating" ? c.primary : emergencyMode ? c.critical : c.textMuted}
          />
          <Text style={[styles.noteText, { color: c.textSecondary }]}>
            {locState === "locating"
              ? "Locating you…"
              : lookupState === "loading"
                ? "Finding mapped hospitals near your current location…"
                : lookupState === "live"
                  ? `${nearby.length} nearby facility${nearby.length === 1 ? "" : "ies"} found from OpenStreetMap. Bed availability is shown only for facilities connected to the MedNexus demo network.`
                  : lookupState === "failed"
                    ? "Live facility lookup is unavailable. Showing the curated Ghana demo network instead."
                    : "Location access was declined, so showing the curated Ghana demo network."}
          </Text>
        </View>

        {lookupState === "loading" ? <View style={styles.loading}><ActivityIndicator color={c.primary} /><Text style={[styles.loadingText, { color: c.textSecondary }]}>Searching nearby facilities…</Text></View> : null}

        {lookupState === "live" && visibleNearby.length > 0 ? visibleNearby.map((hospital) => <LiveHospitalCard key={hospital.id} hospital={hospital} onCall={() => hospital.phone && call(hospital.phone)} onOpenMap={() => openMap(hospital.latitude, hospital.longitude, hospital.name)} />) : null}

        {(lookupState !== "live" || visibleNearby.length === 0) && sorted.map((h) => (
          <HospitalCard
            key={h.id}
            hospital={h}
            distanceKm={actualKm(h)}
            color={statusColor(h.status)}
            tone={statusTone(h.status)}
            onCall={() => call(h.phone)}
            onOpenMap={() => openMap(h.latitude, h.longitude, h.name)}
          />
        ))}

        <View style={[styles.disclaimer, { borderColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={c.info} />
          <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
            Facility locations are supplied by OpenStreetMap when available. Bed availability remains
            simulated until a hospital or national registry integration is connected.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LiveHospitalCard({ hospital, onCall, onOpenMap }: { hospital: NearbyHospital; onCall: () => void; onOpenMap: () => void }) {
  const { colors: c } = useTheme();
  return <Card style={styles.card}>
    <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={[styles.name, { color: c.text }]}>{hospital.name}</Text><Text style={[styles.address, { color: c.textSecondary }]}>{hospital.address}</Text></View><Badge label="Nearby" tone="info" /></View>
    <View style={styles.metaRow}><TouchableOpacity onPress={onOpenMap} style={styles.metaItem} accessibilityLabel={`Open ${hospital.name} in maps`}><Ionicons name="navigate-outline" size={14} color={c.primary} /><Text style={[styles.metaText, { color: c.primary }]}>{hospital.distanceKm.toFixed(1)} km away · Map</Text></TouchableOpacity>{hospital.emergency ? <Badge label="Emergency" tone="critical" /> : null}</View>
    <Text style={[styles.liveDataNote, { color: c.textMuted }]}>Location data from OpenStreetMap · bed availability not connected</Text>
    {hospital.phone ? <TouchableOpacity onPress={onCall} style={[styles.callBtn, { borderColor: c.border }]}><Ionicons name="call-outline" size={16} color={c.primary} /><Text style={[styles.callText, { color: c.primary }]}>{hospital.phone}</Text></TouchableOpacity> : null}
  </Card>;
}

function HospitalCard({
  hospital: h,
  distanceKm,
  color,
  tone,
  onCall,
  onOpenMap,
}: {
  hospital: Hospital;
  distanceKm: number;
  color: string;
  tone: "success" | "warning" | "critical";
  onCall: () => void;
  onOpenMap: () => void;
}) {
  const { colors: c } = useTheme();
  const isFull = h.status === "Full";

  return (
    <Card style={[styles.card, isFull && { opacity: 0.6 }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]}>{h.name}</Text>
          <Text style={[styles.address, { color: c.textSecondary }]}>{h.address}</Text>
        </View>
        <Badge label={h.status} tone={tone} />
      </View>

      <View style={styles.metaRow}>
        <TouchableOpacity onPress={onOpenMap} style={styles.metaItem} accessibilityLabel={`Open ${h.name} in maps`}>
          <Ionicons name="navigate-outline" size={14} color={c.primary} />
          <Text style={[styles.metaText, { color: c.primary }]}>{distanceKm.toFixed(1)} km away · Map</Text>
        </TouchableOpacity>
      </View>

      <ProgressBar
        label={isFull ? "No beds available" : "Beds available"}
        valueLabel={`${h.availableBeds} of ${h.totalBeds}`}
        progress={h.totalBeds > 0 ? h.availableBeds / h.totalBeds : 0}
        color={color}
        style={{ marginTop: Spacing.two }}
      />

      <TouchableOpacity
        onPress={onCall}
        style={[styles.callBtn, { borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Call ${h.name}`}
      >
        <Ionicons name="call-outline" size={16} color={c.primary} />
        <Text style={[styles.callText, { color: c.primary }]}>{h.phone}</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 110, gap: Spacing.three },
  header: { flexDirection: "row", alignItems: "center", marginTop: Spacing.one },
  refresh: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F0FF" },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 3 },

  modeRow: { flexDirection: "row", gap: Spacing.two },
  locationCard: { flexDirection: "row", alignItems: "center", gap: Spacing.two, borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.three },
  locationLoading: { opacity: 0.7 },
  locationIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  locationTitle: { fontSize: 14, fontWeight: "800" },
  locationText: { fontSize: 12, lineHeight: 17, marginTop: 2 },

  note: { flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingHorizontal: Spacing.one },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  loading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.two, paddingVertical: Spacing.four },
  loadingText: { fontSize: 13 },

  card: { gap: Spacing.two },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  name: { fontSize: 17, fontWeight: "700" },
  address: { fontSize: 13, marginTop: 2 },

  metaRow: { flexDirection: "row", gap: Spacing.three },
  metaItem: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  metaText: { fontSize: 13 },
  liveDataNote: { fontSize: 11, lineHeight: 16 },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  callText: { fontSize: 14, fontWeight: "700" },

  disclaimer: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
