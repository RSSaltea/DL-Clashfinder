import type { CSSProperties } from "react";
import { festivalStages, getDay } from "../data/lineup";
import type { ScheduleDay, ScheduleGap, TimedArtist } from "../utils/schedule";
import { getDirectStageTransfers, getStageLabel, getStageTransferText, getSupportText } from "../utils/schedule";
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
        return (
          <article className="itinerary-item itinerary-item--gap" key={segment.key}>
            <div className="itinerary-time">{formatRange(gap.start, gap.end)}</div>
            <div>
              <h3>{duration} free</h3>
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
            return (
              <article
                className={`timetable-block timetable-block--gap${compactClass}`}
                key={segment.key}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="timetable-block__main">
                  <strong>{formatDuration(gap.end - gap.start)} free</strong>
                  <span>{formatRange(gap.start, gap.end)}</span>
                </div>
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
    const pixelsPerMinute = timelineHeight / timelineDuration;
    const ticks = Array.from(
      { length: Math.floor(timelineDuration / 60) + 1 },
      (_, index) => timelineStart + index * 60,
    );
    const visibleAttending = freeTimeOnly ? [] : schedule.attending;
    const showFreeColumn = schedule.gaps.length > 0;

    const renderStagedGap = (gap: ScheduleGap) => {
      const top = (gap.start - timelineStart) * pixelsPerMinute;
      const duration = gap.end - gap.start;
      const height = Math.max(duration * pixelsPerMinute - 2, 12);
      const compactClass = duration < 20
        ? " timetable-block--tiny"
        : duration < 35
          ? " timetable-block--short"
          : "";

      return (
        <article
          className={`timetable-block timetable-block--gap timetable-block--staged-gap${compactClass}`}
          key={`staged-gap-${schedule.dayId}-${gap.start}-${gap.end}`}
          style={{ top: `${top}px`, height: `${height}px` }}
        >
          <div className="timetable-block__main">
            <strong>{formatDuration(duration)} free</strong>
            <span>{formatRange(gap.start, gap.end)}</span>
          </div>
        </article>
      );
    };

    return (
      <div className="timetable-staged-outer">
        <div className={`timetable-staged-headers${showFreeColumn ? " has-free-column" : ""}`}>
          <div className="timetable-axis-spacer" />
          {festivalStages.map((stage) => (
            <div key={stage.id} className={`timetable-staged-col-header stage-${stage.id}`}>
              {stage.shortName}
            </div>
          ))}
          {showFreeColumn && (
            <div className="timetable-staged-col-header timetable-staged-col-header--free">
              Free
            </div>
          )}
        </div>
        <div
          className={`timetable timetable--staged${showFreeColumn ? " has-free-column" : ""}`}
          style={{ height: `${timelineHeight}px` }}
        >
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
          {festivalStages.map((stage) => {
            const stageItems = visibleAttending.filter((item) => item.artist.stage === stage.id);
            return (
              <div key={stage.id} className="timetable-track">
                {ticks.map((tick) => {
                  const top = (tick - timelineStart) * pixelsPerMinute;
                  return <div className="timetable-line" key={tick} style={{ top: `${top}px` }} />;
                })}
                {stageItems.map((item) => {
                  const duration = item.end - item.start;
                  const top = (item.start - timelineStart) * pixelsPerMinute;
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
          {showFreeColumn && (
            <div className="timetable-track timetable-track--free">
              {ticks.map((tick) => {
                const top = (tick - timelineStart) * pixelsPerMinute;
                return <div className="timetable-line" key={tick} style={{ top: `${top}px` }} />;
              })}
              {schedule.gaps.map(renderStagedGap)}
            </div>
          )}
        </div>
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
