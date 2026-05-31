import { useState, useMemo } from "react";

const POSITIVE_KW = new Set(["amazing","brilliant","excellent","fantastic","great","outstanding",
  "superb","masterpiece","wonderful","incredible","stunning","powerful","beautiful","perfect",
  "loved","best","heartfelt","smart","dazzling","remarkable","exceptional","stellar","emotional","moving","immersive"]);
const NEGATIVE_KW = new Set(["terrible","awful","horrible","worst","bad","boring","disappointing",
  "waste","poor","dull","mediocre","weak","overlong","hollow","thin","confusing","predictable",
  "forgettable","tedious","struggled","ridiculous"]);

function scoreSentences(text) {
  return (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => {
    const words = s.toLowerCase().split(/\s+/);
    let pos = 0, neg = 0;
    words.forEach(w => {
      const c = w.replace(/[^a-z]/g, "");
      if (POSITIVE_KW.has(c)) pos++;
      if (NEGATIVE_KW.has(c)) neg++;
    });
    return { text: s, sentiment: pos > neg ? "positive" : neg > pos ? "negative" : "neutral" };
  });
}

function HighlightedText({ text }) {
  return (
    <p className="text-sm leading-relaxed text-slate-400">
      {scoreSentences(text).map((s, i) => (
        <span key={i} className={
          s.sentiment === "positive" ? "underline-positive"
          : s.sentiment === "negative" ? "underline-negative" : ""
        }>{s.text}</span>
      ))}
    </p>
  );
}

function Avatar({ name }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = name.split(/[_\s]/).map(w => w[0]?.toUpperCase()).join("").slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold border"
      style={{ background: `hsl(${hue},40%,20%)`, borderColor: `hsl(${hue},40%,30%)`, color: `hsl(${hue},70%,72%)` }}>
      {initials}
    </div>
  );
}

function SentimentBadge({ sentiment, confidence }) {
  const s = sentiment?.toLowerCase();
  const cls = s === "positive" ? "bg-green-500/10 text-green-400 border-green-500/25"
    : s === "negative" ? "bg-red-500/10 text-red-400 border-red-500/25"
    : "bg-slate-500/10 text-slate-400 border-slate-500/25";
  const label = sentiment?.charAt(0).toUpperCase() + sentiment?.slice(1).toLowerCase();
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {label} · {confidence}%
    </span>
  );
}

export default function ReviewsSection({ reviews = [] }) {
  const [filter, setFilter] = useState("all");
  const [sort,   setSort]   = useState("recent");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let rv = [...reviews];
    if (filter !== "all") rv = rv.filter(r => r.prediction?.toLowerCase() === filter);
    if (search) rv = rv.filter(r => (r.content||r.text||"").toLowerCase().includes(search.toLowerCase()));
    if (sort === "recent")   rv.sort((a,b) => (b.created_at||"").localeCompare(a.created_at||""));
    else if (sort==="highest") rv.sort((a,b) => (b.stars||0)-(a.stars||0));
    else rv.sort((a,b) => (b.confidence||0)-(a.confidence||0));
    return rv;
  }, [reviews, filter, sort, search]);

  return (
    <div className="animate-fadein">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3.5 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search reviews…"
          className="flex-1 min-w-[180px] px-4 py-2 bg-[#13161e] border border-white/8 rounded-lg text-white text-sm placeholder-slate-600 outline-none font-sans" />
        {[["all","All sentiments"],["positive","Positive"],["negative","Negative"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3.5 py-2 rounded-lg text-sm cursor-pointer border font-sans transition-all ${
              filter===v
                ? "border-[--gold] bg-[--gold]/10 text-[--gold]"
                : "border-white/8 bg-[#13161e] text-slate-400 hover:text-white"
            }`}>{l}</button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 bg-[#13161e] border border-white/8 rounded-lg text-slate-400 text-sm font-sans cursor-pointer outline-none">
          <option value="recent">Most recent</option>
          <option value="highest">Highest rated</option>
          <option value="confidence">Most confident</option>
        </select>
      </div>

      <p className="text-xs text-slate-600 mb-3">
        Showing {filtered.length} of {reviews.length} reviews
      </p>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm">No reviews match your filter.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((r, i) => {
          const text       = r.content || r.text || "";
          const author     = r.author || r.u || "anonymous";
          const date       = (r.created_at || r.date || "").slice(0, 10);
          const stars      = r.stars ?? 5;
          const sentiment  = r.prediction || "neutral";
          const confidence = r.confidence ?? 0;
          const keywords   = r.keywords || [];
          return (
            <div key={i} className="bg-[#13161e] border border-white/8 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={author} />
                  <div>
                    <div className="text-sm font-semibold text-white">{author}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {date} ·{" "}
                      <span style={{ color: "var(--gold)" }}>{"★".repeat(Math.min(stars,10))}</span>
                      {" "}{stars}/10
                    </div>
                  </div>
                </div>
                <SentimentBadge sentiment={sentiment} confidence={confidence} />
              </div>
              <HighlightedText text={text} />
              {keywords.length > 0 && (
                <div className="mt-3 bg-[#0a0c10] rounded-lg px-3 py-2 text-xs text-slate-500">
                  <span className="text-slate-400 font-medium">Why this prediction:</span>{" "}
                  influential terms — {keywords.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
