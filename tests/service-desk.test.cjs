'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/store.js');
globalThis.AppStore = store;
const desk = require('../js/service-desk.js');

test('confirmed groups share workshop capacity with individual places and held offers', () => {
  store.reset();
  store.setRole('manager');
  assert.equal(desk.setCourseLimit(23), true);
  store.setState({waitlistOffer: {serviceId:'srv_cpd_manip'}});
  assert.equal(desk.courseCapacity(store.getState()).free, 2);
  store.setRole('booker');
  assert.equal(desk.reservePlaces(3), false);
  assert.equal(desk.setCourseLimit(24), false);
  const id = desk.reservePlaces(2);
  assert.equal(id, 'GR-0001');
  assert.equal(desk.reservePlaces(1), false);
  store.setRole('manager');
  assert.equal(desk.setCourseLimit(22), false);
  assert.equal(desk.cancelGroup(id), true);
  assert.equal(desk.cancelGroup(id), false);
  assert.equal(desk.courseCapacity(store.getState()).free, 2);
});

test('consent belongs to the invited sample patient and a cancelled appointment cannot become attended', () => {
  store.reset();
  const booking = {id:'AP-0001', status:'Booked', serviceId:'student_osteo', slot:'morning', ownerId:'usr_patient_001', patientId:'pat_taylor', episodeId:'rec_2026_0812', supervisorId:'sup_jenkins'};
  for (const changes of [{ownerId:'usr_sup_001'}, {patientId:null}, {episodeId:'different'}, {supervisorId:'sup_davies'}, {serviceId:'student_physio'}]) {
    store.setState({reservations:[{...booking,...changes}]});
    assert.equal(desk.openVisit('osteopathy',booking.id), false);
  }
  store.setState({reservations:[booking]});
  assert.equal(desk.openVisit('osteopathy',booking.id), true);
  assert.equal(desk.openVisit('osteopathy',booking.id), false);
  assert.equal(desk.changeVisit('osteopathy',booking.id,'attend'), false);
  assert.equal(desk.changeVisit('osteopathy',booking.id,'accept'), false);
  store.setRole('patient');
  assert.equal(desk.changeVisit('osteopathy',booking.id,'accept'), true);
  assert.equal(desk.changeVisit('osteopathy',booking.id,'attend'), false);
  store.setRole('supervisor');
  store.setState({reservations:[{...booking,status:'Cancelled'}]});
  assert.equal(desk.changeVisit('osteopathy',booking.id,'attend'), false);
});

test('progress entries retain the original field and cannot be reviewed twice', () => {
  store.reset();
  assert.equal(desk.setObservationField('osteopathy','Session goal'), true);
  store.setRole('student');
  const id = desk.appendEntry('osteopathy','Follow-up completed','Review scheduled',true);
  assert.equal(id,'PN-1');
  assert.equal(desk.reviewEntry('osteopathy',id,'Reviewed'),false);
  store.setRole('supervisor');
  assert.equal(desk.setObservationField('osteopathy','Activity goal'),true);
  assert.equal(desk.reviewEntry('osteopathy',id,'Returned for clarification'),true);
  assert.equal(desk.reviewEntry('osteopathy',id,'Reviewed'),false);
  const entry = store.getState().clinicExtensions.osteopathy.entries[0];
  assert.equal(entry.field,'Session goal');
  assert.equal(entry.note,'Follow-up completed');
  store.setRole('booker');
  assert.equal(desk.appendEntry('osteopathy','A commercial note','',false),false);
});

test('progress audit resources identify the case while keeping local PN references', () => {
  store.reset();
  store.setRole('student');
  const osteopathy = desk.appendEntry('osteopathy','Osteopathy follow-up','',false);
  const physiotherapy = desk.appendEntry('physiotherapy','Physiotherapy follow-up','',false);
  assert.equal(osteopathy,'PN-1');
  assert.equal(physiotherapy,'PN-1');
  const expected = ['rec_2026_0812/PN-1','rec_2026_0904/PN-1'];
  const added = store.getState().auditLog.filter(entry => entry.action === 'EPR_FOLLOW_UP_ADDED');
  assert.deepEqual(added.map(entry => entry.resource).sort(), expected);
  store.setRole('supervisor');
  assert.equal(desk.reviewEntry('osteopathy',osteopathy,'Reviewed'),true);
  assert.equal(desk.reviewEntry('physiotherapy',physiotherapy,'Reviewed'),true);
  const reviewed = store.getState().auditLog.filter(entry => entry.action === 'EPR_FOLLOW_UP_REVIEW');
  assert.deepEqual(reviewed.map(entry => entry.resource).sort(), expected);
  assert.equal(store.getState().clinicExtensions.osteopathy.entries[0].id,'PN-1');
  assert.equal(store.getState().clinicExtensions.physiotherapy.entries[0].id,'PN-1');
});

test('course actions retain unique audit writes without randomUUID in the same tick', () => {
  const cryptoProperty = Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const clock = Date.now;
  try {
    for (const missing of [{},undefined]) {
      store.reset(); store.setRole('manager');
      Object.defineProperty(globalThis,'crypto',{value:missing,configurable:true});
      Date.now = () => 1793870000000;
      assert.equal(desk.setCourseLimit(23),true);
      assert.equal(desk.reservePlaces(2),'GR-0001');
      const entries = store.getState().auditLog.filter(entry =>
        ['COURSE_CAPACITY_CHANGED','COURSE_GROUP_RESERVED'].includes(entry.action));
      assert.equal(entries.length,2);
      assert.equal(new Set(entries.map(entry => entry.id)).size,2);
      assert.deepEqual(entries.map(entry => entry.action).sort(),['COURSE_CAPACITY_CHANGED','COURSE_GROUP_RESERVED']);
      assert.equal(desk.courseCapacity(store.getState()).free,1);
    }
  } finally {
    Date.now = clock;
    if (cryptoProperty) Object.defineProperty(globalThis,'crypto',cryptoProperty);
    else delete globalThis.crypto;
  }
});
