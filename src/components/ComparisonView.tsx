import { Download, FileJson, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { artistById, festivalDays, getStage, lineup } from "../data/lineup";
import type { Artist, FestivalExport, IntentMap, SetTimeMap } from "../types";
import { createExportPayload, downloadJson } from "../utils/export";
import { parseImportedPlan } from "../utils/import";
import { loadFreeTimeWindow } from "../utils/localStorage";
import { computeFreeGaps, formatDuration, getEffectiveTime, getOverlapRange, minutesToTime, timeToMinutes, windowEndToMins } from "../utils/time";

interface ComparisonViewProps {
  intents: IntentMap;
  profileName: string;
  setProfileName: (value: string) => void;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  onAddImports: (newImports: FestivalExport[]) => void;
  onRemoveImport: (index: number) => void;
}

interface ProfilePlan {
  id: string;
  name: string;
  intents: IntentMap;
  setTimes: SetTimeMap;
}

const selectedIdsFor = (plan: ProfilePlan) => new Set(Object.keys(plan.intents));

const sortArtists = (artists: Artist[]) =>
  [...artists].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day);
    }

    return a.order - b.order;
  });

export const ComparisonView = ({
  intents,
  profileName,
  setProfileName,
  setTimes,
  imports,
  onAddImports,
  onRemoveImport,
}: ComparisonViewProps) => {
  const [error, setError] = useState("");

  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const profiles = useMemo<ProfilePlan[]>(() => [
    { id: "local", name: profileName || "Me", intents, setTimes },
    ...imports.map((item, index) => ({
      id: `${item.profileName}-${index}`,
      name: item.profileName,
      intents: item.intents,
      setTimes: item.setTimes,
    })),
  ], [imports, intents, profileName, setTimes]);

  const combinedSetTimes = useMemo(
    () => profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {}),
    [profiles],
  );

  const groupRows = useMemo(() => {
    const artistIds = new Set(profiles.flatMap((profile) => Object.keys(profile.intents)));

    return Array.from(artistIds)
      .map((artistId) => {
        const artist = artistById.get(artistId);

        if (!artist) {
          return undefined;
        }

        const supporters = profiles.filter((profile) => profile.intents[artistId]);
        const definiteSupporters = supporters.filter((profile) => profile.intents[artistId] === "definite");

        return {
          artist,
          supporters,
          definiteSupporters,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => {
        if (b.definiteSupporters.length !== a.definiteSupporters.length) {
          return b.definiteSupporters.length - a.definiteSupporters.length;
        }

        if (b.supporters.length !== a.supporters.length) {
          return b.supporters.length - a.supporters.length;
        }

        return a.artist.order - b.artist.order;
      });
  }, [profiles]);

  const mutualWithMe = useMemo(() => {
    const localSelected = selectedIdsFor(profiles[0]);
    const friendSelected = new Set(profiles.slice(1).flatMap((profile) => Object.keys(profile.intents)));

    return sortArtists(
      Array.from(localSelected)
        .filter((artistId) => friendSelected.has(artistId))
        .map((artistId) => artistById.get(artistId))
        .filter((artist): artist is Artist => Boolean(artist)),
    );
  }, [profiles]);

  const groupClashes = useMemo(() => {
    const rows = groupRows.map((row) => row.artist);
    const clashes: Array<{
      id: string;
      first: Artist;
      second: Artist;
      start: string;
      end: string;
      firstSupporters: string;
      secondSupporters: string;
    }> = [];

    rows.forEach((first, index) => {
      rows.slice(index + 1).forEach((second) => {
        if (first.day !== second.day) {
          return;
        }

        const overlap = getOverlapRange(
          getEffectiveTime(first, combinedSetTimes),
          getEffectiveTime(second, combinedSetTimes),
        );

        if (!overlap) {
          return;
        }

        const firstRow = groupRows.find((row) => row.artist.id === first.id);
        const secondRow = groupRows.find((row) => row.artist.id === second.id);

        clashes.push({
          id: `${first.id}-${second.id}`,
          first,
          second,
          start: overlap.start,
          end: overlap.end,
          firstSupporters: firstRow?.supporters.map((profile) => profile.name).join(", ") ?? "",
          secondSupporters: secondRow?.supporters.map((profile) => profile.name).join(", ") ?? "",
        });
      });
    });

    return clashes.slice(0, 40);
  }, [combinedSetTimes, groupRows]);

  const groupFreeTimeData = useMemo(() => {
    return festivalDays.map((day) => {
      const allGroupArtists = profiles.flatMap((profile) =>
        lineup.filter((artist) => artist.day === day.id && Boolean(profile.intents[artist.id])),
      );
      const uniqueGroupArtists = Array.from(new Map(allGroupArtists.map((a) => [a.id, a])).values());

      const gaps = computeFreeGaps(uniqueGroupArtists, combinedSetTimes, windowStartMins, windowEndMins);

      const allGroupIds = new Set(uniqueGroupArtists.map((a) => a.id));

      const gapsWithPlaying = gaps.map((gap) => {
        const playing = lineup.filter((artist) => {
          if (artist.day !== day.id) return false;
          if (allGroupIds.has(artist.id)) return false;
          const t = getEffectiveTime(artist, combinedSetTimes);
          const start = timeToMinutes(t.start);
          const end = timeToMinutes(t.end);
          if (start === undefined || end === undefined) return false;
          return start < gap.end && end > gap.start;
        });

        const comingFrom = uniqueGroupArtists.find((a) => {
          const t = getEffectiveTime(a, combinedSetTimes);
          return timeToMinutes(t.end) === gap.start;
        }) ?? null;

        const goingTo = gap.end === windowEndMins
          ? null
          : uniqueGroupArtists.find((a) => {
              const t = getEffectiveTime(a, combinedSetTimes);
              return timeToMinutes(t.start) === gap.end;
            }) ?? null;

        return { ...gap, playing, comingFrom, goingTo };
      });

      return { day, gaps: gapsWithPlaying };
    });
  }, [profiles, combinedSetTimes, windowStartMins, windowEndMins]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setError("");

    try {
      const parsed = await Promise.all(files.map(parseImportedPlan));
      onAddImports(parsed);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  };

  const handleExport = () => {
    downloadJson(createExportPayload(profileName, intents, setTimes));
  };

  const windowEndLabel = freeTimeWindow.end === "00:00" ? "Midnight" : freeTimeWindow.end;

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Share and decide together</p>
          <h1>Compare Plans</h1>
        </div>
        <button className="primary-button" type="button" onClick={handleExport}>
          <Download size={18} />
          Export JSON
        </button>
      </section>

      <section className="compare-actions">
        <label className="text-field">
          <span>Your name</span>
          <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
        </label>
        <label className="file-drop">
          <Upload size={20} />
          <span>Import friend JSON</span>
          <input type="file" accept="application/json,.json" multiple onChange={handleImport} />
        </label>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {imports.length > 0 && (
        <section className="import-list" aria-label="Imported plans">
          {imports.map((item, index) => (
            <div className="import-pill" key={`${item.profileName}-${item.exportedAt}`}>
              <FileJson size={16} />
              <span>{item.profileName}</span>
              <button
                type="button"
                title={`Remove ${item.profileName}`}
                onClick={() => onRemoveImport(index)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="comparison-grid">
        <article className="summary-panel">
          <h2>Mutual Picks</h2>
          {mutualWithMe.length === 0 ? (
            <p className="muted">Import a friend plan to see shared artists.</p>
          ) : (
            <div className="compact-list">
              {mutualWithMe.map((artist) => (
                <div key={artist.id}>
                  <strong>{artist.name}</strong>
                  <span>{getStage(artist.stage)?.shortName}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="summary-panel">
          <h2>Group Demand</h2>
          {groupRows.length === 0 ? (
            <p className="muted">Mark artists first, then the group ranking appears here.</p>
          ) : (
            <div className="compact-list">
              {groupRows.slice(0, 16).map((row) => (
                <div key={row.artist.id}>
                  <strong>{row.artist.name}</strong>
                  <span>{row.supporters.length} picks · {row.definiteSupporters.length} definite</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="day-group">
        <div className="day-heading">
          <h2>Group Clashes</h2>
          <span>{groupClashes.length} shown</span>
        </div>
        {groupClashes.length === 0 ? (
          <div className="empty-state">
            <h2>No shared clashes yet.</h2>
            <p>Enter set times and import another plan to compare decisions.</p>
          </div>
        ) : (
          <div className="comparison-grid">
            {groupClashes.map((clash) => (
              <article className="clash-card" key={clash.id}>
                <div className="clash-card__time">
                  <strong>{clash.start} to {clash.end}</strong>
                  <span>{festivalDays.find((day) => day.id === clash.first.day)?.shortLabel}</span>
                </div>
                <div className="versus-row">
                  <div>
                    <h3>{clash.first.name}</h3>
                    <p>{clash.firstSupporters}</p>
                  </div>
                  <div>
                    <h3>{clash.second.name}</h3>
                    <p>{clash.secondSupporters}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="day-group">
        <div className="day-heading">
          <h2>Group Free Time</h2>
          <span>{freeTimeWindow.start} – {windowEndLabel}</span>
        </div>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Periods where nobody in the group has anyone playing. Adjust the window on the Free Time page.
        </p>

        {groupFreeTimeData.every((d) => d.gaps.length === 0) && groupRows.length === 0 ? (
          <div className="empty-state">
            <p>Import friend plans and mark artists to see group free time.</p>
          </div>
        ) : (
          groupFreeTimeData.map(({ day, gaps }) => (
            <div className="day-group" key={day.id} style={{ marginTop: "0.5rem" }}>
              <div className="day-heading">
                <h3 style={{ fontSize: "1.1rem" }}>{day.label}</h3>
                <span>{gaps.length} gap{gaps.length !== 1 ? "s" : ""}</span>
              </div>

              {gaps.length === 0 ? (
                <div className="empty-state tight">
                  <p className="muted">Someone in the group is always busy on this day.</p>
                </div>
              ) : (
                <div className="gap-list">
                  {gaps.map((gap) => {
                    const endLabel = gap.end === 1440 ? "00:00" : minutesToTime(gap.end);
                    const duration = formatDuration(gap.end - gap.start);

                    return (
                      <div className="gap-card" key={`${gap.start}-${gap.end}`}>
                        {gap.comingFrom && (
                          <div className="gap-bookend gap-bookend--from">
                            <span>Finishing</span>
                            <strong>{gap.comingFrom.name}</strong>
                            <span>ends {minutesToTime(gap.start)}</span>
                          </div>
                        )}
                        <div className="gap-card__header">
                          <strong>{minutesToTime(gap.start)} – {endLabel}</strong>
                          <span>{duration} free</span>
                        </div>
                        {gap.playing.length === 0 ? (
                          <p className="muted" style={{ fontSize: "0.9rem" }}>Nobody else playing during this gap.</p>
                        ) : (
                          <div className="compact-list">
                            {gap.playing.map((artist) => {
                              const t = getEffectiveTime(artist, combinedSetTimes);
                              return (
                                <div key={artist.id}>
                                  <strong>{artist.name}</strong>
                                  <span>{getStage(artist.stage)?.shortName} · {t.start}–{t.end}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {gap.goingTo && (
                          <div className="gap-bookend gap-bookend--to">
                            <span>Heading to</span>
                            <strong>{gap.goingTo.name}</strong>
                            <span>starts {minutesToTime(gap.end)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
};
