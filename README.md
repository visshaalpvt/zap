# ZAP Authenticated Scanner

Runs an OWASP ZAP scan against one authorized target URL, optionally logs in with a username/password, and exports an HTML report. Active scanning sends attack payloads; use this only against applications you own or are explicitly authorized to test.

## Setup

Requires Docker and Python 3.10+.

```powershell
docker compose up -d
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, activate with `source venv/bin/activate`.

Wait for ZAP to boot (`docker compose logs -f zap`), then run the interactive setup:

```powershell
python scripts/run_scan.py
```

Press Enter to accept bracketed defaults. Password input is hidden. Answer `n` when the target does not need authentication.

## Repeatable runs

Edit `config/scan_config.yaml`, replacing the sample target and credentials, then run:

```powershell
python scripts/run_scan.py --config config/scan_config.yaml
```

Set `options.ajax_spider: true` for JavaScript-heavy SPAs. Set `options.active_scan: false` for passive spidering only. The generated report is written to `reports/zap_report.html` by default.

## Configuration and security

The Docker API is bound to `127.0.0.1:8080`. Keep it local, change the example API key in both `docker-compose.yml` and the config, and do not commit real credentials. Reports are ignored by Git.

Stop the daemon with:

```powershell
docker compose down
```
