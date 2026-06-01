import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart,
} from "recharts";
import API from "../api/api";

const TT = {
  background: "#13161e",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
  color: "#f1f5f9",
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-[#13161e] border border-white/8 rounded-2xl p-5 flex flex-col gap-2 animate-fadein">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-4xl font-bold" style={{ color: color || "#f1f5f9" }}>
        {value ?? <span className="text-slate-600 text-2xl">—</span>}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-[#13161e] border border-white/8 rounded-2xl p-5 animate-fadein">
      <h3 className="font-display text-base font-bold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ msg }) {
  return <p className="text-slate-600 text-sm text-center py-6">{msg}</p>;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 rounded-full border-[3px] border-white/8"
        style={{ borderTopColor: "var(--gold)", animation: "spin .8s linear infinite" }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [analyticsRes, visitsRes] = await Promise.all([
        API.get("/analytics"),
        API.get("/visits?limit=10"),
      ]);
      setData(analyticsRes.data);
      setVisits(visitsRes.data || []);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      setError("Could not load analytics. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived chart data ─────────────────────────────────────────────────────
  const sentimentDonut = data ? [
    { name: "Positive", value: data.sentiment_breakdown?.positive || 0, color: "#22c55e" },
    { name: "Negative", value: data.sentiment_breakdown?.negative || 0, color: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  const topMoviesBar = visits.map(v => ({
    name: v.movie_title.length > 18 ? v.movie_title.slice(0, 16) + "…" : v.movie_title,
    visits: v.visits,
  }));

  const totalReviews = (data?.sentiment_breakdown?.positive || 0) + (data?.sentiment_breakdown?.negative || 0);
  const posPct = totalReviews ? Math.round((data.sentiment_breakdown.positive / totalReviews) * 100) : 0;
  const negPct = totalReviews ? 100 - posPct : 0;

  return (
    <div className="min-h-screen bg-[#0d0f14]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 h-14 border-b border-white/5 bg-[#0d0f14]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="text-slate-500 text-xs bg-transparent border-none cursor-pointer font-sans hover:text-white transition-colors">
            ← Back
          </button>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
              style={{ background: "var(--gold)" }}>📊</div>
            <span className="font-display text-base font-bold text-white">Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && <span className="text-[11px] text-slate-600 hidden sm:block">Updated {lastRefresh}</span>}
          <button onClick={load}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-white/8 bg-transparent text-slate-400 hover:text-white font-sans transition-colors">
            ↻ Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
            Usage <span style={{ background: "linear-gradient(135deg,var(--gold),var(--crimson))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm">Real-time data from your Postgres database</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm mb-6">
            ⚠ {error}
          </div>
        )}

        {loading && !data ? <Spinner /> : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                label="Total Visits"
                value={data?.total_visits?.toLocaleString()}
                sub="Unique sessions"
                color="var(--gold)"
                icon="👁"
              />
              <StatCard
                label="User Reviews"
                value={data?.total_user_reviews?.toLocaleString()}
                sub="Community submitted"
                color="#60a5fa"
                icon="✍"
              />
              <StatCard
                label="AI Predictions"
                value={data?.total_predictions?.toLocaleString()}
                sub="Via /predict route"
                color="#a78bfa"
                icon="🤖"
              />
              <StatCard
                label="Positive Rate"
                value={totalReviews ? `${posPct}%` : "—"}
                sub={`${data?.sentiment_breakdown?.positive || 0} positive / ${data?.sentiment_breakdown?.negative || 0} negative`}
                color="#22c55e"
                icon="✦"
              />
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

              {/* Sentiment donut */}
              <Section title="Community Sentiment Breakdown">
                {sentimentDonut.length === 0
                  ? <Empty msg="No user reviews yet" />
                  : <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={sentimentDonut} cx="50%" cy="50%"
                          innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                          {sentimentDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={v => [`${v} reviews`]} contentStyle={TT} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-2">
                      {sentimentDonut.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          {d.name} — <span className="font-bold text-white">{d.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>Positive {posPct}%</span>
                        <span>Negative {negPct}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                        <div className="h-full rounded-l-full transition-all duration-700"
                          style={{ width: `${posPct}%`, background: "#22c55e" }} />
                        <div className="h-full rounded-r-full transition-all duration-700"
                          style={{ width: `${negPct}%`, background: "#ef4444" }} />
                      </div>
                    </div>
                  </>
                }
              </Section>

              {/* Top movies bar */}
              <Section title="Most Visited Movies">
                {topMoviesBar.length === 0
                  ? <Empty msg="No visits recorded yet" />
                  : <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={topMoviesBar} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#475569" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={110} />
                      <Tooltip contentStyle={TT} formatter={v => [`${v} visits`]} />
                      <Bar dataKey="visits" radius={[0, 6, 6, 0]}
                        fill="url(#goldGrad)" />
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#e8a034" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#e8a034" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                }
              </Section>
            </div>

            {/* ── Recent Reviews table ── */}
            <Section title="Recent Community Reviews">
              {!data?.recent_reviews?.length
                ? <Empty msg="No community reviews yet — submit one from any movie page!" />
                : <div className="flex flex-col gap-2">
                  {data.recent_reviews.map((r, i) => {
                    const isPos = r.prediction === "Positive";
                    return (
                      <div key={i}
                        className="flex items-center gap-3 px-4 py-3 bg-[#0d0f14] rounded-xl border border-white/5 flex-wrap">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: isPos ? "#22c55e" : "#ef4444" }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white font-semibold">{r.username}</span>
                          <span className="text-slate-600 mx-2">·</span>
                          <span className="text-sm text-slate-400 truncate">{r.movie_title}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isPos
                            ? "text-green-400 bg-green-500/10 border-green-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                        }`}>
                          {r.prediction}
                        </span>
                        <span className="text-[11px] text-slate-600 shrink-0">
                          {r.created_at?.slice(0, 10)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              }
            </Section>

            {/* ── DB health footer ── */}
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                ["movie_visits", data?.total_visits ?? 0, "👁"],
                ["user_reviews", data?.total_user_reviews ?? 0, "✍"],
                ["predict_logs", data?.total_predictions ?? 0, "🤖"],
              ].map(([table, count, icon]) => (
                <div key={table} className="flex items-center gap-2 px-3 py-2 bg-[#13161e] border border-white/8 rounded-lg text-xs">
                  <span>{icon}</span>
                  <code className="text-slate-500">{table}</code>
                  <span className="text-white font-bold">{count}</span>
                  <span className="text-green-400 font-bold">✓</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
