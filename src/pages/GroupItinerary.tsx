import { useMemo } from "react";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { festivalDays } from "../data/lineup";
import type { ClashDecisionMap, FestivalExport, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { loadFreeTimeWindow } from "../utils/localStorage";
import { buildScheduleDay, getGroupArtists, getSupportMap } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

interface GroupItineraryProps {
  intents: IntentMap;
  profileName: string;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  clashDecisions: ClashDecisionMap;
  groupCode: string;
}

export const GroupItinerary = ({
  intents,
  profileName,
  setTimes,
  imports,
  syncedImports,
  clashDecisions,
  groupCode,
}: GroupItineraryProps) => {
  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const profiles = useMemo<ProfilePlan[]>(
    () => [
      { id: "local", name: profileName || "Me", intents, setTimes, clashDecisions, groupCode },
      ...syncedImports.map((item, index) => ({
        id: `synced-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        clashDecisions: item.clashDecisions,
        groupCode: item.groupCode,
      })),
      ...imports.map((item, index) => ({
        id: `imported-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        clashDecisions: item.clashDecisions,
        groupCode: item.groupCode,
      })),
    ],
    [clashDecisions, groupCode, imports, intents, profileName, setTimes, syncedImports],
  );

  const combinedSetTimes = useMemo(
    () => profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {}),
    [profiles],
  );

  const supportMap = useMemo(() => getSupportMap(profiles), [profiles]);

  const schedules = useMemo(
    () =>
      festivalDays.map((day) =>
        buildScheduleDay(
          day.id,
          getGroupArtists(profiles, day.id),
          combinedSetTimes,
          clashDecisions,
          windowStartMins,
          windowEndMins,
          supportMap,
        ),
      ),
    [clashDecisions, combinedSetTimes, profiles, supportMap, windowEndMins, windowStartMins],
  );

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Everyone's route</p>
          <h1>Group Itinerary</h1>
        </div>
        <p className="muted">Uses synced/imported plans, group clash choices, and the Free Time window.</p>
      </section>

      {schedules.map((schedule) => (
        <ScheduleDayView key={schedule.dayId} schedule={schedule} showSupporters />
      ))}
    </main>
  );
};
