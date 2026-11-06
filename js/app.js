(function () {
  'use strict';

  const navigation = document.querySelector('.service-nav [role="tablist"]');
  const tabs = [...navigation.querySelectorAll('[role="tab"]')];
  const byKey = new Map(tabs.map(tab => [tab.id.slice(4), tab]));

  function switchTab(key) {
    const selected = byKey.get(key);
    if (!selected) return;
    document.getElementById('desk-label').textContent = selected.textContent.trim();
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
  }

  function focusTarget(element) {
    if (!element.hasAttribute('tabindex')) element.tabIndex = -1;
    element.focus({preventScroll: true});
    element.scrollIntoView({block: 'start', behavior: 'instant'});
  }

  function openBodyChart() {
    const panel = document.getElementById('view-epr');
    let heading = panel.querySelector('#clinical-body-chart');
    if (!heading) {
      const record = panel.querySelector('[data-discipline="osteopathy"], [data-discipline="physiotherapy"]');
      record?.click();
      heading = panel.querySelector('#clinical-body-chart');
    }
    const destination = heading || panel.querySelector('h2') || panel;
    focusTarget(destination);
  }

  function openWorkspace(fragment, updateAddress = false, fromArrow = false) {
    const chart = fragment === 'epr/body-chart';
    const key = chart ? 'epr' : fragment;
    const tab = byKey.get(key);
    if (!tab) return;
    if (updateAddress && location.hash !== '#' + fragment) {
      const action = fromArrow && history.state?.workspaceArrow ? 'replaceState' : 'pushState';
      history[action]({workspaceArrow: fromArrow}, '', '#' + fragment);
    }
    switchTab(key);
    if (chart) {
      openBodyChart();
    } else {
      tab.focus({preventScroll: true});
      document.getElementById('main-content').scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }

  function bindNavigation() {
    tabs.forEach((tab, index) => {
      const key = tab.id.slice(4);
      tab.addEventListener('click', () => openWorkspace(key, true));
      tab.addEventListener('keydown', event => {
        const nextIndex = {
          ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0,
          End: tabs.length - 1
        }[event.key];
        if (nextIndex === undefined) return;
        event.preventDefault();
        openWorkspace(tabs[nextIndex].id.slice(4), true, true);
      });
    });
    for (const link of document.querySelectorAll('a[data-workspace]')) {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
        event.preventDefault();
        openWorkspace(link.dataset.workspace, true);
      });
    }
    window.addEventListener('hashchange', () => {
      if (location.hash) openWorkspace(location.hash.slice(1));
      else {
        switchTab('booking');
        const title = document.getElementById('hero-heading');
        title.tabIndex = -1;
        title.focus({preventScroll: true});
        window.scrollTo({top: 0, behavior: 'instant'});
      }
    });
  }

  function refreshAllViews() {
    BookingModule.render();
    EprModule.render();
    CommercialModule.render();
    GovernanceModule.render();
  }

  function bindRoleSelector() {
    const select = document.getElementById('role-select');
    const banner = document.getElementById('role-banner');
    let previousState = AppStore.getState();
    function showRole(state) {
      select.value = state.currentRole;
      banner.textContent = select.selectedOptions[0].textContent + ' view: ' + state.currentUser.name;
    }
    showRole(previousState);
    select.addEventListener('change', () => AppStore.setRole(select.value));
    AppStore.subscribe(state => {
      const auditOnly = state.auditLog !== previousState.auditLog &&
        Object.keys(state).length === Object.keys(previousState).length &&
        Object.keys(state).every(key => Object.hasOwn(previousState,key) && (key === 'auditLog' || state[key] === previousState[key]));
      previousState = state;
      if (auditOnly) GovernanceModule.refreshAudit();
      else {
        showRole(state);
        refreshAllViews();
      }
    });
  }

  function bindDialogFocus(dialog) {
    const focusable = () => [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')]
      .filter(control => !control.disabled && control.tabIndex >= 0 && control.getClientRects().length);
    let trigger = null;
    const observer = new MutationObserver(() => {
      if (!dialog.hidden && !trigger) {
        trigger = document.activeElement;
        focusable()[0]?.focus();
      } else if (dialog.hidden && trigger) {
        const target = trigger.isConnected ? trigger : document.getElementById(trigger.id);
        (target || document.querySelector('[role="tab"][aria-selected="true"]'))?.focus();
        trigger = null;
      }
    });
    observer.observe(dialog, {attributes: true, attributeFilter: ['hidden']});
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.hidden = true;
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0];
      const last = controls.at(-1);
      const boundary = event.shiftKey ? first : last;
      if (boundary && document.activeElement === boundary) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
  }

  function bindDialogs() {
    for (const dialog of document.querySelectorAll('.modal-backdrop')) bindDialogFocus(dialog);
    for (const trigger of document.querySelectorAll('[data-open-dialog]')) {
      trigger.addEventListener('click', () => {
        document.getElementById(trigger.dataset.openDialog).hidden = false;
      });
    }
    for (const closeButton of document.querySelectorAll('[data-close-dialog]')) {
      closeButton.addEventListener('click', () => { closeButton.closest('[role="dialog"]').hidden = true; });
    }
    const about = document.getElementById('btn-open-arch-modal');
    const navSlot = about.parentElement;
    const footerSlot = document.getElementById('footer-about-slot');
    const narrow = matchMedia('(max-width: 660px)');
    const moveAbout = () => (narrow.matches ? footerSlot : navSlot).appendChild(about);
    moveAbout();
    narrow.addEventListener('change', moveAbout);
  }

  function downloadFile(filename, content, mimeType) {
    const url = URL.createObjectURL(new Blob([content], {type: mimeType}));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  bindNavigation();
  bindRoleSelector();
  bindDialogs();
  document.getElementById('btn-reset-demo').addEventListener('click', () => AppStore.reset());
  refreshAllViews();
  openWorkspace(location.hash.slice(1));
  window.App = {openWorkspace, switchTab, refreshAllViews, downloadFile};
})();
