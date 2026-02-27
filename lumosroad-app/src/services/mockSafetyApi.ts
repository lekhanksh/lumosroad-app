import type {
  SafetyScorerResponse,
  LumosRoute,
  SafetyExplanation,
  SafetyFactors,
  LatLng,
  Coordinate,
} from "../types/navigation";

/* ------------------------------------------------------------------ */
/*  Pune-centric places – real coordinates for meaningful routes       */
/* ------------------------------------------------------------------ */
export type Place = {
  name: string;
  subtitle: string;
  icon: "home" | "briefcase" | "location" | "cafe" | "school" | "cart";
  lat: number;
  lng: number;
};

export const PUNE_PLACES: Place[] = [
  { name: "Shivajinagar",    subtitle: "FC Road area",        icon: "location", lat: 18.5314, lng: 73.8446 },
  { name: "Koregaon Park",   subtitle: "Lane 5, KP",          icon: "cafe",     lat: 18.5362, lng: 73.8936 },
  { name: "Deccan Gymkhana",  subtitle: "JM Road",            icon: "location", lat: 18.5168, lng: 73.8418 },
  { name: "Hinjewadi IT Park", subtitle: "Phase 1",           icon: "briefcase",lat: 18.5912, lng: 73.7380 },
  { name: "Kothrud",          subtitle: "Paud Road",          icon: "home",     lat: 18.5074, lng: 73.8077 },
  { name: "Wakad",            subtitle: "Datta Mandir Chowk", icon: "home",     lat: 18.5913, lng: 73.7623 },
  { name: "Viman Nagar",      subtitle: "Phoenix Mall area",  icon: "cart",     lat: 18.5679, lng: 73.9143 },
  { name: "Baner",            subtitle: "Baner Road",         icon: "home",     lat: 18.5590, lng: 73.7868 },
  { name: "Swargate",         subtitle: "Bus Stand area",     icon: "location", lat: 18.5018, lng: 73.8636 },
  { name: "Aundh",            subtitle: "ITI Road",           icon: "location", lat: 18.5580, lng: 73.8073 },
  { name: "Hadapsar",         subtitle: "Magarpatta City",    icon: "briefcase",lat: 18.5089, lng: 73.9260 },
  { name: "Katraj",           subtitle: "Satara Road",        icon: "location", lat: 18.4575, lng: 73.8653 },
  { name: "Camp (MG Road)",   subtitle: "East Street",        icon: "cart",     lat: 18.5139, lng: 73.8790 },
  { name: "PCMC (Pimpri)",    subtitle: "Auto Cluster area",  icon: "briefcase",lat: 18.6298, lng: 73.7997 },
  { name: "Pune Station",     subtitle: "Railway Station",    icon: "location", lat: 18.5285, lng: 73.8743 },
];

/* ------------------------------------------------------------------ */
/*  Safety helpers                                                     */
/* ------------------------------------------------------------------ */
const n01 = (v: number): number =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;

const lumosScoreFrom = (f: SafetyFactors): number =>
  Math.round(n01(f.lightingDensity * 0.4 + f.nightLuminosity * 0.3 + f.areaSafetyIndex * 0.3) * 100);

/* ------------------------------------------------------------------ */
/*  Realistic waypoint generation along Pune streets                   */
/* ------------------------------------------------------------------ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const jitter = (v: number, amount: number) => v + (Math.random() - 0.5) * 2 * amount;

const buildWaypoints = (
  origin: LatLng,
  destination: LatLng,
  offsetBias: number,
  numPoints: number,
): Coordinate[] => {
  const pts: Coordinate[] = [{ latitude: origin.lat, longitude: origin.lng }];
  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);
    pts.push({
      latitude: jitter(lerp(origin.lat, destination.lat, t), 0.003) + offsetBias,
      longitude: jitter(lerp(origin.lng, destination.lng, t), 0.003) - offsetBias * 0.6,
    });
  }
  pts.push({ latitude: destination.lat, longitude: destination.lng });
  return pts;
};

const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const coordsDistanceKm = (coords: Coordinate[]): number => {
  let d = 0;
  for (let i = 1; i < coords.length; i++) {
    d += haversineKm(
      { lat: coords[i - 1].latitude, lng: coords[i - 1].longitude },
      { lat: coords[i].latitude, lng: coords[i].longitude },
    );
  }
  return d;
};

/* ------------------------------------------------------------------ */
/*  Route builder                                                      */
/* ------------------------------------------------------------------ */
const buildRoute = (
  origin: LatLng,
  destination: LatLng,
  index: number,
  isSafest: boolean,
): LumosRoute => {
  const offsetBias = isSafest ? 0.004 : -0.003;
  const coords = buildWaypoints(origin, destination, offsetBias, isSafest ? 6 : 4);
  const distKm = coordsDistanceKm(coords);
  const distanceMeters = Math.round(distKm * 1000);
  const avgSpeed = isSafest ? 25 : 38;
  const durationSeconds = Math.round((distKm / avgSpeed) * 3600);

  const safetyFactors: SafetyFactors = isSafest
    ? {
        lightingDensity: n01(0.82 + Math.random() * 0.12),
        nightLuminosity: n01(0.75 + Math.random() * 0.15),
        areaSafetyIndex: n01(0.80 + Math.random() * 0.12),
      }
    : {
        lightingDensity: n01(0.38 + Math.random() * 0.22),
        nightLuminosity: n01(0.30 + Math.random() * 0.20),
        areaSafetyIndex: n01(0.42 + Math.random() * 0.18),
      };

  return {
    id: `route-${index}`,
    polyline: "",
    coordinates: coords,
    legs: [{ distanceMeters, durationSeconds }],
    summary: { distanceMeters, durationSeconds },
    safetyFactors,
    lumosScore: lumosScoreFrom(safetyFactors),
    safetyNote: isSafest
      ? "Well-lit main roads via commercial zones"
      : "Some poorly lit residential stretches",
  };
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */
export const fetchSafetyRoutes = async (
  origin: LatLng,
  destination: LatLng,
): Promise<SafetyScorerResponse> => {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const safest = buildRoute(origin, destination, 0, true);
  const fastest = buildRoute(origin, destination, 1, false);
  const routes = [safest, fastest];

  const explanation: SafetyExplanation = {
    safestRouteId: safest.id,
    routes: routes.map((r) => ({
      id: r.id,
      lumosScore: r.lumosScore,
      rationale:
        r.id === safest.id
          ? `This route follows well-lit main roads through active commercial areas of Pune. Street lighting density is ${Math.round(r.safetyFactors.lightingDensity * 100)}%, and the area safety index is ${Math.round(r.safetyFactors.areaSafetyIndex * 100)}%.`
          : `Shorter but passes through dimly lit residential lanes. Lighting coverage drops to ${Math.round(r.safetyFactors.lightingDensity * 100)}% with lower pedestrian activity at night.`,
    })),
    highLevelSummary: `Recommended: Safest route scores ${safest.lumosScore}/100 — excellent lighting and active surroundings. Fastest route is ${((fastest.summary.distanceMeters - safest.summary.distanceMeters) / 1000).toFixed(1)} km shorter but scores only ${fastest.lumosScore}/100.`,
  };

  return { safestRouteId: safest.id, routes, explanation };
};

export const getAreaSafetyScore = (): number => Math.floor(78 + Math.random() * 17);
