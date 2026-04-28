import { ExternalLink, Music2 } from "lucide-react";
import type { Artist } from "../types";
import { getSpotifySearchUrl, getSpotifyTrackEmbedUrl } from "../utils/spotify";

interface SpotifyPanelProps {
  artist: Artist;
}

export const SpotifyPanel = ({ artist }: SpotifyPanelProps) => {
  const trackIds = artist.spotifyTrackIds?.slice(0, 5) ?? [];

  return (
    <section className="spotify-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Listen before the field</p>
          <h2>Spotify</h2>
        </div>
        <a className="secondary-button" href={getSpotifySearchUrl(artist.name)} target="_blank" rel="noreferrer">
          <ExternalLink size={17} />
          Open Search
        </a>
      </div>

      {trackIds.length === 0 ? (
        <div className="spotify-connect-card">
          <Music2 size={24} />
          <div>
            <h3>Top songs not added yet</h3>
            <p>Add Spotify track IDs to this artist in `src/data/lineup.ts` or use Open Search.</p>
          </div>
        </div>
      ) : (
        <div className="track-embed-list">
          {trackIds.map((trackId) => (
            <iframe
              key={trackId}
              className="spotify-track"
              title={`${artist.name} Spotify track`}
              src={getSpotifyTrackEmbedUrl(trackId)}
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
};
