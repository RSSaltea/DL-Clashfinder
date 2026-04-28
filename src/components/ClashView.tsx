import { AlertTriangle, Clock, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { festivalDays, getDay, getStage, lineup } from "../data/lineup";
import type { IntentMap, SetTimeMap } from "../types";
import { getAllClashes } from "../utils/clash";
import { formatTimeRange, getEffectiveTime } from "../utils/time";

type ClashScope = "mine" | "definite";

interface ClashViewProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
}

export const ClashView = ({ intents, setTimes }: ClashViewProps) => {
  const [scope, setScope] = useState<ClashScope>("mine");

  const scopedArtists = useMemo(() => {
    return lineup.filter((artist) => {
      if (scope === "definite") {
        return intents[artist.id] === "definite";
      }

      return Boolean(intents[artist.id]);
    });
  }, [intents, scope]);

  const clashes = useMemo(() => getAllClashes(scopedArtists, setTimes), [scopedArtists, setTimes]);

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Time conflicts</p>
          <h1>Clashes</h1>
        </div>
        <label className="select-field">
          <ListFilter size={18} />
          <select value={scope} onChange={(event) => setScope(event.target.value as ClashScope)}>
            <option value="mine">My picks</option>
            <option value="definite">Definite only</option>
          </select>
        </label>
      </section>

      {clashes.length === 0 ? (
        <div className="empty-state">
          <h2>No clashes yet.</h2>
          <p>Add start and end times to overlapping artists, then this page will light up.</p>
        </div>
      ) : (
        <section className="clash-list">
          {festivalDays.map((day) => {
            const dayClashes = clashes.filter((clash) => clash.day === day.id);

            if (dayClashes.length === 0) {
              return null;
            }

            return (
              <div className="day-group" key={day.id}>
                <div className="day-heading">
                  <h2>{day.label}</h2>
                  <span>{dayClashes.length} clashes</span>
                </div>

                <div className="comparison-grid">
                  {dayClashes.map((clash) => (
                    <article className="clash-card" key={clash.id}>
                      <div className="clash-card__time">
                        <AlertTriangle size={18} />
                        <strong>{clash.start} to {clash.end}</strong>
                      </div>
                      <div className="versus-row">
                        {[clash.first, clash.second].map((artist) => (
                          <div key={artist.id}>
                            <h3>{artist.name}</h3>
                            <p>{getStage(artist.stage)?.shortName} · {formatTimeRange(getEffectiveTime(artist, setTimes))}</p>
                          </div>
                        ))}
                      </div>
                      <p className="meta-line">
                        <Clock size={14} />
                        {getDay(clash.day)?.label}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
};
