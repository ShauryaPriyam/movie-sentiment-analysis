import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const debounce = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounce.current);
    if (!v.trim()) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await API.get(`/movies/search?q=${encodeURIComponent(v)}`);
        setSuggestions(data.slice(0, 6));
        setOpen(true);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const goTo = (id) => { setOpen(false); setQuery(""); navigate(`/movie/${id}`); };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-5 py-1.5 shadow-2xl">
        <span className="text-slate-400 text-lg">⌕</span>
        <input
          value={query}
          onChange={handleChange}
          onKeyDown={e => e.key === "Enter" && suggestions[0] && goTo(suggestions[0].id)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Search a movie, genre, or vibe..."
          className="flex-1 bg-transparent border-none outline-none text-white text-base placeholder-slate-500 py-2.5 font-sans"
        />
        <button
          onClick={() => suggestions[0] && goTo(suggestions[0].id)}
          className="px-7 py-2.5 rounded-xl text-sm font-bold text-[#0a0c10] cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--gold), #c4881c)" }}
        >Analyze</button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#13161e] border border-white/8 rounded-xl overflow-hidden z-50 shadow-2xl">
          {suggestions.map(m => (
            <div key={m.id} onMouseDown={() => goTo(m.id)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
              {m.poster
                ? <img src={m.poster} alt={m.title} className="w-8 h-12 object-cover rounded" />
                : <span className="text-xl">🎬</span>}
              <div>
                <div className="text-sm text-white font-medium">{m.title}</div>
                <div className="text-xs text-slate-500">
                  {m.release_date?.slice(0, 4)} · ★ {m.vote_average?.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
