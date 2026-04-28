import type { Intent, IntentMap, SetTimeMap } from "../types";

const storageKeys = {
  intents: "download-clash-finder:intents",
  setTimes: "download-clash-finder:set-times",
  profileName: "download-clash-finder:profile-name",
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

export const loadSetTimes = (): SetTimeMap =>
  parseJson<SetTimeMap>(window.localStorage.getItem(storageKeys.setTimes), {});

export const saveSetTimes = (value: SetTimeMap) => {
  window.localStorage.setItem(storageKeys.setTimes, JSON.stringify(value));
};

export const loadProfileName = () =>
  window.localStorage.getItem(storageKeys.profileName) ?? "Me";

export const saveProfileName = (value: string) => {
  window.localStorage.setItem(storageKeys.profileName, value || "Me");
};

export const getNextIntent = (current: Intent | undefined, requested: Intent): Intent | undefined =>
  current === requested ? undefined : requested;
