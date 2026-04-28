import { festival } from "../data/lineup";
import type { ClashDecisionMap, FestivalExport, IntentMap, SetTimeMap } from "../types";

export const createExportPayload = (
  profileName: string,
  intents: IntentMap,
  setTimes: SetTimeMap,
  clashDecisions: ClashDecisionMap = {},
  groupCode = "",
  groupClashVotes: ClashDecisionMap = {},
): FestivalExport => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  festival: {
    name: festival.name,
    year: festival.year,
  },
  profileName: profileName.trim() || "Me",
  intents,
  setTimes,
  clashDecisions,
  groupClashVotes,
  groupCode: groupCode.trim() || undefined,
});

export const downloadJson = (payload: FestivalExport) => {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = payload.profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  anchor.href = url;
  anchor.download = `download-2026-${safeName || "plan"}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
