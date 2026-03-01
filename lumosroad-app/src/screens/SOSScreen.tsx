import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type StatusEntry = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const ENTRIES: StatusEntry[] = [
  { icon: "people", label: "Guardians Notified" },
  { icon: "videocam", label: "Recording Started" },
  { icon: "notifications", label: "Alarm Activated" },
  { icon: "location", label: "Live Location Shared" },
];

export const SOSScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [revealed, setRevealed] = useState(0);
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers = ENTRIES.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), (i + 1) * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [ringAnim]);

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });
  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={st.container}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 60 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulsing header */}
        <View style={st.headerWrap}>
          <View style={st.iconWrap}>
            <Animated.View
              style={[
                st.ring,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <View style={st.iconCircle}>
              <Ionicons name="alert-circle" size={48} color="#FFF" />
            </View>
          </View>
          <Text style={st.title}>SOS ACTIVATED</Text>
          <Text style={st.subtitle}>
            Emergency services are being contacted
          </Text>
        </View>

        {/* Connecting */}
        <View style={st.connectCard}>
          <View style={st.connectRow}>
            <View style={st.pulseDot} />
            <Text style={st.connectText}>Connecting to Police</Text>
          </View>
          <Text style={st.stationText}>
            Deccan Police Station, Pune — 0.8 km away
          </Text>
        </View>

        {/* Location */}
        <View style={st.locCard}>
          <View style={st.locHeader}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <Text style={st.locTitle}>Your Location</Text>
          </View>
          <Text style={st.locAddr}>FC Road, Shivajinagar, Pune</Text>
          <View style={st.locMap}>
            <Ionicons name="map" size={32} color="#CBD5E1" />
            <Text style={st.locMapLabel}>Live location shared</Text>
          </View>
        </View>

        {/* Status items */}
        <View style={st.statusList}>
          {ENTRIES.slice(0, revealed).map((e, i) => (
            <View key={i} style={st.statusRow}>
              <View style={st.statusIcon}>
                <Ionicons name={e.icon} size={15} color="#FFF" />
              </View>
              <Text style={st.statusLabel}>{e.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={st.actions}>
          <TouchableOpacity
            style={st.callBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL("tel:112")}
          >
            <Ionicons name="call" size={20} color="#FFF" />
            <Text style={st.callText}>Call 112 — Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.cancelBtn}
            onPress={() => nav.goBack()}
            activeOpacity={0.7}
          >
            <Text style={st.cancelText}>Cancel SOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#DC2626" },
  container: { flex: 1, paddingHorizontal: 20 },
  /* header */
  headerWrap: { alignItems: "center", paddingTop: 28, paddingBottom: 12 },
  iconWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
    marginTop: 14,
  },
  subtitle: { fontSize: 13, color: "#FECACA", marginTop: 4 },
  /* connecting */
  connectCard: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  connectRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
  },
  connectText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  stationText: { fontSize: 12, color: "#FECACA", marginTop: 5, marginLeft: 18 },
  /* location */
  locCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  locHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  locTitle: { fontSize: 11, fontWeight: "700", color: "#EF4444" },
  locAddr: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  locMap: {
    height: 60,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  locMapLabel: { fontSize: 12, color: "#94A3B8" },
  /* status */
  statusList: { marginTop: 12, gap: 7 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  statusLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: "#FFF" },
  /* actions */
  actions: { marginTop: 24, gap: 10 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1D4ED8",
    borderRadius: 16,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  callText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  cancelBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cancelText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
});
