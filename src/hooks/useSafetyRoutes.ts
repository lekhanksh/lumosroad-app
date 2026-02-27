import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng, SafetyScorerResponse } from "../types/navigation";
import { fetchSafetyRoutes as fetchMock } from "../services/mockSafetyApi";

type UseSafetyRoutesParams = {
  origin: LatLng | null;
  destination: LatLng | null;
  autoFetch?: boolean;
};

type SafetyRoutesState = {
  data: SafetyScorerResponse | null;
  isLoading: boolean;
  error: string | null;
  source: "lambda" | "mock" | null;
  refetch: () => Promise<void>;
};

const SAFETY_API_BASE_URL = process.env.EXPO_PUBLIC_SAFETY_API_BASE_URL ?? "";

const fetchFromLambda = async (
  origin: LatLng,
  destination: LatLng,
): Promise<SafetyScorerResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(SAFETY_API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Lambda ${res.status}`);
    return (await res.json()) as SafetyScorerResponse;
  } finally {
    clearTimeout(timeout);
  }
};

export const useSafetyRoutes = ({
  origin,
  destination,
  autoFetch = true,
}: UseSafetyRoutesParams): SafetyRoutesState => {
  const [data, setData] = useState<SafetyScorerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"lambda" | "mock" | null>(null);
  const seqRef = useRef(0);

  const fetchRoutes = useCallback(async () => {
    if (!origin || !destination) return;

    const seq = ++seqRef.current;
    setIsLoading(true);
    setError(null);
    setSource(null);

    try {
      // Try Lambda first if URL is configured
      if (SAFETY_API_BASE_URL && !SAFETY_API_BASE_URL.includes("XXXX")) {
        try {
          const lambdaData = await fetchFromLambda(origin, destination);
          if (seq !== seqRef.current) return;
          setData(lambdaData);
          setSource("lambda");
          return;
        } catch (lambdaErr) {
          console.log("Lambda unavailable, falling back to mock:", (lambdaErr as Error).message);
        }
      }

      // Fallback to local mock
      const mockData = await fetchMock(origin, destination);
      if (seq !== seqRef.current) return;
      setData(mockData);
      setSource("mock");
    } catch (err) {
      if (seq === seqRef.current) {
        setError((err as Error).message);
      }
    } finally {
      if (seq === seqRef.current) {
        setIsLoading(false);
      }
    }
  }, [origin, destination]);

  useEffect(() => {
    if (autoFetch && origin && destination) {
      void fetchRoutes();
    }
  }, [autoFetch, origin, destination, fetchRoutes]);

  return { data, isLoading, error, source, refetch: fetchRoutes };
};

