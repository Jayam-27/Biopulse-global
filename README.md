# BioPulse Global — Biotech Sector Tracker

A static website tracking global biotech sector news, with country-specific
sections and category filters, built in the visual style you referenced
(nothinglinear.in): dark theme, flag-based country tabs, card feed, pin/watch
system.

## What's here

- `index.html` / `styles.css` / `app.js` — the site itself. Pure static
  HTML/CSS/JS, no build step, no server required.
- `sources.html` / `sources.json` — the list of curated credible sources,
  shown on its own page.
- `data/news.json` — the auto-aggregated news feed (currently seeded with
  real, recent articles pulled from Endpoints News, plus two clearly-marked
  sample placeholders for China/India until you run the aggregator with
  normal internet access — see below).
- `data/manual.json` — your hand-picked articles. Empty for now; this is
  where links you send me get added.
- `scripts/fetch_news.py` — the aggregation script that pulls from RSS feeds
  in `sources.json`, tags each article by country/category, and rewrites
  `data/news.json`.
- `watchlist.json` — the list of stock/ETF and commodity tickers to track
  (Yahoo Finance symbol format). Edit this to add/remove what's tracked.
- `data/stocks.json` / `data/commodities.json` — the Markets tab data.
  Currently a **sample layout only** (`"live": false`, `price: null`) — see
  the Markets section below for why and how to get real prices.
- `scripts/fetch_markets.py` — pulls live prices for everything in
  `watchlist.json` via `yfinance`, writes `data/stocks.json` and
  `data/commodities.json`.

## How the site works

- Top nav: country tabs (Global, US, Europe, China, India, Japan) + theme
  toggle + refresh + "My Picks" (pinned items, saved locally in your browser).
- Left sidebar: category filters (Funding & M&A, Clinical Trials &
  Regulatory, Company News, Policy).
- Feed: combines `data/news.json` (auto) and `data/manual.json` (your picks,
  tagged "★ Hand-picked") into one sorted list, filterable by country/category.
- Click the ★ on any card to pin it to "My Picks" — this is saved in your
  browser's local storage, no backend needed.

## Adding your own articles (the simple way, as agreed)

Just send me a link in chat and tell me the country/category if relevant.
I'll add an entry like this to `data/manual.json` and the site will pick it
up automatically next time it's opened (no rebuild step needed since it's
just a JSON fetch):

```json
{
  "id": "manual-2026-07-17-01",
  "title": "Article title",
  "url": "https://...",
  "source": "Publication name",
  "date": "2026-07-17",
  "country": "US",
  "category": "Funding & M&A",
  "summary": "One or two lines.",
  "pinned": true
}
```

## Running the aggregator (important — read this)

`scripts/fetch_news.py` uses `feedparser` to pull from the RSS feeds listed
in `sources.json`, tags each item's country/category by keyword matching,
and writes `data/news.json`.

**It will not run inside this Cowork sandbox** — this environment restricts
outbound network requests to a small allowlist, and none of the news sites'
domains are on it (confirmed: direct requests to Endpoints/Fierce/BioPharma
Dive/etc. all get blocked with a 403 from the sandbox's network proxy). This
isn't a bug in the script — it's a sandboxing limitation of where I'm running
right now.

To actually run it, use any environment with normal internet access:

1. **Your own computer** (simplest): install Python 3, then:
   ```
   pip install feedparser --break-system-packages
   python3 scripts/fetch_news.py
   ```
   Re-run this whenever you want fresh news (daily is reasonable).

2. **Automated, free**: a GitHub Actions workflow that runs
   `fetch_news.py` on a schedule (e.g. every 6 hours) and commits the
   updated `data/news.json` back to the repo. I can write this workflow
   file for you if you host the site on GitHub Pages.

3. **A cheap always-on box**: a small VPS or Raspberry Pi with a cron job
   calling the script daily.

## Markets tab (stocks + raw materials)

New "📈 Markets" tab next to News, with two views (switch via the sidebar
chips):

- **Stocks & ETFs** — 25 default tickers: major biotech/pharma names and
  ETFs across US, Europe, China, India and Japan (Moderna, Regeneron,
  Vertex, Gilead, Lilly, Pfizer, J&J, Biogen, Novartis, AstraZeneca, Roche,
  GSK, Sanofi, Sun Pharma, Dr. Reddy's, Cipla, Eisai, Takeda, Chugai, CSPC,
  Sino Biopharm, Fosun Pharma, plus XBI/IBB/ARKG). Filterable by the country
  tabs, same as News.
- **Raw Materials** — commodities with broad exposure to biotech/pharma
  manufacturing and input costs: crude oil, natural gas, corn, soybeans,
  wheat, copper, sugar.
- **Add a ticker** — type any symbol (Yahoo Finance format, e.g. `AAPL`,
  `ROG.SW`, `4502.T`, `SUNPHARMA.NS`) and it's saved to your browser. To
  actually get it tracked with real prices, send me the symbol in chat and
  I'll add it to `watchlist.json` — or add it yourself and re-run the script.

**Important — prices are not live right now.** I seeded `data/stocks.json`
and `data/commodities.json` with the full ticker list but `price: null` and
`"live": false` 