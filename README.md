# Signage — MOBILE

**TheSignCo Field** — the Android app for TheSignCo's field staff. Part of
the [WingTheIdea](https://github.com/Admin-Mobil80) group, alongside
[SIGNAGE-PORTAL](https://github.com/Admin-Mobil80/SIGNAGE-PORTAL) (office,
clients and outlets) and [SIGNAGE-BACKEND](https://github.com/Admin-Mobil80/SIGNAGE-BACKEND).

| Who | Does |
| --- | --- |
| Recce executives | See the day's visits in route order; confirm location by GPS; measure the mounting spot; take the required photos and a walk-around video; record the owner's agreement |
| Installation leads | Before photos; fix and run the safety checks; after photos; outlet signs off with a six-digit code texted to their phone. Repair visits on live signs follow the same flow |

Visits are saved on the phone first and upload when there is signal.
Sign-in is the house standard: email, then a six-digit code.

> **Current state: UI prototype.** Jobs are sample data (`src/data.ts`) for
> the Amaron South India pilot and the Dewar's Bengaluru job. Any six digits
> sign in; the profile screen has an "Online" switch to see visits queue
> without signal. Camera and GPS are real on a phone.

## Stack

Expo SDK 58, React Native 0.88, TypeScript. `expo-image-picker` for photos
and video, `expo-location` for GPS. A small hand-rolled stack navigator in
`App.tsx` with Android back-button support.

```bash
npm ci
npm run web       # browser preview at http://localhost:8081 (no camera)
npm test          # typecheck
```

## Release

**One branch, `main`.** Every push to `main` runs
`.github/workflows/android.yml`: typecheck, generate the Android project from
`app.json`, build the release APK, and publish it as a GitHub Release
(`v<version>-build.<n>`). Staff install from the latest release — the
portal's `/field` page links to it. Bump `expo.version` in `app.json` for a
new version number.

The APK is signed with Expo's template debug key (same on every build, so
updates install over the old app). Before a Play Store listing, add a release
keystore as repository secrets and sign with that.
