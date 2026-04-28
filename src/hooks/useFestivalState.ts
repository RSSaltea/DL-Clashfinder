import { useEffect, useMemo, useState } from "react";
import type { ClashDecisionMap, FestivalExport, Intent, IntentMap, SetTimeMap } from "../types";
import {
  getNextIntent,
  loadClashDecisions,
  loadGroupCode,
  loadImports,
  loadIntentMap,
  loadProfileName,
  saveClashDecisions,
  saveGroupCode,
  saveImports,
  saveIntentMap,
  saveProfileName,
} from "../utils/localStorage";

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());
  const [imports, setImportsState] = useState<FestivalExport[]>(() => loadImports());
  const [clashDecisions, setClashDecisions] = useState<ClashDecisionMap>(() => loadClashDecisions());
  const [groupCode, setGroupCodeState] = useState(() => loadGroupCode());
  const setTimes = useMemo<SetTimeMap>(() => ({}), []);

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
    setGroupCode: setGroupCodeState,
    imports,
    addImports,
    removeImport,
  };
};
