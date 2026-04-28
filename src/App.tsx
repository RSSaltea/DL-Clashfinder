import { AlertTriangle, CalendarDays, ExternalLink, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { festival } from "./data/lineup";
import { useFestivalState } from "./hooks/useFestivalState";
import { ArtistDetail } from "./pages/ArtistDetail";
import { Clashes } from "./pages/Clashes";
import { Compare } from "./pages/Compare";
import { Home } from "./pages/Home";
import { completeSpotifyLoginIfNeeded } from "./utils/spotify";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return null;
};

const downloadLogoUrl = `${import.meta.env.BASE_URL}download-logo.png`;

const AppRoutes = () => {
  const festivalState = useFestivalState();
  const [spotifyMessage, setSpotifyMessage] = useState("");

  useEffect(() => {
    completeSpotifyLoginIfNeeded()
      .then((completed) => {
        if (completed) {
          setSpotifyMessage("Spotify connected.");
          window.dispatchEvent(new Event("spotify-connection-changed"));
        }
      })
      .catch((error) => {
        setSpotifyMessage(error instanceof Error ? error.message : "Spotify connection failed.");
      });
  }, []);

  return (
    <>
      <ScrollToTop />
      <header className="app-header">
        <div className="brand-lockup">
          <img className="download-logo" src={downloadLogoUrl} alt="Download Festival" />
          <div>
            <strong>{festival.name}</strong>
            <span>{festival.year} Clash Finder</span>
          </div>
        </div>
        <nav className="app-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            <CalendarDays size={18} />
            <span>Lineup</span>
          </NavLink>
          <NavLink to="/clashes">
            <AlertTriangle size={18} />
            <span>Clashes</span>
          </NavLink>
          <NavLink to="/compare">
            <UsersRound size={18} />
            <span>Compare</span>
          </NavLink>
        </nav>
      </header>

      {spotifyMessage && <div className="toast-message">{spotifyMessage}</div>}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              intents={festivalState.intents}
              onIntentChange={festivalState.setArtistIntent}
              setTimes={festivalState.setTimes}
            />
          }
        />
        <Route
          path="/artist/:artistId"
          element={
            <ArtistDetail
              intents={festivalState.intents}
              onIntentChange={festivalState.setArtistIntent}
              setTimes={festivalState.setTimes}
            />
          }
        />
        <Route
          path="/clashes"
          element={<Clashes intents={festivalState.intents} setTimes={festivalState.setTimes} />}
        />
        <Route
          path="/compare"
          element={
            <Compare
              intents={festivalState.intents}
              profileName={festivalState.profileName}
              setProfileName={festivalState.setProfileName}
              setTimes={festivalState.setTimes}
            />
          }
        />
      </Routes>

      <footer className="app-footer">
        <span>Lineup seed from the official Download 2026 stage poster.</span>
        <a href={festival.sourceUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Source
        </a>
      </footer>
    </>
  );
};

export const App = () => (
  <HashRouter>
    <AppRoutes />
  </HashRouter>
);
