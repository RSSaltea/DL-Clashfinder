# DL-Clashfinder

A better version of Clash Finder for Download Festival 2026 planning.

## What It Does

- Browse the Friday to Sunday arena lineup by day and stage.
- Mark artists as interested or definite.
- Edit set times in `src/data/lineup.ts` and detect clashes.
- Sync everyone in the same group code through Supabase, without import/export.
- Export/import JSON as an optional backup.
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

## Group Code Sync

GitHub Pages can show the app, but it cannot store everyone's plans by itself. Group codes sync through a small Supabase table.

Create a Supabase project, open the SQL editor, and run:

```sql
create table if not exists public.group_plans (
  group_code text not null,
  member_id text not null,
  profile_name text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (group_code, member_id)
);

alter table public.group_plans enable row level security;

create policy "read group plans"
on public.group_plans for select
using (true);

create policy "insert group plans"
on public.group_plans for insert
with check (true);

create policy "update group plans"
on public.group_plans for update
using (true)
with check (true);
```

Then add these to your production env before building:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Anyone using the same group code, for example `raffo-crew`, will appear in Compare and Group Itinerary automatically. No JSON import/export is needed once Supabase is configured. Group codes are for convenience, not privacy, so only share codes with people you trust.

## GitHub Pages

This repo is configured to build under `/DL-Clashfinder/` by default.

```bash
npm run build
npm run deploy
```
