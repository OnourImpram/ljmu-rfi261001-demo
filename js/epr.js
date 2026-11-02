/** Clinical documentation, version-bound review and consent-filtered research exports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EPRModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = value => HubDomain.escapeHtml(value);
  const DISCIPLINES = { osteopathy:'Osteopathy', physiotherapy:'Physiotherapy', cardiovascular:'Cardiovascular', physiology:'Exercise physiology', sc:'Strength & conditioning' };
  class ClinicalWorkspace {
    constructor() { this.currentDiscipline = 'osteopathy'; }
    init(id) { this.container = document.getElementById(id); this.render(); }
    render() {
      if (!this.container) return;
      if (!AppStore.can('clinicalRead')) {
        App.renderRestricted(this.container, 'Clinical records stay with the clinical team', 'Commercial and corporate-booking personas can manage their own work without access to clinical notes, student logbooks or research exports.', 'supervisor');
        return;
      }
      const state = AppStore.getState(), raw = state.records[this.currentDiscipline], rec = HubDomain.presentation(raw);
      const locked = raw.status.includes('LOCKED'), supervisor = AppStore.can('countersign');
      const editable = state.currentRole === 'student' && raw.authorId === state.currentUser.id && !locked;
      const student = state.students.find(s => s.userId === raw.authorId);
      this.container.innerHTML = `
        <div class="view-header"><div class="view-title-group"><span class="view-eyebrow">Clinical records &amp; supervised learning</span><h2 class="view-title">The right record. The right review.</h2><p class="view-description">Five discipline-specific records, attributable student work and supervisor review bound to the current record version.</p></div>
        <div class="view-actions"><button id="btn-view-logbook" class="btn btn-secondary" aria-haspopup="dialog">Student activity</button>${supervisor ? '<button id="btn-preview-research" class="btn btn-primary" aria-haspopup="dialog">Research export</button>' : ''}</div></div>
        <nav class="discipline-nav" aria-label="Clinical disciplines">${Object.entries(DISCIPLINES).map(([key,label],i) => `<button type="button" class="btn-discipline ${key === this.currentDiscipline ? 'active' : ''}" data-discipline="${key}" aria-pressed="${key === this.currentDiscipline}"><span class="disc-meta">0${i+1}</span><span class="disc-title">${label}</span></button>`).join('')}</nav>
        <section class="card patient-banner-card"><div class="patient-banner-grid"><div class="patient-main-info"><div class="section-tag-row"><span class="badge badge-accent">${rec.disciplineTitle}</span><span class="text-xs font-mono text-muted">${rec.episodeCode}</span></div>
        <h3 class="patient-name">${rec.patientName} <span class="text-muted text-sm">· age ${rec.age}</span></h3><div class="patient-meta-row"><span>Encounter: <strong>${rec.encounterDate}</strong></span><span>Version: <strong>${rec.version}</strong></span><span>Research consent: <strong>${raw.researchConsent ? 'Recorded' : 'Not recorded'}</strong></span></div></div>
        <div class="patient-status-col"><span id="record-status-badge" class="record-badge ${locked ? 'status-locked' : 'status-draft'}">${locked ? 'Reviewed · locked' : 'Awaiting supervisor review'}</span><p class="text-xs text-muted mt-2">Author: ${rec.authorName}<br>Supervisor: ${rec.supervisorName}</p></div></div></section>
        <div class="grid-epr-layout"><div class="epr-form-col"><section class="card"><div class="card-header-flex"><h3 class="card-title">Encounter documentation</h3><span class="badge badge-neutral">${editable ? 'Student draft' : 'Read-only record'}</span></div>
          <form id="clinical-draft-form">${[['subjective','Subjective history'],['objective','Objective findings'],['assessment','Clinical assessment'],['studentDraftPlan','Student management plan']].map(([key,label]) => `<div class="form-group"><label for="epr-${key}">${label}</label><textarea id="epr-${key}" class="form-control" rows="3" maxlength="10000" required ${editable ? '' : 'readonly'}>${rec[key]}</textarea></div>`).join('')}
          ${editable ? '<button id="btn-save-draft" class="btn btn-primary" type="submit">Save draft & update version</button>' : ''}</form>
          ${this.observations(raw)}
        </section></div>
        <aside class="epr-sidebar-col"><section class="card diff-review-card"><span class="badge badge-primary">Accountable review</span><h3 class="card-title mt-2">Student draft → supervisor decision</h3><p class="text-sm text-muted mb-4">Review the submitted content alongside the supervising clinician’s plan. Student authorship remains visible.</p>
          <div class="diff-split-view"><div class="diff-column diff-student"><div class="diff-col-header"><strong>Student · version ${rec.version}</strong></div><div class="diff-content">${rec.studentDraftPlan}</div></div><div class="diff-column diff-supervisor"><div class="diff-col-header"><strong>Supervisor review</strong></div><div class="diff-content">${locked ? rec.supervisorAmendment : `<label class="sr-only" for="supervisor-amendment-input">Supervisor review and approved plan</label><textarea id="supervisor-amendment-input" class="form-control" rows="7" maxlength="10000" ${supervisor ? '' : 'readonly'}>${rec.supervisorAmendment}</textarea>`}</div></div></div>
          <div class="signature-lock-box"><strong class="sig-title">Record-version integrity</strong><p class="text-xs text-muted mt-2">SHA-256 ties this session’s approved content to its reviewer and timestamp. Approval and authorship are recorded separately.</p><code id="signature-hash-display" class="hash-code mt-2">${rec.signatureHash || (locked ? 'Preloaded reviewed reference record' : 'Digest generated on approval')}</code>
          ${raw.signedTimestamp ? `<p class="text-xs mt-2">Reviewed by ${E(raw.supervisorSignedBy)}<br>${E(raw.signedTimestamp)}</p>` : ''}
          <button id="btn-execute-countersign" class="btn btn-success btn-block mt-4" ${!supervisor || locked ? 'disabled' : ''}>${locked ? 'Record reviewed and locked' : 'Approve & countersign this version'}</button>
          ${raw.signatureHash ? '<button id="btn-verify-record" class="btn btn-secondary btn-block mt-2">Verify record integrity</button>' : ''}
          ${!supervisor && !locked ? '<p class="text-xs text-muted mt-2">The assigned supervisor completes this review.</p>' : ''}</div></section></aside></div>
        ${this.logbookDialog(student, state)}${supervisor ? this.researchDialog() : ''}`;
      this.container.querySelectorAll('[data-discipline]').forEach(button => button.addEventListener('click', () => { this.currentDiscipline = button.dataset.discipline; AppStore.setDiscipline(this.currentDiscipline); this.render(); }));
      App.bindDialog('btn-view-logbook', 'logbook-modal', 'btn-close-logbook');
      if (supervisor) {
        App.bindDialog('btn-preview-research', 'research-modal', 'btn-close-research');
        this.container.querySelector('#btn-download-research-csv').addEventListener('click', () => this.exportResearch('csv'));
        this.container.querySelector('#btn-download-research-json').addEventListener('click', () => this.exportResearch('json'));
      }
      this.container.querySelector('#clinical-draft-form').addEventListener('submit', event => {
        event.preventDefault();
        try {
          const fields = Object.fromEntries(['subjective','objective','assessment','studentDraftPlan'].map(key => [key,this.container.querySelector('#epr-' + key).value]));
          AppStore.saveDraft(this.currentDiscipline, fields); this.render(); App.showToast('Draft saved. The next review will use the updated version.');
        } catch (error) { App.showToast(error.message, true); }
      });
      this.container.querySelector('#btn-execute-countersign').addEventListener('click', async event => {
        const button = event.currentTarget; button.disabled = true;
        try { await AppStore.executeCountersignature(this.currentDiscipline, this.container.querySelector('#supervisor-amendment-input')?.value); this.render(); App.showToast('Version approved. Student activity credited once.'); }
        catch (error) { button.disabled = false; App.showToast(error.message, true); }
      });
      this.container.querySelector('#btn-verify-record')?.addEventListener('click', async () => {
        try { const result = await AppStore.verifyCountersignature(this.currentDiscipline); App.showToast(result.reason, !result.valid); } catch (error) { App.showToast(error.message, true); }
      });
    }
    observations(record) {
      let values;
      switch (record.discipline) {
        case 'cardiovascular': values = [['Heart rate',record.ecgMetrics.hr,'bpm'],['PR interval',record.ecgMetrics.pr,'ms'],['QRS duration',record.ecgMetrics.qrs,'ms'],['QTc',record.ecgMetrics.qtc,'ms']]; break;
        case 'physiology': values = [['VO₂ peak',record.cpetData.vo2peak,'ml/kg/min'],['Peak RER',record.cpetData.rerPeak,'ratio'],['VT1 power',record.cpetData.vt1Power,'W'],['VT2 power',record.cpetData.vt2Power,'W']]; break;
        case 'sc': values = [['Jump height',record.scData.jumpHeight,'cm'],['RSI modified',record.scData.rsimod,'m/s'],['Peak asymmetry',record.scData.asymmetry,'%'],['Braking RFD',record.scData.rfd.toLocaleString('en-GB'),'N/s']]; break;
        case 'physiotherapy': values = [['Knee flexion','135','degrees'],['Reported pain','6 / 10','scale'],['VISA-P','62 / 100','recorded score'],['MSK-HQ',record.mskHqScore + ' / 56','recorded score']]; break;
        default: values = [['Cervical rotation','55','degrees'],['Record version',record.version,'current'],['Review stage',record.status.includes('LOCKED') ? 'Reviewed' : 'Pending','supervisor'],['Research consent',record.researchConsent ? 'Yes' : 'No','recorded']];
      }
      return `<section class="observation-panel mt-4" aria-label="Recorded ${E(DISCIPLINES[record.discipline])} observations"><h4 class="mb-3">Structured ${E(DISCIPLINES[record.discipline].toLowerCase())} observations</h4><div class="metric-grid">${values.map(([label,value,unit]) => `<div class="metric-card"><span class="text-xs text-muted">${E(label)}</span><strong>${E(value)}</strong><span class="text-xs">${E(unit)}</span></div>`).join('')}</div><p class="text-xs text-muted mt-3">Illustrative recorded observations; no automated clinical interpretation.</p></section>`;
    }
    logbookDialog(student, state) {
      const reviewed = Object.values(state.records).filter(r => r.authorId === student.userId && r.status.includes('LOCKED'));
      return `<div id="logbook-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-logbook-title" aria-hidden="true" style="display:none"><div class="modal-content modal-lg"><div class="modal-header"><h3 id="modal-logbook-title" class="modal-title">${E(student.name)} · student activity</h3><button id="btn-close-logbook" class="btn-close" aria-label="Close student activity">&times;</button></div><div class="modal-body"><div class="card-header-flex"><div><h4>Approved placement activity</h4><p class="text-sm text-muted">No patient names or notes are copied into this activity summary.</p></div><strong id="logbook-hours" class="hours-badge">${student.hoursLogged} / ${student.targetHours} hours</strong></div><div class="ratio-bar-wrapper" role="progressbar" aria-label="Placement hours" aria-valuemin="0" aria-valuemax="${student.targetHours}" aria-valuenow="${student.hoursLogged}"><div class="ratio-bar-fill" style="width:${Math.min(100, 100 * student.hoursLogged/student.targetHours)}%"></div></div><p class="text-sm mb-4">${student.completedCases} completed encounters, including the preloaded activity history.</p><div class="table-responsive"><table class="data-table"><caption class="sr-only">Reviewed records in the reference dataset</caption><thead><tr><th scope="col">Discipline</th><th scope="col">Version</th><th scope="col">Review date</th><th scope="col">Source</th></tr></thead><tbody>${reviewed.map(r => `<tr><td>${E(DISCIPLINES[r.discipline])}</td><td>${r.version}</td><td>${E(r.signedTimestamp?.slice(0,10))}</td><td>${r.signatureOrigin === 'session' ? 'This walkthrough' : 'Preloaded history'}</td></tr>`).join('')}</tbody></table></div></div></div></div>`;
    }
    researchDialog() {
      const rows = AppStore.researchRows();
      return `<div id="research-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-research-title" aria-hidden="true" style="display:none"><div class="modal-content modal-lg"><div class="modal-header"><h3 id="modal-research-title" class="modal-title">Consent-filtered research extract</h3><button id="btn-close-research" class="btn-close" aria-label="Close research export">&times;</button></div><div class="modal-body"><p class="text-sm mb-4">${rows.length} consented reference records. Names, dates of birth, patient identifiers and clinical free text are excluded. Pseudonymised extracts remain subject to authorised research governance.</p><div class="code-block"><pre>${E(JSON.stringify(rows,null,2))}</pre></div><div class="view-actions mt-4"><button id="btn-download-research-csv" class="btn btn-primary">Download CSV</button><button id="btn-download-research-json" class="btn btn-secondary">Download JSON</button></div></div></div></div>`;
    }
    exportResearch(format) {
      try {
        const content = format === 'csv' ? AppStore.generateResearchCSV() : AppStore.generateResearchJSON();
        App.download('oiv-reference-research.' + format, content, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
        void AppStore.addAuditLog('RESEARCH_EXPORT', `${format.toUpperCase()} / ${AppStore.researchRows().length} consented records`);
      } catch (error) { App.showToast(error.message, true); }
    }
  }
  return new ClinicalWorkspace();
});
