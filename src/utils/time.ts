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

export const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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

export const windowEndToMins = (value: string): number => {
  if (value === "00:00") return 24 * 60;
  return timeToMinutes(value) ?? 24 * 60;
};

export const formatDuration = (totalMins: number) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const mergeIntervals = (intervals: Array<{ start: number; end: number }>) => {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];

  for (const interval of sorted) {
    if (merged.length === 0 || merged[merged.length - 1].end < interval.start) {
      merged.push({ ...interval });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
    }
  }

  return merged;
};

export const computeFreeGaps = (
  activeArtists: Artist[],
  setTimes: SetTimeMap,
  windowStartMins: number,
  windowEndMins: number,
): Array<{ start: number; end: number }> => {
  const intervals = activeArtists
    .map((artist) => {
      const t = getEffectiveTime(artist, setTimes);
      const start = timeToMinutes(t.start);
      const end = timeToMinutes(t.end);
      return start !== undefined && end !== undefined && end > start ? { start, end } : null;
    })
    .filter((t): t is { start: number; end: number } => t !== null)
    .filter((t) => t.end > windowStartMins && t.start < windowEndMins);

  const merged = mergeIntervals(intervals);
  const gaps: Array<{ start: number; end: number }> = [];
  let cursor = windowStartMins;

  for (const interval of merged) {
    if (interval.start > cursor) {
      gaps.push({ start: cursor, end: Math.min(interval.start, windowEndMins) });
    }
    cursor = Math.max(cursor, interval.end);
  }

  if (cursor < windowEndMins) {
    gaps.push({ start: cursor, end: windowEndMins });
  }

  return gaps;
};
