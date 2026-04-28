# DL-Clashfinder

A better version of Clash Finder for Download Festival 2026 planning.

## What It Does

- Browse the Friday to Sunday arena lineup by day and stage.
- Mark artists as interested or definite.
- Edit set times in `src/data/lineup.ts` and detect clashes.
- Export your plan as JSON and import friends' plans for comparison.
- Open an artist page for every act.
- View static Spotify embeds for each artist's top tracks.

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

## Spotify Tracks

Artist pages use static Spotify track IDs from `src/data/lineup.ts`, so visitors do not need to connect a Spotify account.

```ts
{
  name: "Limp Bizkit",
  start: "20:50",
  end: "22:30",
  spotifyTrackIds: ["5cZqsjVs6MevCnAkasbEOX"]
}
```

## GitHub Pages

This repo is configured to build under `/DL-Clashfinder/` by default.

```bash
npm run build
npm run deploy
```
