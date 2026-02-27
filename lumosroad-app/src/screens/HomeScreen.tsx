import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { CrossPlatformMap } from "../components/CrossPlatformMap";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { PUNE_PLACES, getAreaSafetyScore } from "../services/mockSafetyApi";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SW } = Dimensions.get("window");

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: "home",
  briefcase: "briefcase",
  location: "location",
  cafe: "cafe",
  school: "school",
  cart: "cart",
};

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setDestination, setDestinationName, savedPlaces } = useApp();
  const [query, setQuery] = useState("");
  const [areaScore] = useState(getAreaSafetyScore);
  const [activeTab, setActiveTab] = useState<"safest" | "fastest">("safest");

  const filteredPlaces =
    query.length > 1
      ? PUNE_PLACES.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.subtitle.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  const handleSelectPlace = (place: { name: string; lat: number; lng: number }) => {
    setDestination({ lat: place.lat, lng: place.lng });
    setDestinationName(place.name);
    setQuery("");
    nav.navigate("RouteComparison");
  };

  const scoreColor =
    areaScore >= 85 ? "#22C55E" : areaScore >= 70 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    areaScore >= 85 ? "Excellent" : areaScore >= 70 ? "Good" : "Fair";

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good evening</Text>
          <Text style={s.title}>LumosRoad</Text>
        </View>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => nav.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={s.searchInput}
            placeholder="Where to in Pune?"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>

        {/* Route-type pills */}
        <View style={s.pills}>
          <TouchableOpacity
            style={[s.pill, activeTab === "safest" && s.pillActive]}
            onPress={() => setActiveTab("safest")}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={activeTab === "safest" ? "#FFF" : "#6C63FF"}
            />
            <Text
              style={[s.pillText, activeTab === "safest" && s.pillTextActive]}
            >
              Safest Route
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.pill, activeTab === "fastest" && s.pillActiveFast]}
            onPress={() => setActiveTab("fastest")}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeTab === "fastest" ? "#FFF" : "#64748B"}
            />
            <Text
              style={[
                s.pillText,
                activeTab === "fastest" && s.pillTextActive,
              ]}
            >
              Fastest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search results dropdown ── */}
      {filteredPlaces.length > 0 ? (
        <View style={s.dropdown}>
          <FlatList
            data={filteredPlaces}
            keyExtractor={(i) => i.name + i.lat}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.dropItem}
                onPress={() => handleSelectPlace(item)}
              >
                <View style={s.dropIcon}>
                  <Ionicons
                    name={ICON_MAP[item.icon] ?? "location"}
                    size={18}
                    color="#6C63FF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.dropName}>{item.name}</Text>
                  <Text style={s.dropSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Map area ── */}
          <View style={s.mapArea}>
            <CrossPlatformMap
              initialRegion={{
                latitude: 18.53,
                longitude: 73.85,
                latitudeDelta: 0.12,
                longitudeDelta: 0.12,
              }}
              showsUserLocation
              markers={PUNE_PLACES.slice(0, 6).map((p) => ({
                coordinate: { latitude: p.lat, longitude: p.lng },
                title: p.name,
                pinColor: "#6C63FF",
              }))}
            />
          </View>

          {/* ── Safety badge ── */}
          <View style={s.scoreBadge}>
            <View style={[s.scoreCircle, { backgroundColor: scoreColor }]}>
              <Text style={s.scoreNum}>{areaScore}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.scoreTitle}>Area Safety Score</Text>
              <Text style={[s.scoreLabel, { color: scoreColor }]}>
                {scoreLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </View>

          {/* ── Quick destinations ── */}
          <Text style={s.sectionHead}>SAVED PLACES</Text>
          <View style={s.savedRow}>
            {savedPlaces.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={s.savedCard}
                onPress={() => handleSelectPlace(p)}
                activeOpacity={0.7}
              >
                <View style={s.savedIcon}>
                  <Ionicons
                    name={p.icon === "home" ? "home" : "briefcase"}
                    size={20}
                    color="#6C63FF"
                  />
                </View>
                <Text style={s.savedName}>{p.name}</Text>
                <Text style={s.savedSub}>{p.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Popular in Pune ── */}
          <Text style={s.sectionHead}>POPULAR IN PUNE</Text>
          {PUNE_PLACES.slice(0, 5).map((p) => (
            <TouchableOpacity
              key={p.name}
              style={s.placeRow}
              onPress={() => handleSelectPlace(p)}
            >
              <View style={s.placeIcon}>
                <Ionicons
                  name={ICON_MAP[p.icon] ?? "location"}
                  size={18}
                  color="#6C63FF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.placeName}>{p.name}</Text>
                <Text style={s.placeSub}>{p.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          {/* ── CTA ── */}
          <TouchableOpacity
            style={s.cta}
            activeOpacity={0.8}
            onPress={() => {
              setDestination({ lat: 18.5362, lng: 73.8936 });
              setDestinationName("Koregaon Park");
              nav.navigate("RouteComparison");
            }}
          >
            <Ionicons name="navigate" size={20} color="#FFF" />
            <Text style={s.ctaText}>Start Safe Navigation</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.tab}>
          <Ionicons name="compass" size={22} color="#6C63FF" />
          <Text style={[s.tabLabel, { color: "#6C63FF" }]}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.tab}
          onPress={() => nav.navigate("Settings")}
        >
          <Ionicons name="person-outline" size={22} color="#94A3B8" />
          <Text style={s.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  /* header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  greeting: { fontSize: 13, color: "#94A3B8" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  /* search */
  searchWrap: { paddingHorizontal: 20, marginTop: 6 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A" },
  pills: { flexDirection: "row", gap: 8, marginTop: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  pillActive: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
  pillActiveFast: { backgroundColor: "#475569", borderColor: "#475569" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  pillTextActive: { color: "#FFF" },
  /* dropdown */
  dropdown: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: "#FFF",
    borderRadius: 14,
    maxHeight: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dropName: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  dropSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  /* scroll body */
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  mapArea: {
    marginTop: 14,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    height: 190,
  },
  /* safety badge */
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  scoreTitle: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreLabel: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  /* sections */
  sectionHead: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 10,
  },
  savedRow: { flexDirection: "row", gap: 12 },
  savedCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  savedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  savedName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  savedSub: { fontSize: 11, color: "#94A3B8", marginTop: 3, textAlign: "center" },
  /* place rows */
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  placeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  placeName: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  placeSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  /* CTA */
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  /* bottom bar */
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFF",
  },
  tab: { alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 11, color: "#94A3B8" },
});
