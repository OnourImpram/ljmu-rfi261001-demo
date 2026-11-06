(function (root) {
  'use strict';

  const courseId = 'srv_cpd_manip';
  const clinicalServices = {osteopathy: 'student_osteo'};
  const slots = {morning: '09:00–11:00', afternoon: '14:00–16:00'};
  const templates = {osteopathy: 'Functional change', physiotherapy: 'Movement observation', cardiovascular: 'Screening observation', physiology: 'Exercise observation', sc: 'Training observation'};
  const printed = {subject: 'Teaching clinic referral', body: 'Fictional teaching document. The referring practitioner requests a review of the participant’s activity goals and a follow-up note for the supervising clinician.'};
  const progressDrafts = new Map();
  let sampleIdentity;
  const store = () => root.AppStore;
  const escape = value => store().escapeText(String(value ?? ''));
  const permitted = (state, key) => {
    const record = state.records[key];
    return record && ((state.currentRole === 'supervisor' && record.supervisorId === state.currentUser.id) ||
      (state.currentRole === 'student' && record.authorId === state.currentUser.id));
  };
  function whole(value, low, high) {
    const n = Number(value);
    return String(value).trim() !== '' && Number.isInteger(n) && n >= low && n <= high;
  }
  function courseCapacity(state) {
    const course = state.services.find(item => item.id === courseId);
    const held = state.waitlistOffer?.serviceId === courseId ? 1 : 0;
    return {course, held, free: Math.max(0, course.seatsTotal - course.seatsBooked - held)};
  }
  function receipt(state, message, ownerId, reference) {
    return [...(state.bookingNotices || []), {message, ownerId, reference, time: new Date().toISOString()}];
  }
  function changeCourse(services, changes) {
    return services.map(item => item.id === courseId ? {...item, ...changes} : item);
  }
  function write(s,patch,action,resource) {
    const id = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : Date.now().toString(36) + '-' + s.auditLog.length;
    const entry = {id: 'evt-' + id, timestamp: new Date().toISOString(),
      userId: s.currentUser.id, userName: s.currentUser.name, role: s.currentRole, action, resource, hash: ''};
    store().setState({...patch, auditLog: [entry,...s.auditLog]});
  }
  function setCourseLimit(limit) {
    const s = store().getState();
    const {course, held} = courseCapacity(s);
    if (s.currentRole !== 'manager' || !whole(limit, Math.max(1, course.seatsBooked + held), 60)) return false;
    if (course.seatsTotal === Number(limit)) return false;
    write(s,{services: changeCourse(s.services, {seatsTotal: Number(limit)})},'COURSE_CAPACITY_CHANGED',courseId);
    return true;
  }
  function reservePlaces(count) {
    const s = store().getState(), {course, free} = courseCapacity(s);
    if (!['manager', 'booker'].includes(s.currentRole) || !whole(count, 1, free)) return false;
    const bookings = s.groupBookings || [], owner = s.personas.booker;
    const id = 'GR-' + String(bookings.length + 1).padStart(4, '0');
    const booking = {id, places: Number(count), serviceId: courseId, ownerId: owner.id, createdBy: s.currentUser.id, organisation: owner.organization, status: 'Booked'};
    write(s,{
      services: changeCourse(s.services, {seatsBooked: course.seatsBooked + booking.places}),
      groupBookings: [...bookings, booking],
      bookingNotices: receipt(s, booking.places + (booking.places === 1 ? ' place confirmed' : ' places confirmed'), owner.id, id)
    },'COURSE_GROUP_RESERVED',id);
    return id;
  }
  function groupReleaseAllowed(s,id) {
    const order = s.orders.find(item => item.groupBookingId === id);
    if (!order) return true;
    const account = store().invoiceAccount(order.id);
    return !!account && account.remaining.every(quantity => quantity === 0) &&
      account.paidPence === account.refundedPence && account.duePence === 0 && account.refundablePence === 0;
  }
  function cancelGroup(id) {
    const s = store().getState(), {course} = courseCapacity(s);
    const booking = (s.groupBookings || []).find(item => item.id === id);
    if (!booking || booking.status !== 'Booked' || (s.currentRole !== 'manager' && (s.currentRole !== 'booker' || booking.ownerId !== s.currentUser.id))) return false;
    if (!groupReleaseAllowed(s,id) || course.seatsBooked < booking.places) return false;
    write(s,{
      groupBookings: s.groupBookings.map(item => item.id === id ? {...item, status: 'Cancelled'} : item),
      services: changeCourse(s.services, {seatsBooked: course.seatsBooked - booking.places}),
      bookingNotices: receipt(s, 'Reservation cancelled', booking.ownerId, id)
    },'COURSE_GROUP_CANCELLED',id);
    return true;
  }
  function clinicalDetails(state, key) {
    return state.clinicExtensions?.[key] || {entries: [], visits: [], field: templates[key]};
  }
  function draftKey(state, key, field) {
    return JSON.stringify([state.currentUser.id, state.records[key].id, field]);
  }
  function bindProgressDraft(form, state, key, field) {
    if (!form) return;
    const id = draftKey(state,key,field);
    const note = form.querySelector('#follow-up-note'), value = form.querySelector('#follow-up-value'), attach = form.querySelector('#attach-referral');
    const draft = progressDrafts.get(id);
    if (draft) {
      note.value = draft.note;
      value.value = draft.value;
      attach.checked = draft.attached;
    }
    form.addEventListener('input', () => {
      if (note.value || value.value || attach.checked) progressDrafts.set(id,{note:note.value,value:value.value,attached:attach.checked});
      else progressDrafts.delete(id);
    });
  }
  function saveClinical(s, key, data, action, reference) {
    write(s,{clinicExtensions: {...s.clinicExtensions, [key]: data}},action,reference);
  }
  function setObservationField(key, field, studentMayWrite) {
    const s = store().getState(), text = String(field || '').trim();
    if (!permitted(s,key) || s.currentRole !== 'supervisor' || !text || text.length > 60) return false;
    const data = clinicalDetails(s,key);
    const allowStudent = studentMayWrite === undefined ? data.studentMayWrite !== false : studentMayWrite === true;
    if (data.field === text && allowStudent === (data.studentMayWrite !== false)) return false;
    saveClinical(s,key,{...data, field: text, studentMayWrite:allowStudent},'EPR_TEMPLATE_CHANGED',key);
    return true;
  }
  function appendEntry(key, note, observation, attach) {
    const s = store().getState(), text = String(note || '').trim(), value = String(observation || '').trim();
    if (!permitted(s,key) || !text || text.length > 400 || value.length > 160) return false;
    const data = clinicalDetails(s,key);
    if (s.currentRole === 'student' && data.studentMayWrite === false) return false;
    const entry = {id: 'PN-' + (data.entries.length + 1), note: text, field: data.field, observation: value, attached: attach === true,
      author: s.currentUser.name, at: new Date().toISOString(), status: s.currentRole === 'student' ? 'Awaiting review' : 'Recorded'};
    progressDrafts.delete(draftKey(s,key,data.field));
    saveClinical(s,key,{...data, entries: [...data.entries,entry]},'EPR_FOLLOW_UP_ADDED',s.records[key].id + '/' + entry.id);
    return entry.id;
  }
  function reviewEntry(key,id,decision) {
    const s = store().getState();
    if (!permitted(s,key) || s.currentRole !== 'supervisor' || !['Reviewed','Returned for clarification'].includes(decision)) return false;
    const data = clinicalDetails(s,key);
    if (!data.entries.some(item => item.id === id && item.status === 'Awaiting review')) return false;
    saveClinical(s,key,{...data, entries: data.entries.map(item => item.id === id ? {...item, status: decision, reviewer: s.currentUser.name, reviewedAt: new Date().toISOString()} : item)},'EPR_FOLLOW_UP_REVIEW',s.records[key].id + '/' + id);
    return true;
  }
  function linkedAppointment(s,key,b) {
    const record = s.records[key], patient = s.personas.patient;
    return !!(b && record && patient && b.serviceId === clinicalServices[key] &&
      b.ownerId === patient.id && b.patientId === patient.patientId && b.patientId === record.patientId &&
      b.episodeId === patient.episodeId && b.episodeId === record.id &&
      b.supervisorId === 'sup_jenkins' && record.supervisorId === s.personas.supervisor.id);
  }
  function openVisit(key, bookingId) {
    const s = store().getState(), data = clinicalDetails(s,key);
    if (!permitted(s,key) || s.currentRole !== 'supervisor' || !clinicalServices[key]) return false;
    const b = s.reservations.find(item => item.id === bookingId && item.status === 'Booked' && linkedAppointment(s,key,item));
    if (!b || data.visits.some(visit => visit.bookingId === bookingId)) return false;
    const visit = {bookingId, episode: s.records[key].episodeCode, episodeId:b.episodeId, patientId:b.patientId, state: 'Invited', invitedAt: new Date().toISOString()};
    saveClinical(s,key,{...data, visits: [...data.visits,visit]},'EPR_REMOTE_INVITATION',bookingId);
    return true;
  }
  function changeVisit(key,bookingId,action) {
    const s = store().getState(), data = clinicalDetails(s,key);
    const patientAction = s.currentRole === 'patient' && s.currentUser.episodeId === s.records[key]?.id && ['accept','decline','withdraw'].includes(action);
    const clinicianAction = s.currentRole === 'supervisor' && permitted(s,key) && action === 'attend';
    if (!patientAction && !clinicianAction) return false;
    const visit = data.visits.find(item => item.bookingId === bookingId);
    const b = s.reservations.find(item => item.id === bookingId && item.status === 'Booked');
    if (!visit || !linkedAppointment(s,key,b) || visit.patientId !== b.patientId || visit.episodeId !== b.episodeId) return false;
    const next = {Invited: {accept: 'Consent recorded', decline: 'Declined'}, 'Consent recorded': {attend: 'Attendance recorded', withdraw: 'Consent withdrawn'}}[visit.state]?.[action];
    if (!next) return false;
    saveClinical(s,key,{...data, visits: data.visits.map(item => item === visit ? {...item,state: next, changes: [...(item.changes || []),{action, by:s.currentUser.id, at:new Date().toISOString()}]} : item)},'EPR_REMOTE_' + action.toUpperCase(),bookingId);
    return true;
  }

  const openSections = new Map();
  function section(parent,id,title,intro,body,scope) {
    const key = scope + ':' + id;
    const element = document.createElement('details');
    element.id = id; element.className = 'card mt-3 mb-3';
    element.open = openSections.get(key) === true;
    element.innerHTML = '<summary class="card-header"><strong>' + title + '</strong></summary><div class="card-body"><p>' + intro + '</p>' + body + '<p data-feedback role="status"></p></div>';
    element.addEventListener('toggle', () => { if (element.isConnected) openSections.set(key,element.open); });
    parent.append(element);
    return element;
  }
  function afterAction(sectionId, control, message) {
    const panel = document.getElementById(sectionId);
    if (!panel) return;
    panel.open = true;
    panel.querySelector('[data-feedback]').textContent = message;
    (panel.querySelector(control) || panel.querySelector('summary')).focus({preventScroll:true});
  }
  function mountBooking(container) {
    const s = store().getState(), admin = s.currentRole === 'manager', booker = s.currentRole === 'booker';
    const {course,held,free} = courseCapacity(s);
    const visible = (s.groupBookings || []).filter(b => admin || b.ownerId === s.currentUser.id);
    const notices = (s.bookingNotices || []).filter(n => admin || n.ownerId === s.currentUser.id);
    const scope = s.currentUser.id;
    if (s.currentRole === 'patient') {
      mountPatient(container,s);
      return;
    }
    const header = escape(course.name) + ' · ' + free + ' available. ' + course.seatsBooked + ' booked' + (held ? ' and one held for the waiting list.' : '.');
    const config = admin ? '<form id="capacity-form" class="form-group mb-3"><label class="form-label" for="course-limit">Workshop capacity</label><input class="form-control" id="course-limit" type="number" min="' + Math.max(1,course.seatsBooked + held) + '" max="60" value="' + course.seatsTotal + '" required><button class="btn btn-secondary mt-2">Save capacity</button></form>' : '';
    const reservation = admin || booker ? '<form id="group-form" class="form-group mb-3"><label class="form-label" for="group-size">Places for ' + escape(s.personas.booker.organization) + '</label><input id="group-size" class="form-control" type="number" min="1" max="' + Math.max(1,free) + '" value="1" required><button class="btn btn-primary mt-2"' + (free ? '' : ' disabled') + '>Reserve places</button></form>' : '<p>The client booker can reserve places. The lab manager can change the limit or book on behalf of the club.</p>';
    const rows = visible.map(b => {
      const linked = s.orders.find(order => order.groupBookingId === b.id);
      const link = linked ? '<a href="#commercial" data-order-group="' + escape(b.id) + '">View linked order</a>' : '';
      const cancel = b.status === 'Booked' && groupReleaseAllowed(s,b.id) ? '<button class="btn btn-secondary btn-xs" type="button" data-cancel-group="' + escape(b.id) + '">Cancel ' + escape(b.id) + '</button>' : '';
      const action = [link,cancel].filter(Boolean).join(' ');
      return '<li><strong>' + escape(b.id) + '</strong> · ' + b.places + ' place(s) · ' + escape(b.status) + ' ' + action + '</li>';
    }).join('');
    const history = notices.length ? '<h4>Confirmation history</h4><ul>' + notices.slice(-8).reverse().map(n => '<li>' + escape(n.reference) + ' · ' + escape(n.message) + '</li>').join('') + '</ul><p>These confirmations stay in this browser.</p>' : '';
    const panel = section(container,'course-reservations','Course and group reservations',header,config + reservation + (rows ? '<ul>' + rows + '</ul>' : '') + history,scope);
    panel.querySelector('#capacity-form')?.addEventListener('submit',event => {
      event.preventDefault();
      const ok = setCourseLimit(panel.querySelector('#course-limit').value);
      afterAction(panel.id,'#course-limit',ok ? 'Capacity updated.' : 'Choose a new limit that covers booked and held places.');
    });
    panel.querySelector('#group-form')?.addEventListener('submit',event => {
      event.preventDefault();
      const id = reservePlaces(panel.querySelector('#group-size').value);
      afterAction(panel.id,'#group-size',id ? id + ' confirmed.' : 'There are too few places for this request.');
    });
    panel.querySelectorAll('[data-cancel-group]').forEach(button => button.addEventListener('click',() => {
      const ok = cancelGroup(button.dataset.cancelGroup);
      afterAction(panel.id,'#group-size',ok ? 'Places released.' : 'This reservation cannot be cancelled here.');
    }));
    panel.querySelectorAll('[data-order-group]').forEach(link => link.addEventListener('click',event => {
      event.preventDefault();
      root.CommercialModule.openGroupOrder(link.dataset.orderGroup);
    }));
  }
  function mountPatient(container,s) {
    const data = clinicalDetails(s,'osteopathy');
    const notices = (s.bookingNotices || []).filter(n => n.ownerId === s.currentUser.id);
    const messages = notices.map(n => '<li>' + escape(n.reference + ' · ' + n.message) + '</li>').reverse().join('');
    const visits = data.visits.map(v => {
      const booking = s.reservations.find(item => item.id === v.bookingId);
      if (!linkedAppointment(s,'osteopathy',booking) || v.patientId !== s.currentUser.patientId || v.episodeId !== s.currentUser.episodeId) return '';
      const current = booking.status === 'Booked' && booking.serviceId === clinicalServices.osteopathy;
      const action = (key,label) => '<button type="button" class="btn btn-secondary mt-2" data-visit="' + escape(v.bookingId) + '" data-action="' + key + '">' + label + '</button>';
      let choices = '';
      if (current && v.state === 'Invited') choices = action('accept','Agree to remote visit') + ' ' + action('decline','Decline remote visit');
      if (current && v.state === 'Consent recorded') choices = action('withdraw','Withdraw consent');
      return '<li><strong>' + escape(v.bookingId + ' · ' + slots[booking.slot]) + '</strong><p>' + escape(current ? v.state : 'Invitation closed') + '</p>' + choices + '</li>';
    }).join('');
    const panel = section(container,'patient-inbox','My appointment messages','Invitations and confirmations for this sample patient are saved in this browser.',
      (messages ? '<ul>' + messages + '</ul>' : '') + (visits ? '<h4>Remote follow-up</h4><p>Choose whether to attend remotely. You can withdraw consent before attendance is recorded.</p><ul>' + visits + '</ul>' : '<p>No remote appointment invitations.</p>'),s.currentUser.id);
    panel.querySelectorAll('[data-visit]').forEach(button => button.addEventListener('click',() => {
      const ok = changeVisit('osteopathy',button.dataset.visit,button.dataset.action);
      afterAction(panel.id,'summary',ok ? 'Your choice was saved.' : 'This invitation is no longer active.');
    }));
  }
  function mountRecord(container,key) {
    const s = store().getState();
    if (sampleIdentity !== s.personas) {
      progressDrafts.clear();
      sampleIdentity = s.personas;
    }
    if (!permitted(s,key)) return;
    const data = clinicalDetails(s,key), supervisor = s.currentRole === 'supervisor', scope = s.currentUser.id + ':' + key;
    const config = supervisor ? '<form id="case-template-form" class="form-group mb-3"><label class="form-label" for="case-field">Service observation field</label><input id="case-field" class="form-control" maxlength="60" value="' + escape(data.field) + '" required><label><input id="allow-student-followup" type="checkbox"' + (data.studentMayWrite !== false ? ' checked' : '') + '> Allow assigned students to add follow-ups for this service</label><div><button class="btn btn-secondary mt-2">Save service settings</button></div></form>' : '';
    const progress = supervisor || data.studentMayWrite !== false ? '<form id="progress-form" class="form-group"><label for="follow-up-note" class="form-label">Progress note</label><textarea id="follow-up-note" class="form-control" maxlength="400" required></textarea><label class="form-label" for="follow-up-value">' + escape(data.field) + '</label><input id="follow-up-value" class="form-control" maxlength="160"><label><input type="checkbox" id="attach-referral"> Attach the sample referral letter</label><div><button class="btn btn-primary mt-2">Add progress note</button></div></form>' : '<p>The service supervisor has restricted new follow-ups to clinicians.</p>';
    const entries = data.entries.map(entry => {
      const actions = supervisor && entry.status === 'Awaiting review' ? '<div><button type="button" class="btn btn-secondary" data-review="' + escape(entry.id) + '">Mark reviewed</button> <button type="button" class="btn btn-secondary" data-return="' + escape(entry.id) + '">Return for clarification</button></div>' : '';
      return '<li><strong>' + escape(entry.id) + ' · ' + escape(entry.status) + '</strong><p>' + escape(entry.note) + '</p>' + (entry.observation ? '<p>' + escape(entry.field) + ' · ' + escape(entry.observation) + '</p>' : '') + '<p>' + escape(entry.author) + ' · <time>' + escape(entry.at) + '</time></p>' + (entry.attached ? '<details><summary>' + printed.subject + '</summary><p>' + printed.body + '</p></details>' : '') + actions + '</li>';
    }).reverse().join('');
    const notes = section(container,'follow-up-history','Progress notes and documents','Add a follow-up to this case. Each entry keeps its author and time.',config + progress + (entries ? '<ol>' + entries + '</ol>' : ''),scope);
    bindProgressDraft(notes.querySelector('#progress-form'),s,key,data.field);
    notes.querySelector('#case-template-form')?.addEventListener('submit',event => {
      event.preventDefault(); const ok = setObservationField(key,notes.querySelector('#case-field').value,notes.querySelector('#allow-student-followup').checked);
      afterAction(notes.id,'#case-field',ok ? 'Service settings saved.' : 'No change to service settings.');
    });
    notes.querySelector('#progress-form')?.addEventListener('submit',event => {
      event.preventDefault();
      const id = appendEntry(key,notes.querySelector('#follow-up-note').value,notes.querySelector('#follow-up-value').value,notes.querySelector('#attach-referral').checked);
      afterAction(notes.id,'#follow-up-note',id ? id + ' added to the case.' : 'Enter a short progress note.');
    });
    notes.querySelectorAll('[data-review],[data-return]').forEach(button => button.addEventListener('click',() => {
      const ok = reviewEntry(key,button.dataset.review || button.dataset.return,button.dataset.review ? 'Reviewed' : 'Returned for clarification');
      afterAction(notes.id,'summary',ok ? 'Entry updated.' : 'Entry already reviewed.');
    }));
    if (!supervisor || !clinicalServices[key]) return;
    const options = s.reservations.filter(b => b.status === 'Booked' && linkedAppointment(s,key,b) && !data.visits.some(v => v.bookingId === b.id));
    const select = options.length ? '<form id="remote-invite-form"><label for="remote-appointment" class="form-label">Appointment for this episode</label><select class="form-control" id="remote-appointment">' + options.map(b => '<option value="' + escape(b.id) + '">' + escape(b.id + ' · ' + slots[b.slot]) + '</option>').join('') + '</select><button class="btn btn-secondary mt-2">Prepare patient invitation</button></form>' : '<p>Prepare an invitation from an active ' + escape(key) + ' appointment. <a href="#booking">Open bookings</a></p>';
    const visits = data.visits.map(v => {
      const b = s.reservations.find(item => item.id === v.bookingId);
      const active = b?.status === 'Booked' && linkedAppointment(s,key,b) && v.episodeId === b.episodeId && v.patientId === b.patientId;
      const button = (action,label) => '<button type="button" class="btn btn-secondary mt-2" data-visit="' + escape(v.bookingId) + '" data-action="' + action + '">' + label + '</button>';
      let actions = '';
      if (active && v.state === 'Invited') actions = '<p>The sample patient can respond in Bookings under My appointment messages.</p>';
      if (active && v.state === 'Consent recorded') actions = button('attend','Record attendance');
      return '<li><strong>' + escape(v.bookingId + ' · ' + (active ? slots[b.slot] : 'Invitation closed')) + '</strong><p>' + escape(v.episode + ' · ' + v.state) + '</p>' + actions + '</li>';
    }).join('');
    const remote = section(container,'remote-follow-up','Remote follow-up','Link an appointment to this episode and review the patient’s consent. The invitation and attendance record are local examples. Video and message delivery require a configured provider.',select + (visits ? '<ul>' + visits + '</ul>' : ''),scope);
    remote.querySelector('#remote-invite-form')?.addEventListener('submit',event => {
      event.preventDefault(); const ok = openVisit(key,remote.querySelector('#remote-appointment').value);
      afterAction(remote.id,'summary',ok ? 'Invitation prepared.' : 'Choose an active appointment.');
    });
    remote.querySelectorAll('[data-visit]').forEach(button => button.addEventListener('click',() => {
      const ok = changeVisit(key,button.dataset.visit,button.dataset.action);
      afterAction(remote.id,'summary',ok ? 'Remote visit record updated.' : 'Action unavailable.');
    }));
  }
  const api = {mountBooking,mountRecord,courseCapacity,setCourseLimit,reservePlaces,cancelGroup,setObservationField,appendEntry,reviewEntry,openVisit,changeVisit};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ServiceDesk = api;
})(globalThis);
