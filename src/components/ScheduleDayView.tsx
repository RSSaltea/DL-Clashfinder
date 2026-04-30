import type { CSSProperties } from "react";
import { festivalStages, getDay } from "../data/lineup";
import type { FestivalStage, FreeTimeNoteMap } from "../types";
import type { ScheduleDay, ScheduleGap, TimedArtist } from "../utils/schedule";
import { getDirectStageTransfers, getFreeTimeNoteKey, getStageLabel, getStageTransferText, getSupportText } from "../utils/schedule";
import { formatDuration, minutesToTime } from "../utils/time";

type ScheduleSegment =
  | { type: "set"; key: string; start: number; item: TimedArtist }
  | { type: "gap"; key: string; start: number; item: ScheduleGap };

interface TimetableSetLayout {
  lane: number;
  laneCount: number;
}

interface ScheduleDayViewProps {
  schedule: ScheduleDay;
  showSupporters?: boolean;
  viewMode?: ScheduleViewMode;
  showStages?: boolean;
  freeTimeOnly?: boolean;
  stages?: FestivalStage[];
  freeTimeNotes?: FreeTimeNoteMap;
  onFreeTimeNoteChange?: (noteKey: string, value: string) => void;
  canEditFreeTimeNotes?: boolean;
}

export type ScheduleViewMode = "list" | "timetable";

const formatRange = (start: number, end: number) =>
  `${minutesToTime(start)} - ${end === 1440 ? "00:00" : minutesToTime(end)}`;

const getSegmentEnd = (segment: ScheduleSegment) => segment.item.end;

const renderTransferNote = (text: string, className = "") =>
  text ? <p className={`transfer-note${className ? ` ${className}` : ""}`}>{text}</p> : null;

const getTimetableSetLayouts = (items: TimedArtist[]) => {
  const layouts = new Map<string, TimetableSetLayout>();
  const sorted = [...items].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return a.end - b.end;
    return a.artist.order - b.artist.order;
  });

  const applyClusterLayout = (cluster: TimedArtist[]) => {
    const laneEnds: number[] = [];
    const clusteredLayouts: Array<{ item: TimedArtist; lane: number }> = [];
    cluster.forEach((item) => {
      const freeLane = laneEnds.findIndex((laneEnd) => laneEnd <= item.start);
      const lane = freeLane === -1 ? laneEnds.length : freeLane;
      laneEnds[lane] = item.end;
      clusteredLayouts.push({ item, lane });
    });
    const laneCount = Math.max(1, laneEnds.length);
    clusteredLayouts.forEach(({ item, lane }) => {
      layouts.set(item.artist.id, { lane, laneCount });
    });
  };

  let cluster: TimedArtist[] = [];
  let clusterEnd = -1;
  sorted.forEach((item) => {
    if (cluster.length > 0 && item.start >= clusterEnd) {
      applyClusterLayout(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  });
  if (cluster.length > 0) applyClusterLayout(cluster);
  return layouts;
};

const getTimetableBlockStyle = (top: number, height: number, layout?: TimetableSetLayout): CSSProperties => {
  const style: CSSProperties = { top: `${top}px`, height: `${height}px` };
  if (!layout || layout.laneCount <= 1) return style;
  const laneWidth = 100 / layout.laneCount;
  return {
    ...style,
    left: `calc(${layout.lane * laneWidth}% + ${layout.lane === 0 ? "0rem" : "0.25rem"})`,
    right: "auto",
    width: `calc(${laneWidth}% - 0.35rem)`,
  };
};

export const ScheduleDayView = ({
  schedule,
  showSupporters = false,
  viewMode = "list",
  showStages = false,
  freeTimeOnly = false,
  stages = festivalStages,
  freeTimeNotes = {},
  onFreeTimeNoteChange,
  canEditFreeTimeNotes = false,
}: ScheduleDayViewProps) => {
  const day = getDay(schedule.dayId);
  const directTransfers = getDirectStageTransfers(schedule.attending);
  const directTransferByDestination = new Map(
    directTransfers.map((transfer) => [transfer.to.artist.id, transfer]),
  );
  const gapTransferByDestination = new Map(
    schedule.gaps.flatMap((gap) => {
      const text = getStageTransferText(gap);
      return text && gap.goingTo ? [[gap.goingTo.artist.id, text] as const] : [];
    }),
  );

  const segments: ScheduleSegment[] = [
    ...schedule.attending.map((item) => ({
      type: "set" as const,
      key: `set-${item.artist.id}`,
      start: item.start,
      item,
    })),
    ...schedule.gaps.map((item) => ({
      type: "gap" as const,
      key: `gap-${schedule.dayId}-${item.start}-${item.end}`,
      start: item.start,
      item,
    })),
  ].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.type === "set" ? -1 : 1;
  });

  // When freeTimeOnly, only render gap segments
  const activeSegments = freeTimeOnly ? segments.filter((s) => s.type === "gap") : segments;
  const getGapNoteKey = (gap: ScheduleGap) => getFreeTimeNoteKey(schedule.dayId, gap.start, gap.end);
  const getGapNote = (gap: ScheduleGap) => freeTimeNotes[getGapNoteKey(gap)] ?? "";
  const renderGapNoteInput = (gap: ScheduleGap, className = "") => {
    if (!canEditFreeTimeNotes || !onFreeTimeNoteChange) {
      return null;
    }

    return (
      <label className={`free-time-note-field${className ? ` ${className}` : ""}`}>
        <span>Free time note</span>
        <input
          value={getGapNote(gap)}
          placeholder="Add note e.g. Food Break"
          onChange={(event) => onFreeTimeNoteChange(getGapNoteKey(gap), event.target.value)}
          onClick={(event) => event.stopPropagation()}
        />
      </label>
    );
  };
  const renderGapNotePromptButton = (gap: ScheduleGap) => {
    if (!canEditFreeTimeNotes || !onFreeTimeNoteChange) {
      return null;
    }

    const note = getGapNote(gap);

    return (
      <button
        className="timetable-gap-note-button"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          const next = window.prompt("Free time note", note);
          if (next !== null) {
            onFreeTimeNoteChange(getGapNoteKey(gap), next);
          }
        }}
      >
        {note ? "Edit" : "+"}
      </button>
    );
  };

  const renderList = () => (
    <div className="itinerary-list">
      {activeSegments.map((segment) => {
        if (segment.type === "set") {
          const item = segment.item;
          const supporters = getSupportText(item.supporters);
          const transfer = directTransferByDestination.get(item.artist.id);
          return (
            <article className={`itinerary-item itinerary-item--set stage-${item.artist.stage}`} key={segment.key}>
              <div className="itinerary-time">{formatRange(item.start, item.end)}</div>
              <div>
                <h3>{item.artist.name}</h3>
                <p>
                  {getStageLabel(item.artist)} - starts {minutesToTime(item.start)} - finishes {minutesToTime(item.end)}
                  {showSupporters && supporters ? ` - picked by ${supporters}` : ""}
                </p>
                {transfer && renderTransferNote(transfer.text, "transfer-note--handoff")}
              </div>
            </article>
          );
        }
        const gap = segment.item;
        const duration = formatDuration(gap.end - gap.start);
        const note = getGapNote(gap);
        return (
          <article className="itinerary-item itinerary-item--gap" key={segment.key}>
            <div className="itinerary-time">{formatRange(gap.start, gap.end)}</div>
            <div>
              <div className="free-time-note-heading">
                <h3>{note || `${duration} free`}</h3>
                {note && <span>{duration} free</span>}
              </div>
              {renderGapNoteInput(gap)}
              <div className="gap-mini-grid">
                {gap.comingFrom && (
                  <p>
                    <span>Finishing</span>
                    <strong>{gap.comingFrom.artist.name}</strong>
                    <em>{getStageLabel(gap.comingFrom.artist)} - ends {minutesToTime(gap.start)}</em>
                  </p>
                )}
                {gap.goingTo && (
                  <p>
                    <span>Heading to</span>
                    <strong>{gap.goingTo.artist.name}</strong>
                    <em>{getStageLabel(gap.goingTo.artist)} - starts {minutesToTime(gap.end)}</em>
                  </p>
                )}
              </div>
              {renderTransferNote(getStageTransferText(gap))}
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderTimetable = () => {
    // Use full segments for time bounds so the axis is always correct
    const timelineStart = Math.floor(Math.min(...segments.map((s) => s.start)) / 60) * 60;
    const timelineEnd = Math.ceil(Math.max(...segments.map(getSegmentEnd)) / 60) * 60;
    const timelineDuration = Math.max(timelineEnd - timelineStart, 60);
    const timelineHeight = Math.max(520, timelineDuration * 2.4);
    const pixelsPerMinute = timelineHeight / timelineDuration;
    const ticks = Array.from(
      { length: Math.floor(timelineDuration / 60) + 1 },
      (_, index) => timelineStart + index * 60,
    );
    const quarterTicks = Array.from(
      { length: Math.floor(timelineDuration / 15) },
      (_, index) => timelineStart + (index + 1) * 15,
    ).filter((tick) => tick < timelineEnd && tick % 60 !== 0);
    const setLayouts = getTimetableSetLayouts(schedule.attending);

    return (
      <div className="timetable" style={{ height: `${timelineHeight}px` }}>
        <div className="timetable-axis" aria-hidden="true">
          {ticks.map((tick) => {
            const top = (tick - timelineStart) * pixelsPerMinute;
            return (
              <span key={tick} style={{ top: `${top}px` }}>
                {tick === 1440 ? "00:00" : minutesToTime(tick)}
              </span>
            );
          })}
        </div>
        <div className="timetable-track">
          {quarterTicks.map((tick) => {
            const top = (tick - timelineStart) * pixelsPerMinute;
            return <div className="timetable-line timetable-line--minor" key={tick} style={{ top: `${top}px` }} />;
          })}
          {ticks.map((tick) => {
            const top = (tick - timelineStart) * pixelsPerMinute;
            return <div className="timetable-line" key={tick} style={{ top: `${top}px` }} />;
          })}
          {activeSegments.map((segment) => {
            const start = segment.start;
            const end = getSegmentEnd(segment);
            const duration = end - start;
            const top = (start - timelineStart) * pixelsPerMinute;
            const height = Math.max(duration * pixelsPerMinute - 2, 12);
            const compactClass = duration < 20
              ? " timetable-block--tiny"
              : duration < 35
                ? " timetable-block--short"
                : "";

            if (segment.type === "set") {
              const item = segment.item;
              const supporters = getSupportText(item.supporters);
              const directTransfer = directTransferByDestination.get(item.artist.id);
              const transferText = directTransfer?.text ?? gapTransferByDestination.get(item.artist.id) ?? "";
              const layout = setLayouts.get(item.artist.id);
              const lanedClass = layout && layout.laneCount > 1 ? " timetable-block--laned" : "";
              return (
                <article
                  className={`timetable-block timetable-block--set stage-${item.artist.stage}${compactClass}${lanedClass}`}
                  key={segment.key}
                  style={getTimetableBlockStyle(top, height, layout)}
                >
                  <div className="timetable-block__main">
                    <div className="timetable-block__title">
                      <strong>{item.artist.name}</strong>
                      {showSupporters && supporters && (
                        <em className="timetable-block__supporters">Picked by {supporters}</em>
                      )}
                    </div>
                    <span>{formatRange(item.start, item.end)} - {getStageLabel(item.artist)}</span>
                  </div>
                  {transferText && (
                    <p className={`transfer-note timetable-block__transfer${directTransfer ? " transfer-note--urgent" : ""}`}>
                      {transferText}
                    </p>
                  )}
                </article>
              );
            }
            const gap = segment.item;
            const note = getGapNote(gap);
            return (
              <article
                className={`timetable-block timetable-block--gap${compactClass}`}
                key={segment.key}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="timetable-block__main">
                  <strong>{note || `${formatDuration(gap.end - gap.start)} free`}</strong>
                  <span>{formatRange(gap.start, gap.end)}</span>
                  {note && <em>{formatDuration(gap.end - gap.start)} free</em>}
                </div>
                {duration >= 30
                  ? renderGapNoteInput(gap, "free-time-note-field--timetable")
                  : renderGapNotePromptButton(gap)}
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStagedTimetable = () => {
    const timelineStart = Math.floor(Math.min(...segments.map((s) => s.start)) / 60) * 60;
    const timelineEnd = Math.ceil(Math.max(...segments.map(getSegmentEnd)) / 60) * 60;
    const timelineDuration = Math.max(timelineEnd - timelineStart, 60);
    const timelineHeight = Math.max(520, timelineDuration * 2.4);
    const stagedTopPadding = 18;
    const stagedTimelineHeight = timelineHeight + stagedTopPadding;
    const pixelsPerMinute = timelineHeight / timelineDuration;
    const ticks = Array.from(
      { length: Math.floor(timelineDuration / 60) + 1 },
      (_, index) => timelineStart + index * 60,
    );
    const quarterTicks = Array.from(
      { length: Math.floor(timelineDuration / 15) },
      (_, index) => timelineStart + (index + 1) * 15,
    ).filter((tick) => tick < timelineEnd && tick % 60 !== 0);
    const visibleAttending = freeTimeOnly ? [] : schedule.attending;

    const renderStagedFreeRow = () =>
      schedule.gaps.length > 0 ? (
        <div className="staged-free-row">
          <div className="staged-free-row__label">Free</div>
          <div className="staged-free-row__items">
            {schedule.gaps.map((gap) => {
              const note = getGapNote(gap);

              return (
                <article className="staged-free-chip" key={`staged-gap-${schedule.dayId}-${gap.start}-${gap.end}`}>
                  <strong>{note || `${formatDuration(gap.end - gap.start)} free`}</strong>
                  <span>{formatRange(gap.start, gap.end)}</span>
                  {note && <em>{formatDuration(gap.end - gap.start)} free</em>}
                  {getStageTransferText(gap) && <em>{getStageTransferText(gap)}</em>}
                  {renderGapNoteInput(gap, "free-time-note-field--chip")}
                </article>
              );
            })}
          </div>
        </div>
      ) : null;

    if (freeTimeOnly) {
      return renderStagedFreeRow() ?? (
        <div className="empty-state tight">
          <p className="muted">No free time gaps on this day - picks are back to back!</p>
        </div>
      );
    }

    return (
      <div className="timetable-staged-outer">
        <div className="timetable-staged-headers">
          <div className="timetable-axis-spacer" />
          {stages.map((stage) => (
            <div key={stage.id} className={`timetable-staged-col-header stage-${stage.id}`}>
              {stage.shortName}
            </div>
          ))}
        </div>
        <div
          className="timetable timetable--staged"
          style={{
            "--stage-count": stages.length,
            height: `${stagedTimelineHeight}px`,
          } as CSSProperties}
        >
          <div className="timetable-axis" aria-hidden="true">
            {ticks.map((tick) => {
              const top = stagedTopPadding + (tick - timelineStart) * pixelsPerMinute;
              return (
                <span key={tick} style={{ top: `${top}px` }}>
                  {tick === 1440 ? "00:00" : minutesToTime(tick)}
                </span>
              );
            })}
          </div>
          {stages.map((stage) => {
            const stageItems = visibleAttending.filter((item) => item.artist.stage === stage.id);
            return (
              <div key={stage.id} className="timetable-track">
                {quarterTicks.map((tick) => {
                  const top = stagedTopPadding + (tick - timelineStart) * pixelsPerMinute;
                  return <div className="timetable-line timetable-line--minor" key={tick} style={{ top: `${top}px` }} />;
                })}
                {ticks.map((tick) => {
                  const top = stagedTopPadding + (tick - timelineStart) * pixelsPerMinute;
                  return <div className="timetable-line" key={tick} style={{ top: `${top}px` }} />;
                })}
                {stageItems.map((item) => {
                  const duration = item.end - item.start;
                  const top = stagedTopPadding + (item.start - timelineStart) * pixelsPerMinute;
                  const height = Math.max(duration * pixelsPerMinute - 2, 12);
                  const compactClass = duration < 20
                    ? " timetable-block--tiny"
                    : duration < 35
                      ? " timetable-block--short"
                      : "";
                  const supporters = getSupportText(item.supporters);
                  return (
                    <article
                      key={item.artist.id}
                      className={`timetable-block timetable-block--set stage-${item.artist.stage}${compactClass}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="timetable-block__main">
                        <div className="timetable-block__title">
                          <strong>{item.artist.name}</strong>
                          {showSupporters && supporters && (
                            <em className="timetable-block__supporters">Picked by {supporters}</em>
                          )}
                        </div>
                        <span>{formatRange(item.start, item.end)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })}
        </div>
        {renderStagedFreeRow()}
      </div>
    );
  };

  return (
    <section className="day-group">
      <div className="day-heading">
        <h2>{day?.label}</h2>
        <span>
          {schedule.attending.length} set{schedule.attending.length !== 1 ? "s" : ""}
          {schedule.gaps.length > 0 ? ` - ${schedule.gaps.length} gap${schedule.gaps.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {schedule.excludedCount > 0 && (
        <p className="muted">{schedule.excludedCount} clash choice removed from this itinerary.</p>
      )}

      {schedule.pickedCount === 0 ? (
        <div className="empty-state tight">
          <p className="muted">No artists selected for this day.</p>
        </div>
      ) : segments.length === 0 ? (
        <div className="empty-state tight">
          <p className="muted">No timed artists inside the current free-time window.</p>
        </div>
      ) : activeSegments.length === 0 ? (
        <div className="empty-state tight">
          <p className="muted">No free time gaps on this day — picks are back to back!</p>
        </div>
      ) : viewMode === "timetable" && showStages ? (
        renderStagedTimetable()
      ) : viewMode === "timetable" ? (
        renderTimetable()
      ) : (
        renderList()
      )}
    </section>
  );
};
