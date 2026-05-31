export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <h1 className="font-bold text-xl text-white">
            CineScope
          </h1>
        </div>

        <div className="flex gap-6 text-slate-400">
          <a href="/">Home</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>
        </div>
      </div>
    </nav>
  );
}