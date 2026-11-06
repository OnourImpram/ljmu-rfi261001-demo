(function (root, factory) {
  const chart = factory();
  if (typeof module === 'object' && module.exports) module.exports = chart;
  else root.BodyChart = chart;
})(typeof self === 'undefined' ? globalThis : self, function () {
  'use strict';

  const centre = 110;
  const sites = new Map();
  const views = {front:'Front', back:'Back'};
  const remembered = new Map();

  function addSite(view, side, key, name, x, y, shape, mirrored = false) {
    const id = [view, side, key].join(':');
    const label = side === 'midline' ? name : side[0].toUpperCase() + side.slice(1) + ' ' + name.toLowerCase();
    sites.set(id, Object.freeze({id, view, side, label, x, y, shape, mirrored}));
  }

  function pair(view, key, name, x, y, path) {
    const visualLeft = view === 'front' ? 'right' : 'left';
    addSite(view, visualLeft, key, name, x, y, path);
    addSite(view, visualLeft === 'left' ? 'right' : 'left', key, name, 2 * centre - x, y, path, true);
  }

  for (const view of Object.keys(views)) {
    addSite(view, 'midline', 'head', view === 'front' ? 'Head' : 'Back of head', 110, 37, 'M86 12H134V61H86Z');
    addSite(view, 'midline', 'neck', 'Neck', 110, 66, 'M106 60H114V79L110 82 106 79Z');
    pair(view,'neck','Side of neck',102,68,'M93 60H106V79L93 73Z');
    pair(view, 'shoulder', 'Shoulder', 76, 83, 'M53 71L95 69 93 82 78 99 60 103Z');
    pair(view, 'upper-arm', 'Upper arm', 69, 115, 'M57 99L79 96 76 119 70 133 55 131Z');
    pair(view, 'elbow', 'Elbow', 61, 139, 'M54 130L72 133 67 149 52 147Z');
    pair(view, 'forearm', 'Forearm', 53, 165, 'M50 147L68 149 59 181 43 178Z');
    pair(view, 'wrist', 'Wrist', 48, 185, 'M42 177L59 181 56 191 40 189Z');
    pair(view, 'hand', 'Hand', 45, 199, 'M36 187L57 190 60 213 30 216Z');
    pair(view, 'thigh', 'Thigh', 88, 231, 'M71 201L109 199 105 237 99 262 77 262Z');
    pair(view, 'knee', 'Knee', 87, 272, 'M75 260L100 260 99 283 75 283Z');
    pair(view, view === 'front' ? 'shin' : 'calf', view === 'front' ? 'Shin' : 'Calf', 86, 307,'M74 282H101L93 342H73Z');
    pair(view, 'ankle', 'Ankle', 84, 350, 'M71 341H96V359H71Z');
    pair(view, 'foot', view === 'front' ? 'Foot' : 'Heel and foot', 82, 365, 'M64 358H98V380H64Z');
    if (view === 'front') {
      pair(view, 'chest', 'Chest', 93, 99, 'M78 89L94 77 108 82 108 120 81 116Z');
      addSite(view,'midline','abdomen','Abdomen',110,144,'M80 118Q109 125 140 118L136 160 119 171H101L84 160Z');
      addSite(view,'midline','pelvis','Pelvis',110,181,'M102 166H118L127 183 113 200H107L93 183Z');
      pair(view, 'hip', 'Hip', 83, 181, 'M74 158L100 165 103 175 93 203 69 205Z');
    } else {
      pair(view, 'shoulder-blade', 'Shoulder blade', 91,100,'M79 89L95 77 105 85 102 125 80 119Z');
      addSite(view,'midline','upper-back','Upper back',110,106,'M102 79L110 82 118 79 117 125H103Z');
      addSite(view,'midline','lower-back','Lower back',110,145,'M80 120Q110 126 140 120L137 162Q110 172 83 162Z');
      pair(view, 'buttock', 'Buttock', 90,183,'M73 161L110 168 110 196 99 203 72 201Z');
    }
  }

  const halfBody = 'M110 51 C106 55 102 56 102 62 C102 67 99 69 93 71 L79 75 C72 77 67 81 65 88 C62 96 63 105 60 114 L55 132 C54 137 53 140 54 143 C51 153 49 163 46 174 L43 184 C42 187 40 190 39 194 L36 201 Q35 204 37 204 L41 199 L37 208 Q37 210 39 209 L44 202 L40 210 Q40 212 42 211 L47 204 L44 210 Q44 212 46 210 L51 202 Q53 199 54 194 L55 199 Q56 201 57 199 L57 193 Q57 188 54 185 L57 177 C61 166 67 157 69 147 C70 143 71 139 71 136 C75 128 79 118 80 108 L81 102 C82 113 87 122 87 132 C87 141 83 149 80 158 C75 169 73 183 74 195 C74 211 76 224 77 238 C78 249 79 254 78 262 C76 269 76 275 78 281 C77 287 75 298 75 309 C75 321 78 334 78 344 L76 352 C76 358 72 362 69 367 Q66 373 70 375 Q77 379 86 374 L92 367 Q94 363 91 358 C90 353 91 347 92 341 C94 328 100 315 100 302 C100 294 97 286 97 279 C100 269 100 264 99 257 C100 247 104 234 106 222 C108 213 109 207 110 202';
  const head = 'M110 16 C100 16 94 21 94 31 L95 38 Q92 36 93 42 Q93 46 97 46 C98 53 103 58 108 60 Q110 61 112 60 C117 58 122 53 123 46 Q127 45 127 40 Q128 36 125 38 L126 31 C126 21 120 16 110 16Z';
  const backHead = 'M110 16 C99 16 94 23 94 32 L95 38 Q92 37 93 42 Q94 45 96 46 L98 52 Q99 57 104 59 Q110 61 116 59 Q121 56 122 52 L124 46 Q127 44 127 40 Q127 37 125 38 L126 32 C126 22 120 16 110 16Z';
  const flip = 'translate(220 0) scale(-1 1)';

  function symmetric(markup) { return markup + '<g transform="' + flip + '">' + markup + '</g>'; }

  function anatomy(view) {
    const front = view === 'front';
    const face = front ? head : backHead;
    const armAndLegPlanes = symmetric(`
      <path class="atlas-shade" d="M78 78C66 82 64 95 65 105Q72 96 78 97Q82 86 86 77Z M67 105Q61 120 58 133Q66 128 72 111Z M57 147Q51 161 49 177Q59 162 63 149Z"/>
      <path class="atlas-shade" d="M76 192C74 214 81 236 80 253Q83 260 86 260Q84 243 86 225Q88 211 85 200Z M79 284C73 307 80 320 80 337Q83 320 87 312Q81 302 82 288Z"/>
      <path class="atlas-detail" d="M79 81Q70 84 67 95 M77 104Q75 122 67 133 M55 143Q59 145 65 142 M65 151Q60 159 55 174 M45 182Q49 184 53 184 M42 192Q45 190 49 190 M77 350Q81 353 87 350"/>
    `);
    const landmarks = front ? symmetric(`
      <path class="atlas-shade" d="M83 86Q97 83 107 87L106 90Q96 88 83 91Z M81 105Q93 110 106 106Q103 114 93 113Q85 112 81 105Z M88 122Q91 127 94 130L91 145Q85 152 82 158Q88 143 88 135Z"/>
      <path class="atlas-detail" d="M101 66Q103 75 108 81 M81 83Q93 79 105 84 M81 103Q92 109 105 105 M82 111Q89 119 96 120 M89 124L95 128 M87 132L93 135 M86 140L90 143 M81 160Q89 166 105 178 M78 182Q84 171 91 170"/>
      <path class="atlas-detail" d="M77 201Q84 212 84 228Q84 244 86 252 M99 205Q93 228 89 244 M97 249Q95 257 91 261 M81 266Q86 262 92 266Q94 271 88 277Q83 278 81 272 M85 283Q88 295 84 316L82 341 M95 293Q97 308 90 322 M74 366Q81 364 88 361 M70 373L73 369 M74 374L77 370 M79 373L81 370"/>
    `) + `<path class="atlas-detail" d="M110 86L110 102 M110 123Q108 131 110 140 M108 151Q111 154 112 150 M107 173Q110 175 113 173"/>`
      : symmetric(`
      <path class="atlas-shade" d="M101 65Q98 77 81 82Q88 82 101 95L109 110L106 79Z M83 88Q87 100 98 116Q96 102 101 95Z M79 173Q89 165 104 171Q99 175 97 185Q89 191 77 193Z M82 285C74 298 77 311 80 319Q86 320 87 313Q90 296 87 283Z"/>
      <path class="atlas-detail" d="M102 65Q99 76 82 82 M79 85Q90 83 101 95 M82 91Q86 108 97 118Q102 109 103 99 M81 117Q91 130 102 137 M88 130Q92 143 88 153 M103 135Q103 148 101 158 M80 166Q87 165 96 169 M77 190Q85 203 102 194"/>
      <path class="atlas-detail" d="M80 207Q83 230 84 247 M97 204Q92 223 92 245L93 258 M79 267Q85 272 94 267 M80 278Q88 283 95 277 M80 288Q75 304 83 316Q90 309 89 287 M92 290Q98 305 89 319 M83 319Q86 333 84 348 M78 359Q84 355 90 359 M73 368Q78 365 85 368"/>
    `) + `<path class="atlas-detail" d="M110 68Q109 77 110 87C112 105 109 121 110 134L110 152 M106 161Q110 165 114 161 M110 171Q108 184 110 194"/>`;
    return `<defs>
      <linearGradient id="atlas-paper-ink" x1="0%" y1="0%" x2="100%" y2="14%"><stop stop-color="#c9c4b9"/><stop offset=".24" stop-color="#ece8dd"/><stop offset=".51" stop-color="#f5f1e8"/><stop offset=".8" stop-color="#e5dfd2"/><stop offset="1" stop-color="#c6c1b7"/></linearGradient>
      <clipPath id="atlas-shape" clipPathUnits="userSpaceOnUse"><path d="${halfBody}Z"/><path transform="${flip}" d="${halfBody}Z"/><path d="${face}"/></clipPath>
      </defs>
      <g aria-hidden="true" pointer-events="none"><rect x="31" y="13" width="158" height="367" class="atlas-base" clip-path="url(#atlas-shape)"/>
      <g clip-path="url(#atlas-shape)">${armAndLegPlanes}${landmarks}</g>
      <path class="atlas-outline" d="${halfBody}"/><path class="atlas-outline" transform="${flip}" d="${halfBody}"/>
      <path class="atlas-head" d="${face}"/>${front ? `<g class="atlas-face"><path d="M98 35Q101 33.8 105 35 M115 35Q119 33.8 122 35 M98.5 38Q102 36.2 105.6 38 M114.4 38Q118 36.2 121.5 38 M100 38.7Q102 39.7 104 38.9 M116 38.9Q118 39.7 120 38.7 M109.8 38L108.4 43.4Q108 45 110.1 45.1L112 44.6 M105.6 50.15Q108 50.9 110 50.45Q112.2 50.9 114.7 50.15 M107.5 52.7Q110 53.35 112.7 52.6"/></g>` : `<path class="atlas-face" d="M98 47Q100 56 110 57Q120 55 122 47"/>`}</g>`;
  }

  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const namedSite = marker => marker?.schemaVersion === 2 ? sites.get(marker.siteId) : undefined;

  function context(record) {
    if (!remembered.has(record.id)) {
      const recorded = (record.bodyMarkers || []).map(namedSite).find(Boolean);
      remembered.set(record.id,{view:recorded?.view || 'front', selection:null});
    }
    return remembered.get(record.id);
  }

  function figure(view, markers, selection, editable) {
    const left = view === 'front' ? 'R' : 'L', right = left === 'R' ? 'L' : 'R';
    const mapped = markers.map(namedSite).filter(Boolean).map((site,index) => ({site,number:index+1})).filter(m => m.site.view === view);
    const hasSelection = selection && selection.view === view;
    return `<svg id="svg-body-map" viewBox="0 0 220 392" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="anatomy-title anatomy-description">
      <title id="anatomy-title">${views[view]} body surface</title><desc id="anatomy-description">${views[view]} view. ${left === 'R' ? "The patient's right is on your left." : "The patient's left is on your left."} ${mapped.length} recorded sites on this view. The recorded locations are listed beside the chart.</desc>
      <g class="atlas-orientation" aria-hidden="true"><text x="20" y="86">${left}</text><text x="200" y="86">${right}</text><path d="M14 92H26M194 92H206"/></g>
      ${anatomy(view)}
      <g clip-path="url(#atlas-shape)" class="atlas-regions" aria-hidden="true">
        ${[...sites.values()].filter(site => site.view === view).map(site => `<path d="${site.shape}" ${site.mirrored ? 'transform="'+flip+'"' : ''}
          class="atlas-region${editable ? ' can-pick' : ''}${selection?.id === site.id ? ' is-picked' : ''}" data-chart-site="${site.id}"/>`).join('')}
      </g>
      <g class="atlas-marks" aria-hidden="true">
      ${mapped.map(({site,number}) => `<g data-chart-mark="${site.id}" transform="translate(${site.x} ${site.y})"><circle class="atlas-pin" r="7.3"/><text y=".33em">${number}</text></g>`).join('')}
      ${hasSelection && !mapped.some(m => m.site.id === selection.id) ? `<g class="atlas-preview-pin" transform="translate(${selection.x} ${selection.y})"><circle r="7.5"/><path d="M-3 0H3M0 -3V3"/></g>` : ''}
      </g></svg>`;
  }

  function render(record, editable) {
    const current = context(record);
    const markers = Array.isArray(record.bodyMarkers) ? record.bodyMarkers : [];
    const proposed = sites.get(current.selection);
    const recordedSelection = proposed && markers.some(marker => namedSite(marker)?.id === proposed.id);
    if (!editable && !recordedSelection) current.selection = null;
    const selected = sites.get(current.selection);
    const already = markers.some(marker => namedSite(marker)?.id === selected?.id && selected);
    const choices = [...sites.values()].filter(site => site.view === current.view);
    const count = markers.length;
    const siteNumbers = new Map(markers.map(namedSite).filter(Boolean).map((site,index) => [site.id,index+1]));
    const onView = markers.filter(marker => namedSite(marker)?.view === current.view).length;
    const otherView = current.view === 'front' ? 'back' : 'front';
    const otherCount = markers.filter(marker => namedSite(marker)?.view === otherView).length;
    const scope = onView ? onView + (onView === 1 ? ' location on this view.' : ' locations on this view.') :
      otherCount ? otherCount + (otherCount === 1 ? ' location on the ' : ' locations on the ') + otherView + ' view.' : 'No mapped locations on this view.';
    return `<section id="body-atlas-panel" class="body-atlas" aria-labelledby="clinical-body-chart">
      <header class="atlas-header"><h4 id="clinical-body-chart" tabindex="-1">Body chart</h4><div class="atlas-switch" role="group" aria-label="Body chart view">
        ${Object.entries(views).map(([key,label]) => `<button type="button" data-chart-view="${key}" aria-pressed="${current.view === key}">${label}</button>`).join('')}
      </div></header>
      <div class="atlas-layout"><div class="atlas-plate">${figure(current.view,markers,selected,editable)}
        <p class="atlas-orient-note">L and R refer to the patient.</p></div>
        <div class="atlas-side">
        ${editable ? `<form id="marker-form" class="atlas-editor"><label for="marker-region">Mark a location</label>
        <p id="atlas-pick-help">Select a region on the figure or choose one below.</p>
        <select id="marker-region" class="form-control" aria-describedby="atlas-pick-help"><option value="">Choose a location</option>
        ${['midline','left','right'].map(side => `<optgroup label="${side === 'midline' ? 'Midline' : side === 'left' ? 'Patient’s left' : 'Patient’s right'}">
          ${choices.filter(site => site.side === side).map(site => `<option value="${site.id}" ${site.id === current.selection ? 'selected' : ''}>${site.label}</option>`).join('')}</optgroup>`).join('')}
        </select><button class="btn btn-primary" id="chart-add" ${!selected || already ? 'disabled' : ''}>${already ? 'Site recorded' : 'Add to note'}</button></form>` : `<div class="atlas-readonly"><strong>${record.status.includes('COUNTERSIGNED') ? 'Signed record' : 'Student author can add locations'}</strong><p>${scope}</p></div>`}
        <div class="atlas-recorded"><h5>Recorded locations <span>${count}</span></h5>
        <ul id="body-marker-list">${count ? markers.map(marker => {
          const site = namedSite(marker);
          if (!site) return `<li class="chart-legacy"><strong>${escape(marker?.label || 'Earlier chart annotation')}</strong><small>Earlier chart · view unrecorded</small></li>`;
          return `<li><button type="button" class="atlas-locate" data-chart-locate="${site.id}" aria-label="Show ${site.label.toLowerCase()}, ${views[site.view].toLowerCase()} view">
            <span class="atlas-number">${siteNumbers.get(site.id)}</span><span><strong>${site.label}</strong><small>${site.view === current.view ? views[site.view] + ' view' : 'Show on ' + site.view + ' view →'}</small></span></button>
            ${editable ? `<button type="button" class="atlas-remove" data-chart-remove="${site.id}" aria-label="Remove ${site.label.toLowerCase()}, ${views[site.view].toLowerCase()} view">Remove</button>` : ''}</li>`;
        }).join('') : '<li class="atlas-empty">No locations recorded.</li>'}</ul></div>
        </div></div>
      <p class="atlas-status" id="chart-feedback" role="status"></p>
    </section>`;
  }

  function bind(record, editable, mutate) {
    const panel = document.getElementById('body-atlas-panel');
    if (!panel) return;
    const current = context(record);
    function redraw(focus, message) {
      panel.outerHTML = render(record,editable);
      bind(record,editable,mutate);
      if (focus) document.querySelector(focus)?.focus({preventScroll:true});
      if (message) document.getElementById('chart-feedback').textContent = message;
    }
    for (const button of panel.querySelectorAll('[data-chart-view]')) button.addEventListener('click', () => {
      const view = button.dataset.chartView;
      if (current.view !== view) {current.view = view; current.selection = null;}
      redraw('[data-chart-view="' + view + '"]');
    });
    for (const button of panel.querySelectorAll('[data-chart-locate]')) button.addEventListener('click', () => {
      const site = sites.get(button.dataset.chartLocate);
      current.view = site.view; current.selection = site.id;
      redraw('[data-chart-locate="' + site.id + '"]','Showing ' + site.label.toLowerCase() + ', ' + views[site.view].toLowerCase() + ' view.');
    });
    if (!editable) return;
    const select = panel.querySelector('#marker-region');
    function choose(id, fromPicker) {
      const site = sites.get(id);
      current.selection = site?.view === current.view ? id : null;
      redraw(fromPicker ? '#marker-region' : null, site ? site.label + ' selected.' : '');
    }
    select.addEventListener('change', () => choose(select.value,true));
    panel.querySelector('#svg-body-map').addEventListener('click', event => {
      const hit = event.target.closest('[data-chart-site]');
      if (hit) choose(hit.dataset.chartSite,false);
    });
    async function edit(id, operation) {
      const site = sites.get(id);
      if (!site) return;
      if (operation === 'remove') current.selection = null;
      const changed = await mutate(id,operation);
      const feedback = document.getElementById('chart-feedback');
      if (!feedback) return;
      document.getElementById('marker-region')?.focus({preventScroll:true});
      feedback.textContent = changed ? site.label + (operation === 'add' ? ' added.' : ' removed.') : 'The recorded locations have not changed.';
    }
    panel.querySelector('#marker-form').addEventListener('submit', event => {
      event.preventDefault();
      if (current.selection) edit(current.selection,'add');
    });
    for (const button of panel.querySelectorAll('[data-chart-remove]')) button.addEventListener('click', () => edit(button.dataset.chartRemove,'remove'));
  }

  return Object.freeze({getSite: id => sites.get(id), clearSession: () => remembered.clear(), render, bind});
});
