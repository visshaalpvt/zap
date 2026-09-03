#!/usr/bin/env python3
"""
find_login_request.py
----------------------
After routing your browser through ZAP's proxy and logging in manually,
this pulls the captured HTTP history and prints every POST request so you
can spot the real login call (URL, headers, and body).

Usage:
    py scripts\\find_login_request.py https://codeforindia-beige.vercel.app
"""

import sys
from zapv2 import ZAPv2

API_KEY = "changeme123"
API_URL = "http://localhost:8080"


def main():
    if len(sys.argv) < 2:
        print("Usage: py find_login_request.py <base_url>")
        sys.exit(1)

    base_url = sys.argv[1]
    zap = ZAPv2(apikey=API_KEY, proxies={"http": API_URL, "https": API_URL})

    print(f"[+] Connected to ZAP {zap.core.version}")
    print(f"[+] Searching history for POST requests to {base_url} ...\n")

    messages = zap.core.messages(baseurl=base_url, start=0, count=500)

    found_any = False
    for msg in messages:
        method = msg.get("method", "")
        url = msg.get("url", "")
        if method != "POST":
            continue
        # skip obvious noise (static assets, analytics, etc.)
        if any(skip in url for skip in ["_next/static", ".js", ".css", ".png", ".ico"]):
            continue

        found_any = True
        print("=" * 80)
        print(f"POST {url}")
        print("-" * 80)
        print("REQUEST HEADER:")
        print(msg.get("requestHeader", "(none)"))
        print("REQUEST BODY:")
        print(msg.get("requestBody", "(none)"))
        print("=" * 80)
        print()

    if not found_any:
        print(
            "[!] No POST requests found. Possible reasons:\n"
            "    - Browser isn't actually routed through the ZAP proxy\n"
            "    - The certificate isn't trusted, so HTTPS requests are being blocked\n"
            "    - You haven't logged in yet in that browser window\n"
            "Try again after confirming the Chrome window opened with --proxy-server "
            "actually loaded the page (no certificate warning)."
        )


if __name__ == "__main__":
    main()