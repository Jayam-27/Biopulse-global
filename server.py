#!/usr/bin/env python3
"""
BioPulse Global — web server for Replit (or any host).

Serves this folder's static files (index.html, styles.css, app.js, data/*.json)
over HTTP. Reads files live from disk on every request, so it always reflects
whatever fetch_news.py / fetch_markets.py most recently wrote — no rebuild or
redeploy needed after a data refresh.

Listens on $PORT if set (Replit provides this for Autoscale/Reserved VM
deployments), otherwise defaults to 8000 for local use.
"""

import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", 8000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Avoid caching stale JSON data files in the browser
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"BioPulse Global serving {DIRECTORY} on 0.0.0.0:{PORT}")
        httpd.serve_forever()
