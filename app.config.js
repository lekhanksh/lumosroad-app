export default {
  expo: {
    name: "LumosRoad",
    slug: "lumosroad",
    userInterfaceStyle: "light",
    extra: {
      EXPO_PUBLIC_SAFETY_API_BASE_URL:
        process.env.EXPO_PUBLIC_SAFETY_API_BASE_URL ??
        "https://XXXX.execute-api.us-east-1.amazonaws.com/prod",
    },
    ios: {
      config: {
        googleMapsApiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "YOUR_GOOGLE_API_KEY_HERE",
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "YOUR_GOOGLE_API_KEY_HERE",
        },
      },
    },
  },
};

