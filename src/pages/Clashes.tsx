import { ClashView } from "../components/ClashView";
import type { IntentMap, SetTimeMap } from "../types";

interface ClashesProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
}

export const Clashes = (props: ClashesProps) => <ClashView {...props} />;
