import { LineupView } from "../components/LineupView";
import type { Intent, IntentMap, SetTimeMap } from "../types";

interface HomeProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
}

export const Home = (props: HomeProps) => <LineupView {...props} />;
