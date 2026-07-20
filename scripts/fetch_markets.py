#!/usr/bin/env python3
"""
BioPulse Global - markets aggregation script.

Pulls the latest price + % change for every ticker listed in
../watchlist.json using yfinance, and writes ../data/stocks.json and
../data/commodities.json.

Usage:
    pip install yfinance --break-system-packages
    python3 fetch_markets.py
"""

import json
import datetime
import os
import sys

try:
    import yfinance as yf
except ImportError:
    print("Missing dependency. Run: pip install yfinance --break-system-packages")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WATCHLIST_PATH = os.path.join(BASE_DIR, "watchlist.json")
STOCKS_PATH = os.path.join(BASE_DIR, "data", "stocks.json")
COMMODITIES_PATH = os.path.join(BASE_DIR, "data", "commodities.json")


def fetch_quote(symbol):
    try:
        t = yf.Ticker(symbol)
        info = t.fast_info
        price = getattr(info, "last_price", None)
        prev_close = getattr(info, "previous_close", None)
        currency = getattr(info, "currency", "USD")
        if price is None:
            return None
        return price, prev_close, currency
    except Exception as e:
        print(f"  ! failed to fetch {symbol}: {e}")
        return None


def build_entries(items, is_commodity=False):
    today = datetime.date.today().isoformat()
    results = []
    for item in items:
        symbol = item["symbol"]
        print(f"- {symbol}")
        quote = fetch_quote(symbol)
        entry = {
            "symbol": symbol,
            "name": item["name"],
            "date": today,
            "live": False,
        }
        if not is_commodity:
            entry["country"] = item.get("country", "Global")
            entry["type"] = item.get("type", "stock")
        else:
            entry["unit"] = item.get("unit", "")

        if quote:
            price, prev_close, currency = quote
            change_pct = None
            if prev_close:
                change_pct = round((price - prev_close) / prev_close * 100, 2)
            entry.update({
                "price": round(price, 2),
                "currency": currency,
                "change_pct": change_pct,
                "live": True,
            })
        else:
            entry.update({
                "price": None,
                "currency": None,
                "change_pct": None,
            })
        results.append(entry)
    return results


def main():
    with open(WATCHLIST_PATH) as f:
        watchlist = json.load(f)

    print(f"Fetching {len(watchlist['stocks'])} stocks/ETFs...")
    stocks = build_entries(watchlist["stocks"], is_commodity=False)

    print(f"Fetching {len(watchlist['commodities'])} commodities...")
    commodities = build_entries(watchlist["commodities"], is_commodity=True)

    os.makedirs(os.path.dirname(STOCKS_PATH), exist_ok=True)
    with open(STOCKS_PATH, "w") as f:
        json.dump(stocks, f, indent=2)
    with open(COMMODITIES_PATH, "w") as f:
        json.dump(commodities, f, indent=2)

    ok_stocks = sum(1 for s in stocks if s["live"])
    ok_commodities = sum(1 for c in commodities if c["live"])
    print(f"Wrote {ok_stocks}/{len(stocks)} live stock quotes to {STOCKS_PATH}")
    print(f"Wrote {ok_commodities}/{len(commodities)} live commodity quotes to {COMMODITIES_PATH}")


if __name__ == "__main__":
    main()
