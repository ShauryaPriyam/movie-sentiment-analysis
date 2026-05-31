import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import API from "../api/api";

function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="
        cursor-pointer
        rounded-xl
        overflow-hidden
        border
        border-white/10
        bg-[#13161e]
        transition-all
        duration-300
        hover:scale-[1.03]
        hover:border-[--gold]/40
      "
      style={{ aspectRatio: "2/3", position: "relative" }}
    >
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(
              135deg,
              hsl(${movie.id % 360},28%,12%),
              hsl(${(movie.id + 120) % 360},22%,8%)
            )`,
          }}
        >
          <span className="text-5xl opacity-20">🎬</span>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
        style={{
          background: "linear-gradient(transparent,rgba(0,0,0,.93))",
        }}
      >
        <div className="font-display text-sm font-semibold text-white leading-snug">
          {movie.title}
        </div>

        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--gold)" }}
        >
          ★ {movie.vote_average?.toFixed(1) ?? ""}
          {" · "}
          {movie.release_date?.slice(0, 4) ?? ""}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "✦",
    title: "Explainable AI",
    desc: "See exactly which phrases drove each sentiment prediction.",
  },
  {
    icon: "◈",
    title: "Sentence-level Analysis",
    desc: "Every sentence highlighted positive or negative, not just the overall review.",
  },
  {
    icon: "◉",
    title: "Real Reviews",
    desc: "Powered by live TMDB review data, not curated samples.",
  },
];

export default function Home() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    API.get("/movies/search?q=2023")
      .then(({ data }) => setTrending(data.slice(0, 12)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      <Navbar />

      {/* Hero */}
      <section
        className="
          text-center
          px-4
          sm:px-6
          lg:px-8
          pt-16
          sm:pt-20
          lg:pt-28
          pb-12
          sm:pb-16
        "
        style={{
          background:
            "radial-gradient(ellipse 130% 60% at 50% 0%, rgba(212,84,58,.2) 0%, rgba(232,160,52,.08) 40%, transparent 65%)",
        }}
      >
        <p
          className="
            text-[10px]
            sm:text-xs
            text-slate-500
            tracking-[0.12em]
            mb-7
            flex
            items-center
            justify-center
            gap-2
            flex-wrap
          "
        >
          ✦ Explainable AI · Sentence-level sentiment · Real reviews
        </p>

        <h1
          className="
            font-display
            font-black
            text-white
            leading-tight
            max-w-5xl
            mx-auto
            mb-5
            text-4xl
            sm:text-5xl
            md:text-6xl
            lg:text-7xl
            xl:text-8xl
          "
        >
          See what audiences{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg,var(--gold),var(--crimson))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            truly feel
          </span>{" "}
          about every film.
        </h1>

        <p
          className="
            text-slate-400
            max-w-xl
            mx-auto
            mb-10
            sm:mb-12
            leading-relaxed
            text-sm
            sm:text-base
            lg:text-lg
            px-2
          "
        >
          CineScope analyzes thousands of reviews with explainable AI —
          highlighting the exact phrases that shape opinions, scene by
          scene, sentence by sentence.
        </p>

        <SearchBar />
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Trending Now
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trending.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">
          Why CineScope?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="
                bg-[#13161e]
                border
                border-white/10
                rounded-2xl
                p-5
                sm:p-6
                hover:border-[--gold]/30
                transition-all
              "
            >
              <div
                className="text-2xl mb-3"
                style={{ color: "var(--gold)" }}
              >
                {f.icon}
              </div>

              <h3 className="font-display text-lg font-bold text-white mb-2">
                {f.title}
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            Built with React • FastAPI • PostgreSQL • TMDB • Explainable AI
          </p>
        </div>
      </footer>
    </div>
  );
}