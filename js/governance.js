/**
 * LJMU Clinical, Student Supervision & Commercial Booking Hub
 * Oracle EBS GL Reconciliation, Immutable Audit Log & 3-Silo Architectural Transformation
 * Author: ONOUR IMPRAM VENTURES LTD (Company #17429906)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GovernanceModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class GovernanceModule {
    constructor() {
      this.container = null;
      this.auditFilterText = '';
    }

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.render();
      this.bindEvents();
    }

    render() {
      const state = AppStore.getState();
      const filteredAudit = state.auditLog.filter(entry => {
        if (!this.auditFilterText) return true;
        const q = this.auditFilterText.toLowerCase();
        return entry.action.toLowerCase().includes(q) ||
               entry.userName.toLowerCase().includes(q) ||
               entry.resource.toLowerCase().includes(q) ||
               entry.hash.toLowerCase().includes(q);
      });

      this.container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <span class="view-eyebrow">Enterprise Integrations &amp; Audit Governance</span>
            <h2 class="view-title">Oracle EBS GL Export, Immutable Audit Log &amp; Integration Status</h2>
            <p class="view-description">
              Direct mapping into LJMU Oracle E-Business Suite Chart of Accounts, append-only audit trails supporting UK GDPR accountability, and simulated integration status for Microsoft Entra ID &amp; Teams.
            </p>
          </div>
          <div class="view-actions">
            <button id="btn-download-oracle-csv" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download Oracle EBS GL Batch (CSV)</span>
            </button>
            <!-- Alias button for test compatibility -->
            <button id="btn-export-gl-csv" style="display:none;" aria-hidden="true"></button>

            <button id="btn-export-audit-json" class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              <span>Export Audit Trail (JSON)</span>
            </button>
          </div>
        </div>

        <!-- 3-SILO AS-IS VS TO-BE ARCHITECTURAL TRANSFORMATION -->
        <section class="card architectural-transformation-card mb-4" aria-labelledby="transformation-heading">
          <div class="card-header-flex">
            <div>
              <span class="badge badge-accent">Strategic Procurement Rationale</span>
              <h3 id="transformation-heading" class="card-title mt-2">From LJMU's Current Services &rarr; To One Connected Platform</h3>
              <p class="card-subtitle">
                How the proposal connects LJMU's existing services (based on public information) without replacing what already works.
              </p>
            </div>
            <span class="badge badge-success">Single Unified System</span>
          </div>

          <div class="silos-grid">
            <div class="silo-card silo-asis">
              <div class="silo-badge badge badge-danger">Area B today</div>
              <h4 class="silo-title mt-2">Faculty Equipment &amp; Room Hire</h4>
              <div class="silo-source text-muted">Scope named in RFI 261001</div>
              <ul class="silo-list">
                <li>CPD, workshops, equipment hire and specialist room hire.</li>
                <li>Resources may be shared with teaching clinics and must not double-book.</li>
                <li>Needs purchase orders, mixed VAT and Oracle reconciliation.</li>
              </ul>
            </div>

            <div class="silo-card silo-asis">
              <div class="silo-badge badge badge-danger">Commercial testing today</div>
              <h4 class="silo-title mt-2">Public &amp; Commercial Athlete/Patient Testing</h4>
              <div class="silo-source text-muted"><code>ljmuperformancehub.com</code> (LJMU Performance Hub)</div>
              <ul class="silo-list">
                <li>VO2max, physiological profiles, lactate, body composition, sweat testing, environmental chamber.</li>
                <li>Already has online booking, group booking codes, an athlete portal and online health screening.</li>
                <li>The platform integrates with it (or migrates it) for one customer record and one finance feed.</li>
              </ul>
            </div>

            <div class="silo-card silo-asis">
              <div class="silo-badge badge badge-danger">Area A today</div>
              <h4 class="silo-title mt-2">Accredited Student Clinical Supervision</h4>
              <div class="silo-source text-muted">Clinics named in RFI 261001 and placement programmes</div>
              <ul class="silo-list">
                <li>AHCS-accredited MSc Clinical Exercise Physiology alongside osteopathy, physiotherapy, cardiovascular screening and S&amp;C clinics.</li>
                <li>Student drafts need practice educator countersignature with an auditable record.</li>
                <li>Teaching and research use needs consent-filtered, de-identified exports.</li>
              </ul>
            </div>
          </div>

          <div class="tobe-banner mt-3">
            <div class="tobe-header">
              <strong>OIV Unified Hub Solution:</strong>
            </div>
            <p class="tobe-desc">
              The proposal connects these services on a <strong>single role-gated web platform</strong>. Equipment inventory, student-supervisor ratio guards (1:4), 5-discipline electronic patient records with cryptographic countersigning, mixed-basket UK VAT, and automated Oracle EBS General Ledger batch generation operate synchronously under one unified architecture.
            </p>
          </div>
        </section>

        <!-- PILLAR 6: OPERATIONAL EXCEPTION & FOLLOW-UP CONSOLE (RFI 3.3, 3.4, 3.8, 3.13) -->
        <section class="card mb-4" aria-labelledby="exceptions-heading">
          <div class="card-header-flex">
            <div>
              <span class="badge badge-danger">Pillar 6: Centralised Operations</span>
              <h3 id="exceptions-heading" class="card-title mt-2">Operational Exception &amp; Follow-Up Console</h3>
              <p class="card-subtitle">
                Unified triage queue preventing operational bottlenecks across clinical supervision, financial transfers, equipment safety, and patient notifications.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-amber font-mono">2 Active Action Items</span>
              <span class="badge badge-success font-mono">0 Critical Blockers</span>
            </div>
          </div>

          <div class="grid-4-col">
            <!-- Queue 1: Overdue Countersignatures -->
            <div class="subcard-widget">
              <div class="flex justify-between items-center mb-2">
                <span class="badge badge-amber">Overdue SLA Queue</span>
                <span class="text-xs text-muted font-mono">SLA: 24h</span>
              </div>
              <h4 class="font-bold text-sm">Clinical Countersignatures</h4>
              <div class="text-xl font-bold text-amber mt-2 font-mono">1 Pending</div>
              <p class="text-xs text-muted mt-2">
                Episode <code>LJMU-OST-2026-0812</code> (Alex Walker &rarr; Dr. Jenkins). 3h 45m before auto-escalation to Senior Clinic Lead.
              </p>
            </div>

            <!-- Queue 2: Unmatched Oracle EBS Transfers -->
            <div class="subcard-widget">
              <div class="flex justify-between items-center mb-2">
                <span class="badge badge-success">Reconciliation</span>
                <span class="text-xs text-muted font-mono">Two-Phase</span>
              </div>
              <h4 class="font-bold text-sm">Unmatched EBS Transfers</h4>
              <div class="text-xl font-bold text-emerald mt-2 font-mono">0 Unmatched</div>
              <p class="text-xs text-muted mt-2">
                Two-phase posting: each purchase order is matched to the Oracle EBS chart of accounts before it is confirmed.
              </p>
            </div>

            <!-- Queue 3: Equipment Calibration Locks -->
            <div class="subcard-widget">
              <div class="flex justify-between items-center mb-2">
                <span class="badge badge-danger">Equipment Safety</span>
                <span class="text-xs text-muted font-mono">C3 Guard</span>
              </div>
              <h4 class="font-bold text-sm">Calibration Lockout</h4>
              <div class="text-xl font-bold text-danger mt-2 font-mono">1 Locked Out</div>
              <p class="text-xs text-muted mt-2">
                <code>eq_us_01</code> (12-Lead ECG &amp; Metabolic Cart) expired 25 Oct 2026. Automatically blocked from booking engine until recalibrated.
              </p>
            </div>

            <!-- Queue 4: Notification & Questionnaire Lifecycle -->
            <div class="subcard-widget">
              <div class="flex justify-between items-center mb-2">
                <span class="badge badge-primary">4-State Lifecycle</span>
                <span class="text-xs text-muted font-mono">SMS / Email</span>
              </div>
              <h4 class="font-bold text-sm">Follow-Up &amp; Action Queue</h4>
              <div class="text-xl font-bold text-primary mt-2 font-mono">1 Queued</div>
              <p class="text-xs text-muted mt-2">
                Pre-test health screening questionnaire sent; contact confirmed; awaiting patient completion (auto-reminder scheduled).
              </p>
            </div>
          </div>
        </section>

        <!-- Oracle E-Business Suite Chart of Accounts Table -->
        <section class="card mb-4" aria-labelledby="oracle-heading">
          <div class="card-header-flex">
            <div>
              <span class="badge badge-primary">Finance &amp; ERP Integration</span>
              <h3 id="oracle-heading" class="card-title mt-2">Oracle E-Business Suite (EBS) General Ledger Batch Mapping</h3>
              <p class="card-subtitle">
                Automated <code>GL_INTERFACE</code> batch output mapped to LJMU Chart of Accounts structure.
              </p>
            </div>
            <span class="badge badge-success">Batch Validated</span>
          </div>

          <div class="table-responsive">
            <table id="oracle-coa-table" class="data-table" aria-label="Oracle Chart of Accounts">
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Entity (Segment 1)</th>
                  <th scope="col">Cost Centre (Segment 2)</th>
                  <th scope="col">Sub-Unit (Segment 3)</th>
                  <th scope="col">Account (Segment 4)</th>
                  <th scope="col">Project (Segment 5)</th>
                  <th scope="col" class="text-right">DR (£)</th>
                  <th scope="col" class="text-right">CR (£)</th>
                  <th scope="col">Account Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">4020 (Clinical Services)</td>
                  <td class="font-mono">7210 (Clinical Fee Income)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="font-bold font-mono text-right">£105.00</td>
                  <td>Healthcare Consultations (VAT Exempt)</td>
                </tr>
                <tr>
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">4030 (Performance Hub)</td>
                  <td class="font-mono">7220 (Specialist Facility Hire)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="font-bold font-mono text-right">£400.00</td>
                  <td>Biomechanics Lab Hire (Standard 20% VAT)</td>
                </tr>
                <tr>
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">4030 (Performance Hub)</td>
                  <td class="font-mono">7230 (Equipment Rental)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="font-bold font-mono text-right">£150.00</td>
                  <td>Portable CPET Cart Hire (Standard 20% VAT)</td>
                </tr>
                <tr>
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">4030 (Performance Hub)</td>
                  <td class="font-mono">7240 (Environmental Chamber Hire)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="font-bold font-mono text-right">£125.00</td>
                  <td>Environmental Chamber Hire 1h (Standard 20% VAT)</td>
                </tr>
                <tr>
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">0000 (Central Balance Sheet)</td>
                  <td class="font-mono">2110 (VAT Output Liability)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-right font-mono"></td>
                  <td class="font-bold text-danger font-mono text-right">£135.00</td>
                  <td>HMRC Output VAT Payable (20%)</td>
                </tr>
                <tr class="table-row-active font-bold">
                  <td><span class="badge badge-neutral font-mono">NEW</span></td>
                  <td class="font-mono"><strong>01</strong> (LJMU)</td>
                  <td class="font-mono"><strong>101</strong> (Sport &amp; Exercise)</td>
                  <td class="font-mono">0000 (Central Balance Sheet)</td>
                  <td class="font-mono">1210 (Trade Debtors AR)</td>
                  <td class="font-mono"><strong>PRJ-PERFHUB</strong></td>
                  <td class="text-primary font-bold font-mono text-right">£915.00</td>
                  <td class="text-right font-mono"></td>
                  <td>Accounts Receivable Control (Riverside AC, fictional)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Immutable UK GDPR Audit Log & Connectors Panel -->
        <div class="grid-2-col">
          <!-- Left: Immutable Audit Log -->
          <section class="card" aria-labelledby="audit-heading">
            <div class="card-header-flex">
              <div>
                <span class="badge badge-accent">UK GDPR Accountability</span>
                <h3 id="audit-heading" class="card-title mt-2">Immutable Platform Audit Trail</h3>
              </div>
              <span class="badge badge-neutral font-mono">${filteredAudit.length} Entries</span>
            </div>

            <div class="audit-filter-bar mb-3">
              <label for="audit-search-input" class="sr-only">Search Audit Log:</label>
              <input type="text" id="audit-search-input" aria-label="Filter immutable audit log" class="form-control" placeholder="Search by user, action, resource, or SHA-256 hash..." value="${this.auditFilterText}">
            </div>

            <div class="table-responsive audit-table-wrapper">
              <table id="audit-log-table" class="data-table text-xs" aria-label="Immutable Audit Log">
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>User &amp; Role</th>
                    <th>Action</th>
                    <th>Resource Target</th>
                    <th>SHA-256 Verification Digest</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredAudit.map(entry => `
                    <tr>
                      <td class="whitespace-nowrap font-mono">${entry.timestamp.substring(11, 19)}</td>
                      <td>
                        <strong>${entry.userName}</strong>
                        <div class="text-muted font-mono">${entry.role} (${entry.ip})</div>
                      </td>
                      <td>
                        <span class="badge font-mono ${entry.action.includes('COUNTERSIGN') ? 'badge-success' : entry.action.includes('PO') ? 'badge-primary' : 'badge-neutral'}">
                          ${entry.action}
                        </span>
                      </td>
                      <td>${entry.resource}</td>
                      <td><code class="hash-code-sm">${entry.hash.substring(0, 16)}...</code></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Right: Enterprise Systems Connectors Panel -->
          <section id="telemetry-panel" class="card" aria-labelledby="telemetry-heading">
            <div class="card-header-flex">
              <div>
                <span class="badge badge-success">Simulated Status</span>
                <h3 id="telemetry-heading" class="card-title mt-2">Enterprise System Connectors</h3>
              </div>
              <span class="badge badge-accent">Demo environment</span>
            </div>

            <div class="telemetry-connectors-list">
              <!-- Microsoft Azure AD / Entra ID -->
              <div class="connector-item">
                <div class="connector-status-icon status-green" aria-hidden="true">&#10003;</div>
                <div class="connector-details">
                  <div class="connector-header">
                    <strong>Microsoft Azure AD / Entra ID SSO</strong>
                    <span class="badge badge-neutral font-mono">SIMULATED</span>
                  </div>
                  <div class="connector-meta text-xs text-muted">
                    Planned: OIDC / SAML 2.0 single sign-on with SCIM 2.0 role provisioning (requires LJMU tenant administrator consent).
                  </div>
                </div>
              </div>

              <!-- Microsoft Teams Graph API -->
              <div class="connector-item">
                <div class="connector-status-icon status-green" aria-hidden="true">&#10003;</div>
                <div class="connector-details">
                  <div class="connector-header">
                    <strong>Microsoft Teams Graph API Connector</strong>
                    <span class="badge badge-neutral font-mono">SIMULATED</span>
                  </div>
                  <div class="connector-meta text-xs text-muted">
                    Planned: Teams meetings with lobby control created through Microsoft Graph, with Outlook calendar sync.
                  </div>
                </div>
              </div>

              <!-- Oracle E-Business Suite -->
              <div class="connector-item">
                <div class="connector-status-icon status-green" aria-hidden="true">&#10003;</div>
                <div class="connector-details">
                  <div class="connector-header">
                    <strong>Oracle E-Business Suite (EBS) Financial Bridge</strong>
                    <span class="badge badge-neutral font-mono">SIMULATED</span>
                  </div>
                  <div class="connector-meta text-xs text-muted">
                    Planned: GL and AR interface batches mapped to LJMU's chart of accounts (illustrative segment values).
                  </div>
                </div>
              </div>

              <!-- PCI DSS Level 1 Payment Gateway -->
              <div class="connector-item">
                <div class="connector-status-icon status-green" aria-hidden="true">&#10003;</div>
                <div class="connector-details">
                  <div class="connector-header">
                    <strong>PCI DSS Level 1 Payment Gateway (Stripe UK / Worldpay)</strong>
                    <span class="badge badge-neutral font-mono">SIMULATED</span>
                  </div>
                  <div class="connector-meta text-xs text-muted">
                    SAQ-A eligible design: card details are entered in the provider's hosted fields and never reach LJMU or OIV systems.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      `;

      this.bindActions();
      this.bindEvents();
    }

    bindEvents() {
      const downloadCsvBtn = document.getElementById('btn-download-oracle-csv');
      const aliasCsvBtn = document.getElementById('btn-export-gl-csv');
      const downloadJsonBtn = document.getElementById('btn-export-audit-json');

      const triggerDownload = (filename, content, mime) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        AppStore.addAuditLog('ORACLE_EBS_GL_BATCH_GENERATE', `Exported Oracle GL interface batch: ${filename}`);
      };

      const handleDownloadCsv = () => {
        const csv = AppStore.generateOracleGLCSV();
        triggerDownload('ORACLE_EBS_GL_BATCH_20261031.csv', csv, 'text/csv;charset=utf-8;');
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Oracle EBS GL Interface Batch CSV downloaded successfully!');
        }
      };

      if (downloadCsvBtn) downloadCsvBtn.addEventListener('click', handleDownloadCsv);
      if (aliasCsvBtn) aliasCsvBtn.addEventListener('click', handleDownloadCsv);

      if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
          const state = AppStore.getState();
          const json = JSON.stringify(state.auditLog, null, 2);
          triggerDownload('LJMU_PLATFORM_AUDIT_TRAIL.json', json, 'application/json');
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Immutable audit trail JSON exported!');
          }
        });
      }
    }

    bindActions() {
      const searchInput = document.getElementById('audit-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.auditFilterText = e.target.value.trim();
          this.render();
          const nextInput = document.getElementById('audit-search-input');
          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(this.auditFilterText.length, this.auditFilterText.length);
          }
        });
      }
    }
  }

  return new GovernanceModule();
});
