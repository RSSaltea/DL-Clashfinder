import { Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CombinedTimetableView } from "../components/CombinedTimetableView";
import { ItineraryViewControls, type ItineraryViewMode } from "../components/ItineraryViewControls";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { getFestivalDays, getFestivalStages, getLineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, FreeTimeNoteMap, IntentMap, SetTimeMap } from "../types";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

interface ItineraryProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
  freeTimeNotes: FreeTimeNoteMap;
  onFreeTimeNoteChange: (noteKey: string, value: string) => void;
  includeDistrictX: boolean;
}

export const Itinerary = ({
  includeDistrictX,
  intents,
  setTimes,
  clashDecisions,
  freeTimeNotes,
  onFreeTimeNoteChange,
}: ItineraryProps) => {
  const [viewMode, setViewMode] = useState<ItineraryViewMode>("list");
  const [selectedDayIds, setSelectedDayIds] = useState<DayId[]>(() =>
    getFestivalDays(includeDistrictX).map((day) => day.id),
  );
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
  const availableDayIds = useMemo(() => availableDays.map((day) => day.id), [availableDays]);
  const allDaysSelected = selectedDayIds.length === availableDayIds.length && availableDayIds.length > 0;
  const selectedDaySet = useMemo(() => new Set(selectedDayIds), [selectedDayIds]);

  useEffect(() => {
    setSelectedDayIds((current) => {
      if (current.length === 0) return [];
      const available = new Set(availableDayIds);
      const stillAvailable = current.filter((dayId) => available.has(dayId));
      return stillAvailable.length > 0 ? stillAvailable : availableDayIds;
    });
  }, [availableDayIds]);

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
    () => schedules.filter((schedule) => selectedDaySet.has(schedule.dayId)),
    [schedules, selectedDaySet],
  );

  const visibleDays = useMemo(
    () => availableDays.filter((day) => selectedDaySet.has(day.id)),
    [availableDays, selectedDaySet],
  );

  const selectedDaySlug = allDaysSelected
    ? "all"
    : selectedDayIds.length > 0
      ? selectedDayIds.join("-")
      : "no-days";

  const toggleAllDays = () => {
    setSelectedDayIds(allDaysSelected ? [] : availableDayIds);
  };

  const toggleDay = (dayId: DayId) => {
    setSelectedDayIds((current) => {
      const next = current.includes(dayId)
        ? current.filter((id) => id !== dayId)
        : [...current, dayId];
      const nextSet = new Set(next);
      return availableDayIds.filter((id) => nextSet.has(id));
    });
  };

  const exportItinerary = async () => {
    if (!exportRef.current) return;
    setExportState("saving");
    try {
      await downloadElementAsPng(exportRef.current, `download-2026-itinerary-${selectedDaySlug}.png`);
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
            className={allDaysSelected ? "is-active" : ""}
            onClick={toggleAllDays}
          >
            All
          </button>
          {availableDays.map((day) => (
            <button
              key={day.id}
              type="button"
              className={selectedDaySet.has(day.id) ? "is-active" : ""}
              onClick={() => toggleDay(day.id)}
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
          ? (
              <CombinedTimetableView
                days={visibleDays}
                schedules={visibleSchedules}
                intents={intents}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
                getStagesForDay={getStagesForDay}
                freeTimeNotes={freeTimeNotes}
                onFreeTimeNoteChange={onFreeTimeNoteChange}
                canEditFreeTimeNotes
              />
            )
          : visibleSchedules.length === 0 ? (
              <div className="empty-state tight">
                <p className="muted">No days selected.</p>
              </div>
            )
          : visibleSchedules.map((schedule) => (
              <ScheduleDayView
                key={schedule.dayId}
                schedule={schedule}
                viewMode={viewMode === "vertical" ? "timetable" : "list"}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
                stages={getStagesForDay(schedule.dayId)}
                freeTimeNotes={freeTimeNotes}
                onFreeTimeNoteChange={onFreeTimeNoteChange}
                canEditFreeTimeNotes
              />
            ))}
      </div>
    </main>
  );
};
