import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClashDecisionMap, FestivalExport, GroupClashVoteMap, Intent, IntentMap, SetTimeMap } from "../types";
import { createExportPayload } from "../utils/export";
import {
  type GroupSyncState,
  isGroupSyncConfigured,
  normaliseGroupCode,
  pullGroupPlans,
  pushGroupPlan,
} from "../utils/groupSync";
import {
  getNextIntent,
  loadClashDecisions,
  loadGroupCode,
  loadGroupCodes,
  loadGroupClashVotes,
  loadGroupClashVotesByCode,
  loadGroupMemberId,
  loadImports,
  loadIntentMap,
  loadProfileName,
  saveClashDecisions,
  saveGroupCode,
  saveGroupCodes,
  saveGroupClashVotes,
  saveGroupClashVotesByCode,
  saveImports,
  saveIntentMap,
  saveProfileName,
} from "../utils/localStorage";

const getInitialGroupSyncState = (): GroupSyncState => {
  const configured = isGroupSyncConfigured();

  return {
    configured,
    status: configured ? "idle" : "disabled",
    message: configured
      ? "Enter a group code and your picks will sync automatically."
      : "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
    memberCount: 1,
  };
};

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());
  const [imports, setImportsState] = useState<FestivalExport[]>(() => loadImports());
  const [syncedImports, setSyncedImports] = useState<FestivalExport[]>([]);
  const [clashDecisions, setClashDecisions] = useState<ClashDecisionMap>(() => loadClashDecisions());
  const [groupCode, setGroupCodeState] = useState(() => loadGroupCode());
  const [groupCodeDraft, setGroupCodeDraftState] = useState(() => loadGroupCode());
  const [groupCodes, setGroupCodes] = useState<string[]>(() => loadGroupCodes(loadGroupCode()));
  const [groupClashVotesByCode, setGroupClashVotesByCode] = useState<GroupClashVoteMap>(() =>
    loadGroupClashVotesByCode(loadGroupCode(), loadGroupClashVotes()),
  );
  const [groupSyncState, setGroupSyncState] = useState<GroupSyncState>(() => getInitialGroupSyncState());
  const groupMemberId = useMemo(() => loadGroupMemberId(), []);
  const syncConfigured = useMemo(() => isGroupSyncConfigured(), []);
  const activeGroupCodeRef = useRef(normaliseGroupCode(groupCode));
  const setTimes = useMemo<SetTimeMap>(() => ({}), []);
  const groupClashVotes = useMemo(
    () => (groupCode ? groupClashVotesByCode[groupCode] ?? {} : {}),
    [groupClashVotesByCode, groupCode],
  );

  useEffect(() => {
    activeGroupCodeRef.current = normaliseGroupCode(groupCode);
  }, [groupCode]);

  useEffect(() => {
    saveIntentMap(intents);
  }, [intents]);

  useEffect(() => {
    saveProfileName(profileName);
  }, [profileName]);

  useEffect(() => {
    saveImports(imports);
  }, [imports]);

  useEffect(() => {
    saveClashDecisions(clashDecisions);
  }, [clashDecisions]);

  useEffect(() => {
    saveGroupClashVotesByCode(groupClashVotesByCode);
    saveGroupClashVotes(groupClashVotes);
  }, [groupClashVotes, groupClashVotesByCode]);

  useEffect(() => {
    saveGroupCode(groupCode);
  }, [groupCode]);

  useEffect(() => {
    saveGroupCodes(groupCodes);
  }, [groupCodes]);

  const selectedArtistIds = useMemo(() => new Set(Object.keys(intents)), [intents]);

  const setArtistIntent = (artistId: string, requested: Intent) => {
    setIntents((current) => {
      const nextIntent = getNextIntent(current[artistId], requested);
      const next = { ...current };

      if (nextIntent) {
        next[artistId] = nextIntent;
      } else {
        delete next[artistId];
      }

      return next;
    });
  };

  const addImports = (newImports: FestivalExport[]) => {
    setImportsState((current) => [...current, ...newImports]);
  };

  const removeImport = (index: number) => {
    setImportsState((current) => current.filter((_, i) => i !== index));
  };

  const setClashDecision = (clashId: string, artistId: string | undefined) => {
    setClashDecisions((current) => {
      const next = { ...current };

      if (artistId) {
        next[clashId] = artistId;
      } else {
        delete next[clashId];
      }

      return next;
    });
  };

  const setGroupClashVote = (clashId: string, artistId: string | undefined) => {
    if (!groupCode) {
      return;
    }

    setGroupClashVotesByCode((current) => {
      const nextVotes = { ...(current[groupCode] ?? {}) };

      if (artistId) {
        nextVotes[clashId] = artistId;
      } else {
        delete nextVotes[clashId];
      }

      return {
        ...current,
        [groupCode]: nextVotes,
      };
    });
  };

  const setGroupCodeDraft = (value: string) => {
    setGroupCodeDraftState(normaliseGroupCode(value));
  };

  const rememberGroupCode = (value: string) => {
    if (!value) {
      return;
    }

    setGroupCodes((current) => [value, ...current.filter((code) => code !== value)]);
  };

  const activateGroupCode = (value: string) => {
    const nextGroupCode = normaliseGroupCode(value);

    setGroupCodeDraftState(nextGroupCode);
    setSyncedImports([]);
    setGroupCodeState(nextGroupCode);
    activeGroupCodeRef.current = nextGroupCode;
    rememberGroupCode(nextGroupCode);

    return nextGroupCode;
  };

  const syncGroupNow = useCallback(async (requestedGroupCode?: string) => {
    const currentGroupCode = requestedGroupCode === undefined
      ? normaliseGroupCode(groupCode)
      : activateGroupCode(requestedGroupCode);

    if (!currentGroupCode) {
      setSyncedImports([]);
      setGroupSyncState({
        configured: syncConfigured,
        status: syncConfigured ? "idle" : "disabled",
        message: syncConfigured
          ? "Enter a group code and your picks will sync automatically."
          : "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
        memberCount: 1,
      });
      return;
    }

    if (!syncConfigured) {
      setSyncedImports([]);
      setGroupSyncState({
        configured: false,
        status: "disabled",
        message: "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
        memberCount: 1,
      });
      return;
    }

    setGroupSyncState((current) => ({
      ...current,
      configured: true,
      status: "syncing",
      message: `Syncing ${currentGroupCode}...`,
    }));

    try {
      const votesForGroup = groupClashVotesByCode[currentGroupCode] ?? {};
      const payload = createExportPayload(
        profileName,
        intents,
        setTimes,
        clashDecisions,
        currentGroupCode,
        votesForGroup,
      );

      await pushGroupPlan(currentGroupCode, groupMemberId, payload);

      const remotePlans = await pullGroupPlans(currentGroupCode, groupMemberId);

      if (activeGroupCodeRef.current !== currentGroupCode) {
        return;
      }

      const syncedAt = new Date().toISOString();
      setSyncedImports(remotePlans);
      setGroupSyncState({
        configured: true,
        status: "synced",
        message: remotePlans.length === 0
          ? `Synced ${currentGroupCode}. Waiting for other people to join.`
          : `Synced ${currentGroupCode} with ${remotePlans.length} other ${remotePlans.length === 1 ? "person" : "people"}.`,
        lastSyncedAt: syncedAt,
        memberCount: remotePlans.length + 1,
      });
    } catch (error) {
      if (activeGroupCodeRef.current !== currentGroupCode) {
        return;
      }

      setGroupSyncState({
        configured: true,
        status: "error",
        message: error instanceof Error ? error.message : "Group sync failed.",
        memberCount: syncedImports.length + 1,
      });
    }
  }, [
    clashDecisions,
    groupCode,
    groupClashVotesByCode,
    groupMemberId,
    intents,
    profileName,
    setTimes,
    syncConfigured,
    syncedImports.length,
  ]);

  useEffect(() => {
    const currentGroupCode = normaliseGroupCode(groupCode);

    if (!currentGroupCode || !syncConfigured) {
      void syncGroupNow();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncGroupNow();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [groupCode, syncConfigured, syncGroupNow]);

  useEffect(() => {
    if (!normaliseGroupCode(groupCode) || !syncConfigured) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void syncGroupNow();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [groupCode, syncConfigured, syncGroupNow]);

  return {
    intents,
    clashDecisions,
    groupClashVotes,
    selectedArtistIds,
    setClashDecision,
    setGroupClashVote,
    setArtistIntent,
    setIntents,
    setProfileName: setProfileNameState,
    setTimes,
    profileName,
    groupCode,
    groupCodeDraft,
    setGroupCodeDraft,
    groupCodes,
    activateGroupCode,
    syncedImports,
    groupSyncState,
    syncGroupNow,
    imports,
    addImports,
    removeImport,
  };
};
