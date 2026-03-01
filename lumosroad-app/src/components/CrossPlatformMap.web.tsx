import React from "react";
import { View, StyleSheet } from "react-native";

type Coord = { latitude: number; longitude: number };

export type CrossPlatformMapProps = {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  originCoord?: { lat: number; lng: number } | null;
  destinationCoord?: { lat: number; lng: number } | null;
  originLabel?: string;
  destinationLabel?: string;
  polylines?: {
    coordinates: Coord[];
    color: string;
    width: number;
    dashed?: boolean;
    id: string;
  }[];
  markers?: {
    coordinate: Coord;
    title: string;
    pinColor?: string;
  }[];
  fitToCoordinates?: boolean;
  onLayout?: () => void;
};

const GMAPS_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

export const CrossPlatformMap: React.FC<CrossPlatformMapProps> = ({
  style,
  initialRegion,
  originCoord,
  destinationCoord,
}) => {
  const lat = initialRegion?.latitude ?? 18.5913;
  const lng = initialRegion?.longitude ?? 73.7623;
  const zoom = initialRegion?.latitudeDelta
    ? Math.max(10, Math.min(16, Math.round(14 - Math.log2(initialRegion.latitudeDelta))))
    : 13;

  let src: string;

  if (originCoord && destinationCoord) {
    const oStr = `${originCoord.lat},${originCoord.lng}`;
    const dStr = `${destinationCoord.lat},${destinationCoord.lng}`;
    src = `https://www.google.com/maps/embed/v1/directions?key=${GMAPS_KEY}&origin=${oStr}&destination=${dStr}&mode=driving`;
  } else {
    src = `https://www.google.com/maps/embed/v1/view?key=${GMAPS_KEY}&center=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;
  }

  return (
    <View style={[st.container, style]}>
      {/* @ts-ignore iframe is valid on web */}
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: 0, borderRadius: 18 }}
        allowFullScreen
        loading="lazy"
      />
    </View>
  );
};

const st = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
});
