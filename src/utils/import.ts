import type { ClashDecisionMap, FestivalExport, IntentMap, SetTimeMap } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseIntentMap = (value: unknown): IntentMap => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, intent]) => intent === "interested" || intent === "definite"),
  ) as IntentMap;
};

const parseSetTimes = (value: unknown): SetTimeMap => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<SetTimeMap>((acc, [artistId, time]) => {
    if (!isRecord(time)) {
      return acc;
    }

    acc[artistId] = {
      start: typeof time.start === "string" ? time.start : "",
      end: typeof time.end === "string" ? time.end : "",
    };

    return acc;
  }, {});
};

const parseClashDecisions = (value: unknown): ClashDecisionMap => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, artistId]) => typeof artistId === "string"),
  ) as ClashDecisionMap;
};

export const parseImportedPlan = async (file: File): Promise<FestivalExport> => {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("That file is not a valid plan export.");
  }

  return {
    version: 1,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
    festival: {
      name: isRecord(parsed.festival) && typeof parsed.festival.name === "string"
        ? parsed.festival.name
        : "Download Festival",
      year: isRecord(parsed.festival) && typeof parsed.festival.year === "number"
        ? parsed.festival.year
        : 2026,
    },
    profileName: typeof parsed.profileName === "string" && parsed.profileName.trim()
      ? parsed.profileName.trim()
      : file.name.replace(/\.json$/i, ""),
    intents: parseIntentMap(parsed.intents),
    setTimes: parseSetTimes(parsed.setTimes),
    clashDecisions: parseClashDecisions(parsed.clashDecisions),
    groupCode: typeof parsed.groupCode === "string" ? parsed.groupCode.trim() : undefined,
  };
};
