import type {
  AccountSession,
  ClashDecisionMap,
  FestivalExport,
  FreeTimeNoteMap,
  GroupClashVoteMap,
  GroupFreeTimeNoteMap,
  Intent,
  IntentMap,
} from "../types";

const storageKeys = {
  intents: "download-clash-finder:intents",
  profileName: "download-clash-finder:profile-name",
  imports: "download-clash-finder:imports",
  freeTimeWindow: "download-clash-finder:free-time-window",
  clashDecisions: "download-clash-finder:clash-decisions",
  groupClashVotes: "download-clash-finder:group-clash-votes",
  groupClashVotesByCode: "download-clash-finder:group-clash-votes-by-code",
  freeTimeNotes: "download-clash-finder:free-time-notes",
  groupFreeTimeNotesByCode: "download-clash-finder:group-free-time-notes-by-code",
  groupCode: "download-clash-finder:group-code",
  groupCodes: "download-clash-finder:group-codes",
  groupMemberId: "download-clash-finder:group-member-id",
  accountSession: "download-clash-finder:account-session",
  districtXEnabled: "download-clash-finder:district-x-enabled",
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

export const loadGroupClashVotes = (): ClashDecisionMap =>
  parseJson<ClashDecisionMap>(window.localStorage.getItem(storageKeys.groupClashVotes), {});

export const saveGroupClashVotes = (value: ClashDecisionMap) => {
  window.localStorage.setItem(storageKeys.groupClashVotes, JSON.stringify(value));
};

export const loadGroupClashVotesByCode = (
  activeGroupCode = "",
  legacyVotes: ClashDecisionMap = {},
): GroupClashVoteMap => {
  const saved = parseJson<GroupClashVoteMap>(
    window.localStorage.getItem(storageKeys.groupClashVotesByCode),
    {},
  );

  if (Object.keys(saved).length > 0 || !activeGroupCode || Object.keys(legacyVotes).length === 0) {
    return saved;
  }

  return {
    [activeGroupCode]: legacyVotes,
  };
};

export const saveGroupClashVotesByCode = (value: GroupClashVoteMap) => {
  window.localStorage.setItem(storageKeys.groupClashVotesByCode, JSON.stringify(value));
};

export const loadFreeTimeNotes = (): FreeTimeNoteMap =>
  parseJson<FreeTimeNoteMap>(window.localStorage.getItem(storageKeys.freeTimeNotes), {});

export const saveFreeTimeNotes = (value: FreeTimeNoteMap) => {
  window.localStorage.setItem(storageKeys.freeTimeNotes, JSON.stringify(value));
};

export const loadGroupFreeTimeNotesByCode = (): GroupFreeTimeNoteMap =>
  parseJson<GroupFreeTimeNoteMap>(
    window.localStorage.getItem(storageKeys.groupFreeTimeNotesByCode),
    {},
  );

export const saveGroupFreeTimeNotesByCode = (value: GroupFreeTimeNoteMap) => {
  window.localStorage.setItem(storageKeys.groupFreeTimeNotesByCode, JSON.stringify(value));
};

export const loadGroupCode = () =>
  window.localStorage.getItem(storageKeys.groupCode) ?? "";

export const saveGroupCode = (value: string) => {
  window.localStorage.setItem(storageKeys.groupCode, value.trim());
};

export const loadGroupCodes = (activeGroupCode = "") => {
  const saved = parseJson<string[]>(window.localStorage.getItem(storageKeys.groupCodes), []);
  const codes = new Set(saved.filter(Boolean));

  if (activeGroupCode) {
    codes.add(activeGroupCode);
  }

  return Array.from(codes);
};

export const saveGroupCodes = (value: string[]) => {
  window.localStorage.setItem(storageKeys.groupCodes, JSON.stringify(Array.from(new Set(value.filter(Boolean)))));
};

export const loadAccountSession = (): AccountSession | null =>
  parseJson<AccountSession | null>(window.localStorage.getItem(storageKeys.accountSession), null);

export const saveAccountSession = (value: AccountSession | null) => {
  if (!value) {
    window.localStorage.removeItem(storageKeys.accountSession);
    return;
  }

  window.localStorage.setItem(storageKeys.accountSession, JSON.stringify(value));
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

export const loadTheme = (): "dark" | "light" =>
  (window.localStorage.getItem("download-clash-finder:theme") as "dark" | "light") ?? "dark";

export const saveTheme = (value: "dark" | "light") => {
  window.localStorage.setItem("download-clash-finder:theme", value);
};

export const loadDistrictXEnabled = (): boolean =>
  window.localStorage.getItem(storageKeys.districtXEnabled) === "true";

export const saveDistrictXEnabled = (value: boolean) => {
  window.localStorage.setItem(storageKeys.districtXEnabled, String(value));
};

export const loadViewMode = (): "grid" | "timetable" =>
  (window.localStorage.getItem("download-clash-finder:view-mode") as "grid" | "timetable") ?? "grid";

export const saveViewMode = (value: "grid" | "timetable") => {
  window.localStorage.setItem("download-clash-finder:view-mode", value);
};

export const loadTimetableStages = (): boolean =>
  window.localStorage.getItem("download-clash-finder:timetable-stages") !== "false";

export const saveTimetableStages = (value: boolean) => {
  window.localStorage.setItem("download-clash-finder:timetable-stages", String(value));
};
