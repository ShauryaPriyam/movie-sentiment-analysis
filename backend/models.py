"""
models.py
---------
Three tables:

  movie_visits   — every time someone opens a movie page (deduplicated by session_id)
  user_reviews   — reviews submitted by users via the frontend form
  predict_logs   — every /predict call (text, model used, result) for analytics
"""

from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger, Integer, String, Text,
    Float, DateTime, Index, func
)
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── 1. Movie Visits ────────────────────────────────────────────────────────────

class MovieVisit(Base):
    __tablename__ = "movie_visits"

    id         : Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    movie_id   : Mapped[int]      = mapped_column(BigInteger, nullable=False, index=True)
    movie_title: Mapped[str]      = mapped_column(String(300), nullable=False)
    session_id : Mapped[str]      = mapped_column(String(64),  nullable=False)   # random uuid from frontend
    visited_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        # one visit per session per movie (upsert target)
        Index("ix_visit_session_movie", "session_id", "movie_id"),
    )


# ── 2. User Reviews ────────────────────────────────────────────────────────────

class UserReview(Base):
    __tablename__ = "user_reviews"

    id         : Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    movie_id   : Mapped[int]      = mapped_column(BigInteger, nullable=False, index=True)
    movie_title: Mapped[str]      = mapped_column(String(300), nullable=False)
    username   : Mapped[str]      = mapped_column(String(80),  nullable=False)
    review_text: Mapped[str]      = mapped_column(Text,        nullable=False)
    rating     : Mapped[float | None] = mapped_column(Float, nullable=True)    # 1–10, user-given
    prediction : Mapped[str | None]   = mapped_column(String(20), nullable=True)  # Positive/Negative
    confidence : Mapped[float | None] = mapped_column(Float, nullable=True)
    keywords   : Mapped[str | None]   = mapped_column(String(300), nullable=True)  # comma-separated
    model_used : Mapped[str]      = mapped_column(String(20),  default="svm")
    created_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ── 3. Predict Logs ───────────────────────────────────────────────────────────

class PredictLog(Base):
    __tablename__ = "predict_logs"

    id         : Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_text: Mapped[str]      = mapped_column(Text,       nullable=False)
    model_used : Mapped[str]      = mapped_column(String(20), nullable=False)
    prediction : Mapped[str]      = mapped_column(String(20), nullable=False)
    confidence : Mapped[float]    = mapped_column(Float,      nullable=False)
    created_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
