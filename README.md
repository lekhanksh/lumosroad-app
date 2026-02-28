# LumosRoad — Safety-First Night Navigation

LumosRoad is a safety-first navigation app designed for Pune, India. It helps users find the **safest route** for nighttime travel by scoring routes on lighting density, night luminosity, and area safety — powered by **Amazon Bedrock (Claude)** and **Google Routes API**.

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌──────────────────────┐
│   Expo Web App  │ ──────────────▶│  Amazon API Gateway  │
│  (AWS Amplify)  │                │  (REST, /score)      │
└─────────────────┘                └──────────┬───────────┘
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │    AWS Lambda         │
                                   │  (safety-scorer)      │
                                   └──────┬───────┬───────┘
                                          │       │
                              ┌───────────┘       └───────────┐
                              ▼                               ▼
                   ┌────────────────────┐          ┌────────────────────┐
                   │  Google Routes API │          │  Amazon Bedrock    │
                   │  (route polylines, │          │  (Claude 3.5       │
                   │   distance, ETA)   │          │   Sonnet)          │
                   └────────────────────┘          └────────────────────┘
```

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| **Amazon Bedrock (Claude 3.5 Sonnet)** | AI-powered safety explanation — analyzes route safety factors and explains *why* one route is safer in natural language |
| **AWS Lambda** | Runs the safety-scorer function: calls Google Routes API, computes safety factors, invokes Bedrock for AI explanation |
| **Amazon API Gateway** | Exposes the Lambda as a public HTTPS REST endpoint for the frontend |
| **AWS Amplify** | Hosts the Expo React Native web app with CI/CD from GitHub |

---

## Why AI (Amazon Bedrock) Is Required

Safety scoring is **not** a simple distance/time comparison. The AI layer adds critical value:

1. **Multi-factor reasoning** — Claude analyzes 3 normalized safety factors (lighting density, night luminosity, area safety index) across multiple routes simultaneously, weighing trade-offs that simple math cannot capture.

2. **Natural language explanations** — Instead of just showing a number, Claude generates human-readable rationale like *"Route A passes through well-lit commercial zones with higher foot traffic, while Route B cuts through dimly lit residential areas"*. This builds user trust in the safety recommendation.

3. **Contextual decision-making** — Claude considers the interplay between factors. A route with moderate lighting but high area safety may be preferable to one with good lighting but low area safety. The AI makes this nuanced judgment.

4. **Safest route selection** — Claude independently selects the safest route based on all factors, providing a second layer of validation beyond the computed Lumos Score.

### What the AI Returns

```json
{
  "safestRouteId": "route-0",
  "routes": [
    {
      "id": "route-0",
      "lumosScore": 87,
      "rationale": "This route follows well-lit main roads through commercial areas with higher pedestrian activity..."
    }
  ],
  "highLevelSummary": "Route 0 is recommended for nighttime travel due to superior lighting and area safety..."
}
```

---

## How It Works (End-to-End Flow)

1. **User enters destination** on the HomeScreen (Pune locations)
2. **App calls Lambda** via API Gateway with origin + destination coordinates
3. **Lambda calls Google Routes API** → gets 2–3 driving routes with encoded polylines
4. **Lambda computes safety factors** for each route (lighting, luminosity, area safety)
5. **Lambda calls Amazon Bedrock (Claude)** → AI analyzes all routes and returns:
   - Which route is safest
   - Why it's safer (natural language explanation)
   - Per-route rationale
6. **App displays routes on map** with safety scores, polylines, and AI explanation
7. **User starts navigation** on the safest (or chosen) route with live safety monitoring

---

## Project Structure

```
lumosroad/
├── lambda/                     # AWS Lambda safety-scorer
│   ├── src/
│   │   ├── index.ts           # Lambda entry point
│   │   ├── services/
│   │   │   └── safetyScorer.ts # Core logic: Google Routes + Bedrock
│   │   └── types/
│   │       └── navigation.ts   # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── lumosroad-app/              # Expo React Native app
│   ├── src/
│   │   ├── screens/           # 7 screens (Onboarding → SOS)
│   │   ├── components/        # CrossPlatformMap (native + web)
│   │   ├── context/           # AppContext (global state)
│   │   ├── hooks/             # useSafetyRoutes (Lambda + mock fallback)
│   │   ├── services/          # Mock API (offline fallback)
│   │   └── navigation/        # React Navigation stack
│   ├── scripts/
│   │   └── inject-phone-frame.js  # Post-build: phone UI wrapper for web
│   ├── app.config.js
│   └── package.json
│
└── README.md                   # This file
```

---

## Key App Screens

1. **Onboarding** — Location + notification permissions
2. **Home** — Search destinations, view Pune map with safety score
3. **Route Comparison** — Compare safest vs fastest route with AI explanation
4. **Active Navigation** — Live map with safety score, ETA, SOS button
5. **Safety Check** — Periodic check-in during navigation
6. **SOS** — Emergency activation with guardian alerts, call 112
7. **Settings** — Guardian mode, emergency contacts, preferences

---

## Tech Stack

- **Frontend**: Expo (React Native) + TypeScript, react-native-maps, React Navigation
- **Backend**: AWS Lambda (Node.js/TypeScript), Amazon Bedrock (Claude 3.5 Sonnet), Google Routes API
- **Hosting**: AWS Amplify (web), API Gateway (REST API)
- **Fallback**: Local mock API for offline/demo mode
