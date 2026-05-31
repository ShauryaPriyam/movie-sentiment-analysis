from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from preprocessing import (
    load_models,
    predict_sentiment,
    analyze_reviews,
)


from services.tmdb import (
    search_movies,
    get_movie_details,
    get_movie_cast,
    get_movie_reviews,
    get_recommendations,
    get_similar_movies,
    get_trailers
)

app = FastAPI(
    title="Movie Sentiment Analysis API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

svm_model, log_model, vectorizer = load_models()


class ReviewRequest(BaseModel):
    review: str
    model: str = "svm"


@app.get("/")
def home():

    return {
        "message":
        "Movie Sentiment Analysis API Running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/predict")
def predict(data: ReviewRequest):

    model = (
        svm_model
        if data.model == "svm"
        else log_model
    )

    result = predict_sentiment(
        data.review,
        model,
        vectorizer
    )

    return result

# ==========================
# MOVIE SEARCH
# ==========================

@app.get("/movies/search")
def movie_search(q: str):

    results = search_movies(q)

    movies = []

    for movie in results:

        poster = None

        if movie.get("poster_path"):
            poster = (
                "https://image.tmdb.org/t/p/w500"
                + movie["poster_path"]
            )

        movies.append({
            "id": movie["id"],
            "title": movie["title"],
            "release_date": movie.get("release_date"),
            "vote_average": movie.get("vote_average"),
            "poster": poster
        })

    return movies


# ==========================
# MOVIE DETAILS
# ==========================

@app.get("/movies/{movie_id}")
def movie_details(movie_id: int):

    movie = get_movie_details(movie_id)

    return {
        "id": movie["id"],
        "title": movie["title"],
        "overview": movie["overview"],
        "runtime": movie["runtime"],
        "genres": movie["genres"],
        "release_date": movie["release_date"],
        "vote_average": movie["vote_average"],
        "poster": (
            "https://image.tmdb.org/t/p/w500"
            + movie["poster_path"]
        )
        if movie.get("poster_path")
        else None,

        "backdrop": (
            "https://image.tmdb.org/t/p/original"
            + movie["backdrop_path"]
        )
        if movie.get("backdrop_path")
        else None
    }


# ==========================
# CAST
# ==========================

@app.get("/movies/{movie_id}/cast")
def movie_cast(movie_id: int):

    cast_data = get_movie_cast(movie_id)

    cast = []

    for actor in cast_data.get("cast", [])[:15]:

        cast.append({
            "name": actor["name"],
            "character": actor["character"],
            "image": (
                "https://image.tmdb.org/t/p/w500"
                + actor["profile_path"]
            )
            if actor.get("profile_path")
            else None
        })

    return cast


# ==========================
# REVIEWS
# ==========================

@app.get("/movies/{movie_id}/reviews")
def movie_reviews(movie_id: int):

    reviews = get_movie_reviews(movie_id)

    return [
        {
            "author": review["author"],
            "content": review["content"],
            "created_at": review["created_at"]
        }
        for review in reviews
    ]


# ==========================
# RECOMMENDATIONS
# ==========================

@app.get("/movies/{movie_id}/recommendations")
def movie_recommendations(movie_id: int):

    recommendations = get_recommendations(movie_id)

    return [
        {
            "id": movie["id"],
            "title": movie["title"],
            "poster": (
                "https://image.tmdb.org/t/p/w500"
                + movie["poster_path"]
            )
            if movie.get("poster_path")
            else None
        }
        for movie in recommendations[:12]
    ]


# ==========================
# SIMILAR MOVIES
# ==========================

@app.get("/movies/{movie_id}/similar")
def movie_similar(movie_id: int):

    similar = get_similar_movies(movie_id)

    return [
        {
            "id": movie["id"],
            "title": movie["title"],
            "poster": (
                "https://image.tmdb.org/t/p/w500"
                + movie["poster_path"]
            )
            if movie.get("poster_path")
            else None
        }
        for movie in similar[:12]
    ]


# ==========================
# TRAILERS
# ==========================

@app.get("/movies/{movie_id}/trailers")
def movie_trailers(movie_id: int):

    trailers = get_trailers(movie_id)

    youtube_trailers = []

    for trailer in trailers:

        if trailer.get("site") == "YouTube":

            youtube_trailers.append({
                "name": trailer["name"],
                "key": trailer["key"],
                "url": (
                    f"https://www.youtube.com/watch?v={trailer['key']}"
                )
            })

    return youtube_trailers


# ==========================
# SENTIMENT ANALYSIS
# ==========================

@app.get("/movies/{movie_id}/analysis")
def movie_analysis(movie_id: int, model: str = "svm"):

    selected_model = (
        svm_model
        if model == "svm"
        else log_model
    )

    reviews = get_movie_reviews(movie_id)

    return analyze_reviews(reviews, selected_model, vectorizer)