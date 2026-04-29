import { AlertTriangle, CalendarDays, ExternalLink, Map, Menu, Route as RouteIcon, Timer, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AuthDialog } from "./components/AuthDialog";
import { festival } from "./data/lineup";
import { useFestivalState } from "./hooks/useFestivalState";
import { ArtistDetail } from "./pages/ArtistDetail";
import { Clashes } from "./pages/Clashes";
import { Compare } from "./pages/Compare";
import { FreeTime } from "./pages/FreeTime";
import { GroupItinerary } from "./pages/GroupItinerary";
import { Home } from "./pages/Home";
import { Itinerary } from "./pages/Itinerary";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return null;
};

const downloadLogoUrl = `${import.meta.env.BASE_URL}download-logo.png`;

const AppRoutes = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const festivalState = useFestivalState();

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <ScrollToTop />
      <header className="app-header">
        <div className="app-header__top">
          <div className="brand-lockup">
            <img className="download-logo" src={downloadLogoUrl} alt="Download Festival" />
            <div>
              <strong>{festival.name}</strong>
              <span>{festival.year} Clash Finder</span>
            </div>
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav className={`app-nav${mobileMenuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <NavLink to="/" end onClick={closeMenu}>
            <CalendarDays size={18} />
            <span>Lineup</span>
          </NavLink>
          <NavLink to="/free-time" onClick={closeMenu}>
            <Timer size={18} />
            <span>Free Time</span>
          </NavLink>
          <NavLink to="/itinerary" onClick={closeMenu}>
            <Map size={18} />
            <span>Itinerary</span>
          </NavLink>
          <NavLink to="/clashes" onClick={closeMenu}>
            <AlertTriangle size={18} />
            <span>Clashes</span>
          </NavLink>
          <NavLink to="/compare" onClick={closeMenu}>
            <UsersRound size={18} />
            <span>Compare</span>
          </NavLink>
          <NavLink to="/group-itinerary" onClick={closeMenu}>
            <RouteIcon size={18} />
            <span>Group Itinerary</span>
          </NavLink>
          <AuthDialog
            account={festivalState.account}
            configured={festivalState.accountConfigured}
            profileName={festivalState.profileName}
            onLogin={festivalState.loginFestivalAccount}
            onRegister={festivalState.registerFestivalAccount}
            onLogout={festivalState.logoutFestivalAccount}
            onLoadResetQuestions={festivalState.getAccountResetQuestions}
            onResetPassword={festivalState.resetFestivalAccountPassword}
          />
        </nav>
      </header>

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
          path="/free-time"
          element={
            <FreeTime
              intents={festivalState.intents}
              setTimes={festivalState.setTimes}
              clashDecisions={festivalState.clashDecisions}
              onIntentChange={festivalState.setArtistIntent}
            />
          }
        />
        <Route
          path="/itinerary"
          element={
            <Itinerary
              intents={festivalState.intents}
              setTimes={festivalState.setTimes}
              clashDecisions={festivalState.clashDecisions}
            />
          }
        />
        <Route
          path="/clashes"
          element={
            <Clashes
              intents={festivalState.intents}
              setTimes={festivalState.setTimes}
              clashDecisions={festivalState.clashDecisions}
              onClashDecisionChange={festivalState.setClashDecision}
            />
          }
        />
        <Route
          path="/compare"
          element={
            <Compare
              intents={festivalState.intents}
              profileName={festivalState.profileName}
              accountUsername={festivalState.account?.username}
              setProfileName={festivalState.setProfileName}
              setTimes={festivalState.setTimes}
              imports={festivalState.imports}
              syncedImports={festivalState.syncedImports}
              onAddImports={festivalState.addImports}
              onRemoveImport={festivalState.removeImport}
              personalClashDecisions={festivalState.clashDecisions}
              groupClashVotes={festivalState.groupClashVotes}
              onGroupClashVoteChange={festivalState.setGroupClashVote}
              groupCode={festivalState.groupCode}
              groupCodeDraft={festivalState.groupCodeDraft}
              setGroupCodeDraft={festivalState.setGroupCodeDraft}
              groupCodes={festivalState.groupCodes}
              groupSyncState={festivalState.groupSyncState}
              onSyncGroup={festivalState.syncGroupNow}
              groupMembers={festivalState.groupMembers}
              myGroupRole={festivalState.myGroupRole}
              onRemoveGroupMember={festivalState.removeGroupMember}
              onSetGroupMemberRole={festivalState.setGroupMemberRole}
            />
          }
        />
        <Route
          path="/group-itinerary"
          element={
            <GroupItinerary
              intents={festivalState.intents}
              profileName={festivalState.profileName}
              accountUsername={festivalState.account?.username}
              setTimes={festivalState.setTimes}
              imports={festivalState.imports}
              syncedImports={festivalState.syncedImports}
              groupClashVotes={festivalState.groupClashVotes}
              groupCode={festivalState.groupCode}
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
