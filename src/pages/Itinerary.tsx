import { useMemo } from "react";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { festivalDays, lineup } from "../data/lineup";
import type { ClashDecisionMap, IntentMap, SetTimeMap } from "../types";
import { loadFreeTimeWindow } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

interface ItineraryProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
}

export const Itinerary = ({ intents, setTimes, clashDecisions }: ItineraryProps) => {
  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const schedules = useMemo(
    () =>
      festivalDays.map((day) => {
        const pickedOnDay = lineup.filter((artist) => artist.day === day.id && Boolean(intents[artist.id]));

        return buildScheduleDay(
          day.id,
          pickedOnDay,
          setTimes,
          clashDecisions,
          windowStartMins,
          windowEndMins,
        );
      }),
    [clashDecisions, intents, setTimes, windowEndMins, windowStartMins],
  );

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Your day-by-day route</p>
          <h1>Itinerary</h1>
        </div>
        <p className="muted">Uses your clash choices and the Free Time window.</p>
      </section>

      {schedules.map((schedule) => (
        <ScheduleDayView key={schedule.dayId} schedule={schedule} />
      ))}
    </main>
  );
};
