/* MindDock landing — small interactive demos
   - Energy battery (hero + capacity-bucket): filters task list to match user energy
   - Time-blindness multiplier slider: live B computation + adjusted minutes
   - Nav border on scroll
*/

(function () {
  // ── Nav scroll border ───────────────────────────────────────
  const nav = document.querySelector('.nav');
  function onScroll() {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Generic battery wiring ──────────────────────────────────
  function wireBattery(rootEl, onChange) {
    const buttons = rootEl.querySelectorAll('button[data-level]');
    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        const lvl = parseInt(b.dataset.level, 10);
        buttons.forEach((bb) => {
          const bl = parseInt(bb.dataset.level, 10);
          bb.dataset.active = bl <= lvl ? 'true' : 'false';
        });
        onChange(lvl);
      });
    });
  }

  // ── Capacity bucket demo ────────────────────────────────────
  // Simulates fillCapacityBucket() — tasks are filtered by energy match
  // and greedy-packed into the capacity budget.
  const CAPACITY = { 1: 45, 2: 75, 3: 105, 4: 150, 5: 210 };
  const ENERGY_LABEL = {
    1: 'Drained',
    2: 'Low',
    3: 'Steady',
    4: 'Decent',
    5: 'Sparked',
  };

  // Mock tasks — illustrative, mirror the shape used in TaskCard
  const MOCK_TASKS = [
    { id: 't1', title: 'Reply to landlord about the leak', energy: 1, est: 10, bucket: 'admin', adjEst: 15, badge: 'urgent', deadline: 'today' },
    { id: 't2', title: 'Drop laundry in the washer', energy: 1, est: 5, bucket: 'life', adjEst: 7, badge: 'easy' },
    { id: 't3', title: 'Schedule the dentist', energy: 1, est: 10, bucket: 'health', adjEst: 15, badge: 'scaffold' },
    { id: 't4', title: 'Pay credit-card bill', energy: 2, est: 15, bucket: 'admin', adjEst: 22, badge: null },
    { id: 't5', title: 'Tidy the kitchen counter', energy: 2, est: 20, bucket: 'life', adjEst: 30, badge: null },
    { id: 't6', title: 'Draft Q3 retrospective doc', energy: 3, est: 60, bucket: 'work', adjEst: 90, badge: null },
    { id: 't7', title: '30-min walk after lunch', energy: 2, est: 30, bucket: 'health', adjEst: 45, badge: null },
    { id: 't8', title: 'Review designer\'s pricing-page mock', energy: 3, est: 45, bucket: 'work', adjEst: 67, badge: 'urgent' },
    { id: 't9', title: 'Heads-down feature spec', energy: 3, est: 90, bucket: 'work', adjEst: 135, badge: null },
  ];

  function scoreTask(t) {
    // Simplified score — priority=2 default, urgency higher if "urgent"
    const urgency = t.badge === 'urgent' ? 6 : 0;
    return 2 * 1.5 + urgency;
  }

  function fillBucket(tasks, energy) {
    const budget = CAPACITY[energy];
    // Sort by score desc
    const sorted = [...tasks].sort((a, b) => scoreTask(b) - scoreTask(a));
    let remaining = budget;
    const ins = [];
    const out = [];
    for (const t of sorted) {
      // Energy match: skip if task needs more than user has
      if (t.energy > energy) { out.push(t); continue; }
      if (remaining >= t.adjEst || ins.length === 0) {
        ins.push(t);
        remaining -= t.adjEst;
      } else {
        out.push(t);
      }
    }
    return { ins, out, remaining: Math.max(0, remaining), budget };
  }

  function renderTaskRow(t, isOut) {
    const energyClass = `e${Math.min(3, t.energy)}`;
    const badge = t.badge
      ? `<span class="badge ${t.badge}">${t.badge}</span>`
      : '';
    return `
      <div class="task-row ${isOut ? 'out' : ''}" data-id="${t.id}">
        <div class="checkbox"></div>
        <div class="dot ${t.bucket}"></div>
        <div class="body">
          ${badge}
          <div class="title">${t.title}</div>
          <div class="meta">${t.est}m → <span class="adj">~${t.adjEst}m</span> · ${t.bucket}</div>
        </div>
        <div class="energy-pip ${energyClass}">
          ${'●'.repeat(t.energy)}
        </div>
      </div>
    `;
  }

  function renderCapacityDemo(energy) {
    const { ins, out, budget, remaining } = fillBucket(MOCK_TASKS, energy);
    const used = budget - remaining;
    const pct = Math.min(100, (used / budget) * 100);

    document.getElementById('cap-energy-lvl').textContent = energy;
    document.getElementById('cap-energy-label').textContent = ENERGY_LABEL[energy];
    document.getElementById('cap-budget').textContent = budget + 'm';
    document.getElementById('cap-used').textContent = used + 'm';
    document.getElementById('cap-count').textContent = ins.length + ' tasks';
    document.getElementById('cap-bar-inner').style.width = pct + '%';

    const list = document.getElementById('cap-task-list');
    if (ins.length === 0) {
      list.innerHTML = '<div class="empty">Nothing left. That\'s allowed. Rest counts.</div>';
    } else {
      list.innerHTML = ins.map((t) => renderTaskRow(t, false)).join('');
    }
    const outList = document.getElementById('cap-out-list');
    outList.innerHTML = out.length === 0
      ? '<div class="empty" style="opacity:0.7;">No tasks tucked away — you can see everything.</div>'
      : out.map((t) => renderTaskRow(t, true)).join('');
    document.getElementById('cap-out-count').textContent = out.length + (out.length === 1 ? ' task' : ' tasks');
  }

  // Wire capacity demo battery
  const capBattery = document.getElementById('cap-battery');
  if (capBattery) {
    wireBattery(capBattery, (lvl) => renderCapacityDemo(lvl));
    // Default state — energy 2 (Low)
    renderCapacityDemo(2);
  }

  // ── Hero battery (cosmetic only — no list filtering needed) ──
  const heroBattery = document.getElementById('hero-battery');
  if (heroBattery) {
    wireBattery(heroBattery, () => {/* purely visual */});
  }

  // ── Time-blindness multiplier slider ────────────────────────
  // B = 0.7 * B + 0.3 * (actual / estimated)
  function computeB(estimate, actual, startB = 1.5) {
    if (estimate <= 0) return startB;
    return startB * 0.7 + (actual / estimate) * 0.3;
  }

  const slider = document.getElementById('tb-slider');
  if (slider) {
    const estEl = document.getElementById('tb-est');
    const adjEl = document.getElementById('tb-adj');
    const bEl = document.getElementById('tb-b');
    const pctEl = document.getElementById('tb-pct');

    function update() {
      const est = parseInt(slider.value, 10);
      // Simulate the user's history: they usually take ~1.6× their estimate
      const actualScale = 1.6;
      const actual = Math.round(est * actualScale);
      const B = computeB(est, actual, 1.5);
      const adjusted = Math.round(est * B);
      estEl.textContent = est;
      adjEl.textContent = adjusted;
      bEl.textContent = B.toFixed(2) + '×';
      pctEl.textContent = '+' + Math.round((B - 1) * 100) + '%';
    }
    slider.addEventListener('input', update);
    update();
  }
})();
