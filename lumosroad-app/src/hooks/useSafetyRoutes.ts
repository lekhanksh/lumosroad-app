import { useCallback, useEffect, useState } from "react";
import type { LatLng, SafetyScorerResponse } from "../types/navigation";
import { fetchSafetyRoutes } from "../services/mockSafetyApi";

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

export const useSafetyRoutes = ({
  origin,
  destination,
  autoFetch = true,
}: UseSafetyRoutesParams): SafetyRoutesState => {
  const [data, setData] = useState<SafetyScorerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"lambda" | "mock" | null>(null);

  const fetchRoutes = useCallback(async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    setError(null);

    // Try live API first, fall back to mock
    if (SAFETY_API_BASE_URL && !SAFETY_API_BASE_URL.includes("XXXX")) {
      try {
        const response = await fetch(SAFETY_API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        let json = await response.json();
        
        // Handle API Gateway wrapper format
        if (json.body && typeof json.body === 'string') {
          json = JSON.parse(json.body);
        }
        
        setData(json as SafetyScorerResponse);
        setSource("lambda");
        setIsLoading(false);
        return;
      } catch {
        // Fall through to mock
      }
    }

    // Mock fallback
    try {
      const mock = await fetchSafetyRoutes(origin, destination);
      setData(mock);
      setSource("mock");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination]);

  useEffect(() => {
    if (autoFetch && origin && destination) {
      void fetchRoutes();
    }
  }, [autoFetch, origin, destination, fetchRoutes]);

  return { data, isLoading, error, source, refetch: fetchRoutes };
};

