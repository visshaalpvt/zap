#!/usr/bin/env python3
"""
diagnose_proxy.py
-----------------
Dumps EVERYTHING ZAP has captured — all sites, all messages, no filtering.
Use this to verify whether the proxied browser traffic is actually reaching ZAP.

Usage:
    py scripts\diagnose_proxy.py
"""

from zapv2 import ZAPv2

API_KEY = "changeme123"
API_URL = "http://localhost:8080"


def main():
    zap = ZAPv2(apikey=API_KEY, proxies={"http": API_URL, "https": API_URL})
    print(f"[+] Connected to ZAP {zap.core.version}\n")

    # 1. List every site/domain ZAP knows about
    sites = zap.core.sites
    print(f"[1] Sites ZAP has seen ({len(sites)} total):")
    if not sites:
        print("    (none — ZAP has captured ZERO traffic)")
    for s in sites:
        print(f"    • {s}")
    print()

    # 2. Dump ALL messages (first 200), no baseurl filter
    messages = zap.core.messages(start=0, count=200)
    print(f"[2] Total messages in history: {len(messages)}")
    print()

    # 3. Show summary of each message: method, URL, status, content-type
    post_messages = []
    for i, msg in enumerate(messages):
        method = msg.get("method", "?")
        url = msg.get("url", "?")
        status_code = msg.get("responseHeader", "").split(" ")[1] if len(msg.get("responseHeader", "").split(" ")) > 1 else "?"
        
        # Brief one-liner for every request
        print(f"    [{i+1:3d}] {method:6s} {status_code:>4s}  {url[:120]}")
        
        if method == "POST":
            post_messages.append(msg)

    print()

    # 4. Detail on POST requests specifically (the login is in here somewhere)
    print(f"[3] POST requests found: {len(post_messages)}")
    for msg in post_messages:
        url = msg.get("url", "?")
        print()
        print("=" * 80)
        print(f"POST {url}")
        print("-" * 80)
        print("REQUEST HEADERS:")
        print(msg.get("requestHeader", "(none)"))
        print("REQUEST BODY:")
        body = msg.get("requestBody", "(none)")
        print(body[:2000] if body else "(empty)")
        print("-" * 80)
        print("RESPONSE STATUS:")
        resp_header = msg.get("responseHeader", "")
        # Just the first line (status)
        print(resp_header.split("\r\n")[0] if resp_header else "(none)")
        print("=" * 80)

    if not messages:
        print(
            "\n[!] ZAP captured NOTHING. This means:\n"
            "    - The Chrome window didn't actually use the proxy, OR\n"
            "    - Chrome launched but the --proxy-server flag wasn't applied\n"
            "      (happens if Chrome was already running when you ran the command)\n"
            "\n"
            "    FIX: Close ALL Chrome windows first, then re-run the\n"
            "    chrome.exe --proxy-server command."
        )
    elif not post_messages:
        print(
            "\n[!] ZAP saw traffic but NO POST requests. This means:\n"
            "    - The login might use a third-party auth service on a different domain\n"
            "    - Check the sites list above for domains like *.supabase.co,\n"
            "      *.firebaseapp.com, *.clerk.dev, *.auth0.com, etc."
        )


if __name__ == "__main__":
    main()
