import type { Artist, ClashPair, SetTimeMap, TightGapPair } from "../types";
import { getDaySortIndex } from "../data/lineup";
import { getEffectiveTime, getOverlapRange, getTimeBounds, minutesToTime } from "./time";

const DEFAULT_TIGHT_GAP_MINUTES = 10;

export const getClashDecisionId = (firstId: string, secondId: string) =>
  [firstId, secondId].sort().join("--");

const getTimedBounds = (artist: Artist, setTimes: SetTimeMap) => {
  const time = getEffectiveTime(artist, setTimes);
  const bounds = getTimeBounds(time);

  if (!bounds) {
    return undefined;
  }

  return bounds;
};

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
        id: getClashDecisionId(first.id, second.id),
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
      return getDaySortIndex(a.day) - getDaySortIndex(b.day);
    }

    return a.start.localeCompare(b.start);
  });
};

export const getAllTightGaps = (
  artists: Artist[],
  setTimes: SetTimeMap,
  thresholdMinutes = DEFAULT_TIGHT_GAP_MINUTES,
): TightGapPair[] => {
  const gaps: TightGapPair[] = [];

  artists.forEach((first, firstIndex) => {
    artists.slice(firstIndex + 1).forEach((second) => {
      if (first.day !== second.day) {
        return;
      }

      const firstTime = getTimedBounds(first, setTimes);
      const secondTime = getTimedBounds(second, setTimes);

      if (!firstTime || !secondTime) {
        return;
      }

      const firstToSecond = secondTime.start - firstTime.end;
      const secondToFirst = firstTime.start - secondTime.end;

      if (firstToSecond >= 0 && firstToSecond <= thresholdMinutes) {
        gaps.push({
          id: `${first.id}--${second.id}--tight-gap`,
          day: first.day,
          first,
          second,
          minutes: firstToSecond,
          betweenStart: minutesToTime(firstTime.end),
          betweenEnd: minutesToTime(secondTime.start),
        });
      }

      if (secondToFirst >= 0 && secondToFirst <= thresholdMinutes) {
        gaps.push({
          id: `${second.id}--${first.id}--tight-gap`,
          day: first.day,
          first: second,
          second: first,
          minutes: secondToFirst,
          betweenStart: minutesToTime(secondTime.end),
          betweenEnd: minutesToTime(firstTime.start),
        });
      }
    });
  });

  return gaps.sort((a, b) => {
    if (a.day !== b.day) {
      return getDaySortIndex(a.day) - getDaySortIndex(b.day);
    }

    if (a.betweenStart !== b.betweenStart) {
      return a.betweenStart.localeCompare(b.betweenStart);
    }

    return a.first.order - b.first.order;
  });
};
