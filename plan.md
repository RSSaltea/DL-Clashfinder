# Plan: Download Festival Clash Finder (GitHub Pages)

## TL;DR
Build a mobile-first React + TypeScript GitHub Pages app where users can browse the Download Festival 2026 lineup, favorite bands, identify scheduling clashes, explore artist pages with Spotify integration, and export/import favorites as JSON to compare with friends and detect conflicts.

---

## Steps

### Phase 1: Project Setup & Data Structure
1. Initialize React + TypeScript project with Vite (fast builds, great for GitHub Pages)
2. Configure GitHub Pages deployment with gh-pages package
3. Extract festival lineup from image and create `data/lineup.ts` with structure:
   - Festival data: stages (Apex, Opus, Avalanche, Dogtooth)
   - Days: Fri 12 Jun, Sat 13 Jun, Sun 14 Jun
   - Artists: stage, day, start time, end time (user-editable), link to artist page
4. Create TypeScript types for: Artist, Stage, Day, Favorite, Export
5. Set up localStorage management utilities

### Phase 2: Lineup Browser & Favorites System
6. Create main LineupView component displaying all artists by stage + day
7. Implement favorite/unfavorite toggle (persist to localStorage)
8. Add filters: by day, by stage, by favorite status
9. Responsive grid/list layout (mobile-first)
10. Manually input set times (user enters start/end for each artist) — save to localStorage or session state

### Phase 3: Clash Detection Engine
11. Create clash detection utility that identifies artists playing simultaneously
12. Visual indicators on lineup (e.g., "Clashes with: [X other artists]")
13. Create ClashView showing conflicts at specific times
14. In lineup: highlight clashed favorites with warning badges

### Phase 4: Artist Detail Pages & Spotify Integration
15. Individual artist page route with React Router
16. Fetch Spotify API (use web API without auth for public top tracks):
    - Search for artist by name
    - Get top 5-10 tracks
    - Display with preview links (clickable to Spotify app/web)
    - Optional: embed Spotify player iframe
17. Show artist details: stage, times, set slots, bio (from Spotify)
18. Add "Add to Favorites" button on detail page

### Phase 5: Export/Import & Comparison
19. Create export function: converts favorites + set times to JSON
20. Create import function: file upload to parse JSON
21. Build ComparisonView component:
    - Load both user's favorites and imported file
    - Show side-by-side comparison
    - Highlight mutual favorites (both want to see)
    - Highlight clashes in imported file
    - Suggest compromises ("You both like X, but Y clashes for your friend")

### Phase 6: Polish & Deployment
22. Responsive mobile testing across screen sizes
23. Add visual theme matching Download Festival branding (from image: red/orange lava theme)
24. Error handling (Spotify API failures, invalid JSON imports)
25. Build and deploy to GitHub Pages

---

## Relevant Files (to be created)

### Core Structure
- `src/types/index.ts` — TypeScript interfaces (Artist, Favorite, Export, Stage, etc.)
- `src/data/lineup.ts` — Festival lineup with all stages and artists
- `src/utils/localStorage.ts` — Favorite and set time persistence
- `src/utils/clash.ts` — Clash detection logic
- `src/utils/spotify.ts` — Spotify API integration

### Components
- `src/components/LineupView.tsx` — Main browser showing all artists by stage/day
- `src/components/ArtistCard.tsx` — Individual artist card with favorite toggle
- `src/components/ArtistDetailPage.tsx` — Full page with Spotify player
- `src/components/ClashView.tsx` — View showing all time conflicts
- `src/components/ComparisonView.tsx` — Compare two exports
- `src/components/SetTimeInput.tsx` — Dialog to manually enter start/end times

### Routes & Pages
- `src/pages/Home.tsx` — Main entry with lineup
- `src/pages/ArtistDetail.tsx` — Dynamic artist page (/artist/:id)
- `src/pages/Clashes.tsx` — Clash browser
- `src/pages/Compare.tsx` — Comparison tool

### Utilities & Config
- `src/App.tsx` — Main app with React Router
- `src/utils/export.ts` — Export to JSON
- `src/utils/import.ts` — Import from JSON
- `vite.config.ts` — Configured for GitHub Pages
- `package.json` — Dependencies + gh-pages deploy script

---

## Verification

1. **Data Loading**: Verify all 100+ artists from image are in lineup.ts with correct stages and days
2. **Favorites**: Create favorites, refresh page, verify they persist using browser DevTools storage
3. **Clash Detection**: Set overlapping times for 2 artists, verify clash warning appears
4. **Artist Page**: Click artist → verify page loads, Spotify search works, top tracks display
5. **Export/Import**: Export favorites, import the file in a fresh state, verify data matches
6. **Comparison**: Load two exports, verify mutual favorites and clashes highlight correctly
7. **Mobile Responsiveness**: Test on mobile viewport (375px+), verify touch interactions work
8. **GitHub Pages Deploy**: Push to gh-pages branch, verify live on `<username>.github.io/download-clash-finder`

---

## Decisions

- **Framework**: React + TypeScript (type safety, modular components, ecosystem support)
- **Spotify**: Free Web API (no server needed, no authentication required for public data)
- **Storage**: localStorage for favorites + set times (no backend, pure client-side)
- **Export Format**: JSON (human-readable, easy to version control or share)
- **Clash Definition**: Any overlap in start/end times = clash (even partial)
- **Comparison Scope**: File upload (not real-time URL sharing) for simplicity and privacy

---

## Further Considerations

1. **Set Times Entry UX** — Once you manually add times for all artists, should times be locked (read-only) or editable per-session? 
   - *Recommendation*: Editable per-session, but default to stored times. Users might want different start times based on travel, setup, etc.

2. **Spotify API Rate Limiting** — Free Spotify API has rate limits. Should we cache results locally?
   - *Recommendation*: Cache artist search results in localStorage to reduce API calls.

3. **Mobile Clash Warnings** — On mobile, side-by-side layouts can be cramped. Should clashes show in a modal or stacked view?
   - *Recommendation*: Modal on mobile, side-by-side on desktop (media queries).