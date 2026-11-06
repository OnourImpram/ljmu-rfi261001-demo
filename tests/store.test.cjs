'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const path = require('node:path');

const storePath = path.resolve(__dirname, '../js/store.js');

function freshStore(savedState) {
  const data = new Map();
  if (savedState) data.set('ljmu_hub_review_v4', JSON.stringify(savedState));
  global.window = {
    crypto: webcrypto,
    localStorage: {
      getItem: k => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
      removeItem: k => data.delete(k)
    }
  };
  delete require.cache[storePath];
  return require(storePath);
}

test('initial state contains 5 personas, 5 clinical disciplines, and 1:4 ratio roster', () => {
  const store = freshStore();
  const state = store.getState();
  assert.equal(state.currentRole, 'supervisor');
  assert.deepEqual(Object.keys(state.personas).sort(), ['booker', 'manager', 'patient', 'student', 'supervisor']);
  assert.deepEqual(Object.keys(state.records), ['osteopathy', 'physiotherapy', 'cardiovascular', 'physiology', 'sc']);
  assert.equal(state.supervisors[0].activeBays, 3);
  assert.equal(state.supervisors[0].maxRatio, 4);
});

test('mixed-VAT basket reconciles to £105 exempt, £675 standard, £135 VAT, and £915 gross', () => {
  const store = freshStore();
  assert.deepEqual(store.calculateCartTotals(), {
    netExempt: 105,
    netStandard: 675,
    vatStandard: 135,
    totalGross: 915
  });
});

test('supervisor SHA-256 countersignature locks record and increments student competency hours', async () => {
  const store = freshStore();
  const beforeHours = store.getState().students[0].hoursLogged;
  const signed = await store.executeCountersignature('osteopathy', 'Amended clinical plan verified.');
  assert.equal(signed.status, 'SUPERVISOR COUNTERSIGNED & LOCKED');
  assert.match(signed.signatureHash, /^SHA256:[0-9a-f]{64}$/);
  assert.equal(store.getState().students[0].hoursLogged, beforeHours + 1);
});

test('purchase order submission and manager approval stage a local journal without posting to Oracle', async () => {
  const store = freshStore();
  store.setRole('booker');
  const order = await store.submitPurchaseOrder({ poNumber: 'RAC-2026-PO-9984' });
  assert.equal(order.status, 'PENDING_PO_VERIFICATION');
  assert.equal(order.totalGross, 915);

  store.setRole('manager');
  await store.approvePurchaseOrder(order.id);
  const approved = store.getState().orders.find(o => o.id === order.id);
  assert.equal(approved.status, 'APPROVED: AWAITING PAYMENT');
  assert.equal(approved.oracleEbsSynced, false);
  assert.ok(approved.oracleBatchId.startsWith('DEMO-'));
});

test('Oracle EBS GL_INTERFACE CSV and de-identified research JSON exports are valid', () => {
  const store = freshStore();
  const csv = store.generateOracleGLCSV();
  assert.ok(csv.includes('SEGMENT1_ENTITY'));
  assert.ok(csv.includes('PRJ-PERFHUB'));
  assert.ok(csv.includes('915.00'));

  const researchJson = store.generateResearchJSON();
  const parsed = JSON.parse(researchJson);
  assert.equal(parsed.length, 5);
  for (const rec of Object.values(store.getState().records)) {
    assert.equal(researchJson.includes(rec.patientName), false);
    assert.equal(researchJson.includes(rec.nhsNumber), false);
  }
});

test('role guards, edited record and once-only activity credit survive concurrent review', async () => {
  const st = freshStore();
  st.setRole('booker');
  assert.equal(await st.executeCountersignature('osteopathy', 'invalid'), null);
  assert.equal(await st.saveDraft('osteopathy', {assessment: 'invalid'}), false);
  st.setRole('student');
  await st.saveDraft('osteopathy', {assessment: 'A synthetic review observation'});
  assert.equal(st.getState().records.osteopathy.assessment, 'A synthetic review observation');
  assert.equal(await st.executeCountersignature('osteopathy', 'invalid'), null);
  st.setRole('supervisor');
  const base = st.getState().students[0].hoursLogged;
  const results = await Promise.all([st.executeCountersignature('osteopathy', 'review A'), st.executeCountersignature('osteopathy', 'review B')]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(st.getState().students[0].hoursLogged, base + 1);
  st.setRole('student');
  assert.equal(await st.saveDraft('osteopathy', {assessment: 'late'}), false);
  assert.equal(st.getState().records.osteopathy.assessment, 'A synthetic review observation');
});

test('consent controls both sample exports and user-authored free text cannot escape', () => {
  const st = freshStore();
  const rec = st.getState().records.osteopathy;
  rec.assessment = 'sentinel-free-text';
  rec.researchConsent = false;
  const csv = st.generateResearchCSV(), json = st.generateResearchJSON();
  assert.equal(JSON.parse(json).length, 4);
  assert.ok(!csv.includes('osteopathy') && !json.includes('osteopathy'));
  rec.researchConsent = true;
  assert.ok(!st.generateResearchJSON().includes(rec.assessment));
  assert.ok(!st.generateResearchCSV().includes(rec.assessment));
  const rows = JSON.parse(st.generateResearchJSON());
  assert.equal(rows.find(row => row.discipline === 'osteopathy').mskHqScore, null);
  assert.equal(rows.find(row => row.discipline === 'physiotherapy').mskHqScore, 38);
  st.setRole('student');
  assert.deepEqual(st.researchRows(), []);
  st.setRole('booker');
  assert.deepEqual(st.researchRows(), []);
});

test('edited basket reaches approved journal but pending and unauthorised approvals do not', async () => {
  const st = freshStore(); const {cart} = st.getState();
  st.setState({cart: [...cart, {...cart[0], qty: 2}]});
  st.setRole('booker');
  assert.equal(await st.submitPurchaseOrder({poNumber: '  '}), null);
  const o = await st.submitPurchaseOrder({poNumber: 'TEST-PO-456', orgName: 'Fictional Club'});
  assert.equal(o.payingOrg, 'Fictional Club');
  assert.equal(await st.approvePurchaseOrder(o.id), false);
  st.setRole('manager');
  const beforeApproval = st.generateOracleGLCSV();
  assert.ok(beforeApproval.includes('RAC-2026-PO-9942'));
  assert.ok(beforeApproval.includes('915.00'));
  assert.ok(!beforeApproval.includes(o.poNumber));
  await st.approvePurchaseOrder(o.id);
  const csv = st.generateOracleGLCSV();
  assert.ok(csv.includes(o.poNumber)); assert.ok(csv.includes('1005.00'));
  st.setState({cart: []});
  assert.equal(st.generateOracleGLCSV(),csv);
  const lines = csv.trim().split(/\r?\n/).slice(1).map(l => l.split(','));
  assert.equal(lines.reduce((n,l) => n + Number(l[10]),0), 1005);
  assert.equal(lines.reduce((n,l) => n + Number(l[11]),0), 1005);
  assert.equal(await st.approvePurchaseOrder(o.id), false);
});

test('signing fails closed when native digest is unavailable', async () => {
  const st = freshStore();
  global.window.crypto = {};
  const result = await st.executeCountersignature('osteopathy','demo review');
  assert.equal(result,null);
  assert.equal(st.getState().records.osteopathy.signatureHash,null);
});

test('current supervisor labels are upgraded without changing historical signers or clinical data', () => {
  const initial = freshStore().getState();
  for (const key of ['cardiovascular','physiology']) {
    assert.equal(initial.records[key].supervisorName, initial.personas.supervisor.name);
  }
  assert.equal(initial.records.cardiovascular.supervisorSignedBy, 'Dr. Mark Davies, PhD');
  assert.equal(initial.records.physiology.supervisorSignedBy, 'Dr. Mark Davies');
  const saved = structuredClone(initial);
  for (const key of ['cardiovascular','physiology']) {
    saved.records[key].supervisorName = 'Dr. Mark Davies, PhD';
    saved.records[key].subjective = 'Retained custom clinical note ' + key;
  }
  const expected = structuredClone(saved);
  for (const key of ['cardiovascular','physiology']) expected.records[key].supervisorName = initial.personas.supervisor.name;
  const upgraded = freshStore(saved).getState();
  assert.deepEqual(upgraded, expected);
  saved.records.cardiovascular.supervisorId = 'different-supervisor';
  saved.records.physiology.id = 'different-case';
  assert.deepEqual(freshStore(saved).getState(), saved);
  saved.records.cardiovascular.supervisorId = initial.personas.supervisor.id;
  saved.records.cardiovascular.supervisorName = 'A custom assigned name';
  assert.deepEqual(freshStore(saved).getState(), saved);
});

test('audit IDs stay distinct when concurrent events complete in the same tick', async () => {
  const st = freshStore();
  const clock = Date.now;
  Date.now = () => 1793870000000;
  try {
    await Promise.all([
      st.addAuditLog('SAME_TICK_A','sample-a'),
      st.addAuditLog('SAME_TICK_B','sample-b')
    ]);
    const entries = st.getState().auditLog.filter(entry => entry.action.startsWith('SAME_TICK_'));
    assert.equal(entries.length,2);
    assert.equal(new Set(entries.map(entry => entry.id)).size,2);
  } finally {
    Date.now = clock;
  }
});

test('unavailable randomUUID retains unique audit writes and preserves the secure signing gate', async () => {
  const cryptoProperty = Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const clock = Date.now;
  try {
    for (const missing of [{}, undefined]) {
      const st = freshStore();
      global.window.crypto = {};
      Object.defineProperty(globalThis,'crypto',{value:missing,configurable:true});
      Date.now = () => 1793870000000;
      await Promise.all([
        st.addAuditLog('NO_UUID_A','sample-a'),
        st.addAuditLog('NO_UUID_B','sample-b')
      ]);
      const entries = st.getState().auditLog.filter(entry => entry.action.startsWith('NO_UUID_'));
      assert.equal(entries.length,2);
      assert.equal(new Set(entries.map(entry => entry.id)).size,2);
      assert.deepEqual(entries.map(entry => entry.action).sort(),['NO_UUID_A','NO_UUID_B']);
      assert.ok(entries.every(entry => entry.hash === 'Digest unavailable'));
      assert.equal(await st.executeCountersignature('osteopathy','Signing unavailable'),null);
      assert.equal(st.getState().records.osteopathy.signatureHash,null);
    }
  } finally {
    Date.now = clock;
    if (cryptoProperty) Object.defineProperty(globalThis,'crypto',cryptoProperty);
    else delete globalThis.crypto;
    global.window.crypto = webcrypto;
  }
});
