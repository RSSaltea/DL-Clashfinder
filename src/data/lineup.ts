import type { Artist, DayId, FestivalDay, FestivalStage, StageId } from "../types";

export const festival = {
  name: "Download Festival",
  year: 2026,
  location: "Donington Park",
  sourceUrl: "https://downloadfestival.co.uk/lineup/",
};

export const festivalDays: FestivalDay[] = [
  { id: "friday", label: "Friday 12 June", shortLabel: "Fri", date: "2026-06-12" },
  { id: "saturday", label: "Saturday 13 June", shortLabel: "Sat", date: "2026-06-13" },
  { id: "sunday", label: "Sunday 14 June", shortLabel: "Sun", date: "2026-06-14" },
];

export const festivalStages: FestivalStage[] = [
  { id: "apex", name: "Apex Stage", shortName: "Apex" },
  { id: "opus", name: "Opus Stage", shortName: "Opus" },
  { id: "avalanche", name: "The Avalanche Stage", shortName: "Avalanche" },
  { id: "dogtooth", name: "The Dogtooth Stage", shortName: "Dogtooth" },
];

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u00f8\u00d8]/g, "o")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

type LineupArtistInput =
  | string
  | {
      name: string;
      start?: string;
      end?: string;
      spotifyArtistId?: string;
    };

// Edit set times here. Example:
// "Limp Bizkit",
// becomes:
// { name: "Limp Bizkit", start: "20:50", end: "22:20" },
const addArtists = (
  day: DayId,
  stage: StageId,
  entries: LineupArtistInput[],
  startOrder: number,
): Artist[] =>
  entries.map((entry, index) => {
    const details = typeof entry === "string" ? { name: entry } : entry;

    return {
      id: `${day}-${stage}-${slugify(details.name)}`,
      name: details.name,
      day,
      stage,
      order: startOrder + index,
      defaultStart: details.start ?? "",
      defaultEnd: details.end ?? "",
      spotifyArtistId: details.spotifyArtistId,
    };
  });

export const lineup: Artist[] = [
  ...addArtists("friday", "apex", [
    { name: "Limp Bizkit", start: "20:50", end: "22:30" },
    { name: "Cypress Hill", start: "19:00", end: "20:10" },
    { name: "Electric Callboy", start: "17:30", end: "18:30" },
    { name: "Pendulum", start: "16:10", end: "17:00" },
    { name: "Hollywood Undead", start: "15:00", end: "15:40" },
    { name: "P.O.D.", start: "14:00", end: "14:30" },
    { name: "Scene Queen", start: "13:00", end: "13:30" },
  ], 100),
  ...addArtists("saturday", "apex", [
    { name: "Guns N' Roses", start: "19:35", end: "22:55" },
    { name: "Trivium", start: "17:20", end: "18:30" },
    { name: "BABYMETAL", start: "15:50", end: "16:45" },
    { name: "Black Veil Brides", start: "14:30", end: "15:20" },
    { name: "LANDMVRKS", start: "13:15", end: "14:00" },
    { name: "South Arcade", start: "12:05", end: "12:45" },
    { name: "Thornhill", start: "11:00", end: "11:35" },
  ], 200),
  ...addArtists("sunday", "apex", [
    { name: "Linkin Park", start: "21:25", end: "22:55" },
    { name: "Bad Omens", start: "19:00", end: "20:10" },
    { name: "Ice Nine Kills", start: "17:05", end: "18:05" },
    { name: "The Pretty Reckless", start: "15:40", end: "16:30" },
    { name: "Bloodywood", start: "14:25", end: "15:10" },
    { name: "RØRY", start: "13:10", end: "13:55" },
    { name: "Kublai Khan TX", start: "12:00", end: "12:40" },
    { name: "unpeople", start: "11:00", end: "11:30" },
  ], 300),
  ...addArtists("friday", "opus", [
    { name: "Halestorm", start: "19:35", end: "20:50" },
    { name: "Daughtry", start: "18:15", end: "19:05" },
    { name: "Periphery", start: "17:00", end: "17:45" },
    { name: "Creeper", start: "15:50", end: "16:30" },
    { name: "Paleface Swiss", start: "14:55", end: "15:25" },
    { name: "Silent Planet", start: "13:50", end: "14:30" },
    { name: "Caskets", start: "13:00", end: "13:25" },
  ], 400),
  ...addArtists("saturday", "opus", [
    { name: "Architects", start: "19:35", end: "20:50" },
    { name: "Behemoth", start: "18:10", end: "19:00" },
    { name: "Bush", start: "17:00", end: "17:40" },
    { name: "Set It Off", start: "15:50", end: "16:30" },
    { name: "Those Damn Crows", start: "14:45", end: "15:25" },
    { name: "We Came As Romans", start: "13:40", end: "14:15" },
    { name: "Drowning Pool", start: "12:45", end: "13:15" },
    { name: "Snot", start: "11:55", end: "12:20" },
    { name: "The Wildhearts", start: "11:00", end: "11:30" },
  ], 500),
  ...addArtists("sunday", "opus", [
    { name: "A Day To Remember", start: "20:10", end: "21:20" },
    { name: "Mastodon", start: "18:45", end: "19:30" },
    { name: "Tom Morello", start: "17:35", end: "18:15" },
    { name: "Social Distortion", start: "16:25", end: "17:05" },
    { name: "The Plot In You", start: "15:30", end: "16:00" },
    { name: "thrown", start: "14:35", end: "15:05" },
    { name: "Dogstar", start: "13:40", end: "14:10" },
    { name: "Mammoth", start: "12:40", end: "13:15" },
    { name: "Catch Your Breath", start: "11:50", end: "12:15" },
    { name: "Ego Kill Talent", start: "11:00", end: "11:25" },
  ], 600),
  ...addArtists("friday", "avalanche", [
    { name: "Feeder", start: "19:55", end: "20:55" },
    { name: "Story Of The Year", start: "18:55", end: "19:25" },
    { name: "Sleep Theory", start: "18:00", end: "18:30" },
    { name: "Rain City Drive", start: "17:10", end: "17:35" },
    { name: "DRAIN", start: "16:20", end: "16:45" },
    { name: "Lakeview", start: "15:30", end: "15:55" },
    { name: "Holywatr", start: "14:40", end: "15:05" },
    { name: "Silly Goose", start: "13:50", end: "14:15" },
    { name: "Native James", start: "13:00", end: "13:25" },
  ], 700),
  ...addArtists("saturday", "avalanche", [
    { name: "The All-American Rejects", start: "19:40", end: "20:40" },
    { name: "Hot Milk", start: "18:30", end: "19:10" },
    { name: "Marmozets", start: "17:20", end: "18:00" },
    { name: "AS IT IS", start: "16:25", end: "16:55" },
    { name: "Melrose Avenue", start: "15:30", end: "16:00" },
    { name: "Mouth Culture", start: "14:35", end: "15:05" },
    { name: "Die Spitz", start: "13:40", end: "14:10" },
    { name: "Nevertel", start: "12:45", end: "13:15" },
    { name: "Frozemode", start: "11:50", end: "12:20" },
    { name: "Kerrang! Radio - The Deal Winner", start: "11:00", end: "11:20" },
  ], 800),
  ...addArtists("sunday", "avalanche", [
    { name: "SCOOTER", start: "20:20", end: "21:20" },
    { name: "letlive.", start: "19:10", end: "19:50" },
    { name: "Ash", start: "18:00", end: "18:40" },
    { name: "Dinosaur Pile-Up", start: "16:50", end: "17:30" },
    { name: "Magnolia Park", start: "15:50", end: "16:20" },
    { name: "TX2", start: "14:50", end: "15:20" },
    { name: "The Pretty Wild", start: "13:50", end: "14:20" },
    { name: "ivri", start: "12:50", end: "13:20" },
    { name: "Zero 9:36", start: "11:50", end: "12:20" },
    { name: "Mould", start: "11:00", end: "11:25" },
  ], 900),
  ...addArtists("friday", "dogtooth", [
    { name: "Cavalera", start: "21:50", end: "22:50" },
    { name: "Corrosion of Conformity", start: "20:45", end: "21:20" },
    { name: "BAND-MAID", start: "19:40", end: "20:15" },
    { name: "Stampin' Ground", start: "18:45", end: "19:15" },
    { name: "THE PRIMALS", start: "17:50", end: "18:20" },
    { name: "Lake Malice", start: "17:00", end: "17:25" },
    { name: "Nasty", start: "16:10", end: "16:35" },
    { name: "vianova", start: "15:20", end: "15:45" },
    { name: "James and the Cold Gun", start: "14:30", end: "14:55" },
    { name: "Slay Squad", start: "13:45", end: "14:05" },
    { name: "Headwreck", start: "13:00", end: "13:20" },
  ], 1000),
  ...addArtists("saturday", "dogtooth", [
    { name: "Blood Incantation", start: "20:30", end: "21:30" },
    { name: "Decapitated", start: "19:25", end: "20:00" },
    { name: "Elder", start: "18:25", end: "19:00" },
    { name: "Sweet Savage", start: "17:30", end: "18:00" },
    { name: "Self Deception", start: "16:40", end: "17:05" },
    { name: "As Everything Unfolds", start: "15:50", end: "16:15" },
    { name: "Return To Dust", start: "15:00", end: "15:25" },
    { name: "Conjurer", start: "14:10", end: "14:35" },
    { name: "Lowen", start: "13:20", end: "13:45" },
    { name: "TAILGUNNER", start: "12:30", end: "12:55" },
    { name: "Tropic Gold", start: "11:45", end: "12:05" },
    { name: "PUSSYLIQUOR", start: "11:00", end: "11:20" },
  ], 1100),
  ...addArtists("sunday", "dogtooth", [
    { name: "Static-X", start: "20:30", end: "21:30" },
    { name: "Spineshank", start: "19:25", end: "20:00" },
    { name: "Gatecreeper", start: "18:25", end: "18:55" },
    { name: "Boundaries", start: "17:30", end: "18:00" },
    { name: "ANKOR", start: "16:40", end: "17:05" },
    { name: "Annisokay", start: "15:00", end: "15:25" },
    { name: "Last Train", start: "14:10", end: "14:35" },
    { name: "Decessus", start: "13:20", end: "13:45" },
    { name: "Wayside", start: "12:30", end: "12:55" },
    { name: "Private School", start: "11:45", end: "12:05" },
    { name: "Spitting Glass", start: "11:00", end: "11:20" },
  ], 1200),
];

export const artistById = new Map(lineup.map((artist) => [artist.id, artist]));

export const dayById = new Map(festivalDays.map((day) => [day.id, day]));

export const stageById = new Map(festivalStages.map((stage) => [stage.id, stage]));

export const getArtistById = (id: string | undefined) => (id ? artistById.get(id) : undefined);

export const getDay = (id: DayId) => dayById.get(id);

export const getStage = (id: StageId) => stageById.get(id);
