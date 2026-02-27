export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  RouteComparison: undefined;
  ActiveNavigation: undefined;
  SafetyCheck: undefined;
  SOS: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
