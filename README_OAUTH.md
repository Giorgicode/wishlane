# Google / Firebase OAuth setup (production-ready)

This document explains the exact steps to configure Google Sign-In for both web and native (Android/iOS) using Firebase and Expo. Follow the steps carefully — missing a step (SHA‑1, package name, or redirect URI) is the most common source of failures.

1) Firebase: enable Google sign-in
- Open Firebase Console → Authentication → Sign-in method → Enable Google.

2) Android: package & SHA‑1
- Set your package name in `app.json` (we use `com.datafusion.wishlane`).
- Obtain your SHA‑1 fingerprint(s): for local dev we created a debug SHA‑1 already. For production, use your release keystore or Play App Signing SHA‑1.
- In Firebase Console → Project settings → General → Your apps → Add app (Android) or edit existing Android app and paste the SHA‑1 fingerprint.

3) Google Cloud Console: create OAuth client IDs
- Go to Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID.
- Create three clients (recommended):
  - Web client ID (for browser): set Authorized JavaScript origins and Authorized redirect URIs as needed for your deployment.
  - Android client ID: choose Application type = Android; enter package name `com.datafusion.wishlane` and the SHA‑1 fingerprint.
  - iOS client ID: choose Application type = iOS; enter the bundle ID and other requested fields.

4) Redirect URIs and Expo
- For native apps using Expo AuthSession, the redirect URI is handled by AuthSession. During development with Expo Go, use the Expo proxy (recommended) which uses a hosted redirect like `https://auth.expo.io/@your-username/your-app-slug`.
- For production builds/dev clients, AuthSession uses your app scheme (configured by `expo.scheme` / `expo` `scheme` in app.json) or the URI created by `makeRedirectUri()`.

5) Add client IDs to your app environment
- Add the created client IDs to your environment variables (do not commit secrets):
  - EXPO_GOOGLE_WEB_CLIENT_ID
  - EXPO_GOOGLE_ANDROID_CLIENT_ID
  - EXPO_GOOGLE_IOS_CLIENT_ID
- You can use EAS secrets, CI variables, or a local `.env` (for local dev only). See `.env.example`.

6) Build a dev client or standalone app (recommended for native testing)
- Install EAS CLI: `npm i -g eas-cli`.
- Configure `eas.json` (we included a sample in the repo).
- Build a dev client: `eas build --profile development --platform android`.
- Install the dev client on your device and test.

7) Production notes
- Register release SHA‑1 (or Play App Signing SHA‑1) in Firebase before publishing to the Play Store.
- For iOS, ensure the correct bundle ID and Apple credentials are configured in EAS / App Store Connect.

8) Troubleshooting
- redirect_uri_mismatch: register the redirect URI in Google Cloud Console or use the Expo proxy in dev.
- DEVELOPER_ERROR / SIGN_IN_FAILED: usually an Android SHA‑1 / package mismatch. Double-check package name and fingerprint.
- invalid_client: using the wrong client ID for the platform.

If you want, I can generate exact copy-paste values for the Google Cloud Console forms (package name and SHA‑1 we created). After you create the Android OAuth client, copy the client ID into your environment and I’ll finish wiring the app.
