# Shagalka Daily Step Companion

Build a polished, mobile-first Russian-language fitness step counter web app named "Alex'step". This is the first working MVP/prototype and must be usable on an Android phone/tablet browser, with PWA-ready structure where practical.

PRODUCT & DESIGN
- Premium dark interface, near-black / deep charcoal surfaces, vivid violet-purple accent (#8B5CF6 or similar), subtle gradients, soft glow, rounded cards, clean typography, excellent spacing.
- Russian UI throughout. Brand text exactly "Alex'step".
- Make it feel like a refined native fitness app, not a generic dashboard. Mobile-first responsive layout; bottom navigation with Сегодня, История, Настройки.
- Accessible contrast, large touch targets, smooth but restrained animations, reduced-motion support.

CORE TODAY SCREEN
- Large circular progress ring showing today's steps against a configurable daily goal (default 8,000).
- Prominent step count, percentage, remaining steps, friendly motivational status.
- Secondary stats: distance in km and estimated calories, clearly marked as estimates.
- Activity visualization by hour with an attractive bar chart; show realistic empty/initial state and sample/demo data only when explicitly in demo mode.
- Goal completion celebration animation/message when the goal is reached, without being intrusive.
- Start/stop GPS walk session button and session status; explain GPS affects battery and requires location permission.

TRACKING / HONEST CAPABILITIES
- Implement a best-effort browser motion sensor step detection using DeviceMotionEvent where supported, with permission request on iOS-style browsers when needed. Use conservative peak/threshold detection and debounce to avoid counting every shake.
- Browser motion sensor tracking is not guaranteed to work in background or on every Android browser. Clearly explain this in Russian in onboarding/settings. Never claim guaranteed native Android step-counter accuracy.
- Add a clearly labeled "Демо-режим" toggle for preview/testing with simulated steps. Do not mix demo counts with real counts; provide reset.
- Persist settings and daily progress locally using localStorage, with safe guards.
- Provide manual step adjustment as fallback.
- GPS session: request browser geolocation permission, record location samples only while session is active, calculate approximate distance with haversine, show elapsed time and distance. Do not upload or transmit location. Handle denied permissions and unavailable GPS gracefully. Include a visible stop button.
- Daily rollover based on device local date; keep a small local history of recent days.
- Settings: daily goal, height/weight optional for estimates, haptic feedback toggle if supported, demo mode toggle, reset data with confirmation, privacy explanation.

IMPLEMENTATION
- Use the default Lovable stack, React + TypeScript + Tailwind + shadcn/ui as appropriate.
- Use Lucide icons. Keep components clean and maintainable.
- Do not require sign-in, backend, Supabase, paid APIs, or API keys. All data stays on device.
- Add sensible empty states, loading/permission/error states, and robust input validation.
- Ensure no dead buttons: all visible controls must work.
- Add a concise in-app "Как это работает" explanation and honest note that reliable background step counting / Android native Sensor.TYPE_STEP_COUNTER and APK packaging require a native Android wrapper/app later.
- Build the actual app now, not just a plan.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58af339e-530d-4a2c-b6dc-259f15ee03f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
