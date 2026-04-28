import { ComparisonView } from "../components/ComparisonView";
import type { FestivalExport, IntentMap, SetTimeMap } from "../types";

interface CompareProps {
  intents: IntentMap;
  profileName: string;
  setProfileName: (value: string) => void;
  setTimes: SetTimeMap;
  imports: FestivalExport[];
  onAddImports: (newImports: FestivalExport[]) => void;
  onRemoveImport: (index: number) => void;
}

export const Compare = (props: CompareProps) => <ComparisonView {...props} />;
