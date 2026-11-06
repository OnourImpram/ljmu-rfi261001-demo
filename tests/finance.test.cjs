'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/store.js');

function prepare() {
  store.reset();
  store.setRole('manager');
  return store.latestJournal().order.id;
}
function balanced(orderId, document) {
  const journal = store.latestJournal(orderId,document);
  const sum = i => journal.amounts.reduce((n,r) => n + Math.round(r[i]*100),0);
  assert.equal(sum(3),sum(4));
  const rows = store.generateOracleGLCSV(orderId,document).trim().split(/\r?\n/).slice(1);
  assert.ok(rows.length && rows.every(r => r.split(',')[15] === journal.document));
  return journal;
}
test('partial credit reverses exact billed service, centre and VAT; full credit closes remaining income', async () => {
  const id = prepare();
  const invoice = balanced(id,'invoice');
  const before = store.incomeReport().reduce((n,r) => n+r.netPence,0);
  assert.equal(store.creditPreview(id,2,2),null);
  assert.equal(await store.issueCredit(id,2,1,'',0),null);
  const [note,duplicate] = await Promise.all([store.issueCredit(id,2,1,'Cancelled hire',0),store.issueCredit(id,2,1,'Repeated action',0)]);
  assert.ok(note);
  assert.equal(duplicate,null);
  assert.equal(note.pence,48000);
  assert.equal(store.invoiceAccount(id).duePence,43500);
  const credit = balanced(id,note.id);
  const sale = invoice.amounts.find(row => row[0] === credit.amounts[0][0]);
  assert.deepEqual(credit.amounts[0].slice(1),[sale[1],sale[2],sale[4],0,sale[5]]);
  assert.equal(credit.amounts.find(r => r[2] === '2110')[3],80);
  assert.equal(store.incomeReport().reduce((n,r) => n+r.netPence,0),before-40000);
  assert.equal(store.incomeReport('activity').find(r => r.activity === 'Laboratory hire').netPence,12500);
  assert.equal(store.incomeReport('centre').find(r => r.centre === '201').netPence,12500);
  assert.equal(await store.recordCash(id,'refund',1,'unpaid',1),null);
  const full = await store.issueCredit(id,'all',0,'Cancelled remainder',1);
  assert.equal(full.pence,43500);
  assert.equal(store.invoiceAccount(id).duePence,0);
  assert.equal(store.invoiceAccount(id).refundablePence,0);
  assert.equal(store.incomeReport().reduce((n,r) => n+r.netPence,0),0);
  assert.equal(store.creditPreview(id,'all',0),null);
  assert.equal(balanced(id,'invoice').order.totalGross,915);
});

test('paid invoice permits only credited refunds; partial cash postings balance independently and leave income unchanged', async () => {
  const id = prepare();
  assert.equal(await store.recordCash(id,'receipt',91501,'over',0),null);
  store.setRole('booker');
  assert.equal(await store.recordCash(id,'receipt',91500,'not-authorised',0),null);
  store.setRole('manager');
  const part = await store.recordCash(id,'receipt',12500,'BANK-01',0);
  assert.equal(store.invoiceAccount(id).duePence,79000);
  assert.equal(await store.recordCash(id,'receipt',79000,'bank-01',1),null);
  const rest = await store.recordCash(id,'receipt',79000,'CARD-02',1,'External card payment');
  assert.equal(store.invoiceAccount(id).duePence,0);
  const note = await store.issueCredit(id,'all',0,'Order withdrawn',2);
  assert.equal(note.pence,91500);
  assert.equal(store.invoiceAccount(id).refundablePence,91500);
  assert.equal(await store.recordCash(id,'refund',91501,'too-much',3),null);
  const refund = await store.recordCash(id,'refund',12500,'R-01',3);
  assert.equal(store.invoiceAccount(id).refundablePence,79000);
  const remainder = await store.recordCash(id,'refund',79000,'R-02',4,'External card payment');
  assert.equal(store.invoiceAccount(id).refundablePence,0);
  assert.equal(store.invoiceAccount(id).duePence,0);
  for (const entry of [part,rest,note,refund,remainder]) balanced(id,entry.id);
  assert.equal(store.incomeReport().reduce((n,r) => n+r.netPence,0),0);
  assert.equal(await store.recordCash(id,'refund',1,'again',5),null);
});

test('group order reads reserved quantity and organisation, grants sample discount only when eligible and cannot be billed twice', async () => {
  store.reset(); store.setRole('booker');
  const ownerId = store.getState().currentUser.id;
  const group = {id:'GR-201',serviceId:'srv_cpd_manip',organisation:'Fictional Group',places:3,status:'Booked',ownerId};
  store.setState({groupBookings:[group],tariff:'club-block'});
  assert.equal(store.priceGroup(group.id).net,337.50);
  const [order,duplicate] = await Promise.all([store.submitPurchaseOrder({groupBookingId:group.id,poNumber:'GROUP-A',orgName:'Override'}),
    store.submitPurchaseOrder({groupBookingId:group.id,poNumber:'GROUP-B'})]);
  assert.ok(order); assert.equal(duplicate,null);
  assert.equal(order.items.length,1); assert.equal(order.items[0].qty,3);
  assert.equal(order.totalGross,337.5); assert.equal(order.payingOrg,group.organisation);
  assert.equal(order.groupBookingId,group.id); assert.equal(store.priceGroup(group.id),null);
  store.setRole('manager'); await store.approvePurchaseOrder(order.id);
  assert.equal(store.incomeReport('centre').find(r => r.centre === '203').netPence,33750);
  const cn = await store.issueCredit(order.id,0,1,'One place released',0);
  assert.equal(cn.pence,11250);
  assert.equal(store.invoiceAccount(order.id).duePence,22500);
  store.setRole('booker');
  store.setState({groupBookings:[{...group,id:'GR-X',ownerId:'someone-else'},{...group,id:'GR-Z',status:'Cancelled'}]});
  assert.equal(store.priceGroup('GR-X'),null); assert.equal(store.priceGroup('GR-Z'),null);
});

test('same normalised billing identity and purchase order is idempotent across concurrent retries and rejects changed items', async () => {
  store.reset(); store.setRole('booker');
  const po = {orgName:'Sample Club',poNumber:'PO-79'};
  const count = store.getState().orders.length;
  const [first,retry] = await Promise.all([store.submitPurchaseOrder(po),store.submitPurchaseOrder({orgName:'  sAmPle   ClUb ',poNumber:' po-79  '})]);
  assert.equal(first.id,retry.id);
  assert.equal(store.getState().orders.length,count+1);
  assert.equal(store.getState().auditLog.filter(l=>l.action==='PO_SUBMIT').length,1);
  const [item,...rest] = store.getState().cart;
  store.setState({cart:[{...item,qty:item.qty+1},...rest]});
  assert.equal(store.reviewPurchaseOrder(po).status,'conflict');
  assert.equal(await store.submitPurchaseOrder(po),null);
  assert.equal(store.getState().orders.length,count+1);
  assert.ok(await store.submitPurchaseOrder({...po,orgName:'Different club'}));
});

test('multi-invoice remittance is all-or-nothing, rejects mixed payer, replays, stale revisions and excessive allocations', async () => {
  prepare(); store.setRole('booker');
  const make = (payer,po) => store.submitPurchaseOrder({orgName:payer,poNumber:po});
  const a = await make('Test Club','TEST-A'), b = await make(' test   club ','TEST-B'), c = await make('Elsewhere','TEST-C');
  store.setRole('manager');
  for (const order of [a,b,c]) await store.approvePurchaseOrder(order.id);
  const alloc = (order,amount,rev=0) => ({orderId:order.id,pence:amount,revision:rev});
  assert.equal(await store.recordRemittance([alloc(a,10000),alloc(c,1)],'mixed'),null);
  assert.equal(await store.recordRemittance([alloc(a,10000),alloc(b,91501)],'over'),null);
  assert.equal(await store.recordRemittance([alloc(a,10000),alloc(a,1)],'dup'),null);
  assert.equal(await store.recordRemittance([alloc(a,10000),alloc(b,20000,1)],'stale'),null);
  assert.equal(store.invoiceAccount(a.id).entries.length,0);
  const posted = await store.recordRemittance([alloc(a,25000),alloc(b,30000)],'BANK-SET-1');
  assert.equal(posted.pence,55000);
  assert.equal(store.invoiceAccount(a.id).duePence,66500);
  assert.equal(store.invoiceAccount(b.id).duePence,61500);
  assert.equal(await store.recordRemittance([alloc(a,10000,1),alloc(b,10000,1)],' bank-set-1 '),null);
  assert.equal(await store.recordCash(c.id,'receipt',1000,'bank-set-1',0),null);
  const rows = store.remittanceCSV(posted.batch).trim().split(/\r?\n/).slice(1).map(line=>line.split(','));
  assert.equal(rows.length,4);
  assert.ok(rows.every(r=>r[16]==='BANK-SET-1' && r[17]===posted.batch));
  assert.deepEqual(new Set(rows.map(r=>r[13])),new Set(['TEST-A','TEST-B']));
  assert.equal(rows.reduce((n,r)=>n+Number(r[10]),0),550);
  assert.equal(rows.reduce((n,r)=>n+Number(r[11]),0),550);
});
