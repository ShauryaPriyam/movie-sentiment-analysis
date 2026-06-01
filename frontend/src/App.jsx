import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MoviePage from "./pages/MoviePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MoviePage />} />
        <Route path="/analytics"   element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}