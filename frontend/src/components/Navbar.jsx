import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 border-b border-white/5 bg-[#0d0f14]/90 backdrop-blur-xl">
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: "var(--gold)" }}>🎬</div>
        <span className="font-display text-xl font-bold text-white">CineScope</span>
      </div>
      <div className="flex gap-7 text-sm">
        <span onClick={() => navigate("/")}
          className="text-white cursor-pointer hover:text-[--gold] transition-colors">Discover</span>
        <span className="text-slate-500 cursor-pointer hover:text-white transition-colors">Features</span>
      </div>
    </nav>
  );
}