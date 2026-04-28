import { ExternalLink } from "lucide-react";
import type { Artist } from "../types";
import { getSpotifyArtistEmbedUrl, getSpotifySearchUrl, getSpotifyTrackEmbedUrl } from "../utils/spotify";

interface SpotifyPanelProps {
  artist: Artist;
}

export const SpotifyPanel = ({ artist }: SpotifyPanelProps) => {
  const hasArtist = Boolean(artist.spotifyArtistId);
  const hasTracks = artist.spotifyTrackIds && artist.spotifyTrackIds.length > 0;

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

      {hasArtist && (
        <iframe
          title={`${artist.name} on Spotify`}
          style={{ borderRadius: "12px" }}
          src={getSpotifyArtistEmbedUrl(artist.spotifyArtistId!)}
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      )}

      {hasTracks && (
        <div className="track-embed-list">
          {artist.spotifyTrackIds!.map((trackId) => (
            <iframe
              key={trackId}
              className="spotify-track"
              title={`Track by ${artist.name}`}
              style={{ borderRadius: "12px" }}
              src={getSpotifyTrackEmbedUrl(trackId)}
              width="100%"
              height="152"
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
