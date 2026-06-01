import { useNavigate } from "react-router-dom";

function MovieCard({ movie }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/movie/${movie.id}`)}
      className="shrink-0 w-36 sm:w-36 rounded-xl overflow-hidden border border-white/8 bg-[#13161e] cursor-pointer transition-transform hover:scale-105"
      style={{ aspectRatio: "2/3", position: "relative" }}>
      {movie.poster
        ? <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        : <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg,hsl(${movie.id % 360},28%,12%),hsl(${(movie.id + 130) % 360},22%,8%))` }}>
          <span className="text-4xl opacity-20">🎬</span>
        </div>
      }
      <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: "linear-gradient(transparent,rgba(0,0,0,.92))" }}>
        <div className="font-display text-xs font-semibold text-white leading-snug">{movie.title}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--gold)" }}>★ {movie.vote_average?.toFixed(1) ?? ""}</div>
      </div>
    </div>
  );
}

export default function RecommendationSection({ recommendations = [] }) {
  if (!recommendations.length) return <p className="text-slate-500 text-sm">No recommendations found.</p>;
  return (
    <div className="animate-fadein">
      <h3 className="font-display text-xl font-bold text-white mb-4">Recommended for You</h3>
      <div className="flex gap-3.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
        {recommendations.map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
