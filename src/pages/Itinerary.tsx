import { Download, Layers, List, StretchHorizontal } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { TimetableView } from "../components/TimetableView";
import { festivalDays, lineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, IntentMap, SetTimeMap } from "../types";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

type ItineraryDayFilter = "all" | DayId;
type ViewMode = "list" | "timetable";

interface ItineraryProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
}

export const Itinerary = ({ intents, setTimes, clashDecisions }: ItineraryProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [dayFilter, setDayFilter] = useState<ItineraryDayFilter>("all");
  const [showStages, setShowStages] = useState(() => loadTimetableStages());
  const [exportState, setExportState] = useState<"idle" | "saving" | "error">("idle");
  const exportRef = useRef<HTMLDivElement>(null);
  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const switchToTimetable = () => {
    if (dayFilter === "all") setDayFilter(festivalDays[0].id);
    setViewMode("timetable");
  };

  const timetableDay = (dayFilter === "all" ? festivalDays[0].id : dayFilter) as DayId;

  const toggleStages = () => {
    const next = !showStages;
    setShowStages(next);
    saveTimetableStages(next);
  };

  const schedules = useMemo(
    () =>
      festivalDays.map((day) => {
        const pickedOnDay = lineup.filter((artist) => artist.day === day.id && Boolean(intents[artist.id]));
        return buildScheduleDay(day.id, pickedOnDay, setTimes, clashDecisions, windowStartMins, windowEndMins);
      }),
    [clashDecisions, intents, setTimes, windowEndMins, windowStartMins],
  );

  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => dayFilter === "all" || schedule.dayId === dayFilter),
    [dayFilter, schedules],
  );

  const exportItinerary = async () => {
    if (!exportRef.current) return;
    setExportState("saving");
    try {
      await downloadElementAsPng(exportRef.current, `download-2026-itinerary-${dayFilter}.png`);
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
        <div className="toolbar-right">
          <div className="view-mode-buttons">
            {viewMode === "list" ? (
              <button type="button" className="secondary-button" onClick={switchToTimetable}>
                <StretchHorizontal size={16} />
                <span>Timetable</span>
              </button>
            ) : (
              <>
                <button type="button" className="secondary-button" onClick={() => setViewMode("list")}>
                  <List size={16} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  className={`secondary-button${showStages ? " is-active" : ""}`}
                  onClick={toggleStages}
                >
                  <Layers size={16} />
                  <span>Stages</span>
                </button>
              </>
            )}
          </div>
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

        {viewMode === "list" && (
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
        )}
      </section>

      {exportState === "error" && (
        <p className="error-banner">Could not save the image.</p>
      )}

      {viewMode === "timetable" ? (
        <TimetableView day={timetableDay} intents={intents} setTimes={setTimes} showStages={showStages} />
      ) : (
        <div className="itinerary-export-area" ref={exportRef}>
          {visibleSchedules.map((schedule) => (
            <ScheduleDayView key={schedule.dayId} schedule={schedule} viewMode="list" />
          ))}
        </div>
      )}
    </main>
  );
};
