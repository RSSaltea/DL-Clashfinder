import { useEffect, useRef, useState } from "react";
import type { ArtistArtwork } from "../types";
import { getArtistArtwork } from "../utils/artistMedia";

interface ArtistLogoProps {
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

export const ArtistLogo = ({ artistName, searchName }: ArtistLogoProps) => {
  const [artwork, setArtwork] = useState<ArtistArtwork>();
  const [shouldLoad, setShouldLoad] = useState(false);
  const logoRef = useRef<HTMLDivElement | null>(null);

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
    if (!shouldLoad) {
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
  }, [artistName, searchName, shouldLoad]);

  const imageUrl = artwork?.logoUrl || artwork?.imageUrl;

  return (
    <div className={`artist-logo ${imageUrl ? "has-image" : ""}`} ref={logoRef}>
      {imageUrl ? (
        <img src={imageUrl} alt={`${artistName} logo`} loading="lazy" />
      ) : (
        <span>{getInitials(artistName)}</span>
      )}
    </div>
  );
};
