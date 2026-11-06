(function (root) {
  'use strict';

  let selectedAccountId = null;
  let financeNotice = '';
  let poNotice = '';
  let sampleIdentity, noticeOwner;
  const initialPoDraft = {org:'Riverside Athletics Club (fictional)',booker:'David Miller (Head Coach)',number:'RAC-2026-PO-9984'};
  let poDraft = {...initialPoDraft};
  const sterling = pence => '£' + (pence / 100).toFixed(2);

  function accountStatus(account) {
    if (!account) return 'Awaiting approval';
    if (account.refundablePence) return 'Refund due';
    if (account.duePence) return account.paidPence ? 'Part paid' : 'Approved · awaiting payment';
    return account.creditedPence === Math.round(account.order.totalGross * 100) ? 'Credited in full' : 'Settled';
  }

  function renderCommercialView() {
    const container = document.getElementById('view-commercial');
    if (!container) return;

    const state = root.AppStore.getState();
    const reset = sampleIdentity !== state.personas;
    if (reset) {
      selectedAccountId = null;
      poDraft = {...initialPoDraft};
      sampleIdentity = state.personas;
    }
    if (reset || noticeOwner !== state.currentUser.id) {
      financeNotice = '';
      poNotice = '';
      noticeOwner = state.currentUser.id;
    }
    if (state.currentRole === 'patient') {
      container.innerHTML = '<section class="card"><div class="card-body"><h2 class="section-title">Orders and invoices</h2><p>Commercial accounts are available to club and staff roles.</p></div></section>';
      const modal = document.getElementById('invoice-modal');
      modal.hidden = true; modal.replaceChildren();
      return;
    }
    const esc = root.AppStore.escapeText;
    const priced = root.AppStore.priceCart();
    const pendingOrders = state.orders.filter(o => o.status === 'PENDING_PO_VERIFICATION');
    const totals = root.AppStore.calculateCartTotals();
    const latestOrder = state.orders[0];
    const isPending = latestOrder && latestOrder.status.includes('PENDING');

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-copy">
          <h2 class="section-title">Orders and invoices</h2>
          <p class="section-subtitle">Prepare a club order as Client Booker. A Lab Manager can approve it for the finance journal.</p>
        </div>
        <div class="header-action-row">
          <button type="button" id="btn-view-invoice" ${state.orders.some(o=>o.status.startsWith('APPROVED')) ? '' : 'disabled'} class="btn btn-secondary">
            View approved invoice
          </button>
        </div>
      </div>

      <div class="grid-2-col mb-4">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Services and hire</h3>
              <p class="card-subtitle">Example prices per appointment, hire or course place.</p>
            </div>

          </div>
          <div class="card-body">
            <label class="form-label" for="tariff-select">Example customer tariff</label>
            <select class="form-control mb-2" id="tariff-select">
              <option value="standard">Standard</option>
              <option value="club-block" ${state.tariff === 'club-block' ? 'selected' : ''}>Partner club · block booking</option>
            </select><p class="text-xs text-muted mb-3">The sample club tariff takes 10% off three or more units of the same hire or workshop. Teaching appointments stay at their usual rate.</p>
            <div class="service-catalogue-list">
              ${state.services.map(srv => `
                <div class="service-item-row">
                  <div>
                    <div class="flex-gap-2 align-center">
                      <strong class="text-xs">${esc(srv.name)}</strong>
                      <span class="badge ${srv.vatExempt ? 'badge-success' : 'badge-amber'}">
                        ${srv.vatExempt ? 'VAT exempt' : '20% standard VAT'}
                      </span>
                    </div>
                    <div class="text-xs text-muted mt-1">
                      ${esc(srv.stream)} · ${esc(srv.facility)} · Duration: ${esc(srv.duration)}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold mono text-sm">£${srv.price.toFixed(2)}</div>
                    <button type="button" class="btn btn-xs btn-secondary mt-1 btn-add-cart" data-service-id="${esc(srv.id)}">
                      Add to basket
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Order basket</h3>
              <p class="card-subtitle">Review the line items before entering the club’s purchase order reference.</p>
            </div>
            <span id="order-status-badge" class="badge ${isPending ? 'badge-amber' : 'badge-success'}">
              ${latestOrder ? accountStatus(root.AppStore.invoiceAccount(latestOrder.id)) : 'No orders'}
            </span>
          </div>
          <div class="card-body">
            <div class="table-responsive mb-3" tabindex="0" role="region" aria-label="Mixed-VAT Shopping Basket">
              <table class="data-table" id="basket-summary">
                <thead>
                  <tr>
                    <th>Line Item Description</th>
                    <th>Tax Schedule</th>
                    <th>Net</th>
                    <th>VAT</th>
                    <th>Gross</th>
                  </tr>
                </thead>
                <tbody>
                  ${!state.cart.length ? '<tr><td colspan="5">Choose a service to start your order.</td></tr>' : ''}
                  ${state.cart.map((item,index) => {
                    const net = priced[index].net;
                    const vat = priced[index].vat;
                    const gross = net + vat;
                    return `
                      <tr>
                        <td>
                          <strong>${esc(item.name)}</strong>
                          <div class="text-xs text-muted">Quantity ${esc(item.qty)}${priced[index].discountPence ? ` · ${sterling(priced[index].discountPence)} club saving` : ''} · <button type="button" class="btn btn-secondary btn-xs" data-remove="${esc(item.serviceId)}" aria-label="Remove one ${esc(item.name)}">Remove one</button></div>
                        </td>
                        <td>
                          <span class="badge ${item.vatExempt ? 'badge-success' : 'badge-amber'}">
                            ${item.vatExempt ? 'Exempt' : '20% Std'}
                          </span>
                        </td>
                        <td class="mono">£${net.toFixed(2)}</td>
                        <td class="mono">£${vat.toFixed(2)}</td>
                        <td class="mono font-bold">£${gross.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="vat-summary-box mb-3">
              <div class="vat-line">
                <span>Exempt subtotal</span>
                <strong id="subtotal-exempt" class="mono">£${totals.netExempt.toFixed(2)}</strong>
              </div>
              <div class="vat-line">
                <span>Standard-rated subtotal</span>
                <strong id="subtotal-standard" class="mono">£${totals.netStandard.toFixed(2)}</strong>
              </div>
              <div class="vat-line">
                <span>VAT at 20%</span>
                <strong id="vat-standard" class="mono">£${totals.vatStandard.toFixed(2)}</strong>
              </div>
              <div class="vat-line vat-total-line">
                <span>Invoice total</span>
                <strong id="total-gross" class="mono text-lg">£${totals.totalGross.toFixed(2)}</strong>
              </div>

            </div>

            <div class="card subcard-widget mb-3">
              <h4 class="text-xs font-bold mb-2">Purchase order details</h4>
              <div class="grid-2-col mb-2">
                <div class="form-group">
                  <label for="po-org-input" class="form-label">Paying organisation</label>
                  <input type="text" id="po-org-input" class="form-control" value="${esc(poDraft.org)}">
                </div>
                <div class="form-group">
                  <label for="po-booker-input" class="form-label">Contact name</label>
                  <input type="text" id="po-booker-input" class="form-control" value="${esc(poDraft.booker)}">
                </div>
                <div class="form-group">
                  <label for="po-number-input" class="form-label">Purchase order reference</label>
                  <input type="text" id="po-number-input" class="form-control mono" value="${esc(poDraft.number)}">
                </div>
                <div class="form-group">
                  <span class="form-label">Payment terms</span>
                  <p>Invoice · 30 days</p>
                </div>
              </div>
              <p class="text-xs text-muted mb-2">
                <strong>Invoice scope:</strong> The sample invoice contains service lines and amounts. Clinical notes are excluded. Card collection is outside the demo.
              </p>
              ${pendingOrders.length && state.currentRole === 'manager' ? `<div class="form-group"><label for="pending-order-select" class="form-label">Order to approve</label>
                <select id="pending-order-select" class="form-control">${pendingOrders.map(o => `<option value="${esc(o.id)}">${esc(o.orderNumber)} · ${esc(o.poNumber)}</option>`).join('')}</select></div>` : ''}
              <p role="status" id="po-feedback" class="text-sm">${esc(poNotice)}</p>
              <div class="flex-between">
                <button type="button" id="btn-submit-po" ${state.currentRole === 'booker' && state.cart.length ? '' : 'disabled'} class="btn btn-secondary">
                  Submit purchase order
                </button>

                <button type="button" id="btn-approve-po" ${state.currentRole === 'manager' && pendingOrders.length ? '' : 'disabled'} class="btn btn-primary" data-order-id="${esc(latestOrder?.id)}">
                  Approve selected order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${groupOrderCard(state)}
      ${accountCard(state)}
      ${remittanceCard(state)}
    `;

    renderInvoiceModal(state);
    bindCommercialEvents();
  }

  function renderInvoiceModal(state) {
    const modal = document.getElementById('invoice-modal');
    if (!modal) return;
    const esc = root.AppStore.escapeText;
    const ord = state.orders.find(o => o.id === selectedAccountId && o.status.startsWith('APPROVED')) || state.orders.find(o => o.status.startsWith('APPROVED'));
    if (!ord) {modal.hidden = true; modal.replaceChildren(); return;}

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Invoice (${esc(ord.orderNumber)})</h2>
            <p class="card-subtitle">Illustration only · no payment due</p>
          </div>
          <button type="button" id="btn-close-invoice" class="btn-close-modal" aria-label="Close Invoice Modal">Close</button>
        </div>
        <div class="modal-body">
          <div class="flex-between mb-3 p-3 bg-subtle rounded">
            <div>
              <div class="text-xs text-muted">Sample issuer</div>
              <strong class="text-sm">Liverpool John Moores University - School of Sport &amp; Exercise Sciences</strong>
              <div class="text-xs text-muted">Tom Reilly Building, Byrom Street, Liverpool, L3 3AF</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-muted">Bill to</div>
              <strong class="text-sm">${esc(ord.payingOrg)}</strong>
              <div class="text-xs mono">Customer PO: ${esc(ord.poNumber)} | Terms: ${esc(ord.paymentTerms)}</div>
              <span class="badge ${ord.status.includes('APPROVED') ? 'badge-success' : 'badge-amber'} mt-1">${accountStatus(root.AppStore.invoiceAccount(ord.id))}</span>
            </div>
          </div>

          <div class="table-responsive mb-3" tabindex="0" role="region" aria-label="Invoice line items">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Service Description</th>
                  <th>Qty</th>
                  <th>Unit Net</th>
                  <th>VAT Rate</th>
                  <th>VAT Amount</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${ord.items.map(i => `
                  <tr>
                    <td>${esc(i.name)}</td>
                    <td>${esc(i.qty)}</td>
                    <td class="mono">£${i.unitPrice.toFixed(2)}</td>
                    <td>${i.vatRate === 0 ? 'Exempt' : '20% Standard'}</td>
                    <td class="mono">£${i.vat.toFixed(2)}</td>
                    <td class="mono font-bold">£${(i.net + i.vat).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex-between">
            <div class="text-xs text-muted">
              Local sample batch: <strong class="mono">${esc(ord.oracleBatchId || 'PENDING_BATCH')}</strong>
            </div>
            <div class="text-right mono text-sm">
              <div>Exempt Net: £${ord.netExempt.toFixed(2)} | Standard Net: £${ord.netStandard.toFixed(2)} | VAT (20%): £${ord.vatStandard.toFixed(2)}</div>
              <div class="font-bold text-lg mt-1">Original invoice total: £${ord.totalGross.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function groupOrderCard(state) {
    if (state.currentRole !== 'booker') return '';
    const groups = (state.groupBookings || []).filter(group => root.AppStore.priceGroup(group.id));
    if (!groups.length) return '';
    const esc = root.AppStore.escapeText;
    return `<section class="card mb-4"><div class="card-header"><h3 class="card-title">Invoice a group booking</h3></div>
      <form id="group-order-form" class="card-body"><p>Bill the organisation for its reserved places.</p>
      <label class="form-label" for="bill-group">Group booking</label><select id="bill-group" class="form-control">
      ${groups.map(group => {const line = root.AppStore.priceGroup(group.id); return `<option value="${esc(group.id)}">${esc(group.id)} · ${esc(group.organisation)} · ${group.places} places · ${sterling(Math.round((line.net + line.vat)*100))}</option>`;}).join('')}</select>
      <label class="form-label mt-2" for="group-po">Group purchase order reference</label><input id="group-po" class="form-control" required maxlength="60">
      <p id="group-po-feedback" role="status" class="text-sm"></p>
      <button class="btn btn-primary mt-2">Submit group order</button></form></section>`;
  }

  function bindGroupOrder() {
    document.getElementById('group-order-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const groupBookingId = document.getElementById('bill-group').value;
      const poNumber = document.getElementById('group-po').value.trim();
      const details = {groupBookingId,poNumber};
      const review = root.AppStore.reviewPurchaseOrder(details);
      const result = await root.AppStore.submitPurchaseOrder(details);
      if (result) {
        financeNotice = review.status === 'existing' ? review.message : result.orderNumber + ' submitted for ' + groupBookingId + '.';
        document.getElementById('finance-notice').textContent = financeNotice;
      } else {
        document.getElementById('group-po-feedback').textContent = review.message || 'Order could not be submitted. Check the booking and purchase order reference.';
      }
    });
  }

  function accountCard(state) {
    const esc = root.AppStore.escapeText;
    const approved = state.orders.filter(o => o.status.startsWith('APPROVED'));
    const account = root.AppStore.invoiceAccount(selectedAccountId) || root.AppStore.invoiceAccount(approved[0]?.id);
    if (!account) return '<p id="finance-notice" role="status"></p>';
    const {order, entries} = account;
    const manager = state.currentRole === 'manager';
    return `<section class="card mb-4"><div class="card-header"><div><h3 class="card-title">Invoice account</h3><p class="card-subtitle">Payments, credits and refunds against an approved invoice.</p></div></div>
      <div class="card-body"><label for="account-order" class="form-label">Approved invoice</label><select id="account-order" class="form-control">
      ${approved.map(o => `<option value="${esc(o.id)}" ${o.id === order.id ? 'selected' : ''}>${esc(o.orderNumber)} · ${esc(o.poNumber)}</option>`).join('')}</select>
      <p class="mt-2"><strong>${esc(order.payingOrg)}</strong>${order.groupBookingId ? ' · Booking ' + esc(order.groupBookingId) : ''} · ${accountStatus(account)}</p>
      <dl class="vat-summary-box"><div class="vat-line"><dt>Invoiced</dt><dd>${sterling(Math.round(order.totalGross*100))}</dd></div>
      <div class="vat-line"><dt>Credit notes</dt><dd>${sterling(account.creditedPence)}</dd></div><div class="vat-line"><dt>Paid / refunded</dt><dd>${sterling(account.paidPence)} / ${sterling(account.refundedPence)}</dd></div>
      <div class="vat-line"><dt>Balance due</dt><dd id="invoice-balance">${sterling(account.duePence)}</dd></div><div class="vat-line"><dt>Refund due</dt><dd id="invoice-refundable">${sterling(account.refundablePence)}</dd></div></dl>
      ${entries.length ? `<div class="table-responsive" tabindex="0" role="region" aria-label="Invoice transactions"><table class="data-table"><thead><tr><th>Document</th><th>Entry</th><th>Amount</th><th>Reference or reason</th></tr></thead><tbody>
      ${entries.map(e => `<tr><th scope="row">${esc(e.id)}</th><td>${{credit:'Credit note',receipt:'Payment received',refund:'Refund recorded'}[e.kind]}</td><td>${sterling(e.pence)}</td><td>${esc(e.reference || e.reason)}${e.method ? ' · ' + esc(e.method) : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p>No payments or credits recorded.</p>'}
      <p id="finance-notice" role="status" class="text-sm">${esc(financeNotice)}</p>
      ${manager ? `<label class="form-label" for="account-action">Record a transaction</label><select id="account-action" class="form-control"><option value="">Choose an action</option>
      ${account.duePence ? '<option value="receipt">Record payment received</option>' : ''}${account.remaining.some(qty => qty > 0) ? '<option value="credit">Issue credit note</option>' : ''}
      ${account.refundablePence ? '<option value="refund">Record a refund</option>' : ''}</select><div id="account-action-form"></div>` : '<p class="text-xs">The Lab Manager records payments and credit notes.</p>'}
      </div></section>`;
  }

  function bindAccountActions() {
    const selector = document.getElementById('account-order');
    if (!selector) return;
    selector.addEventListener('change', () => {
      selectedAccountId = selector.value; financeNotice = '';
      renderCommercialView(); document.getElementById('account-order').focus();
    });
    const action = document.getElementById('account-action');
    action?.addEventListener('change', () => showEntryForm(selector.value,action.value));
  }

  function showEntryForm(orderId,kind) {
    const account = root.AppStore.invoiceAccount(orderId);
    const formBox = document.getElementById('account-action-form'), esc = root.AppStore.escapeText;
    if (!kind || !account) {formBox.replaceChildren(); return;}
    const credit = kind === 'credit';
    const amount = (kind === 'receipt' ? account.duePence : account.refundablePence)/100;
    formBox.innerHTML = `<form id="entry-form" class="mt-2">
      ${credit ? `<label for="credit-line" class="form-label">Credit against</label><select id="credit-line" class="form-control"><option value="all">All remaining items</option>${account.order.items.map((line,i) => account.remaining[i] ? `<option value="${i}">${esc(line.name)} · ${account.remaining[i]} eligible</option>` : '').join('')}</select>
      <label for="credit-quantity" class="form-label">Units to credit</label><input class="form-control" id="credit-quantity" type="number" min="1" step="1" value="1" disabled>` :
      `<label for="cash-amount" class="form-label">Amount (£)</label><input id="cash-amount" class="form-control" type="number" min="0.01" step="0.01" max="${amount.toFixed(2)}" value="${amount.toFixed(2)}" required>`}
      ${credit ? '' : '<label for="cash-method" class="form-label">Payment method</label><select id="cash-method" class="form-control"><option>Bank transfer</option><option>External card payment</option></select>'}
      <label for="entry-reference" class="form-label">${credit ? 'Reason for credit' : 'External payment reference'}</label><input id="entry-reference" class="form-control" required maxlength="60">
      <p class="text-xs mt-2">${credit ? 'A credit reduces the invoice balance. If money has already been paid, record the corresponding refund separately.' : 'Enter a sample transaction reference. Use a unique external reference. No card details are collected or funds transferred.'}</p>
      <button class="btn btn-secondary" id="review-entry">Review transaction</button>
      <div id="entry-review" role="status"></div></form>`;
    const form = document.getElementById('entry-form'), review = document.getElementById('entry-review');
    const line = document.getElementById('credit-line'), units = document.getElementById('credit-quantity');
    line?.addEventListener('change', () => {units.disabled = line.value === 'all'; units.max = account.remaining[Number(line.value)] || 1; units.value = 1;});
    form.addEventListener('input', () => review.replaceChildren());
    form.addEventListener('submit', event => {
      event.preventDefault();
      const reference = document.getElementById('entry-reference').value.trim();
      if (!reference) {review.textContent = 'Enter a reference or reason.'; return;}
      const index = credit ? (line.value === 'all' ? 'all' : Number(line.value)) : null;
      const qty = credit ? Number(units.value) : 0;
      const preview = credit && root.AppStore.creditPreview(orderId,index,qty);
      const pence = credit ? preview?.pence : Math.round(Number(document.getElementById('cash-amount').value)*100);
      if (!Number.isSafeInteger(pence) || pence <= 0) {review.textContent = 'Choose a valid amount or quantity.'; return;}
      const label = {credit:'Credit note',receipt:'Payment receipt',refund:'Refund'}[kind];
      review.innerHTML = `<p><strong>${label} · ${sterling(pence)}</strong> · ${esc(account.order.orderNumber)} · ${esc(reference)}</p><button type="button" class="btn btn-primary" id="confirm-entry">Confirm transaction</button>`;
      const confirm = document.getElementById('confirm-entry');
      confirm.focus();
      confirm.addEventListener('click', async () => {
        confirm.disabled = true;
        const revision = account.entries.length;
          const method = document.getElementById('cash-method')?.value;
        const posted = credit ? await root.AppStore.issueCredit(orderId,index,qty,reference,revision) :
          await root.AppStore.recordCash(orderId,kind,pence,reference,revision,method);
        financeNotice = posted ? posted.id + ' recorded for ' + sterling(pence) + '.' : 'Entry could not be recorded. Check the balance, reference and available quantity.';
        renderCommercialView();
        const notice = document.getElementById('finance-notice');
        notice.setAttribute('tabindex','-1'); notice.focus();
      });
    });
  }

  function remittanceCard(state) {
    if (state.currentRole !== 'manager') return '';
    const groups = root.AppStore.outstandingPayers(), esc = root.AppStore.escapeText;
    const content = groups.length ? `<label for="remit-payer" class="form-label">Paying organisation</label><select id="remit-payer" class="form-control">
      ${groups.map(group => `<option value="${esc(group.key)}">${esc(group.name)}</option>`).join('')}</select><div id="remit-allocations"></div>` :
      '<p>A remittance can be allocated when the same organisation has at least two approved invoices with balances due.</p>';
    return `<details class="card mb-4" id="remittance-card"><summary class="card-header"><strong>Allocate one payment to several invoices</strong></summary>
      <div class="card-body">${content}</div></details>`;
  }

  function bindRemittance() {
    const payer = document.getElementById('remit-payer');
    if (!payer) return;
    const esc = root.AppStore.escapeText;
    function showAllocations() {
      const group = root.AppStore.outstandingPayers().find(g => g.key === payer.value);
      if (!group) return;
      document.getElementById('remit-allocations').innerHTML = `<form id="remit-form"><p>Enter the amount received for each invoice. Leave an amount at zero to exclude it.</p>
        ${group.accounts.map((a,i) => `<div class="form-group"><label for="allocate-${i}" class="form-label">${esc(a.order.orderNumber)} · ${esc(a.order.poNumber)} · ${sterling(a.duePence)} due</label>
        <input class="form-control" type="number" step="0.01" min="0" max="${(a.duePence/100).toFixed(2)}" value="${(a.duePence/100).toFixed(2)}" id="allocate-${i}" required></div>`).join('')}
        <label class="form-label" for="remit-reference">External bank reference</label><input class="form-control" id="remit-reference" required maxlength="60">
        <button id="review-remit" class="btn btn-secondary mt-2">Review allocation</button><div id="remit-review" role="status"></div></form>`;
      const form = document.getElementById('remit-form'), review = document.getElementById('remit-review');
      form.addEventListener('input', () => review.replaceChildren());
      form.addEventListener('submit', event => {
        event.preventDefault();
        const allocations = group.accounts.map((a,i) => ({orderId:a.order.id,revision:a.entries.length,
          pence:Math.round(Number(document.getElementById('allocate-'+i).value)*100)})).filter(a => a.pence > 0);
        const total = allocations.reduce((n,a) => n+a.pence,0), reference = document.getElementById('remit-reference').value.trim();
        if (allocations.length < 2 || !reference) {review.textContent = 'Enter a reference and allocate amounts to at least two invoices.';return;}
        review.innerHTML = `<p>${esc(reference)} · ${sterling(total)} across ${allocations.length} invoices</p><button type="button" class="btn btn-primary" id="confirm-remit">Confirm allocation</button>`;
        const confirm = document.getElementById('confirm-remit'); confirm.focus();
        confirm.addEventListener('click', async () => {
          confirm.disabled = true;
          const posted = await root.AppStore.recordRemittance(allocations,reference);
          financeNotice = posted ? posted.batch + ' recorded: ' + sterling(posted.pence) + ' across ' + allocations.length + ' invoices.' : 'Allocation declined. Check the open balances and use a unique external bank reference.';
          renderCommercialView();
          const notice = document.getElementById('finance-notice');
          notice.setAttribute('tabindex','-1'); notice.focus();
        });
      });
    }
    payer.addEventListener('change',showAllocations);
    showAllocations();
  }

  function bindCommercialEvents() {
    document.getElementById('tariff-select').addEventListener('change', event => {
      root.AppStore.setState({tariff:event.target.value === 'club-block' ? 'club-block' : 'standard'});
      document.getElementById('tariff-select')?.focus();
    });
    bindAccountActions();
    bindRemittance();
    bindGroupOrder();
    for (const key of ['org','booker','number']) {
      const input = document.getElementById('po-' + key + '-input');
      input.addEventListener('input', () => {poDraft[key] = input.value;});
    }
    const addButtons = document.querySelectorAll('.btn-add-cart');
    addButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const srvId = btn.getAttribute('data-service-id');
        const state = root.AppStore.getState();
        const srv = state.services.find(s => s.id === srvId);
        if (!srv) return;

        const existingIdx = state.cart.findIndex(c => c.serviceId === srvId);
        let updatedCart;
        if (existingIdx > -1) {
          updatedCart = state.cart.map((c, idx) => idx === existingIdx ? { ...c, qty: c.qty + 1 } : c);
        } else {
          updatedCart = [
            ...state.cart,
            {
              serviceId: srv.id,
              name: srv.name,
              vatRate: srv.vatRate,
              vatExempt: srv.vatExempt,
              unitPrice: srv.price,
              qty: 1
            }
          ];
        }

        root.AppStore.setState({ cart: updatedCart });
        await root.AppStore.addAuditLog('CART_ITEM_ADDED', `Added ${srv.name} (£${srv.price.toFixed(2)}) to Mixed-VAT basket`);
      });
    });

    document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      const cart = root.AppStore.getState().cart.flatMap(item =>
        item.serviceId !== button.dataset.remove ? [item] : item.qty > 1 ? [{...item, qty:item.qty - 1}] : []);
      root.AppStore.setState({cart});
    }));

    const submitPoHandler = async () => {
      const orgName = (document.getElementById('po-org-input') || {}).value;
      const bookerName = (document.getElementById('po-booker-input') || {}).value;
      const poNumber = (document.getElementById('po-number-input') || {}).value;

      const poField = document.getElementById('po-number-input');
      poField.setCustomValidity(poNumber.trim() ? '' : 'Enter a purchase order reference.');
      if (!poField.reportValidity()) return;
      const details = {orgName,bookerName,poNumber};
      const review = root.AppStore.reviewPurchaseOrder(details);
      const order = await root.AppStore.submitPurchaseOrder(details);
      poNotice = review.status === 'new' && order ? order.orderNumber + ' submitted for approval.' : review.message;
      document.getElementById('po-feedback').textContent = poNotice;
    };

    const submitPoBtn = document.getElementById('btn-submit-po');
    if (submitPoBtn) submitPoBtn.addEventListener('click', submitPoHandler);

    const approvePoBtn = document.getElementById('btn-approve-po');
    if (approvePoBtn) {
      approvePoBtn.addEventListener('click', async () => {
        const state = root.AppStore.getState();
        const targetId = document.getElementById('pending-order-select')?.value;
        const targetOrder = state.orders.find(o => o.id === targetId);
        if (targetOrder) {
          await root.AppStore.approvePurchaseOrder(targetOrder.id);
        }
      });
    }

    const viewInvoiceBtn = document.getElementById('btn-view-invoice');
    const closeInvoiceBtn = document.getElementById('btn-close-invoice');
    const invoiceModal = document.getElementById('invoice-modal');
    if (viewInvoiceBtn && invoiceModal) {
      viewInvoiceBtn.addEventListener('click', () => { invoiceModal.hidden = false; });
    }
    if (closeInvoiceBtn && invoiceModal) {
      closeInvoiceBtn.addEventListener('click', () => { invoiceModal.hidden = true; });
    }
  }

  function openGroupOrder(groupId) {
    const state = root.AppStore.getState();
    const group = (state.groupBookings || []).find(item => item.id === groupId);
    const order = state.orders.find(item => item.groupBookingId === groupId);
    if (!group || !order || (state.currentRole !== 'manager' && !(state.currentRole === 'booker' && group.ownerId === state.currentUser.id))) return;
    const approved = order.status.startsWith('APPROVED');
    selectedAccountId = approved ? order.id : null;
    poNotice = approved ? '' : group.id + ' · ' + order.orderNumber + ' · PO ' + order.poNumber + ' · awaiting approval.';
    renderCommercialView();
    root.App.openWorkspace('commercial', true);
    const control = document.getElementById(approved ? 'account-order' : 'pending-order-select');
    if (control) {
      control.value = order.id;
      control.focus();
    } else {
      const feedback = document.getElementById('po-feedback');
      feedback.tabIndex = -1;
      feedback.focus();
    }
  }

  root.CommercialModule = {render: renderCommercialView, openGroupOrder};
})(typeof self !== 'undefined' ? self : this);
