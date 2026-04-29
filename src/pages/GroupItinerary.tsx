import { CalendarDays, List } from "lucide-react";
import { useMemo, useState } from "react";
import { ScheduleDayView, type ScheduleViewMode } from "../components/ScheduleDayView";
import { festivalDays } from "../data/lineup";
import type { ClashDecisionMap, FestivalExport, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { getAllClashes } from "../utils/clash";
import { getGroupClashDecisionMap } from "../utils/groupVotes";
import { loadFreeTimeWindow } from "../utils/localStorage";
import { buildScheduleDay, getGroupArtists, getSupportMap } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

interface GroupItineraryProps {
  intents: IntentMap;
  profileName: string;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  groupClashVotes: ClashDecisionMap;
  groupCode: string;
}

export const GroupItinerary = ({
  intents,
  profileName,
  setTimes,
  imports,
  syncedImports,
  groupClashVotes,
  groupCode,
}: GroupItineraryProps) => {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("list");
  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const profiles = useMemo<ProfilePlan[]>(
    () => [
      { id: "local", name: profileName || "Me", intents, setTimes, groupClashVotes, groupCode },
      ...syncedImports.map((item, index) => ({
        id: `synced-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
      ...imports.map((item, index) => ({
        id: `imported-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
    ],
    [groupClashVotes, groupCode, imports, intents, profileName, setTimes, syncedImports],
  );

  const combinedSetTimes = useMemo(
    () => profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {}),
    [profiles],
  );

  const supportMap = useMemo(() => getSupportMap(profiles), [profiles]);

  const groupDecisionMap = useMemo(() => {
    const groupArtists = getGroupArtists(profiles);
    const groupClashes = getAllClashes(groupArtists, combinedSetTimes);

    return getGroupClashDecisionMap(groupClashes, profiles);
  }, [combinedSetTimes, profiles]);

  const schedules = useMemo(
    () =>
      festivalDays.map((day) =>
        buildScheduleDay(
          day.id,
          getGroupArtists(profiles, day.id),
          combinedSetTimes,
          groupDecisionMap,
          windowStartMins,
          windowEndMins,
          supportMap,
        ),
      ),
    [combinedSetTimes, groupDecisionMap, profiles, supportMap, windowEndMins, windowStartMins],
  );

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Everyone's route</p>
          <h1>Group Itinerary</h1>
        </div>
        <div className="view-toggle" aria-label="Group itinerary view">
          <button
            type="button"
            className={viewMode === "list" ? "is-active" : ""}
            onClick={() => setViewMode("list")}
          >
            <List size={18} />
            List
          </button>
          <button
            type="button"
            className={viewMode === "timetable" ? "is-active" : ""}
            onClick={() => setViewMode("timetable")}
          >
            <CalendarDays size={18} />
            Timetable
          </button>
        </div>
      </section>

      {schedules.map((schedule) => (
        <ScheduleDayView key={schedule.dayId} schedule={schedule} showSupporters viewMode={viewMode} />
      ))}
    </main>
  );
};
