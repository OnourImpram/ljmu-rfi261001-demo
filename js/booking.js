/** Resource allocation and time-limited waiting-list offers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BookingModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = value => HubDomain.escapeHtml(value);
  class BookingWorkspace {
    init(id) { this.container = document.getElementById(id); this.render(); }
    render() {
      if (!this.container) return;
      clearInterval(this.offerTimer);
      const state = AppStore.getState();
      const clinical = AppStore.can('clinicalRead');
      const canRelease = ['supervisor', 'manager'].includes(state.currentRole);
      this.container.innerHTML = `
        <div class="view-header"><div class="view-title-group"><span class="view-eyebrow">Booking &amp; shared resources</span>
          <h2 class="view-title">One calendar. Every resource accounted for.</h2>
          <p class="view-description">Reserve the practitioner, room, equipment and supervision capacity together. Explore a fixed reference session, then see the allocation update.</p></div>
          <div class="view-actions"><button id="btn-open-booking-modal" class="btn btn-primary" aria-haspopup="dialog">${clinical ? 'Book a clinical appointment' : 'Reserve a commercial facility'}</button>
          ${canRelease ? '<button id="btn-release-place" class="btn btn-secondary">Release a course place</button>' : ''}</div></div>
        <div id="waitlist-alert-container">${this.offer(state)}</div>
        <section class="card supervisor-ratio-card" aria-labelledby="ratio-heading"><div class="card-header-flex"><div>
          <span class="badge badge-accent">Supervised teaching clinics</span><h3 id="ratio-heading" class="card-title mt-2">Capacity follows the roster</h3>
          <p class="card-subtitle">A configurable 1:4 rule for this walkthrough. A full supervisor cannot receive another student appointment.</p></div>
          <span class="badge badge-neutral">Reference session · 31 October 2026</span></div>
          <div class="grid-2-col">${state.supervisors.map(s => `<div class="supervisor-summary"><div class="flex justify-between items-center gap-2"><strong>${E(s.name)}</strong><span class="badge ${s.activeBays >= s.maxRatio ? 'badge-danger' : 'badge-success'}">${s.activeBays} / ${s.maxRatio} bays</span></div>
            <div class="ratio-bar-wrapper" role="progressbar" aria-label="${E(s.name)} allocated student bays" aria-valuenow="${s.activeBays}" aria-valuemin="0" aria-valuemax="${s.maxRatio}"><div class="ratio-bar-fill" style="width:${Math.min(100, 100 * s.activeBays / s.maxRatio)}%"></div></div>
            <p class="text-sm text-muted">${s.maxRatio - s.activeBays} remaining · ${E(s.disciplines.join(' / '))}</p></div>`).join('')}</div></section>
        <div class="grid-2-col">${[
          ['Clinical bays', 'Area A', state.facilities.filter(x => x.type === 'clinical_bay')],
          ['Laboratories & specialist rooms', 'Shared resources', state.facilities.filter(x => x.type !== 'clinical_bay')]
        ].map(([title, tag, rows]) => `<section class="card"><div class="card-header-flex"><h3 class="card-title">${title}</h3><span class="badge badge-info">${tag}</span></div><div class="bay-grid">${rows.map(f => `<div class="bay-card ${f.status === 'available' ? 'bay-available' : 'bay-occupied'}"><div class="bay-card-header"><strong>${E(f.name)}</strong></div><p class="text-sm text-muted">${E(f.discipline)} · capacity ${f.capacity}</p><span class="badge ${f.status === 'available' ? 'badge-success' : 'badge-neutral'}">${E(f.status === 'available' ? 'Available' : 'Allocated')}</span></div>`).join('')}</div></section>`).join('')}</div>
        <section class="card"><div class="card-header-flex"><div><h3 class="card-title">Reservations made in this walkthrough</h3><p class="card-subtitle">The same validation runs again at confirmation, using current capacity.</p></div><span class="badge badge-primary">${state.bookings.length} confirmed</span></div>
          <div class="table-responsive"><table class="data-table"><caption class="sr-only">Current reference-session reservations</caption><thead><tr><th scope="col">Service</th><th scope="col">Practitioner</th><th scope="col">Room</th><th scope="col">Supervisor</th><th scope="col">Status</th></tr></thead><tbody>${state.bookings.length ? state.bookings.map(b => `<tr><td>${E(state.services.find(x => x.id === b.serviceId)?.name)}</td><td>${E([...state.students, ...state.supervisors].find(x => x.id === b.practitionerId)?.name || 'Commercial facility reservation')}</td><td>${E(state.facilities.find(x => x.id === b.roomId)?.name)}</td><td>${E(state.supervisors.find(x => x.id === b.supervisorId)?.name || 'Not required')}</td><td><span class="badge badge-success">Confirmed</span></td></tr>`).join('') : '<tr><td colspan="5" class="text-muted">Choose a service and available resources to create the first reservation.</td></tr>'}</tbody></table></div></section>
        ${this.bookingDialog(state, clinical)}`;
      App.bindDialog('btn-open-booking-modal', 'booking-modal', 'btn-close-booking');
      this.container.querySelector('#btn-release-place')?.addEventListener('click', () => this.run(() => { AppStore.createWaitlistOffer(); this.render(); App.showToast('One place released. A 15-minute offer is ready for the invited booker.'); }));
      this.container.querySelector('#btn-claim-place')?.addEventListener('click', () => this.run(() => { AppStore.claimWaitlistOffer(); this.render(); App.showToast('Course place confirmed.'); }));
      this.container.querySelector('#btn-use-booker')?.addEventListener('click', () => App.usePersona('booker'));
      this.container.querySelectorAll('#booking-form select').forEach(select => select.addEventListener('change', () => this.evaluate()));
      this.container.querySelector('#booking-form').addEventListener('submit', event => { event.preventDefault(); this.run(() => { AppStore.confirmBooking(this.request()); App.closeDialog(); this.render(); App.showToast('Reservation confirmed. Linked resources and supervision capacity updated.'); }); });
      this.evaluate();
      this.updateOfferClock();
      if (state.waitlistOffer?.status === 'OFFERED') this.offerTimer = setInterval(() => this.updateOfferClock(), 1000);
    }
    run(action) { try { action(); } catch (error) { App.showToast(error.message, true); } }
    offer(state) {
      const o = state.waitlistOffer;
      if (!o) return '';
      if (o.status === 'CLAIMED') return '<div class="alert-banner alert-success mb-4">Waiting-list place accepted. Course capacity has been updated.</div>';
      const invited = state.currentUser.id === o.userId;
      return `<div class="alert-banner alert-info mb-4"><div class="card-header-flex"><div><strong>Waiting-list offer · ${E(o.serviceName)}</strong><p class="text-sm">Invited booker: ${E(o.clientName)} · <span id="offer-countdown" role="timer"></span></p></div>
        ${invited ? '<button id="btn-claim-place" class="btn btn-primary">Accept offered place</button>' : '<button id="btn-use-booker" class="btn btn-secondary">Continue as invited booker</button>'}</div></div>`;
    }
    updateOfferClock() {
      const o = AppStore.getState().waitlistOffer, label = this.container.querySelector('#offer-countdown');
      if (!o || !label) return;
      const seconds = Math.max(0, Math.ceil((Date.parse(o.expiresAt) - Date.now()) / 1000));
      label.textContent = seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining` : 'Offer expired';
      const claim = this.container.querySelector('#btn-claim-place');
      if (claim) claim.disabled = seconds === 0;
      if (!seconds) clearInterval(this.offerTimer);
    }
    bookingDialog(state, clinical) {
      const options = (items, chosen) => items.map(x => `<option value="${E(x.id)}" ${x.id === chosen ? 'selected' : ''}>${E(x.name)}</option>`).join('');
      const services = state.services.filter(x => clinical ? x.stream === 'Area A' : x.stream === 'Area B' && !x.seatsTotal && /Lab|Chamber/i.test(x.name));
      const people = [...state.students, ...state.supervisors];
      return `<div id="booking-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title" aria-hidden="true" style="display:none"><div class="modal-content modal-lg"><div class="modal-header"><h3 id="modal-booking-title" class="modal-title">Reserve linked resources</h3><button id="btn-close-booking" class="btn-close" aria-label="Close booking">&times;</button></div><form id="booking-form" class="modal-body"><p class="text-sm text-muted mb-4">Reference session: 31 October 2026, 14:00–15:00. All four checks must pass before confirmation.</p>
        <div class="grid-2-col"><div class="form-group"><label for="booking-service">Service</label><select id="booking-service" class="form-control">${options(services, clinical ? 'srv_osteo_eval' : 'srv_biomech_hire')}</select></div>
        <div class="form-group"><label for="booking-room">Room or bay</label><select id="booking-room" class="form-control">${options(state.facilities, clinical ? 'rm_tr_g04' : 'rm_tr_biomech')}</select></div>
        <div class="form-group"><label for="booking-practitioner">Practitioner or student</label><select id="booking-practitioner" class="form-control" ${clinical ? '' : 'disabled'}>${clinical ? options(people, 'stu_reilly') : '<option value="commercial">Commercial reservation</option>'}</select></div>
        <div class="form-group"><label for="booking-supervisor">Assigned supervisor</label><select id="booking-supervisor" class="form-control" ${clinical ? '' : 'disabled'}>${clinical ? options(state.supervisors, 'sup_jenkins') : '<option value="">Not required</option>'}</select></div>
        <div class="form-group"><label for="booking-equipment">Equipment</label><select id="booking-equipment" class="form-control"><option value="eq_standard">${clinical ? 'Standard clinic kit' : 'No additional portable equipment'}</option>${options(state.equipment, '')}</select></div></div>
        <div id="booking-checks" class="constraint-grid" aria-live="polite"></div><div class="modal-footer"><button type="submit" id="btn-confirm-booking" class="btn btn-primary">Confirm reservation</button></div></form></div></div>`;
    }
    request() {
      const value = id => this.container.querySelector('#booking-' + id).value;
      return { serviceId:value('service'), roomId:value('room'), practitionerId:value('practitioner'), supervisorId:value('supervisor'), equipmentId:value('equipment'), slotId:'reference-afternoon' };
    }
    evaluate() {
      const result = AppStore.evaluateBooking(this.request());
      const labels = {practitioner:'Practitioner',room:'Room',equipment:'Equipment',ratio:'Supervision'};
      this.container.querySelector('#booking-checks').innerHTML = Object.entries(result.checks).map(([key, check]) => `<div class="constraint-check ${check.ok ? 'check-pass' : 'check-fail'}"><strong>${check.ok ? '✓' : '×'} ${labels[key]}</strong><p>${E(check.message)}</p></div>`).join('');
      this.container.querySelector('#btn-confirm-booking').disabled = !result.valid;
    }
  }
  return new BookingWorkspace();
});
