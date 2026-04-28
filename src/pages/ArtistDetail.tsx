import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { IntentButtons } from "../components/IntentButtons";
import { SpotifyPanel } from "../components/SpotifyPanel";
import { getArtistById, getDay, getStage, lineup } from "../data/lineup";
import type { Intent, IntentMap, SetTimeMap } from "../types";
import { getClashesForArtist } from "../utils/clash";
import { formatTimeRange, getEffectiveTime } from "../utils/time";

interface ArtistDetailProps {
  intents: IntentMap;
  setTimes: SetTimeMap;
  onIntentChange: (artistId: string, intent: Intent) => void;
}

export const ArtistDetail = ({
  intents,
  onIntentChange,
  setTimes,
}: ArtistDetailProps) => {
  const { artistId } = useParams();
  const artist = getArtistById(artistId);

  if (!artist) {
    return (
      <main className="page-shell">
        <div className="empty-state">
          <h1>Artist not found.</h1>
          <Link className="secondary-button" to="/">
            <ArrowLeft size={17} />
            Back to lineup
          </Link>
        </div>
      </main>
    );
  }

  const day = getDay(artist.day);
  const stage = getStage(artist.stage);
  const time = getEffectiveTime(artist, setTimes);
  const clashes = getClashesForArtist(artist, lineup, setTimes);
  const dayLabel = day?.label ?? "Time TBC";

  return (
    <main className="page-shell artist-detail">
      <Link className="secondary-button fit-content" to="/">
        <ArrowLeft size={17} />
        Back
      </Link>

      <section className={`artist-hero stage-${artist.stage}`}>
        <div>
          <p className="eyebrow">{day?.label} · {stage?.name}</p>
          <h1>{artist.name}</h1>
          <p>{formatTimeRange(time, dayLabel)}</p>
        </div>
        <IntentButtons intent={intents[artist.id]} onChange={(intent) => onIntentChange(artist.id, intent)} />
      </section>

      <section className="detail-grid">
        <article className="summary-panel">
          <h2>Set Time</h2>
          <p className="time-range">{formatTimeRange(time, dayLabel)}</p>
          {clashes.length > 0 && (
            <div className="clash-badge wide">
              <AlertTriangle size={17} />
              <span>Clashes with {clashes.map((clash) => clash.name).join(", ")}</span>
            </div>
          )}
        </article>

        <article className="summary-panel">
          <h2>Slot</h2>
          <div className="slot-facts">
            <div>
              <span>Day</span>
              <strong>{day?.label}</strong>
            </div>
            <div>
              <span>Stage</span>
              <strong>{stage?.name}</strong>
            </div>
            <div>
              <span>Poster order</span>
              <strong>{artist.order}</strong>
            </div>
          </div>
        </article>
      </section>

      <SpotifyPanel artist={artist} />
    </main>
  );
};
