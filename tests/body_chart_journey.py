def verify_preview_isolation(source_page, check):
    context = source_page.context.browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
    try:
        page = context.new_page()
        page.goto(source_page.url.split("#")[0] + "#epr")
        page.select_option("#role-select", "student")
        page.click("[data-chart-view=front]")
        page.select_option("#marker-region", "front:left:knee")
        check("pending body location appears only as a student preview", page.locator(".atlas-preview-pin").count() == 1 and
              page.locator('[data-chart-mark="front:left:knee"]').count() == 0)
        page.select_option("#role-select", "supervisor")
        page.click("[data-chart-view=front]")
        check("unrecorded location is absent from the supervisor review", page.locator(".atlas-preview-pin,.atlas-region.is-picked").count() == 0)
        page.click("#btn-execute-countersign")
        page.wait_for_function("AppStore.getState().records.osteopathy.signatureHash?.length === 71")
        check("signing leaves only recorded body locations", page.locator(".atlas-preview-pin").count() == 0 and
              page.locator("#body-atlas-panel").get_by_text("Signed record", exact=True).is_visible())
        page.click("#btn-reset-demo")
        page.select_option("#role-select", "student")
        page.click("[data-chart-view=front]")
        page.select_option("#marker-region", "front:right:knee")
        page.click("#btn-reset-demo")
        page.select_option("#role-select", "student")
        page.click("[data-chart-view=front]")
        check("reset clears the pending body-chart selection", page.input_value("#marker-region") == "" and
              page.locator(".atlas-preview-pin").count() == 0)
        site = page.evaluate("""() => {
          const map = document.getElementById('svg-body-map');
          const site = BodyChart.getSite('front:left:knee');
          map.scrollIntoView({block:'center'});
          const p = new DOMPoint(site.x,site.y).matrixTransform(map.getScreenCTM());
          return {x:p.x,y:p.y};
        }""")
        page.touchscreen.tap(site["x"],site["y"])
        check("tapping the patient's left knee selects the same region as the picker",
              page.input_value("#marker-region") == "front:left:knee" and page.locator(".atlas-preview-pin").count() == 1)
        page.click("#chart-add")
        page.click("[data-chart-view=back]")
        page.click('[data-chart-locate="front:left:knee"]')
        check("saved list entry opens its original view and numbered pin",
              page.get_attribute("[data-chart-view=front]", "aria-pressed") == "true" and
              page.locator('[data-chart-mark="front:left:knee"]').count() == 1)
    finally:
        context.close()
    verify_reference_retry(source_page, check)


def verify_reference_retry(source_page, check):
    from json import dumps
    from playwright.sync_api import TimeoutError

    for label, payload in [("missing", "void 0"), ("partial", "globalThis.MuscleReferenceGeometry={front:{}}")]:
        context = source_page.context.browser.new_context()
        try:
            context.add_init_script("""(() => {
              const append = Element.prototype.append;
              globalThis.referenceLoads = 0;
              Element.prototype.append = function (...nodes) {
                for (const node of nodes) {
                  if (node instanceof HTMLScriptElement && node.src.endsWith('/assets/anatomy/muscle-shapes.js')) {
                    globalThis.referenceLoads += 1;
                    if (globalThis.referenceLoads === 1) node.src = 'data:text/javascript,' + encodeURIComponent(PAYLOAD);
                  }
                }
                return append.apply(this, nodes);
              };
            })();""".replace("PAYLOAD", dumps(payload)))
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(source_page.url.split("#")[0] + "#epr")
            reference = page.locator(".muscle-reference")
            reference.locator("summary").click()
            try:
                reference.get_by_text("Could not load the muscle map.", exact=False).wait_for(timeout=3000)
            except TimeoutError:
                pass
            check(label + " muscle geometry shows retry feedback",
                  "Close and reopen" in reference.inner_text())
            reference.locator("summary").click()
            reference.locator("summary").click()
            try:
                page.locator("#muscle-choice").wait_for(timeout=5000)
            except TimeoutError:
                pass
            check(label + " muscle geometry reloads successfully on retry",
                  page.locator("#muscle-choice option").count() == 19
                  and page.evaluate("referenceLoads") == 2)
            check(label + " optional reference failure preserves the clinical chart",
                  page.locator("#svg-body-map").count() == 1 and not errors)
        finally:
            context.close()
