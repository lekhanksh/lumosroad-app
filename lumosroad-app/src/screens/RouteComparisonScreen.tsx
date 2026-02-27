import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CrossPlatformMap } from "../components/CrossPlatformMap";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { useSafetyRoutes } from "../hooks/useSafetyRoutes";
import type { RootStackParamList } from "../navigation/types";
import type { LumosRoute } from "../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ── helpers ── */
const scoreColor = (s: number) =>
  s >= 80 ? "#22C55E" : s >= 60 ? "#F59E0B" : "#EF4444";

const Badge: React.FC<{ score: number; size?: number }> = ({ score, size = 38 }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: scoreColor(score),
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ color: "#FFF", fontWeight: "800", fontSize: size * 0.38 }}>
      {score}
    </Text>
  </View>
);

/* ── route card ── */
const RouteCard: React.FC<{
  route: LumosRoute;
  isSafest: boolean;
  selected: boolean;
  onPress: () => void;
}> = ({ route, isSafest, selected, onPress }) => {
  const km = (route.summary.distanceMeters / 1000).toFixed(1);
  const min = Math.round(route.summary.durationSeconds / 60);
  const accent = isSafest ? "#6C63FF" : "#475569";

  return (
    <TouchableOpacity
      style={[st.card, selected && { borderColor: accent, borderWidth: 2.5 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* title row */}
      <View style={st.cardTop}>
        <View style={st.cardTitleRow}>
          <Ionicons
            name={isSafest ? "shield-checkmark" : "flash"}
            size={18}
            color={accent}
          />
          <Text style={st.cardTitle}>
            {isSafest ? "Safest Route" : "Fastest Route"}
          </Text>
          {isSafest && (
            <View style={st.recBadge}>
              <Text style={st.recText}>RECOMMENDED</Text>
            </View>
          )}
        </View>
        <Badge score={route.lumosScore} size={36} />
      </View>

      {/* metrics */}
      <View style={st.metricsRow}>
        <View style={st.metricBox}>
          <Text style={st.metricLabel}>Distance</Text>
          <Text style={st.metricVal}>{km} km</Text>
        </View>
        <View style={[st.metricBox, st.metricBorder]}>
          <Text style={st.metricLabel}>Time</Text>
          <Text style={st.metricVal}>{min} min</Text>
        </View>
        <View style={st.metricBox}>
          <Text style={st.metricLabel}>Safety</Text>
          <Badge score={route.lumosScore} size={26} />
        </View>
      </View>

      {/* note */}
      <View style={st.noteRow}>
        <Ionicons
          name={isSafest ? "sunny" : "warning"}
          size={14}
          color={isSafest ? "#22C55E" : "#F59E0B"}
        />
        <Text
          style={[
            st.noteText,
            { color: isSafest ? "#22C55E" : "#F59E0B" },
          ]}
        >
          {route.safetyNote}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* ── screen ── */
export const RouteComparisonScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { origin, destination, destinationName, setRouteData, setSelectedRoute } =
    useApp();
  const { data, isLoading, source } = useSafetyRoutes({
    origin,
    destination,
    autoFetch: true,
  });

  const routes = data?.routes ?? [];
  const safestId = data?.safestRouteId ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? safestId;

  // Route data is synced to context when user taps Start

  const safestRoute = routes.find((r) => r.id === safestId);
  const fastestRoute = routes.find((r) => r.id !== safestId);
  const explanation = data?.explanation;

  const mapMarkers = [
    ...(origin ? [{ coordinate: { latitude: origin.lat, longitude: origin.lng }, title: "Start", pinColor: "#6C63FF" }] : []),
    ...(destination ? [{ coordinate: { latitude: destination.lat, longitude: destination.lng }, title: destinationName || "Destination", pinColor: "#EF4444" }] : []),
  ];
  const mapPolylines = [
    ...(safestRoute && safestRoute.coordinates.length > 0
      ? [{ id: "safest", coordinates: safestRoute.coordinates, color: "#6C63FF", width: activeId === safestRoute.id ? 5 : 3 }]
      : []),
    ...(fastestRoute && fastestRoute.coordinates.length > 0
      ? [{ id: "fastest", coordinates: fastestRoute.coordinates, color: "#F59E0B", width: activeId === fastestRoute.id ? 5 : 3, dashed: true }]
      : []),
  ];

  const handleStart = () => {
    if (data) setRouteData(data);
    const route = routes.find((r) => r.id === activeId) ?? null;
    setSelectedRoute(route);
    nav.navigate("ActiveNavigation");
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={st.container}>
        {/* header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={st.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.destName}>{destinationName || "Destination"}</Text>
            <Text style={st.destSub}>
              {safestRoute
                ? `${(safestRoute.summary.distanceMeters / 1000).toFixed(1)} km away`
                : "Calculating..."}
            </Text>
          </View>
          {source && (
            <View
              style={[
                st.sourcePill,
                { backgroundColor: source === "lambda" ? "#DBEAFE" : "#F0FDF4" },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: source === "lambda" ? "#2563EB" : "#16A34A",
                }}
              >
                {source === "lambda" ? "LIVE API" : "MOCK"}
              </Text>
            </View>
          )}
        </View>

        {/* map preview */}
        <View style={st.mapPreview}>
          <CrossPlatformMap
            initialRegion={{
              latitude: origin?.lat ?? 18.53,
              longitude: origin?.lng ?? 73.85,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            showsUserLocation
            originCoord={origin}
            destinationCoord={destination}
            destinationLabel={destinationName || "Destination"}
            markers={mapMarkers}
            polylines={mapPolylines}
            fitToCoordinates
          />
        </View>

        {isLoading ? (
          <View style={st.loadWrap}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={st.loadText}>Analyzing safest routes...</Text>
            <Text style={st.loadSub}>
              Scoring lighting, activity & area safety
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.sectionTitle}>Choose Your Route</Text>

            {safestRoute && (
              <RouteCard
                route={safestRoute}
                isSafest
                selected={activeId === safestRoute.id}
                onPress={() => setSelectedId(safestRoute.id)}
              />
            )}
            {fastestRoute && (
              <RouteCard
                route={fastestRoute}
                isSafest={false}
                selected={activeId === fastestRoute.id}
                onPress={() => setSelectedId(fastestRoute.id)}
              />
            )}

            {/* explanation */}
            {explanation && (
              <View style={st.explCard}>
                <Ionicons name="bulb" size={16} color="#F59E0B" />
                <Text style={st.explText}>
                  {explanation.highLevelSummary}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* bottom */}
        {!isLoading && routes.length > 0 && (
          <View style={st.bottom}>
            <TouchableOpacity
              style={st.primaryBtn}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={st.primaryText}>
                {activeId === safestId
                  ? "Start Safest Route"
                  : "Use Fastest Route"}
              </Text>
            </TouchableOpacity>
            {activeId === safestId && fastestRoute && (
              <TouchableOpacity
                onPress={() => setSelectedId(fastestRoute.id)}
              >
                <Text style={st.secondaryText}>Use Fastest Route</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  destName: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  destSub: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapPreview: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "#E2E8F0",
  },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  loadSub: { fontSize: 12, color: "#94A3B8" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 10,
  },
  /* card */
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  recBadge: {
    backgroundColor: "#22C55E",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  recText: { fontSize: 9, fontWeight: "800", color: "#FFF" },
  metricsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  metricBox: { flex: 1, alignItems: "center", gap: 4 },
  metricBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F1F5F9",
  },
  metricLabel: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricVal: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  noteText: { fontSize: 12, fontWeight: "600" },
  /* explanation */
  explCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  explText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },
  /* bottom */
  bottom: { paddingBottom: 28, paddingTop: 8, gap: 10, alignItems: "center" },
  primaryBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  secondaryText: { color: "#94A3B8", fontSize: 14, fontWeight: "600", paddingVertical: 8 },
});
