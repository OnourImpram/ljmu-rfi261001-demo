# OIV · Clinical & Faculty Operations

An interactive reference environment for Liverpool John Moores University’s **RFI 261001**: connected booking, supervised clinical practice and faculty commercial activity.

**Open the walkthrough:** https://onourimpram.github.io/ljmu-rfi261001-demo/

## Explore the workflows

| Workspace | What to try |
| --- | --- |
| Booking & resources | Reserve the final available supervised bay; inspect the updated capacity; release and accept a time-limited course place. |
| Clinical records | Review five disciplines. As the student, save a draft. As the assigned supervisor, review and countersign the current version; inspect the activity log and consent-filtered export. |
| Commercial activity | Build a mixed-tax basket, submit a purchase order as the corporate booker, then approve it as the commercial lead. |
| Finance & audit | Download the balanced GL reference mapping and inspect role-scoped events from the current session. |

The persona selector is a **walkthrough control**, not an authentication service. All records are fictional. The application runs locally in the browser; no clinical, payment or University API is called. Do not enter real patient information. Use **Reset walkthrough** to restore the reference dataset.

## Run locally

No build step, runtime package installation or API key is required.

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765`. HTTPS or localhost is required for browser-native SHA-256 review. Use an HTTP server rather than opening `index.html` as a file.

## Verify

Node.js 22 and Python 3.11+ are used by the quality workflow.

```sh
node --test tests/*.test.cjs
python3 tests/check_source.py
python3 -m pip install -r tests/requirements.txt
python3 -m playwright install chromium
python3 tests/browser_smoke.py
```

The browser script starts its own local HTTP server. To exercise a deployed copy, set `BASE_URL` to its HTTPS address. Screenshots and structured results are written to `test-results/browser/`, not committed as application code.

An explicit `--inline` mode is provided for isolated review environments that cannot navigate to a local server. It inlines the exact source and removes CSP only from that temporary test document. It does **not** validate the deployed CSP, network path or secure-origin browser cryptography; Node tests separately exercise real Web Crypto. The source CSP remains unchanged.

## Code map

- `js/domain.js` — pure validation, currency arithmetic, output escaping and canonical serialisation.
- `js/store.js` — synthetic fixtures, state, permissions, bookings, versioned review, orders and export generation.
- `js/booking.js`, `epr.js`, `commercial.js`, `governance.js` — the four workspaces.
- `js/app.js` — navigation, persona changes, accessible dialogs and shared presentation helpers.
- `css/styles.css` — responsive presentation using local system fonts.
- `tests/` — regression, source-hygiene and browser checks.

See [architecture and scope](docs/architecture.md) and [security reporting](SECURITY.md).

## Ownership

© 2026 ONOUR IMPRAM VENTURES LTD, company 17429906. All rights reserved. Source access is provided for evaluation; no third-party redistribution licence is granted by this repository. No EIR source code is included in this reference release.

Contact: onour@onourimpram.com
