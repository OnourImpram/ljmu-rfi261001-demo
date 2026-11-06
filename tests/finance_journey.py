import csv
import json
from pathlib import Path


def verify_finance(page, check, role, tab):
    verify_commercial_feedback(page, check)
    verify_late_audit_refresh(page, check)
    role("manager")
    tab("commercial")
    page.select_option("#account-order", "ord_2026_0091")

    def record(kind, reference, amount=None, index=None):
        page.select_option("#account-action", kind)
        if amount is not None:
            page.fill("#cash-amount", amount)
        if index is not None:
            page.select_option("#credit-line", index)
        page.fill("#entry-reference", reference)
        page.click("#review-entry")
        page.click("#confirm-entry")
        page.wait_for_function("document.querySelector('#finance-notice').textContent.includes('recorded for')")

    record("receipt", "SAMPLE-BANK-001", "915.00")
    check("recorded payment settles the approved invoice", page.inner_text("#invoice-balance") == "£0.00")
    record("credit", "Laboratory session cancelled", index="2")
    check("one credited hire creates a £480 refund balance", page.inner_text("#invoice-refundable") == "£480.00")
    record("refund", "SAMPLE-REFUND-001", "125.00")
    check("partial refund leaves £355 available", page.inner_text("#invoice-refundable") == "£355.00")
    record("refund", "SAMPLE-REFUND-002", "355.00")
    check("full remaining refund clears liability", page.inner_text("#invoice-refundable") == "£0.00")
    page.reload()
    page.select_option("#account-order", "ord_2026_0091")
    check("transaction history survives refresh", page.get_by_role("region", name="Invoice transactions").get_by_text("SAMPLE-REFUND-002", exact=False).count() == 1)
    tab("governance")
    page.select_option("#journal-order", "ord_2026_0091")
    credit = page.locator("#journal-document option").filter(has_text="Credit note").get_attribute("value")
    page.select_option("#journal-document", credit)
    with page.expect_download() as download:
        page.click("#btn-download-oracle-csv")
    with Path(download.value.path()).open(encoding="utf-8",newline="") as f:
        rows = list(csv.DictReader(f))
    debit = sum(float(r["ENTERED_DR"]) for r in rows)
    credit_total = sum(float(r["ENTERED_CR"]) for r in rows)
    check("credit journal reverses original lab income and VAT", debit == credit_total == 480 and
          all(r["DOCUMENT_REF"] == credit for r in rows) and
          any(r["SEGMENT2_COST_CENTRE"] == "201" and r["ENTERED_DR"] == "400.00" for r in rows) and
          any(r["SEGMENT4_ACCOUNT"] == "2110" and r["ENTERED_DR"] == "80.00" for r in rows))
    for level in ("activity","centre","service"):
        page.select_option("#income-group", level)
        with page.expect_download() as report_download:
            page.click("#download-income")
        with Path(report_download.value.path()).open(encoding="utf-8", newline="") as f:
            report = list(csv.DictReader(f))
        check("income CSV agrees with screen by " + level,
              round(sum(float(r["NET_INCOME_GBP"]) for r in report),2) ==
              float(page.inner_text("#income-net").replace("£","").replace(",","")))
    tab("booking")
    def open_section(control):
        if not page.locator(control).is_visible():
            page.locator("details").filter(has=page.locator(control)).locator("summary").first.click()
    open_section("#course-limit")
    page.fill("#course-limit", "30")
    page.locator("#capacity-form button").click()
    role("booker")
    open_section("#group-size")
    page.fill("#group-size", "3")
    page.locator("#group-form button").click()
    tab("commercial")
    page.select_option("#tariff-select","club-block")
    group = page.input_value("#bill-group")
    page.fill("#group-po","GROUP-PO-UI")
    page.locator("#group-order-form button").click()
    check("booked group cannot be invoiced twice through the form", page.locator("#bill-group").count() == 0)
    role("manager")
    page.click("#btn-approve-po")
    group_order = page.locator("#account-order option").filter(has_text="GROUP-PO-UI").get_attribute("value")
    page.select_option("#account-order",group_order)
    check("three booked workshop places invoice at the selected club tariff",
          page.inner_text("#invoice-balance") == "£337.50" and group in page.locator("#account-order").locator("..").inner_text())
    role("booker")
    page.fill("#po-org-input","North Sample Club")
    page.fill("#po-number-input","MULTI-A")
    page.click("#btn-submit-po")
    page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('submitted')")
    count = page.evaluate("AppStore.getState().orders.length")
    page.click("#btn-submit-po")
    page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('already recorded')")
    check("repeat PO does not create a second invoice or lose the original reference",
          page.input_value("#po-number-input") == "MULTI-A" and page.evaluate("AppStore.getState().orders.length") == count)
    page.locator(".btn-add-cart").first.click()
    page.click("#btn-submit-po")
    page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('different items')")
    check("changed order cannot reuse the payer's reference", page.evaluate("AppStore.getState().orders.length") == count)
    page.fill("#po-number-input","MULTI-B")
    page.click("#btn-submit-po")
    page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('submitted')")
    role("manager")
    for ref in ("MULTI-A","MULTI-B"):
        order = page.locator("#pending-order-select option").filter(has_text=ref).get_attribute("value")
        page.select_option("#pending-order-select",order)
        page.click("#btn-approve-po")
    page.locator("#remittance-card summary").click()
    payer = page.locator("#remit-payer option").filter(has_text="North Sample Club").get_attribute("value")
    page.select_option("#remit-payer",payer)
    page.fill("#allocate-0","100.00")
    page.fill("#allocate-1","25.00")
    page.fill("#remit-reference","MULTI-BANK-125")
    page.click("#review-remit")
    page.click("#confirm-remit")
    page.wait_for_function("document.querySelector('#finance-notice').textContent.includes('across 2 invoices')")
    tab("governance")
    page.select_option("#journal-order",order)
    receipt = page.locator("#journal-document option").filter(has_text="Payment receipt").get_attribute("value")
    page.select_option("#journal-document",receipt)
    with page.expect_download() as batch:
        page.click("#download-remittance")
    with Path(batch.value.path()).open(encoding="utf-8",newline="") as f:
        split = list(csv.DictReader(f))
    check("one payment allocates £125 across two purchase orders with balanced journal rows",len(split) == 4 and
          {row["REFERENCE1_PO"] for row in split} == {"MULTI-A","MULTI-B"} and
          all(row["PAYMENT_REFERENCE"] == "MULTI-BANK-125" for row in split) and
          sum(float(r["ENTERED_DR"]) for r in split) == sum(float(r["ENTERED_CR"]) for r in split) == 125)
    tab("commercial")
    role("patient")
    check("patient cannot access the commercial account", page.locator("#account-order").count() == 0)


def verify_commercial_feedback(source_page, check):
    context = source_page.context.browser.new_context()
    try:
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(source_page.url.split("#")[0] + "#commercial")
        defaults = [page.input_value("#po-" + key + "-input") for key in ["org", "booker", "number"]]
        page.select_option("#role-select", "manager")
        page.select_option("#account-action", "receipt")
        page.fill("#cash-amount", "1.00")
        page.fill("#entry-reference", "NOTICE-RECEIPT-001")
        page.click("#review-entry")
        page.click("#confirm-entry")
        page.wait_for_function("document.querySelector('#finance-notice').textContent.includes('recorded for')")
        check("recorded payment displays its own confirmation", "£1.00" in page.inner_text("#finance-notice"))
        page.select_option("#role-select", "booker")
        check("payment confirmation clears when the active persona changes", page.inner_text("#finance-notice") == "")
        page.select_option("#role-select", "manager")
        check("old payment confirmation does not return with its author", page.inner_text("#finance-notice") == "")
        page.click("#btn-reset-demo")
        check("reset removes payment confirmation together with its transaction",
              page.inner_text("#finance-notice") == ""
              and page.evaluate("AppStore.getState().orders.every(order => !order.entries?.length)"))
        page.select_option("#role-select", "booker")
        for key, value in zip(["org", "booker", "number"], ["Unsent example club", "Unsent contact", "UNSENT-PO-001"]):
            page.fill("#po-" + key + "-input", value)
        page.click("#btn-reset-demo")
        check("reset restores all purchase-order draft fields",
              [page.input_value("#po-" + key + "-input") for key in ["org", "booker", "number"]] == defaults)
        page.select_option("#role-select", "booker")
        page.fill("#po-number-input", "NOTICE-PO-001")
        page.click("#btn-submit-po")
        page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('submitted')")
        check("submitted order displays its own confirmation", "submitted" in page.inner_text("#po-feedback"))
        page.select_option("#role-select", "manager")
        check("order confirmation clears when the active persona changes", page.inner_text("#po-feedback") == "")
        page.click("#btn-reset-demo")
        check("reset removes order confirmation together with its order", page.inner_text("#po-feedback") == ""
              and page.evaluate("AppStore.getState().orders.every(order => order.poNumber !== 'NOTICE-PO-001')"))
        page.select_option("#role-select", "manager")
        page.click("#tab-booking")
        page.locator("#course-reservations summary").click()
        page.fill("#course-limit", "23")
        page.locator("#capacity-form button").click()
        page.select_option("#role-select", "booker")
        page.locator("#course-reservations summary").click()
        page.fill("#group-size", "3")
        page.locator("#group-form button").click()
        page.click("#tab-commercial")
        group = page.input_value("#bill-group")
        count = page.evaluate("AppStore.getState().orders.length")
        existing_po = page.evaluate("AppStore.getState().orders[0].poNumber")
        page.fill("#group-po", existing_po)
        page.locator("#group-order-form button").click()
        check("group reference conflict explains the rejection next to the retained input",
              "different items or terms" in page.locator("#group-order-form").inner_text()
              and page.input_value("#group-po") == existing_po and page.input_value("#bill-group") == group
              and page.evaluate("AppStore.getState().orders.length") == count)
        page.fill("#group-po", "   ")
        page.locator("#group-order-form button").click()
        check("invalid group reference explains the rejection without losing the form",
              "purchase order reference of up to 60 characters" in page.locator("#group-order-form").inner_text()
              and page.input_value("#group-po") == "   " and page.input_value("#bill-group") == group
              and page.evaluate("AppStore.getState().orders.length") == count)
        page.fill("#group-po", "CORRECTED-GROUP-PO")
        page.locator("#group-order-form button").click()
        page.wait_for_function("document.querySelector('#finance-notice').textContent.includes('submitted for')")
        check("corrected group reference submits once and replaces the error with confirmation",
              page.locator("#group-order-form").count() == 0 and group in page.inner_text("#finance-notice")
              and page.evaluate("AppStore.getState().orders.length") == count + 1)
        page.click("#btn-reset-demo")
        check("reset clears a group-order confirmation", page.inner_text("#finance-notice") == "")
        check("commercial feedback journey has no JavaScript errors", not errors)
    finally:
        context.close()


def verify_late_audit_refresh(source_page, check):
    context = source_page.context.browser.new_context()
    try:
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(source_page.url.split("#")[0] + "#commercial")
        page.select_option("#role-select", "booker")
        page.fill("#po-number-input", "AUDIT-TIMING-PO")
        page.click("#btn-submit-po")
        page.wait_for_function("document.querySelector('#po-feedback').textContent.includes('submitted')")
        page.select_option("#role-select", "manager")
        page.wait_for_function("AppStore.getState().auditLog.some(entry => entry.action === 'ROLE_SWITCH' && entry.role === 'manager')")
        order_id = page.input_value("#pending-order-select")
        page.evaluate("""() => {
          const digest = crypto.subtle.digest;
          let release;
          const waiting = new Promise(resolve => { release = resolve; });
          window.heldDigestCount = 0;
          crypto.subtle.digest = async (...args) => {
            window.heldDigestCount += 1;
            await waiting;
            return digest.apply(crypto.subtle,args);
          };
          window.releaseAuditDigest = () => { crypto.subtle.digest = digest; release(); };
        }""")
        page.click("#btn-approve-po")
        check("approval commits before its delayed native audit digest",
              page.evaluate("id => AppStore.getState().orders.find(order => order.id === id).status.startsWith('APPROVED')", order_id)
              and page.evaluate("window.heldDigestCount > 0"))
        page.click("#tab-governance")
        page.fill("#audit-search-input", order_id)
        page.click("#tab-commercial")
        page.locator("#remittance-card summary").click()
        page.fill("#allocate-0", "10.00")
        page.fill("#allocate-1", "15.00")
        page.fill("#remit-reference", "UNSUBMITTED-ALLOCATION")
        page.focus("#remit-reference")
        page.evaluate("window.releaseAuditDigest()")
        page.wait_for_function("id => AppStore.getState().auditLog.some(entry => entry.action === 'PURCHASE_ORDER_APPROVE' && entry.resource.includes(id))", arg=order_id)
        check("late audit publication preserves the open remittance form",
              page.locator("#remittance-card").evaluate("element => element.open"))
        check("late audit publication preserves typed allocations and reference",
              page.input_value("#allocate-0") == "10.00" and page.input_value("#allocate-1") == "15.00"
              and page.input_value("#remit-reference") == "UNSUBMITTED-ALLOCATION")
        check("late audit publication preserves the active input focus",
              page.evaluate("document.activeElement.id === 'remit-reference'"))
        check("late audit publication updates rows without clearing their search",
              page.input_value("#audit-search-input") == order_id
              and order_id in page.locator("#audit-log-tbody").inner_text())
        page.click("#tab-governance")
        page.fill("#audit-search-input", "UNMATCHED-AUDIT-FILTER")
        page.fill("#audit-search-input", order_id)
        check("audit search uses the current log after a partial refresh",
              order_id in page.locator("#audit-log-tbody").inner_text())
        with page.expect_download() as download:
            page.click("#btn-export-audit-json")
        exported = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
        check("audit export includes the newly published approval",
              any(entry["action"] == "PURCHASE_ORDER_APPROVE" and order_id in entry["resource"] for entry in exported))
        page.select_option("#role-select", "booker")
        check("role changes still replace the governance view", page.locator("#audit-log-tbody").count() == 0)
        page.click("#btn-reset-demo")
        check("reset still replaces all substantive state and governance controls",
              page.input_value("#audit-search-input") == ""
              and page.evaluate("id => AppStore.getState().orders.every(order => order.id !== id)", order_id))
        check("late native-digest audit journey has no JavaScript errors", not errors)
    finally:
        context.close()
