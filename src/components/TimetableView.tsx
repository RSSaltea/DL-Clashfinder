import { useMemo } from "react";
import { Link } from "react-router-dom";
import { festivalStages, lineup } from "../data/lineup";
import type { Artist, DayId, IntentMap, SetTimeMap } from "../types";
import { getEffectiveTime, minutesToTime, timeToMinutes } from "../utils/time";

const HOUR_W = 180; // px per hour (45px per 15-min segment)
const LABEL_W = 76; // px for stage label column
const ROW_H = 80; // px per stage row

function toFestivalMins(artist: Artist, setTimes: SetTimeMap): { start: number; end: number } {
  const t = getEffectiveTime(artist, setTimes);
  const start = timeToMinutes(t.start) ?? 10 * 60;
  const rawEnd = timeToMinutes(t.end);
  let end: number = rawEnd !== null && rawEnd !== undefined ? rawEnd : start + 60;
  if (end <= start) end += 1440;
  return { start, end };
}

interface TimetableViewProps {
  day: DayId;
  intents: IntentMap;
  setTimes: SetTimeMap;
  showStages: boolean;
  hideUnpicked?: boolean;
  freeTimeOnly?: boolean;
  artistIds?: string[];
  freeTimeGaps?: Array<{ start: number; end: number }>;
}

export const TimetableView = ({
  day,
  intents,
  setTimes,
  showStages,
  hideUnpicked = false,
  freeTimeOnly = false,
  artistIds,
  freeTimeGaps,
}: TimetableViewProps) => {
  const dayArtists = useMemo(() => {
    const artists = lineup.filter((a) => a.day === day);
    if (!artistIds) return artists;
    const ids = new Set(artistIds);
    return artists.filter((artist) => ids.has(artist.id));
  }, [artistIds, day]);

  // When freeTimeOnly, force single-lane so gaps are visible
  const effectiveShowStages = showStages && !freeTimeOnly;

  const { rangeStart, rangeEnd } = useMemo(() => {
    let s = 10 * 60;
    let e = 24 * 60;
    const relevant = hideUnpicked ? dayArtists.filter((a) => intents[a.id]) : dayArtists;
    for (const a of relevant.length > 0 ? relevant : dayArtists) {
      const { start, end } = toFestivalMins(a, setTimes);
      if (start < s) s = start;
      if (end > e) e = end;
    }
    for (const gap of freeTimeGaps ?? []) {
      if (gap.start < s) s = gap.start;
      if (gap.end > e) e = gap.end;
    }
    return { rangeStart: Math.floor(s / 60) * 60, rangeEnd: Math.ceil(e / 60) * 60 };
  }, [dayArtists, freeTimeGaps, hideUnpicked, intents, setTimes]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let m = rangeStart; m <= rangeEnd; m += 60) h.push(m);
    return h;
  }, [rangeStart, rangeEnd]);

  const quarterMarks = useMemo(() => {
    const q: number[] = [];
    for (let m = rangeStart; m < rangeEnd; m += 15) {
      if (m % 60 !== 0) q.push(m);
    }
    return q;
  }, [rangeStart, rangeEnd]);

  const minsToX = (m: number) => ((m - rangeStart) / 60) * HOUR_W;
  const timeW = minsToX(rangeEnd);
  const hLabel = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:00`;

  // Picked artists sorted by start time (for single-lane and FREE row)
  const pickedSorted = useMemo(() => {
    return dayArtists
      .filter((a) => intents[a.id])
      .map((a) => ({ artist: a, ...toFestivalMins(a, setTimes) }))
      .sort((a, b) => a.start - b.start);
  }, [dayArtists, intents, setTimes]);

  // Gaps between consecutive picks (used in single-lane and FREE row)
  const pickedGaps = useMemo(() => {
    if (freeTimeGaps) return freeTimeGaps;
    const gaps: { start: number; end: number }[] = [];
    for (let i = 0; i < pickedSorted.length - 1; i++) {
      const curr = pickedSorted[i];
      const next = pickedSorted[i + 1];
      if (next.start > curr.end) {
        gaps.push({ start: curr.end, end: next.start });
      }
    }
    return gaps;
  }, [freeTimeGaps, pickedSorted]);

  // Merged free-time blocks across all stages (for FREE row in stages mode)
  const stagesFreeTime = useMemo(() => {
    if (!effectiveShowStages || !hideUnpicked) return [];
    if (freeTimeGaps) return freeTimeGaps;
    if (pickedSorted.length === 0) return [];
    const merged: { start: number; end: number }[] = [];
    for (const { start, end } of pickedSorted) {
      if (merged.length > 0 && start <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, end);
      } else {
        merged.push({ start, end });
      }
    }
    const gaps: { start: number; end: number }[] = [];
    for (let i = 0; i < merged.length - 1; i++) {
      if (merged[i + 1].start > merged[i].end) {
        gaps.push({ start: merged[i].end, end: merged[i + 1].start });
      }
    }
    return gaps;
  }, [effectiveShowStages, freeTimeGaps, hideUnpicked, pickedSorted]);

  const renderBlock = (artist: Artist) => {
    const { start, end } = toFestivalMins(artist, setTimes);
    const left = minsToX(start);
    const blockW = Math.max(minsToX(end) - left - 2, 30);
    const intent = intents[artist.id];
    if (hideUnpicked && !intent) return null;
    return (
      <Link
        key={artist.id}
        to={`/artist/${artist.id}`}
        className={`tt-block tt-block--${intent ?? "none"}`}
        style={{ left, width: blockW }}
        title={`${artist.name} · ${minutesToTime(start % 1440)} – ${minutesToTime(end % 1440)}`}
      >
        <span className="tt-block__name">{artist.name}</span>
        {blockW > 55 && (
          <span className="tt-block__time">
            {minutesToTime(start % 1440)}–{minutesToTime(end % 1440)}
          </span>
        )}
      </Link>
    );
  };

  const renderGapBlock = (gap: { start: number; end: number }, key: string) => {
    const left = minsToX(gap.start);
    const gW = minsToX(gap.end) - left;
    const gMins = gap.end - gap.start;
    const hrs = Math.floor(gMins / 60);
    const mins = gMins % 60;
    const label = [hrs > 0 && `${hrs}h`, mins > 0 && `${mins}m`].filter(Boolean).join(" ") + " free";
    return (
      <div key={key} className="tt-gap" style={{ left, width: gW - 2 }} title={label}>
        {gW > 55 && <span>{label}</span>}
      </div>
    );
  };

  const renderGridLines = () => (
    <>
      {quarterMarks.map((m) => (
        <div key={m} className="tt-vline tt-vline--minor" style={{ left: minsToX(m) }} />
      ))}
      {hours.map((m) => (
        <div key={m} className="tt-vline" style={{ left: minsToX(m) }} />
      ))}
    </>
  );

  return (
    <div className="tt-outer">
      <div className="tt-scroll">
        {/* Time axis header */}
        <div className="tt-header">
          {effectiveShowStages && <div className="tt-corner" style={{ width: LABEL_W }} />}
          <div className="tt-axis" style={{ width: timeW }}>
            {hours.map((m) => (
              <span key={m} className="tt-hour-label" style={{ left: minsToX(m) }}>
                {hLabel(m)}
              </span>
            ))}
            {quarterMarks.filter((m) => m % 30 === 0).map((m) => (
              <span key={m} className="tt-hour-label tt-half-label" style={{ left: minsToX(m) }}>
                :30
              </span>
            ))}
          </div>
        </div>

        {/* Rows */}
        {effectiveShowStages ? (
          <>
            {festivalStages.map((stage) => {
              const artists = dayArtists.filter((a) => a.stage === stage.id);
              const visibleArtists = hideUnpicked ? artists.filter((a) => intents[a.id]) : artists;
              if (hideUnpicked && visibleArtists.length === 0) return null;
              return (
                <div key={stage.id} className="tt-row">
                  <div
                    className={`tt-stage-label stage-${stage.id}`}
                    style={{ width: LABEL_W, minWidth: LABEL_W }}
                  >
                    {stage.shortName}
                  </div>
                  <div className="tt-track" style={{ width: timeW, height: ROW_H }}>
                    {renderGridLines()}
                    {artists.map(renderBlock)}
                  </div>
                </div>
              );
            })}
            {/* FREE row — gaps between any picks across all stages */}
            {stagesFreeTime.length > 0 && (
              <div className="tt-row">
                <div
                  className="tt-stage-label tt-stage-label--free"
                  style={{ width: LABEL_W, minWidth: LABEL_W }}
                >
                  FREE
                </div>
                <div className="tt-track" style={{ width: timeW, height: ROW_H }}>
                  {renderGridLines()}
                  {stagesFreeTime.map((gap, i) => renderGapBlock(gap, `free-${i}`))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="tt-row tt-row--solo">
            <div className="tt-track" style={{ width: timeW, height: ROW_H }}>
              {renderGridLines()}
              {freeTimeOnly ? (
                pickedGaps.length === 0 ? (
                  <p className="tt-hint">
                    {pickedSorted.length === 0 ? "Pick artists to see free time." : "No free time — picks are back to back!"}
                  </p>
                ) : (
                  pickedGaps.map((gap, i) => renderGapBlock(gap, `gap-ft-${i}`))
                )
              ) : pickedSorted.length === 0 ? (
                <p className="tt-hint">Pick artists on the lineup to see your personal timeline.</p>
              ) : (
                <>
                  {pickedSorted.map(({ artist, start, end }) => {
                    const left = minsToX(start);
                    const blockW = Math.max(minsToX(end) - left - 2, 40);
                    const intent = intents[artist.id];
                    return (
                      <Link
                        key={artist.id}
                        to={`/artist/${artist.id}`}
                        className={`tt-block tt-block--${intent}`}
                        style={{ left, width: blockW }}
                        title={`${artist.name} · ${minutesToTime(start % 1440)} – ${minutesToTime(end % 1440)}`}
                      >
                        <span className="tt-block__name">{artist.name}</span>
                        {blockW > 55 && (
                          <span className="tt-block__time">
                            {minutesToTime(start % 1440)}–{minutesToTime(end % 1440)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {pickedGaps.map((gap, i) => renderGapBlock(gap, `gap-${i}`))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
