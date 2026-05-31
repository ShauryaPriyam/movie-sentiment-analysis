import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);

  const navigate = useNavigate();

  async function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 2) {
      setMovies([]);
      return;
    }

    try {
      const res = await API.get(
        `/movies/search?q=${value}`
      );

      setMovies(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="relative mt-10 max-w-3xl mx-auto">

      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search movie..."
        className="w-full p-5 rounded-2xl bg-slate-900 border border-slate-700 text-white"
      />

      {movies.length > 0 && (
        <div className="absolute mt-2 w-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">

          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() =>
                navigate(`/movie/${movie.id}`)
              }
              className="flex gap-4 p-3 hover:bg-slate-800 cursor-pointer"
            >
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-14 rounded"
              />

              <div>
                <h3 className="text-white">
                  {movie.title}
                </h3>

                <p className="text-slate-400 text-sm">
                  {movie.release_date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}