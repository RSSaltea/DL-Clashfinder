# DL-Clashfinder

A better version of Clash Finder for Download Festival 2026 planning.

## What It Does

- Browse the Friday to Sunday arena lineup by day and stage.
- Mark artists as interested or definite.
- Edit set times in `src/data/lineup.ts` and detect clashes.
- Export your plan as JSON and import friends' plans for comparison.
- Open an artist page for every act.
- Connect Spotify with PKCE to search artists and show their top tracks.

## Run Locally

```bash
npm install
npm run dev
```

## Set Times

Edit set times in `src/data/lineup.ts`. Change an artist string into an object:

```ts
"Limp Bizkit",
```

```ts
{ name: "Limp Bizkit", start: "20:50", end: "22:20" },
```

## Spotify Setup

Spotify Web API calls need a public client ID. This app uses Spotify's PKCE login flow, so do not add a client secret to the frontend.

1. Go to the Spotify Developer Dashboard and create an app.
2. Copy the app's Client ID.
3. In the Spotify app settings, add these redirect URIs:

```text
https://rssaltea.github.io/DL-Clashfinder/
http://127.0.0.1:5173/
```

4. Copy `.env.example` to `.env.local` and set:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

Restart `npm run dev` after changing `.env.local`.

If Spotify starts the app in Development Mode, only allowlisted Spotify users can connect until the app has extended quota access.

## GitHub Pages

This repo is configured to build under `/DL-Clashfinder/` by default.

```bash
npm run build
npm run deploy
```
