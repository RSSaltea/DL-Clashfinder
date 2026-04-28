import { Cloud, Download, FileJson, RefreshCw, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { festivalDays } from "../data/lineup";
import type { Artist, ClashDecisionMap, FestivalExport, IntentMap, ProfilePlan, SetTimeMap } from "../types";
import { createExportPayload, downloadJson } from "../utils/export";
import type { GroupSyncState } from "../utils/groupSync";
import { getClashVoteSummary, getGroupClashDecisionMap } from "../utils/groupVotes";
import { parseImportedPlan } from "../utils/import";
import { loadFreeTimeWindow } from "../utils/localStorage";
import {
  buildScheduleDay,
  getGroupArtists,
  getStageLabel,
  getSupportMap,
  getSupportText,
} from "../utils/schedule";
import { getAllClashes } from "../utils/clash";
import { formatDuration, getEffectiveTime, minutesToTime, timeToMinutes, windowEndToMins } from "../utils/time";

interface ComparisonViewProps {
  intents: IntentMap;
  profileName: string;
  setProfileName: (value: string) => void;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  onAddImports: (newImports: FestivalExport[]) => void;
  onRemoveImport: (index: number) => void;
  personalClashDecisions: ClashDecisionMap;
  groupClashVotes: ClashDecisionMap;
  onGroupClashVoteChange: (clashId: string, artistId: string | undefined) => void;
  groupCode: string;
  setGroupCode: (value: string) => void;
  groupSyncState: GroupSyncState;
  onSyncGroup: () => void;
}

interface GroupRow {
  artist: Artist;
  supporters: string[];
  definiteSupporters: string[];
}

const sortArtists = (artists: Artist[]) =>
  [...artists].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day);
    }

    return a.order - b.order;
  });

const choiceButtonClass = (selected: boolean) => `choice-button ${selected ? "is-active" : ""}`;

export const ComparisonView = ({
  intents,
  profileName,
  setProfileName,
  setTimes,
  imports,
  syncedImports,
  onAddImports,
  onRemoveImport,
  personalClashDecisions,
  groupClashVotes,
  onGroupClashVoteChange,
  groupCode,
  setGroupCode,
  groupSyncState,
  onSyncGroup,
}: ComparisonViewProps) => {
  const [error, setError] = useState("");

  const freeTimeWindow = useMemo(() => loadFreeTimeWindow(), []);
  const windowStartMins = timeToMinutes(freeTimeWindow.start) ?? 600;
  const windowEndMins = windowEndToMins(freeTimeWindow.end);

  const profiles = useMemo<ProfilePlan[]>(
    () => [
      { id: "local", name: profileName || "Me", intents, setTimes, groupClashVotes, groupCode },
      ...syncedImports.map((item, index) => ({
        id: `synced-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
      ...imports.map((item, index) => ({
        id: `imported-${item.profileName}-${index}`,
        name: item.profileName,
        intents: item.intents,
        setTimes: item.setTimes,
        groupClashVotes: item.groupClashVotes,
        groupCode: item.groupCode,
      })),
    ],
    [groupClashVotes, groupCode, imports, intents, profileName, setTimes, syncedImports],
  );

  const combinedSetTimes = useMemo(
    () => profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {}),
    [profiles],
  );

  const supportMap = useMemo(() => getSupportMap(profiles), [profiles]);

  const groupRows = useMemo<GroupRow[]>(() => {
    return Array.from(supportMap.entries())
      .map(([artistId, support]) => {
        const artist = getGroupArtists(profiles).find((candidate) => candidate.id === artistId);

        if (!artist) {
          return undefined;
        }

        return {
          artist,
          supporters: support.supporters,
          definiteSupporters: support.definiteSupporters,
        };
      })
      .filter((row): row is GroupRow => Boolean(row))
      .sort((a, b) => {
        if (b.definiteSupporters.length !== a.definiteSupporters.length) {
          return b.definiteSupporters.length - a.definiteSupporters.length;
        }

        if (b.supporters.length !== a.supporters.length) {
          return b.supporters.length - a.supporters.length;
        }

        return a.artist.order - b.artist.order;
      });
  }, [profiles, supportMap]);

  const mutualWithMe = useMemo(() => {
    const localSelected = new Set(Object.keys(profiles[0].intents));
    const friendSelected = new Set(profiles.slice(1).flatMap((profile) => Object.keys(profile.intents)));

    return sortArtists(
      Array.from(localSelected)
        .filter((artistId) => friendSelected.has(artistId))
        .map((artistId) => groupRows.find((row) => row.artist.id === artistId)?.artist)
        .filter((artist): artist is Artist => Boolean(artist)),
    );
  }, [groupRows, profiles]);

  const allGroupClashes = useMemo(() => {
    const artists = groupRows.map((row) => row.artist);

    return getAllClashes(artists, combinedSetTimes);
  }, [combinedSetTimes, groupRows]);

  const groupClashes = useMemo(() => allGroupClashes.slice(0, 60), [allGroupClashes]);

  const groupDecisionMap = useMemo(
    () => getGroupClashDecisionMap(allGroupClashes, profiles),
    [allGroupClashes, profiles],
  );

  const groupFreeTimeData = useMemo(
    () =>
      festivalDays.map((day) => ({
        day,
        schedule: buildScheduleDay(
          day.id,
          getGroupArtists(profiles, day.id),
          combinedSetTimes,
          groupDecisionMap,
          windowStartMins,
          windowEndMins,
          supportMap,
        ),
      })),
    [combinedSetTimes, groupDecisionMap, profiles, supportMap, windowEndMins, windowStartMins],
  );

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
    downloadJson(createExportPayload(profileName, intents, setTimes, personalClashDecisions, groupCode, groupClashVotes));
  };

  const windowEndLabel = freeTimeWindow.end === "00:00" ? "Midnight" : freeTimeWindow.end;

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Share and decide together</p>
          <h1>Compare Plans</h1>
        </div>
        <p className="muted">Type the same group code as your friends and plans sync automatically.</p>
      </section>

      <section className="compare-actions">
        <label className="text-field">
          <span>Your name</span>
          <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
        </label>
        <label className="text-field">
          <span>Group code</span>
          <input
            value={groupCode}
            placeholder="e.g. download-crew"
            onChange={(event) => setGroupCode(event.target.value)}
          />
        </label>
        <button
          className="secondary-button sync-button"
          type="button"
          onClick={onSyncGroup}
          disabled={!groupCode || groupSyncState.status === "syncing"}
        >
          <RefreshCw size={18} />
          {groupSyncState.status === "syncing" ? "Syncing" : "Sync now"}
        </button>
      </section>

      <div className={`info-strip sync-strip sync-strip--${groupSyncState.status}`}>
        <span>{groupSyncState.message}</span>
        {groupSyncState.lastSyncedAt && (
          <span>
            Last sync {new Date(groupSyncState.lastSyncedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <details className="backup-panel">
        <summary>JSON backup</summary>
        <div className="backup-actions">
          <button className="secondary-button" type="button" onClick={handleExport}>
            <Download size={18} />
            Export JSON
          </button>
          <label className="file-drop file-drop--compact">
            <Upload size={20} />
            <span>Import JSON</span>
            <input type="file" accept="application/json,.json" multiple onChange={handleImport} />
          </label>
        </div>
      </details>

      {error && <div className="error-banner">{error}</div>}

      {(syncedImports.length > 0 || imports.length > 0) && (
        <section className="import-list" aria-label="Shared and imported plans">
          {syncedImports.map((item, index) => (
            <div className="import-pill sync-pill" key={`synced-${item.profileName}-${item.exportedAt}-${index}`}>
              <Cloud size={16} />
              <span>{item.profileName}{item.groupCode ? ` - ${item.groupCode}` : ""} - synced</span>
            </div>
          ))}
          {imports.map((item, index) => (
            <div className="import-pill" key={`imported-${item.profileName}-${item.exportedAt}-${index}`}>
              <FileJson size={16} />
              <span>{item.profileName}{item.groupCode ? ` - ${item.groupCode}` : ""}</span>
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
            <p className="muted">Use the same group code as friends to see shared artists.</p>
          ) : (
            <div className="compact-list">
              {mutualWithMe.map((artist) => {
                const support = supportMap.get(artist.id);

                return (
                  <div key={artist.id}>
                    <strong>{artist.name}</strong>
                    <span>{getStageLabel(artist)} - {getSupportText(support)}</span>
                  </div>
                );
              })}
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
                  <span>
                    {getStageLabel(row.artist)} - {row.supporters.length} picks, {row.definiteSupporters.length} definite - {row.supporters.join(", ")}
                  </span>
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
            <p>Sync a group code or pick overlapping artists to compare decisions.</p>
          </div>
        ) : (
          <div className="comparison-grid">
            {groupClashes.map((clash) => (
              <article className="clash-card" key={clash.id}>
                {(() => {
                  const voteSummary = getClashVoteSummary(clash, profiles);
                  const winner = [clash.first, clash.second].find((artist) => artist.id === voteSummary.winnerId);
                  const localVote = groupClashVotes[clash.id];

                  return (
                    <>
                      <div className="clash-card__time">
                        <strong>{clash.start} to {clash.end}</strong>
                        <span>{festivalDays.find((day) => day.id === clash.first.day)?.shortLabel}</span>
                      </div>
                      <div className="versus-row">
                        {[clash.first, clash.second].map((artist) => {
                          const support = supportMap.get(artist.id);
                          const time = getEffectiveTime(artist, combinedSetTimes);
                          const voters = voteSummary.votesByArtist[artist.id] ?? [];

                          return (
                            <div key={artist.id} className={voteSummary.winnerId === artist.id ? "vote-leader" : ""}>
                              <h3>{artist.name}</h3>
                              <p>{getStageLabel(artist)} - {time.start} to {time.end}</p>
                              <p>{getSupportText(support)}</p>
                              <p>{voters.length} vote{voters.length !== 1 ? "s" : ""}{voters.length > 0 ? ` - ${voters.join(", ")}` : ""}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="vote-result">
                        {winner
                          ? `${winner.name} is winning and will be used in the group itinerary.`
                          : voteSummary.isTie
                            ? "Tied vote - unresolved, so neither act is removed from the group itinerary yet."
                            : "No group votes yet."}
                      </div>
                      <div className="clash-choice-row" aria-label={`Vote between ${clash.first.name} and ${clash.second.name}`}>
                        {[clash.first, clash.second].map((artist) => {
                          const selected = localVote === artist.id;

                          return (
                            <button
                              key={artist.id}
                              type="button"
                              className={choiceButtonClass(selected)}
                              onClick={() => onGroupClashVoteChange(clash.id, selected ? undefined : artist.id)}
                            >
                              Vote {artist.name}
                            </button>
                          );
                        })}
                        {localVote && (
                          <button type="button" className="choice-button" onClick={() => onGroupClashVoteChange(clash.id, undefined)}>
                            Clear vote
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="day-group">
        <div className="day-heading">
          <h2>Group Free Time</h2>
          <span>{freeTimeWindow.start} - {windowEndLabel}</span>
        </div>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Periods where the group itinerary has no chosen set. Adjust the window on the Free Time page.
        </p>

        {groupRows.length === 0 ? (
          <div className="empty-state">
            <p>Sync friend plans and mark artists to see group free time.</p>
          </div>
        ) : (
          groupFreeTimeData.map(({ day, schedule }) => (
            <div className="day-group" key={day.id} style={{ marginTop: "0.5rem" }}>
              <div className="day-heading">
                <h3 style={{ fontSize: "1.1rem" }}>{day.label}</h3>
                <span>{schedule.gaps.length} gap{schedule.gaps.length !== 1 ? "s" : ""}</span>
              </div>

              {schedule.excludedCount > 0 && (
                <p className="muted">{schedule.excludedCount} clash choice removed from group free time.</p>
              )}

              {schedule.gaps.length === 0 ? (
                <div className="empty-state tight">
                  <p className="muted">Someone in the group is always busy on this day.</p>
                </div>
              ) : (
                <div className="gap-list">
                  {schedule.gaps.map((gap) => {
                    const endLabel = gap.end === 1440 ? "00:00" : minutesToTime(gap.end);
                    const duration = formatDuration(gap.end - gap.start);

                    return (
                      <div className="gap-card" key={`${day.id}-${gap.start}-${gap.end}`}>
                        {gap.comingFrom && (
                          <div className="gap-bookend gap-bookend--from">
                            <span>Finishing</span>
                            <strong>{gap.comingFrom.artist.name}</strong>
                            <span>
                              {getStageLabel(gap.comingFrom.artist)} - {getSupportText(gap.comingFrom.supporters)}
                            </span>
                          </div>
                        )}
                        <div className="gap-card__header">
                          <strong>{minutesToTime(gap.start)} - {endLabel}</strong>
                          <span>{duration} free</span>
                        </div>
                        {gap.playing.length === 0 ? (
                          <p className="muted" style={{ fontSize: "0.9rem" }}>Nobody else playing during this gap.</p>
                        ) : (
                          <div className="compact-list">
                            {gap.playing.map(({ artist, start, end }) => (
                              <div key={artist.id}>
                                <strong>{artist.name}</strong>
                                <span>{getStageLabel(artist)} - {minutesToTime(start)} to {minutesToTime(end)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {gap.goingTo && (
                          <div className="gap-bookend gap-bookend--to">
                            <span>Heading to</span>
                            <strong>{gap.goingTo.artist.name}</strong>
                            <span>
                              {getStageLabel(gap.goingTo.artist)} - {getSupportText(gap.goingTo.supporters)}
                            </span>
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
