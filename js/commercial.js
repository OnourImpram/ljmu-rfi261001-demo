/** Catalogue, mixed-tax basket and separated purchase-order approval. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CommercialModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = value => HubDomain.escapeHtml(value);
  const money = value => new Intl.NumberFormat('en-GB', {style:'currency',currency:'GBP'}).format(value);
  const date = value => new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value));
  class CommercialWorkspace {
    init(id) { this.container = document.getElementById(id); this.selectedOrder = null; this.render(); }
    render() {
      if (!this.container) return;
      if (!AppStore.can('commercialRead')) {
        App.renderRestricted(this.container, 'Commercial operations have their own workspace', 'Explore the service catalogue, organisational checkout and purchase-order approvals as a corporate booker or commercial lead. Clinical notes are not included in these workflows.', 'booker'); return;
      }
      const s = AppStore.getState(), totals = AppStore.calculateCartTotals();
      const orders = s.currentRole === 'booker' ? s.orders.filter(o => o.submittedById === s.currentUser.id) : s.orders;
      const order = orders.find(o => o.id === this.selectedOrder) || orders[0];
      this.container.innerHTML = `<div class="view-header"><div class="view-title-group"><span class="view-eyebrow">Faculty income &amp; organisational customers</span><h2 class="view-title">From service selection to a reconciled invoice.</h2><p class="view-description">Combine clinical appointments and commercial hire in one basket, with explicit tax codes, purchase-order approval and linked financial records.</p></div><span class="badge badge-accent">0% OIV booking surcharge</span></div>
        <div class="grid-commercial-layout"><section class="card"><div class="card-header-flex"><h3 class="card-title">Service catalogue</h3><span class="badge badge-neutral">${s.services.length} services</span></div><div class="catalogue-grid">${s.services.map(service => {
          const full = Number.isInteger(service.seatsTotal) && service.seatsBooked >= service.seatsTotal;
          return `<article class="catalogue-item"><div class="section-tag-row"><span class="badge ${service.stream === 'Area A' ? 'badge-primary' : 'badge-info'}">${E(service.stream)}</span>${full ? '<span class="badge badge-neutral">Waiting list</span>' : ''}</div><h4>${E(service.name)}</h4><p class="text-xs text-muted">${E(service.duration)} · ${service.vatExempt ? 'Exempt tax code' : '20% tax code'}</p><div class="card-header-flex mt-3"><strong>${money(service.price)} <span class="text-xs text-muted">net</span></strong><button class="btn btn-secondary btn-sm" data-add-service="${E(service.id)}" ${full ? 'disabled' : ''} aria-label="Add ${E(service.name)} to basket">${full ? 'Course full' : 'Add to basket'}</button></div></article>`;
        }).join('')}</div><p class="text-xs text-muted mt-3">Tax classifications are illustrative configuration; LJMU Finance approves the applicable codes for its services.</p></section>
        <section class="card checkout-card"><span class="badge badge-accent">Organisational checkout</span><h3 class="card-title mt-2">Riverside Athletics Club</h3><p class="text-sm text-muted mb-4">Fictional organisational customer · purchase-order payment</p>
          <div class="basket-list">${s.cart.length ? s.cart.map(item => {const line = HubDomain.lineAmounts(item);return `<div class="basket-item"><div><strong>${E(item.name)}</strong><p class="text-xs text-muted">${item.qty} × ${money(item.unitPrice)} · ${item.vatExempt ? 'Exempt' : '20% VAT'}</p></div><div class="basket-amount"><strong>${money(line.net + line.vat)}</strong><button class="btn-text" data-remove-item="${E(item.id)}" aria-label="Remove ${E(item.name)}">Remove</button></div></div>`;}).join('') : '<p class="text-muted">Your basket is empty. Add a service to continue.</p>'}</div>
          <dl class="checkout-totals"><div><dt>Exempt net</dt><dd>${money(totals.netExempt)}</dd></div><div><dt>Taxable net</dt><dd>${money(totals.netStandard)}</dd></div><div><dt>VAT</dt><dd>${money(totals.vatStandard)}</dd></div><div class="total-row"><dt>Total</dt><dd id="cart-total">${money(totals.totalGross)}</dd></div></dl>
          <form id="purchase-order-form"><div class="form-group"><label for="po-number">Purchase order reference</label><input id="po-number" class="form-control" value="RAC-2026-PO-9943" maxlength="64" required autocomplete="off" pattern="[A-Za-z0-9][A-Za-z0-9 ._\\x2F\\x2D]{2,63}" aria-describedby="po-help"><p id="po-help" class="text-xs text-muted mt-2">Use a unique reference for each order.</p></div><div class="form-group"><label for="po-terms">Payment terms</label><select id="po-terms" class="form-control"><option>Net 30 Days</option><option>Net 60 Days</option><option>Payment in advance</option></select></div><button id="btn-submit-po" class="btn btn-primary btn-block" ${s.cart.length ? '' : 'disabled'}>Submit for commercial approval</button></form>
          <p class="text-xs text-muted mt-3">This walkthrough creates a reference order; no payment is taken.</p></section></div>
        <section class="card"><div class="card-header-flex"><div><h3 class="card-title">Purchase orders &amp; invoice preview</h3><p class="card-subtitle">Submitting and approving an order are separate actions.</p></div><span class="badge badge-neutral">${orders.length} orders</span></div>
          <div class="table-responsive"><table class="data-table"><caption class="sr-only">Purchase orders</caption><thead><tr><th scope="col">Order</th><th scope="col">PO reference</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>${orders.map(o => `<tr><td>${E(o.orderNumber)}</td><td>${E(o.poNumber)}</td><td>${money(o.totalGross)}</td><td><span class="badge ${o.dateApproved ? 'badge-success' : 'badge-amber'}">${o.dateApproved ? 'Approved · export ready' : 'Awaiting approval'}</span></td><td><button class="btn-text" data-view-order="${E(o.id)}">View invoice</button>${AppStore.can('approveOrder') && !o.dateApproved && o.submittedById !== s.currentUser.id ? `<button class="btn btn-primary btn-sm" data-approve-order="${E(o.id)}">Approve PO</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5">No orders submitted.</td></tr>'}</tbody></table></div>
          ${order ? this.invoice(order) : ''}</section>`;
      this.container.querySelectorAll('[data-add-service]').forEach(b => b.addEventListener('click', () => this.run(() => { AppStore.addToCart(b.dataset.addService); this.render(); App.showToast('Service added to basket.'); })));
      this.container.querySelectorAll('[data-remove-item]').forEach(b => b.addEventListener('click', () => this.run(() => { AppStore.removeFromCart(b.dataset.removeItem); this.render(); })));
      this.container.querySelectorAll('[data-view-order]').forEach(b => b.addEventListener('click', () => { this.selectedOrder = b.dataset.viewOrder; this.render(); this.container.querySelector('#invoice-preview').scrollIntoView({behavior:'auto',block:'nearest'}); }));
      this.container.querySelectorAll('[data-approve-order]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try { const o = await AppStore.approvePurchaseOrder(b.dataset.approveOrder); this.selectedOrder = o.id; this.render(); App.showToast('Order approved. Balanced finance mapping is ready for export.'); }
        catch (error) { b.disabled = false; App.showToast(error.message, true); }
      }));
      this.container.querySelector('#purchase-order-form').addEventListener('submit', async event => {
        event.preventDefault(); const button = this.container.querySelector('#btn-submit-po'); button.disabled = true;
        try { const o = await AppStore.submitPurchaseOrder({poNumber:this.container.querySelector('#po-number').value,paymentTerms:this.container.querySelector('#po-terms').value}); this.selectedOrder = o.id; this.render(); App.showToast('Purchase order submitted for independent approval.'); }
        catch (error) { button.disabled = false; App.showToast(error.message, true); }
      });
    }
    run(action) { try { action(); } catch (error) { App.showToast(error.message,true); } }
    invoice(o) {
      return `<section id="invoice-preview" class="invoice-preview mt-4" aria-label="Reference invoice"><div class="card-header-flex"><div><span class="view-eyebrow">Reference invoice</span><h4>${E(o.orderNumber)}</h4></div><span class="badge badge-neutral">${o.dateApproved ? 'Approved' : 'Awaiting PO approval'}</span></div><div class="grid-2-col mb-4"><div><strong>${E(o.organisationName)}</strong><p>${E(o.invoiceEmail)}</p><p>PO: ${E(o.poNumber)}</p></div><div><p>Created: ${date(o.dateCreated)}</p><p>Terms: ${E(o.paymentTerms)}</p><p>Currency: GBP</p></div></div><div class="table-responsive"><table class="data-table"><caption class="sr-only">Reference invoice line items</caption><thead><tr><th scope="col">Service</th><th scope="col">Quantity</th><th scope="col">Net</th><th scope="col">VAT</th><th scope="col">Gross</th></tr></thead><tbody>${o.items.map(item => `<tr><td>${E(item.name)}</td><td>${item.qty}</td><td>${money(item.net)}</td><td>${money(item.vat)}</td><td>${money(item.net + item.vat)}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row" colspan="2">Total</th><td>${money(o.netExempt+o.netStandard)}</td><td>${money(o.vatStandard)}</td><td><strong>${money(o.totalGross)}</strong></td></tr></tfoot></table></div><p class="text-xs text-muted mt-3">Illustrative invoice layout, not a tax invoice or payment request. University legal and VAT particulars are configured during implementation.</p></section>`;
    }
  }
  return new CommercialWorkspace();
});
