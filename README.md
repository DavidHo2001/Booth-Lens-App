# BoothLens App

React Native client for BoothLens, a trade-show booth estimation app. The app talks to the Spring Boot API in [BoothLens-Backend](https://github.com/DavidHo2001/BoothLens-Backend), which runs vision-LLM analysis and returns a structured booth estimate.

This project did not reach production, and work stopped in May 2026.

## Stack

- React Native and TypeScript
- API base URL is set in `src/config/env.ts`

## Run

```sh
npm install
npm start
```

Then `npm run android` or `npm run ios` (iOS needs CocoaPods).
