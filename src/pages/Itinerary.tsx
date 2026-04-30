import { Download } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ItineraryViewControls, type ItineraryViewMode } from "../components/ItineraryViewControls";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { TimetableView } from "../components/TimetableView";
import { getDay, getFestivalDays, getFestivalStages, getLineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, IntentMap, SetTimeMap } from "../types";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

type ItineraryDayFilter = "all" | DayId;

interface ItineraryProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
  includeDistrictX: boolean;
}

export const Itinerary = ({ includeDistrictX, intents, setTimes, clashDecisions }: ItineraryProps) => {
  const [viewMode, setViewMode] = useState<ItineraryViewMode>("list");
  const [dayFilter, setDayFilter] = useState<ItineraryDayFilter>("all");
  const [showStages, setShowStages] = useState(() => loadTimetableStages());
  const [freeTimeOnly, setFreeTimeOnly] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "saving" | "error">("idle");
  const exportRef = useRef<HTMLDivElement>(null);
  const availableDays = useMemo(() => getFestivalDays(includeDistrictX), [includeDistrictX]);
  const visibleStages = useMemo(() => getFestivalStages(includeDistrictX), [includeDistrictX]);
  const visibleLineup = useMemo(() => getLineup(includeDistrictX), [includeDistrictX]);
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
      availableDays.map((day) => {
        const pickedOnDay = visibleLineup.filter((artist) => artist.day === day.id && Boolean(intents[artist.id]));
        return buildScheduleDay(day.id, pickedOnDay, setTimes, clashDecisions, windowStartMins, windowEndMins, undefined, visibleLineup);
      }),
    [availableDays, clashDecisions, intents, setTimes, visibleLineup, windowEndMins, windowStartMins],
  );

  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => dayFilter === "all" || schedule.dayId === dayFilter),
    [dayFilter, schedules],
  );

  const visibleDays = useMemo(
    () => availableDays.filter((d) => dayFilter === "all" || d.id === dayFilter),
    [availableDays, dayFilter],
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

  const getStagesForDay = (dayId: DayId) => {
    const stageIds = new Set(visibleLineup.filter((artist) => artist.day === dayId).map((artist) => artist.stage));
    const stagesForDay = visibleStages.filter((stage) => stageIds.has(stage.id));
    return stagesForDay.length > 0 ? stagesForDay : visibleStages;
  };

  return (
    <main className="page-shell">
      <section className="toolbar-band itinerary-toolbar">
        <div>
          <p className="eyebrow">Your day-by-day route</p>
          <h1>Itinerary</h1>
        </div>
        <div className="toolbar-right">
          <ItineraryViewControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showStages={showStages}
            onToggleStages={toggleStages}
            freeTimeOnly={freeTimeOnly}
            onToggleFreeTime={() => setFreeTimeOnly((v) => !v)}
          />
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
          {availableDays.map((day) => (
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

      <div
        className={`itinerary-export-area${viewMode === "horizontal" ? " itinerary-export-area--horizontal" : ""}`}
        ref={exportRef}
      >
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
                  freeTimeOnly={freeTimeOnly}
                  artists={visibleLineup}
                  stages={getStagesForDay(day.id as DayId)}
                  artistIds={schedules
                    .find((schedule) => schedule.dayId === day.id)
                    ?.attending.map((item) => item.artist.id)}
                  freeTimeGaps={schedules
                    .find((schedule) => schedule.dayId === day.id)
                    ?.gaps.map((gap) => ({ start: gap.start, end: gap.end }))}
                />
              </div>
            ))
          : visibleSchedules.map((schedule) => (
              <ScheduleDayView
                key={schedule.dayId}
                schedule={schedule}
                viewMode={viewMode === "vertical" ? "timetable" : "list"}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
                stages={getStagesForDay(schedule.dayId)}
              />
            ))}
      </div>
    </main>
  );
};
