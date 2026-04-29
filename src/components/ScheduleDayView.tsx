import { getDay } from "../data/lineup";
import type { ScheduleDay, ScheduleGap, TimedArtist } from "../utils/schedule";
import { getStageLabel, getStageTransferText, getSupportText } from "../utils/schedule";
import { formatDuration, minutesToTime } from "../utils/time";

type ScheduleSegment =
  | { type: "set"; key: string; start: number; item: TimedArtist }
  | { type: "gap"; key: string; start: number; item: ScheduleGap };

interface ScheduleDayViewProps {
  schedule: ScheduleDay;
  showSupporters?: boolean;
  viewMode?: ScheduleViewMode;
}

export type ScheduleViewMode = "list" | "timetable";

const formatRange = (start: number, end: number) =>
  `${minutesToTime(start)} - ${end === 1440 ? "00:00" : minutesToTime(end)}`;

const getSegmentEnd = (segment: ScheduleSegment) =>
  segment.type === "set" ? segment.item.end : segment.item.end;

const renderGapTransfer = (gap: ScheduleGap) => {
  const transferText = getStageTransferText(gap);

  return transferText ? <p className="transfer-note">{transferText}</p> : null;
};

export const ScheduleDayView = ({ schedule, showSupporters = false, viewMode = "list" }: ScheduleDayViewProps) => {
  const day = getDay(schedule.dayId);
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
    if (a.start !== b.start) {
      return a.start - b.start;
    }

    return a.type === "set" ? -1 : 1;
  });

  const renderList = () => (
    <div className="itinerary-list">
      {segments.map((segment) => {
        if (segment.type === "set") {
          const item = segment.item;
          const supporters = getSupportText(item.supporters);

          return (
            <article className={`itinerary-item itinerary-item--set stage-${item.artist.stage}`} key={segment.key}>
              <div className="itinerary-time">{formatRange(item.start, item.end)}</div>
              <div>
                <h3>{item.artist.name}</h3>
                <p>
                  {getStageLabel(item.artist)} - starts {minutesToTime(item.start)} - finishes {minutesToTime(item.end)}
                  {showSupporters && supporters ? ` - picked by ${supporters}` : ""}
                </p>
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
              {renderGapTransfer(gap)}
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderTimetable = () => {
    const timelineStart = Math.floor(Math.min(...segments.map((segment) => segment.start)) / 60) * 60;
    const timelineEnd = Math.ceil(Math.max(...segments.map(getSegmentEnd)) / 60) * 60;
    const timelineDuration = Math.max(timelineEnd - timelineStart, 60);
    const ticks = Array.from(
      { length: Math.floor(timelineDuration / 60) + 1 },
      (_, index) => timelineStart + index * 60,
    );

    return (
      <div
        className="timetable"
        style={{ minHeight: `${Math.max(520, timelineDuration * 1.15)}px` }}
      >
        <div className="timetable-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              style={{ top: `${((tick - timelineStart) / timelineDuration) * 100}%` }}
            >
              {tick === 1440 ? "00:00" : minutesToTime(tick)}
            </span>
          ))}
        </div>
        <div className="timetable-track">
          {ticks.map((tick) => (
            <div
              className="timetable-line"
              key={tick}
              style={{ top: `${((tick - timelineStart) / timelineDuration) * 100}%` }}
            />
          ))}
          {segments.map((segment) => {
            const start = segment.start;
            const end = getSegmentEnd(segment);
            const top = ((start - timelineStart) / timelineDuration) * 100;
            const height = Math.max(((end - start) / timelineDuration) * 100, 4);

            if (segment.type === "set") {
              const item = segment.item;
              const supporters = getSupportText(item.supporters);

              return (
                <article
                  className={`timetable-block timetable-block--set stage-${item.artist.stage}`}
                  key={segment.key}
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <strong>{item.artist.name}</strong>
                  <span>{formatRange(item.start, item.end)} - {getStageLabel(item.artist)}</span>
                  {showSupporters && supporters && <em>Picked by {supporters}</em>}
                </article>
              );
            }

            const gap = segment.item;

            return (
              <article
                className="timetable-block timetable-block--gap"
                key={segment.key}
                style={{ top: `${top}%`, height: `${height}%` }}
              >
                <strong>{formatDuration(gap.end - gap.start)} free</strong>
                <span>{formatRange(gap.start, gap.end)}</span>
                {renderGapTransfer(gap)}
              </article>
            );
          })}
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
      ) : (
        viewMode === "timetable" ? renderTimetable() : renderList()
      )}
    </section>
  );
};
