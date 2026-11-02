/** Pure validation and formatting for the synthetic reference workflows. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HubDomain = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const clone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function presentation(value) {
    if (typeof value === 'string') return escapeHtml(value);
    if (Array.isArray(value)) return value.map(presentation);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, presentation(item)]));
    return value;
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort().filter(key => value[key] !== undefined)
      .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }

  function csvCell(value) {
    let text = String(value ?? '');
    // CSV is opened in spreadsheet software; untrusted text must not become a formula.
    if (/^[\s]*[=+@-]/.test(text) && typeof value !== 'number') text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  const csv = rows => rows.map(row => row.map(csvCell).join(',')).join('\r\n');

  function lineAmounts(item) {
    if (!Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 1000) {
      throw new Error('Quantity must be a whole number between 1 and 1,000.');
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0 || item.unitPrice > 1000000) {
      throw new Error('Invalid unit price.');
    }
    if (!Number.isFinite(item.vatRate) || item.vatRate < 0 || item.vatRate > 1) {
      throw new Error('Invalid VAT rate.');
    }
    const netPence = Math.round(item.unitPrice * 100) * item.qty;
    const vatPence = item.vatExempt ? 0 : Math.round(netPence * item.vatRate);
    return { netPence, vatPence, net: netPence / 100, vat: vatPence / 100 };
  }

  function cartTotals(items) {
    let exempt = 0, standard = 0, vat = 0;
    for (const item of items) {
      const amount = lineAmounts(item);
      if (item.vatExempt || item.vatRate === 0) exempt += amount.netPence;
      else standard += amount.netPence;
      vat += amount.vatPence;
    }
    return { netExempt: exempt / 100, netStandard: standard / 100,
      vatStandard: vat / 100, totalGross: (exempt + standard + vat) / 100 };
  }

  function bookingConstraints(state, request) {
    const service = state.services.find(x => x.id === request.serviceId);
    const room = state.facilities.find(x => x.id === request.roomId);
    const equipment = state.equipment.find(x => x.id === request.equipmentId);
    const student = state.students.find(x => x.id === request.practitionerId);
    const supervisor = state.supervisors.find(x => x.id === request.supervisorId);
    const staff = state.supervisors.find(x => x.id === request.practitionerId);
    const commercial = service?.stream === 'Area B';
    const existing = state.bookings || [];
    const clashes = existing.filter(x => x.status === 'CONFIRMED' && x.slotId === request.slotId);
    const practitionerOK = commercial || Boolean((student || staff) &&
      !student?.busy && (!staff || staff.disciplines.includes(service?.discipline)) && !clashes.some(x => x.practitionerId === request.practitionerId));
    const roomOK = Boolean(room && room.status === 'available' &&
      !clashes.some(x => x.roomId === request.roomId) &&
      (commercial ? room.type !== 'clinical_bay' : room.type === 'clinical_bay' || room.type === 'diagnostic_suite'));
    const kit = request.equipmentId === 'eq_standard';
    const equipmentOK = kit || Boolean(equipment && equipment.status === 'available' &&
      equipment.calibrationDue >= state.referenceDate &&
      !clashes.some(x => x.equipmentId === request.equipmentId));
    const ratioOK = commercial || !student || Boolean(supervisor &&
      supervisor.disciplines.includes(service?.discipline) &&
      student.supervisorId === supervisor.id && supervisor.activeBays < supervisor.maxRatio);
    const checks = {
      practitioner: { ok: Boolean(service && practitionerOK), message: commercial ? 'Commercial reservation; no clinical practitioner required.' : practitionerOK ? 'Practitioner available for this reference session.' : 'Select an available practitioner for this session.' },
      room: { ok: roomOK, message: roomOK ? `${room.name} is available.` : 'Room is occupied, unavailable or unsuitable for this service.' },
      equipment: { ok: equipmentOK, message: equipmentOK ? (kit ? 'Standard clinic kit selected.' : `${equipment.name}: calibration current.`) : 'Equipment is unavailable or its calibration has expired.' },
      ratio: { ok: Boolean(service && ratioOK), message: commercial || !student ? 'No student-supervision allocation required.' : supervisor ? `${supervisor.name}: ${supervisor.activeBays}/${supervisor.maxRatio} student bays allocated.` : 'Select an assigned clinical supervisor.' }
    };
    return { valid: Object.values(checks).every(check => check.ok), checks };
  }

  function recordContent(record) {
    const content = clone(record);
    for (const field of ['signatureHash', 'signaturePayload', 'signatureOrigin', 'signedTimestamp',
      'supervisorSignedBy', 'status', 'history', 'creditedEncounter']) delete content[field];
    return content;
  }

  return { clone, escapeHtml, presentation, canonical, csv, csvCell, lineAmounts, cartTotals, bookingConstraints, recordContent };
});
