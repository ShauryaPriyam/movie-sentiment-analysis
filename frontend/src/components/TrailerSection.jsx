import { useState } from "react";

export default function TrailerSection({ trailers = [] }) {
  const [active, setActive] = useState(0);
  if (!trailers.length) return null;
  const current = trailers[active];
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold text-white mb-4">Trailers & Clips</h3>
      <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0a0c10]" style={{aspectRatio:"16/9"}}>
        <iframe
          src={`https://www.youtube.com/embed/${current.key}?rel=0`}
          title={current.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen className="w-full h-full border-0" />
      </div>
      {trailers.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 mt-3" style={{scrollbarWidth:"thin"}}>
          {trailers.map((t, i) => (
            <div key={t.key} onClick={() => setActive(i)}
              className={`shrink-0 w-[160px] rounded-lg overflow-hidden cursor-pointer border transition-colors ${
                i===active ? "border-[--gold]" : "border-white/8 hover:border-white/20"
              }`}>
              <img src={`https://img.youtube.com/vi/${t.key}/mqdefault.jpg`} alt={t.name}
                className="w-full block object-cover" style={{aspectRatio:"16/9"}} />
              <div className={`px-2 py-1.5 text-[11px] truncate bg-[#13161e] ${i===active?"text-[--gold]":"text-slate-500"}`}>
                {t.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
