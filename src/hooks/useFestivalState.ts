import { useEffect, useMemo, useState } from "react";
import type { Intent, IntentMap, SetTimeMap } from "../types";
import {
  getNextIntent,
  loadIntentMap,
  loadProfileName,
  saveIntentMap,
  saveProfileName,
} from "../utils/localStorage";

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());
  const setTimes = useMemo<SetTimeMap>(() => ({}), []);

  useEffect(() => {
    saveIntentMap(intents);
  }, [intents]);

  useEffect(() => {
    saveProfileName(profileName);
  }, [profileName]);

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

  return {
    intents,
    selectedArtistIds,
    setArtistIntent,
    setIntents,
    setProfileName: setProfileNameState,
    setTimes,
    profileName,
  };
};
