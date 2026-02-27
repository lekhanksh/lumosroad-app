# LumosRoad (Expo + React Native)

Safety-first navigation UI prototype built with Expo and React Native.

## Features

- **Dark theme**: Deep, muted dark palette with soft contrast.
- **MapView**: Uses `react-native-maps` with a custom dark map style.
- **Route comparison**:
  - **Fastest** route (12 mins, cool blue).
  - **Safest** route (18 mins, highlighted in orange and slightly thicker).
- **Guardian Mode**:
  - Toggle in the header.
  - When active, shows a **Safety Score** (0–100) card at the top.
- **SOS button**:
  - Prominent red circular button.
  - Triggers a mock `Alert` to simulate contacting guardians / services.

## Getting started

1. **Install dependencies**

   ```bash
   cd lumosroad-app
   npm install
   ```

   If you prefer Yarn or pnpm:

   ```bash
   yarn
   # or
   pnpm install
   ```

2. **Install Expo CLI globally (if needed)**

   ```bash
   npm install -g expo-cli
   ```

3. **Start the app**

   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on device or simulator**

- **iOS**: press `i` in the Expo dev tools or run in Xcode simulator.
- **Android**: press `a` or use an attached device / emulator.

## Notes

- The coordinates and routes are mock data centered near San Francisco and just illustrate the **Fastest vs Safest** visual.
- The **Safety Score** is a static placeholder (92) to show how Guardian Mode surfaces extra context.
- The **SOS** action is currently a simple `Alert`—wire this up to your backend / emergency flow as you implement the real logic.
