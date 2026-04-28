import { useEffect, useMemo, useState } from "react";
import type { FestivalExport, Intent, IntentMap, SetTimeMap } from "../types";
import {
  getNextIntent,
  loadImports,
  loadIntentMap,
  loadProfileName,
  saveImports,
  saveIntentMap,
  saveProfileName,
} from "../utils/localStorage";

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());
  const [imports, setImportsState] = useState<FestivalExport[]>(() => loadImports());
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

  return {
    intents,
    selectedArtistIds,
    setArtistIntent,
    setIntents,
    setProfileName: setProfileNameState,
    setTimes,
    profileName,
    imports,
    addImports,
    removeImport,
  };
};
