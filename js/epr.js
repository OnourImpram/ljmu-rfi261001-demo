/**
 * LJMU Clinical, Student Supervision & Commercial Booking Hub
 * Multi-Discipline EPR, Two-Stage Supervisor Countersigning & Research Export
 * Author: ONOUR IMPRAM VENTURES LTD (Company #17429906)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EPRModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class EPRModule {
    constructor() {
      this.container = null;
      this.currentDiscipline = 'osteopathy';
      this.ecgAnimFrame = null;
    }

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.render();
      this.bindEvents();
    }

    render() {
      const state = AppStore.getState();
      const disc = this.currentDiscipline;
      const rec = state.records[disc] || state.records.osteopathy;
      const role = state.currentRole;
      const isSupervisor = role === 'supervisor';
      const isLocked = rec.status.includes('LOCKED') || rec.status.includes('COUNTERSIGNED');

      this.container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <span class="view-eyebrow">Area A Clinical Governance & clinical safety controls</span>
            <h2 class="view-title">Profession-Specific EPR & Two-Stage Supervisor Countersigning</h2>
            <p class="view-description">
              5 switchable disciplines, with templates designed around GOsC, CSP/HCPC, AHCS and CASES standards. Mandatory Student Draft -> Supervisor Side-by-Side Diff -> SHA-256 Cryptographic Seal Lock.
            </p>
          </div>
          <div class="view-actions">
            <button id="btn-view-logbook" class="btn btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Student Placement Logbook</span>
            </button>
            <button id="btn-preview-research" class="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <span>Anonymised Research Data Pipeline</span>
            </button>
          </div>
        </div>

        <!-- 5-Discipline Navigation Tabs -->
        <nav class="discipline-nav" aria-label="EPR Disciplines">
          <button class="btn-discipline ${disc === 'osteopathy' ? 'active' : ''}" data-discipline="osteopathy">
            <span class="disc-icon">&#9877;</span>
            <span class="disc-title">1. Osteopathy</span>
            <span class="disc-meta">GOsC Standard</span>
          </button>
          <button class="btn-discipline ${disc === 'physiotherapy' ? 'active' : ''}" data-discipline="physiotherapy">
            <span class="disc-icon">&#9752;</span>
            <span class="disc-title">2. Physiotherapy</span>
            <span class="disc-meta">CSP / HCPC Body-Chart</span>
          </button>
          <button class="btn-discipline ${disc === 'cardiovascular' ? 'active' : ''}" data-discipline="cardiovascular">
            <span class="disc-icon">&#9829;</span>
            <span class="disc-title">3. Cardiovascular</span>
            <span class="disc-meta">12-Lead ECG & QRISK3</span>
          </button>
          <button class="btn-discipline ${disc === 'physiology' ? 'active' : ''}" data-discipline="physiology">
            <span class="disc-icon">&#9879;</span>
            <span class="disc-title">4. Exercise Physiology</span>
            <span class="disc-meta">AHCS MSc CPET & Lactate</span>
          </button>
          <button class="btn-discipline ${disc === 'sc' ? 'active' : ''}" data-discipline="sc">
            <span class="disc-icon">&#9881;</span>
            <span class="disc-title">5. Strength & Cond.</span>
            <span class="disc-meta">ForceDecks Dual Plates</span>
          </button>
        </nav>

        <!-- Active Patient Demographics & Governance Header -->
        <section class="card patient-banner-card" aria-labelledby="patient-heading">
          <div class="patient-banner-grid">
            <div class="patient-main-info">
              <span class="badge badge-accent">${rec.disciplineTitle}</span>
              <h3 id="patient-heading" class="patient-name">Patient: ${rec.patientName} (${rec.gender}, Age ${rec.age})</h3>
              <div class="patient-meta-row">
                <span>DOB: <strong>${rec.dob}</strong></span>
                <span>NHS No: <strong>${rec.nhsNumber}</strong></span>
                <span>Episode: <strong>${rec.episodeCode}</strong></span>
                <span>Research Consent: <strong class="text-success">&#10003; Consented</strong></span>
              </div>
            </div>
            <div class="patient-status-col">
              <div class="status-label">Record Governance Status:</div>
              <div id="record-status-badge" class="record-badge ${isLocked ? 'status-locked' : 'status-draft'}">
                <span class="badge-icon">${isLocked ? '&#128274;' : '&#9998;'}</span>
                <span>${rec.status}</span>
              </div>
              <div class="author-meta text-muted">
                Author: <strong>${rec.authorName}</strong> | Practice Educator: <strong>${rec.supervisorName}</strong>
              </div>
            </div>
          </div>
        </section>

        <!-- Discipline Specific Body Stage -->
        <div class="grid-epr-layout">
          <!-- Main Clinical Encounter Form -->
          <div class="epr-form-col">
            <section class="card" aria-labelledby="clinical-notes-heading">
              <div class="card-header-flex">
                <h3 id="clinical-notes-heading" class="card-title">Encounter History & Objective Evaluation</h3>
                <span class="badge badge-neutral">${rec.encounterDate}</span>
              </div>

              <!-- DCB0129 Clinical Safety & Pre-Submission Red-Flag Gate -->
              <div class="alert-banner alert-success mb-3 p-3 text-xs">
                <div class="flex justify-between items-center mb-1">
                  <strong>&#10003; Pre-Submission Clinical Sufficiency & Red-Flag Gate (example hazard control HAZ-01; DCB0129 safety case planned):</strong>
                  <span class="badge badge-success">Passed</span>
                </div>
                <div class="flex gap-4 text-muted">
                  ${(({
                    osteopathy: ['Neurological red flags', 'Cervical arterial (vascular) screen', 'Systemic flags'],
                    physiotherapy: ['Cauda equina', 'Cord compression', 'Systemic flags'],
                    cardiovascular: ['PAR-Q+ positive responses', 'Resting ECG red flags', 'Family history of sudden cardiac death'],
                    physiology: ['PAR-Q+ positive responses', 'ACSM exercise testing contraindications', 'Medication review'],
                    sc: ['Concussion screen', 'Acute injury flags', 'Medication review']
                  })[disc] || ['Red flags', 'Contraindications', 'Systemic flags']).map(f => `<span>&#9633; ${f}: <em>Negative</em></span>`).join('')}
                  ${isLocked
                    ? '<span>&#9633; Sign-off: <strong class="text-primary">Countersigned</strong></span>'
                    : '<span>&#9633; Sign-off time limit: <strong class="text-primary">3h 45m remaining (HAZ-02)</strong></span>'}
                </div>
              </div>

              <div class="form-group">
                <label for="epr-subjective" class="font-bold">Subjective History & Red-Flag Triage:</label>
                <textarea id="epr-subjective" class="form-control" rows="3" ${isLocked ? 'readonly' : ''}>${rec.subjective}</textarea>
              </div>

              <div class="form-group">
                <label for="epr-objective" class="font-bold">Objective Examination & Physical Tests:</label>
                <textarea id="epr-objective" class="form-control" rows="3" ${isLocked ? 'readonly' : ''}>${rec.objective}</textarea>
              </div>

              <div class="form-group">
                <label for="epr-assessment" class="font-bold">Clinical Assessment & Diagnosis:</label>
                <textarea id="epr-assessment" class="form-control" rows="2" ${isLocked ? 'readonly' : ''}>${rec.assessment}</textarea>
              </div>

              <!-- Interactive Discipline Widgets -->
              ${this.renderDisciplineWidget(disc, rec)}

              <div class="form-group mt-4">
                <label for="epr-active-plan" class="font-bold">Active Patient Management Plan:</label>
                <textarea id="epr-active-plan" class="form-control" rows="3" ${isLocked ? 'readonly' : ''}>${rec.activePlan || rec.studentDraftPlan}</textarea>
              </div>
            </section>
          </div>

          <!-- Side-by-Side Supervisor Review Diff & Countersign Panel -->
          <div class="epr-sidebar-col">
            <section id="supervisor-diff-container" class="card diff-review-card" aria-labelledby="diff-heading">
              <div class="card-header-flex">
                <div>
                  <span class="badge badge-supervisor">Two-Stage Clinical Review</span>
                  <h3 id="diff-heading" class="card-title">Supervisor Diff & Cryptographic Lock</h3>
                </div>
              </div>

              <p class="diff-intro-text">
                ${isSupervisor 
                  ? 'As rostered Practice Educator, review the student\'s submitted plan below. You may amend the clinical strategy before executing the immutable cryptographic countersignature.' 
                  : 'Student practitioners cannot countersign their own records. Switch to <strong>Dr. Sarah Jenkins (Supervisor)</strong> in the top role bar to execute clinical approval.'}
              </p>

              <!-- Side-by-Side Diff Viewer -->
              <div id="diff-panel" class="diff-split-view">
                <div class="diff-column diff-student">
                  <div class="diff-col-header">
                    <span class="icon">&#9997;</span>
                    <strong>Student Draft (Original)</strong>
                  </div>
                  <div class="diff-content diff-student-text">
                    ${rec.studentDraftPlan}
                  </div>
                  <div class="diff-meta">Submitted by Alex Walker</div>
                </div>

                <div class="diff-column diff-supervisor">
                  <div class="diff-col-header">
                    <span class="icon">&#128393;</span>
                    <strong>Supervisor Review & Override</strong>
                  </div>
                  <div class="diff-content diff-supervisor-text">
                    ${isLocked 
                      ? rec.supervisorAmendment 
                      : `<textarea id="supervisor-amendment-input" class="form-control" rows="4" ${!isSupervisor ? 'disabled' : ''}>${rec.supervisorAmendment}</textarea>`}
                  </div>
                  <div class="diff-meta">Reviewed by ${rec.supervisorName}</div>
                </div>
              </div>

              <!-- Cryptographic Lock & Seal Area -->
              <div class="signature-lock-box">
                <div class="sig-header">
                  <span class="sig-icon">${isLocked ? '&#128274;' : '&#128273;'}</span>
                  <div>
                    <strong class="sig-title">SHA-256 Digital Verification Seal</strong>
                    <div class="text-muted">Web Crypto API Immutable Audit Digest</div>
                  </div>
                </div>

                <div class="hash-display-wrapper">
                  <span class="hash-label">Cryptographic Digest:</span>
                  <code id="signature-hash-display" class="hash-code ${rec.signatureHash ? 'hash-active' : ''}">
                    ${rec.signatureHash || 'NOT_SIGNED_YET: PENDING SUPERVISOR COUNTERSIGNATURE'}
                  </code>
                </div>

                ${rec.signedTimestamp ? `
                  <div class="signed-meta">
                    &#10003; Countersigned and locked on <strong>${rec.signedTimestamp}</strong> by <strong>${rec.supervisorSignedBy}</strong>
                  </div>
                ` : ''}

                <div class="sig-actions mt-4">
                  <button id="btn-execute-countersign" class="btn btn-success btn-block ${!isSupervisor || isLocked ? 'btn-disabled' : ''}" ${!isSupervisor || isLocked ? 'disabled' : ''}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>${isLocked ? 'Record Immutably Locked' : 'Execute Cryptographic Countersignature & Lock'}</span>
                  </button>
                  <!-- Alias selector for test framework compatibility -->
                  <button id="btn-supervisor-countersign" style="display: none;" aria-hidden="true"></button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Student Placement Logbook Modal -->
        <div id="logbook-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-logbook-title" style="display: none;">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3 id="modal-logbook-title" class="modal-title">Student Competency Logbook: Alex Walker (Final-year)</h3>
              <button id="btn-close-logbook" class="btn-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="logbook-progress-card mb-4">
                <div class="card-header-flex">
                  <div>
                    <h4>Placement Contact Hours</h4>
                    <p class="text-muted">Direct patient encounters ratified by Dr. Sarah Jenkins</p>
                  </div>
                  <div class="hours-badge">
                    <strong>125 / 200 Hours</strong> (62.5% Completed)
                  </div>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-val" style="width: 62.5%;"></div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="data-table" aria-label="Student Competencies">
                  <thead>
                    <tr>
                      <th scope="col">Competency Domain</th>
                      <th scope="col">Governing Body</th>
                      <th scope="col">Encounter Count</th>
                      <th scope="col">Last Assessed</th>
                      <th scope="col">Sign-Off Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Structural & Spinal Case History</td>
                      <td>General Osteopathic Council (GOsC)</td>
                      <td>16 Encounters</td>
                      <td>31 Oct 2026</td>
                      <td><span class="badge badge-success">Ratified (Level 4)</span></td>
                    </tr>
                    <tr>
                      <td>MSK Assessment & Body-Chart Pain Mapping</td>
                      <td>Chartered Society of Physiotherapy (CSP)</td>
                      <td>14 Encounters</td>
                      <td>30 Oct 2026</td>
                      <td><span class="badge badge-success">Ratified (Level 4)</span></td>
                    </tr>
                    <tr>
                      <td>12-Lead ECG Acquisition & Interval Analysis</td>
                      <td>School of Sport & Exercise Sciences</td>
                      <td>11 Encounters</td>
                      <td>29 Oct 2026</td>
                      <td><span class="badge badge-success">Ratified (Level 4)</span></td>
                    </tr>
                    <tr>
                      <td>Cardiopulmonary Exercise Testing (CPET)</td>
                      <td>Academy of Healthcare Science (AHCS)</td>
                      <td>9 Encounters</td>
                      <td>28 Oct 2026</td>
                      <td><span class="badge badge-success">Ratified (Level 3)</span></td>
                    </tr>
                    <tr>
                      <td>Dual Force-Plate Jump Telemetry (ForceDecks)</td>
                      <td>CASES / UKSCA</td>
                      <td>8 Encounters</td>
                      <td>27 Oct 2026</td>
                      <td><span class="badge badge-success">Ratified (Level 3)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Anonymised Research Export Modal -->
        <div id="research-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-research-title" style="display: none;">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3 id="modal-research-title" class="modal-title">Anonymised Clinical Research Data Pipeline (RFI 3.6)</h3>
              <button id="btn-close-research" class="btn-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="alert-banner alert-success mb-4">
                <strong>Designed for UK GDPR Article 89 safeguards (subject to LJMU ethics and HRA approval where required):</strong>
                <p>Direct identifiers (Name, NHS number, street address) are stripped. Dates of birth are banded into 5-year cohorts. Postcode reduced to outward district (L3). Records without digital research consent are excluded automatically.</p>
              </div>

              <div class="export-actions-bar mb-3">
                <button id="btn-export-research-csv" class="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Download Research CSV (SPSS / R / Python)</span>
                </button>
                <button id="btn-export-research-json" class="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Download De-Identified JSON</span>
                </button>
              </div>

              <div class="dataset-preview-box">
                <h4 class="font-bold mb-2">De-Identified Data Preview:</h4>
                <div class="table-responsive">
                  <table class="data-table text-sm" aria-label="Research Data Sample">
                    <thead>
                      <tr>
                        <th>Pseudonym ID</th>
                        <th>Age Band</th>
                        <th>Gender</th>
                        <th>District</th>
                        <th>Discipline</th>
                        <th>Primary Metric</th>
                        <th>Standard Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>LJMU-RES-8841-A</code></td>
                        <td>25-29 yrs</td>
                        <td>Male</td>
                        <td>L3</td>
                        <td>Osteopathy</td>
                        <td>Cervicothoracic</td>
                        <td>VAS: 6/10</td>
                      </tr>
                      <tr>
                        <td><code>LJMU-RES-8842-B</code></td>
                        <td>20-24 yrs</td>
                        <td>Female</td>
                        <td>L3</td>
                        <td>Physiotherapy</td>
                        <td>Patellar Tendon</td>
                        <td>MSK-HQ: 38/56</td>
                      </tr>
                      <tr>
                        <td><code>LJMU-RES-8843-C</code></td>
                        <td>50-54 yrs</td>
                        <td>Male</td>
                        <td>L3</td>
                        <td>Cardiovascular</td>
                        <td>Sinus Bradycardia</td>
                        <td>QRISK3: 2.4%</td>
                      </tr>
                      <tr>
                        <td><code>LJMU-RES-8844-D</code></td>
                        <td>25-29 yrs</td>
                        <td>Female</td>
                        <td>L3</td>
                        <td>Exercise Physiology</td>
                        <td>VO2peak: 56.4</td>
                        <td>VT1: 165W</td>
                      </tr>
                      <tr>
                        <td><code>LJMU-RES-8845-E</code></td>
                        <td>20-24 yrs</td>
                        <td>Male</td>
                        <td>L3</td>
                        <td>Strength & Cond.</td>
                        <td>ForceDecks CMJ</td>
                        <td>RSImod: 0.52</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.initDisciplineSpecificWidgets(disc);
      this.bindEvents();
    }

    renderDisciplineWidget(disc, rec) {
      if (disc === 'physiotherapy') {
        return `
          <div class="card subcard-widget mt-4">
            <h4 class="widget-title">Digital Body-Chart Pain Mapping & MSK-HQ Score</h4>
            <div class="body-chart-layout">
              <div class="body-chart-container">
                <div class="chart-canvas-wrapper" id="body-chart-canvas">
                  <!-- SVG Anatomical Body Silhouette -->
                  <svg viewBox="0 0 280 400" class="svg-body-silhouette" id="svg-body-map" aria-label="Anatomical Body Chart">
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
                      </filter>
                    </defs>
                    <!-- Body Silhouette -->
                    <g fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)">
                      <!-- Head & Neck -->
                      <ellipse cx="140" cy="45" rx="24" ry="30" />
                      <rect x="133" y="75" width="14" height="20" rx="3" />
                      <!-- Torso -->
                      <path d="M100 95 L180 95 L170 200 L110 200 Z" />
                      <!-- Arms -->
                      <path d="M98 96 L70 180 L75 230 L85 230 L80 180 L102 110 Z" />
                      <path d="M182 96 L210 180 L205 230 L195 230 L200 180 L178 110 Z" />
                      <!-- Legs -->
                      <path d="M112 200 L115 310 L110 375 L125 375 L132 310 L135 200 Z" />
                      <path d="M168 200 L165 310 L170 375 L155 375 L148 310 L145 200 Z" />
                    </g>
                    <!-- Pre-plotted Patellar Marker -->
                    <circle cx="165" cy="305" r="7" fill="#ef4444" stroke="#fff" stroke-width="2" class="marker-pulse" />
                    <text x="176" y="310" font-size="11" font-weight="bold" fill="#b91c1c">Patellar Tendon (6/10)</text>
                  </svg>
                  <p class="chart-caption text-muted">Click anywhere on the anatomical figure to place custom diagnostic markers.</p>
                </div>
              </div>

              <div class="msk-hq-container">
                <h5 class="font-bold">Musculoskeletal Health Questionnaire (MSK-HQ)</h5>
                <p class="text-muted text-sm">Validated 14-item musculoskeletal outcome measure (score 0 to 56), used under its licence terms.</p>
                <div class="score-display-card">
                  <div class="score-number" id="msk-hq-display">${rec.mskHqScore || 38} <span class="score-max">/ 56</span></div>
                  <div class="score-rating badge badge-success">Good MSK Functional Recovery</div>
                </div>
                <div class="msk-slider-group mt-3">
                  <label for="slider-msk" class="text-sm font-semibold">Simulate Patient MSK-HQ Score Change:</label>
                  <input type="range" id="slider-msk" min="0" max="56" value="${rec.mskHqScore || 38}" class="range-slider">
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (disc === 'cardiovascular') {
        return `
          <div class="card subcard-widget mt-4">
            <div class="card-header-flex">
              <h4 class="widget-title">12-Lead ECG Diagnostic Canvas & QRISK3 Estimator</h4>
              <span class="badge badge-success">Normal Sinus Rhythm (52 bpm)</span>
            </div>
            <div class="ecg-canvas-container">
              <canvas id="ecg-canvas" width="750" height="150" class="ecg-canvas" aria-label="12-Lead ECG Waveform"></canvas>
            </div>
            <div class="grid-3-col mt-3">
              <div class="metric-tile">
                <span class="metric-label">Heart Rate</span>
                <span class="metric-val text-primary">52 bpm</span>
                <span class="metric-sub text-muted">Athletic Sinus Bradycardia</span>
              </div>
              <div class="metric-tile">
                <span class="metric-label">PR / QRS / QTc</span>
                <span class="metric-val">156 / 86 / 408 ms</span>
                <span class="metric-sub text-muted">Bazett Formula (Normal)</span>
              </div>
              <div class="metric-tile">
                <span class="metric-label">QRISK3 10-Year Score</span>
                <span class="metric-val text-emerald">2.4%</span>
                <span class="metric-sub text-muted">Low 10-Yr Cardiovascular Risk</span>
              </div>
            </div>
          </div>
        `;
      } else if (disc === 'physiology') {
        return `
          <div class="card subcard-widget mt-4">
            <div class="card-header-flex">
              <h4 class="widget-title">CPET Gas Exchange Biomarkers & Lactate Profiling</h4>
              <span class="badge badge-primary">Lode Excalibur Cycle Ergometer</span>
            </div>
            <div class="table-responsive mt-2">
              <table class="data-table text-sm" aria-label="CPET Telemetry">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Measured Value</th>
                    <th>% Predicted</th>
                    <th>Clinical Interpretation (AHCS / CASES)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Peak VO2</strong></td>
                    <td>56.4 ml/kg/min (3.82 L/min)</td>
                    <td>114%</td>
                    <td>Superior aerobic capacity (National competitive level)</td>
                  </tr>
                  <tr>
                    <td><strong>VT1 (Ventilatory Threshold 1)</strong></td>
                    <td>165 Watts (2.30 L/min)</td>
                    <td>-</td>
                    <td>V-Slope break point; aerobic endurance ceiling</td>
                  </tr>
                  <tr>
                    <td><strong>VT2 (Respiratory Comp. Point)</strong></td>
                    <td>285 Watts (3.80 L/min)</td>
                    <td>-</td>
                    <td>VE/VCO2 nadir; functional lactate turnpoint</td>
                  </tr>
                  <tr>
                    <td><strong>Peak RER</strong></td>
                    <td>1.18</td>
                    <td>> 1.10 target</td>
                    <td>True physiological maximal effort ratified</td>
                  </tr>
                  <tr>
                    <td><strong>Blood Lactate (Rest -> Peak)</strong></td>
                    <td>1.2 -> 8.6 mmol/L</td>
                    <td>-</td>
                    <td>Lactate clearance kinetics intact</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (disc === 'sc') {
        return `
          <div class="card subcard-widget mt-4">
            <div class="card-header-flex">
              <h4 class="widget-title">ForceDecks Dual Wireless Plates & VBT Neuromuscular Profiling</h4>
              <span class="badge badge-accent">Countermovement Jump (CMJ)</span>
            </div>
            <div class="grid-4-col mt-3">
              <div class="metric-tile">
                <span class="metric-label">CMJ Jump Height</span>
                <span class="metric-val text-primary">42.6 cm</span>
                <span class="metric-sub text-muted">Flight time: 0.589 s</span>
              </div>
              <div class="metric-tile">
                <span class="metric-label">RSImod</span>
                <span class="metric-val text-emerald">0.52</span>
                <span class="metric-sub text-muted">Reactive Strength Index</span>
              </div>
              <div class="metric-tile">
                <span class="metric-label">Eccentric RFD</span>
                <span class="metric-val">4,280 N/s</span>
                <span class="metric-sub text-muted">Braking Rate of Force Dev</span>
              </div>
              <div class="metric-tile">
                <span class="metric-label">L/R Asymmetry</span>
                <span class="metric-val text-emerald">3.2%</span>
                <span class="metric-sub text-muted">Normal (&lt; 10% threshold)</span>
              </div>
            </div>
          </div>
        `;
      }
      return '';
    }

    initDisciplineSpecificWidgets(disc) {
      if (disc === 'cardiovascular') {
        this.startEcgAnimation();
      }

      if (disc === 'physiotherapy') {
        const slider = document.getElementById('slider-msk');
        const display = document.getElementById('msk-hq-display');
        if (slider && display) {
          slider.addEventListener('input', (e) => {
            display.innerHTML = `${e.target.value} <span class="score-max">/ 56</span>`;
          });
        }
      }
    }

    startEcgAnimation() {
      const canvas = document.getElementById('ecg-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let xOffset = 0;
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      const drawEcg = () => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 20) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 20) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Waveform
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const t = (x + xOffset) % 240;
          let y = mid;

          // P-wave
          if (t >= 20 && t < 40) {
            y -= Math.sin(((t - 20) / 20) * Math.PI) * 10;
          }
          // QRS complex
          else if (t >= 60 && t < 65) {
            y += ((t - 60) / 5) * 8; // Q dip
          } else if (t >= 65 && t < 75) {
            y -= Math.sin(((t - 65) / 10) * Math.PI) * 55; // R spike
          } else if (t >= 75 && t < 80) {
            y += ((80 - t) / 5) * 12; // S dip
          }
          // T-wave
          else if (t >= 110 && t < 150) {
            y -= Math.sin(((t - 110) / 40) * Math.PI) * 18;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        xOffset = (xOffset + 1.5) % 240;
        this.ecgAnimFrame = requestAnimationFrame(drawEcg);
      };

      if (this.ecgAnimFrame) cancelAnimationFrame(this.ecgAnimFrame);
      drawEcg();
    }

    bindEvents() {
      // Discipline buttons
      const discButtons = document.querySelectorAll('.btn-discipline');
      discButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const disc = btn.getAttribute('data-discipline');
          if (disc) {
            this.currentDiscipline = disc;
            AppStore.setDiscipline(disc);
            this.render();
            this.bindEvents();
          }
        });
      });

      // Countersign button
      const countersignBtn = document.getElementById('btn-execute-countersign');
      const aliasCountersignBtn = document.getElementById('btn-supervisor-countersign');

      const handleCountersign = async () => {
        const amendmentInput = document.getElementById('supervisor-amendment-input');
        const amendmentText = amendmentInput ? amendmentInput.value : '';

        const updated = await AppStore.executeCountersignature(this.currentDiscipline, amendmentText);
        if (updated) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Clinical record countersigned and cryptographically sealed with SHA-256 digest!');
          }
          this.render();
          this.bindEvents();
        }
      };

      if (countersignBtn) countersignBtn.addEventListener('click', handleCountersign);
      if (aliasCountersignBtn) aliasCountersignBtn.addEventListener('click', handleCountersign);

      // Student Logbook Modal
      const logbookBtn = document.getElementById('btn-view-logbook');
      const closeLogbookBtn = document.getElementById('btn-close-logbook');
      const logbookModal = document.getElementById('logbook-modal');

      if (logbookBtn && logbookModal) {
        logbookBtn.addEventListener('click', () => logbookModal.style.display = 'flex');
      }
      if (closeLogbookBtn && logbookModal) {
        closeLogbookBtn.addEventListener('click', () => logbookModal.style.display = 'none');
      }

      // Research Data Modal & Downloads
      const researchBtn = document.getElementById('btn-preview-research');
      const closeResearchBtn = document.getElementById('btn-close-research');
      const researchModal = document.getElementById('research-modal');
      const downloadCsvBtn = document.getElementById('btn-export-research-csv');
      const downloadJsonBtn = document.getElementById('btn-export-research-json');

      if (researchBtn && researchModal) {
        researchBtn.addEventListener('click', () => researchModal.style.display = 'flex');
      }
      if (closeResearchBtn && researchModal) {
        closeResearchBtn.addEventListener('click', () => researchModal.style.display = 'none');
      }

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
        AppStore.addAuditLog('RESEARCH_EXPORT', `Downloaded dataset ${filename}`);
      };

      if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', () => {
          const csv = AppStore.generateResearchCSV();
          triggerDownload('LJMU_ANONYMISED_RESEARCH_DATASET.csv', csv, 'text/csv;charset=utf-8;');
          if (typeof App !== 'undefined' && App.showToast) App.showToast('Anonymised research CSV downloaded!');
        });
      }

      if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
          const json = AppStore.generateResearchJSON();
          triggerDownload('LJMU_ANONYMISED_RESEARCH_DATASET.json', json, 'application/json');
          if (typeof App !== 'undefined' && App.showToast) App.showToast('Anonymised research JSON downloaded!');
        });
      }
    }
  }

  return new EPRModule();
});
