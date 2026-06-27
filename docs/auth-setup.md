# Fintra Auth Setup Checklist

This document separates external console setup from app code. Do not commit provider secrets.

## Current Auth Structure

- The app uses Supabase Auth through `@supabase/supabase-js`.
- Email/password and Google OAuth are already wired in `src/pages/auth/Login.tsx`.
- Apple OAuth is wired in code with `supabase.auth.signInWithOAuth({ provider: 'apple' })`.
- Passkeys are behind `VITE_ENABLE_PASSKEYS`; keep it `false` until Supabase Passkeys and a compatible client version are ready.

## Apple Sign In

Required external setup:

- Apple Developer account with Sign in with Apple enabled.
- App ID or Services ID for the web client.
- Apple private key for Sign in with Apple.
- Supabase Dashboard > Authentication > Providers > Apple enabled.
- Configure the Apple client ID and secret/key material in Supabase, not in this repo.
- Add the app URL to Supabase Auth URL settings:
  - Local: `http://localhost:5173`
  - Production site URL: your deployed Fintra URL
  - Redirect/callback target used by the app: `${origin}/dashboard`
- Confirm the Supabase OAuth callback URL required by the provider in the Supabase dashboard and add it in Apple Developer settings.

Code behavior:

- Login calls `supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${origin}/dashboard` } })`.
- No Apple secret is required in the frontend.

## Passkeys / Biometric Authentication

Web/PWA scope:

- Browser biometrics should be implemented through WebAuthn/Passkeys.
- Face ID / Touch ID direct native APIs require a native wrapper such as Capacitor or a platform app shell.
- WebAuthn requires a secure context: HTTPS in production or localhost in development.

Required external/setup work:

- Use a Supabase JS client version that supports Passkeys.
- Enable Supabase Auth Passkeys/WebAuthn for the project.
- Set `VITE_ENABLE_PASSKEYS=true` only after the provider is enabled and tested.
- Test on target devices: iOS Safari/PWA, Android Chrome/PWA, desktop Chrome/Safari.

Current code behavior:

- Login can call Passkey sign-in when `VITE_ENABLE_PASSKEYS=true`.
- Settings can register a device passkey after the user is signed in.
- If Passkeys are disabled or unavailable, the app shows an explanatory message instead of running an unsafe fallback.

## Legal Documents

- `/privacy` and `/terms` are product drafts.
- Settings links to both documents.
- The in-app copy clearly marks both as draft copy requiring legal review before production.
