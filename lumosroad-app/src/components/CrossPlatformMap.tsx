import React, { useRef, useEffect } from "react";
import { Platform, View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

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

export const CrossPlatformMap: React.FC<CrossPlatformMapProps> = ({
  style,
  initialRegion,
  showsUserLocation,
  markers,
  polylines,
  fitToCoordinates: shouldFit,
  onLayout,
}) => {
  const mapRef = useRef<MapView>(null);

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

const st = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
});
