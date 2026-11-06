'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/store.js');
const clinic = {serviceId: 'student_osteo', practitionerId: 'stu_walker', supervisorId: 'sup_jenkins', roomId: 'rm_tr_g04', equipmentId: 'none'};
const cpet = {serviceId: 'commercial_cpet', practitionerId: 'sup_davies', supervisorId: 'sup_davies', roomId: 'rm_tr_env', equipmentId: 'eq_cpet_01'};

test('commercial reservation consumes the selected lab and cart without occupying a teaching bay or increasing a supervision load', async () => {
  store.reset();
  assert.deepEqual(await Promise.all([store.reserveBooking(cpet), store.reserveBooking(cpet)]), [true, false]);
  const state = store.getState();
  assert.deepEqual(state.supervisors.map(s => s.activeBays), [3, 1]);
  assert.equal(state.facilities.find(f => f.id === 'rm_tr_g04').status, 'available');
  assert.equal(state.facilities.find(f => f.id === 'rm_tr_env').status, 'occupied');
  assert.equal(state.equipment.find(e => e.id === 'eq_cpet_01').status, 'reserved');
  assert.equal(state.reservations.length, 1);
  assert.equal(state.reservations[0].supervisorId, null);
  assert.match(state.auditLog[0].resource, /Commercial CPET.*Environmental Hypoxia Chamber.*Mark Davies.*CPET Cart/);
});

test('clinic reservation applies the assigned supervisor, and room, practitioner and equipment conflicts each block a retry', async () => {
  store.reset();
  const selected = {...clinic, supervisorId: 'sup_davies', equipmentId: 'eq_fd_01'};
  assert.equal(await store.reserveBooking(selected), true);
  assert.deepEqual(store.getState().supervisors.map(s => s.activeBays), [3, 2]);
  const roomConflict = {...clinic, practitionerId: 'stu_patel'};
  const practitionerConflict = {...clinic, roomId: 'rm_ch_mov'};
  const assetConflict = {...clinic, practitionerId: 'stu_patel', roomId: 'rm_ch_mov', equipmentId: 'eq_fd_01'};
  for (const [request, key] of [[roomConflict, 'room'], [practitionerConflict, 'practitioner'], [assetConflict, 'equipment']]) {
    assert.deepEqual(Object.keys(store.checkBooking(request).issues), [key]);
    assert.equal(await store.reserveBooking(request), false);
  }
  assert.equal(store.getState().reservations.length, 1);
});

test('a different practitioner, room and equipment cannot bypass a full selected supervisor or calibration lock', async () => {
  store.reset();
  assert.equal(await store.reserveBooking(clinic), true);
  const second = {...clinic, practitionerId: 'stu_patel', roomId: 'rm_ch_mov'};
  assert.deepEqual(Object.keys(store.checkBooking(second).issues), ['ratio']);
  assert.equal(await store.reserveBooking(second), false);
  assert.equal(await store.reserveBooking({...second, supervisorId: 'sup_davies', equipmentId: 'eq_us_01'}), false);
  assert.equal(store.getState().reservations.length, 1);
});

test('a change keeps the reference and moves every allocation only after the target session is available', async () => {
  store.reset();
  const original = {...clinic, equipmentId:'eq_fd_01'};
  await store.reserveBooking(original);
  const id = store.getState().reservations[0].id;
  const target = {...original, slot:'afternoon', supervisorId:'sup_davies', practitionerId:'stu_patel', roomId:'rm_ch_mov'};
  await store.reserveBooking({...target, equipmentId:'none'});
  const before = JSON.stringify(store.getState().reservations);
  assert.equal(await store.reserveBooking(target, id), false);
  assert.equal(JSON.stringify(store.getState().reservations), before);
  assert.equal(store.bookingRoster('morning').equipment.find(e => e.id === 'eq_fd_01').status, 'reserved');
  const other = store.getState().reservations[1].id;
  assert.equal(await store.cancelBooking(other), true);
  assert.equal(await store.reserveBooking(target,id), true);
  assert.equal(store.getState().reservations[0].id,id);
  const morning = store.bookingRoster('morning');
  assert.equal(morning.facilities.find(r => r.id === clinic.roomId).status,'available');
  assert.equal(morning.equipment.find(e => e.id === 'eq_fd_01').status,'available');
  assert.equal(morning.supervisors[0].activeBays,3);
  const afternoon = store.bookingRoster('afternoon');
  assert.equal(afternoon.active[0].practitionerId,'stu_patel');
  assert.equal(afternoon.facilities.find(r => r.id === target.roomId).status,'occupied');
  assert.equal(afternoon.supervisors[1].activeBays,2);
  store.setRole('booker');
  assert.equal(await store.cancelBooking(id),false);
  assert.equal(await store.reserveBooking({...cpet,slot:'morning'},id),false);
  store.setRole('manager');
  assert.deepEqual(await Promise.all([store.cancelBooking(id),store.cancelBooking(id)]),[true,false]);
  assert.equal(store.bookingRoster('afternoon').active.length,0);
  assert.equal(store.bookingRoster('afternoon').supervisors[1].activeBays,1);
  assert.equal(store.getState().reservations[0].status, 'Cancelled');
});

test('booker can manage their own laboratory hire while staff-created and clinical records remain out of scope', async () => {
  store.reset();
  assert.equal(await store.reserveBooking(cpet),true);
  const staffId = store.getState().reservations[0].id;
  store.setRole('booker');
  assert.equal(await store.cancelBooking(staffId),false);
  assert.equal(await store.reserveBooking(clinic),false);
  assert.equal(await store.reserveBooking({...cpet,slot:'afternoon'}),true);
  assert.equal(await store.cancelBooking(store.getState().reservations[1].id),true);
});

test('patient manages only the linked osteopathy booking and notices remain bound to the original owner', async () => {
  store.reset();
  await store.reserveBooking(clinic);
  const staffBooking = store.getState().reservations[0];
  store.setRole('patient');
  assert.equal(await store.cancelBooking(staffBooking.id),false);
  assert.equal(await store.reserveBooking({...cpet,slot:'afternoon'}),false);
  assert.equal(await store.reserveBooking({...clinic,serviceId:'student_physio',slot:'afternoon'}),false);
  assert.equal(await store.reserveBooking({...clinic,slot:'afternoon'}),true);
  const own = store.getState().reservations[1];
  assert.equal(own.ownerId,'usr_patient_001');
  assert.equal(own.patientId,'pat_taylor'); assert.equal(own.episodeId,'rec_2026_0812');
  assert.equal(staffBooking.patientId,null); assert.equal(staffBooking.episodeId,null);
  assert.equal(await store.submitPurchaseOrder({poNumber:'denied'}),null);
  assert.equal(store.invoiceAccount(staffBooking.id),null);
  assert.equal(store.latestJournal(),null);
  assert.deepEqual(store.researchRows(),[]);
  store.setRole('supervisor');
  assert.equal(await store.reserveBooking({...clinic,slot:'afternoon',roomId:'rm_ch_mov'},own.id),true);
  assert.equal(await store.cancelBooking(own.id),true);
  const notices = store.getState().bookingNotices.filter(n=>n.reference===own.id);
  assert.deepEqual(notices.map(n=>n.ownerId),['usr_patient_001','usr_patient_001','usr_patient_001']);
  assert.match(notices.at(-1).message,/cancelled/);
});

test('reception must select a named patient before a booking acquires the clinical episode', async () => {
  store.reset();
  assert.equal(await store.reserveBooking({...cpet,forPatient:'pat_taylor'}),false);
  assert.equal(await store.reserveBooking({...clinic,forPatient:'pat_taylor'}),true);
  const booked = store.getState().reservations[0];
  assert.deepEqual([booked.ownerId,booked.patientId,booked.episodeId,booked.bookedBy],
    ['usr_patient_001','pat_taylor','rec_2026_0812','usr_sup_001']);
  assert.equal(await store.reserveBooking({...cpet,slot:'afternoon'},booked.id),false);
  assert.equal(await store.reserveBooking({...clinic,slot:'afternoon'},booked.id),true);
  const moved = store.getState().reservations[0];
  assert.deepEqual([moved.ownerId,moved.patientId,moved.episodeId],[booked.ownerId,booked.patientId,booked.episodeId]);
  store.setRole('patient');
  assert.equal(await store.cancelBooking(booked.id),true);
});
