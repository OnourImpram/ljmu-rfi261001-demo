def verify_follow_up_drafts(source_page, check):
    verify_plan_literals(source_page, check)
    context = source_page.context.browser.new_context()
    try:
        page = context.new_page()
        page.goto(source_page.url.split("#")[0] + "#epr")

        def role(name):
            page.select_option("#role-select", name)

        def record(name):
            page.click("#disc-tab-" + name)
            panel = page.locator("#follow-up-history")
            if panel.get_attribute("open") is None:
                panel.locator("summary").first.click()

        def fill(note, value, attached=True):
            page.fill("#follow-up-note", note)
            page.fill("#follow-up-value", value)
            page.locator("#attach-referral").set_checked(attached)

        def fields():
            return [page.input_value("#follow-up-note"), page.input_value("#follow-up-value"),
                    page.is_checked("#attach-referral")]

        role("student")
        record("osteopathy")
        markup = '</textarea><b class="draft-probe">Literal teaching note</b>'
        fill(markup, "Activity <em>observation</em>")
        page.click("[data-chart-view=front]")
        page.select_option("#marker-region", "front:left:knee")
        page.click("#chart-add")
        check("body-chart redraw retains all unsaved follow-up fields as literal text",
              fields() == [markup, "Activity <em>observation</em>", True]
              and page.locator(".draft-probe").count() == 0)
        check("unsaved follow-up text is not committed by a body-chart edit",
              page.evaluate("(text) => !JSON.stringify(AppStore.getState()).includes(text)", markup))

        disciplines = ["osteopathy", "physiotherapy", "cardiovascular", "physiology", "sc"]
        for name in disciplines:
            record(name)
            fill("Student " + name, "Observation " + name)
        for name in disciplines:
            record(name)
            check("follow-up draft survives navigation for " + name,
                  fields() == ["Student " + name, "Observation " + name, True])

        role("supervisor")
        for name in disciplines:
            record(name)
            check("student follow-up draft is isolated from supervisor for " + name,
                  fields() == ["", "", False])
        record("osteopathy")
        fill("Supervisor draft", "Supervisor observation", False)
        role("student")
        record("osteopathy")
        check("returning student retains their own follow-up draft",
              fields() == ["Student osteopathy", "Observation osteopathy", True])
        role("manager")
        check("non-clinical role has no follow-up editor", page.locator("#progress-form").count() == 0)
        role("supervisor")
        record("osteopathy")
        check("returning supervisor retains their own follow-up draft",
              fields() == ["Supervisor draft", "Supervisor observation", False])
        page.fill("#case-field", "New activity goal")
        page.get_by_role("button", name="Save service settings").click()
        check("a changed observation field does not reinterpret the supervisor draft",
              fields() == ["", "", False])
        role("student")
        record("osteopathy")
        check("a changed observation field does not reinterpret the student draft",
              fields() == ["", "", False])

        fill("   ", "Unsaved observation")
        page.get_by_role("button", name="Add progress note", exact=True).click()
        record("physiotherapy")
        record("osteopathy")
        check("rejected follow-up submission retains every draft field",
              fields() == ["   ", "Unsaved observation", True])
        fill(markup, "Activity <em>observation</em>")
        page.get_by_role("button", name="Add progress note", exact=True).click()
        saved = page.evaluate("AppStore.getState().clinicExtensions.osteopathy.entries")
        check("successful follow-up submission records one entry and clears the draft",
              len(saved) == 1 and saved[0]["note"] == markup
              and saved[0]["observation"] == "Activity <em>observation</em>"
              and saved[0]["field"] == "New activity goal" and saved[0]["attached"]
              and fields() == ["", "", False] and page.locator(".draft-probe").count() == 0)
        record("physiotherapy")
        record("osteopathy")
        check("submitted follow-up draft does not return after navigation", fields() == ["", "", False])
        role("manager")
        page.click("#btn-reset-demo")
        for persona in ["student", "supervisor"]:
            role(persona)
            for name in disciplines:
                record(name)
                check("reset clears follow-up drafts for " + persona + " " + name,
                      fields() == ["", "", False])
    finally:
        context.close()


def verify_plan_literals(source_page, check):
    markup = '<img class="plan-literal-fixture" src="missing-plan-fixture" onerror="globalThis.planLiteralFixture=true"><b>Plan & review</b>'
    for branch in ("diff", "fallback"):
        context = source_page.context.browser.new_context()
        try:
            page = context.new_page()
            page.goto(source_page.url.split("#")[0] + "#epr")
            page.evaluate("""({branch,markup}) => {
                const state = AppStore.getState();
                const record = state.records.osteopathy;
                if (branch === 'diff') record.diffView.studentOriginal = markup;
                else {delete record.diffView; record.studentDraftPlan = markup;}
                localStorage.setItem('ljmu_hub_review_v4', JSON.stringify(state));
            }""", {"branch":branch,"markup":markup})
            page.reload(wait_until="networkidle")
            paragraph = page.locator(".diff-student .diff-text")
            check("saved-state student plan renders literal markup via " + branch,
                  paragraph.inner_text() == markup and paragraph.locator("img,b").count() == 0
                  and not page.evaluate("Boolean(globalThis.planLiteralFixture)"))
        finally:
            context.close()
