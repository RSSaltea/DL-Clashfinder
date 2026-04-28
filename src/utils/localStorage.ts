import type { ClashDecisionMap, FestivalExport, Intent, IntentMap } from "../types";

const storageKeys = {
  intents: "download-clash-finder:intents",
  profileName: "download-clash-finder:profile-name",
  imports: "download-clash-finder:imports",
  freeTimeWindow: "download-clash-finder:free-time-window",
  clashDecisions: "download-clash-finder:clash-decisions",
  groupCode: "download-clash-finder:group-code",
  groupMemberId: "download-clash-finder:group-member-id",
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const loadIntentMap = (): IntentMap =>
  parseJson<IntentMap>(window.localStorage.getItem(storageKeys.intents), {});

export const saveIntentMap = (value: IntentMap) => {
  window.localStorage.setItem(storageKeys.intents, JSON.stringify(value));
};

export const loadProfileName = () =>
  window.localStorage.getItem(storageKeys.profileName) ?? "Me";

export const saveProfileName = (value: string) => {
  window.localStorage.setItem(storageKeys.profileName, value || "Me");
};

export const loadImports = (): FestivalExport[] =>
  parseJson<FestivalExport[]>(window.localStorage.getItem(storageKeys.imports), []);

export const saveImports = (value: FestivalExport[]) => {
  window.localStorage.setItem(storageKeys.imports, JSON.stringify(value));
};

export const loadClashDecisions = (): ClashDecisionMap =>
  parseJson<ClashDecisionMap>(window.localStorage.getItem(storageKeys.clashDecisions), {});

export const saveClashDecisions = (value: ClashDecisionMap) => {
  window.localStorage.setItem(storageKeys.clashDecisions, JSON.stringify(value));
};

export const loadGroupCode = () =>
  window.localStorage.getItem(storageKeys.groupCode) ?? "";

export const saveGroupCode = (value: string) => {
  window.localStorage.setItem(storageKeys.groupCode, value.trim());
};

const createGroupMemberId = () => {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const loadGroupMemberId = () => {
  const existing = window.localStorage.getItem(storageKeys.groupMemberId);

  if (existing) {
    return existing;
  }

  const memberId = createGroupMemberId();
  window.localStorage.setItem(storageKeys.groupMemberId, memberId);

  return memberId;
};

export interface FreeTimeWindow {
  start: string;
  end: string;
}

export const loadFreeTimeWindow = (): FreeTimeWindow =>
  parseJson<FreeTimeWindow>(window.localStorage.getItem(storageKeys.freeTimeWindow), {
    start: "10:00",
    end: "00:00",
  });

export const saveFreeTimeWindow = (value: FreeTimeWindow) => {
  window.localStorage.setItem(storageKeys.freeTimeWindow, JSON.stringify(value));
};

export const getNextIntent = (current: Intent | undefined, requested: Intent): Intent | undefined =>
  current === requested ? undefined : requested;
