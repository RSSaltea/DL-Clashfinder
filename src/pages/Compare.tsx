import { ComparisonView } from "../components/ComparisonView";
import type { ClashDecisionMap, FestivalExport, IntentMap, SetTimeMap } from "../types";

interface CompareProps {
  intents: IntentMap;
  profileName: string;
  setProfileName: (value: string) => void;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  onAddImports: (newImports: FestivalExport[]) => void;
  onRemoveImport: (index: number) => void;
  clashDecisions: ClashDecisionMap;
  onClashDecisionChange: (clashId: string, artistId: string | undefined) => void;
  groupCode: string;
  setGroupCode: (value: string) => void;
}

export const Compare = (props: CompareProps) => <ComparisonView {...props} />;
