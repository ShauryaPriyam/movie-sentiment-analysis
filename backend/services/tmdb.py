import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import HTTPException

# ── Config ─────────────────────────────────────────────────────────────────────

TMDB_API_KEY   = os.getenv("TMDB_API_KEY")
BASE_URL       = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
IMAGE_ORIG_URL = "https://image.tmdb.org/t/p/original"

if not TMDB_API_KEY:
    raise EnvironmentError(
        "TMDB_API_KEY is not set. "
        "Add it to your .env file and ensure load_dotenv() runs before importing this module."
    )

# ── Session with headers + retry ───────────────────────────────────────────────
# Windows (error 10054) = server closed connection because request looked like a bot.
# Fix: send real browser headers and auto-retry on transient resets.

_session = requests.Session()

_session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":          "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection":      "keep-alive",
})

_retry = Retry(
    total=3,
    backoff_factor=0.5,           # waits 0s, 0.5s, 1s between retries
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
)

_session.mount("https://", HTTPAdapter(max_retries=_retry))


# ── Internal helper ────────────────────────────────────────────────────────────

def _get(endpoint: str, extra_params: dict | None = None) -> dict:
    """
    Central request helper — handles auth, retries, and all error cases.

    Raises:
        HTTPException 404  — resource not found on TMDB
        HTTPException 503  — network / timeout / connection reset
        HTTPException 502  — unexpected non-200 TMDB response
    """
    params = {"api_key": TMDB_API_KEY}
    if extra_params:
        params.update(extra_params)

    try:
        response = _session.get(
            f"{BASE_URL}{endpoint}",
            params=params,
            timeout=10,
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=503,
            detail=f"TMDB request timed out: {endpoint}",
        )
    except requests.ConnectionError as e:
        raise HTTPException(
            status_code=503,
            detail=f"TMDB connection error: {e}",
        )

    if response.status_code == 401:
        raise HTTPException(
            status_code=503,
            detail="Invalid TMDB API key — check your .env file.",
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail=f"Not found on TMDB: {endpoint}",
        )

    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"TMDB returned HTTP {response.status_code} for {endpoint}",
        )

    data = response.json()

    # TMDB sometimes returns 200 with an internal not-found code
    if data.get("status_code") == 34:
        raise HTTPException(
            status_code=404,
            detail=data.get("status_message", "Resource not found on TMDB"),
        )

    return data


def _poster_url(path: str | None, original: bool = False) -> str | None:
    """Build a full image URL from a TMDB path, or return None."""
    if not path:
        return None
    base = IMAGE_ORIG_URL if original else IMAGE_BASE_URL
    return f"{base}{path}"


# ── Public API ─────────────────────────────────────────────────────────────────

def search_movies(query: str) -> list[dict]:
    data = _get(
        "/search/movie",
        extra_params={
            "query": query,
            "include_adult": False,
            "language": "en-US",
        },
    )
    return data.get("results", [])


def get_movie_details(movie_id: int) -> dict:
    return _get(f"/movie/{movie_id}", extra_params={"language": "en-US"})


def get_movie_cast(movie_id: int) -> dict:
    return _get(f"/movie/{movie_id}/credits")


def get_movie_reviews(movie_id: int) -> list[dict]:

    all_reviews = []
    page        = 1

    while True:

        data = _get(
            f"/movie/{movie_id}/reviews",
            extra_params={
                "language": "en-US",
                "page":     page,
            }
        )

        results     = data.get("results", [])
        total_pages = data.get("total_pages", 1)

        all_reviews.extend(results)

        if page >= total_pages:
            break

        page += 1

    return all_reviews


def get_recommendations(movie_id: int) -> list[dict]:
    data = _get(f"/movie/{movie_id}/recommendations", extra_params={"language": "en-US"})
    return data.get("results", [])


def get_similar_movies(movie_id: int) -> list[dict]:
    data = _get(f"/movie/{movie_id}/similar", extra_params={"language": "en-US"})
    return data.get("results", [])


def get_trailers(movie_id: int) -> list[dict]:
    data = _get(f"/movie/{movie_id}/videos", extra_params={"language": "en-US"})
    return data.get("results", [])