const TABS = ["overview", "reviews", "sentiment", "recommendations"];

export default function MovieHero({ movie, activeTab, onTabChange, favs, onToggleFav, wl, onToggleWl }) {
  if (!movie) return null;
  const genres  = movie.genres || [];
  const rating  = movie.vote_average ?? movie.rating ?? 0;
  const year    = movie.release_date?.slice(0,4) ?? movie.year ?? "";
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const isFav   = favs?.includes(movie.id);
  const inWL    = wl?.includes(movie.id);

  return (
    <div className="max-w-[1100px] mx-auto px-8 pt-8">
      <div className="flex gap-10 items-start flex-wrap">

        {/* Poster */}
        <div className="shrink-0 w-[220px]">
          <div
            className="rounded-2xl overflow-hidden border border-white/8 flex items-center justify-center"
            style={{
              aspectRatio: "2/3",
              background: `linear-gradient(135deg, hsl(${movie.id%360},30%,12%), hsl(${(movie.id+120)%360},25%,8%))`,
            }}
          >
            {movie.poster
              ? <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
              : <span className="text-6xl opacity-20">🎬</span>}
          </div>
          <div className="flex gap-2 mt-3">
            {[[`♡ Favorite`, isFav, onToggleFav], [`⊞ Watchlist`, inWL, onToggleWl]].map(([label, active, fn]) => (
              <button key={label} onClick={fn}
                className={`flex-1 py-2 rounded-lg text-xs cursor-pointer transition-all border font-sans ${
                  active
                    ? "border-[--gold] bg-[--gold]/10 text-[--gold]"
                    : "border-white/8 bg-transparent text-slate-400 hover:text-white hover:border-white/20"
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-[280px]">
          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-3">
            {genres.map((g, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-600 text-xs">·</span>}
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
                  {g.name ?? g}
                </span>
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl font-bold text-white mb-3 leading-tight">
            {movie.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-5 text-sm text-slate-400 mb-5 items-center">
            <span className="font-semibold text-base" style={{ color: "var(--gold)" }}>
              ★ {typeof rating === "number" ? rating.toFixed(1) : rating}
            </span>
            {year    && <span>📅 {year}</span>}
            {runtime && <span>⏱ {runtime}</span>}
          </div>

          <p className="text-slate-400 text-[15px] leading-relaxed mb-7">{movie.overview}</p>

          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {TABS.map(t => (
              <button key={t} onClick={() => onTabChange(t)}
                className={`px-5 py-2.5 text-sm cursor-pointer font-sans border-none bg-transparent transition-colors capitalize ${
                  activeTab === t
                    ? "text-white border-b-2 border-[--gold] -mb-px"
                    : "text-slate-500 hover:text-slate-300 border-b-2 border-transparent -mb-px"
                }`}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
