export default function CastSection({ cast }) {
  if (!cast?.length) return <p className="text-slate-500 text-sm">No cast information available.</p>;

  return (
    <div className="animate-fadein">
      <h3 className="font-display text-xl font-bold text-white mb-4">Cast</h3>
      <div className="grid grid-cols-2 gap-3">
        {cast.slice(0, 8).map((c, i) => {
          const hue = [...(c.name)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
          return (
            <div key={i} className="flex items-center gap-3 bg-[#13161e] border border-white/8 rounded-xl p-3.5">
              <div
                className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold overflow-hidden border border-white/10"
                style={{ background: `hsl(${hue},35%,20%)`, color: `hsl(${hue},70%,72%)` }}
              >
                {c.image
                  ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  : c.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
                }
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-white">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">as {c.character}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
