/* Mission Control: Careers with Em life dashboard.
   Plain JS, no build step. All data persists in localStorage in this browser.
   Timing and easing match the shared brand tokens in styles.css. */
(function(){
  'use strict';

  var KEY = 'cwem-dash-v1';
  var PLAN = window.CWEM_PLAN;
  var WEEK_TARGET = 4; /* workouts per week */

  /* ---------- dates (always local, never UTC) ---------- */
  function iso(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function fromISO(s){
    var p = s.split('-');
    return new Date(+p[0], +p[1]-1, +p[2]);
  }
  function todayISO(){ return iso(new Date()); }
  function addDays(d, n){ var c = new Date(d); c.setDate(c.getDate()+n); return c; }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function fmtShort(s){ var d = fromISO(s); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtLong(s){ var d = fromISO(s); return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }

  /* ---------- state ---------- */
  function blank(){
    return { checkins:{}, stepsDone:{}, whoop:{}, workouts:[], people:[] };
  }
  function load(){
    try{
      var raw = localStorage.getItem(KEY);
      if(!raw) return blank();
      var s = JSON.parse(raw);
      var b = blank();
      Object.keys(b).forEach(function(k){ if(s[k] === undefined) s[k] = b[k]; });
      return s;
    }catch(e){ return blank(); }
  }
  var state = load();
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
  function uid(){ return Math.random().toString(36).slice(2,10); }

  /* ---------- activity scoring: what fills a square ---------- */
  function dayScore(dateISO){
    var n = 0;
    if(state.checkins[dateISO]) n += 1;
    if(state.whoop[dateISO]) n += 1;
    Object.keys(state.stepsDone).forEach(function(L){ if(state.stepsDone[L] === dateISO) n += 1; });
    state.workouts.forEach(function(w){ if(w.date === dateISO) n += 1; });
    state.people.forEach(function(p){ if(p.added === dateISO) n += 1; });
    return n;
  }
  function dayBreakdown(dateISO){
    var parts = [];
    if(state.checkins[dateISO]) parts.push('showed up');
    var steps = Object.keys(state.stepsDone).filter(function(L){ return state.stepsDone[L] === dateISO; });
    if(steps.length) parts.push('step ' + steps.join(', '));
    var wo = state.workouts.filter(function(w){ return w.date === dateISO; }).length;
    if(wo) parts.push(wo + (wo === 1 ? ' workout' : ' workouts'));
    if(state.whoop[dateISO]) parts.push('Whoop logged');
    var pp = state.people.filter(function(p){ return p.added === dateISO; }).length;
    if(pp) parts.push(pp + (pp === 1 ? ' new connection' : ' new connections'));
    return parts;
  }
  function level(score){
    if(score <= 0) return 0;
    if(score === 1) return 1;
    if(score === 2) return 2;
    if(score <= 4) return 3;
    return 4;
  }
  function streak(){
    var t = todayISO();
    var d = dayScore(t) > 0 ? fromISO(t) : addDays(fromISO(t), -1);
    var n = 0;
    while(dayScore(iso(d)) > 0){ n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastAction = document.getElementById('toastAction');
  var toastTimer = null, toastCb = null;
  function toast(msg, actionLabel, cb){
    toastMsg.textContent = msg;
    if(actionLabel){
      toastAction.textContent = actionLabel;
      toastAction.hidden = false;
      toastCb = cb;
    } else {
      toastAction.hidden = true;
      toastCb = null;
    }
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 4200);
  }
  toastAction.addEventListener('click', function(){
    toastEl.classList.remove('show');
    if(toastCb) toastCb();
  });

  /* ---------- hero + check-in ---------- */
  var checkinBtn = document.getElementById('checkinBtn');
  function renderHero(){
    var t = todayISO();
    var done = !!state.checkins[t];
    var st = streak();
    document.getElementById('todayLine').textContent = fmtLong(t) + ', ' + fromISO(t).getFullYear() + ' · day ' + (st > 0 ? st : 'zero, so far') + ' of the streak';
    document.getElementById('streakNum').textContent = st;
    checkinBtn.textContent = done ? '✓ Showed up' : 'I showed up today';
    checkinBtn.classList.toggle('done-state', done);
    document.getElementById('checkinTitle').textContent = done ? 'Square planted' : "Plant today's square";
    document.getElementById('checkinSub').textContent = done
      ? 'Everything else you log today deepens the color.'
      : 'One click. Everything else you log today deepens the color.';
  }
  checkinBtn.addEventListener('click', function(){
    var t = todayISO();
    if(state.checkins[t]){ delete state.checkins[t]; }
    else {
      state.checkins[t] = 1;
      toast('Square planted. Streak: ' + streak() + (streak() === 1 ? ' day.' : ' days.'));
    }
    save(); renderAll();
  });

  /* ---------- stats row ---------- */
  function weekStartISO(){
    var d = new Date();
    var shift = (d.getDay() + 6) % 7; /* Monday start */
    return iso(addDays(d, -shift));
  }
  function workoutsThisWeek(){
    var start = weekStartISO();
    return state.workouts.filter(function(w){ return w.date >= start && w.date <= todayISO(); });
  }
  function followUpsDue(){
    var t = todayISO();
    return state.people.filter(function(p){ return p.follow && p.follow <= t; });
  }
  function renderStats(){
    var done = Object.keys(state.stepsDone).length;
    var total = PLAN.steps.length;
    var pct = Math.round(done / total * 100);
    document.getElementById('goalPct').textContent = pct + '%';
    document.getElementById('goalBar').style.width = pct + '%';
    var current = currentStep();
    document.getElementById('goalSub').textContent = done + ' of ' + total + ' steps complete' +
      (current ? ' · now on step ' + current.letter : ' · every step complete');

    var active = 0;
    var d = addDays(new Date(), -364);
    for(var i = 0; i < 365; i++){ if(dayScore(iso(d)) > 0) active++; d = addDays(d, 1); }
    document.getElementById('statActive').textContent = active;

    var ww = workoutsThisWeek().length;
    var wEl = document.getElementById('statWorkouts');
    wEl.innerHTML = ww + '<small> / ' + WEEK_TARGET + '</small>';
    document.getElementById('statWorkoutsSub').textContent = ww >= WEEK_TARGET ? 'weekly target hit' : (WEEK_TARGET - ww) + ' to go this week';

    var wt = state.whoop[todayISO()];
    document.getElementById('statRecovery').textContent = wt && wt.rec !== null && wt.rec !== undefined && wt.rec !== '' ? wt.rec + '%' : '–';
    document.getElementById('statRecoverySub').textContent = wt ? zoneName(wt.rec) + ' zone' : "log this morning's Whoop";

    document.getElementById('statPeople').textContent = state.people.length;
    var due = followUpsDue().length;
    document.getElementById('statPeopleSub').textContent = due > 0
      ? due + (due === 1 ? ' follow-up due' : ' follow-ups due')
      : 'no follow-ups due';
  }

  /* ---------- heatmap ---------- */
  var tip = document.getElementById('hmTip');
  function renderHeatmap(){
    var grid = document.getElementById('hmGrid');
    var monthsRow = document.getElementById('hmMonths');
    grid.innerHTML = '';
    monthsRow.innerHTML = '';

    var today = fromISO(todayISO());
    /* end column = this week (Sunday start), 53 columns back */
    var endWeekStart = addDays(today, -today.getDay());
    var start = addDays(endWeekStart, -52 * 7);
    var activeCount = 0, best = 0, colW = 15; /* 12px cell + 3px gap */
    var lastMonth = -1;

    for(var w = 0; w <= 52; w++){
      var col = document.createElement('div');
      col.className = 'hm-col';
      for(var day = 0; day < 7; day++){
        var d = addDays(start, w * 7 + day);
        var cell = document.createElement('div');
        cell.className = 'hm-cell';
        if(d > today){
          cell.className += ' future';
        } else {
          var dISO = iso(d);
          var sc = dayScore(dISO);
          var lv = level(sc);
          if(lv) cell.className += ' l' + lv;
          if(sc > 0){ activeCount++; if(sc > best) best = sc; }
          if(dISO === todayISO()) cell.className += ' today-cell';
          cell.setAttribute('data-date', dISO);
          var parts = dayBreakdown(dISO);
          cell.setAttribute('aria-label', fmtLong(dISO) + ': ' + (parts.length ? parts.join(', ') : 'no activity'));
        }
        col.appendChild(cell);
        if(day === 0 && d <= today && d.getMonth() !== lastMonth){
          lastMonth = d.getMonth();
          var m = document.createElement('span');
          m.textContent = MONTHS[lastMonth];
          m.style.left = (w * colW) + 'px';
          monthsRow.appendChild(m);
        }
      }
      grid.appendChild(col);
    }
    document.getElementById('heatCount').innerHTML = '<b>' + activeCount + '</b> active days in the last year';

    /* one delegated tooltip for all cells */
    grid.onmousemove = function(e){
      var c = e.target.closest('.hm-cell');
      if(!c || !c.getAttribute('data-date')){ tip.classList.remove('show'); return; }
      var dISO = c.getAttribute('data-date');
      var parts = dayBreakdown(dISO);
      tip.innerHTML = '<div class="tip-date">' + fmtLong(dISO) + '</div><div class="tip-what">' + (parts.length ? parts.join(' · ') : 'no activity') + '</div>';
      tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 240) + 'px';
      tip.style.top = (e.clientY - 8 - tip.offsetHeight) + 'px';
      tip.classList.add('show');
    };
    grid.onmouseleave = function(){ tip.classList.remove('show'); };

    /* scroll the strip to the present */
    var scroller = grid.closest('.heat-scroll');
    if(scroller) scroller.scrollLeft = scroller.scrollWidth;
  }

  /* ---------- A to Z engine ---------- */
  var selectedLetter = null;
  function stepByLetter(L){
    for(var i = 0; i < PLAN.steps.length; i++) if(PLAN.steps[i].letter === L) return PLAN.steps[i];
    return null;
  }
  function currentStep(){
    for(var i = 0; i < PLAN.steps.length; i++){
      if(!state.stepsDone[PLAN.steps[i].letter]) return PLAN.steps[i];
    }
    return null;
  }
  function phaseName(id){
    for(var i = 0; i < PLAN.phases.length; i++) if(PLAN.phases[i].id === id) return PLAN.phases[i].name;
    return '';
  }
  function completeStep(L, animate){
    state.stepsDone[L] = todayISO();
    save();
    if(animate){
      var next = currentStep();
      toast('Step ' + L + ' complete.' + (next ? ' Next up: ' + next.letter + ', ' + next.title + '.' : ' That was the last one.'), 'Undo', function(){
        delete state.stepsDone[L];
        save(); renderAll();
      });
    }
    renderAll(animate);
  }
  function renderNowCard(animate){
    var el = document.getElementById('nowCard');
    var step = currentStep();
    if(!step){
      el.className = 'now-card all-done';
      el.innerHTML =
        '<span class="mono-label">A TO Z · COMPLETE</span>' +
        '<h3>Every letter is filled.</h3>' +
        '<p class="detail">The plan that started with a brand kit ends with the business running from anywhere. Time to write the next alphabet.</p>';
      return;
    }
    var idx = PLAN.steps.indexOf(step);
    var next = PLAN.steps[idx + 1];
    el.className = 'now-card' + (animate ? ' step-swap' : '');
    el.innerHTML =
      '<span class="watermark">' + step.letter + '</span>' +
      '<span class="mono-label">NOW · STEP ' + step.letter + ' OF Z · ' + phaseName(step.phase).toUpperCase() + '</span>' +
      '<h3>' + step.title + '</h3>' +
      '<p class="detail">' + step.detail + '</p>' +
      '<p class="done-when"><b>Done when:</b> ' + step.doneWhen + '</p>' +
      '<div class="cta-line">' +
        '<button class="btn" id="completeBtn" type="button">Mark step ' + step.letter + ' complete</button>' +
        (next ? '<span class="next-peek">Then: ' + next.letter + ' · ' + next.title + '</span>' : '<span class="next-peek">This is the last letter.</span>') +
      '</div>';
    document.getElementById('completeBtn').addEventListener('click', function(){
      completeStep(step.letter, true);
    });
    if(animate){
      setTimeout(function(){ el.classList.remove('step-swap'); }, 500);
    }
  }
  function renderLetters(){
    var grid = document.getElementById('letterGrid');
    grid.innerHTML = '';
    var cur = currentStep();
    PLAN.steps.forEach(function(s){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'letter';
      b.textContent = s.letter;
      if(state.stepsDone[s.letter]) b.className += ' done';
      else if(cur && cur.letter === s.letter) b.className += ' current';
      if(selectedLetter === s.letter) b.className += ' selected';
      b.title = s.letter + ': ' + s.title;
      b.addEventListener('click', function(){
        selectedLetter = (selectedLetter === s.letter) ? null : s.letter;
        renderLetters();
      });
      grid.appendChild(b);
    });

    var pl = document.getElementById('phaseList');
    pl.innerHTML = '';
    PLAN.phases.forEach(function(ph){
      var letters = ph.letters.split('');
      var done = letters.filter(function(L){ return state.stepsDone[L]; }).length;
      var row = document.createElement('div');
      row.className = 'phase-row';
      row.innerHTML = '<span class="p-name">' + ph.name + '</span>' +
        '<span class="p-bar"><i style="width:' + Math.round(done / letters.length * 100) + '%"></i></span>' +
        '<span class="p-count">' + done + '/' + letters.length + '</span>';
      pl.appendChild(row);
    });

    var det = document.getElementById('letterDetail');
    var show = selectedLetter ? stepByLetter(selectedLetter) : null;
    if(!show){
      det.innerHTML = '<span class="ld-note">Tap any letter to preview or revisit a step.</span>';
      return;
    }
    var doneDate = state.stepsDone[show.letter];
    var curNow = currentStep();
    var html = '<span class="mono-label">STEP ' + show.letter + ' · ' + phaseName(show.phase).toUpperCase() + '</span>' +
      '<h4>' + show.title + '</h4><p>' + show.detail + '</p>';
    if(doneDate){
      html += '<p class="ld-note">Completed ' + fmtShort(doneDate) + ' · <button class="linklike" id="uncompleteBtn" type="button">mark incomplete</button></p>';
    } else if(curNow && curNow.letter === show.letter){
      html += '<p class="ld-note">This is the current step. It is waiting for you in the big card.</p>';
    } else {
      html += '<p class="ld-note">Queued. ' + (curNow ? 'Finish step ' + curNow.letter + ' first: one letter at a time is the whole trick.' : '') + '</p>';
    }
    det.innerHTML = html;
    var un = document.getElementById('uncompleteBtn');
    if(un) un.addEventListener('click', function(){
      delete state.stepsDone[show.letter];
      save(); renderAll();
    });
  }

  /* ---------- Whoop ---------- */
  function zoneName(rec){
    rec = +rec;
    if(!(rec >= 0)) return '';
    if(rec >= 67) return 'green';
    if(rec >= 34) return 'yellow';
    return 'red';
  }
  var ZONE_STROKE = { green:'#0e9f5d', yellow:'#dc8a06', red:'#b42318' };
  function ring(value, max, unit, name, stroke){
    var pct = Math.max(0, Math.min(1, (+value || 0) / max));
    var r = 26, c = 2 * Math.PI * r;
    return '<div class="ring-block"><svg width="68" height="68" viewBox="0 0 68 68" aria-label="' + name + ' ' + value + unit + '">' +
      '<circle cx="34" cy="34" r="' + r + '" fill="none" stroke="#e6e8eb" stroke-width="7"/>' +
      '<circle cx="34" cy="34" r="' + r + '" fill="none" stroke="' + stroke + '" stroke-width="7" stroke-linecap="round" ' +
        'stroke-dasharray="' + (c * pct) + ' ' + c + '" transform="rotate(-90 34 34)"/>' +
      '<text class="ring-num" x="34" y="37" text-anchor="middle">' + value + '</text>' +
      '<text class="ring-unit" x="34" y="48" text-anchor="middle">' + unit + '</text>' +
      '</svg><span class="ring-name">' + name + '</span></div>';
  }
  function sparkline(values, label, latest){
    if(values.length < 2) return '';
    var w = 120, h = 32, min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var pts = values.map(function(v, i){
      var x = i / (values.length - 1) * (w - 6) + 3;
      var y = h - 4 - (v - min) / span * (h - 8);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var last = pts[pts.length - 1].split(',');
    return '<div class="spark"><div class="spark-label"><span>' + label + '</span><b>' + latest + '</b></div>' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="' + label + ', last ' + values.length + ' days">' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#2c77e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" fill="#2c77e7"/></svg></div>';
  }
  function whoopHistory(field, days){
    var out = [];
    var d = addDays(new Date(), -(days - 1));
    for(var i = 0; i < days; i++){
      var e = state.whoop[iso(d)];
      if(e && e[field] !== '' && e[field] !== null && e[field] !== undefined) out.push(+e[field]);
      d = addDays(d, 1);
    }
    return out;
  }
  function whoopFormHTML(e){
    e = e || {};
    function v(x){ return (x === undefined || x === null) ? '' : x; }
    return '<form id="whoopForm">' +
      '<div class="whoop-empty" id="whoopHint">Straight from this morning’s app. No integrations, no excuses: five numbers, thirty seconds.</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="whRec">Recovery %</label><input id="whRec" type="number" min="0" max="100" placeholder="67" value="' + v(e.rec) + '" required></div>' +
      '<div class="field"><label for="whStrain">Strain</label><input id="whStrain" type="number" min="0" max="21" step="0.1" placeholder="12.4" value="' + v(e.strain) + '"></div>' +
      '<div class="field"><label for="whSleep">Sleep h</label><input id="whSleep" type="number" min="0" max="14" step="0.1" placeholder="7.5" value="' + v(e.sleep) + '"></div>' +
      '<div class="field"><label for="whHrv">HRV ms</label><input id="whHrv" type="number" min="0" max="250" placeholder="58" value="' + v(e.hrv) + '"></div>' +
      '<div class="field"><label for="whRhr">RHR bpm</label><input id="whRhr" type="number" min="20" max="120" placeholder="56" value="' + v(e.rhr) + '"></div>' +
      '</div><div class="form-foot"><button class="btn btn-sm" type="submit">Log today</button></div></form>';
  }
  function renderWhoop(){
    var body = document.getElementById('whoopBody');
    var t = todayISO();
    var e = state.whoop[t];
    if(!e){
      body.innerHTML = whoopFormHTML(null);
      wireWhoopForm();
      document.getElementById('whoopNote').textContent = 'manual log · 30 seconds';
      return;
    }
    var zone = zoneName(e.rec);
    var html = '<div class="rings">' +
      ring(e.rec, 100, '%', 'Recovery', ZONE_STROKE[zone] || '#2c77e7') +
      ring(e.strain === '' || e.strain === undefined ? 0 : e.strain, 21, '', 'Strain', '#2c77e7') +
      ring(e.sleep === '' || e.sleep === undefined ? 0 : e.sleep, 8, 'h', 'Sleep', '#2c77e7') +
      '</div>';
    if(zone) html = html.replace('</svg><span class="ring-name">Recovery</span>', '</svg><span class="ring-name">Recovery</span><br><span class="zone-tag zone-' + zone + '">' + zone + ' zone</span>');
    html += '<div class="mini-stats">' +
      '<div class="mini-stat"><span class="label">HRV</span><span class="value">' + (e.hrv || '–') + '<small style="font-size:10px;color:#667085"> ms</small></span></div>' +
      '<div class="mini-stat"><span class="label">Resting HR</span><span class="value">' + (e.rhr || '–') + '<small style="font-size:10px;color:#667085"> bpm</small></span></div>' +
      '</div>';
    var recH = whoopHistory('rec', 14), strH = whoopHistory('strain', 14);
    var sparks = '';
    if(recH.length >= 2) sparks += sparkline(recH, 'Recovery trend', e.rec + '%');
    if(strH.length >= 2) sparks += sparkline(strH, 'Strain trend', e.strain || '–');
    if(sparks) html += '<div class="spark-row">' + sparks + '</div>';
    else html += '<p class="empty-note">Trends appear after a couple of days of logging.</p>';
    body.innerHTML = html;
    document.getElementById('whoopNote').innerHTML = 'logged · <button class="linklike" id="whoopEdit" type="button">edit</button>';
    document.getElementById('whoopEdit').addEventListener('click', function(){
      body.innerHTML = whoopFormHTML(e);
      wireWhoopForm();
    });
  }
  function wireWhoopForm(){
    document.getElementById('whoopForm').addEventListener('submit', function(ev){
      ev.preventDefault();
      state.whoop[todayISO()] = {
        rec: document.getElementById('whRec').value,
        strain: document.getElementById('whStrain').value,
        sleep: document.getElementById('whSleep').value,
        hrv: document.getElementById('whHrv').value,
        rhr: document.getElementById('whRhr').value
      };
      save();
      toast('Whoop logged. The square gets deeper.');
      renderAll();
    });
  }

  /* ---------- workouts ---------- */
  function renderWorkouts(){
    var dots = document.getElementById('weekDots');
    dots.innerHTML = '';
    var week = workoutsThisWeek();
    for(var i = 0; i < WEEK_TARGET; i++){
      var d = document.createElement('span');
      d.className = 'wd' + (i < week.length ? ' hit' : '');
      d.textContent = i < week.length ? '✓' : (i + 1);
      dots.appendChild(d);
    }
    var extra = week.length - WEEK_TARGET;
    var note = document.createElement('span');
    note.className = 'wd-note';
    note.textContent = extra > 0 ? '+' + extra + ' beyond target' : (week.length >= WEEK_TARGET ? 'week won' : week.length + ' of ' + WEEK_TARGET + ' this week');
    dots.appendChild(note);
    document.getElementById('workoutWeekNote').textContent = 'target: ' + WEEK_TARGET + ' per week';

    var list = document.getElementById('workoutList');
    list.innerHTML = '';
    var recent = state.workouts.slice().sort(function(a, b){ return a.date < b.date ? 1 : -1; }).slice(0, 5);
    if(!recent.length){
      list.innerHTML = '<li class="empty-note" style="border:none">Nothing logged yet. The first one is the hardest to log, too.</li>';
      return;
    }
    recent.forEach(function(w){
      var li = document.createElement('li');
      li.innerHTML = '<span class="r-date">' + fmtShort(w.date) + '</span>' +
        '<span class="r-type">' + w.type + '</span>' +
        (w.mins ? '<span>' + w.mins + ' min</span>' : '') +
        (w.note ? '<span class="r-note">' + esc(w.note) + '</span>' : '') +
        '<button class="x" type="button" aria-label="Delete workout" data-id="' + w.id + '">✕</button>';
      li.querySelector('.x').addEventListener('click', function(){
        state.workouts = state.workouts.filter(function(x){ return x.id !== w.id; });
        save(); renderAll();
      });
      list.appendChild(li);
    });
  }
  document.getElementById('workoutForm').addEventListener('submit', function(ev){
    ev.preventDefault();
    var mins = document.getElementById('woMins').value;
    state.workouts.push({
      id: uid(),
      date: todayISO(),
      type: document.getElementById('woType').value,
      mins: mins ? +mins : null,
      note: document.getElementById('woNote').value.trim()
    });
    document.getElementById('woMins').value = '';
    document.getElementById('woNote').value = '';
    save();
    var n = workoutsThisWeek().length;
    toast('Workout logged. ' + (n >= WEEK_TARGET ? 'Week won.' : n + ' of ' + WEEK_TARGET + ' this week.'));
    renderAll();
  });

  /* ---------- connections ---------- */
  function esc(s){
    return String(s || '').replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  var editingId = null;
  var personForm = document.getElementById('personForm');
  var personSubmit = document.getElementById('personSubmit');
  var personCancel = document.getElementById('personCancel');
  function clearPersonForm(){
    ['pName','pMet','pRole','pFollow','pNotes'].forEach(function(id){ document.getElementById(id).value = ''; });
    editingId = null;
    personSubmit.textContent = 'Add person';
    personCancel.hidden = true;
  }
  personCancel.addEventListener('click', clearPersonForm);
  personForm.addEventListener('submit', function(ev){
    ev.preventDefault();
    var name = document.getElementById('pName').value.trim();
    if(!name) return;
    var data = {
      name: name,
      met: document.getElementById('pMet').value.trim(),
      role: document.getElementById('pRole').value.trim(),
      follow: document.getElementById('pFollow').value || null,
      notes: document.getElementById('pNotes').value.trim()
    };
    if(editingId){
      var p = state.people.find(function(x){ return x.id === editingId; });
      if(p) Object.assign(p, data);
      toast('Saved. ' + name + ' stays remembered.');
    } else {
      data.id = uid();
      data.added = todayISO();
      state.people.push(data);
      toast(name + ' added. Their details are safe here now.');
    }
    clearPersonForm();
    save(); renderAll();
  });
  document.getElementById('personSearch').addEventListener('input', renderPeople);
  function followChip(p){
    if(!p.follow) return '';
    var t = todayISO();
    if(p.follow < t) return '<span class="chip due">follow up overdue</span>';
    if(p.follow === t) return '<span class="chip today">follow up today</span>';
    return '<span class="chip">follow up ' + fmtShort(p.follow) + '</span>';
  }
  function renderPeople(){
    var grid = document.getElementById('peopleGrid');
    var q = document.getElementById('personSearch').value.trim().toLowerCase();
    grid.innerHTML = '';
    var t = todayISO();
    var list = state.people.slice().filter(function(p){
      if(!q) return true;
      return (p.name + ' ' + (p.met || '') + ' ' + (p.role || '') + ' ' + (p.notes || '')).toLowerCase().indexOf(q) !== -1;
    }).sort(function(a, b){
      var ad = a.follow && a.follow <= t ? 0 : 1;
      var bd = b.follow && b.follow <= t ? 0 : 1;
      if(ad !== bd) return ad - bd;
      return (b.added || '') < (a.added || '') ? -1 : 1;
    });
    if(!list.length){
      grid.innerHTML = '<p class="empty-note">' + (q ? 'No one matches that search.' : 'No one saved yet. Next person you meet, capture the detail you’d hate to forget.') + '</p>';
      return;
    }
    list.forEach(function(p){
      var card = document.createElement('div');
      card.className = 'person';
      card.innerHTML =
        '<h4>' + esc(p.name) + '</h4>' +
        '<span class="p-meta">' + esc([p.role, p.met].filter(Boolean).join(' · ')) + (p.added ? ' · met ' + fmtShort(p.added) : '') + '</span>' +
        (p.notes ? '<p class="p-notes">' + esc(p.notes) + '</p>' : '') +
        '<div class="p-foot">' + followChip(p) +
          '<div class="p-actions">' +
            '<button type="button" data-act="edit">edit</button>' +
            (p.follow && p.follow <= t ? '<button type="button" data-act="done">done</button>' : '') +
            '<button type="button" data-act="del">remove</button>' +
          '</div></div>';
      card.querySelector('[data-act="edit"]').addEventListener('click', function(){
        editingId = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pMet').value = p.met || '';
        document.getElementById('pRole').value = p.role || '';
        document.getElementById('pFollow').value = p.follow || '';
        document.getElementById('pNotes').value = p.notes || '';
        personSubmit.textContent = 'Save changes';
        personCancel.hidden = false;
        document.getElementById('pName').focus();
      });
      var doneBtn = card.querySelector('[data-act="done"]');
      if(doneBtn) doneBtn.addEventListener('click', function(){
        p.follow = null;
        save(); renderAll();
        toast('Follow-up with ' + p.name + ' closed out.');
      });
      card.querySelector('[data-act="del"]').addEventListener('click', function(){
        if(!confirm('Remove ' + p.name + ' and their details?')) return;
        state.people = state.people.filter(function(x){ return x.id !== p.id; });
        save(); renderAll();
      });
      grid.appendChild(card);
    });
  }

  /* ---------- backup ---------- */
  document.getElementById('exportBtn').addEventListener('click', function(){
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'careers-with-em-dashboard-' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importBtn').addEventListener('click', function(){
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function(ev){
    var f = ev.target.files[0];
    if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{
        var s = JSON.parse(r.result);
        if(typeof s !== 'object' || !s || Array.isArray(s)) throw new Error('bad');
        var b = blank();
        Object.keys(b).forEach(function(k){ if(s[k] === undefined) s[k] = b[k]; });
        state = s;
        save(); renderAll();
        toast('Backup restored.');
      }catch(e){ toast('That file did not look like a dashboard backup.'); }
      ev.target.value = '';
    };
    r.readAsText(f);
  });
  document.getElementById('resetBtn').addEventListener('click', function(){
    if(!confirm('Erase every square, step, log, and person from this browser? Export a backup first if in doubt.')) return;
    state = blank();
    save(); renderAll();
  });

  /* ---------- nav shadow (same behavior as site.js) ---------- */
  var nav = document.querySelector('nav');
  window.addEventListener('scroll', function(){
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ---------- render everything ---------- */
  function renderAll(animateStep){
    renderHero();
    renderStats();
    renderHeatmap();
    renderNowCard(animateStep);
    renderLetters();
    renderWhoop();
    renderWorkouts();
    renderPeople();
  }

  /* installable app: register the service worker (no-op where unsupported) */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }

  /* re-render when a new day starts while the tab stays open */
  var renderedDay = todayISO();
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden && todayISO() !== renderedDay){
      renderedDay = todayISO();
      renderAll();
    }
  });

  renderAll();
})();
