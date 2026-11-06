def verify_appointment_journey(page, check):
    row = page.locator("#appointments-table tbody tr").first
    reference = row.locator("th").inner_text()
    page.get_by_role("button", name="Change " + reference).click()
    page.select_option("#booking-slot-select", "afternoon")
    page.select_option("#booking-room-select", "rm_tr_g03")
    check("occupied replacement room blocks change", page.locator("#btn-book-slot").is_disabled())
    page.select_option("#booking-room-select", "rm_ch_mov")
    page.click("#btn-book-slot")
    page.wait_for_function("document.getElementById('booking-modal').hidden")
    page.reload()
    row = page.locator("#appointments-table tbody tr").first
    check("reference, amended session and room survive refresh", reference in row.inner_text()
          and "14:00" in row.inner_text() and "Movement Bay" in row.inner_text())
    page.get_by_role("button", name="Cancel " + reference).click()
    page.get_by_role("button", name="Keep booking").click()
    check("keep booking leaves its session allocated", "Booked" in row.inner_text())
    page.get_by_role("button", name="Cancel " + reference).click()
    page.get_by_role("button", name="Confirm cancellation").click()
    page.wait_for_function("document.getElementById('appointments-table').textContent.includes('Cancelled')")
    check("cancellation frees original and amended sessions",
          all(page.evaluate("(slot) => AppStore.bookingRoster(slot).active.length === 0", slot)
              for slot in ("morning", "afternoon")))
