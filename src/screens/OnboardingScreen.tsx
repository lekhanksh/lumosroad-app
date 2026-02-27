import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

type PermissionItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
};

const PermissionItem: React.FC<PermissionItemProps> = ({ icon, color, title, description }) => (
  <View style={styles.permissionRow}>
    <View style={[styles.permissionIcon, { backgroundColor: color + "18" }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.permissionText}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionDesc}>{description}</Text>
    </View>
  </View>
);

export const OnboardingScreen: React.FC = () => {
  const { setHasOnboarded } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>LumosRoad</Text>
          <Text style={styles.tagline}>Navigate Safely, Arrive Confidently</Text>
        </View>

        <View style={styles.permissionsCard}>
          <PermissionItem
            icon="location"
            color="#6C63FF"
            title="Location Access"
            description="Required for real-time navigation and safety monitoring"
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="call"
            color="#4CAF50"
            title="Emergency Contacts"
            description="Access contacts for instant SOS alerts"
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="notifications"
            color="#FF9800"
            title="Notifications"
            description="Receive safety alerts and check-in reminders"
          />
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={() => setHasOnboarded(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.enableButtonText}>Enable Safety Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setHasOnboarded(true)}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  permissionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    flex: 1,
    gap: 3,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  permissionDesc: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 58,
  },
  bottomSection: {
    alignItems: "center",
    gap: 16,
  },
  enableButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
