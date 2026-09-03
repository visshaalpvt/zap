#!/usr/bin/env python3
"""
diagnose_proxy_v2.py
--------------------
Dumps ALL ZAP-captured traffic with full URL details, specifically looking
for Firebase/Supabase/third-party auth requests.

Usage:
    py scripts\diagnose_proxy_v2.py
"""

from zapv2 import ZAPv2

API_KEY = "changeme123"
API_URL = "http://localhost:8080"

# Domains that indicate third-party auth
AUTH_DOMAINS = [
    "firebaseio.com", "firebase.googleapis.com", "firebaseapp.com",
    "identitytoolkit.googleapis.com", "securetoken.googleapis.com",
    "supabase.co", "auth0.com", "clerk.dev", "accounts.google.com",
]


def main():
    zap = ZAPv2(apikey=API_KEY, proxies={"http": API_URL, "https": API_URL})
    print(f"[+] Connected to ZAP {zap.core.version}\n")

    messages = zap.core.messages(start=0, count=500)
    print(f"[+] Total messages captured: {len(messages)}\n")

    auth_related = []
    all_posts = []

    for i, msg in enumerate(messages):
        # Extract method and URL from the request header itself
        req_header = msg.get("requestHeader", "")
        url = msg.get("url", "")
        
        # Parse method from request header (first word of first line)
        lines = req_header.split("\r\n") if req_header else []
        method = lines[0].split(" ")[0] if lines else "?"
        
        # Check if this is auth-related
        is_auth = any(domain in url.lower() for domain in AUTH_DOMAINS)
        is_post = method in ("POST", "PUT", "PATCH")
        
        if is_auth:
            auth_related.append(msg)
        if is_post:
            all_posts.append(msg)

        # Print every request with URL
        marker = " *** AUTH ***" if is_auth else ""
        marker += " [POST]" if is_post else ""
        print(f"  [{i+1:3d}] {method:8s} {url[:140]}{marker}")

    print(f"\n{'='*80}")
    print(f"[SUMMARY]")
    print(f"  Total requests: {len(messages)}")
    print(f"  POST/PUT/PATCH: {len(all_posts)}")
    print(f"  Auth-related:   {len(auth_related)}")
    print(f"{'='*80}\n")

    # Detail on ALL POST requests
    if all_posts:
        print(f"[ALL POST REQUESTS - {len(all_posts)} total]\n")
        for msg in all_posts:
            url = msg.get("url", "?")
            print("=" * 80)
            print(f"URL: {url}")
            print("-" * 80)
            print("REQUEST HEADERS:")
            print(msg.get("requestHeader", "(none)"))
            print("REQUEST BODY:")
            body = msg.get("requestBody", "")
            print(body[:3000] if body else "(empty)")
            print("-" * 80)
            resp_header = msg.get("responseHeader", "")
            print("RESPONSE (first line):")
            print(resp_header.split("\r\n")[0] if resp_header else "(none)")
            print("RESPONSE BODY (first 500 chars):")
            resp_body = msg.get("responseBody", "")
            print(resp_body[:500] if resp_body else "(empty)")
            print("=" * 80)
            print()

    # Detail on auth-related requests (even if GET)
    if auth_related:
        print(f"\n[AUTH-RELATED REQUESTS - {len(auth_related)} total]\n")
        for msg in auth_related:
            url = msg.get("url", "?")
            req_header = msg.get("requestHeader", "")
            method = req_header.split("\r\n")[0].split(" ")[0] if req_header else "?"
            print("=" * 80)
            print(f"{method} {url}")
            print("-" * 80)
            print("REQUEST BODY:")
            body = msg.get("requestBody", "")
            print(body[:3000] if body else "(empty)")
            print("-" * 80)
            print("RESPONSE (first line):")
            resp_header = msg.get("responseHeader", "")
            print(resp_header.split("\r\n")[0] if resp_header else "(none)")
            print("RESPONSE BODY (first 500 chars):")
            resp_body = msg.get("responseBody", "")
            print(resp_body[:500] if resp_body else "(empty)")
            print("=" * 80)
            print()
    else:
        print(
            "\n[!] No requests to known auth domains found.\n"
            "    The login might use a custom API on the app's own domain,\n"
            "    or it could be using a provider not in our detection list.\n"
            "    Check the POST requests above for the actual login call."
        )


if __name__ == "__main__":
    main()
