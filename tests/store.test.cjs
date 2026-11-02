'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const path = require('node:path');
const storePath = path.resolve(__dirname, '../js/store.js');
function freshStore(crypto = webcrypto) {
  const data = new Map();
  global.window = { crypto, localStorage: { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) } };
  delete require.cache[storePath];
  return require(storePath);
}
async function role(store, roleId) { store.setRole(roleId); await new Promise(resolve => setImmediate(resolve)); }

test('student cannot countersign through the action API', async () => {
  const store = freshStore(); await role(store, 'student');
  await assert.rejects(store.executeCountersignature('osteopathy'), /supervisor|authoris|permission/i);
  assert.match(store.getState().records.osteopathy.status, /DRAFT/);
});
test('only the assigned supervisor can countersign', async () => {
  const store = freshStore(); store.getState().records.osteopathy.supervisorId = 'another_supervisor';
  await assert.rejects(store.executeCountersignature('osteopathy'), /assigned|authoris|permission/i);
});
test('countersigning an already signed version is idempotent', async () => {
  const store = freshStore(); const hours = store.getState().students[0].hoursLogged;
  const first = await store.executeCountersignature('osteopathy');
  const second = await store.executeCountersignature('osteopathy');
  assert.equal(second.signatureHash, first.signatureHash);
  assert.equal(store.getState().students[0].hoursLogged, hours + 1);
});
test('double-click countersign credits a clinical encounter once', async () => {
  const store = freshStore(); const hours = store.getState().students[0].hoursLogged;
  const results = await Promise.all([store.executeCountersignature('osteopathy'), store.executeCountersignature('osteopathy')]);
  assert.equal(results[0].signatureHash, results[1].signatureHash);
  assert.equal(store.getState().students[0].hoursLogged, hours + 1);
});
test('unsupported Web Crypto never produces a pretend SHA-256 digest', async () => {
  const store = freshStore({});
  await assert.rejects(store.executeCountersignature('osteopathy'), /crypto|HTTPS|SHA-256/i);
  assert.match(store.getState().records.osteopathy.status, /DRAFT/);
});
test('research JSON follows recorded consent', () => {
  const store = freshStore(); store.getState().records.osteopathy.researchConsent = false;
  const data = JSON.parse(store.generateResearchJSON());
  assert.equal(data.some(row => /osteo/i.test(row.discipline)), false);
});
test('commercial role cannot export clinical research data', async () => {
  const store = freshStore(); await role(store, 'manager');
  assert.throws(() => store.generateResearchJSON(), /supervisor|authoris|permission/i);
});
test('research export omits direct identifiers and clinical free text', () => {
  const store = freshStore(); const json = store.generateResearchJSON();
  for (const rec of Object.values(store.getState().records)) {
    assert.equal(json.includes(rec.patientName), false);
    assert.equal(json.includes(rec.dob), false);
    assert.equal(json.includes(rec.subjective), false);
  }
});
test('corporate booker cannot approve their purchase order', async () => {
  const store = freshStore(); await role(store, 'booker');
  const order = await store.submitPurchaseOrder({ poNumber: 'TEST-PO-101' });
  await assert.rejects(store.approvePurchaseOrder(order.id), /manager|authoris|permission/i);
  assert.equal(store.getState().orders[0].status, 'PENDING_PO_VERIFICATION');
});
test('empty baskets cannot create invoices', async () => {
  const store = freshStore(); await role(store, 'booker'); store.setState({ cart: [] });
  await assert.rejects(store.submitPurchaseOrder({ poNumber: 'EMPTY-101' }), /empty|basket/i);
});
test('blank PO reference is rejected', async () => {
  const store = freshStore(); await role(store, 'booker');
  await assert.rejects(store.submitPurchaseOrder({ poNumber: '  ' }), /reference|purchase order|PO/i);
});
test('repeated order submission is idempotent for the same PO and basket', async () => {
  const store = freshStore(); await role(store, 'booker');
  const a = await store.submitPurchaseOrder({ poNumber: 'TEST-PO-201' });
  const b = await store.submitPurchaseOrder({ poNumber: 'TEST-PO-201' });
  assert.equal(a.id, b.id);
});
test('local approval prepares an export without claiming a live Oracle transfer', async () => {
  const store = freshStore(); await role(store, 'booker');
  const order = await store.submitPurchaseOrder({ poNumber: 'TEST-PO-301' });
  await role(store, 'manager'); await store.approvePurchaseOrder(order.id);
  const approved = store.getState().orders.find(x => x.id === order.id);
  assert.equal(approved.oracleEbsSynced, false);
  assert.equal(approved.exportStatus, 'READY');
});
test('Oracle mapping export is derived from approved orders rather than fixed sample rows', async () => {
  const store = freshStore(); await role(store, 'manager'); store.setState({ orders: [] });
  assert.equal(store.generateOracleGLCSV().trim().split(/\r?\n/).length, 1);
});
test('known mixed-basket totals reconcile', () => {
  const store = freshStore();
  assert.deepEqual(store.calculateCartTotals(), { netExempt: 105, netStandard: 675, vatStandard: 135, totalGross: 915 });
});
test('negative and fractional quantities are rejected', () => {
  const store = freshStore(); store.getState().cart[0].qty = -1;
  assert.throws(() => store.calculateCartTotals(), /quantity|invalid/i);
});
test('unknown roles including inherited object keys are rejected', () => {
  const store = freshStore();
  assert.throws(() => store.setRole('__proto__'), /role|unknown/i);
  assert.equal(store.getState().currentRole, 'supervisor');
});

const request = (patch = {}) => ({ serviceId: 'srv_osteo_eval', practitionerId: 'stu_reilly', supervisorId: 'sup_jenkins', roomId: 'rm_tr_g04', equipmentId: 'eq_standard', slotId: 'reference-afternoon', ...patch });
test('a final supervised bay is allocated once and cannot be overbooked', () => {
  const store = freshStore(); store.confirmBooking(request());
  assert.equal(store.getState().supervisors[0].activeBays, 4);
  assert.throws(() => store.confirmBooking(request()), /occupied|available|allocated/i);
  assert.equal(store.getState().bookings.length, 1);
});
test('the selected supervisor is updated, not a hard-coded supervisor', () => {
  const store = freshStore(); const service = store.getState().services.find(x => x.discipline === 'cardiovascular');
  store.confirmBooking(request({ serviceId: service.id, practitionerId: 'stu_morgan', supervisorId: 'sup_davies', roomId: 'rm_tr_bodycomp' }));
  assert.equal(store.getState().supervisors[0].activeBays, 3);
  assert.equal(store.getState().supervisors[1].activeBays, 2);
});
test('full supervision capacity blocks an otherwise available bay', () => {
  const store = freshStore(); store.getState().supervisors[0].activeBays = 4;
  assert.equal(store.evaluateBooking(request()).valid, false);
  assert.throws(() => store.confirmBooking(request()), /allocated/i);
});
test('equipment under maintenance cannot be reserved', () => {
  const store = freshStore();
  assert.throws(() => store.confirmBooking(request({ equipmentId: 'eq_us_01' })), /Equipment/);
});
test('a student cannot be allocated to another supervisor', () => {
  const store = freshStore();
  assert.equal(store.evaluateBooking(request({ supervisorId: 'sup_davies' })).valid, false);
});
test('booker cannot allocate a clinical encounter directly', async () => {
  const store = freshStore(); await role(store, 'booker');
  assert.throws(() => store.confirmBooking(request()), /clinical role/);
});
test('waiting-list offer expires and does not change capacity after expiry', async () => {
  const store = freshStore(); const now = Date.now(); store.createWaitlistOffer(now);
  await role(store, 'booker');
  assert.throws(() => store.claimWaitlistOffer(now + 900000), /expired/);
});
test('a waiting-list place is accepted once by its invited booker', async () => {
  const store = freshStore(); const now = Date.now(); store.createWaitlistOffer(now);
  assert.throws(() => store.claimWaitlistOffer(now), /invited/);
  await role(store, 'booker'); store.claimWaitlistOffer(now + 1000);
  assert.throws(() => store.claimWaitlistOffer(now + 2000), /available/);
  const service = store.getState().services.find(x => x.id === 'srv_cpd_manip');
  assert.equal(service.seatsBooked, service.seatsTotal);
});
test('saving a draft persists content and advances its version', async () => {
  const store = freshStore(); await role(store, 'student');
  const fields = { subjective:'Updated history', objective:'Updated findings', assessment:'Updated assessment', studentDraftPlan:'Updated plan' };
  store.saveDraft('osteopathy', fields);
  assert.equal(store.getState().records.osteopathy.version, 2);
  assert.equal(store.getState().records.osteopathy.activePlan, fields.studentDraftPlan);
});
test('supervisor cannot overwrite the student draft', () => {
  const store = freshStore(); assert.throws(() => store.saveDraft('osteopathy', {}), /authoring student/);
});
test('SHA-256 review binds the current record content', async () => {
  const store = freshStore(); await store.executeCountersignature('osteopathy');
  assert.equal((await store.verifyCountersignature('osteopathy')).valid, true);
  store.getState().records.osteopathy.subjective = 'tampered';
  assert.equal((await store.verifyCountersignature('osteopathy')).valid, false);
});
test('reset during asynchronous countersign cannot sign the reset record', async () => {
  const store = freshStore(); const pending = store.executeCountersignature('osteopathy'); store.reset();
  await assert.rejects(pending, /changed/);
  assert.match(store.getState().records.osteopathy.status, /DRAFT/);
});
test('manager cannot approve their own submitted order', async () => {
  const store = freshStore(); await role(store, 'manager');
  const order = await store.submitPurchaseOrder({ poNumber:'SELF-101' });
  await assert.rejects(store.approvePurchaseOrder(order.id), /different authorised/);
});
test('repeat PO approval keeps the same export batch', async () => {
  const store = freshStore(); await role(store, 'booker');
  const order = await store.submitPurchaseOrder({ poNumber:'ONCE-101' }); await role(store, 'manager');
  const first = await store.approvePurchaseOrder(order.id), next = await store.approvePurchaseOrder(order.id);
  assert.equal(first.oracleBatchId, next.oracleBatchId);
});
test('altering a previously submitted PO basket requires a new reference', async () => {
  const store = freshStore(); await role(store, 'booker'); await store.submitPurchaseOrder({ poNumber:'UNIQUE-101' });
  store.getState().cart[0].qty = 2;
  await assert.rejects(store.submitPurchaseOrder({ poNumber:'UNIQUE-101' }), /different order/);
});
test('audit entries use true SHA-256 chained to the previous entry', async () => {
  const store = freshStore(); await store.addAuditLog('TEST_A', 'one'); await store.addAuditLog('TEST_B', 'two');
  const entries = store.getAuditEntries();
  assert.match(entries[0].hash, /^SHA256:[a-f0-9]{64}$/);
  assert.equal(entries[0].previousHash, entries[1].hash);
});
test('audit visibility excludes clinical actions from finance roles', async () => {
  const store = freshStore(); await store.addAuditLog('EPR_DRAFT_SAVE', 'record');
  await role(store, 'manager'); assert.equal(store.getAuditEntries().length, 0);
});
test('research study identifiers remain stable when another record is excluded', () => {
  const store = freshStore(); const before = store.researchRows().find(x => x.discipline === 'physiotherapy').researchId;
  store.getState().records.osteopathy.researchConsent=false;
  assert.equal(store.researchRows().find(x => x.discipline === 'physiotherapy').researchId,before);
});
test('a clinician cannot reserve a discipline outside their reference scope', () => {
  const store = freshStore();
  assert.equal(store.evaluateBooking(request({practitionerId:'sup_davies'})).valid,false);
});
test('switching persona while a review is hashing prevents commitment', async () => {
  const store=freshStore(); const pending=store.executeCountersignature('osteopathy');store.setRole('student');
  await assert.rejects(pending,/changed/);assert.match(store.getState().records.osteopathy.status,/DRAFT/);
});
test('changing content while a review is hashing prevents stale approval', async () => {
  const store=freshStore();const pending=store.executeCountersignature('osteopathy');store.getState().records.osteopathy.objective='Changed';
  await assert.rejects(pending,/changed/);assert.match(store.getState().records.osteopathy.status,/DRAFT/);
});
