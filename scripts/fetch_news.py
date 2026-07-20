#!/usr/bin/env python3
"""
BioPulse Global - news aggregation script.

Fetches RSS feeds from curated biotech/pharma sources (see ../sources.json),
tags each article by country and category using keyword matching, and writes
the result to ../data/news.json.

Usage:
    pip install feedparser --break-system-packages
    python3 fetch_news.py
"""

import json
import hashlib
import datetime
import os
import sys

try:
    import feedparser
except ImportError:
    print("Missing dependency. Run: pip install feedparser --break-system-packages")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES_PATH = os.path.join(BASE_DIR, "sources.json")
NEWS_PATH = os.path.join(BASE_DIR, "data", "news.json")

MAX_ITEMS_PER_FEED = 15

COUNTRY_KEYWORDS = {
    "China": ["china", "chinese", "shanghai", "beijing", "hong kong", "shenzhen"],
    "Japan": ["japan", "japanese", "tokyo", "osaka"],
    "India": ["india", "indian", "mumbai", "bengaluru", "hyderabad", "delhi"],
    "Europe": [
        "europe", "european", "eu ", "ema", "uk", "britain", "london",
        "germany", "german", "switzerland", "swiss", "france", "french",
        "netherlands", "dutch", "spain", "italy", "denmark", "sweden"
    ],
    "US": [
        "u.s.", "us ", "usa", "america", "fda", "washington", "boston",
        "california", "new jersey", "san diego", "san francisco"
    ],
}

CATEGORY_KEYWORDS = {
    "Funding & M&A": [
        "raises", "funding", "series a", "series b", "series c", "round",
        "acqui", "merger", "buyout", "ipo", "licensing deal", "acquisition",
        "invest", "valuation", "venture"
    ],
    "Clinical Trials & Regulatory": [
        "fda", "ema", "phase 1", "phase 2", "phase 3", "clinical trial",
        "approval", "approves", "rejects", "crl", "complete response letter",
        "regulatory", "trial data", "pivotal"
    ],
    "Policy": [
        "policy", "regulation", "law", "government", "incentive", "mission",
        "tariff", "pricing reform", "subsidy", "legislation"
    ],
}
DEFAULT_CATEGORY = "Company News"
DEFAULT_COUNTRY = "Global"


def make_id(url):
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def tag_country(text):
    text_l = text.lower()
    for country, keywords in COUNTRY_KEYWORDS.items():
        if any(kw in text_l for kw in keywords):
            return country
    return DEFAULT_COUNTRY


def tag_category(text):
    text_l = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_l for kw in keywords):
            return category
    return DEFAULT_CATEGORY


def parse_date(entry):
    for field in ("published_parsed", "updated_parsed"):
        val = getattr(entry, field, None)
        if val:
            return datetime.date(*val[:3]).isoformat()
    return datetime.date.today().isoformat()


def fetch_source(source):
    items = []
    try:
        parsed = feedparser.parse(source["rss"])
    except Exception as e:
        print(f"  ! failed to fetch {source['name']}: {e}")
        return items

    if parsed.bozo and not parsed.entries:
        print(f"  ! could not parse feed for {source['name']} ({source['rss']})")
        return items

    for entry in parsed.entries[:MAX_ITEMS_PER_FEED]:
        title = getattr(entry, "title", "").strip()
        link = getattr(entry, "link", "").strip()
        summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
        summary = summary.strip()[:280]
        if not title or not link:
            continue

        combined_text = f"{title} {summary}"
        country = source.get("region") if source.get("region") in COUNTRY_KEYWORDS or source.get("region") == "Global" else None
        country = country or tag_country(combined_text)
        category = tag_category(combined_text)

        items.append({
            "id": make_id(link),
            "title": title,
            "url": link,
            "source": source["name"],
            "date": parse_date(entry),
            "country": country,
            "category": category,
            "summary": summary,
            "pinned": False,
        })
    return items


def main():
    with open(SOURCES_PATH) as f:
        sources = json.load(f)

    all_items = []
    print(f"Fetching {len(sources)} sources...")
    for source in sources:
        print(f"- {source['name']}")
        all_items.extend(fetch_source(source))

    dedup = {}
    for item in all_items:
        dedup[item["id"]] = item
    result = list(dedup.values())
    result.sort(key=lambda x: x["date"], reverse=True)

    os.makedirs(os.path.dirname(NEWS_PATH), exist_ok=True)
    with open(NEWS_PATH, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Wrote {len(result)} items to {NEWS_PATH}")


if __name__ == "__main__":
    main()
