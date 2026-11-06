(function (root) {
  'use strict';

  const workingNotes = new Map();
  let sampleIdentity;

  function bindWorkingNote(state, rec) {
    const owner = state.currentUser.id;
    const fields = state.currentRole === 'student' && owner === rec.authorId
      ? ['epr-subjective', 'epr-objective', 'epr-assessment']
      : owner === rec.supervisorId ? ['supervisor-amendment-input'] : [];
    const editorKey = rec.id + '/' + owner;
    const changes = workingNotes.get(editorKey) || new Map();
    const feedback = document.getElementById('draft-feedback');
    function updateStatus() {
      if (changes.size) {
        workingNotes.set(editorKey, changes);
        const message = state.currentRole === 'student' ? 'Unsaved note. Select Save student note to keep it.' : 'Review note pending signature.';
        if (feedback.textContent !== message) feedback.textContent = message;
      } else {
        workingNotes.delete(editorKey);
        if (feedback.textContent) feedback.textContent = '';
      }
    }
    if (rec.status.includes('COUNTERSIGNED')) {
      workingNotes.delete(rec.id + '/' + rec.authorId);
      workingNotes.delete(rec.id + '/' + rec.supervisorId);
      return;
    }
    for (const id of fields) {
      const input = document.getElementById(id);
      if (!input || input.readOnly) continue;
      const saved = input.defaultValue;
      const edit = changes.get(id);
      if (edit && edit.base === saved) input.value = edit.value;
      else changes.delete(id);
      input.addEventListener('input', () => {
        if (input.value === saved) changes.delete(id);
        else changes.set(id, {base: saved, value: input.value});
        updateStatus();
      });
    }
    updateStatus();
  }

  function renderEprView() {
    const container = document.getElementById('view-epr');
    if (!container) return;

    const tabHadFocus = container.contains(document.activeElement) && document.activeElement.matches("[data-discipline]");
    const state = root.AppStore.getState();
    if (sampleIdentity !== state.personas) {
      workingNotes.clear();
      sampleIdentity = state.personas;
    }
    const esc = root.AppStore.escapeText;
    if (!['student', 'supervisor'].includes(state.currentRole)) {
      container.innerHTML = '<div class="card"><div class="card-body"><h2 class="section-title">Clinical records</h2><p>Choose Student or Supervisor to open a teaching case.</p></div></div>';
      ['logbook-modal', 'research-modal'].forEach(id => {const m = document.getElementById(id); m.hidden = true; m.replaceChildren();});
      return;
    }
    const allowed = Object.keys(state.records).filter(key => state.currentRole === 'supervisor' || state.records[key].authorId === state.currentUser.id);
    if (!allowed.length) {
      container.innerHTML = '<div class="card"><div class="card-body">No records assigned to this student.</div></div>';
      ['logbook-modal','research-modal'].forEach(id => {const m = document.getElementById(id); m.hidden = true; m.replaceChildren();});
      return;
    }
    const activeDisc = allowed.includes(state.activeDiscipline) ? state.activeDiscipline : allowed[0];
    const rec = state.records[activeDisc];
    const isLocked = rec.status.includes('COUNTERSIGNED');
    const isStudent = state.currentRole === 'student';
    const mayEdit = isStudent && !isLocked && rec.authorId === state.currentUser.id;

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-copy">
          <h2 class="section-title">Clinical records</h2>
          <p class="section-subtitle">Choose a service to open its case. Students can save notes for their supervisor to review.</p>
        </div>
        <div class="header-action-row">
          <button type="button" id="btn-view-logbook" class="btn btn-secondary">
            Placement log (${esc(state.students[0].hoursLogged)}/${esc(state.students[0].targetHours)}h)
          </button>
          <button type="button" id="btn-preview-research" class="btn btn-secondary" ${isStudent ? 'disabled title="Cohort export requires the supervisor persona"' : ''}>
            Teaching dataset
          </button>
        </div>
      </div>

      <div class="discipline-tabs mb-4" role="tablist" aria-label="Clinical Disciplines">
        ${allowed.map(key => renderDisciplineTab(key, {osteopathy:'Osteopathy',physiotherapy:'Physiotherapy',cardiovascular:'Cardiovascular',physiology:'Exercise physiology',sc:'Strength & conditioning'}[key], activeDisc)).join('')}
      </div>

      <div id="discipline-record-panel" role="tabpanel" aria-labelledby="disc-tab-${activeDisc}" tabindex="0">
      <div class="patient-banner-card mb-4" role="region" aria-label="Active Patient Clinical Spine">
        <div class="patient-info-main">
          <div class="patient-avatar" aria-hidden="true">${esc(rec.patientName.split(' ').map(n => n[0]).join(''))}</div>
          <div>
            <div class="flex-gap-2 align-center">
              <h3 class="patient-name">${esc(rec.patientName)}</h3>
              <span class="badge badge-neutral">${esc(rec.gender)}, ${esc(rec.age)}y (DOB: ${esc(rec.dob)})</span>
              <span class="badge badge-neutral mono">NHS (Demo): ${esc(rec.nhsNumber)}</span>
              <span class="badge badge-neutral mono">Episode: ${esc(rec.episodeCode)}</span>
            </div>
            <p class="text-xs text-muted mt-1">
              <strong>Discipline:</strong> ${esc(rec.disciplineTitle)} · <strong>Author:</strong> ${esc(rec.authorName)} · <strong>Supervisor:</strong> ${esc(rec.supervisorName)}
            </p>
          </div>
        </div>
        <div class="patient-status-block">
          <span id="record-status-badge" class="badge ${isLocked ? 'badge-success' : 'badge-amber'}">
            ${isLocked ? 'Signed' : 'Awaiting review'}
          </span>
          <div class="text-xs text-muted mt-1">
            Research opt-in consent: <strong>${rec.researchConsent ? 'Granted in sample' : 'Withheld'}</strong>
          </div>
        </div>
      </div>

      <div class="grid-2-col">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Consultation note</h3>
              <p class="card-subtitle">Seen <span class="mono">${esc(rec.encounterDate)}</span></p>
            </div>
            <span class="badge ${isLocked ? 'badge-success' : 'badge-amber'}">
              ${isLocked ? 'Read-only (locked)' : 'Student draft'}
            </span>
          </div>
          <div class="card-body">
            <div class="soap-grid mb-3">
              <div class="soap-field">
                <label for="epr-subjective" class="soap-label">History and screening</label>
                <textarea id="epr-subjective" class="form-control soap-textarea" rows="3" ${mayEdit ? '' : 'readonly'}>${esc(rec.subjective)}</textarea>
              </div>
              <div class="soap-field">
                <label for="epr-objective" class="soap-label">Examination findings</label>
                <textarea id="epr-objective" class="form-control soap-textarea" rows="3" ${mayEdit ? '' : 'readonly'}>${esc(rec.objective)}</textarea>
              </div>
              <div class="soap-field">
                <label for="epr-assessment" class="soap-label">Assessment</label>
                <textarea id="epr-assessment" class="form-control soap-textarea" rows="2" ${mayEdit ? '' : 'readonly'}>${esc(rec.assessment)}</textarea>
              </div>
              <div class="soap-field">
                <label for="epr-active-plan" class="soap-label">Current plan</label>
                <textarea id="epr-active-plan" class="form-control soap-textarea" rows="2" readonly>${esc(rec.activePlan)}</textarea>
              </div>
            </div>

            ${mayEdit ? '<button type="button" class="btn btn-primary mb-3" id="save-student-note">Save student note</button>' : ''}
            <p id="draft-feedback" class="text-xs" role="status"></p>
            <div class="discipline-widget-box">
              ${renderDisciplineWidget(activeDisc, rec)}
              ${['osteopathy','physiotherapy','sc'].includes(activeDisc) ? '<div data-muscle-reference></div>' : ''}
            </div>
          </div>
        </div>

        <div class="card" id="supervisor-diff-container">
          <div class="card-header">
            <div>
              <h3 class="card-title">Supervisor review</h3>
              <p class="card-subtitle">Compare the student's plan with the supervisor's amendment.</p>
            </div>
          </div>
          <div class="card-body">
            <div class="diff-container mb-3" id="diff-panel">
              <div class="diff-pane diff-student">
                <div class="diff-header">
                  <span class="badge badge-amber">Student plan</span>
                  <span class="text-xs text-muted">${esc(rec.authorName)}</span>
                </div>
                <p class="diff-text">${esc(rec.diffView ? rec.diffView.studentOriginal : rec.studentDraftPlan)}</p>
              </div>

              <div class="diff-pane diff-supervisor">
                <div class="diff-header">
                  <span class="badge badge-success">Supervisor amendment</span>
                  <span class="text-xs text-muted">${esc(rec.supervisorName)}</span>
                </div>
                <p class="diff-text">${esc(isLocked ? rec.supervisorAmendment : (rec.diffView?.supervisorOverride || rec.supervisorAmendment))}</p>
              </div>
            </div>

            <div class="form-group mb-3">
              <label for="supervisor-amendment-input" class="form-label">Review note</label>
              ${isLocked
                ? `<div class="form-control" style="background:#eef2f1;font-weight:500;">${esc(rec.supervisorAmendment)}</div>`
                : `<textarea id="supervisor-amendment-input" class="form-control" rows="3" ${isStudent ? 'readonly' : ''}>${esc(rec.supervisorAmendment)}</textarea>`
              }
              ${isStudent ? '<p class="text-xs text-danger mt-1"><strong>Student view.</strong> Your supervisor can review and sign this note.</p>' : ''}
            </div>

            <details class="mb-3"><summary>Review reference</summary>
              <p class="text-xs">${esc(rec.signedTimestamp ? 'Reviewed ' + rec.signedTimestamp : 'Awaiting review')}</p>
              <code id="signature-hash-display" class="hash-code">${esc(rec.signatureHash || 'Available after signing')}</code>
            </details>
            <div class="flex-between">
              <div class="text-xs text-muted">
                ${isLocked
                  ? `Countersigned by <strong>${esc(rec.supervisorSignedBy)}</strong>. Read-only in this workbench.`
                  : 'Signing closes the note and adds one hour to the placement log.'}
              </div>
              <div>
                <button type="button" id="btn-execute-countersign" class="btn btn-primary" ${isLocked || isStudent ? 'disabled' : ''}>
                  ${isLocked ? 'Signed' : 'Sign and close note'}
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    `;

    bindWorkingNote(state, rec);
    renderLogbookModal(state);
    renderResearchModal(state);
    bindEprEvents(activeDisc);
    if (container.querySelector("[data-muscle-reference]")) root.MuscleReference?.mount(container);
    if (root.ServiceDesk) root.ServiceDesk.mountRecord(container, activeDisc);
    if (tabHadFocus) document.getElementById("disc-tab-" + activeDisc)?.focus({preventScroll:true});

    if (activeDisc === 'cardiovascular') {
      drawEcgWaveform();
    }
  }

  function renderDisciplineTab(key, label, activeKey) {
    const isActive = key === activeKey;
    return `
      <button type="button" class="btn-discipline ${isActive ? 'active' : ''}" id="disc-tab-${key}" role="tab" aria-selected="${isActive}" aria-controls="discipline-record-panel" tabindex="${isActive ? 0 : -1}" data-discipline="${key}">
        <span>${label}</span>
      </button>
    `;
  }

  function renderDisciplineWidget(discipline, rec) {
    const measure = (value, unit = '') => Number.isFinite(value) ? value + unit : 'Not recorded';
    if (discipline === 'osteopathy' || discipline === 'physiotherapy') {
      const mskScore = Number.isFinite(rec.mskHqScore) ? rec.mskHqScore : null;
      const editable = root.AppStore.getState().currentRole === 'student' && rec.authorId === root.AppStore.getState().currentUser.id && !rec.status.includes('COUNTERSIGNED');
      return root.BodyChart.render(rec,editable) + `<div class="atlas-measure"><span>MSK-HQ score</span>
        <strong id="msk-hq-display">${mskScore === null ? 'Not recorded' : mskScore + ' / 56'}</strong>
        ${mskScore === null ? '' : `<meter id="slider-msk" min="0" max="56" value="${mskScore}" aria-label="Recorded MSK-HQ score"></meter>`}</div>`;
    }

    if (discipline === 'cardiovascular') {
      const m = rec.ecgMetrics || {};
      return `
        <div>
          <div class="flex-between mb-2">
            <div>
              <h4 class="text-xs font-bold">Illustrative ECG rhythm strip</h4>
              <p class="text-xs text-muted">Generated illustration only. Measurements below are fictional record fields, not derived from this trace.</p>
            </div>
            <span class="badge badge-success">Recorded QRISK3 score: ${measure(rec.qrisk3Score, '%')}</span>
          </div>
          <div class="ecg-canvas-container mb-2">
            <canvas id="ecg-canvas" width="640" height="130" aria-label="12-Lead ECG Lead II Sinus Rhythm Waveform"></canvas>
          </div>
          <div class="grid-4-col text-center">
            <div class="metric-tile">
              <span class="text-xs text-muted">Ventricular HR</span>
              <strong class="mono text-sm">${measure(m.hr, ' bpm')}</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">PR Interval</span>
              <strong class="mono text-sm">${measure(m.pr, ' ms')}</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">QRS Duration</span>
              <strong class="mono text-sm">${measure(m.qrs, ' ms')}</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">QTc (Bazett)</span>
              <strong class="mono text-sm">${measure(m.qtc, ' ms')}</strong>
            </div>
          </div>
        </div>
      `;
    }

    if (discipline === 'physiology') {
      const c = rec.cpetData || {};
      return `
        <div>
          <div class="flex-between mb-2">
            <h4 class="text-xs font-bold">Exercise physiology observations</h4>
          </div>
          <div class="grid-4-col text-center">
            <div class="metric-tile">
              <span class="text-xs text-muted">VO2peak</span>
              <strong class="mono text-sm">${measure(c.vo2peak, ' ml/kg/min')}</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">VT1 / VT2 Power</span>
              <strong class="mono text-sm">${measure(c.vt1Power, 'W')} / ${measure(c.vt2Power, 'W')}</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">FEV1 / FVC Ratio</span>
              <strong class="mono text-sm">${measure(c.fev1, 'L')} / ${measure(c.fvc, 'L')} (${measure(c.ratio, '%')})</strong>
            </div>
            <div class="metric-tile">
              <span class="text-xs text-muted">Peak Blood Lactate</span>
              <strong class="mono text-sm">${measure(c.peakLactate, ' mmol/L')}</strong>
            </div>
          </div>
        </div>
      `;
    }

    const sc = rec.scData || {};
    return `
      <div>
        <div class="flex-between mb-2">
          <h4 class="text-xs font-bold">Force plate &amp; velocity-based training observations</h4>
        </div>
        <div class="grid-4-col text-center">
          <div class="metric-tile">
            <span class="text-xs text-muted">CMJ Height</span>
            <strong class="mono text-sm">${measure(sc.jumpHeight, ' cm')}</strong>
          </div>
          <div class="metric-tile">
            <span class="text-xs text-muted">RSImod Index</span>
            <strong class="mono text-sm">${measure(sc.rsimod, '')}</strong>
          </div>
          <div class="metric-tile">
            <span class="text-xs text-muted">Braking RFD</span>
            <strong class="mono text-sm">${measure(sc.rfd, ' N/s')}</strong>
          </div>
          <div class="metric-tile">
            <span class="text-xs text-muted">L/R Asymmetry</span>
            <strong class="mono text-sm">${measure(sc.asymmetry, '% R')}</strong>
          </div>
        </div>
      </div>
    `;
  }

  function drawEcgWaveform() {
    const canvas = document.getElementById('ecg-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#011a42';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0a2a6e';
    ctx.lineWidth = 0.6;
    for (let x = 0; x < w; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = '#1c3a85';
    ctx.lineWidth = 1.0;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const midY = h * 0.64;
    ctx.strokeStyle = 'rgba(44, 213, 196, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#2cd5c4';
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const cycleWidth = 150;
    for (let x = 0; x < w; x++) {
      const pos = x % cycleWidth;
      let y = midY;

      if (pos >= 20 && pos <= 36) {
        y -= Math.sin(((pos - 20) / 16) * Math.PI) * 9;
      } else if (pos >= 46 && pos < 50) {
        y += ((pos - 46) / 4) * 7;
      } else if (pos >= 50 && pos < 56) {
        y = midY + 7 - ((pos - 50) / 6) * 62;
      } else if (pos >= 56 && pos < 62) {
        y = midY - 55 + ((pos - 56) / 6) * 70;
      } else if (pos >= 62 && pos < 67) {
        y = midY + 15 - ((pos - 62) / 5) * 15;
      } else if (pos >= 86 && pos <= 114) {
        y -= Math.sin(((pos - 86) / 28) * Math.PI) * 15;
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function renderLogbookModal(state) {
    const modal = document.getElementById('logbook-modal');
    if (!modal) return;
    const stu = state.students[0];
    const esc = root.AppStore.escapeText;

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Placement log</h2>
            <p class="card-subtitle">Supervised activity recorded in this example</p>
          </div>
          <button type="button" id="btn-close-logbook" class="btn-close-modal" aria-label="Close Logbook Modal">Close</button>
        </div>
        <div class="modal-body">
          <div class="flex-between mb-3 p-3 bg-subtle rounded">
            <div>
              <h3 class="text-sm font-bold">${esc(stu.name)} (${esc(stu.year)} MSc Student Practitioner)</h3>
              <p class="text-xs text-muted">Assigned Practice Educator: Dr. Sarah Jenkins</p>
            </div>
            <div class="text-right">
              <span class="badge badge-primary">Logged Hours: ${esc(stu.hoursLogged)} / ${esc(stu.targetHours)} hrs</span>
              <div class="text-xs text-muted mt-1">Countersigned Cases: <strong>${esc(stu.completedCases)}</strong></div>
            </div>
          </div>

          <div class="table-responsive" tabindex="0" role="region" aria-label="Student Clinical Competency Table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Placement competency</th>
                  <th>Required Cases</th>
                  <th>Verified Count</th>
                  <th>Supervisor Sign-Off</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Osteopathic Spinal &amp; Peripheral Assessment</strong></td>
                  <td>15</td>
                  <td>14</td>
                  <td><span class="badge badge-amber">In Progress (93%)</span></td>
                </tr>
                <tr>
                  <td><strong>MSK Physiotherapy Rehabilitation &amp; Load Progression</strong></td>
                  <td>15</td>
                  <td>15</td>
                  <td><span class="badge badge-success">Signed Off (Dr. S. Jenkins)</span></td>
                </tr>
                <tr>
                  <td><strong>12-Lead ECG Acquisition &amp; Red-Flag Triage</strong></td>
                  <td>10</td>
                  <td>9</td>
                  <td><span class="badge badge-success">Signed Off (Dr. M. Davies)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderResearchModal(state) {
    const modal = document.getElementById('research-modal');
    if (!modal) return;

    if (state.currentRole !== 'supervisor') {modal.hidden = true; modal.replaceChildren(); return;}
    const dataset = root.AppStore.researchRows();

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Teaching dataset</h2>
            <p class="card-subtitle">Example teaching dataset · fictional records only</p>
          </div>
          <button type="button" id="btn-close-research" class="btn-close-modal" aria-label="Close Research Modal">Close</button>
        </div>
        <div class="modal-body">
          <p class="text-xs text-muted mb-3">
            Only consent-marked sample records are included. The export contains a study code, age band, discipline, record status, consent flag and selected numeric observations where recorded. Free text and direct identifiers are omitted. This example does not establish anonymisation.
          </p>

          <pre class="dataset-preview-box mb-3">${root.AppStore.escapeText(JSON.stringify(dataset, null, 2))}</pre>

          <div class="flex-between">
            <span class="text-xs text-muted">Only cases marked for research use are included.</span>
            <div class="flex-gap-2">
              <button type="button" id="btn-export-research-csv" class="btn btn-secondary">Download CSV</button>
              <button type="button" id="btn-export-research-json" class="btn btn-primary">Download JSON</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindEprEvents(activeDisc) {
    const tabs = Array.from(document.querySelectorAll('.btn-discipline'));
    const selectTab = tab => {
      root.AppStore.setDiscipline(tab.dataset.discipline);
      const selected = document.getElementById(tab.id);
      selected?.focus({preventScroll:true});
      selected?.scrollIntoView({block:'nearest',inline:'nearest'});
    };
    tabs.forEach((tab,index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        const destinations = {ArrowLeft:(index + tabs.length - 1) % tabs.length, ArrowRight:(index + 1) % tabs.length, Home:0, End:tabs.length - 1};
        if (!Object.hasOwn(destinations,event.key)) return;
        event.preventDefault();
        selectTab(tabs[destinations[event.key]]);
      });
    });

    document.getElementById('save-student-note')?.addEventListener('click', async () => {
      const author = root.AppStore.getState().currentUser.id;
      const updates = Object.fromEntries(['subjective', 'objective', 'assessment'].map(k => [k, document.getElementById('epr-' + k).value]));
      const saved = await root.AppStore.saveDraft(activeDisc, updates);
      const current = root.AppStore.getState();
      if (saved && current.currentUser.id === author && current.activeDiscipline === activeDisc) {
        const feedback = document.getElementById('draft-feedback');
        if (feedback) feedback.textContent = 'Student note saved for supervisor review.';
      }
    });
    const executeBtn = document.getElementById('btn-execute-countersign');

    const handleCountersign = async () => {
      const amendmentEl = document.getElementById('supervisor-amendment-input');
      const amendmentText = amendmentEl ? amendmentEl.value : '';
      if (!await root.AppStore.executeCountersignature(activeDisc, amendmentText)) document.getElementById('draft-feedback').textContent = 'Review not recorded. Use the assigned supervisor and a secure browser context.';
    };

    if (executeBtn) executeBtn.addEventListener('click', handleCountersign);

    if (activeDisc === 'osteopathy' || activeDisc === 'physiotherapy') {
      const state = root.AppStore.getState(), rec = state.records[activeDisc];
      const editable = state.currentRole === 'student' && rec.authorId === state.currentUser.id && !rec.status.includes('COUNTERSIGNED');
      root.BodyChart.bind(rec,editable,(id,operation) => root.AppStore.changeBodySite(activeDisc,id,operation));
    }

    const logbookBtn = document.getElementById('btn-view-logbook');
    const closeLogbookBtn = document.getElementById('btn-close-logbook');
    const logbookModal = document.getElementById('logbook-modal');
    if (logbookBtn && logbookModal) {
      logbookBtn.addEventListener('click', () => { logbookModal.hidden = false; });
    }
    if (closeLogbookBtn && logbookModal) {
      closeLogbookBtn.addEventListener('click', () => { logbookModal.hidden = true; });
    }

    const researchBtn = document.getElementById('btn-preview-research');
    const closeResearchBtn = document.getElementById('btn-close-research');
    const researchModal = document.getElementById('research-modal');
    if (researchBtn && researchModal) {
      researchBtn.addEventListener('click', () => { researchModal.hidden = false; });
    }
    if (closeResearchBtn && researchModal) {
      closeResearchBtn.addEventListener('click', () => { researchModal.hidden = true; });
    }

    const exportJsonBtn = document.getElementById('btn-export-research-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', async () => {
        root.App.downloadFile('LJMU_Pseudonymised_Research_Cohort_2026.json', root.AppStore.generateResearchJSON(), 'application/json');
        await root.AppStore.addAuditLog('RESEARCH_EXPORT_JSON', 'Exported consent-filtered sample cohort JSON');
      });
    }

    const exportCsvBtn = document.getElementById('btn-export-research-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', async () => {
        root.App.downloadFile('LJMU_Pseudonymised_Research_Cohort_2026.csv', root.AppStore.generateResearchCSV(), 'text/csv');
        await root.AppStore.addAuditLog('RESEARCH_EXPORT_CSV', 'Exported de-identified research cohort CSV');
      });
    }
  }

  root.EprModule = {

    render: renderEprView
  };
})(typeof self !== 'undefined' ? self : this);
