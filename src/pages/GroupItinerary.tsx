import { Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CombinedTimetableView } from "../components/CombinedTimetableView";
import { ItineraryViewControls, type ItineraryViewMode } from "../components/ItineraryViewControls";
import { ScheduleDayView } from "../components/ScheduleDayView";
import { getFestivalDays, getFestivalStages, getLineup } from "../data/lineup";
import type { ClashDecisionMap, DayId, FestivalExport, FreeTimeNoteMap, GroupMemberRole, Intent, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { getAllClashes } from "../utils/clash";
import { getGroupClashDecisionMap } from "../utils/groupVotes";
import { downloadElementAsPng } from "../utils/imageExport";
import { loadFreeTimeWindow, loadTimetableStages, saveTimetableStages } from "../utils/localStorage";
import { buildScheduleDay, getGroupArtists, getSupportMap, mergeGroupFreeTimeNotes } from "../utils/schedule";
import { timeToMinutes, windowEndToMins } from "../utils/time";

interface GroupItineraryProps {
  intents: IntentMap;
  profileName: string;
  accountUsername?: string;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  groupClashVotes: ClashDecisionMap;
  groupCode: string;
  myGroupRole: GroupMemberRole;
  groupFreeTimeNotes: FreeTimeNoteMap;
  onGroupFreeTimeNoteChange: (noteKey: string, value: string) => void;
  includeDistrictX: boolean;
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
  myGroupRole,
  groupFreeTimeNotes,
  onGroupFreeTimeNoteChange,
  includeDistrictX,
}: GroupItineraryProps) => {
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

  const profiles = useMemo<ProfilePlan[]>(
    () => [
      {
        id: "local",
        name: profileName || "Me",
        accountUsername,
        intents,
        setTimes,
        groupClashVotes,
        groupCode,
        groupFreeTimeNotes,
        groupRole: myGroupRole,
      },
      ...syncedImports.map((item, index) => ({
        id: `synced-${item.profileName}-${index}`,
        name: item.profileName,
        accountUsername: item.accountUsername,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
        groupFreeTimeNotes: item.groupFreeTimeNotes,
        groupRole: item.groupRole,
      })),
      ...imports.map((item, index) => ({
        id: `imported-${item.profileName}-${index}`,
        name: item.profileName,
        accountUsername: item.accountUsername,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
        groupFreeTimeNotes: item.groupFreeTimeNotes,
        groupRole: item.groupRole,
      })),
    ],
    [accountUsername, groupClashVotes, groupCode, groupFreeTimeNotes, imports, intents, myGroupRole, profileName, setTimes, syncedImports],
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
  const mergedGroupFreeTimeNotes = useMemo(() => mergeGroupFreeTimeNotes(profiles), [profiles]);
  const canEditGroupFreeTimeNotes = Boolean(groupCode) && (myGroupRole === "leader" || myGroupRole === "admin");

  const groupDecisionMap = useMemo(() => {
    const groupArtists = getGroupArtists(profiles, undefined, visibleLineup);
    const groupClashes = getAllClashes(groupArtists, combinedSetTimes);
    return getGroupClashDecisionMap(groupClashes, profiles);
  }, [combinedSetTimes, profiles, visibleLineup]);

  const schedules = useMemo(
    () =>
      availableDays.map((day) =>
        buildScheduleDay(
          day.id,
          getGroupArtists(profiles, day.id, visibleLineup),
          combinedSetTimes,
          groupDecisionMap,
          windowStartMins,
          windowEndMins,
          supportMap,
          visibleLineup,
        ),
      ),
    [availableDays, combinedSetTimes, groupDecisionMap, profiles, supportMap, visibleLineup, windowEndMins, windowStartMins],
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
      await downloadElementAsPng(exportRef.current, `download-2026-group-itinerary-${selectedDaySlug}.png`);
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

      {groupCode && !canEditGroupFreeTimeNotes && (
        <p className="muted" style={{ marginBottom: "0.85rem" }}>
          Group free-time labels can be edited by the group leader or admins.
        </p>
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
                intents={groupIntents}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
                getStagesForDay={getStagesForDay}
                freeTimeNotes={mergedGroupFreeTimeNotes}
                onFreeTimeNoteChange={onGroupFreeTimeNoteChange}
                canEditFreeTimeNotes={canEditGroupFreeTimeNotes}
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
                showSupporters
                viewMode={viewMode === "vertical" ? "timetable" : "list"}
                showStages={showStages}
                freeTimeOnly={freeTimeOnly}
                stages={getStagesForDay(schedule.dayId)}
                freeTimeNotes={mergedGroupFreeTimeNotes}
                onFreeTimeNoteChange={onGroupFreeTimeNoteChange}
                canEditFreeTimeNotes={canEditGroupFreeTimeNotes}
              />
            ))}
      </div>
    </main>
  );
};
