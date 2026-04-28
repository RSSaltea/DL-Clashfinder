import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { festivalDays, festivalStages, lineup } from "../data/lineup";
import type { Artist, DayId, Intent, IntentMap, SetTimeMap, StageId } from "../types";
import { getAllClashes } from "../utils/clash";
import { getEffectiveTime } from "../utils/time";
import { ArtistCard } from "./ArtistCard";

type DayFilter = "all" | DayId;
type StageFilter = "all" | StageId;
type StatusFilter = "all" | "selected" | Intent;

const downloadLogoUrl = `${import.meta.env.BASE_URL}download-festival-logo.svg`;

interface LineupViewProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
  onTimeChange: (artistId: string, value: { start?: string; end?: string }) => void;
}

const artistMatchesStatus = (artist: Artist, intents: IntentMap, status: StatusFilter) => {
  if (status === "all") {
    return true;
  }

  if (status === "selected") {
    return Boolean(intents[artist.id]);
  }

  return intents[artist.id] === status;
};

export const LineupView = ({ intents, onIntentChange, onTimeChange, setTimes }: LineupViewProps) => {
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const clashMap = useMemo(() => {
    const map = new Map<string, Artist[]>();
    getAllClashes(lineup, setTimes).forEach((clash) => {
      map.set(clash.first.id, [...(map.get(clash.first.id) ?? []), clash.second]);
      map.set(clash.second.id, [...(map.get(clash.second.id) ?? []), clash.first]);
    });
    return map;
  }, [setTimes]);

  const visibleArtists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lineup.filter((artist) => {
      if (dayFilter !== "all" && artist.day !== dayFilter) {
        return false;
      }

      if (stageFilter !== "all" && artist.stage !== stageFilter) {
        return false;
      }

      if (!artistMatchesStatus(artist, intents, statusFilter)) {
        return false;
      }

      return !query || artist.name.toLowerCase().includes(query);
    });
  }, [dayFilter, intents, search, stageFilter, statusFilter]);

  const totals = useMemo(() => {
    const selected = Object.keys(intents).length;
    const definite = Object.values(intents).filter((intent) => intent === "definite").length;
    const timed = lineup.filter((artist) => {
      const time = getEffectiveTime(artist, setTimes);
      return time.start && time.end;
    }).length;
    const clashingSelections = Array.from(clashMap.entries()).filter(([artistId]) => intents[artistId]).length;

    return { selected, definite, timed, clashingSelections };
  }, [clashMap, intents, setTimes]);

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <img className="hero-download-logo" src={downloadLogoUrl} alt="Download Festival" />
          <p className="eyebrow">Download Festival 2026</p>
          <h1>Clash Finder</h1>
        </div>
        <div className="stat-grid">
          <div>
            <strong>{totals.selected}</strong>
            <span>picked</span>
          </div>
          <div>
            <strong>{totals.definite}</strong>
            <span>definite</span>
          </div>
          <div>
            <strong>{totals.timed}</strong>
            <span>timed</span>
          </div>
          <div>
            <strong>{totals.clashingSelections}</strong>
            <span>clashing</span>
          </div>
        </div>
      </section>

      <section className="filters-panel" aria-label="Lineup filters">
        <div className="segmented-control">
          <button
            type="button"
            className={dayFilter === "all" ? "is-active" : ""}
            onClick={() => setDayFilter("all")}
          >
            All
          </button>
          {festivalDays.map((day) => (
            <button
              key={day.id}
              type="button"
              className={dayFilter === day.id ? "is-active" : ""}
              onClick={() => setDayFilter(day.id)}
            >
              {day.shortLabel}
            </button>
          ))}
        </div>

        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search artists"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="select-field">
          <Filter size={18} />
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as StageFilter)}>
            <option value="all">All stages</option>
            {festivalStages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.shortName}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <SlidersHorizontal size={18} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">All artists</option>
            <option value="selected">Picked</option>
            <option value="interested">Interested</option>
            <option value="definite">Definite</option>
          </select>
        </label>
      </section>

      <section className="lineup-section">
        {festivalDays
          .filter((day) => dayFilter === "all" || day.id === dayFilter)
          .map((day) => {
            const dayArtists = visibleArtists.filter((artist) => artist.day === day.id);

            if (dayArtists.length === 0) {
              return null;
            }

            return (
              <div className="day-group" key={day.id}>
                <div className="day-heading">
                  <h2>{day.label}</h2>
                  <span>{dayArtists.length} artists</span>
                </div>

                <div className="stage-grid">
                  {festivalStages
                    .filter((stage) => stageFilter === "all" || stage.id === stageFilter)
                    .map((stage) => {
                      const stageArtists = dayArtists
                        .filter((artist) => artist.stage === stage.id)
                        .sort((a, b) => a.order - b.order);

                      if (stageArtists.length === 0) {
                        return null;
                      }

                      return (
                        <div className="stage-column" key={stage.id}>
                          <h3 className={`stage-title stage-${stage.id}`}>{stage.name}</h3>
                          <div className="artist-list">
                            {stageArtists.map((artist) => (
                              <ArtistCard
                                key={artist.id}
                                artist={artist}
                                clashes={clashMap.get(artist.id) ?? []}
                                intent={intents[artist.id]}
                                onIntentChange={onIntentChange}
                                onTimeChange={onTimeChange}
                                time={getEffectiveTime(artist, setTimes)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}

        {visibleArtists.length === 0 && (
          <div className="empty-state">
            <h2>No artists match those filters.</h2>
            <p>Clear a filter or search for a different artist.</p>
          </div>
        )}
      </section>
    </main>
  );
};
