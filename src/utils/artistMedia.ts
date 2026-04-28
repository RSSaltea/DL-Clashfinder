import type { ArtistArtwork } from "../types";

const audioDbApiKey = import.meta.env.VITE_THEAUDIODB_API_KEY?.trim() || "2";
const cachePrefix = "download-clash-finder:artist-artwork:";
const cacheMs = 1000 * 60 * 60 * 24 * 30;
const requestGapMs = 2200;

interface AudioDbArtist {
  strArtist?: string;
  strArtistLogo?: string | null;
  strArtistClearart?: string | null;
  strArtistWideThumb?: string | null;
  strArtistThumb?: string | null;
}

const memoryCache = new Map<string, Promise<ArtistArtwork> | ArtistArtwork>();
let requestQueue = Promise.resolve();
let lastRequestAt = 0;

const normaliseName = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[øØ]/g, "o")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getCacheKey = (artistName: string) =>
  `${cachePrefix}${normaliseName(artistName).replace(/\s+/g, "-")}`;

const readCachedArtwork = (artistName: string) => {
  const cached = window.localStorage.getItem(getCacheKey(artistName));

  if (!cached) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(cached) as ArtistArtwork;
    if (Date.now() - Date.parse(parsed.fetchedAt) < cacheMs) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(getCacheKey(artistName));
  }

  return undefined;
};

const saveCachedArtwork = (artistName: string, artwork: ArtistArtwork) => {
  window.localStorage.setItem(getCacheKey(artistName), JSON.stringify(artwork));
};

const enqueueRequest = <T>(task: () => Promise<T>) => {
  requestQueue = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < requestGapMs) {
      await new Promise((resolve) => window.setTimeout(resolve, requestGapMs - elapsed));
    }
    lastRequestAt = Date.now();
  });

  return requestQueue.then(task);
};

const getBestMatch = (artistName: string, artists: AudioDbArtist[]) => {
  const target = normaliseName(artistName);

  return (
    artists.find((artist) => normaliseName(artist.strArtist ?? "") === target) ??
    artists.find((artist) => normaliseName(artist.strArtist ?? "").includes(target)) ??
    artists[0]
  );
};

export const getArtistArtwork = async (artistName: string): Promise<ArtistArtwork> => {
  const cached = readCachedArtwork(artistName);
  if (cached) {
    return cached;
  }

  const cacheKey = normaliseName(artistName);
  const fromMemory = memoryCache.get(cacheKey);
  if (fromMemory) {
    return fromMemory;
  }

  const request = enqueueRequest(async () => {
    const response = await fetch(
      `https://www.theaudiodb.com/api/v1/json/${audioDbApiKey}/search.php?s=${encodeURIComponent(artistName)}`,
    );

    if (!response.ok) {
      throw new Error("Artwork lookup failed.");
    }

    const data = (await response.json()) as { artists?: AudioDbArtist[] | null };
    const match = data.artists ? getBestMatch(artistName, data.artists) : undefined;

    const artwork: ArtistArtwork = {
      logoUrl: match?.strArtistLogo ?? match?.strArtistClearart ?? undefined,
      imageUrl: match?.strArtistWideThumb ?? match?.strArtistThumb ?? undefined,
      sourceUrl: match?.strArtist ? `https://www.theaudiodb.com/artist/${match.strArtist}` : undefined,
      fetchedAt: new Date().toISOString(),
    };

    saveCachedArtwork(artistName, artwork);
    memoryCache.set(cacheKey, artwork);
    return artwork;
  }).catch(() => {
    const fallback: ArtistArtwork = {
      fetchedAt: new Date().toISOString(),
    };
    saveCachedArtwork(artistName, fallback);
    memoryCache.set(cacheKey, fallback);
    return fallback;
  });

  memoryCache.set(cacheKey, request);
  return request;
};
