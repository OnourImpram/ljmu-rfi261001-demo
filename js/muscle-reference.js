(function (root) {
  'use strict';

  const names = {
    abs: 'Abdominals', adductors: 'Adductors', biceps: 'Biceps', calves: 'Calves',
    chest: 'Pectorals', deltoids: 'Deltoids', forearm: 'Forearm muscles', gluteal: 'Gluteals',
    hamstring: 'Hamstrings', hipFlexors: 'Hip flexors', lowerBack: 'Lower back group',
    obliques: 'Obliques', quadriceps: 'Quadriceps', serratus: 'Serratus anterior',
    tibialis: 'Tibialis anterior', trapezius: 'Trapezius', triceps: 'Triceps', upperBack: 'Upper back group'
  };
  const views = {front: 'Front', back: 'Back'};
  const sessions = new WeakMap();
  let loading;

  function geometry() {
    const available = () => root.MuscleReferenceGeometry?.front && root.MuscleReferenceGeometry?.back;
    if (available()) return Promise.resolve(root.MuscleReferenceGeometry);
    if (!loading) {
      loading = new Promise((resolve,reject) => {
        const script = document.createElement('script');
        script.src = 'assets/anatomy/muscle-shapes.js';
        const unavailable = () => {
          script.remove();
          loading = undefined;
          reject(new Error('Muscle diagram unavailable'));
        };
        script.addEventListener('load',() => {
          if (available()) resolve(root.MuscleReferenceGeometry);
          else unavailable();
        },{once:true});
        script.addEventListener('error',unavailable,{once:true});
        document.head.append(script);
      });
    }
    return loading;
  }

  function figure(view,parts) {
    const regions = Object.entries(parts).map(([id,paths]) => {
      const muscle = Object.hasOwn(names,id);
      const group = muscle ? 'data-muscle="' + id + '"' : 'class="muscle-context"';
      return '<g ' + group + '>' + paths.map(d => '<path d="' + d + '"/>').join('') + '</g>';
    });
    const bounds = view === 'front' ? '0 95 727 1280' : '718 95 727 1280';
    return '<figure><figcaption>' + views[view] + '</figcaption><svg viewBox="' + bounds +
      '" role="img" aria-label="' + views[view] + ' muscle groups">' + regions.join('') + '</svg></figure>';
  }

  function mount(container) {
    const target = container.querySelector('[data-muscle-reference]');
    if (!target) return;
    const state = root.AppStore.getState();
    const context = state.personas;
    if (!sessions.has(context)) sessions.set(context,new Map());
    const byRecord = sessions.get(context);
    const discipline = container.querySelector('[data-discipline][aria-selected="true"]')?.dataset.discipline;
    const key = state.currentRole + '/' + discipline;
    if (!byRecord.has(key)) byRecord.set(key,{open:false,selected:''});
    const session = byRecord.get(key);
    target.innerHTML = '<details class="muscle-reference"><summary>Muscle group reference</summary>' +
      '<div class="muscle-reference-content"></div></details>';
    const details = target.querySelector('details');
    const body = target.querySelector('.muscle-reference-content');
    let ready = false;

    async function draw() {
      if (ready) return;
      body.textContent = 'Loading muscle map...';
      let shapes;
      try {
        shapes = await geometry();
      } catch {
        body.textContent = 'Could not load the muscle map. Close and reopen this reference to retry.';
        return;
      }
      if (!body.isConnected || ready) return;
      ready = true;
      const groups = Object.keys(names).filter(id => shapes.front[id] || shapes.back[id])
        .sort((a,b) => names[a].localeCompare(names[b],'en-GB'));
      body.innerHTML = '<p>Choose a muscle group on the figures or from the list. Highlights are for anatomical reference.</p>' +
        '<label for="muscle-choice">Highlight a muscle group</label><select id="muscle-choice" class="form-control">' +
        '<option value="">All groups</option>' + groups.map(id => '<option value="' + id + '">' + names[id] + '</option>').join('') +
        '</select><div class="muscle-figures">' + figure('front',shapes.front) + figure('back',shapes.back) +
        '</div><p class="muscle-result" role="status"></p><small>Illustration adapted from MuscleMap by Melih Colpan. ' +
        '<a href="assets/anatomy/MuscleMap-LICENSE.txt">MIT licence</a></small>';
      const select = body.querySelector('select');
      const result = body.querySelector('.muscle-result');
      function selectGroup(id) {
        session.selected = groups.includes(id) ? id : '';
        select.value = session.selected;
        for (const region of body.querySelectorAll('[data-muscle]')) {
          region.classList.toggle('is-highlighted',Boolean(session.selected) && region.dataset.muscle === session.selected);
        }
        const shown = Object.keys(views).filter(view => shapes[view][session.selected]);
        result.textContent = session.selected ? names[session.selected] + ' highlighted on the ' + shown.join(' and ') + '.' : '';
      }
      select.addEventListener('change',() => selectGroup(select.value));
      body.querySelector('.muscle-figures').addEventListener('click',event => {
        const region = event.target.closest('[data-muscle]');
        if (region) selectGroup(session.selected === region.dataset.muscle ? '' : region.dataset.muscle);
      });
      selectGroup(session.selected);
    }
    details.addEventListener('toggle',() => {
      if (!details.isConnected) return;
      session.open = details.open;
      if (details.open) draw();
    });
    details.open = session.open;
  }

  root.MuscleReference = {mount};
})(globalThis);
