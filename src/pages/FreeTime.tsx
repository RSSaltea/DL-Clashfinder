import { Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IntentButtons } from "../components/IntentButtons";
import { festivalDays, lineup } from "../data/lineup";
import type { ClashDecisionMap, Intent, IntentMap, SetTimeMap } from "../types";
import { loadFreeTimeWindow, saveFreeTimeWindow } from "../utils/localStorage";
import { buildScheduleDay, getDirectStageTransfers, getStageLabel, getStageTransferText } from "../utils/schedule";
import { formatDuration, minutesToTime, timeToMinutes, windowEndToMins } from "../utils/time";

interface FreeTimeProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
}

export const FreeTime = ({ intents, setTimes, clashDecisions, onIntentChange }: FreeTimeProps) => {
  const [window, setWindow] = useState(() => loadFreeTimeWindow());

  useEffect(() => {
    saveFreeTimeWindow(window);
  }, [window]);

  const windowStartMins = timeToMinutes(window.start) ?? 600;
  const windowEndMins = windowEndToMins(window.end);

  const dayData = useMemo(
    () =>
      festivalDays.map((day) => {
        const pickedOnDay = lineup.filter((artist) => artist.day === day.id && Boolean(intents[artist.id]));

        return {
          day,
          schedule: buildScheduleDay(
            day.id,
            pickedOnDay,
            setTimes,
            clashDecisions,
            windowStartMins,
            windowEndMins,
          ),
        };
      }),
    [clashDecisions, intents, setTimes, windowEndMins, windowStartMins],
  );

  const totalGaps = dayData.reduce((sum, item) => sum + item.schedule.gaps.length, 0);

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Find your breathing room</p>
          <h1>Free Time</h1>
        </div>
        <div className="time-inputs">
          <label>
            From
            <input
              type="time"
              value={window.start}
              onChange={(event) => setWindow((current) => ({ ...current, start: event.target.value }))}
            />
          </label>
          <label>
            Until
            <input
              type="time"
              value={window.end}
              onChange={(event) => setWindow((current) => ({ ...current, end: event.target.value }))}
            />
          </label>
        </div>
      </section>

      {totalGaps === 0 && dayData.every(({ schedule }) => schedule.pickedCount === 0) && (
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          <Timer size={24} />
          <h2>Nothing selected yet</h2>
          <p>Mark artists on the <Link to="/">Lineup</Link> page and come back here to see your free time.</p>
        </div>
      )}

      {dayData.map(({ day, schedule }) => {
        const directTransfers = getDirectStageTransfers(schedule.attending);

        return (
          <section className="day-group" key={day.id}>
            <div className="day-heading">
              <h2>{day.label}</h2>
              <span>
                {schedule.pickedCount === 0
                  ? "No picks"
                  : schedule.gaps.length === 0
                    ? "No gaps"
                    : `${schedule.gaps.length} gap${schedule.gaps.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {schedule.excludedCount > 0 && (
              <p className="muted">{schedule.excludedCount} clash choice removed from this free-time plan.</p>
            )}

            {directTransfers.length > 0 && (
              <div className="transfer-warning-list">
                {directTransfers.map((transfer) => (
                  <p className="transfer-note transfer-note--urgent" key={transfer.id}>
                    {transfer.text}
                  </p>
                ))}
              </div>
            )}

            {schedule.pickedCount === 0 ? (
              <div className="empty-state tight">
                <p className="muted">No artists selected for this day.</p>
              </div>
            ) : schedule.gaps.length === 0 ? (
              <div className="empty-state tight">
                <p className="muted">You're busy the whole window, no free time on this day.</p>
              </div>
            ) : (
              <div className="gap-list">
                {schedule.gaps.map((gap) => {
                  const endLabel = gap.end === 1440 ? "00:00" : minutesToTime(gap.end);
                  const duration = formatDuration(gap.end - gap.start);
                  const transferText = getStageTransferText(gap);

                  return (
                    <div className="gap-card" key={`${day.id}-${gap.start}-${gap.end}`}>
                      {gap.comingFrom && (
                        <div className="gap-bookend gap-bookend--from">
                          <span>Finishing</span>
                          <strong>{gap.comingFrom.artist.name}</strong>
                          <span>{getStageLabel(gap.comingFrom.artist)} - ends {minutesToTime(gap.start)}</span>
                        </div>
                      )}

                      <div className="gap-card__header">
                        <strong>{minutesToTime(gap.start)} - {endLabel}</strong>
                        <span>{duration} free</span>
                      </div>

                      {transferText && <p className="transfer-note transfer-note--right">{transferText}</p>}

                      {gap.playing.length === 0 ? (
                        <p className="muted" style={{ fontSize: "0.9rem" }}>
                          Nobody else is playing during this gap.
                        </p>
                      ) : (
                        <div className="compact-list">
                          {gap.playing.map(({ artist, start, end }) => (
                            <div className="free-time-option" key={artist.id}>
                              <div>
                                <strong>{artist.name}</strong>
                                <span>{getStageLabel(artist)} - {minutesToTime(start)} to {minutesToTime(end)}</span>
                              </div>
                              <IntentButtons
                                intent={intents[artist.id]}
                                onChange={(nextIntent) => onIntentChange(artist.id, nextIntent)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {gap.goingTo && (
                        <div className="gap-bookend gap-bookend--to">
                          <span>Heading to</span>
                          <strong>{gap.goingTo.artist.name}</strong>
                          <span>{getStageLabel(gap.goingTo.artist)} - starts {minutesToTime(gap.end)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
};
