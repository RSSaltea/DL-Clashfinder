import { getStage, lineup } from "../data/lineup";
import type { Artist, ClashDecisionMap, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { getAllClashes } from "./clash";
import { formatDuration, getEffectiveTime, getTimeBounds } from "./time";

export interface ArtistSupport {
  supporters: string[];
  definiteSupporters: string[];
}

export interface TimedArtist {
  artist: Artist;
  start: number;
  end: number;
  supporters?: ArtistSupport;
}

export interface ScheduleGap {
  start: number;
  end: number;
  comingFrom: TimedArtist | null;
  goingTo: TimedArtist | null;
  playing: TimedArtist[];
}

export interface ScheduleDay {
  dayId: Artist["day"];
  attending: TimedArtist[];
  gaps: ScheduleGap[];
  pickedCount: number;
  excludedCount: number;
}

export interface StageTransfer {
  id: string;
  from: TimedArtist;
  to: TimedArtist;
  minutes: number;
  text: string;
}

const groupRoleWeight = {
  member: 1,
  admin: 2,
  leader: 3,
} as const;

export const getFreeTimeNoteKey = (dayId: Artist["day"], start: number, end: number) =>
  `${dayId}:${start}-${end}`;

export const mergeGroupFreeTimeNotes = (profiles: ProfilePlan[]) =>
  [...profiles]
    .sort((a, b) => {
      const aWeight = a.groupRole ? groupRoleWeight[a.groupRole] : 0;
      const bWeight = b.groupRole ? groupRoleWeight[b.groupRole] : 0;
      if (aWeight !== bWeight) {
        return aWeight - bWeight;
      }
      if (a.id === "local") {
        return 1;
      }
      if (b.id === "local") {
        return -1;
      }
      return 0;
    })
    .reduce<Record<string, string>>((notes, profile) => {
      Object.entries(profile.groupFreeTimeNotes ?? {}).forEach(([key, note]) => {
        if (note.trim()) {
          notes[key] = note;
        }
      });

      return notes;
    }, {});

export const getTimedArtist = (
  artist: Artist,
  setTimes: SetTimeMap,
  supportMap?: Map<string, ArtistSupport>,
): TimedArtist | undefined => {
  const time = getEffectiveTime(artist, setTimes);
  const bounds = getTimeBounds(time);

  if (!bounds) {
    return undefined;
  }

  return {
    artist,
    start: bounds.start,
    end: bounds.end,
    supporters: supportMap?.get(artist.id),
  };
};

export const getStageLabel = (artist: Artist) =>
  getStage(artist.stage)?.shortName ?? getStage(artist.stage)?.name ?? artist.stage;

export const getSupportText = (support?: ArtistSupport) => {
  if (!support || support.supporters.length === 0) {
    return "";
  }

  return support.supporters.join(", ");
};

export const getStageTransferTextBetween = (
  from: TimedArtist | null | undefined,
  to: TimedArtist | null | undefined,
  minutes: number,
) => {
  if (!from || !to || from.artist.stage === to.artist.stage) {
    return "";
  }

  const fromStage = getStageLabel(from.artist);
  const toStage = getStageLabel(to.artist);

  if (minutes <= 0) {
    return `No time to get from ${fromStage} to ${toStage}.`;
  }

  return `You have ${formatDuration(minutes)} to get from ${fromStage} to ${toStage}.`;
};

export const getStageTransferText = (gap: ScheduleGap) =>
  getStageTransferTextBetween(gap.comingFrom, gap.goingTo, gap.end - gap.start);

export const getDirectStageTransfers = (attending: TimedArtist[]) =>
  attending.slice(1).reduce<StageTransfer[]>((transfers, item, index) => {
    const previous = attending[index];
    const minutes = item.start - previous.end;
    const text = minutes <= 0 && previous.artist.stage !== item.artist.stage
      ? `No time between ${previous.artist.name} (${getStageLabel(previous.artist)}) and ${item.artist.name} (${getStageLabel(item.artist)}).`
      : "";

    if (text) {
      transfers.push({
        id: `${previous.artist.id}-${item.artist.id}`,
        from: previous,
        to: item,
        minutes,
        text,
      });
    }

    return transfers;
  }, []);

export const getSupportMap = (profiles: ProfilePlan[]) => {
  const supportMap = new Map<string, ArtistSupport>();

  profiles.forEach((profile) => {
    Object.entries(profile.intents).forEach(([artistId, intent]) => {
      const current = supportMap.get(artistId) ?? { supporters: [], definiteSupporters: [] };

      current.supporters.push(profile.name);

      if (intent === "definite") {
        current.definiteSupporters.push(profile.name);
      }

      supportMap.set(artistId, current);
    });
  });

  return supportMap;
};

export const getArtistsFromIntents = (
  intents: IntentMap,
  dayId?: Artist["day"],
  artists: Artist[] = lineup,
) =>
  artists.filter((artist) => Boolean(intents[artist.id]) && (!dayId || artist.day === dayId));

export const getGroupArtists = (
  profiles: ProfilePlan[],
  dayId?: Artist["day"],
  artists: Artist[] = lineup,
) => {
  const artistIds = new Set(profiles.flatMap((profile) => Object.keys(profile.intents)));

  return artists.filter((artist) => artistIds.has(artist.id) && (!dayId || artist.day === dayId));
};

export const getDecisionExcludedIds = (
  artists: Artist[],
  setTimes: SetTimeMap,
  clashDecisions: ClashDecisionMap,
) => {
  const excludedIds = new Set<string>();

  getAllClashes(artists, setTimes).forEach((clash) => {
    const chosenArtistId = clashDecisions[clash.id];

    if (chosenArtistId === clash.first.id) {
      excludedIds.add(clash.second.id);
    }

    if (chosenArtistId === clash.second.id) {
      excludedIds.add(clash.first.id);
    }
  });

  return excludedIds;
};

export const getAttendingArtists = (
  artists: Artist[],
  setTimes: SetTimeMap,
  clashDecisions: ClashDecisionMap,
) => {
  const excludedIds = getDecisionExcludedIds(artists, setTimes, clashDecisions);
  const attending = artists.filter((artist) => !excludedIds.has(artist.id));

  return { attending, excludedIds };
};

const findBookend = (artists: TimedArtist[], minutes: number, field: "start" | "end") =>
  artists.find((item) => item[field] === minutes) ?? null;

export const getPlayingDuringGap = (
  dayId: Artist["day"],
  start: number,
  end: number,
  setTimes: SetTimeMap,
  blockedArtistIds: Set<string>,
  supportMap?: Map<string, ArtistSupport>,
  artists: Artist[] = lineup,
) =>
  artists
    .filter((artist) => artist.day === dayId && !blockedArtistIds.has(artist.id))
    .map((artist) => getTimedArtist(artist, setTimes, supportMap))
    .filter((artist): artist is TimedArtist => Boolean(artist))
    .filter((artist) => artist.start < end && artist.end > start)
    .sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }

      return a.artist.order - b.artist.order;
    });

export const buildScheduleDay = (
  dayId: Artist["day"],
  pickedArtists: Artist[],
  setTimes: SetTimeMap,
  clashDecisions: ClashDecisionMap,
  windowStartMins: number,
  windowEndMins: number,
  supportMap?: Map<string, ArtistSupport>,
  availableArtists: Artist[] = lineup,
): ScheduleDay => {
  const { attending, excludedIds } = getAttendingArtists(pickedArtists, setTimes, clashDecisions);
  const timedAttending = attending
    .map((artist) => getTimedArtist(artist, setTimes, supportMap))
    .filter((artist): artist is TimedArtist => Boolean(artist))
    .sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }

      return a.artist.order - b.artist.order;
    });

  const blockedArtistIds = new Set(pickedArtists.map((artist) => artist.id));
  const gaps: ScheduleGap[] = [];
  let cursor = windowStartMins;

  timedAttending.forEach((item) => {
    if (item.end <= windowStartMins || item.start >= windowEndMins) {
      return;
    }

    const setStart = Math.max(item.start, windowStartMins);
    const setEnd = Math.min(item.end, windowEndMins);

    if (setStart > cursor) {
      gaps.push({
        start: cursor,
        end: setStart,
        comingFrom: findBookend(timedAttending, cursor, "end"),
        goingTo: item,
        playing: getPlayingDuringGap(dayId, cursor, setStart, setTimes, blockedArtistIds, supportMap, availableArtists),
      });
    }

    cursor = Math.max(cursor, setEnd);
  });

  if (cursor < windowEndMins) {
    gaps.push({
      start: cursor,
      end: windowEndMins,
      comingFrom: findBookend(timedAttending, cursor, "end"),
      goingTo: null,
      playing: getPlayingDuringGap(dayId, cursor, windowEndMins, setTimes, blockedArtistIds, supportMap, availableArtists),
    });
  }

  return {
    dayId,
    attending: timedAttending,
    gaps,
    pickedCount: pickedArtists.length,
    excludedCount: excludedIds.size,
  };
};
