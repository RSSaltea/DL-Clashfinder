import { getDay } from "../data/lineup";
import type { ScheduleDay, ScheduleGap, TimedArtist } from "../utils/schedule";
import { getStageLabel, getSupportText } from "../utils/schedule";
import { formatDuration, minutesToTime } from "../utils/time";

type ScheduleSegment =
  | { type: "set"; key: string; start: number; item: TimedArtist }
  | { type: "gap"; key: string; start: number; item: ScheduleGap };

interface ScheduleDayViewProps {
  schedule: ScheduleDay;
  showSupporters?: boolean;
}

const formatRange = (start: number, end: number) =>
  `${minutesToTime(start)} - ${end === 1440 ? "00:00" : minutesToTime(end)}`;

export const ScheduleDayView = ({ schedule, showSupporters = false }: ScheduleDayViewProps) => {
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
                      {getStageLabel(item.artist)}
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
                        <em>{getStageLabel(gap.comingFrom.artist)}</em>
                      </p>
                    )}
                    {gap.goingTo && (
                      <p>
                        <span>Heading to</span>
                        <strong>{gap.goingTo.artist.name}</strong>
                        <em>{getStageLabel(gap.goingTo.artist)}</em>
                      </p>
                    )}
                  </div>
                  {gap.playing.length > 0 ? (
                    <div className="compact-list">
                      {gap.playing.slice(0, 8).map(({ artist, start, end }) => (
                        <div key={artist.id}>
                          <strong>{artist.name}</strong>
                          <span>{getStageLabel(artist)} - {minutesToTime(start)} to {minutesToTime(end)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Nobody else is playing during this gap.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
