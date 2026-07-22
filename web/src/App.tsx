import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import SeasonOverview from "./pages/SeasonOverview";
import WeeklyResults from "./pages/WeeklyResults";
import OverallLeaderboard from "./pages/OverallLeaderboard";
import LeagueLeaderboard from "./pages/LeagueLeaderboard";
import SeriesPositions from "./pages/SeriesPositions";
import Records from "./pages/Records";
import RunnerProfile from "./pages/RunnerProfile";
import Handicap from "./pages/Handicap";
import Updates from "./pages/Updates";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SeasonOverview />} />
          <Route path="results" element={<WeeklyResults />} />
          <Route path="results/:round" element={<WeeklyResults />} />
          <Route path="overall" element={<OverallLeaderboard />} />
          <Route path="league" element={<LeagueLeaderboard />} />
          <Route path="positions" element={<SeriesPositions />} />
          <Route path="records" element={<Records />} />
          <Route path="runner/:name" element={<RunnerProfile />} />
          <Route path="handicap" element={<Handicap />} />
          <Route path="updates" element={<Updates />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
