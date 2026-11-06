def verify_manipulated_saved_state_rendering(source_page, check):
    context = source_page.context.browser.new_context()
    try:
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(source_page.url.split("#")[0] + "#commercial")
        values = page.evaluate("""() => {
          const s = structuredClone(AppStore.getState());
          const marker = name => '<b data-state-probe="' + name + '">' + name + ' & "text"</b>';
          const values = Object.fromEntries(['service','stream','facility','duration','cart','order','line','batch','time','person','action'].map(name => [name,marker(name)]));
          values.attribute = 'sample" data-state-attribute="injected';
          Object.assign(s.services[0], {id:values.attribute,name:values.service,stream:values.stream,facility:values.facility,duration:values.duration});
          Object.assign(s.cart[0], {serviceId:values.attribute,name:values.cart});
          Object.assign(s.orders[0], {id:values.attribute,orderNumber:values.order,oracleBatchId:values.batch});
          s.orders[0].items[0].name = values.line;
          s.auditLog = [{id:'state-render-probe',timestamp:values.time,userName:values.person,role:'supervisor',action:values.action,resource:'Synthetic saved-state fixture',hash:''}];
          localStorage.setItem('ljmu_hub_review_v4',JSON.stringify(s));
          return values;
        }""")
        page.reload()
        page.locator("#view-commercial").wait_for(state="visible")
        catalogue = page.locator(".service-catalogue-list").inner_text()
        for key in ["service", "stream", "facility", "duration"]:
            check("manipulated saved catalogue " + key + " renders as literal text", values[key] in catalogue)
        check("manipulated saved catalogue identifier stays inside its attribute",
              page.locator(".btn-add-cart").first.get_attribute("data-service-id") == values["attribute"])
        check("manipulated saved basket name renders literally in text and its accessible name",
              values["cart"] in page.locator("#basket-summary").inner_text()
              and page.locator("[data-remove]").first.get_attribute("aria-label") == "Remove one " + values["cart"])
        check("manipulated saved basket identifier stays inside its attribute",
              page.locator("[data-remove]").first.get_attribute("data-remove") == values["attribute"])
        check("manipulated saved order identifier stays inside its attribute",
              page.locator("#btn-approve-po").get_attribute("data-order-id") == values["attribute"])
        page.click("#btn-view-invoice")
        invoice = page.locator("#invoice-modal").inner_text()
        for key in ["order", "line", "batch"]:
            check("manipulated saved invoice " + key + " renders as literal text", values[key] in invoice)
        page.keyboard.press("Escape")
        page.click("#tab-governance")
        audit = page.locator("#audit-log-table").inner_text()
        for key in ["time", "person", "action"]:
            check("manipulated saved audit " + key + " renders as literal text", values[key] in audit)
        page.fill("#audit-search-input", "Synthetic saved-state fixture")
        check("filtered audit rows keep manipulated fields literal",
              values["person"] in page.locator("#audit-log-table").inner_text())
        check("manipulated saved scalars create no HTML elements or attributes",
              page.locator("[data-state-probe],[data-state-attribute]").count() == 0)
        mappings = page.evaluate("""() => {
          const markers = ['centre','subunit','account'].map(name => '<b data-state-probe="' + name + '">' + name + '</b>');
          const latestJournal = AppStore.latestJournal.bind(AppStore);
          const incomeReport = AppStore.incomeReport.bind(AppStore);
          AppStore.latestJournal = (...args) => {
            const result = latestJournal(...args);
            return result && {...result,amounts:result.amounts.map(row => [row[0],markers[1],markers[2],row[3],row[4],markers[0]])};
          };
          AppStore.incomeReport = (...args) => incomeReport(...args).map(row => ({...row,centre:markers[0]}));
          GovernanceModule.render();
          return markers;
        }""")
        check("synthetic journal adapter account segments render literally",
              all(value in page.locator("#oracle-coa-table").inner_text() for value in mappings))
        check("synthetic income adapter cost centre renders literally",
              mappings[0] in page.locator("#income-report").inner_text())
        check("synthetic journal and income mappings create no HTML elements",
              page.locator("#view-governance [data-state-probe]").count() == 0)
        check("saved-state rendering journey has no JavaScript errors", not errors)
    finally:
        context.close()
