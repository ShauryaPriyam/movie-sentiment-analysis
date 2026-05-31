import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

const POSITIVE_KW = new Set(["amazing","brilliant","excellent","fantastic","great","outstanding",
  "superb","masterpiece","wonderful","incredible","stunning","powerful","beautiful","perfect",
  "loved","best","heartfelt","smart","dazzling","remarkable","exceptional","stellar","emotional","moving"]);
const NEGATIVE_KW = new Set(["terrible","awful","horrible","worst","bad","boring","disappointing",
  "waste","poor","dull","mediocre","weak","overlong","hollow","thin","confusing","predictable",
  "forgettable","tedious","struggled","ridiculous"]);

const TT = { background:"#13161e", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, fontSize:12, fontFamily:"Inter,sans-serif" };

function StatCard({ label, pct, color, barColor }) {
  return (
    <div className="flex-1 bg-[#13161e] border border-white/8 rounded-xl p-4">
      <div className="text-[11px] font-bold tracking-widest text-slate-500">{label}</div>
      <div className="text-4xl font-bold mt-1.5 mb-3" style={{ color }}>{pct}%</div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

export default function SentimentSection({ reviews = [] }) {
  const stats = useMemo(() => {
    const pos = reviews.filter(r => r.prediction?.toLowerCase() === "positive").length;
    const neg = reviews.filter(r => r.prediction?.toLowerCase() === "negative").length;
    const neu = reviews.length - pos - neg;
    const total = reviews.length || 1;
    return {
      posPct: Math.round(pos/total*100),
      negPct: Math.round(neg/total*100),
      neuPct: Math.round(neu/total*100),
    };
  }, [reviews]);

  const donut = [
    { name:"Positive", value: stats.posPct, color:"#22c55e" },
    { name:"Neutral",  value: stats.neuPct, color:"#94a3b8" },
    { name:"Negative", value: stats.negPct, color:"#ef4444" },
  ].filter(d => d.value > 0);

  const timeline = useMemo(() =>
    [...reviews].filter(r => r.created_at || r.date)
      .sort((a,b) => (a.created_at||a.date||"").localeCompare(b.created_at||b.date||""))
      .map(r => ({
        date: (r.created_at||r.date||"").slice(5,10),
        score: r.prediction?.toLowerCase()==="positive"?1:r.prediction?.toLowerCase()==="negative"?-1:0,
      }))
  , [reviews]);

  const topTerms = useMemo(() => {
    const pm={}, nm={};
    reviews.forEach(r => (r.keywords||[]).forEach(kw => {
      if (POSITIVE_KW.has(kw.toLowerCase())) pm[kw]=(pm[kw]||0)+1;
      if (NEGATIVE_KW.has(kw.toLowerCase())) nm[kw]=(nm[kw]||0)+1;
    }));
    const s=(a,b)=>b[1]-a[1];
    return {
      pos: Object.entries(pm).sort(s).slice(0,6).map(([term,count])=>({term,count})),
      neg: Object.entries(nm).sort(s).slice(0,6).map(([term,count])=>({term,count})),
    };
  }, [reviews]);

  if (!reviews.length) return <p className="text-slate-500 text-sm">No reviews to analyze yet.</p>;

  const Box = ({ title, children }) => (
    <div className="flex-1 min-w-[240px] bg-[#13161e] border border-white/8 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="animate-fadein flex flex-col gap-3">
      {/* Stat cards */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="POSITIVE" pct={stats.posPct} color="#22c55e" barColor="#22c55e" />
        <StatCard label="NEUTRAL"  pct={stats.neuPct} color="#94a3b8" barColor="#94a3b8" />
        <StatCard label="NEGATIVE" pct={stats.negPct} color="#ef4444" barColor="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="flex gap-3 flex-wrap">
        <Box title="Sentiment distribution">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donut} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {donut.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v=>`${v}%`} contentStyle={TT} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {[["#22c55e","Positive"],["#94a3b8","Neutral"],["#ef4444","Negative"]].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{background:c}} />{l}
              </span>
            ))}
          </div>
        </Box>
        <Box title="Sentiment timeline">
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={timeline} margin={{left:0,right:8,top:4,bottom:4}}>
              <XAxis dataKey="date" tick={{fontSize:10,fill:"#475569"}} />
              <YAxis domain={[-1,1]} tick={{fontSize:10,fill:"#475569"}} />
              <Tooltip contentStyle={TT} />
              <Line type="monotone" dataKey="score" stroke="#e8a034" strokeWidth={2} dot={{fill:"#e8a034",r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </div>

      {/* Term charts */}
      <div className="flex gap-3 flex-wrap">
        {[["Top positive terms",topTerms.pos,"#22c55e"],["Top negative terms",topTerms.neg,"#ef4444"]].map(([title,data,color])=>(
          <Box key={title} title={title}>
            {data.length>0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} layout="vertical" margin={{left:8,right:8}}>
                  <XAxis type="number" tick={{fontSize:10,fill:"#475569"}} />
                  <YAxis type="category" dataKey="term" tick={{fontSize:11,fill:"#94a3b8"}} width={90} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill={color} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-slate-600">No terms detected.</p>}
          </Box>
        ))}
      </div>
    </div>
  );
}
