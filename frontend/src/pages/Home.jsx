import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">

      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-32 text-center">

        <span className="px-4 py-2 border border-slate-700 rounded-full text-slate-400">
          AI Movie Intelligence
        </span>

        <h1 className="mt-8 text-6xl font-bold text-white">
          Search Any Movie
        </h1>

        <p className="mt-6 text-xl text-slate-400">
          Reviews, Sentiment Analysis,
          Cast, Recommendations & Trailers
        </p>

        <SearchBar />
      </section>
    </div>
  );
}