import re
import joblib
import numpy as np
from pathlib import Path

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

    svm_model = joblib.load(
        MODELS_DIR / "best_svm_sentiment.pkl"
    )

    log_model = joblib.load(
        MODELS_DIR / "log_model_sentiment.pkl"
    )

    vectorizer = joblib.load(
        MODELS_DIR / "tfidf_vectorizer_movie.pkl"
    )

    return svm_model, log_model, vectorizer


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
 