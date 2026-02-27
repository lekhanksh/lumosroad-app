import React, { useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { decode } from "@googlemaps/polyline-codec";
import { useSafetyRoutes } from "../hooks/useSafetyRoutes";
import type { LatLng, LumosRoute } from "../types/navigation";

const INITIAL_ORIGIN: LatLng = { lat: 37.7749, lng: -122.4194 };
const INITIAL_DESTINATION: LatLng = { lat: 37.7849, lng: -122.4094 };

const INITIAL_REGION = {
  latitude: INITIAL_ORIGIN.lat,
  longitude: INITIAL_ORIGIN.lng,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

type SelectedRouteKind = "fastest" | "lumosSafest" | null;

const decodePolylineToCoords = (polyline: string) => {
  const decoded = decode(polyline, 5);
  return decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
};

const getFastestRoute = (routes: LumosRoute[]): LumosRoute | null => {
  if (routes.length === 0) return null;
  return routes.reduce((fastest, current) =>
    current.summary.durationSeconds < fastest.summary.durationSeconds ? current : fastest
  );
};

const getLumosSafestRoute = (routes: LumosRoute[], safestRouteId: string): LumosRoute | null =>
  routes.find((r) => r.id === safestRouteId) ?? null;

export const MapScreen: React.FC = () => {
  const [selectedKind, setSelectedKind] = useState<SelectedRouteKind>("lumosSafest");

  const { data, isLoading, error } = useSafetyRoutes({
    origin: INITIAL_ORIGIN,
    destination: INITIAL_DESTINATION,
    autoFetch: true
  });

  const fastestRoute = useMemo(() => (data ? getFastestRoute(data.routes) : null), [data]);
  const lumosSafestRoute = useMemo(
    () => (data ? getLumosSafestRoute(data.routes, data.safestRouteId) : null),
    [data]
  );

  const selectedRoute =
    selectedKind === "fastest" ? fastestRoute : selectedKind === "lumosSafest" ? lumosSafestRoute : null;

  const safetyScore = selectedRoute?.lumosScore ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>LumosRoad</Text>
          <Text style={styles.subTitle}>Brightest path through the night</Text>
        </View>

        {selectedRoute && safetyScore !== null && (
          <View style={styles.safetyCard}>
            <Text style={styles.safetyLabel}>Safety Score</Text>
            <Text style={styles.safetyValue}>{safetyScore}</Text>
            <Text style={styles.safetySummary}>{data?.explanation.highLevelSummary}</Text>
          </View>
        )}

        <View style={styles.routeToggleRow}>
          <TouchableOpacity
            style={[styles.routeChip, selectedKind === "fastest" && styles.routeChipActiveFastest]}
            onPress={() => setSelectedKind("fastest")}
          >
            <Text style={[styles.routeChipTitle, selectedKind === "fastest" && styles.routeChipTitleActiveFastest]}>
              Fastest
            </Text>
            <Text style={[styles.routeChipMeta, selectedKind === "fastest" && styles.routeChipMetaActiveFastest]}>
              {fastestRoute ? `${Math.round(fastestRoute.summary.durationSeconds / 60)} min` : "--"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeChip, selectedKind === "lumosSafest" && styles.routeChipActiveSafest]}
            onPress={() => setSelectedKind("lumosSafest")}
          >
            <Text style={[styles.routeChipTitle, selectedKind === "lumosSafest" && styles.routeChipTitleActiveSafest]}>
              Lumos Safest
            </Text>
            <Text style={[styles.routeChipMeta, selectedKind === "lumosSafest" && styles.routeChipMetaActiveSafest]}>
              {lumosSafestRoute ? `${Math.round(lumosSafestRoute.summary.durationSeconds / 60)} min` : "--"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFD54F" />
              <Text style={styles.loadingText}>Scoring brightest paths…</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Could not load safety routes.</Text>
              <Text style={styles.errorTextSecondary}>{error}</Text>
            </View>
          )}
          <MapView style={styles.map} initialRegion={INITIAL_REGION} customMapStyle={DARK_MAP_STYLE}>
            {fastestRoute?.polyline && (
              <Polyline
                coordinates={decodePolylineToCoords(fastestRoute.polyline)}
                strokeColor="#4DA3FF"
                strokeWidth={selectedKind === "fastest" ? 7 : 4}
              />
            )}
            {lumosSafestRoute?.polyline && (
              <Polyline
                coordinates={decodePolylineToCoords(lumosSafestRoute.polyline)}
                strokeColor="#FFD54F"
                strokeWidth={selectedKind === "lumosSafest" ? 8 : 5}
              />
            )}
          </MapView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const DARK_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [{ color: "#151823" }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#A0A4B8" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#05060A" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#232633" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#10121A" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#161926" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0B0E18" }]
  }
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#05060A"
  },
  container: {
    flex: 1,
    backgroundColor: "#05060A",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12
  },
  header: {
    paddingTop: 8,
    gap: 4
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  subTitle: {
    fontSize: 12,
    color: "#8C90A5"
  },
  safetyCard: {
    backgroundColor: "#0B0E18",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2E40"
  },
  safetyLabel: {
    color: "#8C90A5",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  safetyValue: {
    color: "#FFD54F",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4
  },
  safetySummary: {
    color: "#6F7390",
    fontSize: 11,
    marginTop: 4
  },
  routeToggleRow: {
    flexDirection: "row",
    gap: 10
  },
  routeChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#23263A",
    backgroundColor: "#050712"
  },
  routeChipActiveFastest: {
    borderColor: "#4DA3FF55",
    backgroundColor: "#101326"
  },
  routeChipActiveSafest: {
    borderColor: "#FFD54F88",
    backgroundColor: "#22160C"
  },
  routeChipTitle: {
    color: "#D4D7E6",
    fontSize: 14,
    fontWeight: "600"
  },
  routeChipTitleActiveFastest: {
    color: "#AFD2FF"
  },
  routeChipTitleActiveSafest: {
    color: "#FFECB3"
  },
  routeChipMeta: {
    color: "#7D8297",
    fontSize: 12,
    marginTop: 2
  },
  routeChipMetaActiveFastest: {
    color: "#C1DFFF"
  },
  routeChipMetaActiveSafest: {
    color: "#FFF3C4"
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#05060A",
    borderWidth: 1,
    borderColor: "#1B1E2C"
  },
  map: {
    flex: 1
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 2,
    backgroundColor: "rgba(5,6,10,0.85)"
  },
  loadingText: {
    marginTop: 4,
    fontSize: 11,
    color: "#C2C6D8"
  },
  errorOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(110,36,36,0.9)",
    zIndex: 2
  },
  errorText: {
    color: "#FFEDEE",
    fontSize: 12,
    fontWeight: "600"
  },
  errorTextSecondary: {
    color: "#FFD0D5",
    fontSize: 11,
    marginTop: 2
  }
});

