import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Coord = { latitude: number; longitude: number };

type Props = {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  coordinates?: Coord[];
  originCoord?: Coord | null;
  destinationCoord?: Coord | null;
  originLabel?: string;
  destinationLabel?: string;
  safestCoordinates?: Coord[];
  fastestCoordinates?: Coord[];
  markers?: { coord: Coord; title: string; color?: string }[];
  children?: React.ReactNode;
};

const MapViewWeb: React.FC<Props> = ({
  style,
  initialRegion,
  coordinates,
  originCoord,
  destinationCoord,
  safestCoordinates,
  fastestCoordinates,
}) => {
  const lat = initialRegion?.latitude ?? 18.53;
  const lng = initialRegion?.longitude ?? 73.85;
  const zoom = initialRegion?.latitudeDelta
    ? Math.round(14 - Math.log2(initialRegion.latitudeDelta))
    : 13;

  // Build a static Google Maps embed URL showing the route
  let mapSrc = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;

  // If we have origin + destination, use directions mode
  if (originCoord && destinationCoord) {
    const oStr = `${originCoord.latitude},${originCoord.longitude}`;
    const dStr = `${destinationCoord.latitude},${destinationCoord.longitude}`;
    mapSrc = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${oStr}&destination=${dStr}&mode=driving`;
  }

  // Draw polyline via static maps if we have coords
  const allCoords = safestCoordinates ?? fastestCoordinates ?? coordinates ?? [];
  if (allCoords.length > 1 && !originCoord) {
    const path = allCoords
      .filter((_, i) => i % 3 === 0 || i === allCoords.length - 1)
      .map((c) => `${c.latitude},${c.longitude}`)
      .join("|");
    const center = allCoords[Math.floor(allCoords.length / 2)];
    mapSrc = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=600x300&maptype=roadmap&path=color:0x6C63FF|weight:4|${path}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
  }

  return (
    <View style={[st.container, style]}>
      {/* @ts-ignore - iframe works on web */}
      {originCoord && destinationCoord ? (
        <iframe
          src={mapSrc}
          style={{ width: "100%", height: "100%", border: 0, borderRadius: 20 }}
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <View style={st.fallback}>
          <Ionicons name="map" size={48} color="#94A3B8" />
          <Text style={st.label}>Pune, Maharashtra</Text>
        </View>
      )}
    </View>
  );
};

const st = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, color: "#94A3B8", marginTop: 6 },
});

export default MapViewWeb;
