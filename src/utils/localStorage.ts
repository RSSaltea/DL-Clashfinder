import type { FestivalExport, Intent, IntentMap } from "../types";

const storageKeys = {
  intents: "download-clash-finder:intents",
  profileName: "download-clash-finder:profile-name",
  imports: "download-clash-finder:imports",
  freeTimeWindow: "download-clash-finder:free-time-window",
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
