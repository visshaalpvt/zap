#!/usr/bin/env python3
"""
diagnose_proxy_v3.py
--------------------
Dumps ALL ZAP traffic focusing on the target app and auth-related domains.
Handles binary bodies gracefully.

Usage:
    py scripts\diagnose_proxy_v3.py
"""

import sys
import io
from zapv2 import ZAPv2

# Force UTF-8 stdout to handle binary/unicode bodies
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

API_KEY = "changeme123"
API_URL = "http://localhost:8080"

# Domains of interest
TARGET_DOMAINS = ["codeforindia", "vercel.app"]
AUTH_DOMAINS = [
    "firebaseio.com", "firebase.googleapis.com", "firebaseapp.com",
    "identitytoolkit.googleapis.com", "securetoken.googleapis.com",
    "supabase.co", "auth0.com", "clerk.dev", "accounts.google.com",
]

# Chrome noise to skip in summary
NOISE_DOMAINS = [
    "update.googleapis.com", "safebrowsing.googleapis.com",
    "gvt1.com", "gvt2.com", "gstatic.com", "clientservices.googleapis.com",
    "clients2.google.com", "passwordsleakcheck",
    "content-autofill.googleapis.com",
]


def safe_print(text):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("utf-8", errors="replace").decode("utf-8"))


def is_interesting(url):
    url_lower = url.lower()
    return (
        any(d in url_lower for d in TARGET_DOMAINS)
        or any(d in url_lower for d in AUTH_DOMAINS)
    )


def is_noise(url):
    url_lower = url.lower()
    return any(d in url_lower for d in NOISE_DOMAINS)


def main():
    zap = ZAPv2(apikey=API_KEY, proxies={"http": API_URL, "https": API_URL})
    print(f"[+] Connected to ZAP {zap.core.version}\n")

    # Show sites
    sites = zap.core.sites
    print(f"[SITES] ZAP has seen {len(sites)} domains:")
    for s in sites:
        marker = ""
        if any(d in s.lower() for d in TARGET_DOMAINS):
            marker = " <-- YOUR APP"
        elif any(d in s.lower() for d in AUTH_DOMAINS):
            marker = " <-- AUTH PROVIDER"
        safe_print(f"    {s}{marker}")
    print()

    # Get all messages
    messages = zap.core.messages(start=0, count=500)
    print(f"[MESSAGES] Total: {len(messages)}\n")

    # Categorize
    interesting = []
    noise_count = 0

    print("[INTERESTING REQUESTS] (your app + auth domains):\n")
    for i, msg in enumerate(messages):
        req_header = msg.get("requestHeader", "")
        url = msg.get("url", "")
        lines = req_header.split("\r\n") if req_header else []
        method = lines[0].split(" ")[0] if lines else "?"

        if is_noise(url) and not is_interesting(url):
            noise_count += 1
            continue

        if is_interesting(url):
            interesting.append(msg)
            resp_header = msg.get("responseHeader", "")
            status = resp_header.split("\r\n")[0] if resp_header else "?"
            safe_print(f"  [{i+1:3d}] {method:8s} {url[:140]}")
            safe_print(f"         -> {status}")

    print(f"\n  (skipped {noise_count} Chrome internal requests)\n")

    # Full detail on interesting requests
    print(f"\n{'='*80}")
    print(f"[DETAIL] {len(interesting)} interesting requests")
    print(f"{'='*80}\n")

    for msg in interesting:
        req_header = msg.get("requestHeader", "")
        url = msg.get("url", "")
        lines = req_header.split("\r\n") if req_header else []
        method = lines[0].split(" ")[0] if lines else "?"

        safe_print("=" * 80)
        safe_print(f"{method} {url}")
        safe_print("-" * 80)
        safe_print("REQUEST HEADERS:")
        safe_print(req_header[:2000] if req_header else "(none)")
        safe_print("REQUEST BODY:")
        body = msg.get("requestBody", "")
        if body:
            # Try to print as text, replace binary
            safe_print(body[:3000])
        else:
            safe_print("(empty)")
        safe_print("-" * 80)
        resp_header = msg.get("responseHeader", "")
        safe_print("RESPONSE STATUS:")
        safe_print(resp_header.split("\r\n")[0] if resp_header else "(none)")
        resp_body = msg.get("responseBody", "")
        if resp_body:
            safe_print("RESPONSE BODY (first 500 chars):")
            safe_print(resp_body[:500])
        safe_print("=" * 80)
        safe_print("")


if __name__ == "__main__":
    main()
