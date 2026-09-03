# MedNexus

> Hospital operations companion — bed-occupancy forecasting, pharmacy stock monitoring, and a searchable clinical case archive. Built with Expo and React Native.

MedNexus gives ward and pharmacy staff an at-a-glance view of hospital capacity and supply, plus a fast way to look up how similar past cases were treated.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · expo-router (typed routes) · TypeScript (strict) · react-native-gifted-charts · NativeWind / Tailwind

> ⚠️ **Demo data only.** Everything under [`src/data/`](src/data) is synthetic. MedNexus ships with no real patient information (PHI) and is not yet wired to a backend.

## Features

### 📊 Dashboard
- **Bed occupancy** — beds in use out of 200, utilization %, and a 14-day trend line.
- **48-hour forecast** — projects occupancy with a least-squares linear regression over recent days, shown with an up/down delta.
- **At-a-glance vitals** — ICU occupancy, ER visits, and the 14-day average.
- **Pharmacy stock** — per-medicine cards with current stock, estimated days until stockout, average daily use, and a critical / warning / adequate status.
- **Quick stats** — low-stock item count, admissions, and discharges for the day.

### 🔎 Clinical Memory
- **Search** past cases by symptom or tag, with live match highlighting.
- **Case cards** summarizing diagnosis, tags, symptoms, and outcome.
- **Detail view** (modal) with patient demographics, admission/discharge dates, symptoms, treatment, and outcome.

## Getting started

**Prerequisites:** a recent Node.js LTS (20+), npm, and either the [Expo Go](https://expo.dev/go) app on a device or an Android emulator / iOS simulator.

```bash
npm install      # install dependencies
npx expo start   # start the dev server
```

Then press `a` (Android), `i` (iOS), or `w` (web) in the terminal — or scan the QR code with Expo Go.

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Open on an Android emulator/device |
| `npm run ios` | Open on an iOS simulator |
| `npm run web` | Open in a web browser |
| `npm run lint` | Lint with `expo lint` |

## Project structure

```
src/
├── app/                        # expo-router routes (file-based)
│   ├── _layout.tsx             # root Stack
│   ├── index.tsx               # "/"  →  redirects to /dashboard
│   └── (tabs)/
│       ├── _layout.tsx         # bottom tab navigator
│       ├── dashboard.tsx       # Dashboard tab
│       └── clinical-memory.tsx # Clinical Memory tab
├── components/                 # shared UI (skeleton, themed text/view, collapsible…)
├── constants/theme.ts          # Colors (light + dark), Spacing, Fonts
├── data/                       # synthetic demo datasets (JSON)
├── hooks/                      # color-scheme / theme hooks
└── utils/                      # pure logic: predictions.ts, cases.ts
```

The entry route `/` redirects to the **Dashboard** tab; the two tabs are **Dashboard** and **Clinical Memory**.

## Data

All datasets are bundled JSON under [`src/data/`](src/data) and are **synthetic**:

| File | Contents |
| --- | --- |
| `admissions.json` | 14 days of daily metrics — admissions, discharges, occupancy, ICU occupancy, ER visits |
| `medicineStock.json` | Pharmacy inventory with recent monthly usage history and reorder points |
| `pastCases.json` | Example clinical cases — symptoms, diagnosis, treatment, outcome, tags |

Forecasting and stock logic live in [`src/utils/predictions.ts`](src/utils/predictions.ts); case search in [`src/utils/cases.ts`](src/utils/cases.ts). A production deployment would replace the static JSON with a live data source.

## Contributing

This project targets **Expo SDK 57 specifically** — APIs change between SDK versions, so check the [versioned docs](https://docs.expo.dev/versions/v57.0.0/) before writing code (see [`AGENTS.md`](AGENTS.md)).

- Branch off `main` and open a pull request.
- Run `npm run lint` before pushing.

## License

Currently the MIT license inherited from the Expo starter template — see [`LICENSE`](LICENSE). Review and update the copyright and terms before any public release.
