import { AlertTriangle, Clock3, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getDay } from "../data/lineup";
import type { Artist, ArtistSetTime, ArtistTightGap, Intent } from "../types";
import { formatTimeRange } from "../utils/time";
import { IntentButtons } from "./IntentButtons";

interface ArtistCardProps {
  artist: Artist;
  clashes: Artist[];
  intent?: Intent;
  tightGaps: ArtistTightGap[];
  time: ArtistSetTime;
  onIntentChange: (artistId: string, intent: Intent) => void;
}

const formatTightGap = (gap: ArtistTightGap) => {
  const relation = gap.position === "after" ? "until" : "after";
  return `${gap.minutes} min ${relation} ${gap.artist.name}`;
};

export const ArtistCard = ({
  artist,
  clashes,
  intent,
  onIntentChange,
  tightGaps,
  time,
}: ArtistCardProps) => {
  const selectedClashes = clashes.slice(0, 3).map((clash) => clash.name).join(", ");
  const selectedTightGaps = tightGaps.slice(0, 2).map(formatTightGap).join(", ");
  const dayLabel = getDay(artist.day)?.label ?? "Time TBC";

  return (
    <article className={`artist-card stage-${artist.stage} ${intent ? "is-selected" : ""}`}>
      <div className="artist-card__top">
        <div className="artist-card__identity">
          <Link className="artist-link" to={`/artist/${artist.id}`}>
            {artist.name}
            <ExternalLink size={15} aria-hidden="true" />
          </Link>
        </div>
        {intent && <span className={`intent-pill ${intent}`}>{intent}</span>}
      </div>

      <p className="time-range">{formatTimeRange(time, dayLabel)}</p>

      {clashes.length > 0 && (
        <div className="clash-badge" title={clashes.map((clash) => clash.name).join(", ")}>
          <AlertTriangle size={16} />
          <span>
            Clashes with {selectedClashes}
            {clashes.length > 3 ? ` +${clashes.length - 3}` : ""}
          </span>
        </div>
      )}

      {tightGaps.length > 0 && (
        <div className="clash-badge tight-gap" title={tightGaps.map(formatTightGap).join(", ")}>
          <Clock3 size={16} />
          <span>
            Within 10 mins: {selectedTightGaps}
            {tightGaps.length > 2 ? ` +${tightGaps.length - 2}` : ""}
          </span>
        </div>
      )}

      <IntentButtons intent={intent} onChange={(nextIntent) => onIntentChange(artist.id, nextIntent)} />
    </article>
  );
};
