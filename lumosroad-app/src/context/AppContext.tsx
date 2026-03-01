import React, { createContext, useContext, useState, useCallback } from "react";
import type { LatLng, LumosRoute, SafetyScorerResponse } from "../types/navigation";

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
};

export type SavedPlace = {
  name: string;
  subtitle: string;
  icon: string;
  lat: number;
  lng: number;
};

export type AppSettings = {
  guardianMode: boolean;
  autoSos: boolean;
  safetyAlerts: boolean;
  defaultRouteType: "safest" | "fastest";
  nightMode: "auto" | "on" | "off";
};

type AppState = {
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
  origin: LatLng | null;
  setOrigin: (v: LatLng | null) => void;
  destination: LatLng | null;
  setDestination: (v: LatLng | null) => void;
  destinationName: string;
  setDestinationName: (v: string) => void;
  routeData: SafetyScorerResponse | null;
  setRouteData: (v: SafetyScorerResponse | null) => void;
  selectedRoute: LumosRoute | null;
  setSelectedRoute: (v: LumosRoute | null) => void;
  isNavigating: boolean;
  setIsNavigating: (v: boolean) => void;
  sosActive: boolean;
  setSosActive: (v: boolean) => void;
  emergencyContacts: EmergencyContact[];
  setEmergencyContacts: (v: EmergencyContact[]) => void;
  savedPlaces: SavedPlace[];
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
};

const defaultContacts: EmergencyContact[] = [
  { id: "1", name: "Mom", phone: "+91 xxxxx" },
  { id: "2", name: "Rohan", phone: "+91 xxxxx" },
];

const defaultPlaces: SavedPlace[] = [
  { name: "Home", subtitle: "Kothrud, Pune", icon: "home", lat: 18.5074, lng: 73.8077 },
  { name: "Work", subtitle: "Hinjewadi Phase 1", icon: "briefcase", lat: 18.5912, lng: 73.7380 },
];

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [origin, setOrigin] = useState<LatLng | null>({ lat: 18.5913, lng: 73.7623 });
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [routeData, setRouteData] = useState<SafetyScorerResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<LumosRoute | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(defaultContacts);
  const [settings, setSettings] = useState<AppSettings>({
    guardianMode: true,
    autoSos: true,
    safetyAlerts: false,
    defaultRouteType: "safest",
    nightMode: "auto",
  });

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        hasOnboarded, setHasOnboarded,
        origin, setOrigin,
        destination, setDestination,
        destinationName, setDestinationName,
        routeData, setRouteData,
        selectedRoute, setSelectedRoute,
        isNavigating, setIsNavigating,
        sosActive, setSosActive,
        emergencyContacts, setEmergencyContacts,
        savedPlaces: defaultPlaces,
        settings, updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
