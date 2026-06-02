import re
import joblib
import numpy as np
from pathlib import Path
from typing import Any

import nltk
nltk.download("stopwords", quiet=True)
from nltk.corpus import stopwords

stopwords_list = set(stopwords.words("english"))

TAG_RE = re.compile(r"<[^>]+>")

POSITIVE_KEYWORDS = {
    "amazing", "brilliant", "excellent", "fantastic",
    "great", "outstanding", "superb", "masterpiece",
    "wonderful", "incredible", "stunning", "powerful",
    "beautiful", "perfect", "loved", "best"
}

NEGATIVE_KEYWORDS = {
    "terrible", "awful", "horrible", "worst",
    "bad", "boring", "disappointing", "waste",
    "poor", "dull", "mediocre", "weak"
}

pattern = re.compile(
    r"\b(" + r"|".join(stopwords_list) + r")\b\s*"
)

MODEL_SPECS = [
    {
        "id": "svm",
        "name": "SVM",
        "description": "Support Vector Machine classifier",
        "version": "1.0.0",
        "default": False,
        "kind": "sklearn",
        "model_file": "best_svm_sentiment.pkl",
        "vectorizer_file": "tfidf_vectorizer_movie.pkl",
    },
    {
        "id": "log",
        "name": "Logistic Regression",
        "description": "Logistic Regression classifier",
        "version": "1.0.0",
        "default": False,
        "kind": "sklearn",
        "model_file": "log_model_sentiment.pkl",
        "vectorizer_file": "tfidf_vectorizer_movie.pkl",
    },
    {
        "id": "svm_v2",
        "name": "Optimized SVM",
        "description": "Optimized SVM trained with the v2 negation-aware TF-IDF features",
        "version": "2.0.0",
        "default": True,
        "kind": "sklearn",
        "model_file": "optimized_svm_sentiment_v2.pkl",
        "vectorizer_file": "tfidf_vectorizer_negation_v2.pkl",
    },
    {
        "id": "log_v2",
        "name": "Logistic Regression v2",
        "description": "v2 logistic regression trained with the negation-aware TF-IDF vectorizer",
        "version": "2.0.0",
        "default": False,
        "kind": "sklearn",
        "model_file": "logistic_regression_sentiment_v2.pkl",
        "vectorizer_file": "tfidf_vectorizer_negation_v2.pkl",
    },
    {
        "id": "sgd_v2",
        "name": "SGD Classifier v2",
        "description": "v2 linear classifier trained with the negation-aware TF-IDF vectorizer",
        "version": "2.0.0",
        "default": False,
        "kind": "sklearn",
        "model_file": "sgd_sentiment_v2.pkl",
        "vectorizer_file": "tfidf_vectorizer_negation_v2.pkl",
    },
]

def remove_tags(text):
    return TAG_RE.sub("", text)


def preprocess_text(sentence):

    sentence = sentence.lower()

    sentence = remove_tags(sentence)

    sentence = re.sub(r"[^a-zA-Z]", " ", sentence)

    sentence = re.sub(r"\s+[a-zA-Z]\s+", " ", sentence)

    sentence = re.sub(r"\s+", " ", sentence)

    sentence = pattern.sub("", sentence)

    return sentence.strip()


def get_influential_terms(text, sentiment):

    words = set(text.lower().split())

    if sentiment == "positive":
        return list(words & POSITIVE_KEYWORDS)[:3]

    if sentiment == "negative":
        return list(words & NEGATIVE_KEYWORDS)[:3]

    return []


def load_models():

    BASE_DIR = Path(__file__).resolve().parent.parent

    MODELS_DIR = BASE_DIR / "models"

    model_bundles: dict[str, dict[str, Any]] = {}
    catalog: list[dict[str, Any]] = []

    for spec in MODEL_SPECS:
        entry = {
            "id": spec["id"],
            "name": spec["name"],
            "description": spec["description"],
            "version": spec["version"],
            "default": spec["default"],
        }

        try:
            model_bundles[spec["id"]] = {
                "model": joblib.load(MODELS_DIR / spec["model_file"]),
                "vectorizer": joblib.load(MODELS_DIR / spec["vectorizer_file"]),
            }
            entry["available"] = True
        except Exception as exc:
            entry["available"] = False
            entry["unavailable_reason"] = str(exc)

        catalog.append(entry)

    return model_bundles, catalog


def predict_sentiment(text, model, vectorizer):

    cleaned_text = preprocess_text(text)

    vector = vectorizer.transform([cleaned_text])

    prediction = model.predict(vector)[0]

    sentiment = (
        "Positive"
        if prediction == 1
        else "Negative"
    )

    if hasattr(model, "predict_proba"):

        confidence = (
            model.predict_proba(vector)
            .max()
            * 100
        )

    else:

        score = model.decision_function(vector)[0]

        confidence = (
            1 / (1 + np.exp(-abs(score)))
        ) * 100

    terms = get_influential_terms(
        text,
        sentiment.lower()
    )

    return {
        "prediction": sentiment,
        "confidence": round(float(confidence), 2),
        "keywords": terms
    }

def analyze_reviews(reviews, model, vectorizer):
 
    results = []
    counts  = {"Positive": 0, "Negative": 0}
 
    for review in reviews:
 
        content = review.get("content", "").strip()
 
        if not content:
            continue
 
        analysis  = predict_sentiment(content, model, vectorizer)
        sentiment = analysis["prediction"]
 
        counts[sentiment] = counts.get(sentiment, 0) + 1
 
        results.append({
            "author":     review.get("author", "anonymous"),
            "created_at": review.get("created_at", ""),
            "content":    content,
            "prediction": sentiment,
            "confidence": analysis["confidence"],
            "keywords":   analysis["keywords"],
        })
 
    total = len(results) or 1
 
    return {
        "total":        len(results),
        "positive":     counts["Positive"],
        "negative":     counts["Negative"],
        "positive_pct": round(counts["Positive"] / total * 100, 1),
        "negative_pct": round(counts["Negative"] / total * 100, 1),
        "reviews":      results,
    }
 