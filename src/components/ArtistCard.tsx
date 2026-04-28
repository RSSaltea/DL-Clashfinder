import { AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Artist, ArtistSetTime, Intent } from "../types";
import { formatTimeRange } from "../utils/time";
import { ArtistLogo } from "./ArtistLogo";
import { IntentButtons } from "./IntentButtons";
import { SetTimeInput } from "./SetTimeInput";

interface ArtistCardProps {
  artist: Artist;
  clashes: Artist[];
  intent?: Intent;
  time: ArtistSetTime;
  onIntentChange: (artistId: string, intent: Intent) => void;
  onTimeChange: (artistId: string, value: ArtistSetTime) => void;
}

export const ArtistCard = ({
  artist,
  clashes,
  intent,
  onIntentChange,
  onTimeChange,
  time,
}: ArtistCardProps) => {
  const selectedClashes = clashes.slice(0, 3).map((clash) => clash.name).join(", ");

  return (
    <article className={`artist-card stage-${artist.stage} ${intent ? "is-selected" : ""}`}>
      <div className="artist-card__top">
        <div className="artist-card__identity">
          <ArtistLogo artistName={artist.name} searchName={artist.logoSearchName} />
          <Link className="artist-link" to={`/artist/${artist.id}`}>
            {artist.name}
            <ExternalLink size={15} aria-hidden="true" />
          </Link>
        </div>
        {intent && <span className={`intent-pill ${intent}`}>{intent}</span>}
      </div>

      <p className="time-range">{formatTimeRange(time)}</p>

      <SetTimeInput compact value={time} onChange={(value) => onTimeChange(artist.id, value)} />

      {clashes.length > 0 && (
        <div className="clash-badge" title={clashes.map((clash) => clash.name).join(", ")}>
          <AlertTriangle size={16} />
          <span>
            Clashes with {selectedClashes}
            {clashes.length > 3 ? ` +${clashes.length - 3}` : ""}
          </span>
        </div>
      )}

      <IntentButtons intent={intent} onChange={(nextIntent) => onIntentChange(artist.id, nextIntent)} />
    </article>
  );
};
