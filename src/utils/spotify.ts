import type { SpotifyArtistBundle, SpotifyTrack } from "../types";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim() ?? "";
const verifierKey = "download-clash-finder:spotify-verifier";
const stateKey = "download-clash-finder:spotify-state";
const returnToKey = "download-clash-finder:spotify-return-to";
const tokenKey = "download-clash-finder:spotify-token";
const cachePrefix = "download-clash-finder:spotify-cache:";
const cacheMs = 1000 * 60 * 60 * 24 * 7;

interface StoredSpotifyToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface SpotifyApiImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyApiArtist {
  id: string;
  name: string;
  images?: SpotifyApiImage[];
  external_urls?: {
    spotify?: string;
  };
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url?: string | null;
  external_urls?: {
    spotify?: string;
  };
  album?: {
    name: string;
    images?: SpotifyApiImage[];
  };
}

const normaliseName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cacheKeyFor = (name: string) => `${cachePrefix}${normaliseName(name).replace(/\s+/g, "-")}`;

const getRedirectUri = () => `${window.location.origin}${window.location.pathname}`;

const randomString = (length = 64) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(randomValues)
    .map((value) => possible[value % possible.length])
    .join("");
};

const base64UrlEncode = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", bytes);
};

const readToken = (): StoredSpotifyToken | undefined => {
  const stored = window.localStorage.getItem(tokenKey);

  if (!stored) {
    return undefined;
  }

  try {
    return JSON.parse(stored) as StoredSpotifyToken;
  } catch {
    window.localStorage.removeItem(tokenKey);
    return undefined;
  }
};

const saveToken = (value: StoredSpotifyToken) => {
  window.localStorage.setItem(tokenKey, JSON.stringify(value));
};

const mapTrack = (track: SpotifyApiTrack): SpotifyTrack => ({
  id: track.id,
  name: track.name,
  album: track.album?.name ?? "Unknown album",
  popularity: track.popularity,
  previewUrl: track.preview_url ?? undefined,
  spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
  imageUrl: track.album?.images?.[0]?.url,
});

export const hasSpotifyClientId = () => Boolean(clientId);

export const getSpotifySearchUrl = (artistName: string) =>
  `https://open.spotify.com/search/${encodeURIComponent(artistName)}`;

export const getSpotifyArtistEmbedUrl = (artistId: string) =>
  `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`;

export const getSpotifyTrackEmbedUrl = (trackId: string) =>
  `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

export const isSpotifyConnected = () => {
  const token = readToken();
  return Boolean(token?.accessToken && token.expiresAt > Date.now());
};

export const disconnectSpotify = () => {
  window.localStorage.removeItem(tokenKey);
};

export const startSpotifyLogin = async (returnTo = window.location.hash || "#/") => {
  if (!clientId) {
    throw new Error("Spotify client ID is not configured.");
  }

  const verifier = randomString();
  const state = randomString(32);
  const challenge = base64UrlEncode(await sha256(verifier));
  const authUrl = new URL("https://accounts.spotify.com/authorize");

  window.sessionStorage.setItem(verifierKey, verifier);
  window.sessionStorage.setItem(stateKey, state);
  window.sessionStorage.setItem(returnToKey, returnTo);

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getRedirectUri());
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("state", state);

  window.location.assign(authUrl.toString());
};

export const completeSpotifyLoginIfNeeded = async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return false;
  }

  const storedState = window.sessionStorage.getItem(stateKey);
  const verifier = window.sessionStorage.getItem(verifierKey);
  const returnTo = window.sessionStorage.getItem(returnToKey) || "#/";

  if (!verifier || !state || state !== storedState) {
    throw new Error("Spotify login could not be verified. Please try connecting again.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Spotify login failed during token exchange.");
  }

  const token = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  saveToken({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  });

  window.sessionStorage.removeItem(verifierKey);
  window.sessionStorage.removeItem(stateKey);
  window.sessionStorage.removeItem(returnToKey);

  window.history.replaceState(null, "", `${getRedirectUri()}${returnTo}`);
  return true;
};

const refreshAccessToken = async (token: StoredSpotifyToken) => {
  if (!token.refreshToken) {
    window.localStorage.removeItem(tokenKey);
    return undefined;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    window.localStorage.removeItem(tokenKey);
    return undefined;
  }

  const refreshed = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const nextToken = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
  };

  saveToken(nextToken);
  return nextToken;
};

const getValidAccessToken = async () => {
  const token = readToken();

  if (!token) {
    return undefined;
  }

  if (token.expiresAt - 60_000 > Date.now()) {
    return token.accessToken;
  }

  return (await refreshAccessToken(token))?.accessToken;
};

const spotifyFetch = async <T>(path: string): Promise<T> => {
  const token = await getValidAccessToken();

  if (!token) {
    throw new Error("Spotify is not connected.");
  }

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Spotify request failed.");
  }

  return response.json() as Promise<T>;
};

export const getArtistTopTracks = async (
  artistName: string,
  knownArtistId?: string,
): Promise<SpotifyArtistBundle> => {
  const cached = window.localStorage.getItem(cacheKeyFor(artistName));

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as SpotifyArtistBundle;
      if (Date.now() - Date.parse(parsed.fetchedAt) < cacheMs) {
        return parsed;
      }
    } catch {
      window.localStorage.removeItem(cacheKeyFor(artistName));
    }
  }

  let artist: SpotifyApiArtist | undefined;

  if (knownArtistId) {
    artist = await spotifyFetch<SpotifyApiArtist>(`/artists/${knownArtistId}`);
  } else {
    const result = await spotifyFetch<{ artists: { items: SpotifyApiArtist[] } }>(
      `/search?type=artist&market=GB&limit=5&q=${encodeURIComponent(artistName)}`,
    );
    artist =
      result.artists.items.find((candidate) => normaliseName(candidate.name) === normaliseName(artistName)) ??
      result.artists.items[0];
  }

  if (!artist) {
    throw new Error("Spotify could not find that artist.");
  }

  const tracksResponse = await spotifyFetch<{ tracks: SpotifyApiTrack[] }>(
    `/artists/${artist.id}/top-tracks?market=GB`,
  );

  const bundle: SpotifyArtistBundle = {
    artist: {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url,
      spotifyUrl: artist.external_urls?.spotify ?? `https://open.spotify.com/artist/${artist.id}`,
    },
    tracks: tracksResponse.tracks.slice(0, 10).map(mapTrack),
    fetchedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(cacheKeyFor(artistName), JSON.stringify(bundle));
  return bundle;
};
