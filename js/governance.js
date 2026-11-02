/** Role-scoped audit events and finance mapping generated from current orders. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GovernanceModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = value => HubDomain.escapeHtml(value);
  class GovernanceWorkspace {
    init(id) { this.container = document.getElementById(id); this.render(); }
    render() {
      if (!this.container) return;
      if (!AppStore.can('governanceRead')) {
        App.renderRestricted(this.container,'Governance follows responsibility','Clinical supervisors review clinical workflow events. Commercial leads review purchase-order events and finance exports. Choose a responsible role to explore this workspace.','manager'); return;
      }
      const finance = AppStore.can('financeExport'), entries = AppStore.getAuditEntries();
      const orders = AppStore.getState().orders.filter(o => o.dateApproved && o.exportStatus === 'READY');
      this.container.innerHTML = `<div class="view-header"><div class="view-title-group"><span class="view-eyebrow">Governance &amp; connected systems</span><h2 class="view-title">Every important action leaves a trace.</h2><p class="view-description">Inspect role-scoped events and the data behind an export. Review, approval and external delivery remain distinct steps.</p></div><div class="view-actions"><button id="btn-refresh-governance" class="btn btn-secondary">Refresh events</button><button id="btn-export-audit" class="btn btn-primary">Export visible audit</button></div></div>
        ${finance ? `<section class="card"><div class="card-header-flex"><div><span class="badge badge-accent">Finance reconciliation</span><h3 class="card-title mt-2">Oracle E-Business Suite · GL mapping</h3><p class="card-subtitle">${orders.length} approved orders · debits and credits derived from current invoice lines.</p></div><button id="btn-export-oracle" class="btn btn-primary">Download mapping CSV</button></div><div class="code-block"><pre id="oracle-csv-preview">${E(AppStore.generateOracleGLCSV())}</pre></div><p class="text-xs text-muted mt-3">Reference mapping with illustrative ledger and account codes. Export readiness is shown here; this browser walkthrough does not send data to Oracle.</p></section>` : `<section class="card"><span class="badge badge-accent">Clinical governance</span><h3 class="card-title mt-2">Review evidence stays connected to the encounter</h3><p class="text-sm">Clinical draft changes, version approvals and consent-filtered research exports are recorded with the acting persona and time. Visit Clinical records to complete a review, then return here to inspect the event.</p></section>`}
        <section class="card"><div class="card-header-flex"><div><h3 class="card-title">Activity audit</h3><p class="card-subtitle">${finance ? 'Commercial and operational events' : 'Clinical and operational events'} from this walkthrough.</p></div><span id="audit-count" class="badge badge-neutral">${entries.length} events</span></div><div class="form-group"><label for="audit-filter">Filter visible events</label><input id="audit-filter" class="form-control" type="search" placeholder="Action, actor or reference" autocomplete="off"></div><div class="table-responsive"><table class="data-table"><caption class="sr-only">Role-scoped audit events</caption><thead><tr><th scope="col">Time (UTC)</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Reference</th><th scope="col">Integrity</th></tr></thead><tbody id="audit-rows"></tbody></table></div><p class="text-xs text-muted mt-3">Session events are chained with SHA-256 when Web Crypto is available. A browser-local record is not a substitute for the server-side audit service in the deployment architecture.</p></section>
        <section class="card"><div class="card-header-flex"><div><h3 class="card-title">University integration map</h3><p class="card-subtitle">Delivery interfaces and their operational purpose.</p></div><span class="badge badge-primary">Configured for the University</span></div><div class="integration-grid">${[
          ['Microsoft Entra ID','Staff and student identity, role assignment and placement-based access.'],
          ['Microsoft Teams','Remote appointment joining, participant roles and consultation context.'],
          ['Oracle E-Business Suite','Approved invoice, tax and cost-centre mappings with reconciliation.'],
          ['Payment provider','Hosted card entry, payment references and authorised refunds.']
        ].map(([name,text]) => `<article class="integration-card"><h4>${name}</h4><p class="text-sm text-muted">${text}</p><span class="badge badge-neutral">Deployment interface</span></article>`).join('')}</div></section>`;
      this.drawAudit('');
      this.container.querySelector('#audit-filter').addEventListener('input', event => this.drawAudit(event.target.value));
      this.container.querySelector('#btn-refresh-governance').addEventListener('click', () => this.render());
      this.container.querySelector('#btn-export-audit').addEventListener('click', () => {
        try { const rows = AppStore.getAuditEntries(); App.download('oiv-reference-audit.json',JSON.stringify(rows,null,2),'application/json'); }
        catch(error) { App.showToast(error.message,true); }
      });
      this.container.querySelector('#btn-export-oracle')?.addEventListener('click', () => {
        try { App.download('oiv-oracle-gl-reference.csv',AppStore.generateOracleGLCSV(),'text/csv;charset=utf-8'); void AppStore.addAuditLog('FINANCE_EXPORT','Oracle GL reference mapping'); }
        catch(error) { App.showToast(error.message,true); }
      });
    }
    drawAudit(query) {
      const rows = AppStore.getAuditEntries().filter(row => [row.action,row.userName,row.resource].join(' ').toLowerCase().includes(query.toLowerCase()));
      this.container.querySelector('#audit-count').textContent = `${rows.length} events`;
      this.container.querySelector('#audit-rows').innerHTML = rows.length ? rows.map(row => `<tr><td class="font-mono text-xs">${E(row.timestamp.replace('T',' ').replace('Z',''))}</td><td>${E(row.userName)}</td><td class="text-xs font-mono">${E(row.action)}</td><td>${E(row.resource)}</td><td><span class="badge ${row.hash ? 'badge-success' : 'badge-neutral'}">${row.hash ? 'SHA-256' : 'Digest unavailable'}</span>${row.hash ? `<details><summary class="text-xs">Inspect digest</summary><code class="hash-code">${E(row.hash)}</code></details>` : ''}</td></tr>`).join('') : '<tr><td colspan="5" class="text-muted">No matching events. Complete a booking, review or order to create an auditable action.</td></tr>';
    }
  }
  return new GovernanceWorkspace();
});
