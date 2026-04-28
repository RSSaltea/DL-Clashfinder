# DL-Clashfinder

A better version of Clash Finder for Download Festival 2026 planning.

## What It Does

- Browse the Friday to Sunday arena lineup by day and stage.
- Mark artists as interested or definite.
- Manually enter set times and detect clashes.
- Export your plan as JSON and import friends' plans for comparison.
- Open an artist page for every act.
- Connect Spotify with PKCE to search artists and show their top tracks.
- Pull artist logos/artwork from TheAudioDB where available.

## Run Locally

```bash
npm install
npm run dev
```

## Spotify Setup

Spotify Web API calls need a public client ID. Create a Spotify app, add your GitHub Pages URL and local URL as redirect URIs, then set:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

Use `http://127.0.0.1:5173/` as the local redirect URI while developing.

## Artwork

Artist logos are looked up from TheAudioDB at runtime and cached in localStorage. The Download Festival logo is included from Wikimedia Commons.

## GitHub Pages

This repo is configured to build under `/DL-Clashfinder/` by default.

```bash
npm run build
npm run deploy
```
