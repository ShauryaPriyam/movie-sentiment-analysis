/**
 * useVisitTracker.js
 * ------------------
 * Call this hook on MoviePage mount.
 * It fires POST /visits once per session per movie (idempotent on the server too).
 */
import { useEffect } from "react";
import API from "./api";

function getOrCreateSessionId() {
  const key = "cinescope_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useVisitTracker(movieId, movieTitle) {
  useEffect(() => {
    if (!movieId || !movieTitle) return;
    const sessionId = getOrCreateSessionId();
    API.post("/visits", {
      movie_id   : Number(movieId),
      movie_title: movieTitle,
      session_id : sessionId,
    }).catch(() => {}); // silent fail — never block the UI for analytics
  }, [movieId, movieTitle]);
}
