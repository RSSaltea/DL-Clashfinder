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
    "Limp Bizkit",
    "Cypress Hill",
    "Electric Callboy",
    "Pendulum",
    "Hollywood Undead",
    "P.O.D.",
    "Scene Queen",
  ], 100),
  ...addArtists("saturday", "apex", [
    "Guns N' Roses",
    "Trivium",
    "BABYMETAL",
    "Black Veil Brides",
    "LANDMVRKS",
    "South Arcade",
    "Thornhill",
  ], 200),
  ...addArtists("sunday", "apex", [
    "Linkin Park",
    "Bad Omens",
    "Ice Nine Kills",
    "The Pretty Reckless",
    "Bloodywood",
    "RØRY",
    "Kublai Khan TX",
    "unpeople",
  ], 300),
  ...addArtists("friday", "opus", [
    "Halestorm",
    "Daughtry",
    "Periphery",
    "Creeper",
    "Paleface Swiss",
    "Silent Planet",
    "Caskets",
  ], 400),
  ...addArtists("saturday", "opus", [
    "Architects",
    "Behemoth",
    "Bush",
    "Set It Off",
    "Those Damn Crows",
    "We Came As Romans",
    "Drowning Pool",
    "Snot",
  ], 500),
  ...addArtists("sunday", "opus", [
    "A Day To Remember",
    "Mastodon",
    "Tom Morello",
    "Social Distortion",
    "The Plot In You",
    "thrown",
    "Dogstar",
    "Mammoth",
    "Catch Your Breath",
    "Ego Kill Talent",
  ], 600),
  ...addArtists("friday", "avalanche", [
    "Feeder",
    "Story Of The Year",
    "Sleep Theory",
    "Rain City Drive",
    "DRAIN",
    "Lakeview",
    "Holywatr",
    "Silly Goose",
    "Native James",
  ], 700),
  ...addArtists("saturday", "avalanche", [
    "The All-American Rejects",
    "Hot Milk",
    "Marmozets",
    "AS IT IS",
    "Melrose Avenue",
    "Mouth Culture",
    "Die Spitz",
    "Nevertel",
    "Frozemode",
  ], 800),
  ...addArtists("sunday", "avalanche", [
    "SCOOTER",
    "letlive.",
    "Ash",
    "Dinosaur Pile-Up",
    "Magnolia Park",
    "TX2",
    "Sweet Pill",
    "The Pretty Wild",
    "ivri",
    "Zero 9:36",
  ], 900),
  ...addArtists("friday", "dogtooth", [
    "Cavalera",
    "Corrosion of Conformity",
    "BAND-MAID",
    "Stampin' Ground",
    "THE PRIMALS",
    "Lake Malice",
    "Nasty",
    "vianova",
    "James and the Cold Gun",
    "Slay Squad",
    "Headwreck",
  ], 1000),
  ...addArtists("saturday", "dogtooth", [
    "Blood Incantation",
    "Decapitated",
    "Elder",
    "Sweet Savage",
    "Return To Dust",
    "Conjurer",
    "Lowen",
    "TAILGUNNER",
    "Tropic Gold",
    "PUSSYLIQUOR",
  ], 1100),
  ...addArtists("sunday", "dogtooth", [
    "Static-X",
    "Spineshank",
    "Gatecreeper",
    "Boundaries",
    "ANKOR",
    "Annisokay",
    "Last Train",
    "Decessus",
    "Wayside",
    "Private School",
    "Spitting Glass",
  ], 1200),
];

export const artistById = new Map(lineup.map((artist) => [artist.id, artist]));

export const dayById = new Map(festivalDays.map((day) => [day.id, day]));

export const stageById = new Map(festivalStages.map((stage) => [stage.id, stage]));

export const getArtistById = (id: string | undefined) => (id ? artistById.get(id) : undefined);

export const getDay = (id: DayId) => dayById.get(id);

export const getStage = (id: StageId) => stageById.get(id);
