export type DayId = "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type StageId =
  | "apex"
  | "opus"
  | "avalanche"
  | "dogtooth"
  | "district-den"
  | "district-doghouse"
  | "district-ace-spades"
  | "district-outpost"
  | "rip-courtyard";

export type Intent = "interested" | "definite";

export type GroupMemberRole = "leader" | "admin" | "member";

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

export type ClashDecisionMap = Record<string, string>;

export type GroupClashVoteMap = Record<string, ClashDecisionMap>;

export type FreeTimeNoteMap = Record<string, string>;

export type GroupFreeTimeNoteMap = Record<string, FreeTimeNoteMap>;

export interface ProfilePlan {
  id: string;
  name: string;
  accountUsername?: string;
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions?: ClashDecisionMap;
  groupClashVotes?: ClashDecisionMap;
  groupCode?: string;
  freeTimeNotes?: FreeTimeNoteMap;
  groupFreeTimeNotes?: FreeTimeNoteMap;
  groupRole?: GroupMemberRole;
}

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
  clashDecisions?: ClashDecisionMap;
  groupClashVotes?: ClashDecisionMap;
  groupCode?: string;
  accountUsername?: string;
  freeTimeNotes?: FreeTimeNoteMap;
  groupFreeTimeNotes?: FreeTimeNoteMap;
  groupRole?: GroupMemberRole;
}

export interface AccountSession {
  userId: string;
  username: string;
  token: string;
}

export interface AccountPlan {
  version: 1;
  profileName: string;
  intents: IntentMap;
  imports: FestivalExport[];
  clashDecisions: ClashDecisionMap;
  groupClashVotesByCode: GroupClashVoteMap;
  freeTimeNotes: FreeTimeNoteMap;
  groupFreeTimeNotesByCode: GroupFreeTimeNoteMap;
  groupCode: string;
  groupCodes: string[];
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
