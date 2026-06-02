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
  fontFamily: "inherit",
  color: "#f1f5f9",
};

function formatCount(value) {
  return (value ?? 0).toLocaleString();
}

function StatPill({ label, value, accent }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
      <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
      <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#13161e] p-5 shadow-[0_20px_60px_rgba(0,0,0,.25)] animate-fadein">
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color || "#f1f5f9"}, transparent)` }} />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-15" style={{ background: color || "#f1f5f9" }} />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold tracking-[0.22em] text-slate-500 uppercase">{label}</span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/8 bg-white/5 text-lg">{icon}</span>
      </div>
      <div className="relative mt-4 text-4xl font-bold tracking-tight" style={{ color: color || "#f1f5f9" }}>
        {value ?? <span className="text-slate-600 text-2xl">—</span>}
      </div>
      {sub && <div className="relative mt-2 text-xs leading-relaxed text-slate-500">{sub}</div>}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ eyebrow, title, description, children }) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-[#13161e] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] animate-fadein">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
      <div className="mb-4">
        {eyebrow && <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{eyebrow}</div>}
        <h3 className="font-display text-xl font-bold text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-lg text-slate-400">•</div>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">{msg}</p>
    </div>
  );
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
  const [data, setData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,160,52,.18),transparent_70%)] blur-2xl" />
        <div className="absolute -right-40 top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(212,84,58,.12),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-32 left-[35%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,.10),transparent_70%)] blur-2xl" />
      </div>

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

        {/* Header */}
        <section className="relative overflow-hidden rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,.96),rgba(13,15,20,.92))] p-6 sm:p-8 shadow-[0_28px_90px_rgba(0,0,0,.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,160,52,.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(212,84,58,.12),transparent_26%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Live dashboard</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Postgres backed</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
                Usage <span style={{ background: "linear-gradient(135deg,var(--gold),var(--crimson))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-slate-400">
                Track visits, community reviews, and AI predictions in one place with a cleaner, denser dashboard layout.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StatPill label="Visits" value={formatCount(data?.total_visits)} accent="var(--gold)" />
              <StatPill label="Reviews" value={formatCount(data?.total_user_reviews)} accent="#60a5fa" />
              <StatPill label="Predictions" value={formatCount(data?.total_predictions)} accent="#a78bfa" />
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {lastRefresh && <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5">Updated {lastRefresh}</span>}
            <button onClick={load}
              className="rounded-full border border-white/8 bg-white/5 px-4 py-1.5 font-semibold text-slate-300 transition-colors hover:text-white">
              ↻ Refresh dashboard
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span className="mr-2">⚠</span>{error}
          </div>
        )}

        {loading && !data ? <Spinner /> : (
          <>
            {/* ── Stat Cards ── */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Visits"
                value={formatCount(data?.total_visits)}
                sub="Unique sessions"
                color="var(--gold)"
                icon="👁"
              />
              <StatCard
                label="User Reviews"
                value={formatCount(data?.total_user_reviews)}
                sub="Community submitted"
                color="#60a5fa"
                icon="✍"
              />
              <StatCard
                label="AI Predictions"
                value={formatCount(data?.total_predictions)}
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
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">

              {/* Sentiment donut */}
              <div className="xl:col-span-2">
                <Section
                  eyebrow="Community signal"
                  title="Sentiment Breakdown"
                  description="How the latest community reviews split across positive and negative reactions."
                >
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
              </div>

              {/* Top movies bar */}
              <div className="xl:col-span-3">
                <Section
                  eyebrow="Audience behavior"
                  title="Most Visited Movies"
                  description="The movies people are opening most often across the app."
                >
                  {topMoviesBar.length === 0
                    ? <Empty msg="No visits recorded yet" />
                    : <div className="rounded-2xl border border-white/5 bg-[#0d0f14] p-2">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topMoviesBar} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={120} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={TT} formatter={v => [`${v} visits`]} />
                          <Bar dataKey="visits" radius={[0, 10, 10, 0]} fill="url(#goldGrad)" barSize={14} />
                          <defs>
                            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#e8a034" stopOpacity={0.55} />
                              <stop offset="100%" stopColor="#e8a034" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  }
                </Section>
              </div>
            </div>

            {/* ── Recent Reviews table ── */}
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <Section
                  eyebrow="Latest feedback"
                  title="Recent Community Reviews"
                  description="A tighter review stream with sentiment and date chips for quick scanning."
                >
                  {!data?.recent_reviews?.length
                    ? <Empty msg="No community reviews yet — submit one from any movie page!" />
                    : <div className="flex flex-col gap-2">
                      {data.recent_reviews.map((r, i) => {
                        const isPos = r.prediction === "Positive";
                        return (
                          <div key={i}
                            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0d0f14] px-4 py-3.5 transition-colors hover:border-white/10 hover:bg-white/3 flex-wrap">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                              style={{ background: isPos ? "rgba(34,197,94,.18)" : "rgba(239,68,68,.16)", border: `1px solid ${isPos ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}` }}>
                              {isPos ? "+" : "-"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-white font-semibold">{r.username}</span>
                              <span className="text-slate-600 mx-2">·</span>
                              <span className="text-sm text-slate-400 truncate">{r.movie_title}</span>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isPos
                                ? "text-green-400 bg-green-500/10 border-green-500/20"
                                : "text-red-400 bg-red-500/10 border-red-500/20"
                              }`}>
                              {r.prediction}
                            </span>
                            <span className="text-[11px] text-slate-500 shrink-0 rounded-full border border-white/5 bg-white/5 px-2.5 py-1">
                              {r.created_at?.slice(0, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  }
                </Section>
              </div>

              <div className="xl:col-span-2">
                <Section
                  eyebrow="Data health"
                  title="Database Snapshot"
                  description="Quick readout of the three tables that power this dashboard."
                >
                  <div className="flex flex-col gap-3">
                    {[
                      ["movie_visits", data?.total_visits ?? 0, "👁", "var(--gold)"],
                      ["user_reviews", data?.total_user_reviews ?? 0, "✍", "#60a5fa"],
                      ["predict_logs", data?.total_predictions ?? 0, "🤖", "#a78bfa"],
                    ].map(([table, count, icon, accent]) => (
                      <div key={table} className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0d0f14] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/8 bg-white/5 text-lg" style={{ color: accent }}>{icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-white">{table}</div>
                            <div className="text-xs text-slate-500">Active rows in analytics store</div>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-sm font-bold text-white">
                          {formatCount(count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
