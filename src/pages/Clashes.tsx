import { ClashView } from "../components/ClashView";
import type { ClashDecisionMap, IntentMap, SetTimeMap } from "../types";

interface ClashesProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  clashDecisions: ClashDecisionMap;
  onClashDecisionChange: (clashId: string, artistId: string | undefined) => void;
}

export const Clashes = (props: ClashesProps) => <ClashView {...props} />;
