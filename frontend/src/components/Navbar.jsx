import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <nav
      className="
        sticky
        top-0
        z-50
        border-b
        border-white/10
        bg-[#0d0f14]/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
          h-16
          flex
          items-center
          justify-between
        "
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="
            flex
            items-center
            gap-3
            cursor-pointer
            select-none
            group
          "
        >
          <div
            className="
              w-9
              h-9
              rounded-xl
              flex
              items-center
              justify-center
              text-lg
              shadow-lg
              transition-transform
              duration-300
              group-hover:scale-105
            "
            style={{
              background:
                "linear-gradient(135deg,var(--gold),var(--crimson))",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M2 7h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" fill="rgba(255,255,255,0.06)" />
              <path d="M2 7l4-4 4 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 7l4-4 4 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <h1 className="font-display text-xl font-bold text-white">
              CineScope
            </h1>

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              AI Movie Intelligence
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">

          <button
            onClick={() => navigate("/")}
            className={`
              transition-colors
              ${isHome
                ? "text-amber-400"
                : "text-slate-400 hover:text-white"
              }
            `}
          >
            Discover
          </button>

          <a
            href="https://github.com/ShauryaPriyam/movie-sentiment-analysis"
            target="_blank"
            rel="noreferrer"
            className="
              flex
              items-center
              gap-2

              px-4
              py-2

              rounded-xl

              border
              border-white/10

              text-slate-300

              hover:text-white
              hover:border-amber-500/40
              hover:bg-white/5

              transition-all
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 0.296c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.6.111.793-.26.793-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.398 3.003-.403 1.02.005 2.047.137 3.006.403 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.874.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.804 5.621-5.476 5.919.43.372.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.289 0 .319.192.694.801.576C20.565 22.092 24 17.595 24 12.296c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
          </a>
            <span onClick={() => navigate("/analytics")}
              className="text-slate-500 cursor-pointer hover:text-[--gold] transition-colors flex items-center gap-1">
              📊 Analytics
            </span>
        </div>

        {/* Mobile Right Side */}
        <div className="md:hidden">
          <a
            href="https://github.com/ShauryaPriyam/movie-sentiment-analysis"
            target="_blank"
            rel="noreferrer"
            className="
              p-2
              rounded-lg
              border
              border-white/10
              text-slate-300
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 0.296c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.6.111.793-.26.793-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.398 3.003-.403 1.02.005 2.047.137 3.006.403 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.874.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.804 5.621-5.476 5.919.43.372.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.289 0 .319.192.694.801.576C20.565 22.092 24 17.595 24 12.296c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}