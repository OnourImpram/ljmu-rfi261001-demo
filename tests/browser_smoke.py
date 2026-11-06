from pathlib import Path
import json
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-results/browser"
OUT.mkdir(parents=True, exist_ok=True)

checks = []


def check(name, value):
    checks.append({"name": name, "passed": bool(value)})
    if not value:
        print("FAILED", name)


server = None
url = os.environ.get("BASE_URL")
if not url:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=os.environ.get("SITE_ROOT", str(ROOT))))
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"

with sync_playwright() as p:
    options = {"headless": True}
    if os.environ.get("CHROMIUM_PATH"):
        options["executable_path"] = os.environ["CHROMIUM_PATH"]
    browser = p.chromium.launch(**options)
    page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=1)
    errors = []
    console_errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    page.goto(url, wait_until="networkidle")
    page.wait_for_selector("#btn-open-booking-modal")

    def role(name):
        page.select_option("#role-select", name)
        page.wait_for_timeout(100)

    def tab(name):
        page.click("#tab-" + name)
        page.wait_for_timeout(100)


    check("application initialises", page.locator("#btn-open-booking-modal").is_visible())
    page.click("#btn-open-booking-modal")
    page.wait_for_timeout(100)
    check("available reservation enabled", page.locator("#btn-book-slot").is_enabled())

    page.select_option("#booking-equipment-select", "eq_us_01")
    page.wait_for_timeout(100)
    check("calibration lock prevents reservation", page.locator("#btn-book-slot").is_disabled())

    page.select_option("#booking-equipment-select", "none")
    page.select_option("#booking-practitioner-select", "stu_walker")
    page.wait_for_timeout(100)
    page.click("#btn-book-slot")
    page.wait_for_timeout(150)
    check("supervisor bays updated to 4/4", page.evaluate("AppStore.getState().supervisors[0].activeBays === 4"))

    page.click("#btn-open-booking-modal")
    page.select_option("#booking-practitioner-select", "stu_patel")
    page.select_option("#booking-room-select", "rm_ch_mov")
    check("a real second student's request for a free bay exceeds this supervisor's capacity",
          page.locator("#btn-book-slot").is_disabled() and
          page.inner_text("#constraint-warning-banner") == "Choose a supervisor with an available teaching place.")
    page.select_option("#booking-supervisor-select", "sup_davies")
    check("changing only the supervisor makes the same real appointment available", page.locator("#btn-book-slot").is_enabled())
    page.click("#btn-close-booking-modal")

    from appointment_journey import verify_appointment_journey
    verify_appointment_journey(page, check)
    from follow_up_journey import verify_follow_up_drafts
    verify_follow_up_drafts(page, check)
    from rendered_state_journey import verify_manipulated_saved_state_rendering
    verify_manipulated_saved_state_rendering(page, check)

    page.evaluate("AppStore.reset(); App.refreshAllViews()")
    page.wait_for_timeout(100)


    tab("epr")
    page.focus("#disc-tab-osteopathy")
    page.keyboard.press("ArrowRight")
    check("keyboard activates and focuses the next clinical record",
          page.evaluate("document.activeElement.id === 'disc-tab-physiotherapy'") and
          page.locator("[data-discipline][tabindex='0']").count() == 1)
    page.keyboard.press("End")
    page.keyboard.press("Home")
    check("Home and End keep the selected record labelled", page.evaluate("document.activeElement.id") ==
          page.locator("#discipline-record-panel").get_attribute("aria-labelledby") == "disc-tab-osteopathy")
    for discipline in ["osteopathy", "physiotherapy", "cardiovascular", "physiology", "sc"]:
        page.click(f'[data-discipline="{discipline}"]')
        page.wait_for_timeout(80)
        check(f"discipline {discipline}", page.locator("#epr-subjective").is_visible())

    page.evaluate("""() => {
      const r = AppStore.getState().records.cardiovascular;
      AppStore.setState({records:{...AppStore.getState().records,
        cardiovascular:{...r, ecgMetrics:null, qrisk3Score:null}}});
    }""")
    page.click('[data-discipline="cardiovascular"]')
    check("missing ECG and risk measurements remain unrecorded", page.locator("#view-epr .discipline-widget-box").inner_text().count("Not recorded") >= 5)

    page.click('[data-discipline="osteopathy"]')
    role("student")
    check("student cannot export the cohort", page.locator("#btn-preview-research").is_disabled() and page.locator("#btn-export-research-json").count() == 0)
    page.click("[data-chart-view=front]")
    page.select_option("#marker-region", "front:left:knee")
    page.focus("#marker-form button")
    page.keyboard.press("Enter")
    check("keyboard can add an assigned draft marker", "Left knee" in page.locator("#body-marker-list").inner_text() and page.locator("[data-chart-mark=\"front:left:knee\"]").count() == 1)
    from body_chart_journey import verify_preview_isolation
    verify_preview_isolation(page, check)
    page.fill("#epr-assessment", "Synthetic review <em>observation</em>")
    page.click('[data-discipline="physiotherapy"]')
    check("uncommitted note stays with the original episode",
          page.input_value("#epr-assessment") != "Synthetic review <em>observation</em>")
    page.click('[data-discipline="osteopathy"]')
    check("returning to the same student note retains typed text",
          page.input_value("#epr-assessment") == "Synthetic review <em>observation</em>")
    page.click("#save-student-note")
    page.get_by_text("Student note saved for supervisor review.").wait_for()
    check("saved draft renders as text", page.input_value("#epr-assessment") == "Synthetic review <em>observation</em>")
    check("student countersign disabled", page.locator("#btn-execute-countersign").is_disabled())

    role("supervisor")
    page.click("#btn-preview-research")
    check("supervisor can review the consented cohort", page.locator("#btn-export-research-json").is_visible())
    page.keyboard.press("Escape")
    marker_snapshot = page.evaluate("JSON.stringify(AppStore.getState().records.osteopathy.bodyMarkers)")
    page.locator(".muscle-reference summary").click()
    page.select_option("#muscle-choice", "quadriceps")
    check("muscle reference highlights the quadriceps on the front figure",
          page.locator('.muscle-figures figure').first.locator('[data-muscle="quadriceps"].is-highlighted').count() == 1)
    page.select_option("#muscle-choice", "hamstring")
    check("posterior reference selection leaves the clinical note unchanged",
          page.locator('.muscle-figures figure').last.locator('[data-muscle="hamstring"].is-highlighted').count() == 1
          and page.evaluate("JSON.stringify(AppStore.getState().records.osteopathy.bodyMarkers)") == marker_snapshot)
    page.locator(".muscle-reference summary").click()
    page.click("#btn-execute-countersign")
    page.wait_for_function("AppStore.getState().records.osteopathy.signatureHash?.length === 71")
    page.locator("#view-epr summary").filter(has_text="Review reference").click()
    page.locator("#signature-hash-display").wait_for(state="visible")
    check("SHA-256 digest generated", page.locator("#signature-hash-display").inner_text().startswith("SHA256:"))
    check("countersigned record locked", page.locator("#btn-execute-countersign").is_disabled())


    tab("commercial")
    check("mixed-VAT exempt subtotal £105.00", page.locator("#subtotal-exempt").inner_text().strip() == "£105.00")
    check("mixed-VAT standard subtotal £675.00", page.locator("#subtotal-standard").inner_text().strip() == "£675.00")
    check("mixed-VAT output VAT £135.00", page.locator("#vat-standard").inner_text().strip() == "£135.00")
    check("mixed-VAT total gross £915.00", page.locator("#total-gross").inner_text().strip() == "£915.00")

    role("booker")
    tab("epr")
    check("corporate persona cannot see a clinical note", page.locator("#epr-subjective").count() == 0)
    tab("commercial")
    check("booker cannot approve own order", page.locator("#btn-approve-po").is_disabled())
    page.click(".btn-add-cart >> nth=0")
    expected_gross = page.locator("#total-gross").inner_text().strip()
    check("additional line changes basket", expected_gross != "£915.00")
    page.fill("#po-number-input", "EVAL-PO-042")
    page.click("#btn-submit-po")
    page.wait_for_timeout(150)
    role("manager")
    page.click("#btn-approve-po")
    page.wait_for_timeout(150)
    check("manager approves PO", "Approved" in page.locator("#order-status-badge").inner_text())


    tab("governance")
    with page.expect_download() as dl:
        page.click("#btn-download-oracle-csv")
    import csv
    with Path(dl.value.path()).open(encoding="utf-8", newline="") as f:
        journal = list(csv.DictReader(f))
    check("download matches approved invoice", all(row["REFERENCE1_PO"] == "EVAL-PO-042" for row in journal) and
          sum(float(row["ENTERED_DR"]) for row in journal) == float(expected_gross[1:]) ==
          sum(float(row["ENTERED_CR"]) for row in journal))
    check("Oracle 5-segment COA table present", "PRJ-PERFHUB" in page.locator("#oracle-coa-table").inner_text())
    check("audit trail rows rendered", page.locator("#audit-log-table tbody tr").count() >= 1)

    page.goto(url.split("#")[0] + "#commercial")
    page.locator("#view-commercial").wait_for(state="visible")
    check("module deep link opens requested view", page.locator("#tab-commercial").get_attribute("aria-selected") == "true")
    page.click("#btn-open-pillars-modal")
    check("RFI guide explains telehealth limit", "3.7" in page.locator("#pillars-modal").inner_text())
    page.keyboard.press("Escape")
    check("guide returns focus to its trigger", page.locator("#btn-open-pillars-modal").evaluate("(b) => b === document.activeElement"))
    page.focus("#tab-commercial")
    page.keyboard.press("ArrowRight")
    check("arrow key selects governance", page.locator("#tab-governance").get_attribute("aria-selected") == "true")
    role("supervisor")
    from finance_journey import verify_finance
    verify_finance(page, check, role, tab)
    role("supervisor")

    for width in [1440, 1024, 768, 390, 320]:
        page.set_viewport_size({"width": width, "height": 900})
        for name in ["booking", "epr", "commercial", "governance"]:
            tab(name)
            metrics = page.evaluate("({viewport: innerWidth, width: document.documentElement.scrollWidth})")
            check(f"no page overflow {name} {width}", metrics["width"] <= width)

    check("no uncaught JavaScript errors", not errors)
    check("no browser console errors", not console_errors)
    browser.close()

if server:
    server.shutdown()

result = {
    "checks": checks,
    "passed": sum(c["passed"] for c in checks),
    "total": len(checks),
    "javascript_errors": errors,
    "console_errors": console_errors,
}
(OUT / "results.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if all(c["passed"] for c in checks) else 1)
