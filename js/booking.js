(function (root) {
  'use strict';
  const store = root.AppStore;
  const sessions = {morning:'09:00–11:00', afternoon:'14:00–16:00'};
  const services = {student_osteo:'Student osteopathy', student_physio:'Student physiotherapy', commercial_cpet:'CPET laboratory hire'};
  const fieldIds = {slot:'slot', serviceId:'service', practitionerId:'practitioner', supervisorId:'supervisor', roomId:'room', equipmentId:'equipment'};
  let cancelId = null, lastMessage = '', lastRole = null;

  function appointmentsTable(state) {
    const list = (state.reservations || []).filter(b => store.mayManageBooking(b)).slice().reverse();
    if (!list.length) return '<p>No appointments have been made in this role. Choose <strong>Book an appointment</strong> to add one.</p>';
    const room = id => state.facilities.find(r => r.id === id)?.name || '';
    return `<div class="table-responsive" role="region" aria-label="Appointments" tabindex="0"><table class="data-table" id="appointments-table">
      <thead><tr><th>Reference</th><th>Service and room</th><th>Session</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${list.map(b => `<tr><th scope="row">${b.id}</th><td><strong>${services[b.serviceId]}</strong><div>${room(b.roomId)}</div></td>
        <td>${sessions[b.slot]}</td><td>${b.status}</td><td>${b.status === 'Cancelled' ? '—' : cancelId === b.id ? `
          <span>Release this appointment?</span>
          <button class="btn btn-secondary btn-xs" data-keep="${b.id}">Keep booking</button>
          <button class="btn btn-primary btn-xs" data-confirm="${b.id}">Confirm cancellation</button>` : `
          <button class="btn btn-secondary btn-xs" id="amend-${b.id}" data-amend="${b.id}" aria-label="Change ${b.id}">Change</button>
          <button class="btn btn-secondary btn-xs" id="cancel-${b.id}" data-cancel="${b.id}" aria-label="Cancel ${b.id}">Cancel</button>`}</td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  function renderBookingView() {
    const container = document.getElementById('view-booking');
    if (!container) return;
    const state = store.getState(), modal = document.getElementById('booking-modal');
    if (lastRole !== state.currentRole) {lastRole = state.currentRole; cancelId = null; lastMessage = ''; modal.hidden = true; modal.replaceChildren();}
    const rosters = [store.bookingRoster('morning'), store.bookingRoster('afternoon')];
    const course = state.services.find(item => item.id === 'srv_cpd_manip');
    const waiting = state.waitlist.filter(item => item.status === 'WAITING');
    const patient = state.currentRole === 'patient';
    const staff = ['manager','supervisor'].includes(state.currentRole);
    container.innerHTML = `
      <div class="section-header"><div class="section-header-copy"><h2 class="section-title">${patient ? 'My appointments' : 'Appointments'}</h2>
      <p class="section-subtitle">Saturday 31 October · ${patient ? 'Osteopathy clinic' : 'Teaching clinics and laboratory hire'}</p></div>
      <div class="header-action-row"><button id="btn-open-booking-modal" type="button" class="btn btn-primary">Book an appointment</button></div></div>
      <p id="booking-feedback" role="status" class="text-sm">${store.escapeText(lastMessage)}</p>
      <section class="card mb-4"><div class="card-header"><h3 class="card-title">${patient ? 'Your bookings' : 'Appointment register'}</h3></div>
      <div class="card-body">${appointmentsTable(state)}</div></section>
      ${patient ? '' : `<div class="grid-2-col mb-4"><section class="card"><div class="card-header"><h3 class="card-title">Room availability</h3></div>
      <div class="card-body"><div class="table-responsive" role="region" aria-label="Room availability" tabindex="0">
      <table class="data-table"><thead><tr><th>Room</th><th>${sessions.morning}</th><th>${sessions.afternoon}</th></tr></thead>
      <tbody>${state.facilities.map((r,i) => `<tr><th scope="row">${r.name}</th>${rosters.map(roster => `<td>${roster.facilities[i].status === 'available' ? 'Free' : 'In use'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></section>
      <section class="card"><div class="card-header"><h3 class="card-title">Teaching capacity</h3></div>
      <div class="card-body"><p>Each supervisor can oversee up to four student bays in a session.</p>
      <div class="table-responsive" role="region" aria-label="Supervision load" tabindex="0"><table class="data-table" id="supervisor-ratio-status"><thead><tr><th>Supervisor</th><th>Morning</th><th>Afternoon</th></tr></thead><tbody>
      ${state.supervisors.map((person,i) => `<tr><th scope="row">${person.name}</th>${rosters.map(r => `<td>${r.supervisors[i].activeBays} / ${person.maxRatio}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div></div></section></div>
      <section class="card"><div class="card-header"><div><h3 class="card-title">Workshop waiting list</h3>
      <p class="card-subtitle">${course.name} · ${course.seatsBooked} of ${course.seatsTotal} places booked</p></div></div>
      <div class="card-body"><div id="waitlist-alert-container">
      ${state.waitlistOffer ? `<p>One place is held for ${state.waitlistOffer.clientName} at ${state.waitlistOffer.clientOrg}.</p>
      <button type="button" class="btn btn-primary" id="btn-claim-waitlist" ${staff || (state.currentRole === 'booker' && state.currentUser.name === state.waitlistOffer.clientName) ? '' : 'disabled'}>Accept offered place</button>` : `
      <p>${waiting.length ? 'A workshop cancellation releases the next place to the waiting list.' : 'The waiting list is clear.'}</p>
      <button type="button" class="btn btn-secondary" id="btn-simulate-waitlist" ${!staff || !waiting.length ? 'disabled' : ''}>Release a workshop place</button>`}
      </div></div></section>`}`;
    document.getElementById('btn-open-booking-modal').addEventListener('click', () => openEditor(null));
    container.querySelectorAll('[data-amend]').forEach(button => button.addEventListener('click', () => openEditor(button.dataset.amend)));
    container.querySelectorAll('[data-cancel],[data-keep]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.cancel || button.dataset.keep;
      cancelId = button.dataset.cancel || null;
      renderBookingView();
      container.querySelector(cancelId ? '[data-keep="' + id + '"]' : '[data-cancel="' + id + '"]')?.focus();
    }));
    container.querySelectorAll('[data-confirm]').forEach(button => button.addEventListener('click', async () => {
      const id = button.dataset.confirm;
      if (await store.cancelBooking(id)) {
        cancelId = null; lastMessage = id + ' cancelled. Its resources are available again.';
        renderBookingView(); document.getElementById('btn-open-booking-modal').focus();
      }
    }));
    bindWaitlist();
    if (root.ServiceDesk) root.ServiceDesk.mountBooking(container);
  }

  function editorField(key, label, options) {
    const id = 'booking-' + fieldIds[key] + '-select';
    return `<div class="form-group"><label for="${id}" class="form-label">${label}</label>
      <select id="${id}" class="form-control">${options.map(([value,text]) => `<option value="${value}">${text}</option>`).join('')}</select></div>`;
  }

  function openEditor(id) {
    const state = store.getState();
    const modal = document.getElementById('booking-modal');
    const existing = state.reservations.find(b => b.id === id);
    const patient = state.currentRole === 'patient';
    const booking = existing || {slot:'morning', serviceId:state.currentRole === 'booker' ? 'commercial_cpet' : 'student_osteo',
      practitionerId:'stu_walker',supervisorId:'sup_jenkins', roomId:'rm_tr_g04', equipmentId:'none'};
    modal.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-header"><div>
      <h2 class="modal-title">${id ? 'Change appointment ' + id : 'Book an appointment'}</h2>
      <p class="card-subtitle">Saturday 31 October · Liverpool</p></div><button id="btn-close-booking-modal" class="btn-close-modal" type="button">Close</button></div>
      <form id="appointment-editor" class="modal-body">
      ${!existing && ['supervisor','manager'].includes(state.currentRole) ? `<label for="for-patient" class="form-label">Book on behalf of</label>
      <select class="form-control mb-2" id="for-patient"><option value="">No linked patient</option><option value="pat_taylor">James Taylor · osteopathy episode</option></select>` : ''}
      <div class="grid-2-col mb-3">
      ${editorField('slot','Session',Object.entries(sessions))}
      ${patient ? '<p class="form-label">Student osteopathy · supervised appointment</p>' : `${editorField('serviceId','Service',Object.entries(services).filter(([key]) => state.currentRole === 'patient' ? key === 'student_osteo' : state.currentRole === 'booker' ? key === 'commercial_cpet' : true))}
      ${editorField('practitionerId','Practitioner',[...state.students.map(p=>[p.id,p.name]),['sup_davies','Dr. Mark Davies']])}
      ${editorField('supervisorId','Supervisor',[...state.supervisors.map(p=>[p.id,p.name]),['not_required','Not required for laboratory hire']])}
      ${editorField('roomId','Room',state.facilities.map(r=>[r.id,r.name]))}
      ${editorField('equipmentId','Equipment',[['none','No additional equipment'],...state.equipment.map(e=>[e.id,e.name + (e.status === 'maintenance_lock' ? ' (out of service)' : '')])])}`}
      </div><p id="booking-status-badge" role="status" class="text-sm"></p>
      <p id="constraint-warning-banner" class="text-danger"></p><button type="submit" class="btn btn-primary" id="btn-book-slot">${id ? 'Save changes' : 'Confirm appointment'}</button></form></div>`;
    const field = name => document.getElementById('booking-' + name + '-select');
    const values = () => {
      if (patient) {
        const slot = field('slot').value;
        const candidate = {...booking,slot};
        const rooms = [candidate.roomId,...state.facilities.filter(room => room.type === 'clinical_bay').map(room => room.id)];
        return rooms.map(roomId => ({...candidate,roomId})).find(request => store.checkBooking(request,id).allowed) || candidate;
      }
      return {...Object.fromEntries(Object.entries(fieldIds).map(([key,name]) => [key,field(name).value])),
        forPatient:document.getElementById('for-patient')?.value || ''};
    };
    for (const [key,name] of Object.entries(fieldIds)) {
      if (field(name)) field(name).value = booking[key] || 'not_required';
    }
    function adjustService() {
      const lab = field('service').value === 'commercial_cpet';
      field('practitioner').value = lab ? 'sup_davies' : 'stu_walker';
      field('supervisor').value = lab ? 'not_required' : 'sup_jenkins';
      field('room').value = lab ? 'rm_tr_env' : 'rm_tr_g04';
      field('equipment').value = lab ? 'eq_cpet_01' : 'none';
      field('supervisor').disabled = lab;
    }
    if (!patient) {
      if (!existing) adjustService();
      field('supervisor').disabled = field('service').value === 'commercial_cpet';
      field('service').addEventListener('change', adjustService);
    }
    const editor = document.getElementById('appointment-editor');
    const check = () => {
      const selection = values(), result = store.checkBooking(selection, id);
      const unchanged = existing && Object.keys(fieldIds).every(key => (existing[key] || 'not_required') === selection[key]);
      document.getElementById('btn-book-slot').disabled = !result.allowed || !!unchanged;
      document.getElementById('booking-status-badge').textContent = !result.allowed ? 'This selection is unavailable.' : unchanged ? 'Choose a different session or resource.' : 'This selection is available.';
      document.getElementById('constraint-warning-banner').textContent = Object.values(result.issues).join(' ');
    };
    editor.addEventListener('change', check);
    editor.addEventListener('submit', async event => {
      event.preventDefault();
      if (document.getElementById('btn-book-slot').disabled) return;
      if (await store.reserveBooking(values(), id)) {
        const ref = id || store.getState().reservations.at(-1).id;
        modal.hidden = true; lastMessage = ref + (id ? ' updated.' : ' booked.');
        renderBookingView(); document.getElementById('btn-open-booking-modal').focus();
      } else check();
    });
    document.getElementById('btn-close-booking-modal').addEventListener('click', () => {modal.hidden = true;});
    check(); modal.hidden = false;
  }

  function bindWaitlist() {
    const waitlistBtn = document.getElementById('btn-simulate-waitlist');
    if (waitlistBtn) {
      waitlistBtn.addEventListener('click', async () => {
        const state = root.AppStore.getState();
        const course = state.services.find(item => item.id === 'srv_cpd_manip');
        const candidate = state.waitlist.find(entry => entry.serviceId === course?.id && entry.status === 'WAITING');
        if (state.waitlistOffer || !course || course.seatsBooked === 0 || !candidate) return;
        root.AppStore.setState({
          services: state.services.map(item => item.id === course.id ? {...item, seatsBooked: item.seatsBooked - 1} : item),
          waitlistOffer: {...candidate, serviceName: course.name},
          waitlist: state.waitlist.map(entry => entry.id === candidate.id ? {...entry, status: 'OFFERED'} : entry)
        });
        await root.AppStore.addAuditLog('WAITLIST_OFFER_DISPATCHED', 'Sample cancellation: one course place offered to ' + candidate.clientName + ' in this browser.');
      });
    }

    const claimBtn = document.getElementById('btn-claim-waitlist');
    if (claimBtn) {
      claimBtn.addEventListener('click', async () => {
        const state = root.AppStore.getState();
        const offer = state.waitlistOffer;
        const course = state.services.find(item => item.id === offer?.serviceId);
        if (!['manager','supervisor'].includes(state.currentRole) && !(state.currentRole === 'booker' && state.currentUser.name === offer?.clientName)) return;
        if (!offer || !course || course.seatsBooked >= course.seatsTotal) return;
        root.AppStore.setState({
          services: state.services.map(item => item.id === course.id ? {...item, seatsBooked: item.seatsBooked + 1} : item),
          waitlist: state.waitlist.map(entry => (entry.id === offer.id || (entry.serviceId === offer.serviceId && entry.clientName === offer.clientName)) ? {...entry, status: 'CLAIMED'} : entry),
          waitlistOffer: null
        });
        await root.AppStore.addAuditLog('WAITLIST_SEAT_CLAIMED', 'Sample course place claimed by ' + offer.clientName + '.');
      });
    }
  }

  root.BookingModule = {render:renderBookingView};
})(typeof self !== 'undefined' ? self : this);
