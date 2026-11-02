/** Navigation, accessible dialogs and shared presentation helpers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.App = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const TABS = ['booking', 'epr', 'commercial', 'governance'];
  const ROLE_LABELS = { student: 'Student', supervisor: 'Supervisor', manager: 'Commercial lead', booker: 'Corporate booker' };

  class Application {
    constructor() {
      this.activeTab = 'booking';
      this.toastTimeout = null;
      this.modal = null;
      this.modalTrigger = null;
    }
    init() {
      this.modules = { booking: BookingModule, epr: EPRModule, commercial: CommercialModule, governance: GovernanceModule };
      for (const [name, module] of Object.entries(this.modules)) module.init('view-' + name);
      for (const name of TABS) {
        const button = document.getElementById('tab-' + name);
        button.addEventListener('click', () => this.switchTab(name));
        button.addEventListener('keydown', event => {
          let target;
          const index = TABS.indexOf(name);
          if (event.key === 'ArrowRight') target = TABS[(index + 1) % TABS.length];
          if (event.key === 'ArrowLeft') target = TABS[(index + TABS.length - 1) % TABS.length];
          if (event.key === 'Home') target = TABS[0];
          if (event.key === 'End') target = TABS[TABS.length - 1];
          if (target) { event.preventDefault(); this.switchTab(target); document.getElementById('tab-' + target).focus(); }
        });
      }
      document.getElementById('role-select').addEventListener('change', event => this.usePersona(event.target.value));
      document.getElementById('btn-reset-demo').addEventListener('click', () => {
        if (window.confirm('Reset the reference data and clear this walkthrough’s bookings, reviews and orders?')) {
          this.closeDialog(); AppStore.reset(); this.refreshAllViews();
          this.showToast('Reference data reset. The walkthrough is ready.');
        }
      });
      for (const [open, modal, close] of [
        ['btn-open-arch-modal', 'arch-modal', 'btn-close-arch'],
        ['btn-open-pillars-modal', 'pillars-modal', 'btn-close-pillars']
      ]) this.bindDialog(open, modal, close);
      document.addEventListener('keydown', event => this.handleDialogKeys(event));
      AppStore.subscribe(state => this.updateRoleBanner(state));
      this.updateRoleBanner(AppStore.getState());
      this.switchTab('booking');
    }
    switchTab(name) {
      if (!TABS.includes(name)) return;
      this.closeDialog();
      this.activeTab = name;
      for (const tab of TABS) {
        const active = tab === name;
        const button = document.getElementById('tab-' + tab);
        const view = document.getElementById('view-' + tab);
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        view.hidden = !active;
        view.setAttribute('aria-hidden', String(!active));
      }
      this.modules[name].render();
    }
    usePersona(role) {
      this.closeDialog();
      AppStore.setRole(role);
      this.refreshAllViews();
    }
    refreshAllViews() {
      for (const module of Object.values(this.modules)) module.render();
    }
    updateRoleBanner(state) {
      const user = state.currentUser;
      const pending = Object.values(state.records).filter(record => record.status.includes('DRAFT')).length;
      const message = state.currentRole === 'supervisor' ? `${pending} clinical review${pending === 1 ? '' : 's'} awaiting sign-off`
        : state.currentRole === 'manager' ? `${state.orders.filter(order => !order.dateApproved).length} orders awaiting approval`
          : state.currentRole === 'student' ? 'Assigned records and supervised practice' : 'Bookings, purchase orders and invoices';
      document.getElementById('role-select').value = state.currentRole;
      const banner = document.getElementById('role-banner');
      banner.className = 'role-banner ' + user.badgeClass;
      banner.innerHTML = `<div class="container role-banner-inner"><div class="role-banner-content">
        <span class="role-indicator-dot" aria-hidden="true"></span><span><strong>${HubDomain.escapeHtml(user.name)}</strong> · ${ROLE_LABELS[state.currentRole]}</span>
        <span class="role-banner-meta">${message}</span></div>
        <div class="role-quick-switch-pills" role="group" aria-label="Choose a walkthrough persona">
          ${Object.entries(ROLE_LABELS).map(([role, label]) => `<button type="button" class="pill-role ${role === state.currentRole ? 'active' : ''}" data-role="${role}" aria-pressed="${role === state.currentRole}">${label}</button>`).join('')}
        </div></div>`;
      banner.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => this.usePersona(button.dataset.role)));
    }
    renderRestricted(container, title, text, role) {
      container.innerHTML = `<section class="card access-card"><span class="badge badge-neutral">Role-specific workspace</span>
        <h2 class="view-title">${HubDomain.escapeHtml(title)}</h2><p>${HubDomain.escapeHtml(text)}</p>
        <button class="btn btn-primary" data-select-persona="${role}">Explore as ${ROLE_LABELS[role].toLowerCase()}</button></section>`;
      container.querySelector('[data-select-persona]').addEventListener('click', () => this.usePersona(role));
    }
    bindDialog(openId, modalId, closeId) {
      const open = document.getElementById(openId), modal = document.getElementById(modalId), close = document.getElementById(closeId);
      if (open && modal) open.addEventListener('click', () => this.openDialog(modal, open));
      if (close) close.addEventListener('click', () => this.closeDialog());
      if (modal) modal.addEventListener('click', event => { if (event.target === modal) this.closeDialog(); });
    }
    openDialog(modal, trigger = document.activeElement) {
      if (!modal) return;
      this.closeDialog();
      this.modal = modal; this.modalTrigger = trigger;
      modal.style.display = 'flex'; modal.removeAttribute('aria-hidden');
      document.body.classList.add('dialog-open');
      for (const element of document.body.children) {
        if (element !== modal && !element.contains(modal) && element.tagName !== 'SCRIPT') element.inert = true;
      }
      const first = modal.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
      if (first) first.focus();
    }
    closeDialog() {
      if (!this.modal) return;
      this.modal.style.display = 'none'; this.modal.setAttribute('aria-hidden', 'true');
      for (const element of document.body.children) element.inert = false;
      document.body.classList.remove('dialog-open');
      if (this.modalTrigger?.isConnected) this.modalTrigger.focus();
      this.modal = null; this.modalTrigger = null;
    }
    handleDialogKeys(event) {
      if (!this.modal) return;
      if (event.key === 'Escape') { event.preventDefault(); this.closeDialog(); return; }
      if (event.key !== 'Tab') return;
      const items = [...this.modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')]
        .filter(item => item.getClientRects().length > 0);
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !this.modal.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !this.modal.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    download(filename, content, type) {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const link = document.createElement('a'); link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    showToast(message, error = false) {
      const toast = document.getElementById('app-toast');
      toast.textContent = message;
      toast.setAttribute('role', error ? 'alert' : 'status');
      toast.classList.add('toast-visible'); toast.classList.toggle('toast-error', error);
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => toast.classList.remove('toast-visible'), error ? 7000 : 4500);
    }
  }
  const app = new Application();
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => app.init());
  return app;
});
