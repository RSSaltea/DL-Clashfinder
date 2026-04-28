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
    { name: "Limp Bizkit", start: "", end: "" },
    { name: "Cypress Hill", start: "", end: "" },
    { name: "Electric Callboy", start: "", end: "" },
    { name: "Pendulum", start: "", end: "" },
    { name: "Hollywood Undead", start: "", end: "" },
    { name: "P.O.D.", start: "", end: "" },
    { name: "Scene Queen", start: "", end: "" },
  ], 100),
  ...addArtists("saturday", "apex", [
    { name: "Guns N' Roses", start: "", end: "" },
    { name: "Trivium", start: "", end: "" },
    { name: "BABYMETAL", start: "", end: "" },
    { name: "Black Veil Brides", start: "", end: "" },
    { name: "LANDMVRKS", start: "", end: "" },
    { name: "South Arcade", start: "", end: "" },
    { name: "Thornhill", start: "", end: "" },
  ], 200),
  ...addArtists("sunday", "apex", [
    { name: "Linkin Park", start: "", end: "" },
    { name: "Bad Omens", start: "", end: "" },
    { name: "Ice Nine Kills", start: "", end: "" },
    { name: "The Pretty Reckless", start: "", end: "" },
    { name: "Bloodywood", start: "", end: "" },
    { name: "RØRY", start: "", end: "" },
    { name: "Kublai Khan TX", start: "", end: "" },
    { name: "unpeople", start: "", end: "" },
  ], 300),
  ...addArtists("friday", "opus", [
    { name: "Halestorm", start: "", end: "" },
    { name: "Daughtry", start: "", end: "" },
    { name: "Periphery", start: "", end: "" },
    { name: "Creeper", start: "", end: "" },
    { name: "Paleface Swiss", start: "", end: "" },
    { name: "Silent Planet", start: "", end: "" },
    { name: "Caskets", start: "", end: "" },
  ], 400),
  ...addArtists("saturday", "opus", [
    { name: "Architects", start: "", end: "" },
    { name: "Behemoth", start: "", end: "" },
    { name: "Bush", start: "", end: "" },
    { name: "Set It Off", start: "", end: "" },
    { name: "Those Damn Crows", start: "", end: "" },
    { name: "We Came As Romans", start: "", end: "" },
    { name: "Drowning Pool", start: "", end: "" },
    { name: "Snot", start: "", end: "" },
  ], 500),
  ...addArtists("sunday", "opus", [
    { name: "A Day To Remember", start: "", end: "" },
    { name: "Mastodon", start: "", end: "" },
    { name: "Tom Morello", start: "", end: "" },
    { name: "Social Distortion", start: "", end: "" },
    { name: "The Plot In You", start: "", end: "" },
    { name: "thrown", start: "", end: "" },
    { name: "Dogstar", start: "", end: "" },
    { name: "Mammoth", start: "", end: "" },
    { name: "Catch Your Breath", start: "", end: "" },
    { name: "Ego Kill Talent", start: "", end: "" },
  ], 600),
  ...addArtists("friday", "avalanche", [
    { name: "Feeder", start: "", end: "" },
    { name: "Story Of The Year", start: "", end: "" },
    { name: "Sleep Theory", start: "", end: "" },
    { name: "Rain City Drive", start: "", end: "" },
    { name: "DRAIN", start: "", end: "" },
    { name: "Lakeview", start: "", end: "" },
    { name: "Holywatr", start: "", end: "" },
    { name: "Silly Goose", start: "", end: "" },
    { name: "Native James", start: "", end: "" },
  ], 700),
  ...addArtists("saturday", "avalanche", [
    { name: "The All-American Rejects", start: "", end: "" },
    { name: "Hot Milk", start: "", end: "" },
    { name: "Marmozets", start: "", end: "" },
    { name: "AS IT IS", start: "", end: "" },
    { name: "Melrose Avenue", start: "", end: "" },
    { name: "Mouth Culture", start: "", end: "" },
    { name: "Die Spitz", start: "", end: "" },
    { name: "Nevertel", start: "", end: "" },
    { name: "Frozemode", start: "", end: "" },
  ], 800),
  ...addArtists("sunday", "avalanche", [
    { name: "SCOOTER", start: "", end: "" },
    { name: "letlive.", start: "", end: "" },
    { name: "Ash", start: "", end: "" },
    { name: "Dinosaur Pile-Up", start: "", end: "" },
    { name: "Magnolia Park", start: "", end: "" },
    { name: "TX2", start: "", end: "" },
    { name: "Sweet Pill", start: "", end: "" },
    { name: "The Pretty Wild", start: "", end: "" },
    { name: "ivri", start: "", end: "" },
    { name: "Zero 9:36", start: "", end: "" },
  ], 900),
  ...addArtists("friday", "dogtooth", [
    { name: "Cavalera", start: "", end: "" },
    { name: "Corrosion of Conformity", start: "", end: "" },
    { name: "BAND-MAID", start: "", end: "" },
    { name: "Stampin' Ground", start: "", end: "" },
    { name: "THE PRIMALS", start: "", end: "" },
    { name: "Lake Malice", start: "", end: "" },
    { name: "Nasty", start: "", end: "" },
    { name: "vianova", start: "", end: "" },
    { name: "James and the Cold Gun", start: "", end: "" },
    { name: "Slay Squad", start: "", end: "" },
    { name: "Headwreck", start: "", end: "" },
  ], 1000),
  ...addArtists("saturday", "dogtooth", [
    { name: "Blood Incantation", start: "", end: "" },
    { name: "Decapitated", start: "", end: "" },
    { name: "Elder", start: "", end: "" },
    { name: "Sweet Savage", start: "", end: "" },
    { name: "Return To Dust", start: "", end: "" },
    { name: "Conjurer", start: "", end: "" },
    { name: "Lowen", start: "", end: "" },
    { name: "TAILGUNNER", start: "", end: "" },
    { name: "Tropic Gold", start: "", end: "" },
    { name: "PUSSYLIQUOR", start: "", end: "" },
  ], 1100),
  ...addArtists("sunday", "dogtooth", [
    { name: "Static-X", start: "", end: "" },
    { name: "Spineshank", start: "", end: "" },
    { name: "Gatecreeper", start: "", end: "" },
    { name: "Boundaries", start: "", end: "" },
    { name: "ANKOR", start: "", end: "" },
    { name: "Annisokay", start: "", end: "" },
    { name: "Last Train", start: "", end: "" },
    { name: "Decessus", start: "", end: "" },
    { name: "Wayside", start: "", end: "" },
    { name: "Private School", start: "", end: "" },
    { name: "Spitting Glass", start: "", end: "" },
  ], 1200),
];

export const artistById = new Map(lineup.map((artist) => [artist.id, artist]));

export const dayById = new Map(festivalDays.map((day) => [day.id, day]));

export const stageById = new Map(festivalStages.map((stage) => [stage.id, stage]));

export const getArtistById = (id: string | undefined) => (id ? artistById.get(id) : undefined);

export const getDay = (id: DayId) => dayById.get(id);

export const getStage = (id: StageId) => stageById.get(id);
