import { BadgeCheck, Heart, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { getDaySortIndex, getFestivalDays, getLineup } from "../data/lineup";
import type {
  Artist,
  ClashDecisionMap,
  DayId,
  FestivalExport,
  GroupMemberRole,
  Intent,
  IntentMap,
  ProfilePlan,
  SetTimeMap,
} from "../types";
import { getAllClashes } from "../utils/clash";
import { getGroupClashDecisionMap } from "../utils/groupVotes";
import { buildScheduleDay, getGroupArtists, getStageLabel, getSupportMap, type TimedArtist } from "../utils/schedule";
import { minutesToTime } from "../utils/time";

interface PlanListProps {
  intents: IntentMap;
  profileName: string;
  accountUsername?: string;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
  imports: FestivalExport[];
  syncedImports: FestivalExport[];
  groupClashVotes: ClashDecisionMap;
  groupCode: string;
  myGroupRole: GroupMemberRole;
  includeDistrictX: boolean;
}

interface PlannedRow {
  item: TimedArtist;
  dayId: DayId;
  dayLabel: string;
  dayShortLabel: string;
  intent?: Intent;
  supporters?: string[];
  definiteSupporters?: string[];
}

const windowStartMins = 0;
const windowEndMins = 30 * 60;

const sortRows = (rows: PlannedRow[]) =>
  [...rows].sort((a, b) => {
    if (a.dayId !== b.dayId) {
      return getDaySortIndex(a.dayId) - getDaySortIndex(b.dayId);
    }

    if (a.item.start !== b.item.start) {
      return a.item.start - b.item.start;
    }

    return a.item.artist.order - b.item.artist.order;
  });

const buildRows = (
  schedules: ReturnType<typeof buildScheduleDay>[],
  days: ReturnType<typeof getFestivalDays>,
  getExtra: (artist: Artist, item: TimedArtist) => Pick<PlannedRow, "intent" | "supporters" | "definiteSupporters">,
) => {
  const dayMap = new Map(days.map((day) => [day.id, day]));

  return sortRows(
    schedules.flatMap((schedule) =>
      schedule.attending.map((item) => {
        const day = dayMap.get(schedule.dayId);

        return {
          item,
          dayId: schedule.dayId,
          dayLabel: day?.label ?? schedule.dayId,
          dayShortLabel: day?.shortLabel ?? schedule.dayId,
          ...getExtra(item.artist, item),
        };
      }),
    ),
  );
};

const getProfiles = (
  profileName: string,
  accountUsername: string | undefined,
  intents: IntentMap,
  setTimes: SetTimeMap,
  groupClashVotes: ClashDecisionMap,
  groupCode: string,
  myGroupRole: GroupMemberRole,
  syncedImports: FestivalExport[],
  imports: FestivalExport[],
): ProfilePlan[] => [
  {
    id: "local",
    name: profileName || "Me",
    accountUsername,
    intents,
    setTimes,
    groupClashVotes,
    groupCode,
    groupRole: myGroupRole,
  },
  ...syncedImports.map((item, index) => ({
    id: `synced-${item.profileName}-${index}`,
    name: item.profileName,
    accountUsername: item.accountUsername,
    intents: item.intents,
    setTimes: item.setTimes,
    groupClashVotes: item.groupClashVotes,
    groupCode: item.groupCode,
    groupRole: item.groupRole,
  })),
  ...imports.map((item, index) => ({
    id: `imported-${item.profileName}-${index}`,
    name: item.profileName,
    accountUsername: item.accountUsername,
    intents: item.intents,
    setTimes: item.setTimes,
    groupClashVotes: item.groupClashVotes,
    groupCode: item.groupCode,
    groupRole: item.groupRole,
  })),
];

const IntentBadge = ({ intent }: { intent?: Intent }) => {
  if (!intent) {
    return null;
  }

  const Icon = intent === "definite" ? BadgeCheck : Heart;

  return (
    <span className={`planned-badge planned-badge--${intent}`}>
      <Icon size={14} />
      {intent === "definite" ? "Definite" : "Interested"}
    </span>
  );
};

const PlannedSection = ({
  title,
  subtitle,
  rows,
  emptyText,
  group,
}: {
  title: string;
  subtitle: string;
  rows: PlannedRow[];
  emptyText: string;
  group?: boolean;
}) => (
  <section className="summary-panel planned-panel">
    <div className="planned-panel__top">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <strong>{rows.length}</strong>
    </div>

    {rows.length === 0 ? (
      <div className="empty-state tight">
        <p className="muted">{emptyText}</p>
      </div>
    ) : (
      <div className="planned-list">
        {rows.map((row) => {
          const supporters = row.supporters ?? [];
          const definiteSupporters = row.definiteSupporters ?? [];
          const supporterText = supporters.length > 0 ? supporters.join(", ") : "";

          return (
            <article key={`${row.dayId}-${row.item.artist.id}`} className={`planned-row stage-${row.item.artist.stage}`}>
              <div className="planned-row__time">
                <strong>{row.dayShortLabel}</strong>
                <span>{minutesToTime(row.item.start)} - {minutesToTime(row.item.end)}</span>
              </div>
              <div className="planned-row__main">
                <h3>
                  {row.item.artist.name}
                  {group && supporterText ? <span>Picked by {supporterText}</span> : null}
                </h3>
                <p>{row.dayLabel} - {getStageLabel(row.item.artist)}</p>
              </div>
              {group ? (
                <span className="planned-badge planned-badge--group">
                  <UsersRound size={14} />
                  {supporters.length} {supporters.length === 1 ? "pick" : "picks"}
                  {definiteSupporters.length > 0 ? `, ${definiteSupporters.length} definite` : ""}
                </span>
              ) : (
                <IntentBadge intent={row.intent} />
              )}
            </article>
          );
        })}
      </div>
    )}
  </section>
);

export const PlanList = ({
  intents,
  profileName,
  accountUsername,
  setTimes,
  clashDecisions,
  imports,
  syncedImports,
  groupClashVotes,
  groupCode,
  myGroupRole,
  includeDistrictX,
}: PlanListProps) => {
  const days = useMemo(() => getFestivalDays(includeDistrictX), [includeDistrictX]);
  const visibleLineup = useMemo(() => getLineup(includeDistrictX), [includeDistrictX]);

  const soloSchedules = useMemo(
    () =>
      days.map((day) => {
        const pickedOnDay = visibleLineup.filter((artist) => artist.day === day.id && Boolean(intents[artist.id]));
        return buildScheduleDay(day.id, pickedOnDay, setTimes, clashDecisions, windowStartMins, windowEndMins, undefined, visibleLineup);
      }),
    [clashDecisions, days, intents, setTimes, visibleLineup],
  );

  const soloRows = useMemo(
    () => buildRows(soloSchedules, days, (artist) => ({ intent: intents[artist.id] })),
    [days, intents, soloSchedules],
  );

  const profiles = useMemo(
    () => getProfiles(profileName, accountUsername, intents, setTimes, groupClashVotes, groupCode, myGroupRole, syncedImports, imports),
    [accountUsername, groupClashVotes, groupCode, imports, intents, myGroupRole, profileName, setTimes, syncedImports],
  );

  const groupRows = useMemo(() => {
    if (!groupCode && imports.length === 0 && syncedImports.length === 0) {
      return [];
    }

    const combinedSetTimes = profiles.reduce<SetTimeMap>((acc, profile) => ({ ...acc, ...profile.setTimes }), {});
    const supportMap = getSupportMap(profiles);
    const groupArtists = getGroupArtists(profiles, undefined, visibleLineup);
    const groupDecisionMap = getGroupClashDecisionMap(getAllClashes(groupArtists, combinedSetTimes), profiles);
    const schedules = days.map((day) =>
      buildScheduleDay(
        day.id,
        getGroupArtists(profiles, day.id, visibleLineup),
        combinedSetTimes,
        groupDecisionMap,
        windowStartMins,
        windowEndMins,
        supportMap,
        visibleLineup,
      ),
    );

    return buildRows(schedules, days, (_artist, item) => ({
      supporters: item.supporters?.supporters ?? [],
      definiteSupporters: item.supporters?.definiteSupporters ?? [],
    }));
  }, [days, groupCode, imports.length, profiles, syncedImports.length, visibleLineup]);

  return (
    <main className="page-shell">
      <section className="toolbar-band">
        <div>
          <p className="eyebrow">Quick reference</p>
          <h1>Plan List</h1>
        </div>
        <div className="toolbar-right">
          <div className="stat-grid">
            <div>
              <strong>{soloRows.length}</strong>
              <span>solo</span>
            </div>
            <div>
              <strong>{groupRows.length}</strong>
              <span>group</span>
            </div>
          </div>
        </div>
      </section>

      <div className="planned-grid">
        <PlannedSection
          title="Solo Plan"
          subtitle="Bands you have marked as interested or definite, after your clash choices."
          rows={soloRows}
          emptyText="No solo picks yet."
        />
        <PlannedSection
          title="Group Plan"
          subtitle="Bands selected by your group, after group clash votes."
          rows={groupRows}
          emptyText="Join a group code or import plans to build a group list."
          group
        />
      </div>
    </main>
  );
};
