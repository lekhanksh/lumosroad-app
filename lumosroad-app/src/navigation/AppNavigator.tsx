import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "./types";

import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { RouteComparisonScreen } from "../screens/RouteComparisonScreen";
import { ActiveNavigationScreen } from "../screens/ActiveNavigationScreen";
import { SOSScreen } from "../screens/SOSScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { hasOnboarded } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        {!hasOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RouteComparison" component={RouteComparisonScreen} />
            <Stack.Screen name="ActiveNavigation" component={ActiveNavigationScreen} />
            <Stack.Screen name="SOS" component={SOSScreen} options={{ animation: "fade" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
