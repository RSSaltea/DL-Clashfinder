import type { ClashDecisionMap, ClashPair, ProfilePlan } from "../types";

export interface ClashVoteSummary {
  winnerId?: string;
  isTie: boolean;
  totalVotes: number;
  votesByArtist: Record<string, string[]>;
}

export const getClashVoteSummary = (
  clash: ClashPair,
  profiles: ProfilePlan[],
): ClashVoteSummary => {
  const votesByArtist: Record<string, string[]> = {
    [clash.first.id]: [],
    [clash.second.id]: [],
  };

  profiles.forEach((profile) => {
    const vote = profile.groupClashVotes?.[clash.id];

    if (vote === clash.first.id || vote === clash.second.id) {
      votesByArtist[vote].push(profile.name);
    }
  });

  const firstVotes = votesByArtist[clash.first.id].length;
  const secondVotes = votesByArtist[clash.second.id].length;
  const totalVotes = firstVotes + secondVotes;
  const isTie = totalVotes > 0 && firstVotes === secondVotes;
  const winnerId = firstVotes > secondVotes
    ? clash.first.id
    : secondVotes > firstVotes
      ? clash.second.id
      : undefined;

  return {
    winnerId,
    isTie,
    totalVotes,
    votesByArtist,
  };
};

export const getGroupClashDecisionMap = (
  clashes: ClashPair[],
  profiles: ProfilePlan[],
): ClashDecisionMap =>
  clashes.reduce<ClashDecisionMap>((acc, clash) => {
    const summary = getClashVoteSummary(clash, profiles);

    if (summary.winnerId) {
      acc[clash.id] = summary.winnerId;
    }

    return acc;
  }, {});
