export type DayId = "friday" | "saturday" | "sunday";

export type StageId = "apex" | "opus" | "avalanche" | "dogtooth";

export type Intent = "interested" | "definite";

export interface FestivalDay {
  id: DayId;
  label: string;
  shortLabel: string;
  date: string;
}

export interface FestivalStage {
  id: StageId;
  name: string;
  shortName: string;
}

export interface Artist {
  id: string;
  name: string;
  day: DayId;
  stage: StageId;
  order: number;
  defaultStart?: string;
  defaultEnd?: string;
  spotifyArtistId?: string;
  spotifyTrackIds?: string[];
}

export interface ArtistSetTime {
  start?: string;
  end?: string;
}

export type IntentMap = Record<string, Intent>;

export type SetTimeMap = Record<string, ArtistSetTime>;

export interface FestivalExport {
  version: 1;
  exportedAt: string;
  festival: {
    name: string;
    year: number;
  };
  profileName: string;
  intents: IntentMap;
  setTimes: SetTimeMap;
}

export interface ClashPair {
  id: string;
  day: DayId;
  first: Artist;
  second: Artist;
  start: string;
  end: string;
}

export interface TightGapPair {
  id: string;
  day: DayId;
  first: Artist;
  second: Artist;
  minutes: number;
  betweenStart: string;
  betweenEnd: string;
}

export interface ArtistTightGap {
  artist: Artist;
  minutes: number;
  position: "before" | "after";
}

export interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl?: string;
  spotifyUrl: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: string;
  popularity: number;
  previewUrl?: string;
  spotifyUrl: string;
  imageUrl?: string;
}

export interface SpotifyArtistBundle {
  artist: SpotifyArtist;
  tracks: SpotifyTrack[];
  fetchedAt: string;
}
