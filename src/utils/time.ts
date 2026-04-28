import type { Artist, ArtistSetTime, SetTimeMap } from "../types";

export const getEffectiveTime = (artist: Artist, _setTimes: SetTimeMap): ArtistSetTime => {
  return {
    start: artist.defaultStart ?? "",
    end: artist.defaultEnd ?? "",
  };
};

export const hasCompleteTime = (time: ArtistSetTime) => Boolean(time.start && time.end);

export const timeToMinutes = (value?: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return undefined;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) {
    return undefined;
  }

  return hours * 60 + minutes;
};

export const formatTimeRange = (time: ArtistSetTime, fallback = "Time TBC") => {
  if (!hasCompleteTime(time)) {
    return fallback;
  }

  return `${time.start} to ${time.end}`;
};

export const getOverlapRange = (first: ArtistSetTime, second: ArtistSetTime) => {
  const firstStart = timeToMinutes(first.start);
  const firstEnd = timeToMinutes(first.end);
  const secondStart = timeToMinutes(second.start);
  const secondEnd = timeToMinutes(second.end);

  if (
    firstStart === undefined ||
    firstEnd === undefined ||
    secondStart === undefined ||
    secondEnd === undefined ||
    firstEnd <= firstStart ||
    secondEnd <= secondStart
  ) {
    return undefined;
  }

  const start = Math.max(firstStart, secondStart);
  const end = Math.min(firstEnd, secondEnd);

  if (start >= end) {
    return undefined;
  }

  return {
    start: minutesToTime(start),
    end: minutesToTime(end),
  };
};

export const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};
