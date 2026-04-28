import { ComparisonView } from "../components/ComparisonView";
import type { IntentMap, SetTimeMap } from "../types";

interface CompareProps {
  intents: IntentMap;
  profileName: string;
  setProfileName: (value: string) => void;
  setTimes: SetTimeMap;
}

export const Compare = (props: CompareProps) => <ComparisonView {...props} />;
