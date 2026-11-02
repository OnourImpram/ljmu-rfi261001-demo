# Architecture and review guide

## Reference release 2026.11.02

This repository demonstrates the University-specific workflow layer. It is a dependency-free browser application, not the hosted clinical data service. The deployed service architecture covers server-side identity and authorisation, clinical records, resource transactions, protected audit storage and University integrations.

The distinction is deliberate: an evaluator can inspect the workflow here without credentials, external API calls or patient data.

## State and boundaries

`AppStore` owns one synthetic dataset and persists it in local storage when the browser permits. A versioned storage key avoids loading incompatible earlier snapshots. Private browsing and unavailable storage fall back to an in-memory session. Reset invalidates pending asynchronous reviews as well as restoring the dataset.

Personas are fixed reference identities. Action-level checks separate clinical review, research export, order submission, order approval and finance export. These improve the consistency of the walkthrough; client-side role checks are not a security boundary against someone controlling the browser. Production authorisation belongs on the server.

## Business invariants

- Reservations validate practitioner availability, room suitability, equipment status and the selected supervisor’s capacity at confirmation. Allocation changes only the selected resources.
- A waiting-list offer has an invited user, current state and a 15-minute expiry. A place cannot be claimed twice or after expiry.
- Only the authoring student can save a draft. Saving advances its version and preserves previous content.
- Only the assigned supervisor can approve. The SHA-256 digest binds canonical record content, reviewer, version and timestamp. Concurrent approval calls resolve to one result; activity is credited once. Changes to the role, record or session while hashing prevent commitment.
- A digest detects changes; it does not independently authenticate a person. Preloaded reviewed records are labelled reference history and contain no fabricated digests.
- Purchase orders snapshot their invoice lines. A repeated submission with the same reference and content returns the same order. A different authorised persona approves it.
- Local approval creates an export-ready state. It does not claim a successful transfer to Oracle.
- Finance CSV is generated from approved orders, with equal debit and credit totals. Ledger/account codes are illustrative mappings.
- Research exports are generated from currently consented records, using stable reference study IDs and age bands. Names, dates of birth and clinical free text are excluded. Such an extract is not automatically anonymous.

## Presentation and data handling

All user-controlled values interpolated into HTML are escaped; spreadsheet-leading formula characters are neutralised in CSV. Invoice calculations use integer pence and per-line VAT rounding. Input validation rejects invalid quantities, amounts, payment terms and purchase-order references.

The runtime has no external fonts, analytics, libraries or API requests. The source CSP restricts scripts to the site and blocks network connections. Responsive layouts keep tables in their own scroll containers. Dialogs support Escape, focus containment and focus restoration; primary workspaces support arrow-key navigation.

## Integration responsibilities

Entra ID, Teams, Oracle and the chosen hosted payment service are deployment interfaces. Configuration, licences, mappings, credentials and acceptance are established with the University. Medical interpretation, record retention, tax classification and research permissions remain governed by the responsible University teams.

## Quality workflow

The automated suite covers permission checks, state transitions, duplicate actions, stale reviews, consent filtering, balanced arithmetic, output handling, navigation, forms and responsive layouts. Passing these tests is evidence for those scenarios, not a penetration test, accessibility certification or clinical safety case.
