import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { DayId, FestivalDay, FestivalStage, IntentMap } from "../types";
import type { ScheduleDay, ScheduleGap, TimedArtist } from "../utils/schedule";
import { formatDuration, minutesToTime } from "../utils/time";

const HOUR_W = 180;
const DAY_LABEL_W = 86;
const STAGE_LABEL_W = 76;
const ROW_H = 80;

type CombinedRow =
  | { type: "stage"; key: string; label: string; stage: FestivalStage; items: TimedArtist[] }
  | { type: "solo"; key: string; label: string; items: TimedArtist[]; gaps: ScheduleGap[] }
  | { type: "free"; key: string; label: string; gaps: ScheduleGap[] }
  | { type: "empty"; key: string; label: string; message: string };

interface CombinedTimetableViewProps {
  days: FestivalDay[];
  schedules: ScheduleDay[];
  intents: IntentMap;
  showStages: boolean;
  freeTimeOnly?: boolean;
  getStagesForDay: (dayId: DayId) => FestivalStage[];
}

const formatRange = (start: number, end: number) => `${minutesToTime(start)} - ${minutesToTime(end)}`;

export const CombinedTimetableView = ({
  days,
  schedules,
  intents,
  showStages,
  freeTimeOnly = false,
  getStagesForDay,
}: CombinedTimetableViewProps) => {
  const scheduleByDay = new Map(schedules.map((schedule) => [schedule.dayId, schedule]));

  const dayGroups = days.map((day) => {
    const schedule = scheduleByDay.get(day.id);

    if (!schedule) {
      return {
        day,
        rows: [
          {
            type: "empty" as const,
            key: `${day.id}-empty`,
            label: "Timeline",
            message: "No schedule for this day.",
          },
        ],
      };
    }

    const rows: CombinedRow[] = [];

    if (showStages && !freeTimeOnly) {
      getStagesForDay(day.id).forEach((stage) => {
        const items = schedule.attending.filter((item) => item.artist.stage === stage.id);
        if (items.length > 0) {
          rows.push({
            type: "stage",
            key: `${day.id}-${stage.id}`,
            label: stage.shortName,
            stage,
            items,
          });
        }
      });
    }

    if (!showStages && !freeTimeOnly && schedule.attending.length > 0) {
      rows.push({
        type: "solo",
        key: `${day.id}-timeline`,
        label: "Timeline",
        items: schedule.attending,
        gaps: schedule.gaps,
      });
    }

    if (schedule.gaps.length > 0) {
      rows.push({
        type: "free",
        key: `${day.id}-free`,
        label: "Free",
        gaps: schedule.gaps,
      });
    }

    if (rows.length === 0) {
      rows.push({
        type: "empty",
        key: `${day.id}-empty`,
        label: freeTimeOnly ? "Free" : "Timeline",
        message: freeTimeOnly ? "No free time gaps on this day." : "No artists selected for this day.",
      });
    }

    return { day, rows };
  });

  const allStarts = dayGroups.flatMap((group) =>
    group.rows.flatMap((row) => {
      if (row.type === "stage") return row.items.map((item) => item.start);
      if (row.type === "solo") return [...row.items.map((item) => item.start), ...row.gaps.map((gap) => gap.start)];
      if (row.type === "free") return row.gaps.map((gap) => gap.start);
      return [];
    }),
  );

  const allEnds = dayGroups.flatMap((group) =>
    group.rows.flatMap((row) => {
      if (row.type === "stage") return row.items.map((item) => item.end);
      if (row.type === "solo") return [...row.items.map((item) => item.end), ...row.gaps.map((gap) => gap.end)];
      if (row.type === "free") return row.gaps.map((gap) => gap.end);
      return [];
    }),
  );

  const rangeStart = allStarts.length > 0 ? Math.floor(Math.min(...allStarts) / 60) * 60 : 10 * 60;
  const rangeEnd = allEnds.length > 0 ? Math.ceil(Math.max(...allEnds) / 60) * 60 : 24 * 60;
  const hours = Array.from({ length: Math.floor((rangeEnd - rangeStart) / 60) + 1 }, (_, index) => rangeStart + index * 60);
  const quarterMarks = Array.from({ length: Math.floor((rangeEnd - rangeStart) / 15) }, (_, index) => rangeStart + (index + 1) * 15)
    .filter((mark) => mark < rangeEnd && mark % 60 !== 0);
  const minsToX = (minutes: number) => ((minutes - rangeStart) / 60) * HOUR_W;
  const timeW = minsToX(rangeEnd);

  const renderGridLines = () => (
    <>
      {quarterMarks.map((mark) => (
        <div key={mark} className="tt-vline tt-vline--minor" style={{ left: minsToX(mark) }} />
      ))}
      {hours.map((hour) => (
        <div key={hour} className="tt-vline" style={{ left: minsToX(hour) }} />
      ))}
    </>
  );

  const renderArtistBlock = (item: TimedArtist) => {
    const left = minsToX(item.start);
    const width = Math.max(minsToX(item.end) - left - 2, 30);
    const intent = intents[item.artist.id] ?? "interested";

    return (
      <Link
        key={item.artist.id}
        to={`/artist/${item.artist.id}`}
        className={`tt-block tt-block--${intent}`}
        style={{ left, width }}
        title={`${item.artist.name} - ${formatRange(item.start, item.end)}`}
      >
        <span className="tt-block__name">{item.artist.name}</span>
        {width > 55 && <span className="tt-block__time">{formatRange(item.start, item.end)}</span>}
      </Link>
    );
  };

  const renderGapBlock = (gap: ScheduleGap, key: string) => {
    const left = minsToX(gap.start);
    const width = Math.max(minsToX(gap.end) - left - 2, 30);
    const label = `${formatDuration(gap.end - gap.start)} free`;

    return (
      <div key={key} className="tt-gap" style={{ left, width }} title={`${label} - ${formatRange(gap.start, gap.end)}`}>
        {width > 55 && <span>{label}</span>}
      </div>
    );
  };

  const renderRowTrack = (row: CombinedRow) => {
    if (row.type === "empty") {
      return (
        <div className="tt-track" style={{ width: timeW, height: ROW_H }}>
          {renderGridLines()}
          <p className="tt-hint">{row.message}</p>
        </div>
      );
    }

    return (
      <div className="tt-track" style={{ width: timeW, height: ROW_H }}>
        {renderGridLines()}
        {row.type === "stage" && row.items.map(renderArtistBlock)}
        {row.type === "solo" && (
          <>
            {row.items.map(renderArtistBlock)}
            {row.gaps.map((gap, index) => renderGapBlock(gap, `${row.key}-gap-${index}`))}
          </>
        )}
        {row.type === "free" && row.gaps.map((gap, index) => renderGapBlock(gap, `${row.key}-gap-${index}`))}
      </div>
    );
  };

  if (days.length === 0) {
    return (
      <div className="empty-state tight">
        <p className="muted">No days selected.</p>
      </div>
    );
  }

  return (
    <div
      className="tt-outer tt-combined"
      style={{
        "--tt-day-label-w": `${DAY_LABEL_W}px`,
        "--tt-stage-label-w": `${STAGE_LABEL_W}px`,
      } as CSSProperties}
    >
      <div className="tt-scroll">
        <div className="tt-header">
          <div className="tt-day-corner" style={{ width: DAY_LABEL_W, minWidth: DAY_LABEL_W }}>
            Day
          </div>
          {showStages && (
            <div className="tt-corner" style={{ width: STAGE_LABEL_W, minWidth: STAGE_LABEL_W }} />
          )}
          <div className="tt-axis" style={{ width: timeW }}>
            {hours.map((hour) => (
              <span key={hour} className="tt-hour-label" style={{ left: minsToX(hour) }}>
                {minutesToTime(hour)}
              </span>
            ))}
            {quarterMarks
              .filter((mark) => mark % 30 === 0)
              .map((mark) => (
                <span key={mark} className="tt-hour-label tt-half-label" style={{ left: minsToX(mark) }}>
                  :30
                </span>
              ))}
          </div>
        </div>

        {dayGroups.map((group) => (
          <div className="tt-combined-day" key={group.day.id}>
            <div
              className="tt-day-label"
              style={{ width: DAY_LABEL_W, minWidth: DAY_LABEL_W, height: group.rows.length * ROW_H }}
              title={group.day.label}
            >
              {group.day.shortLabel}
            </div>
            <div className="tt-combined-rows">
              {group.rows.map((row) => (
                <div className={`tt-row${!showStages ? " tt-row--solo" : ""}`} key={row.key}>
                  {showStages && (
                    <div
                      className={`tt-stage-label${row.type === "free" ? " tt-stage-label--free" : ""}${
                        row.type === "stage" ? ` stage-${row.stage.id}` : ""
                      }`}
                      style={{ width: STAGE_LABEL_W, minWidth: STAGE_LABEL_W }}
                    >
                      {row.label}
                    </div>
                  )}
                  {renderRowTrack(row)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
