# Satark Drishti local frontend + camera

This folder is a standalone copy of the integrated Authority and Inspector
frontends, their separately maintained Inspector UI source, and the local
MediaMTX configuration. It runs the frontends and camera service on your
laptop while API data is served by the deployed Render backend and its
configured PostgreSQL database.

The frontend does **not** connect directly to PostgreSQL. Keep the Neon
`DATABASE_URL` only in the backend's Render environment settings.

## Requirements

- Windows, Node.js 22.12 or newer, and npm.
- The MediaMTX v1.21.1 Windows executable installed at
  `%LOCALAPPDATA%\SatarkDrishti\MediaMTX-v1.21.1\mediamtx.exe`, or set
  `MEDIA_MTX_PATH` to its full path.
- Larix Broadcaster on a phone connected to the same trusted Wi-Fi as the
  laptop.

## Connect to the Render API

From this folder, install dependencies and create a private local environment
file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local`. Set `API_ACCESS_TOKEN` to the Render service's
`API_ACCESS_TOKEN` value in the Render dashboard. Keep this value private;
`.env.local` is ignored by Git. `API_PROXY_TARGET` is set to the deployed API
URL by default and can be changed if your Render service has a different URL.
Do not add `DATABASE_URL` here.

The development server listens only on `127.0.0.1`. It adds the API bearer
token on the server side when proxying `/api` requests to Render; the token is
not included in the browser bundle. This is a **local development bridge**,
not production authentication. Do not expose the development server to your
LAN or deploy it. A future public/mobile client needs individual user
authentication rather than this shared development token.

## Run the frontend and camera together

```powershell
npm run start:local
```

Open `http://127.0.0.1:5173`. The development server requires a valid API token;
if it is missing or too short, it will stop with an explicit configuration
error. Press **Ctrl+C** to stop both services.

If the online database has not yet received your SQLite import, the frontend
will show only the data currently present in the deployed backend. A healthy
API status alone does not confirm that the import completed.

## Publish the phone camera over same Wi-Fi

Find the laptop's Wi-Fi IPv4 address with `ipconfig`. In Larix, set the RTMP
server/application to `rtmp://<LAPTOP-LAN-IP>:1935/live` and stream name/key
to `entrance`. The full URL is
`rtmp://<LAPTOP-LAN-IP>:1935/live/entrance`.
The Live Monitoring page also displays this publishing URL and explains where
to find the laptop's IP address.

Keep the phone and laptop on the same trusted Wi-Fi. Allow MediaMTX through
Windows Firewall on **Private networks only** if prompted. Live Monitoring in
the laptop's browser uses the local
`http://localhost:8889/live/entrance/whep` endpoint. This local demo stream has
no publisher authentication: do not port-forward the camera ports or use
private footage.

## Build the Android APK

The Android app packages the same React routes and UI in a Capacitor WebView.
Install Android Studio with Android SDK Platform 35 and a JDK, then from this
folder run:

```powershell
npm install
npm run android:apk
```

The native Android project is already included in `android/`; run `npx cap add
android` only if you intentionally remove and need to regenerate that folder.
The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`. Install it with Android
Studio or `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Set `VITE_ANDROID_API_BASE_URL` in `.env.android` if the API has a different
public URL; the checked-in `.env.android.example` shows the default. This
Android-specific variable keeps
the development proxy URL from `.env.local` out of the APK. Never place
`API_ACCESS_TOKEN` or database credentials in this file or inside the APK.

The APK calls the backend directly. Sign-in returns a user-specific bearer
token that expires after 12 hours; the shared API token is never embedded in
the app. Before distributing an updated app, deploy the matching backend
version and add `https://localhost` to the backend's `ALLOWED_ORIGINS` in
Render. Protected backend operations then use the signed-in user's token. The
camera WHEP endpoint should be configured in Live Monitoring as
`http://<LAPTOP-LAN-IP>:8889/live/entrance/whep`; Android's `localhost` refers
to the phone, not the laptop.

## Included project contents

- `src/`, `inspector-portal/src/`, `public/`, and `Assets/`: integrated
  Authority and Inspector app.
- `camera/mediamtx.yml`: local RTMP ingest, WHEP signaling, and WebRTC media
  configuration.
- `scripts/start-local.mjs`: starts Vite and MediaMTX together without starting
  another local API or database.
- `android/`: Capacitor Android project created by `npx cap add android`.
