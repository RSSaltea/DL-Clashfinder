import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClashDecisionMap, FestivalExport, Intent, IntentMap, SetTimeMap } from "../types";
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
  loadGroupMemberId,
  loadImports,
  loadIntentMap,
  loadProfileName,
  saveClashDecisions,
  saveGroupCode,
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
  const [groupSyncState, setGroupSyncState] = useState<GroupSyncState>(() => getInitialGroupSyncState());
  const groupMemberId = useMemo(() => loadGroupMemberId(), []);
  const syncConfigured = useMemo(() => isGroupSyncConfigured(), []);
  const activeGroupCodeRef = useRef(normaliseGroupCode(groupCode));
  const setTimes = useMemo<SetTimeMap>(() => ({}), []);

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
    saveGroupCode(groupCode);
  }, [groupCode]);

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

  const setGroupCode = (value: string) => {
    setGroupCodeState(normaliseGroupCode(value));
  };

  const syncGroupNow = useCallback(async () => {
    const currentGroupCode = normaliseGroupCode(groupCode);

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
      const payload = createExportPayload(profileName, intents, setTimes, clashDecisions, currentGroupCode);

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
    selectedArtistIds,
    setClashDecision,
    setArtistIntent,
    setIntents,
    setProfileName: setProfileNameState,
    setTimes,
    profileName,
    groupCode,
    setGroupCode,
    syncedImports,
    groupSyncState,
    syncGroupNow,
    imports,
    addImports,
    removeImport,
  };
};
