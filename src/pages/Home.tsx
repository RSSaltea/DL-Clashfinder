import { LineupView } from "../components/LineupView";
import type { ArtistSetTime, Intent, IntentMap, SetTimeMap } from "../types";

interface HomeProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
  onTimeChange: (artistId: string, value: ArtistSetTime) => void;
}

export const Home = (props: HomeProps) => <LineupView {...props} />;
