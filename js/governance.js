(function (root) {
  'use strict';

  let selectedOrder = null;
  let selectedDocument = 'invoice';
  let reportLevel = 'service';

  function visibleAudit(state) {
    if (state.currentRole === 'supervisor') return state.auditLog;
    return state.currentRole === 'manager' ? state.auditLog.filter(l => /^(CART_|PO_|PURCHASE_ORDER_|FINANCE_|ORACLE_|INCOME_|COURSE_GROUP_|COURSE_CAPACITY|AUDIT_LOG_EXPORT)/.test(l.action)) : [];
  }

  function renderGovernanceView() {
    const container = document.getElementById('view-governance');
    if (!container) return;

    const state = root.AppStore.getState();

    if (!['manager','supervisor'].includes(state.currentRole)) {
      container.innerHTML = '<div class="card"><div class="card-body"><h2 class="section-title">Governance workspace</h2><p>Switch to Lab Manager or Supervisor to review the local sample journal and activity log.</p></div></div>';
      return;
    }
    const approved = state.orders.filter(order => order.status.startsWith('APPROVED'));
    const chosen = approved.find(order => order.id === selectedOrder) || approved[0];
    if (!chosen || chosen.id !== selectedOrder) selectedDocument = 'invoice';
    const journal = root.AppStore.latestJournal(chosen?.id,selectedDocument) || root.AppStore.latestJournal(chosen?.id);
    const income = root.AppStore.incomeReport(reportLevel);
    if (!journal) {
      container.innerHTML = '<section class="card"><div class="card-body"><h2 class="section-title">Finance</h2><p>Approve a purchase order to prepare its journal.</p></div></section>';
      return;
    }
    const {order, amounts} = journal;
    const esc = root.AppStore.escapeText;
    const money = n => '£' + n.toFixed(2);
    const pending = state.orders.filter(o => o.status === 'PENDING_PO_VERIFICATION').length;
    const logs = visibleAudit(state);
    container.innerHTML = `
      <div class="section-header"><div class="section-header-copy"><h2 class="section-title">Finance</h2>
      <p class="section-subtitle">Inspect a journal entry or compare income across services.</p></div>
      <div class="header-action-row"><button id="btn-download-oracle-csv" class="btn btn-primary">Download journal CSV</button>
      <button id="btn-export-audit-json" class="btn btn-secondary">Download activity log</button></div></div>
      <div class="grid-2-col mb-4"><div class="card"><div class="card-header"><div><h3 class="card-title">Journal entry</h3><p class="card-subtitle">${esc(journal.document)} · ${esc(order.poNumber)}</p></div>
      </div><div class="card-body"><div class="table-responsive" tabindex="0" role="region" aria-label="Approved order journal">
      <label for="journal-order" class="form-label">Invoice</label><select class="form-control" id="journal-order">
      ${approved.map(o => `<option value="${esc(o.id)}" ${o.id === order.id ? 'selected' : ''}>${esc(o.orderNumber)} · ${esc(o.poNumber)}</option>`).join('')}</select>
      <label for="journal-document" class="form-label">Document</label><select class="form-control mb-3" id="journal-document"><option value="invoice">Original invoice</option>
      ${(order.entries || []).map(e => `<option value="${esc(e.id)}" ${e.id === selectedDocument ? 'selected' : ''}>${{credit:'Credit note',receipt:'Payment receipt',refund:'Refund'}[e.kind]} · ${esc(e.id)}</option>`).join('')}</select>
      <table class="data-table" id="oracle-coa-table"><thead><tr><th>Line</th><th>Sample account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>
      ${amounts.map(([name, sub, acct, dr, cr, centre]) => `<tr><td>${esc(name)}</td><td class="mono">01-${esc(centre)}-${esc(sub)}-${esc(acct)}-PRJ-PERFHUB</td><td>${money(dr)}</td><td>${money(cr)}</td></tr>`).join('')}
      </tbody><tfoot><tr><th colspan="2">Total</th><td>${money(amounts.reduce((n,row) => n + row[3],0))}</td><td>${money(amounts.reduce((n,row) => n + row[4],0))}</td></tr></tfoot></table></div></div></div>
      <div class="card"><div class="card-header"><h3 class="card-title">Invoice to journal</h3></div>
      <div class="card-body"><dl><dt>Purchase order</dt><dd>${esc(order.poNumber)}</dd><dt>Organisation</dt><dd>${esc(order.payingOrg)}</dd>
      <dt>Original invoice</dt><dd>${money(order.totalGross)}</dd><dt>Balance due</dt><dd>${money(root.AppStore.invoiceAccount(order.id).duePence/100)}</dd>${journal.externalReference ? `<dt>Payment reference</dt><dd>${esc(journal.externalReference)}</dd>` : ''}
      ${journal.batch ? `<dt>Remittance</dt><dd>${esc(journal.batch)} · <button id="download-remittance" class="btn btn-secondary">Download allocation CSV</button></dd>` : ''}
      <dt>Orders awaiting approval</dt><dd>${pending}</dd></dl>
      <p>The download uses example account codes. LJMU Finance would confirm the mapping before importing a journal into Oracle.</p></div></div></div>
      <section class="card mb-4"><div class="card-header"><div><h3 class="card-title">Income report</h3><p class="card-subtitle">Approved invoice lines less credit notes. Receipts and refunds settle the balance separately.</p></div>
      <button class="btn btn-secondary" id="download-income">Download income CSV</button></div><div class="card-body"><div class="table-responsive" role="region" tabindex="0" aria-label="Income by service and cost centre">
      <label for="income-group" class="form-label">Group income by</label><select id="income-group" class="form-control mb-3">
      ${Object.entries({service:'Service',activity:'Activity',centre:'Cost centre'}).map(([key,name])=>`<option value="${key}" ${key === reportLevel ? 'selected' : ''}>${name}</option>`).join('')}</select>
      <table class="data-table" id="income-report"><thead><tr><th>${reportLevel === 'activity' ? 'Activity' : 'Cost centre'}</th><th>${reportLevel === 'service' ? 'Service' : 'Coverage'}</th><th>Units</th><th>Net income</th><th>VAT</th></tr></thead><tbody>
      ${income.map(row => `<tr><td>${reportLevel === 'activity' ? esc(row.activity) : esc(row.centre) + ' · ' + esc(row.department)}</td><th scope="row">${reportLevel === 'service' ? esc(row.service) : 'All services'}</th><td>${esc(row.units)}</td><td>${money(row.netPence/100)}</td><td>${money(row.vatPence/100)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><th colspan="3">Total</th><td id="income-net">${money(income.reduce((n,r)=>n+r.netPence,0)/100)}</td><td>${money(income.reduce((n,r)=>n+r.vatPence,0)/100)}</td></tr></tfoot></table></div></div></section>
      <div class="card"><div class="card-header"><div><h3 class="card-title">Activity log</h3><p class="card-subtitle">Search by action, person or reference.</p></div>
      <label>Filter events <input type="search" id="audit-search-input" class="form-control" placeholder="Action, actor or reference"></label></div>
      <div class="card-body"><div class="table-responsive" role="region" tabindex="0" aria-label="Audit events"><table class="data-table" id="audit-log-table"><thead><tr><th>UTC</th><th>Person</th><th>Role</th><th>Action</th><th>Reference</th></tr></thead><tbody id="audit-log-tbody">${renderAuditRows(logs, '')}</tbody></table></div></div></div>`;
    bindGovernanceEvents();
  }

  function renderAuditRows(logs, query) {
    const esc = root.AppStore.escapeText;
    const q = (query || '').trim().toLowerCase();
    const actionNames = {FINANCE_CREDIT:'Credit note issued', FINANCE_RECEIPT:'Payment recorded', FINANCE_REFUND:'Refund recorded', BOOKING_CONFIRMED:'Appointment booked', BOOKING_CHANGED:'Appointment changed', BOOKING_CANCELLED:'Appointment cancelled',
      ROLE_SWITCH:'Role changed', EPR_DRAFT_SAVE:'Note saved', SUPERVISOR_COUNTERSIGN:'Note signed', PO_SUBMIT:'Order submitted',
      PURCHASE_ORDER_APPROVE:'Order approved', CART_ITEM_ADDED:'Basket updated', ORACLE_GL_CSV_DOWNLOAD:'Journal downloaded'};
    const filtered = q
      ? logs.filter(l =>
          l.userName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (actionNames[l.action] || l.action.replaceAll("_"," ")).toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          l.hash.toLowerCase().includes(q)
        )
      : logs;

    if (!filtered.length) return '<tr><td colspan="5">No events match this search.</td></tr>';
    return filtered.map(log => `
      <tr>
        <td class="mono text-xs">${esc(log.timestamp)}</td>
        <td><strong>${esc(log.userName)}</strong></td>
        <td><span class="badge badge-neutral">${({patient:'Patient',student:'Student',manager:'Lab manager',booker:'Client booker',supervisor:'Supervisor'})[log.role] || 'Staff'}</span></td>
        <td><code class="action-code">${esc(actionNames[log.action] || log.action.toLowerCase().replaceAll('_',' '))}</code></td>
        <td class="text-xs">${esc(log.resource)}</td>

      </tr>
    `).join('');
  }

  function refreshAudit() {
    const tbody = document.getElementById('audit-log-tbody');
    if (tbody) tbody.innerHTML = renderAuditRows(visibleAudit(root.AppStore.getState()),document.getElementById('audit-search-input').value);
  }

  function bindGovernanceEvents() {
    const invoice = document.getElementById('journal-order');
    const documentSelect = document.getElementById('journal-document');
    invoice.addEventListener('change', () => {
      selectedOrder = invoice.value; selectedDocument = 'invoice';
      renderGovernanceView(); document.getElementById('journal-order').focus();
    });
    documentSelect.addEventListener('change', () => {
      selectedOrder = invoice.value; selectedDocument = documentSelect.value;
      renderGovernanceView(); document.getElementById('journal-document').focus();
    });
    document.getElementById('income-group').addEventListener('change', event => {
      reportLevel = event.target.value;
      renderGovernanceView(); document.getElementById('income-group').focus();
    });
    document.getElementById('download-income').addEventListener('click', async () => {
      root.App.downloadFile('LJMU_sample_income.csv',root.AppStore.incomeCSV(reportLevel),'text/csv');
      await root.AppStore.addAuditLog('INCOME_REPORT_EXPORT','Income by service and cost centre');
    });
    document.getElementById('download-remittance')?.addEventListener('click', () => {
      const entry = root.AppStore.latestJournal(invoice.value,documentSelect.value);
      root.App.downloadFile('LJMU_' + entry.batch + '.csv',root.AppStore.remittanceCSV(entry.batch),'text/csv');
    });
    document.getElementById('btn-download-oracle-csv').addEventListener('click', async () => {
      const csv = root.AppStore.generateOracleGLCSV(document.getElementById('journal-order').value,document.getElementById('journal-document').value);
      root.App.downloadFile('LJMU_sample_GL_journal.csv', csv, 'text/csv');
      await root.AppStore.addAuditLog('ORACLE_GL_CSV_DOWNLOAD', 'Downloaded approved order sample journal');
    });

    document.getElementById('btn-export-audit-json').addEventListener('click', async () => {
      root.App.downloadFile('LJMU_sample_activity.json', JSON.stringify(visibleAudit(root.AppStore.getState()), null, 2), 'application/json');
      await root.AppStore.addAuditLog('AUDIT_LOG_EXPORT', 'Exported visible activity log');
    });

    document.getElementById('audit-search-input').addEventListener('input', refreshAudit);
  }

  root.GovernanceModule = {

    render: renderGovernanceView, refreshAudit
  };
})(typeof self !== 'undefined' ? self : this);
