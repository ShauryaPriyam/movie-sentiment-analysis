from dotenv import load_dotenv
load_dotenv()

from typing import Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text

from database import engine, Base, get_db
from models import MovieVisit, UserReview, PredictLog

from preprocessing import load_models, predict_sentiment, analyze_reviews
from services.tmdb import (
    search_movies, get_movie_details, get_movie_cast,
    get_movie_reviews, get_recommendations,
    get_similar_movies, get_trailers,
)


# ── Startup: create all tables ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Movie Sentiment Analysis API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

svm_model, log_model, vectorizer = load_models()

MODEL_CATALOG = [
    {"id":"svm", "name":"SVM",                "description":"Support Vector Machine classifier",  "version":"1.0.0","default":True},
    {"id":"log", "name":"Logistic Regression", "description":"Logistic Regression classifier",      "version":"1.0.0","default":False},
]

def get_selected_model(model_name: str) -> Any:
    return svm_model if model_name == "svm" else log_model


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class ReviewRequest(BaseModel):
    review: str
    model: str = "svm"

class VisitRequest(BaseModel):
    movie_id   : int
    movie_title: str
    session_id : str = Field(..., min_length=8, max_length=64)

class UserReviewCreate(BaseModel):
    movie_id   : int
    movie_title: str
    username   : str = Field(..., min_length=1, max_length=80)
    review_text: str = Field(..., min_length=10, max_length=5000)
    rating     : float | None = Field(None, ge=1, le=10)
    model      : str = "svm"


# ══════════════════════════════════════════════════════════════════════════════
# CORE
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def home():
    return {"message": "Movie Sentiment Analysis API Running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/models")
def list_models():
    return MODEL_CATALOG

@app.post("/predict")
async def predict(data: ReviewRequest, db: AsyncSession = Depends(get_db)):
    model  = get_selected_model(data.model)
    result = predict_sentiment(data.review, model, vectorizer)

    # log every prediction for analytics
    db.add(PredictLog(
        review_text=data.review[:2000],
        model_used =data.model,
        prediction =result["prediction"],
        confidence =result["confidence"],
    ))

    return result


# ══════════════════════════════════════════════════════════════════════════════
# VISITS  — frontend fires POST /visits when a movie page is opened
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/visits", status_code=201)
async def record_visit(data: VisitRequest, db: AsyncSession = Depends(get_db)):
    """
    One visit per session per movie.
    Frontend generates a UUID once (stored in localStorage) and sends it here.
    """
    existing = await db.execute(
        select(MovieVisit).where(
            MovieVisit.session_id == data.session_id,
            MovieVisit.movie_id   == data.movie_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"recorded": False, "reason": "already_counted"}

    db.add(MovieVisit(
        movie_id   =data.movie_id,
        movie_title=data.movie_title,
        session_id =data.session_id,
    ))
    return {"recorded": True}


@app.get("/visits/{movie_id}")
async def get_visit_count(movie_id: int, db: AsyncSession = Depends(get_db)):
    count = await db.scalar(
        select(func.count()).where(MovieVisit.movie_id == movie_id)
    )
    return {"movie_id": movie_id, "visits": count or 0}


@app.get("/visits")
async def top_visited(limit: int = Query(10, le=50), db: AsyncSession = Depends(get_db)):
    """Top visited movies — useful for homepage 'trending by visits'."""
    rows = await db.execute(
        select(MovieVisit.movie_id, MovieVisit.movie_title, func.count().label("visits"))
        .group_by(MovieVisit.movie_id, MovieVisit.movie_title)
        .order_by(desc("visits"))
        .limit(limit)
    )
    return [{"movie_id": r.movie_id, "movie_title": r.movie_title, "visits": r.visits}
            for r in rows.all()]


# ══════════════════════════════════════════════════════════════════════════════
# USER REVIEWS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/user-reviews", status_code=201)
async def submit_user_review(data: UserReviewCreate, db: AsyncSession = Depends(get_db)):
    model  = get_selected_model(data.model)
    result = predict_sentiment(data.review_text, model, vectorizer)

    review = UserReview(
        movie_id   =data.movie_id,
        movie_title=data.movie_title,
        username   =data.username.strip(),
        review_text=data.review_text.strip(),
        rating     =data.rating,
        prediction =result["prediction"],
        confidence =result["confidence"],
        keywords   =", ".join(result.get("keywords", [])),
        model_used =data.model,
    )
    db.add(review)

    # Keep analytics in sync with every AI prediction made from a submitted review.
    db.add(PredictLog(
        review_text=data.review_text[:2000],
        model_used =data.model,
        prediction =result["prediction"],
        confidence =result["confidence"],
    ))

    await db.flush()   # get the id before commit

    return {
        "id"        : review.id,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "keywords"  : result.get("keywords", []),
    }


@app.get("/user-reviews/{movie_id}")
async def get_user_reviews(
    movie_id: int,
    limit   : int = Query(20, le=100),
    offset  : int = Query(0,  ge=0),
    db      : AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(UserReview)
        .where(UserReview.movie_id == movie_id)
        .order_by(desc(UserReview.created_at))
        .limit(limit).offset(offset)
    )
    reviews = rows.scalars().all()

    total = await db.scalar(
        select(func.count()).where(UserReview.movie_id == movie_id)
    )

    return {
        "total"  : total or 0,
        "reviews": [
            {
                "id"        : r.id,
                "username"  : r.username,
                "review_text": r.review_text,
                "rating"    : r.rating,
                "prediction": r.prediction,
                "confidence": r.confidence,
                "keywords"  : r.keywords.split(", ") if r.keywords else [],
                "model_used": r.model_used,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ],
    }


# ══════════════════════════════════════════════════════════════════════════════
# ANALYTICS  — overview stats for a dashboard or admin page
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/analytics")
async def analytics(db: AsyncSession = Depends(get_db)):
    total_visits  = await db.scalar(select(func.count()).select_from(MovieVisit))
    total_reviews = await db.scalar(select(func.count()).select_from(UserReview))
    total_predicts= await db.scalar(select(func.count()).select_from(PredictLog))

    pos = await db.scalar(
        select(func.count()).where(UserReview.prediction == "Positive")
    )
    neg = await db.scalar(
        select(func.count()).where(UserReview.prediction == "Negative")
    )

    top_movies = await db.execute(
        select(MovieVisit.movie_id, MovieVisit.movie_title, func.count().label("visits"))
        .group_by(MovieVisit.movie_id, MovieVisit.movie_title)
        .order_by(desc("visits"))
        .limit(5)
    )

    recent_reviews = await db.execute(
        select(UserReview).order_by(desc(UserReview.created_at)).limit(5)
    )

    return {
        "total_visits"       : total_visits   or 0,
        "total_user_reviews" : total_reviews  or 0,
        "total_predictions"  : total_predicts or 0,
        "sentiment_breakdown": {
            "positive": pos or 0,
            "negative": neg or 0,
        },
        "top_movies": [
            {"movie_id": r.movie_id, "movie_title": r.movie_title, "visits": r.visits}
            for r in top_movies.all()
        ],
        "recent_reviews": [
            {
                "username"  : r.username,
                "movie_title": r.movie_title,
                "prediction": r.prediction,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_reviews.scalars().all()
        ],
    }

@app.get("/movies/search")
def movie_search(q: str):
    results = search_movies(q)
    movies  = []
    for movie in results:
        poster = ("https://image.tmdb.org/t/p/w500" + movie["poster_path"]) if movie.get("poster_path") else None
        movies.append({"id":movie["id"],"title":movie["title"],"release_date":movie.get("release_date"),"vote_average":movie.get("vote_average"),"poster":poster})
    return movies

@app.get("/movies/{movie_id}")
def movie_details(movie_id: int):
    movie = get_movie_details(movie_id)
    return {
        "id":movie["id"],"title":movie["title"],"overview":movie["overview"],
        "runtime":movie["runtime"],"genres":movie["genres"],
        "release_date":movie["release_date"],"vote_average":movie["vote_average"],
        "poster":   ("https://image.tmdb.org/t/p/w500"      + movie["poster_path"])      if movie.get("poster_path")    else None,
        "backdrop": ("https://image.tmdb.org/t/p/original"  + movie["backdrop_path"])    if movie.get("backdrop_path")  else None,
    }

@app.get("/movies/{movie_id}/cast")
def movie_cast(movie_id: int):
    cast_data = get_movie_cast(movie_id)
    return [
        {"name":a["name"],"character":a["character"],
         "image":("https://image.tmdb.org/t/p/w500"+a["profile_path"]) if a.get("profile_path") else None}
        for a in cast_data.get("cast",[])[:15]
    ]

@app.get("/movies/{movie_id}/reviews")
def movie_reviews(movie_id: int):
    return [{"author":r["author"],"content":r["content"],"created_at":r["created_at"]} for r in get_movie_reviews(movie_id)]

@app.get("/movies/{movie_id}/recommendations")
def movie_recommendations(movie_id: int):
    return [
        {"id":m["id"],"title":m["title"],"vote_average":m.get("vote_average"),
         "poster":("https://image.tmdb.org/t/p/w500"+m["poster_path"]) if m.get("poster_path") else None}
        for m in get_recommendations(movie_id)[:12]
    ]

@app.get("/movies/{movie_id}/similar")
def movie_similar(movie_id: int):
    return [
        {"id":m["id"],"title":m["title"],
         "poster":("https://image.tmdb.org/t/p/w500"+m["poster_path"]) if m.get("poster_path") else None}
        for m in get_similar_movies(movie_id)[:12]
    ]

@app.get("/movies/{movie_id}/trailers")
def movie_trailers(movie_id: int):
    return [
        {"name":t["name"],"key":t["key"],"url":f"https://www.youtube.com/watch?v={t['key']}"}
        for t in get_trailers(movie_id) if t.get("site") == "YouTube"
    ]

@app.get("/movies/{movie_id}/analysis")
def movie_analysis(movie_id: int, model: str = "svm"):
    selected_model = get_selected_model(model)
    reviews        = get_movie_reviews(movie_id)
    return analyze_reviews(reviews, selected_model, vectorizer)