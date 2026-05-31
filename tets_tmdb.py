import requests

url = "https://api.themoviedb.org/3/search/movie"

params = {
    "api_key": "98cee5eff08e61ed9d6ea76216051f04",
    "query": "dune"
}

response = requests.get(
    url,
    params=params,
    timeout=20,
    verify=False
)

print(response.status_code)
print(response.text[:500])