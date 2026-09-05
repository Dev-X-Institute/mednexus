import { haversineKm } from "@/utils/geo";

export interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone?: string;
  emergency: boolean;
  source: "openstreetmap";
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function address(tags: Record<string, string>): string {
  const parts = [tags["addr:street"], tags["addr:city"], tags["addr:state"], tags["addr:country"]].filter(Boolean);
  return parts.join(", ") || tags["addr:full"] || "Address unavailable";
}

/**
 * Finds mapped hospitals around the supplied GPS point via OpenStreetMap's
 * Overpass API. This intentionally returns location/contact information only:
 * OSM does not provide real-time beds or clinical capacity.
 */
export async function fetchNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusMeters = 25_000
): Promise<NearbyHospital[]> {
  const query = `[out:json][timeout:15];(nwr["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});nwr["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude}););out center tags;`;
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Nearby hospital lookup failed (${response.status})`);

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const seen = new Set<string>();
  return (data.elements ?? []).flatMap((element) => {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : undefined);
    if (!name || !point) return [];
    const key = `${name.toLowerCase()}-${point.lat.toFixed(3)}-${point.lon.toFixed(3)}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      id: `osm-${element.type}-${element.id}`,
      name,
      address: address(tags),
      latitude: point.lat,
      longitude: point.lon,
      distanceKm: haversineKm(latitude, longitude, point.lat, point.lon),
      phone: tags.phone ?? tags["contact:phone"],
      emergency: tags.emergency === "yes" || tags["healthcare:speciality"]?.includes("emergency") === true,
      source: "openstreetmap" as const,
    }];
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 20);
}
