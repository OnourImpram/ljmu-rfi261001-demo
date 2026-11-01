/**
 * LJMU Clinical, Student Supervision & Commercial Booking Hub
 * Master Application Controller & Router
 * Author: ONOUR IMPRAM VENTURES LTD (Company #17429906)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.App = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class Application {
    constructor() {
      this.activeTab = 'booking';
      this.toastTimeout = null;
    }

    init() {
      // 1. Initialise Module Views
      if (typeof BookingModule !== 'undefined') BookingModule.init('view-booking');
      if (typeof EPRModule !== 'undefined') EPRModule.init('view-epr');
      if (typeof CommercialModule !== 'undefined') CommercialModule.init('view-commercial');
      if (typeof GovernanceModule !== 'undefined') GovernanceModule.init('view-governance');

      // 2. Setup Navigation & Role Event Listeners
      this.bindTabNavigation();
      this.bindRoleSwitcher();
      this.bindGlobalActions();

      // 3. Subscribe to Store State Changes
      AppStore.subscribe((state) => {
        this.updateRoleBanner(state);
      });

      // 4. Initial Banner Render
      this.updateRoleBanner(AppStore.getState());
      this.switchTab(this.activeTab);

      console.log('LJMU Clinical, Supervision & Commercial Hub initialised successfully.');
    }

    bindTabNavigation() {
      const tabs = [
        { btnId: 'tab-booking', viewId: 'view-booking', tabName: 'booking' },
        { btnId: 'tab-epr', viewId: 'view-epr', tabName: 'epr' },
        { btnId: 'tab-commercial', viewId: 'view-commercial', tabName: 'commercial' },
        { btnId: 'tab-governance', viewId: 'view-governance', tabName: 'governance' }
      ];

      tabs.forEach(t => {
        const btn = document.getElementById(t.btnId);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab(t.tabName);
          });
        }
      });
    }

    switchTab(tabName) {
      this.activeTab = tabName;
      const tabMap = {
        booking: { btn: 'tab-booking', view: 'view-booking' },
        epr: { btn: 'tab-epr', view: 'view-epr' },
        commercial: { btn: 'tab-commercial', view: 'view-commercial' },
        governance: { btn: 'tab-governance', view: 'view-governance' }
      };

      Object.keys(tabMap).forEach(key => {
        const item = tabMap[key];
        const btn = document.getElementById(item.btn);
        const view = document.getElementById(item.view);
        const isActive = key === tabName;

        if (btn) {
          if (isActive) {
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            btn.setAttribute('tabindex', '0');
          } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
          }
        }

        if (view) {
          if (isActive) {
            view.style.display = 'block';
            view.setAttribute('aria-hidden', 'false');
          } else {
            view.style.display = 'none';
            view.setAttribute('aria-hidden', 'true');
          }
        }
      });

      // Refresh corresponding view content if needed
      if (tabName === 'booking' && typeof BookingModule !== 'undefined') BookingModule.render();
      if (tabName === 'epr' && typeof EPRModule !== 'undefined') EPRModule.render();
      if (tabName === 'commercial' && typeof CommercialModule !== 'undefined') CommercialModule.render();
      if (tabName === 'governance' && typeof GovernanceModule !== 'undefined') GovernanceModule.render();

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    bindRoleSwitcher() {
      const select = document.getElementById('role-select');
      const roleButtons = document.querySelectorAll('[data-role]');

      if (select) {
        select.addEventListener('change', (e) => {
          AppStore.setRole(e.target.value);
          this.refreshAllViews();
        });
      }

      roleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const roleId = btn.getAttribute('data-role');
          if (roleId) {
            AppStore.setRole(roleId);
            if (select) select.value = roleId;
            this.refreshAllViews();
          }
        });
      });
    }

    updateRoleBanner(state) {
      const banner = document.getElementById('role-banner');
      const select = document.getElementById('role-select');
      const user = state.currentUser;
      const role = state.currentRole;

      if (select && select.value !== role) {
        select.value = role;
      }

      // Update role buttons active state
      document.querySelectorAll('[data-role]').forEach(btn => {
        if (btn.getAttribute('data-role') === role) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      if (!banner) return;

      banner.className = `role-banner ${user.badgeClass || 'badge-neutral'}`;
      banner.innerHTML = `
        <div class="container role-banner-inner">
          <div class="role-banner-content">
            <span class="role-indicator-dot" aria-hidden="true"></span>
            <span class="role-banner-title">
              Active Persona: <strong>${user.title}</strong> (${user.name})
            </span>
            <span class="role-banner-divider" aria-hidden="true">·</span>
            <span class="role-banner-meta">${user.bannerMsg || user.program || ''}</span>
          </div>
          <div class="role-quick-switch-pills" role="group" aria-label="Quick Persona Switch">
            <span class="role-switch-label">Persona View:</span>
            <button type="button" class="pill-role ${role === 'student' ? 'active' : ''}" data-role="student">Student</button>
            <button type="button" class="pill-role ${role === 'supervisor' ? 'active' : ''}" data-role="supervisor">Supervisor *</button>
            <button type="button" class="pill-role ${role === 'manager' ? 'active' : ''}" data-role="manager">Commercial Lead</button>
            <button type="button" class="pill-role ${role === 'booker' ? 'active' : ''}" data-role="booker">Corporate Booker</button>
          </div>
        </div>
      `;

      // Re-attach quick pill click events
      banner.querySelectorAll('.pill-role').forEach(pill => {
        pill.addEventListener('click', () => {
          const r = pill.getAttribute('data-role');
          if (r) {
            AppStore.setRole(r);
            if (select) select.value = r;
            this.refreshAllViews();
          }
        });
      });
    }

    refreshAllViews() {
      if (typeof BookingModule !== 'undefined') BookingModule.render();
      if (typeof EPRModule !== 'undefined') EPRModule.render();
      if (typeof CommercialModule !== 'undefined') CommercialModule.render();
      if (typeof GovernanceModule !== 'undefined') GovernanceModule.render();
    }

    bindGlobalActions() {
      // Reset Data Button
      const resetBtn = document.getElementById('btn-reset-demo');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Reset entire demo state to factory seeds? (All countersigned records & orders will reset)')) {
            AppStore.reset();
            this.refreshAllViews();
            this.showToast('Demo data successfully reset to initial factory state.');
          }
        });
      }

      // Architecture Modal Trigger
      const archBtn = document.getElementById('btn-open-arch-modal');
      const archModal = document.getElementById('arch-modal');
      const closeArchBtn = document.getElementById('btn-close-arch');

      if (archBtn && archModal) {
        archBtn.addEventListener('click', () => {
          archModal.style.display = 'flex';
        });
      }
      if (closeArchBtn && archModal) {
        closeArchBtn.addEventListener('click', () => {
          archModal.style.display = 'none';
        });
      }

      // The 6 Capability Pillars Modal Trigger
      const pillarsBtn = document.getElementById('btn-open-pillars-modal');
      const pillarsModal = document.getElementById('pillars-modal');
      const closePillarsBtn = document.getElementById('btn-close-pillars');

      if (pillarsBtn && pillarsModal) {
        pillarsBtn.addEventListener('click', () => {
          pillarsModal.style.display = 'flex';
        });
      }
      if (closePillarsBtn && pillarsModal) {
        closePillarsBtn.addEventListener('click', () => {
          pillarsModal.style.display = 'none';
        });
      }
    }

    showToast(message) {
      let toast = document.getElementById('app-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'toast-notification';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }

      toast.innerText = message;
      toast.classList.add('toast-visible');

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('toast-visible');
      }, 4000);
    }
  }

  const appInstance = new Application();

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      appInstance.init();
    });
  }

  return appInstance;
});
