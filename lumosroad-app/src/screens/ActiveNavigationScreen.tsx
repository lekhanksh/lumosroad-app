import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
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
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const scColor = (s: number) =>
  s >= 80 ? "#22C55E" : s >= 60 ? "#F59E0B" : "#EF4444";

/* ── Safety-check overlay ── */
const SafetyCheckOverlay: React.FC<{
  score: number;
  onSafe: () => void;
  onSOS: () => void;
  onContinue: () => void;
}> = ({ score, onSafe, onSOS, onContinue }) => {
  const [countdown, setCountdown] = useState(45);
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={st.checkWrap}>
        <View style={st.checkIconWrap}>
          <Ionicons name="warning" size={44} color="#F59E0B" />
        </View>
        <Text style={st.checkTitle}>Safety Check</Text>
        <Text style={st.checkDesc}>
          You've stopped in a low-safety area in Pune
        </Text>

        <View style={st.checkCard}>
          <View style={st.checkRow}>
            <Text style={st.checkLabel}>Location Safety</Text>
            <View style={[st.miniBadge, { backgroundColor: "#F59E0B" }]}>
              <Text style={st.miniBadgeText}>{Math.max(45, score - 30)}</Text>
            </View>
          </View>
          <View style={st.checkRow}>
            <Ionicons name="location" size={15} color="#EF4444" />
            <Text style={st.checkLoc}>Swargate area, Pune</Text>
          </View>
        </View>

        <View style={st.countdownWrap}>
          <Text style={st.countdownLabel}>Guardian alert in</Text>
          <Text style={st.countdownNum}>
            0:{countdown < 10 ? `0${countdown}` : countdown}
          </Text>
          <Text style={st.countdownHint}>Tap "I'm Safe" to cancel</Text>
        </View>

        <TouchableOpacity style={st.safeBtn} onPress={onSafe} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={st.safeBtnText}>I'm Safe</Text>
        </TouchableOpacity>

        <TouchableOpacity style={st.sosBtn} onPress={onSOS} activeOpacity={0.8}>
          <Ionicons name="call" size={20} color="#FFF" />
          <Text style={st.sosBtnText}>Trigger SOS Now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onContinue}>
          <Text style={st.contText}>Continue Navigation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* ── Main screen ── */
export const ActiveNavigationScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedRoute, settings, emergencyContacts, setIsNavigating, destinationName, origin, destination } =
    useApp();
  const [eta, setEta] = useState(0);
  const [distance, setDistance] = useState(0);
  const [safetyScore, setSafetyScore] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsNavigating(true);
    if (selectedRoute) {
      setEta(Math.round(selectedRoute.summary.durationSeconds / 60));
      setDistance(
        parseFloat((selectedRoute.summary.distanceMeters / 1000).toFixed(1)),
      );
      setSafetyScore(selectedRoute.lumosScore);
    }
    const timer = setTimeout(() => setShowCheck(true), 12000);
    return () => {
      clearTimeout(timer);
      setIsNavigating(false);
    };
  }, [selectedRoute, setIsNavigating]);

  // pulse animation for SOS button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // simulated ETA countdown
  useEffect(() => {
    const iv = setInterval(() => {
      setEta((p) => Math.max(0, p - 1));
      setDistance((p) => Math.max(0, parseFloat((p - 0.05).toFixed(1))));
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  if (showCheck) {
    return (
      <SafetyCheckOverlay
        score={safetyScore}
        onSafe={() => setShowCheck(false)}
        onSOS={() => nav.navigate("SOS")}
        onContinue={() => setShowCheck(false)}
      />
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={st.root}>
        {/* Guardian header */}
        {settings.guardianMode && (
          <View style={st.guardianBar}>
            <View style={st.guardianLeft}>
              <View style={st.greenDot} />
              <Text style={st.guardianText}>Guardian Mode Active</Text>
            </View>
            <Text style={st.guardianCount}>
              {emergencyContacts.length} watching
            </Text>
          </View>
        )}

        {/* Destination pill */}
        <View style={st.destPill}>
          <Ionicons name="navigate" size={16} color="#6C63FF" />
          <Text style={st.destText} numberOfLines={1}>
            {destinationName || "Destination"}
          </Text>
        </View>

        {/* Map area */}
        <View style={st.mapArea}>
          <CrossPlatformMap
            style={{ flex: 1, borderRadius: 20 }}
            initialRegion={{
              latitude: origin?.lat ?? 18.53,
              longitude: origin?.lng ?? 73.85,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            originCoord={origin}
            destinationCoord={destination}
            destinationLabel={destinationName || "Destination"}
            markers={[
              ...(origin ? [{ coordinate: { latitude: origin.lat, longitude: origin.lng }, title: "Start", pinColor: "#6C63FF" }] : []),
              ...(destination ? [{ coordinate: { latitude: destination.lat, longitude: destination.lng }, title: destinationName || "Destination", pinColor: "#EF4444" }] : []),
            ]}
            polylines={selectedRoute && selectedRoute.coordinates.length > 0
              ? [{ id: "nav", coordinates: selectedRoute.coordinates, color: "#6C63FF", width: 5 }]
              : []
            }
            fitToCoordinates
          />

          {/* Floating SOS */}
          <Animated.View
            style={[st.sosFloat, { transform: [{ scale: pulse }] }]}
          >
            <TouchableOpacity
              style={st.sosFloatInner}
              onPress={() => nav.navigate("SOS")}
              activeOpacity={0.8}
            >
              <Text style={st.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Nav info card */}
        <View style={st.infoCard}>
          <View style={st.infoTop}>
            <Text style={st.infoTitle}>Safety Score</Text>
            <View
              style={[st.scoreBadge, { backgroundColor: scColor(safetyScore) }]}
            >
              <Text style={st.scoreBadgeText}>{safetyScore}</Text>
            </View>
          </View>
          <View style={st.metricsRow}>
            <View style={st.metricBox}>
              <Text style={st.metricLabel}>ETA</Text>
              <Text style={st.metricVal}>{eta} min</Text>
            </View>
            <View style={[st.metricBox, st.metricBorder]}>
              <Text style={st.metricLabel}>Distance</Text>
              <Text style={st.metricVal}>{distance} km</Text>
            </View>
            <View style={st.metricBox}>
              <Text style={st.metricLabel}>Next Turn</Text>
              <Text style={st.metricVal}>200 m</Text>
            </View>
          </View>
        </View>

        {/* I'm Safe */}
        <TouchableOpacity style={st.imSafeBtn} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={st.imSafeText}>I'm Safe</Text>
        </TouchableOpacity>

        {/* Guardians row */}
        {settings.guardianMode && (
          <View style={st.guardRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="people" size={16} color="#6C63FF" />
              <Text style={st.guardLabel}>
                {emergencyContacts.length} Guardians Watching
              </Text>
            </View>
            <TouchableOpacity onPress={() => nav.navigate("Settings")}>
              <Text style={st.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* End */}
        <TouchableOpacity
          style={st.endBtn}
          onPress={() => nav.navigate("Home")}
          activeOpacity={0.7}
        >
          <Text style={st.endText}>End Navigation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  /* guardian bar */
  guardianBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  guardianLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  guardianText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  guardianCount: { fontSize: 12, color: "#94A3B8" },
  /* dest pill */
  destPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  destText: { fontSize: 13, fontWeight: "600", color: "#6C63FF" },
  /* map */
  mapArea: {
    flex: 1,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  sosFloat: { position: "absolute", right: 16, bottom: 16 },
  sosFloatInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sosText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
  /* info card */
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  metricsRow: { flexDirection: "row" },
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
  metricVal: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  /* I'm safe */
  imSafeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 12,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  imSafeText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  /* guardians row */
  guardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  guardLabel: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  manageLink: { fontSize: 13, fontWeight: "600", color: "#6C63FF" },
  /* end */
  endBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 12 },
  endText: { color: "#EF4444", fontSize: 14, fontWeight: "600" },
  /* ── Safety check overlay ── */
  checkWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: "center",
  },
  checkIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  checkTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  checkDesc: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginBottom: 18 },
  checkCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkLabel: { fontSize: 14, fontWeight: "500", color: "#0F172A" },
  miniBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  checkLoc: { fontSize: 13, color: "#EF4444", marginLeft: 4 },
  countdownWrap: { alignItems: "center", marginBottom: 22 },
  countdownLabel: { fontSize: 12, color: "#94A3B8" },
  countdownNum: { fontSize: 44, fontWeight: "800", color: "#F59E0B", marginTop: 4 },
  countdownHint: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  safeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    marginBottom: 10,
  },
  safeBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    marginBottom: 10,
  },
  sosBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  contText: { color: "#94A3B8", fontSize: 14, fontWeight: "500", paddingVertical: 10 },
});
