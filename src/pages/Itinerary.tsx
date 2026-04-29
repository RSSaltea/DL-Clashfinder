import { CalendarDays, Download, List } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ScheduleDayView, type ScheduleViewMode } from "../components/ScheduleDayView";
import { festivalDays, lineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, IntentMap, SetTimeMap } from "../types";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

type ItineraryDayFilter = "all" | DayId;

interface ItineraryProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
}

export const Itinerary = ({ intents, setTimes, clashDecisions }: ItineraryProps) => {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("list");
  const [dayFilter, setDayFilter] = useState<ItineraryDayFilter>("all");
  const [exportState, setExportState] = useState<"idle" | "saving" | "error">("idle");
  const exportRef = useRef<HTMLDivElement>(null);
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

  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => dayFilter === "all" || schedule.dayId === dayFilter),
    [dayFilter, schedules],
  );

  const exportItinerary = async () => {
    if (!exportRef.current) {
      return;
    }

    setExportState("saving");

    try {
      await downloadElementAsPng(
        exportRef.current,
        `download-2026-itinerary-${dayFilter}.png`,
      );
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  };

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Your day-by-day route</p>
          <h1>Itinerary</h1>
        </div>
        <div className="view-toggle" aria-label="Itinerary view">
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

      <section className="filters-panel itinerary-filters" aria-label="Itinerary filters">
        <div className="segmented-control">
          <button
            type="button"
            className={dayFilter === "all" ? "is-active" : ""}
            onClick={() => setDayFilter("all")}
          >
            All
          </button>
          {festivalDays.map((day) => (
            <button
              key={day.id}
              type="button"
              className={dayFilter === day.id ? "is-active" : ""}
              onClick={() => setDayFilter(day.id)}
            >
              {day.shortLabel}
            </button>
          ))}
        </div>

        <button
          className="secondary-button"
          type="button"
          data-export-hidden="true"
          disabled={exportState === "saving"}
          onClick={exportItinerary}
        >
          <Download size={18} />
          {exportState === "saving" ? "Saving..." : "Export image"}
        </button>
      </section>

      {exportState === "error" && (
        <p className="error-banner">Could not save the image. Try switching to List view and exporting again.</p>
      )}

      <div className="itinerary-export-area" ref={exportRef}>
        {visibleSchedules.map((schedule) => (
          <ScheduleDayView key={schedule.dayId} schedule={schedule} viewMode={viewMode} />
        ))}
      </div>
    </main>
  );
};
