import React, { useRef, useEffect } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

/* ── Web implementation ── */
const WebMap: React.FC<CrossPlatformMapProps> = ({
  style,
  initialRegion,
  originCoord,
  destinationCoord,
  polylines,
}) => {
  const lat = initialRegion?.latitude ?? 18.53;
  const lng = initialRegion?.longitude ?? 73.85;
  const zoom = initialRegion?.latitudeDelta
    ? Math.max(10, Math.min(16, Math.round(14 - Math.log2(initialRegion.latitudeDelta))))
    : 13;

  // If origin+dest, show directions embed
  if (originCoord && destinationCoord) {
    const oStr = `${originCoord.lat},${originCoord.lng}`;
    const dStr = `${destinationCoord.lat},${destinationCoord.lng}`;
    const src = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${oStr}&destination=${dStr}&mode=driving`;
    return (
      <View style={[st.container, style]}>
        {/* @ts-ignore iframe works on web */}
        <iframe
          src={src}
          style={{ width: "100%", height: "100%", border: 0, borderRadius: 18 }}
          allowFullScreen
          loading="lazy"
        />
      </View>
    );
  }

  // Static overview
  return (
    <View style={[st.container, style]}>
      {/* @ts-ignore */}
      <iframe
        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=${zoom}&maptype=roadmap`}
        style={{ width: "100%", height: "100%", border: 0, borderRadius: 18 }}
        allowFullScreen
        loading="lazy"
      />
    </View>
  );
};

/* ── Native implementation ── */
let NativeMap: React.FC<CrossPlatformMapProps> | null = null;

if (Platform.OS !== "web") {
  // Dynamic require so bundler doesn't try to resolve on web
  const RNMaps = require("react-native-maps");
  const MapView = RNMaps.default;
  const Marker = RNMaps.Marker;
  const Polyline = RNMaps.Polyline;
  const PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;

  NativeMap = ({
    style,
    initialRegion,
    showsUserLocation,
    markers,
    polylines,
    fitToCoordinates: shouldFit,
    onLayout,
  }) => {
    const mapRef = useRef<any>(null);

    useEffect(() => {
      if (!shouldFit || !mapRef.current) return;
      const allCoords: Coord[] = [];
      polylines?.forEach((p) => allCoords.push(...p.coordinates));
      markers?.forEach((m) => allCoords.push(m.coordinate));
      if (allCoords.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }, [polylines, markers, shouldFit]);

    return (
      <MapView
        ref={mapRef}
        style={[{ flex: 1 }, style]}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        onLayout={onLayout}
      >
        {markers?.map((m, i) => (
          <Marker
            key={`marker-${i}`}
            coordinate={m.coordinate}
            title={m.title}
            pinColor={m.pinColor}
          />
        ))}
        {polylines?.map((p) => (
          <Polyline
            key={p.id}
            coordinates={p.coordinates}
            strokeColor={p.color}
            strokeWidth={p.width}
            lineDashPattern={p.dashed ? [8, 6] : undefined}
          />
        ))}
      </MapView>
    );
  };
}

/* ── Exported component ── */
export const CrossPlatformMap: React.FC<CrossPlatformMapProps> = (props) => {
  if (Platform.OS === "web") {
    return <WebMap {...props} />;
  }
  if (NativeMap) {
    return <NativeMap {...props} />;
  }
  return (
    <View style={[st.container, props.style]}>
      <Ionicons name="map" size={48} color="#94A3B8" />
      <Text style={st.label}>Map unavailable</Text>
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
  label: { fontSize: 13, color: "#94A3B8", marginTop: 6 },
});
