import { Download } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ItineraryViewControls, type ItineraryViewMode } from "../components/ItineraryViewControls";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { TimetableView } from "../components/TimetableView";
import { festivalDays, getDay } from "../data/lineup";
import type { ClashDecisionMap, DayId, FestivalExport, Intent, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { getAllClashes } from "../utils/clash";
import { getGroupClashDecisionMap } from "../utils/groupVotes";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay, getGroupArtists, getSupportMap } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

type ItineraryDayFilter = "all" | DayId;

interface GroupItineraryProps {
  intents: IntentMap;
  profileName: string;
  accountUsername?: string;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  groupClashVotes: ClashDecisionMap;
  groupCode: string;
}

export const GroupItinerary = ({
  intents,
  profileName,
  accountUsername = "",
  setTimes,
  imports,
  syncedImports,
  groupClashVotes,
  groupCode,
}: GroupItineraryProps) => {
  const [viewMode, setViewMode] = useState<ItineraryViewMode>("list");
  const [dayFilter, setDayFilter] = useState<ItineraryDayFilter>("all");
  const [showStages, setShowStages] = useState(() => loadTimetableStages());
  const [freeTimeOnly, setFreeTimeOnly] = useState(false);
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

  const profiles = useMemo<ProfilePlan[]>(
    () => [
      { id: "local", name: profileName || "Me", accountUsername, intents, setTimes, groupClashVotes, groupCode },
      ...syncedImports.map((item, index) => ({
        id: `synced-${item.profileName}-${index}`,
        name: item.profileName,
        accountUsername: item.accountUsername,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
      ...imports.map((item, index) => ({
        id: `imported-${item.profileName}-${index}`,
        name: item.profileName,
        accountUsername: item.accountUsername,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
    ],
    [accountUsername, groupClashVotes, groupCode, imports, intents, profileName, setTimes, syncedImports],
  );

  const combinedSetTimes = useMemo(
    () => profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {}),
    [profiles],
  );

  // Merged intents: any member's definite → definite; otherwise interested
  const groupIntents = useMemo(() => {
    const merged: IntentMap = {};
    for (const profile of profiles) {
      for (const [artistId, intent] of Object.entries(profile.intents)) {
        if (!merged[artistId] || intent === "definite") {
          merged[artistId] = intent as Intent;
        }
      }
    }
    return merged;
  }, [profiles]);

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
      await downloadElementAsPng(exportRef.current, `download-2026-group-itinerary-${dayFilter}.png`);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  };

  return (
    <main className="page-shell">
      <section className="toolbar-band itinerary-toolbar">
        <div>
          <p className="eyebrow">Everyone's route</p>
          <h1>Group Itinerary</h1>
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

      <section className="filters-panel itinerary-filters" aria-label="Group itinerary filters">
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
                  intents={groupIntents}
                  setTimes={combinedSetTimes}
                  showStages={showStages}
                  hideUnpicked
                  freeTimeOnly={freeTimeOnly}
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
                showSupporters
                viewMode={viewMode === "vertical" ? "timetable" : "list"}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
              />
            ))}
      </div>
    </main>
  );
};
