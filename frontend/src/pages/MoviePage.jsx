import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MovieHero from "../components/MovieHero";
import CastSection from "../components/CastSection";
import ReviewsSection from "../components/ReviewsSection";
import SentimentSection from "../components/SentimentSection";
import RecommendationSection from "../components/RecommendationSection";
import SimilarMovies from "../components/SimilarMovies";
import TrailerSection from "../components/TrailerSection";
import API from "../api/api";

const POSITIVE_KW = new Set(["amazing","brilliant","excellent","fantastic","great","outstanding",
  "superb","masterpiece","wonderful","incredible","stunning","powerful","beautiful","perfect",
  "loved","best","heartfelt","smart","dazzling","exceptional","stellar","emotional","moving"]);
const NEGATIVE_KW = new Set(["terrible","awful","horrible","worst","bad","boring","disappointing",
  "waste","poor","dull","mediocre","weak","overlong","hollow","thin","confusing","predictable",
  "forgettable","tedious","struggled","ridiculous"]);

function localAnalyze(text) {
  const words = (text||"").toLowerCase().split(/\s+/);
  let pos=0, neg=0; const terms=[];
  words.forEach(w => {
    const c = w.replace(/[^a-z]/g,"");
    if(POSITIVE_KW.has(c)){pos++;terms.push(c);}
    if(NEGATIVE_KW.has(c)){neg++;terms.push(c);}
  });
  return {
    prediction: pos>neg?"Positive":neg>pos?"Negative":"Neutral",
    confidence: Math.min(99,50+Math.abs(pos-neg)*12),
    keywords: [...new Set(terms)].slice(0,4),
  };
}

export default function MoviePage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [tab, setTab]         = useState("overview");
  const [favs, setFavs]       = useState([]);
  const [wl,   setWl]         = useState([]);
  const [movie,    setMovie]  = useState(null);
  const [cast,     setCast]   = useState([]);
  const [reviews,  setReviews]= useState([]);
  const [recs,     setRecs]   = useState([]);
  const [similar,  setSimilar]= useState([]);
  const [trailers, setTrailers]= useState([]);
  const [loading,  setLoading]= useState(true);
  const [error,    setError]  = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setError(null); setTab("overview");
    Promise.all([
      API.get(`/movies/${id}`),
      API.get(`/movies/${id}/cast`),
      API.get(`/movies/${id}/analysis`),
      API.get(`/movies/${id}/recommendations`),
      API.get(`/movies/${id}/similar`),
      API.get(`/movies/${id}/trailers`),
    ]).then(([mR,cR,aR,rR,sR,tR]) => {
      setMovie(mR.data);
      setCast(cR.data||[]);
      const raw = aR.data?.reviews||[];
      setReviews(raw.map(r => {
        if (r.prediction) return { ...r, text: r.content||r.text||"" };
        const a = localAnalyze(r.content||r.text||"");
        return { ...r, text: r.content||r.text||"", ...a };
      }));
      setRecs(rR.data||[]);
      setSimilar(sR.data||[]);
      setTrailers(tR.data||[]);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError("Could not load movie. Is the backend running?");
      setLoading(false);
    });
  }, [id]);

  const toggleFav = () => setFavs(f => f.includes(+id)?f.filter(x=>x!==+id):[...f,+id]);
  const toggleWl  = () => setWl(w  => w.includes(+id)?w.filter(x=>x!==+id):[...w,+id]);

  return (
    <div className="min-h-screen bg-[#0d0f14]">
      <Navbar />

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-11 h-11 rounded-full border-[3px] border-white/8"
            style={{borderTopColor:"var(--gold)",animation:"spin .8s linear infinite"}} />
          <span className="text-slate-500 text-sm">Loading movie & analyzing reviews…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-lg mx-auto mt-16 p-5 bg-red-500/10 border border-red-500/25 rounded-xl text-center">
          <p className="text-red-400 text-sm mb-3">⚠ {error}</p>
          <button onClick={() => navigate("/")}
            className="px-5 py-2 bg-[#13161e] border border-white/8 rounded-lg text-slate-400 text-sm cursor-pointer font-sans hover:text-white transition-colors">
            ← Back to home
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && movie && (
        <>
          <div className="max-w-[1100px] mx-auto px-8 pt-6">
            <button onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-500 text-xs cursor-pointer bg-transparent border-none font-sans hover:text-white transition-colors mb-1">
              ← Back to discover
            </button>
          </div>

          <MovieHero
            movie={movie} activeTab={tab} onTabChange={setTab}
            favs={favs} onToggleFav={toggleFav} wl={wl} onToggleWl={toggleWl}
          />

          {/* Tab content — indented to align under info column */}
          <div className="max-w-[1100px] mx-auto px-8 pb-20">
            <div style={{paddingLeft:"calc(220px + 2.5rem)"}}>
              <div className="pt-6">
                {tab === "overview"        && <><CastSection cast={cast}/><TrailerSection trailers={trailers}/><SimilarMovies similar={similar}/></>}
                {tab === "reviews"         && <ReviewsSection reviews={reviews}/>}
                {tab === "sentiment"       && <SentimentSection reviews={reviews}/>}
                {tab === "recommendations" && <RecommendationSection recommendations={recs}/>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}