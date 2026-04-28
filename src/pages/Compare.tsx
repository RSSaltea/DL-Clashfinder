import { ComparisonView } from "../components/ComparisonView";
import type { ClashDecisionMap, FestivalExport, IntentMap, SetTimeMap } from "../types";
import type { GroupSyncState } from "../utils/groupSync";

interface CompareProps {
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
  groupCodeDraft: string;
  setGroupCodeDraft: (value: string) => void;
  groupCodes: string[];
  groupSyncState: GroupSyncState;
  onSyncGroup: (groupCode?: string) => void;
}

export const Compare = (props: CompareProps) => <ComparisonView {...props} />;
