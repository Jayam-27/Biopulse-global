#!/usr/bin/env python3
"""
BioPulse Global - single entry point to refresh all data.

Runs fetch_news.py then fetch_markets.py in sequence.

Usage:
    pip install feedparser yfinance --break-system-packages
    python3 scripts/refresh_all.py
"""

import subprocess
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def run(script_name):
    path = os.path.join(SCRIPT_DIR, script_name)
    print(f"=== Running {script_name} ===")
    result = subprocess.run([sys.executable, path])
    if result.returncode != 0:
        print(f"!! {script_name} exited with code {result.returncode}")
    return result.returncode


def main():
    codes = [run("fetch_news.py"), run("fetch_markets.py")]
    if any(c != 0 for c in codes):
        print("Refresh finished with errors - check logs above.")
        sys.exit(1)
    print("Refresh complete: news, stocks, and commodities all updated.")


if __name__ == "__main__":
    main()
