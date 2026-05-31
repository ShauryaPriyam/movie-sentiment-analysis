import { useNavigate } from "react-router-dom";

export default function SimilarMovies({ similar = [] }) {
  const navigate = useNavigate();
  if (!similar.length) return null;
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold text-white mb-4">More Like This</h3>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:"thin"}}>
        {similar.map(m => (
          <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)}
            className="shrink-0 w-[130px] rounded-xl overflow-hidden border border-white/8 bg-[#13161e] cursor-pointer transition-transform hover:scale-105"
            style={{aspectRatio:"2/3",position:"relative"}}>
            {m.poster
              ? <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center"
                  style={{background:`linear-gradient(135deg,hsl(${m.id%360},28%,12%),hsl(${(m.id+90)%360},22%,8%))`}}>
                  <span className="text-3xl opacity-20">🎬</span>
                </div>
            }
            <div className="absolute bottom-0 left-0 right-0 p-2"
              style={{background:"linear-gradient(transparent,rgba(0,0,0,.9))"}}>
              <div className="font-display text-[11px] font-semibold text-white leading-snug">{m.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
