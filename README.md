# Clinical and faculty services

Optional interactive demonstration prepared by ONOUR IMPRAM VENTURES LTD for Liverpool John Moores University RFI 261001. All people, appointments and transactions are fictional. Changes are stored in the current browser.

[Open the demonstration](https://onourimpram.github.io/ljmu-rfi261001-demo/) · [Evaluation guide](guide.html) · [Buyer notice](https://www.find-tender.service.gov.uk/Notice/099596-2026)

| Workspace | Exercise |
| --- | --- |
| Bookings | Reserve and move a clinic appointment, check available resources, handle a waiting-list offer and book course places for a group. |
| Clinical records | Save a student note and countersign it as the supervisor. Add a follow-up, review the sample referral and link a patient invitation to its appointment. |
| Orders | Raise a purchase order for reserved places, apply a sample tariff and approve the invoice in the manager role. |
| Finance | Record receipts, credit eligible lines, refund an outstanding credit and reconcile the journal to the original order. Compare income by service and cost centre. |

Run the site from its root with `python -m http.server 8080 --bind 127.0.0.1` and open `http://127.0.0.1:8080/`. Use localhost or HTTPS for the browser’s signature digest.

Run `npm test` for business rules and `python tests/check_source.py` for source checks. Install `tests/requirements.txt` and a Playwright Chromium browser to run `python tests/browser_smoke.py`. For an installed Chrome executable, set `CHROMIUM_PATH`. Set `BASE_URL` to test a served release.

[Architecture](docs/architecture.md) · [Security reporting](SECURITY.md)

The optional muscle group reference uses outline data adapted directly from [MuscleMap](https://github.com/melihcolpan/MuscleMap/tree/d53ddf4d480b65979f1008b203e6b6eda0e67e54), copyright Melih Colpan, under its [MIT licence](assets/anatomy/MuscleMap-LICENSE.txt). The clinical marking surface uses a separate drawing and patient-relative observation sites.
