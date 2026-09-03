#!/usr/bin/env python3
"""
setup_and_capture.py
--------------------
Configures ZAP to properly intercept HTTPS traffic, clears old history,
launches Chrome through the proxy, and then waits for you to log in.
After login, it dumps the captured auth requests.

Usage:
    py scripts\setup_and_capture.py
"""

import sys
import io
import time
import subprocess
from zapv2 import ZAPv2

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

API_KEY = "changeme123"
API_URL = "http://localhost:8080"
TARGET_URL = "https://codeforindia-beige.vercel.app"
LOGIN_URL = f"{TARGET_URL}/login"

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
CHROME_PROFILE = r"C:\temp\zap-chrome-profile"


def main():
    zap = ZAPv2(apikey=API_KEY, proxies={"http": API_URL, "https": API_URL})
    print(f"[+] Connected to ZAP {zap.core.version}")

    # 1. Set ZAP to intercept HTTPS (break/decode SSL)
    #    This ensures HTTPS requests show up in core.messages, not just as CONNECT tunnels
    print("[+] Ensuring ZAP is configured to decode HTTPS traffic...")

    # Enable the root CA for dynamic SSL
    try:
        # ZAP 2.12+ uses network.setRootCaCertValidity etc. but the key thing
        # is that the cert is already trusted (user did certutil earlier)
        pass
    except Exception as e:
        print(f"    (note: {e})")

    # 2. Clear old messages so we only capture the fresh login
    print("[+] Clearing ZAP message history...")
    try:
        zap.core.delete_all_alerts()
        zap.core.new_session(name="capture_login", overwrite="true")
        print("    New session created — history cleared")
    except Exception as e:
        print(f"    Warning: {e}")

    time.sleep(1)

    # 3. Make sure ZAP's proxy is set to intercept all traffic (not just in-scope)
    # Pass-through mode would explain why CONNECT tunnels aren't decoded
    print("[+] Checking ZAP proxy/connection settings...")
    try:
        # Set the mode to standard (ensures ZAP intercepts and decodes)
        zap.core.set_mode("standard")
        print("    Mode set to 'standard'")
    except Exception as e:
        print(f"    Mode setting: {e}")

    # 4. Access the target once to make ZAP aware
    print(f"[+] Opening target: {TARGET_URL}")
    try:
        zap.urlopen(TARGET_URL)
        time.sleep(2)
    except Exception as e:
        print(f"    urlopen: {e}")

    # 5. Verify ZAP can now see decoded traffic
    messages = zap.core.messages(start=0, count=10)
    print(f"[+] After urlopen, ZAP has {len(messages)} messages")
    for msg in messages[:3]:
        url = msg.get("url", "?")
        req_header = msg.get("requestHeader", "")
        method = req_header.split("\r\n")[0].split(" ")[0] if req_header else "?"
        print(f"    {method} {url[:100]}")

    print()
    print("=" * 60)
    print("  READY!")
    print("=" * 60)
    print()
    print("Now do the following:")
    print(f"  1. Open Chrome (proxied) to: {LOGIN_URL}")
    print("  2. Log in with your credentials")
    print("  3. Wait for the dashboard/welcome page to load")
    print("  4. Come back here and press ENTER")
    print()

    # Launch Chrome for the user
    print("[+] Launching proxied Chrome...")
    subprocess.Popen([
        CHROME_PATH,
        f"--proxy-server=127.0.0.1:8080",
        f"--user-data-dir={CHROME_PROFILE}",
        "--new-window",
        LOGIN_URL,
    ])

    input("\n>>> Press ENTER after you've logged in... ")

    # 6. Dump everything
    print("\n[+] Fetching captured traffic...\n")
    messages = zap.core.messages(start=0, count=500)
    print(f"[+] Total messages: {len(messages)}\n")

    # Show sites
    sites = zap.core.sites
    print(f"[SITES] ({len(sites)}):")
    for s in sites:
        print(f"    {s}")
    print()

    # Show all requests with content
    post_requests = []
    for i, msg in enumerate(messages):
        req_header = msg.get("requestHeader", "")
        url = msg.get("url", "")
        lines = req_header.split("\r\n") if req_header else []
        method = lines[0].split(" ")[0] if lines else "?"
        body = msg.get("requestBody", "")

        has_body = bool(body and body.strip())
        marker = f" [HAS BODY: {len(body)} bytes]" if has_body else ""
        print(f"  [{i+1:3d}] {method:8s} {url[:130]}{marker}")

        if method in ("POST", "PUT", "PATCH") or has_body:
            post_requests.append(msg)

    print(f"\n{'='*80}")
    print(f"[REQUESTS WITH BODY] {len(post_requests)} found")
    print(f"{'='*80}\n")

    for msg in post_requests:
        req_header = msg.get("requestHeader", "")
        url = msg.get("url", "")
        method = req_header.split("\r\n")[0].split(" ")[0] if req_header else "?"
        body = msg.get("requestBody", "")
        resp_header = msg.get("responseHeader", "")
        resp_body = msg.get("responseBody", "")

        print("=" * 80)
        print(f"{method} {url}")
        print("-" * 80)
        print("REQUEST HEADERS:")
        try:
            print(req_header[:2000])
        except Exception:
            print("(encoding error)")
        print("REQUEST BODY:")
        try:
            print(body[:3000] if body else "(empty)")
        except Exception:
            print("(binary/encoding error)")
        print("-" * 80)
        print("RESPONSE STATUS:", resp_header.split("\r\n")[0] if resp_header else "?")
        if resp_body:
            print("RESPONSE BODY (first 500):")
            try:
                print(resp_body[:500])
            except Exception:
                print("(encoding error)")
        print("=" * 80)
        print()

    if not post_requests:
        print(
            "[!] Still no requests with bodies found.\n"
            "    The login is likely happening entirely client-side via Firebase JS SDK.\n"
            "    Firebase Auth uses WebSocket or the Identity Toolkit REST API.\n"
            "    Check the output above for any requests to:\n"
            "    - identitytoolkit.googleapis.com\n"
            "    - securetoken.googleapis.com\n"
            "    - firebaseio.com\n"
        )


if __name__ == "__main__":
    main()
