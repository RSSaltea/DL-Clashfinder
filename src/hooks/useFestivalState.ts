import { useEffect, useMemo, useState } from "react";
import type { ArtistSetTime, Intent, IntentMap, SetTimeMap } from "../types";
import {
  getNextIntent,
  loadIntentMap,
  loadProfileName,
  loadSetTimes,
  saveIntentMap,
  saveProfileName,
  saveSetTimes,
} from "../utils/localStorage";

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [setTimes, setSetTimes] = useState<SetTimeMap>(() => loadSetTimes());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());

  useEffect(() => {
    saveIntentMap(intents);
  }, [intents]);

  useEffect(() => {
    saveSetTimes(setTimes);
  }, [setTimes]);

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

  const updateSetTime = (artistId: string, value: ArtistSetTime) => {
    setSetTimes((current) => {
      const next = { ...current };
      const start = value.start ?? "";
      const end = value.end ?? "";

      if (!start && !end) {
        delete next[artistId];
      } else {
        next[artistId] = { start, end };
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
    updateSetTime,
    profileName,
  };
};
