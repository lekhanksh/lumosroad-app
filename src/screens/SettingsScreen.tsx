import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ── Reusable rows ── */
const Toggle: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}> = ({ icon, tint, title, sub, value, onToggle }) => (
  <View style={st.row}>
    <View style={[st.rowIcon, { backgroundColor: tint + "14" }]}>
      <Ionicons name={icon} size={18} color={tint} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={st.rowTitle}>{title}</Text>
      <Text style={st.rowSub}>{sub}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: "#E2E8F0", true: "#6C63FF" }}
      thumbColor="#FFF"
    />
  </View>
);

const Contact: React.FC<{ name: string; phone: string }> = ({ name, phone }) => (
  <TouchableOpacity style={st.contactRow} activeOpacity={0.6}>
    <View style={st.avatar}>
      <Text style={st.avatarText}>{name.charAt(0)}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={st.contactName}>{name}</Text>
      <Text style={st.contactPhone}>{phone}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const Pref: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  value: string;
}> = ({ icon, tint, title, value }) => (
  <TouchableOpacity style={st.row} activeOpacity={0.6}>
    <View style={[st.rowIcon, { backgroundColor: tint + "14" }]}>
      <Ionicons name={icon} size={18} color={tint} />
    </View>
    <Text style={[st.rowTitle, { flex: 1 }]}>{title}</Text>
    <Text style={st.prefVal}>{value}</Text>
    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
  </TouchableOpacity>
);

/* ── Screen ── */
export const SettingsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { settings, updateSettings, emergencyContacts } = useApp();

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={st.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={st.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={st.headerTitle}>Settings</Text>
            <Text style={st.headerSub}>Manage your safety preferences</Text>
          </View>
        </View>

        {/* Safety Features */}
        <Text style={st.section}>SAFETY FEATURES</Text>
        <View style={st.card}>
          <Toggle
            icon="people"
            tint="#6C63FF"
            title="Guardian Mode"
            sub="Share live location with trusted contacts"
            value={settings.guardianMode}
            onToggle={(v) => updateSettings({ guardianMode: v })}
          />
          <View style={st.divider} />
          <Toggle
            icon="call"
            tint="#22C55E"
            title="Auto-SOS"
            sub="Trigger SOS after 60 s of inactivity"
            value={settings.autoSos}
            onToggle={(v) => updateSettings({ autoSos: v })}
          />
          <View style={st.divider} />
          <Toggle
            icon="notifications"
            tint="#F59E0B"
            title="Safety Alerts"
            sub="Get notified about unsafe areas nearby"
            value={settings.safetyAlerts}
            onToggle={(v) => updateSettings({ safetyAlerts: v })}
          />
        </View>

        {/* Emergency Contacts */}
        <View style={st.sectionRow}>
          <Text style={st.section}>EMERGENCY CONTACTS</Text>
          <TouchableOpacity>
            <Text style={st.addLink}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          {emergencyContacts.map((c, i) => (
            <React.Fragment key={c.id}>
              {i > 0 && <View style={st.divider} />}
              <Contact name={c.name} phone={c.phone} />
            </React.Fragment>
          ))}
        </View>

        {/* Preferences */}
        <Text style={st.section}>PREFERENCES</Text>
        <View style={st.card}>
          <Pref
            icon="navigate"
            tint="#6C63FF"
            title="Default Route"
            value={settings.defaultRouteType === "safest" ? "Safest" : "Fastest"}
          />
          <View style={st.divider} />
          <Pref
            icon="moon"
            tint="#6366F1"
            title="Night Mode"
            value={
              settings.nightMode === "auto"
                ? "Auto"
                : settings.nightMode === "on"
                  ? "On"
                  : "Off"
            }
          />
          <View style={st.divider} />
          <Pref icon="shield" tint="#14B8A6" title="Privacy" value="" />
        </View>

        {/* About */}
        <Text style={st.section}>ABOUT</Text>
        <View style={st.card}>
          <Pref icon="information-circle" tint="#6C63FF" title="App Version" value="1.0.0" />
          <View style={st.divider} />
          <Pref icon="document-text" tint="#94A3B8" title="Terms & Privacy" value="" />
        </View>

        <TouchableOpacity style={st.signOut} activeOpacity={0.6}>
          <Text style={st.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 18,
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
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  section: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 22,
    marginLeft: 2,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8,
  },
  addLink: { fontSize: 13, fontWeight: "600", color: "#6C63FF" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  rowSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 62 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700", color: "#6C63FF" },
  contactName: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  contactPhone: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  prefVal: { fontSize: 13, color: "#94A3B8", marginRight: 4 },
  signOut: { alignItems: "center", paddingVertical: 18, marginTop: 28 },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
});
