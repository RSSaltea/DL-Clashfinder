import { Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArtistCard } from "../components/ArtistCard";
import { festivalDays, lineup } from "../data/lineup";
import type { Intent, IntentMap, SetTimeMap } from "../types";
import { loadFreeTimeWindow, saveFreeTimeWindow } from "../utils/localStorage";
import {
  computeFreeGaps,
  formatDuration,
  getEffectiveTime,
  minutesToTime,
  timeToMinutes,
  windowEndToMins,
} from "../utils/time";

interface FreeTimeProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
}

export const FreeTime = ({ intents, setTimes, onIntentChange }: FreeTimeProps) => {
  const [window, setWindow] = useState(() => loadFreeTimeWindow());

  useEffect(() => {
    saveFreeTimeWindow(window);
  }, [window]);

  const windowStartMins = timeToMinutes(window.start) ?? 600;
  const windowEndMins = windowEndToMins(window.end);

  const dayData = useMemo(() => {
    return festivalDays.map((day) => {
      const selectedOnDay = lineup.filter(
        (artist) => artist.day === day.id && Boolean(intents[artist.id]),
      );

      const gaps = computeFreeGaps(selectedOnDay, setTimes, windowStartMins, windowEndMins);

      const gapsWithArtists = gaps.map((gap) => {
        const playing = lineup.filter((artist) => {
          if (artist.day !== day.id) return false;
          if (intents[artist.id]) return false;
          const t = getEffectiveTime(artist, setTimes);
          const start = timeToMinutes(t.start);
          const end = timeToMinutes(t.end);
          if (start === undefined || end === undefined) return false;
          return start < gap.end && end > gap.start;
        });

        return { ...gap, playing };
      });

      return { day, gaps: gapsWithArtists, selectedCount: selectedOnDay.length };
    });
  }, [intents, setTimes, windowStartMins, windowEndMins]);

  const totalGaps = dayData.reduce((sum, d) => sum + d.gaps.length, 0);

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
              onChange={(e) => setWindow((w) => ({ ...w, start: e.target.value }))}
            />
          </label>
          <label>
            Until
            <input
              type="time"
              value={window.end}
              onChange={(e) => setWindow((w) => ({ ...w, end: e.target.value }))}
            />
          </label>
        </div>
      </section>

      {totalGaps === 0 && dayData.every((d) => d.selectedCount === 0) && (
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          <Timer size={24} />
          <h2>Nothing selected yet</h2>
          <p>Mark artists on the <Link to="/">Lineup</Link> page and come back here to see your free time.</p>
        </div>
      )}

      {dayData.map(({ day, gaps, selectedCount }) => (
        <section className="day-group" key={day.id}>
          <div className="day-heading">
            <h2>{day.label}</h2>
            <span>
              {selectedCount === 0
                ? "No picks"
                : gaps.length === 0
                  ? "No gaps"
                  : `${gaps.length} gap${gaps.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {selectedCount === 0 ? (
            <div className="empty-state tight">
              <p className="muted">No artists selected for this day.</p>
            </div>
          ) : gaps.length === 0 ? (
            <div className="empty-state tight">
              <p className="muted">You're busy the whole window — no free time on this day.</p>
            </div>
          ) : (
            <div className="gap-list">
              {gaps.map((gap) => {
                const endLabel = gap.end === 1440 ? "00:00" : minutesToTime(gap.end);
                const duration = formatDuration(gap.end - gap.start);

                return (
                  <div className="gap-card" key={`${gap.start}-${gap.end}`}>
                    <div className="gap-card__header">
                      <strong>{minutesToTime(gap.start)} – {endLabel}</strong>
                      <span>{duration} free</span>
                    </div>

                    {gap.playing.length === 0 ? (
                      <p className="muted" style={{ fontSize: "0.9rem" }}>
                        Nobody else is playing during this gap.
                      </p>
                    ) : (
                      <div className="stage-grid">
                        {gap.playing.map((artist) => (
                          <ArtistCard
                            key={artist.id}
                            artist={artist}
                            clashes={[]}
                            intent={intents[artist.id]}
                            tightGaps={[]}
                            time={getEffectiveTime(artist, setTimes)}
                            onIntentChange={onIntentChange}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </main>
  );
};
