import type { Artist, ClashPair, SetTimeMap } from "../types";
import { getEffectiveTime, getOverlapRange } from "./time";

export const getClashesForArtist = (
  artist: Artist,
  artists: Artist[],
  setTimes: SetTimeMap,
) =>
  artists.filter((candidate) => {
    if (candidate.id === artist.id || candidate.day !== artist.day) {
      return false;
    }

    return Boolean(
      getOverlapRange(getEffectiveTime(artist, setTimes), getEffectiveTime(candidate, setTimes)),
    );
  });

export const getAllClashes = (artists: Artist[], setTimes: SetTimeMap): ClashPair[] => {
  const clashes: ClashPair[] = [];

  artists.forEach((first, firstIndex) => {
    artists.slice(firstIndex + 1).forEach((second) => {
      if (first.day !== second.day) {
        return;
      }

      const overlap = getOverlapRange(
        getEffectiveTime(first, setTimes),
        getEffectiveTime(second, setTimes),
      );

      if (!overlap) {
        return;
      }

      clashes.push({
        id: `${first.id}--${second.id}`,
        day: first.day,
        first,
        second,
        start: overlap.start,
        end: overlap.end,
      });
    });
  });

  return clashes.sort((a, b) => {
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day);
    }

    return a.start.localeCompare(b.start);
  });
};
