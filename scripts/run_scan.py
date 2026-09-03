#!/usr/bin/env python3
"""
run_scan.py
-----------
Drives an OWASP ZAP daemon to run an AUTHENTICATED scan of a web app
and writes an HTML report.

Two ways to run it:

  1) INTERACTIVE (just answer the prompts, nothing to edit beforehand):
        python scripts/run_scan.py

  2) CONFIG FILE (for repeat/automated runs):
        python scripts/run_scan.py --config config/scan_config.yaml

Only run this against targets you own or are explicitly authorized to test.
"""

import argparse
import getpass
import re
import sys
import time
import os

import yaml
from zapv2 import ZAPv2


def load_config(path):
    with open(path, "r") as f:
        cfg = yaml.safe_load(f)

    if "target_url" in cfg and "target" not in cfg:
        t_url = cfg["target_url"]
        cfg["target"] = {
            "url": t_url,
            "context_name": f"Scan_{int(time.time())}",
            "include_regex": f"{re.escape(t_url.rstrip('/'))}.*",
        }
        cfg["auth"] = cfg.get("login") if cfg.get("login", {}).get("enabled") else None
        cfg["zap"] = cfg.get("zap", {})
        cfg["scan"] = {
            "spider": True,
            "ajax_spider": cfg.get("options", {}).get("ajax_spider", False),
            "active_scan": cfg.get("options", {}).get("active_scan", True),
        }
        cfg["report"] = {
            "output_dir": "reports",
            "filename": cfg.get("zap", {}).get("report_filename", "zap_report.html"),
        }
    elif "target" in cfg:
        if "context_name" in cfg["target"]:
            cfg["target"]["context_name"] = f"{cfg['target']['context_name']}_{int(time.time())}"

    return cfg


def ask(prompt, default=None):
    suffix = f" [{default}]" if default else ""
    val = input(f"{prompt}{suffix}: ").strip()
    return val or default


def build_config_interactively():
    """Ask the user everything on the CLI and build the same config dict
    that would normally come from scan_config.yaml."""
    print("=== ZAP Scan Setup ===\n")

    target_url = ask("Target URL to scan (e.g. https://example.com)")
    while not target_url:
        target_url = ask("Target URL is required. Enter it")

    # derive a safe include-regex (same domain, anything under it)
    domain_escaped = re.escape(target_url.rstrip("/"))
    include_regex = f"{domain_escaped}.*"

    needs_login = ask("Does this scan need to log in first? (y/n)", "y")
    auth = {}
    if needs_login.lower().startswith("y"):
        auth["login_url"] = ask("Login page URL", target_url.rstrip("/") + "/login")
        auth["username_field"] = ask(
            "Login form's username field name (check the HTML input's 'name=')",
            "username",
        )
        auth["password_field"] = ask(
            "Login form's password field name", "password"
        )
        auth["username"] = ask("Username")
        auth["password"] = getpass.getpass("Password (hidden): ")
        auth["logged_in_indicator"] = ask(
            "Text that ONLY appears when logged in (e.g. 'Logout')", "Logout"
        )
        auth["logged_out_indicator"] = ask(
            "Text that appears when logged OUT (optional, press enter to skip)", ""
        ) or None
    else:
        auth = None

    ajax = ask("Site is a JS-heavy SPA (React/Vue/Angular)? (y/n)", "n")
    active = ask("Run active scan (actual vulnerability attacks)? (y/n)", "y")

    api_key = ask("ZAP API key (must match docker-compose.yml)", "changeme123")
    api_url = ask("ZAP API URL", "http://localhost:8080")

    report_name = ask("Report filename", "zap_report.html")

    cfg = {
        "target": {
            "url": target_url,
            "context_name": f"CLIContext_{int(time.time())}",
            "include_regex": include_regex,
        },
        "auth": auth,
        "zap": {"api_key": api_key, "api_url": api_url},
        "scan": {
            "spider": True,
            "ajax_spider": ajax.lower().startswith("y"),
            "active_scan": active.lower().startswith("y"),
        },
        "report": {"output_dir": "reports", "filename": report_name},
    }
    print("\n=== Starting scan with the above settings ===\n")
    return cfg


def connect_zap(cfg):
    api_key = cfg["zap"]["api_key"]
    api_url = cfg["zap"]["api_url"]
    zap = ZAPv2(apikey=api_key, proxies={"http": api_url, "https": api_url})
    # sanity check
    print(f"[+] Connected to ZAP {zap.core.version}")
    return zap


def setup_context_and_auth(zap, cfg):
    target = cfg["target"]
    auth = cfg.get("auth")

    context_name = target["context_name"]
    context_id = zap.context.new_context(context_name)
    if not str(context_id).isdigit():
        print(
            f"[!] ZAP did not return a valid context id (got: {context_id!r}). "
            "This usually means a context with that name already exists. "
            "Try restarting the ZAP container: docker compose restart"
        )
        sys.exit(1)
    zap.context.include_in_context(context_name, target["include_regex"])
    print(f"[+] Created context '{context_name}' (id={context_id})")

    if not auth:
        print("[+] No login configured — scanning unauthenticated")
        return context_id, None

    # --- Form-based authentication ---
    login_url = auth["login_url"]
    login_request_data = (
        f"{auth['username_field']}={{%username%}}&"
        f"{auth['password_field']}={{%password%}}"
    )

    zap.authentication.set_authentication_method(
        contextid=context_id,
        authmethodname="formBasedAuthentication",
        authmethodconfigparams=(
            f"loginUrl={login_url}&loginRequestData={login_request_data}"
        ),
    )

    # Tell ZAP how to detect logged-in vs logged-out state
    zap.authentication.set_logged_in_indicator(
        context_id, auth["logged_in_indicator"]
    )
    if auth.get("logged_out_indicator"):
        zap.authentication.set_logged_out_indicator(
            context_id, auth["logged_out_indicator"]
        )

    # --- Create a ZAP "user" with the real credentials ---
    user_id = zap.users.new_user(context_id, "scan_user")
    zap.users.set_authentication_credentials(
        context_id,
        user_id,
        f"username={auth['username']}&password={auth['password']}",
    )
    zap.users.set_user_enabled(context_id, user_id, "true")

    # Force ZAP to use this user for every request (simplest reliable mode)
    zap.forcedUser.set_forced_user(context_id, user_id)
    zap.forcedUser.set_forced_user_mode_enabled("true")

    print("[+] Authentication configured, forced-user mode enabled")
    return context_id, user_id


def wait_for(check_fn, label, poll_seconds=3):
    while True:
        progress = check_fn()
        print(f"    {label} progress: {progress}%")
        if int(progress) >= 100:
            break
        time.sleep(poll_seconds)


def run_spider(zap, target_url, context_id, user_id):
    if user_id is None:
        print("[+] Starting spider (unauthenticated)...")
        scan_id = zap.spider.scan(url=target_url, contextname=None)
    else:
        print("[+] Starting authenticated spider...")
        scan_id = zap.spider.scan_as_user(
            contextid=context_id, userid=user_id, url=target_url
        )
    wait_for(lambda: zap.spider.status(scan_id), "Spider")
    print("[+] Spider complete")


def run_ajax_spider(zap, target_url):
    print("[+] Starting AJAX spider (JS-heavy pages)...")
    zap.ajaxSpider.scan(target_url)
    while zap.ajaxSpider.status == "running":
        print("    AJAX spider still running...")
        time.sleep(5)
    print("[+] AJAX spider complete")


def run_active_scan(zap, target_url, context_id, user_id):
    print("[+] Starting active scan (this can take a while)...")
    if user_id is None:
        scan_id = zap.ascan.scan(url=target_url, contextid=context_id, recurse=True)
    else:
        scan_id = zap.ascan.scan_as_user(
            url=target_url, contextid=context_id, userid=user_id, recurse=True
        )
    wait_for(lambda: zap.ascan.status(scan_id), "Active scan", poll_seconds=5)
    print("[+] Active scan complete")


def save_html_report(zap, cfg):
    out_dir = cfg["report"]["output_dir"]
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, cfg["report"]["filename"])

    html_report = zap.core.htmlreport()
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_report)

    print(f"[+] Report saved to {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        default=None,
        help="Path to a YAML config (skips the interactive prompts)",
    )
    args = parser.parse_args()

    if args.config:
        cfg = load_config(args.config)
    else:
        cfg = build_config_interactively()

    target_url = cfg["target"]["url"]

    zap = connect_zap(cfg)

    # Make sure ZAP has at least visited the target once
    zap.urlopen(target_url)
    time.sleep(2)

    context_id, user_id = setup_context_and_auth(zap, cfg)

    if cfg["scan"].get("spider", True):
        run_spider(zap, target_url, context_id, user_id)

    if cfg["scan"].get("ajax_spider", False):
        run_ajax_spider(zap, target_url)

    if cfg["scan"].get("active_scan", True):
        run_active_scan(zap, target_url, context_id, user_id)

    save_html_report(zap, cfg)
    print("[+] Done.")


if __name__ == "__main__":
    sys.exit(main())