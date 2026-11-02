'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/domain.js');
test('HTML presentation escapes executable markup', () => {
  assert.equal(D.escapeHtml('<img src="x" onerror="alert(1)">'), '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
});
test('canonical JSON is independent of object property order', () => {
  assert.equal(D.canonical({z:1,a:{c:2,b:3}}), D.canonical({a:{b:3,c:2},z:1}));
});
test('CSV protects formula-leading text and doubles embedded quotes', () => {
  assert.equal(D.csvCell('=1+1'), '"\'=1+1"');
  assert.equal(D.csvCell('a"b'), '"a""b"');
});
test('VAT rounds per invoice line in integer pence', () => {
  assert.deepEqual(D.lineAmounts({qty:3,unitPrice:0.10,vatRate:0.20}), {netPence:30,vatPence:6,net:0.30,vat:0.06});
});
test('fractional quantity, non-finite price and invalid VAT are rejected', () => {
  for (const patch of [{qty:1.1}, {unitPrice:NaN}, {vatRate:2}]) {
    assert.throws(() => D.lineAmounts({qty:1,unitPrice:10,vatRate:0.2,...patch}));
  }
});
test('recursive presentation escaping retains numbers and booleans', () => {
  assert.deepEqual(D.presentation({x:'<script>',a:[2,true,'&']}), {x:'&lt;script&gt;',a:[2,true,'&amp;']});
});
