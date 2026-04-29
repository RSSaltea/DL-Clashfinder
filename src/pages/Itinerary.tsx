import { CalendarDays, Download, Layers, List, StretchHorizontal } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { TimetableView } from "../components/TimetableView";
import { festivalDays, getDay, lineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, IntentMap, SetTimeMap } from "../types";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

type ItineraryDayFilter = "all" | DayId;
type ViewMode = "list" | "vertical" | "horizontal";

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

  const visibleDays = useMemo(
    () => festivalDays.filter((d) => dayFilter === "all" || d.id === dayFilter),
    [dayFilter],
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
            <button
              type="button"
              className={`secondary-button${viewMode === "list" ? " is-active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={16} />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`secondary-button${viewMode === "vertical" ? " is-active" : ""}`}
              onClick={() => setViewMode("vertical")}
            >
              <CalendarDays size={16} />
              <span>Vertical</span>
            </button>
            <button
              type="button"
              className={`secondary-button${viewMode === "horizontal" ? " is-active" : ""}`}
              onClick={() => setViewMode("horizontal")}
            >
              <StretchHorizontal size={16} />
              <span>Horizontal</span>
            </button>
            {viewMode === "horizontal" && (
              <button
                type="button"
                className={`secondary-button${showStages ? " is-active" : ""}`}
                onClick={toggleStages}
              >
                <Layers size={16} />
                <span>Stages</span>
              </button>
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
        {viewMode === "horizontal"
          ? visibleDays.map((day) => (
              <div key={day.id} className="day-group">
                <div className="day-heading">
                  <h2>{getDay(day.id as DayId)?.label}</h2>
                </div>
                <TimetableView
                  day={day.id as DayId}
                  intents={intents}
                  setTimes={setTimes}
                  showStages={showStages}
                  hideUnpicked
                />
              </div>
            ))
          : visibleSchedules.map((schedule) => (
              <ScheduleDayView
                key={schedule.dayId}
                schedule={schedule}
                viewMode={viewMode === "vertical" ? "timetable" : "list"}
              />
            ))}
      </div>
    </main>
  );
};
