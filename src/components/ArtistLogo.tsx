import { useEffect, useRef, useState } from "react";
import type { ArtistArtwork } from "../types";
import { getArtistArtwork } from "../utils/artistMedia";

interface ArtistLogoProps {
  artistId: string;
  artistName: string;
  searchName?: string;
}

const getInitials = (artistName: string) =>
  artistName
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const getLineupCropUrl = (artistId: string) =>
  `${import.meta.env.BASE_URL}artist-lineup-crops/${artistId}.jpg`;

export const ArtistLogo = ({ artistId, artistName, searchName }: ArtistLogoProps) => {
  const [artwork, setArtwork] = useState<ArtistArtwork>();
  const [lineupCropFailed, setLineupCropFailed] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(false);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const lineupCropUrl = getLineupCropUrl(artistId);

  useEffect(() => {
    const element = logoRef.current;
    if (!element) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !lineupCropFailed) {
      return;
    }

    let cancelled = false;

    getArtistArtwork(searchName || artistName).then((result) => {
      if (!cancelled) {
        setArtwork(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [artistName, lineupCropFailed, searchName, shouldLoad]);

  useEffect(() => {
    setLineupCropFailed(false);
    setImageIndex(0);
  }, [artistId]);

  const imageCandidates = lineupCropFailed
    ? [artwork?.logoUrl, artwork?.imageUrl].filter((value): value is string => Boolean(value))
    : [lineupCropUrl];
  const imageUrl = imageCandidates[imageIndex];

  return (
    <div className={`artist-logo ${imageUrl ? "has-image" : ""}`} ref={logoRef}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => {
            if (!lineupCropFailed) {
              setLineupCropFailed(true);
              setImageIndex(0);
              return;
            }

            setImageIndex((current) => current + 1);
          }}
        />
      ) : (
        <span>{getInitials(artistName)}</span>
      )}
    </div>
  );
};
