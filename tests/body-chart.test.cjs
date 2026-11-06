'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/store.js');
const chart = require('../js/body-chart.js');

test('the same patient side reverses its horizontal position between front and back', () => {
  for (const side of ['left','right']) {
    const f = chart.getSite(`front:${side}:knee`);
    const b = chart.getSite(`back:${side}:knee`);
    assert.equal(f.label,b.label);
    assert.equal(f.x+b.x,220);
    assert.equal(f.y,b.y);
    assert.equal(f.x>110,side==='left');
  }
});

test('chart edits require an assigned unsigned record and a known location', async () => {
  store.reset();
  const loc = 'front:left:knee';
  assert.equal(await store.changeBodySite('osteopathy',loc,'add'), false);
  store.setRole('student');
  assert.equal(await store.changeBodySite('cardiovascular',loc,'add'), false);
  assert.equal(await store.changeBodySite('physiotherapy',loc,'add'), false);
  const record = store.getState().records.osteopathy;
  assert.equal(await store.changeBodySite('osteopathy','front:invalid:knee','add'), false);
  store.setState({records:{...store.getState().records,osteopathy:{...record,authorId:'another-student'}}});
  assert.equal(await store.changeBodySite('osteopathy',loc,'add'), false);
  store.setState({records:{...store.getState().records,osteopathy:record}});
  assert.deepEqual(await Promise.all([store.changeBodySite('osteopathy',loc,'add'),store.changeBodySite('osteopathy',loc,'add')]),[true,false]);
  assert.equal(await store.changeBodySite('osteopathy',loc,'remove'),true);
  assert.equal(await store.changeBodySite('osteopathy',loc,'remove'),false);
  store.setRole('patient');
  assert.equal(await store.changeBodySite('osteopathy',loc,'add'),false);
});

test('text from the old coordinate chart is preserved, escaped and never assigned a new side or view', async () => {
  store.reset();
  const legacy = {x:94,y:242,label:'Left knee (sample) <untrusted>'};
  const original = store.getState().records.osteopathy;
  store.setState({records:{...store.getState().records,osteopathy:{...original,bodyMarkers:[legacy]}}});
  const text = chart.render(store.getState().records.osteopathy,false);
  assert.match(text,/Left knee \(sample\) &lt;untrusted&gt;/);
  assert.doesNotMatch(text,/data-chart-mark="/);
  assert.match(text,/Earlier chart · view unrecorded/);
  store.setRole('student');
  assert.equal(await store.changeBodySite('osteopathy','front:left:knee','add'),true);
  assert.deepEqual(store.getState().records.osteopathy.bodyMarkers[0],legacy);
  assert.deepEqual(store.getState().records.osteopathy.bodyMarkers[1],{schemaVersion:2,siteId:'front:left:knee'});
  const before = store.getState().records.physiotherapy.bodyMarkers.slice();
  assert.equal(await store.changeBodySite('physiotherapy','back:right:knee','remove'),false);
  assert.deepEqual(store.getState().records.physiotherapy.bodyMarkers,before);
});

test('a real supervisor countersignature seals existing chart sites and rejects subsequent student edits', async () => {
  global.window = {crypto:require('node:crypto').webcrypto};
  try {
    store.reset();
    store.setRole('student');
    assert.equal(await store.changeBodySite('osteopathy','front:left:knee','add'),true);
    store.setRole('supervisor');
    const signed = await store.executeCountersignature('osteopathy','Reviewed the student chart.');
    assert.match(signed.signatureHash,/^SHA256:[0-9a-f]{64}$/);
    store.setRole('student');
    assert.equal(await store.changeBodySite('osteopathy','front:left:knee','remove'),false);
    assert.equal(await store.changeBodySite('osteopathy','back:left:calf','add'),false);
    assert.deepEqual(store.getState().records.osteopathy.bodyMarkers,signed.bodyMarkers);
  } finally { delete global.window; }
});
