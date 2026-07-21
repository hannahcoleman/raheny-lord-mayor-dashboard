import { NavLink, Outlet } from "react-router-dom";
import rahenyLogo from "../assets/raheny-logo.jpg";
import "../lib/theme.css";
import "./Layout.css";

const NAV_ITEMS = [
  { to: "/", label: "Season", end: true },
  { to: "/results", label: "Weekly Results" },
  { to: "/overall", label: "Overall" },
  { to: "/league", label: "League" },
  { to: "/positions", label: "Series Positions" },
  { to: "/records", label: "Records" },
  { to: "/handicap", label: "Jim Wall Handicap" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="top-bar" />
      <header className="site-header">
        <div className="brand">
          <img src={rahenyLogo} alt="Raheny Shamrock Athletic Club" className="brand-logo" />
          <h1 className="brand-heading">2026 Lord Mayor of Raheny Two Mile Series</h1>
        </div>
      </header>
      <nav className="main-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Outlet />
      </main>
      <footer className="site-footer">
        Unofficial results dashboard for the 2026 Lord Mayor of Raheny Two Mile Series. Data sourced from{" "}
        <a href="https://rahenyshamrock.ie/?cat=6" target="_blank" rel="noreferrer">
          rahenyshamrock.ie
        </a>
        .
      </footer>
    </div>
  );
}
