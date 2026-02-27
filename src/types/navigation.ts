export type LatLng = {
  lat: number;
  lng: number;
};

export type RouteLegSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

export type SafetyFactors = {
  lightingDensity: number; // 0–1
  nightLuminosity: number; // 0–1
  areaSafetyIndex: number; // 0–1
};

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type LumosRoute = {
  id: string;
  polyline: string;
  coordinates: Coordinate[];
  legs: RouteLegSummary[];
  summary: {
    distanceMeters: number;
    durationSeconds: number;
  };
  safetyFactors: SafetyFactors;
  lumosScore: number; // 0–100
  safetyNote: string;
};

export type SafetyExplanation = {
  safestRouteId: string;
  routes: Array<{
    id: string;
    lumosScore: number;
    rationale: string;
  }>;
  highLevelSummary: string;
};

export type SafetyScorerResponse = {
  safestRouteId: string;
  routes: LumosRoute[];
  explanation: SafetyExplanation;
};
