#!/usr/bin/env python3
"""Simple HTTP server to serve the single-file VereinsKalender bundle."""
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000
DIST_DIR = Path(__file__).parent / "packages" / "web" / "dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

if __name__ == "__main__":
    os.chdir(DIST_DIR)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"🚀 Serving VereinsKalender at {url}")
        print(f"📁 Directory: {DIST_DIR}")
        print(f"Press Ctrl+C to stop\n")

        try:
            webbrowser.open(url)
        except:
            pass

        httpd.serve_forever()
