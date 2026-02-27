import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import axios from "axios";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput
} from "@aws-sdk/client-bedrock-runtime";
import {
  Coordinate,
  LatLng,
  LumosRoute,
  RouteLegSummary,
  SafetyExplanation,
  SafetyFactors,
  SafetyScorerEvent,
  SafetyScorerResponse
} from "../types/navigation";

const GOOGLE_ROUTES_API_KEY = process.env.GOOGLE_ROUTES_API_KEY;
const GOOGLE_ROUTES_ENDPOINT =
  process.env.GOOGLE_ROUTES_ENDPOINT ?? "https://routes.googleapis.com/directions/v2:computeRoutes";

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "us-east-1";
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-sonnet-20240620-v1:0";

const bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });

type GoogleLatLng = { latitude: number; longitude: number };
type GoogleRouteLeg = {
  distanceMeters: number;
  duration: string;
};
type GoogleRoute = {
  polyline?: { encodedPolyline?: string };
  legs?: GoogleRouteLeg[];
};

type GoogleRoutesResponse = {
  routes?: GoogleRoute[];
};

const toGoogleLatLng = (coord: LatLng): GoogleLatLng => ({
  latitude: coord.lat,
  longitude: coord.lng
});

const parseDurationSeconds = (duration: string): number => {
  if (duration.endsWith("s")) {
    const base = duration.replace("s", "");
    const seconds = Number(base);
    return Number.isFinite(seconds) ? seconds : 0;
  }
  return 0;
};

const decodePolyline = (encoded: string): Coordinate[] => {
  const coords: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
};

const buildLumosRoute = async (route: GoogleRoute, index: number): Promise<LumosRoute> => {
  const legs: RouteLegSummary[] =
    route.legs?.map((leg) => ({
      distanceMeters: leg.distanceMeters,
      durationSeconds: parseDurationSeconds(leg.duration)
    })) ?? [];

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const totalDuration = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);

  // Simple prototype logic to create DIFFERENT safety factors per route
  // so Lumos Scores vary in the UI.
  const distanceKm = totalDistance / 1000;
  const durationMin = totalDuration / 60;

  const lightingDensity = normalise01(1.2 - distanceKm * 0.02 + index * 0.05);
  const nightLuminosity = normalise01(0.5 + 0.1 * Math.cos(durationMin / 10 + index));
  const areaSafetyIndex = normalise01(0.7 - durationMin * 0.01 + index * 0.03);

  const safetyFactors: SafetyFactors = {
    lightingDensity,
    nightLuminosity,
    areaSafetyIndex
  };

  const lumosScore = computeLumosScore(safetyFactors);
  const polylineStr = route.polyline?.encodedPolyline ?? "";
  const coordinates = polylineStr ? decodePolyline(polylineStr) : [];

  const safetyNote =
    lumosScore >= 80
      ? "Well-lit main roads via commercial zones"
      : lumosScore >= 60
        ? "Moderate lighting; some residential stretches"
        : "Some poorly lit residential stretches";

  return {
    id: `route-${index}`,
    polyline: polylineStr,
    coordinates,
    legs,
    summary: {
      distanceMeters: totalDistance,
      durationSeconds: totalDuration
    },
    safetyFactors,
    lumosScore,
    safetyNote
  };
};

const normalise01 = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
};

const computeLumosScore = (factors: SafetyFactors): number => {
  const lightingWeight = 0.4;
  const luminosityWeight = 0.3;
  const areaWeight = 0.3;

  const raw =
    factors.lightingDensity * lightingWeight +
    factors.nightLuminosity * luminosityWeight +
    factors.areaSafetyIndex * areaWeight;

  return Math.round(normalise01(raw) * 100);
};

const callGoogleRoutes = async (input: SafetyScorerEvent): Promise<GoogleRoutesResponse> => {
  if (!GOOGLE_ROUTES_API_KEY) {
    throw new Error("Missing GOOGLE_ROUTES_API_KEY");
  }

  const body = {
    origin: {
      location: {
        latLng: toGoogleLatLng(input.origin)
      }
    },
    destination: {
      location: {
        latLng: toGoogleLatLng(input.destination)
      }
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: true,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false
    }
  };

  const response = await axios.post<GoogleRoutesResponse>(GOOGLE_ROUTES_ENDPOINT, body, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_ROUTES_API_KEY,
      "X-Goog-FieldMask": "routes.polyline,routes.legs.distanceMeters,routes.legs.duration"
    },
    timeout: 8000
  });

  return response.data;
};

const explainWithBedrock = async (routes: LumosRoute[]): Promise<SafetyExplanation> => {
  const prompt = `
You are LumosRoad's Safety Scoring Agent.
You are given multiple candidate driving routes at night. Each route has:
- A Lumos safety score (0–100)
- Normalised safety factors: lightingDensity, nightLuminosity, areaSafetyIndex
- Distance and duration summaries

Choose which route is safest overall for a typical cautious user at night and explain why.

Return ONLY a compact JSON object with this shape, no extra commentary:
{
  "safestRouteId": "route-x",
  "routes": [
    { "id": "route-x", "lumosScore": 92, "rationale": "..." }
  ],
  "highLevelSummary": "..."
}

Routes:
${JSON.stringify(
  routes.map((r) => ({
    id: r.id,
    lumosScore: r.lumosScore,
    safetyFactors: r.safetyFactors,
    summary: r.summary
  })),
  null,
  2
)}
`;

  const input: ConverseCommandInput = {
    modelId: BEDROCK_MODEL_ID,
    messages: [
      {
        role: "user",
        content: [{ text: prompt }]
      }
    ]
  };

  const command = new ConverseCommand(input);
  const response = await bedrockClient.send(command);

  const textContent =
    response.output?.message?.content?.find((c) => "text" in c && c.text)?.text ?? "";

  if (!textContent) {
    throw new Error("Empty response from Bedrock");
  }

  const parsed = JSON.parse(textContent) as SafetyExplanation;
  return parsed;
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const body: SafetyScorerEvent | null = event.body ? JSON.parse(event.body) : null;
    if (!body?.origin || !body?.destination) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "origin and destination are required" })
      };
    }

    const googleResponse = await callGoogleRoutes(body);
    const routes = googleResponse.routes ?? [];

    if (routes.length === 0) {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "No routes returned from Google" })
      };
    }

    const lumosRoutes: LumosRoute[] = await Promise.all(routes.slice(0, 3).map(buildLumosRoute));
    const explanation = await explainWithBedrock(lumosRoutes);

    const responsePayload: SafetyScorerResponse = {
      safestRouteId: explanation.safestRouteId,
      routes: lumosRoutes,
      explanation
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responsePayload)
    };
  } catch (error) {
    console.error("SafetyScorer error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal error", error: (error as Error).message })
    };
  }
};

