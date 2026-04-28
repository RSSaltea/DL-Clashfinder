import { ExternalLink, Headphones, LogOut, Music2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Artist, SpotifyArtistBundle } from "../types";
import {
  disconnectSpotify,
  getArtistTopTracks,
  getSpotifySearchUrl,
  getSpotifyTrackEmbedUrl,
  hasSpotifyClientId,
  isSpotifyConnected,
  startSpotifyLogin,
} from "../utils/spotify";

interface SpotifyPanelProps {
  artist: Artist;
}

export const SpotifyPanel = ({ artist }: SpotifyPanelProps) => {
  const [connected, setConnected] = useState(() => isSpotifyConnected());
  const [bundle, setBundle] = useState<SpotifyArtistBundle | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const configured = hasSpotifyClientId();
  const topTracks = bundle?.tracks.slice(0, 5) ?? [];

  useEffect(() => {
    const updateConnection = () => setConnected(isSpotifyConnected());

    updateConnection();
    window.addEventListener("spotify-connection-changed", updateConnection);

    return () => {
      window.removeEventListener("spotify-connection-changed", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!configured || !connected) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getArtistTopTracks(artist.name, artist.spotifyArtistId)
      .then((result) => {
        if (!cancelled) {
          setBundle(result);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Spotify lookup failed.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [artist.name, artist.spotifyArtistId, configured, connected]);

  const handleConnect = () => {
    void startSpotifyLogin(window.location.hash || `#/artist/${artist.id}`);
  };

  const handleDisconnect = () => {
    disconnectSpotify();
    setConnected(false);
    setBundle(undefined);
    window.dispatchEvent(new Event("spotify-connection-changed"));
  };

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

      {!configured && (
        <div className="spotify-connect-card">
          <Music2 size={24} />
          <div>
            <h3>Spotify setup needed</h3>
            <p>Add your Spotify app Client ID in `.env.local` to enable top 5 track embeds.</p>
          </div>
        </div>
      )}

      {configured && !connected && (
        <div className="spotify-connect-card">
          <Headphones size={24} />
          <div>
            <h3>Top 5 songs</h3>
            <p>Connect once to load Spotify's top tracks for this artist.</p>
          </div>
          <button type="button" className="primary-button" onClick={handleConnect}>
            <Headphones size={18} />
            Connect Spotify
          </button>
        </div>
      )}

      {configured && connected && (
        <>
          <div className="spotify-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setBundle(undefined);
                setConnected(isSpotifyConnected());
              }}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
            <button type="button" className="secondary-button" onClick={handleDisconnect}>
              <LogOut size={17} />
              Disconnect
            </button>
          </div>

          {loading && <div className="loading-strip">Checking Spotify...</div>}
          {error && <div className="error-banner">{error}</div>}

          {bundle && (
            <div className="spotify-results">
              <div className="spotify-artist spotify-artist--compact">
                {bundle.artist.imageUrl && <img src={bundle.artist.imageUrl} alt="" />}
                <div>
                  <h3>{bundle.artist.name}</h3>
                  <a href={bundle.artist.spotifyUrl} target="_blank" rel="noreferrer">
                    View artist on Spotify
                  </a>
                </div>
              </div>

              <div className="track-embed-list">
                {topTracks.map((track) => (
                  <iframe
                    key={track.id}
                    className="spotify-track"
                    title={`${track.name} by ${bundle.artist.name}`}
                    src={getSpotifyTrackEmbedUrl(track.id)}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
