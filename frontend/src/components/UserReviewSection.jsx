import { useState, useEffect, useCallback } from "react";
import API from "../api/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getOrCreateSessionId() {
  const key = "cinescope_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ name }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = name.split(/[_\s]/).map(w => w[0]?.toUpperCase()).join("").slice(0, 2) || "?";
  return (
    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold border"
      style={{ background:`hsl(${hue},40%,20%)`, borderColor:`hsl(${hue},40%,30%)`, color:`hsl(${hue},70%,72%)` }}>
      {initials}
    </div>
  );
}

function SentimentBadge({ prediction, confidence }) {
  const s = (prediction || "").toLowerCase();
  const cls = s === "positive"
    ? "bg-green-500/10 text-green-400 border-green-500/25"
    : s === "negative"
    ? "bg-red-500/10 text-red-400 border-red-500/25"
    : "bg-slate-500/10 text-slate-400 border-slate-500/25";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {prediction} · {confidence != null ? `${Math.round(confidence)}%` : "—"}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex gap-1">
      {[...Array(10)].map((_, i) => {
        const star = i + 1;
        const filled = star <= (hovered ?? value ?? 0);
        return (
          <button key={star} type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="text-lg cursor-pointer bg-transparent border-none leading-none transition-transform hover:scale-110"
            style={{ color: filled ? "var(--gold)" : "#334155" }}>★</button>
        );
      })}
      {value && (
        <span className="text-xs text-slate-500 ml-1 self-center">{value}/10</span>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-[#13161e] border border-white/8 rounded-xl p-4 animate-fadein">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Avatar name={review.username} />
          <div>
            <div className="text-sm font-semibold text-white">{review.username}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{review.created_at?.slice(0,10)}</span>
              {review.rating != null && (
                <span className="text-xs" style={{ color:"var(--gold)" }}>
                  {"★".repeat(Math.round(review.rating / 2))} {review.rating}/10
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase border border-white/8 px-2 py-0.5 rounded">
            {review.model_used === "log" ? "LR" : "SVM"}
          </span>
          <SentimentBadge prediction={review.prediction} confidence={review.confidence} />
        </div>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{review.review_text}</p>
      {review.keywords?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.keywords.map((kw, i) => {
            const isPos = review.prediction === "Positive";
            const color = isPos ? "#22c55e" : "#ef4444";
            return (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                style={{ background:`${color}15`, color, border:`1px solid ${color}25` }}>
                {kw}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function UserReviewSection({ movieId, movieTitle, model, onModelChange }) {
  const [reviews, setReviews]     = useState([]);
  const [total,   setTotal]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,   setError]       = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // form state
  const [username,    setUsername]    = useState(() => localStorage.getItem("cinescope_username") || "");
  const [reviewText,  setReviewText]  = useState("");
  const [rating,      setRating]      = useState(null);
  const [lastResult,  setLastResult]  = useState(null);

  // fetch existing user reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/user-reviews/${movieId}`);
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      setError("Could not load community reviews.");
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!username.trim() || reviewText.trim().length < 10) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const { data } = await API.post("/user-reviews", {
        movie_id   : Number(movieId),
        movie_title: movieTitle,
        username   : username.trim(),
        review_text: reviewText.trim(),
        rating,
        model,
      });
      setLastResult(data);
      setSubmitted(true);
      setReviewText(""); setRating(null);
      localStorage.setItem("cinescope_username", username.trim());
      // prepend new review optimistically
      setReviews(prev => [{
        id         : data.id,
        username   : username.trim(),
        review_text: reviewText.trim(),
        rating,
        prediction : data.prediction,
        confidence : data.confidence,
        keywords   : data.keywords,
        model_used : model,
        created_at : new Date().toISOString(),
      }, ...prev]);
      setTotal(t => t + 1);
    } catch (e) {
      setSubmitError(e?.response?.data?.detail || "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0;
  const charCount = reviewText.length;
  const canSubmit = username.trim().length > 0 && reviewText.trim().length >= 10 && !submitting;

  return (
    <div className="animate-fadein flex flex-col gap-6">

      {/* ── Submit Form ──────────────────────────────────────────────────────── */}
      <div className="bg-[#13161e] border border-white/8 rounded-2xl p-5">
        <h3 className="font-display text-lg font-bold text-white mb-1">Write a Review</h3>
        <p className="text-xs text-slate-500 mb-4">
          Your review is analyzed instantly with {model === "log" ? "Logistic Regression" : "SVM"}.
        </p>

        {/* Success flash */}
        {submitted && lastResult && (
          <div className="mb-4 p-3 rounded-xl border animate-fadein flex items-center gap-3"
            style={{
              background: lastResult.prediction === "Positive" ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
              borderColor: lastResult.prediction === "Positive" ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)",
            }}>
            <span className="text-xl">{lastResult.prediction === "Positive" ? "✦" : "✧"}</span>
            <div>
              <div className="text-sm font-semibold text-white">
                Review submitted — predicted <span style={{color: lastResult.prediction === "Positive" ? "#22c55e" : "#ef4444"}}>{lastResult.prediction}</span> · {Math.round(lastResult.confidence)}% confidence
              </div>
              {lastResult.keywords?.length > 0 && (
                <div className="text-xs text-slate-500 mt-0.5">Key terms: {lastResult.keywords.join(", ")}</div>
              )}
            </div>
            <button onClick={() => setSubmitted(false)} className="ml-auto text-slate-600 hover:text-slate-400 bg-transparent border-none cursor-pointer text-lg">×</button>
          </div>
        )}

        {/* Model picker */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Analyze with:</span>
          {[["svm","SVM"],["log","Logistic Regression"]].map(([val, label]) => (
            <button key={val} onClick={() => onModelChange(val)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border font-sans transition-all ${
                model === val
                  ? "border-[--gold] text-[#0a0c10]"
                  : "border-white/8 bg-transparent text-slate-400 hover:text-white"
              }`}
              style={model === val ? {background:"linear-gradient(135deg,var(--gold),#c4881c)"} : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Username */}
        <div className="mb-3">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Your Name</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="e.g. FilmBuff92"
            maxLength={80}
            className="w-full px-4 py-2.5 bg-[#0d0f14] border border-white/8 rounded-lg text-white text-sm placeholder-slate-600 outline-none font-sans focus:border-white/20 transition-colors" />
        </div>

        {/* Star rating */}
        <div className="mb-3">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">
            Rating (optional)
          </label>
          <StarPicker value={rating} onChange={v => setRating(v === rating ? null : v)} />
        </div>

        {/* Review text */}
        <div className="mb-3 relative">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Your Review</label>
          <textarea
            value={reviewText}
            onChange={e => { setReviewText(e.target.value); setSubmitted(false); }}
            placeholder="What did you think about this movie? Share your honest opinion…"
            rows={5}
            maxLength={5000}
            className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none font-sans resize-none leading-relaxed focus:border-white/20 transition-colors"
          />
          <div className="text-[10px] text-slate-600 text-right mt-1">
            {wordCount} words · {charCount}/5000
          </div>
        </div>

        {submitError && (
          <p className="text-red-400 text-xs mb-3">⚠ {submitError}</p>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer border-none font-sans transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{background:"linear-gradient(135deg,var(--gold),#c4881c)",color:"#0a0c10"}}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-[#0a0c10]/30 border-t-[#0a0c10] inline-block"
                style={{animation:"spin .7s linear infinite"}} />
              Analyzing & saving…
            </span>
          ) : "Submit Review"}
        </button>
        {reviewText.trim().length < 10 && reviewText.length > 0 && (
          <p className="text-xs text-slate-600 mt-1.5 text-center">Need at least 10 characters</p>
        )}
      </div>

      {/* ── Community Reviews ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold text-white">
            Community Reviews
            <span className="ml-2 text-sm text-slate-500 font-normal font-sans">({total})</span>
          </h3>
          <button onClick={fetchReviews}
            className="text-xs text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer font-sans transition-colors">
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
            <span className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 inline-block"
              style={{animation:"spin .7s linear infinite"}} />
            Loading community reviews…
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-10 text-slate-600">
            <div className="text-3xl mb-2">✦</div>
            <p className="text-sm">No community reviews yet. Be the first!</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      </div>
    </div>
  );
}
