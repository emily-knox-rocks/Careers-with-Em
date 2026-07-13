/* Knox Life Dashboard.
   Local-first: every byte of data stays in this browser's localStorage.
   Three laws: trend over streak, cycle-aware baselines, battery before character.
   All anchoring language comes from the mantra list verbatim, never generated. */
(function(){
  'use strict';

  var KEY = 'knox-dash-v1';

  /* ---------- fixed content ---------- */
  var MANTRAS = [
    "I don't drink to manage my nervous system. I have better tools than that. I'm not that person anymore.",
    "Movement is my new norm for resetting/meeting my dopamine cravings. Not: sleeping, alcohol, smoking, scrolling.",
    "Wine is cheap dopamine. I know what the real thing feels like. I'm not settling.",
    "My brain will always vote for comfortable. I'm not letting it run the election.",
    "Movement is how I naturally boost dopamine. My brain needs this, not a shortcut.",
    "I'm building something within myself right now. Show up like it.",
    "That's my brain keeping me 'safe.' Safe isn't the goal anymore.",
    "I don't let the hard stretch write my labels. I decide who I am in this chapter.",
    "My brain wants cheap. I want real. I know the difference."
  ];

  var FLOOR = [
    { k:'morning_light',      label:'Sunlight within 30 minutes of waking, before the phone' },
    { k:'protein_first',      label:'Water and protein before caffeine' },
    { k:'coffee_delayed',     label:'Coffee delayed about an hour after waking' },
    { k:'caffeine_cutoff',    label:'Caffeine cutoff by early afternoon' },
    { k:'consistent_meals',   label:'Meals at consistent times' },
    { k:'sigh_used',          label:'Physiological sigh on any spike: two nasal inhales, long exhale' },
    { k:'phone_free_bookends',label:'Phone out of reach, first and last 30 minutes' },
    { k:'wake_window',        label:'Consistent wake window, weekends included' },
    { k:'supplements',        label:'Evening supplements: calcium, magnesium glycinate, B complex, D3' }
  ];

  var BLOCKER_TYPES = {
    1:'Fawn response', 2:'Foreboding joy', 3:'Cheap dopamine pull', 4:'Mean narrator',
    5:'Closed thread proximity', 6:'Re-engagement loop', 7:'Cycle volatility',
    8:'Financial avoidance', 9:'External validation', 10:'Impossible bar'
  };
  var PROTOCOLS = {
    playlist_movement:'Playlist first, then movement',
    facts_vs_story:'Facts versus story on paper',
    battery_check:'Battery check',
    sigh:'Physiological sigh',
    win_registration:'Win registration',
    other:'Other'
  };
  var DOMAINS = ['career','learning','emotional','social','financial','creative','health'];
  var PHASES4 = ['menstrual','follicular','ovulatory','luteal'];
  var MOVE_TYPES = ['korrect','bachata','run club','yoga','walk','ride','hike','other'];
  var DEPLETION = ['fragile','behind','terrible friend','should be over this'];

  var MARKERS = [
    { id:'m1', label:'Two to three cycles fully tracked on the protocol, or sliding scale care booked. Either branch is the win.' },
    { id:'m2', label:'Money system running: four of four weekly checks is the norm.' },
    { id:'m3', label:'Conversion case document complete, with dated evidence per phase.' },
    { id:'m4', label:'Celebration ritual installed and used after at least three good news moments.' },
    { id:'m5', label:'Time to interrupt visibly down across the year.' },
    { id:'m6', label:'Weekly learning thread held most weeks: passive, active, applied.' },
    { id:'m7', label:'Author voice content roughly weekly, from perspective.' },
    { id:'m8', label:'Friendship reciprocity: initiating roughly as often as receiving.' },
    { id:'m9', label:'Standard training split plus the luteal swap, running as designed.' }
  ];

  /* per-template daily assignments, indexed by getDay() (0 = Sunday) */
  var STD = {
    move: [
      'Gentle, by choice.',
      'Korrect, evening session.',
      'Korrect.',
      'Korrect light in the morning, optional. Bachata tonight: the joy pillar, non-negotiable.',
      'Korrect.',
      'Run club.',
      'Long outdoor movement by choice: ride, hike, whatever sounds good.'
    ],
    focus: [
      'Plan next week.',
      'Architecture: the hardest problem gets the first three hours.',
      'People and stakeholder day.',
      'Mixed work day.',
      'Execution and cleanup.',
      'Close the week on paper.',
      'Off.'
    ],
    anchors: [
      ['Sondery reset: playlist first, shower, cozy clothes, lighting, tidying, skincare, reading','Cycle check','Groceries and prep','Early night'],
      ['Win log entry before sign-off','Passive learning: podcast or audiobook on the commute or while cooking','Sleep is sacred tonight'],
      ['One friendship bid: two lines, specific, no agenda'],
      ['Active learning: one 45 minute phone-free deep block'],
      ['Applied learning: ship one AI-assisted improvement','Content post or draft'],
      ['Money check: twenty minutes','Wins log final pass'],
      ['Social: present, not performing']
    ],
    suggest: ['walk','korrect','korrect','bachata','korrect','run club','ride']
  };
  var LUTEAL_MOVE = 'Yoga or a walk. Twenty gentle minutes counts, in full.';
  var LUTEAL_EXTRA = 'Sauna in the evening helps sleep depth this week. Cold stays brief, mornings only, ended while breath is still controlled. Heat at night, cold in the morning, never the reverse.';
  var LUTEAL_FOCUS = 'Execution over architecture. The calendar lightens without apology.';
  var MENS_MOVE = 'Gentle movement only. Recovery is the assignment, and it counts in full.';
  var MENS_FOCUS = 'Recovery and planning register. This week is fully credited.';

  /* ---------- dates ---------- */
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function fromISO(s){ var p = s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function todayISO(){ return iso(new Date()); }
  function addDays(d, n){ var c = new Date(d); c.setDate(c.getDate()+n); return c; }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function fmtShort(s){ var d = fromISO(s); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtLong(s){ var d = fromISO(s); return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function weekKey(s){ var d = fromISO(s); var shift = (d.getDay()+6)%7; return iso(addDays(d, -shift)); }
  function daysAgoISO(n){ return iso(addDays(new Date(), -n)); }

  /* ---------- state ---------- */
  function blank(){
    return {
      daily:{}, wins:[], blockers:[], learning:{}, money:[], bids:[],
      phases: Array.from({length:8}, function(_,i){ return { n:i+1, name:'Phase ' + (i+1), status:'not_started', date:null }; }),
      posts:[], reviews:{}, markers:{}, escalation:{ booked:null, dismissedAt:null }
    };
  }
  function load(){
    try{
      var raw = localStorage.getItem(KEY);
      if(!raw) return blank();
      var s = JSON.parse(raw), b = blank();
      Object.keys(b).forEach(function(k){ if(s[k] === undefined) s[k] = b[k]; });
      return s;
    }catch(e){ return blank(); }
  }
  var state = load();
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
  function uid(){ return Math.random().toString(36).slice(2,10); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  var selDate = todayISO();
  function daily(dateISO){
    if(!state.daily[dateISO]) state.daily[dateISO] = { phase:null, floor:{}, movement:[], sleep:null, symptom:null, sunday_reset:false, notes:'' };
    var d = state.daily[dateISO];
    if(!d.floor) d.floor = {};
    if(!d.movement) d.movement = [];
    return d;
  }
  function dailyRaw(dateISO){ return state.daily[dateISO] || null; }

  /* phase carries forward from the latest logged day at or before the date */
  function phaseOf(dateISO){
    var d = dailyRaw(dateISO);
    if(d && d.phase) return d.phase;
    var dates = Object.keys(state.daily).filter(function(k){ return k <= dateISO && state.daily[k].phase; }).sort();
    return dates.length ? state.daily[dates[dates.length-1]].phase : null;
  }
  function templateOf(dateISO){
    var p = phaseOf(dateISO);
    if(p === 'luteal') return 'luteal';
    if(p === 'menstrual') return 'menstrual';
    if(!p) return null;
    return 'standard';
  }

  function fmtTti(mins){
    mins = +mins;
    if(mins === 0) return 'mid-sentence';
    if(mins < 60) return mins + 'm';
    if(mins < 1440) return (Math.round(mins/6)/10) + 'h';
    return (Math.round(mins/144)/10) + 'd';
  }
  function median(arr){
    if(!arr.length) return null;
    var a = arr.slice().sort(function(x,y){ return x-y; });
    var m = Math.floor(a.length/2);
    return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
  }

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastAction = document.getElementById('toastAction');
  var toastTimer = null, toastCb = null;
  function toast(msg, variant, actionLabel, cb){
    toastEl.className = 'toast' + (variant ? ' ' + variant : '');
    toastMsg.textContent = msg;
    if(actionLabel){ toastAction.textContent = actionLabel; toastAction.hidden = false; toastCb = cb; }
    else { toastAction.hidden = true; toastCb = null; }
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 4600);
  }
  toastAction.addEventListener('click', function(){ toastEl.classList.remove('show'); if(toastCb) toastCb(); });

  /* ---------- modal ---------- */
  var veil = null;
  function openModal(html){
    closeModal();
    veil = document.createElement('div');
    veil.className = 'modal-veil';
    veil.innerHTML = '<div class="modal">' + html + '</div>';
    veil.addEventListener('mousedown', function(e){ if(e.target === veil) closeModal(); });
    document.body.appendChild(veil);
    return veil.querySelector('.modal');
  }
  function closeModal(){ if(veil){ veil.remove(); veil = null; } }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

  /* ---------- win flow, with the one-minute hold ---------- */
  function openWinModal(prefill){
    prefill = prefill || {};
    var m = openModal(
      '<h3>Log a win</h3>' +
      '<div class="field"><label for="wDomain">Domain</label><select id="wDomain">' +
        DOMAINS.map(function(d){ return '<option value="'+d+'"'+(prefill.domain===d?' selected':'')+'>'+d+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label for="wDesc">What went well, dated and specific</label><textarea id="wDesc" maxlength="400">'+esc(prefill.desc||'')+'</textarea></div>' +
      '<div class="field"><label>Registered internally before sharing it?</label><div class="radio-row">' +
        '<button class="toggle-chip on" type="button" id="wRegYes">own first clap</button>' +
        '<button class="toggle-chip" type="button" id="wRegNo">not yet</button></div></div>' +
      '<div class="field"><label class="floor-item" style="text-transform:none;letter-spacing:0"><input type="checkbox" id="wCase"'+(prefill.ccase?' checked':'')+'> Conversion case evidence</label></div>' +
      '<div class="modal-foot"><button class="btn" id="wSave" type="button">Register the win</button>' +
      '<button class="linklike" id="wCancel" type="button">Cancel</button></div>'
    );
    var registered = true;
    m.querySelector('#wRegYes').addEventListener('click', function(){ registered = true; this.classList.add('on'); m.querySelector('#wRegNo').classList.remove('on'); });
    m.querySelector('#wRegNo').addEventListener('click', function(){ registered = false; this.classList.add('on'); m.querySelector('#wRegYes').classList.remove('on'); });
    m.querySelector('#wCancel').addEventListener('click', closeModal);
    m.querySelector('#wSave').addEventListener('click', function(){
      var desc = m.querySelector('#wDesc').value.trim();
      if(!desc){ m.querySelector('#wDesc').focus(); return; }
      var win = { id:uid(), date:selDate, domain:m.querySelector('#wDomain').value, desc:desc, registered:registered, held:false, ccase:m.querySelector('#wCase').checked };
      state.wins.push(win);
      save();
      holdScreen(win);
    });
  }
  function holdScreen(win){
    var m = openModal(
      '<div class="hold-wrap">' +
        '<p class="hold-line">That went well. I did that.</p>' +
        '<p class="hold-sub">One full minute before moving on. Professional, personal, and emotional wins all get this.</p>' +
        '<svg class="hold-ring" width="120" height="120" viewBox="0 0 120 120">' +
          '<circle cx="60" cy="60" r="52" fill="none" stroke="#F0E8DF" stroke-width="8"/>' +
          '<circle id="holdArc" cx="60" cy="60" r="52" fill="none" stroke="#C9A96E" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 327" transform="rotate(-90 60 60)"/>' +
          '<text id="holdNum" class="hold-num" x="60" y="69" text-anchor="middle">60</text>' +
        '</svg>' +
        '<div class="modal-foot" style="justify-content:center">' +
          '<button class="btn btn-gold" id="holdDone" type="button">Held it</button>' +
          '<button class="linklike" id="holdSkip" type="button">Skip for now</button>' +
        '</div>' +
      '</div>'
    );
    var C = 2 * Math.PI * 52, t = 60;
    var arc = m.querySelector('#holdArc'), num = m.querySelector('#holdNum');
    var timer = setInterval(function(){
      t--;
      num.textContent = t;
      arc.setAttribute('stroke-dasharray', (C * (60 - t) / 60) + ' ' + C);
      if(t <= 0){ clearInterval(timer); finish(true); }
    }, 1000);
    function finish(held){
      clearInterval(timer);
      win.held = held;
      save(); closeModal(); renderAll();
      toast(held ? 'Win registered and held. It counts.' : 'Win registered.', 'gold');
    }
    m.querySelector('#holdDone').addEventListener('click', function(){ finish(true); });
    m.querySelector('#holdSkip').addEventListener('click', function(){ finish(false); });
  }

  /* ---------- blocker flow ---------- */
  function openBlockerModal(){
    var m = openModal(
      '<h3>Log a blocker event</h3>' +
      '<p class="sub" style="margin-bottom:12px">Events are expected. Catching one is the skill being trained.</p>' +
      '<div class="field"><label for="bType">Which one showed up</label><select id="bType">' +
        Object.keys(BLOCKER_TYPES).map(function(k){ return '<option value="'+k+'">'+BLOCKER_TYPES[k]+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label for="bTti">Time to interrupt, in minutes</label>' +
        '<input id="bTti" type="number" min="0" max="20160" placeholder="15">' +
        '<span class="sub" style="display:block;margin-top:4px">Zero counts: that is catching it mid-sentence.</span></div>' +
      '<div class="field"><label for="bProto">Protocol used</label><select id="bProto">' +
        Object.keys(PROTOCOLS).map(function(k){ return '<option value="'+k+'">'+PROTOCOLS[k]+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label class="floor-item" style="text-transform:none;letter-spacing:0"><input type="checkbox" id="bCaught" checked> Caught and acted on</label></div>' +
      '<div class="field"><label for="bNotes">Context, optional</label><textarea id="bNotes" maxlength="400"></textarea></div>' +
      '<div class="modal-foot"><button class="btn" id="bSave" type="button">Log it</button>' +
      '<button class="linklike" id="bCancel" type="button">Cancel</button></div>'
    );
    m.querySelector('#bCancel').addEventListener('click', closeModal);
    m.querySelector('#bSave').addEventListener('click', function(){
      var tti = m.querySelector('#bTti').value;
      if(tti === ''){ m.querySelector('#bTti').focus(); return; }
      var notes = m.querySelector('#bNotes').value.trim();
      state.blockers.push({
        id:uid(), date:selDate, type:+m.querySelector('#bType').value, tti:+tti,
        protocol:m.querySelector('#bProto').value, caught:m.querySelector('#bCaught').checked, notes:notes
      });
      save();
      if(hasDepletion(notes)){ batteryModal(); }
      else { closeModal(); toast('Caught and logged. The gap is the metric, and it is on the record.', 'sage'); }
      renderAll();
    });
  }
  function hasDepletion(text){
    var t = (text || '').toLowerCase();
    return DEPLETION.some(function(p){ return t.indexOf(p) !== -1; });
  }
  function batteryModal(){
    var m = openModal(
      '<h3>Battery check first</h3>' +
      '<p style="font-size:14px;margin-bottom:12px">That note reads like depletion, and depletion routes to logistics, never to character review.</p>' +
      '<ul class="anchors" style="margin-bottom:6px">' +
        '<li>Sleep last night?</li><li>Last real meal?</li><li>Cycle phase right now?</li><li>Load this week?</li>' +
      '</ul>' +
      '<p style="font-size:13.5px;color:#8C6E5D">Whatever the lowest one is, that is the next move. The narrator is an indicator light, not a truth source.</p>' +
      '<div class="modal-foot"><button class="btn" id="battOk" type="button">Understood, logged</button></div>'
    );
    m.querySelector('#battOk').addEventListener('click', function(){ closeModal(); toast('Logged. Logistics, not character.', 'sage'); });
  }

  /* ---------- bid flow ---------- */
  function logBid(circle, btype, initiated){
    state.bids.push({ id:uid(), date:selDate, circle:circle, btype:btype, initiated:initiated });
    save(); renderAll();
    var wk = state.bids.filter(function(b){ return weekKey(b.date) === weekKey(todayISO()) && b.initiated; }).length;
    toast(initiated ? ('Bid logged. ' + wk + ' initiated this week.') : 'Logged.', 'sage');
  }
  function openBidModal(){
    var m = openModal(
      '<h3>Log a friendship bid</h3>' +
      '<p class="sub" style="margin-bottom:12px">Two lines, specific and warm, no agenda.</p>' +
      '<div class="field"><label for="mBidCircle">Circle</label><select id="mBidCircle"><option value="inner">Inner</option><option value="extended">Extended</option><option value="new">New</option></select></div>' +
      '<div class="field"><label for="mBidType">Type</label><select id="mBidType"><option value="text">Text</option><option value="plan">Plan</option><option value="repair">Repair</option><option value="gratitude">Gratitude</option></select></div>' +
      '<div class="field"><label>Direction</label><div class="radio-row">' +
        '<button class="toggle-chip on" type="button" id="mBidI">I initiated</button>' +
        '<button class="toggle-chip" type="button" id="mBidR">I received</button></div></div>' +
      '<div class="modal-foot"><button class="btn" id="mBidSave" type="button">Log bid</button>' +
      '<button class="linklike" id="mBidCancel" type="button">Cancel</button></div>'
    );
    var init = true;
    m.querySelector('#mBidI').addEventListener('click', function(){ init = true; this.classList.add('on'); m.querySelector('#mBidR').classList.remove('on'); });
    m.querySelector('#mBidR').addEventListener('click', function(){ init = false; this.classList.add('on'); m.querySelector('#mBidI').classList.remove('on'); });
    m.querySelector('#mBidCancel').addEventListener('click', closeModal);
    m.querySelector('#mBidSave').addEventListener('click', function(){
      closeModal();
      logBid(m.querySelector('#mBidCircle').value, m.querySelector('#mBidType').value, init);
    });
  }

  /* ---------- header ---------- */
  function renderHeader(){
    var t = todayISO();
    document.getElementById('dateLine').textContent = fmtLong(t);
    var d = fromISO(t);
    var dayOfYear = Math.floor((d - new Date(d.getFullYear(),0,1)) / 86400000);
    document.getElementById('mantraLine').textContent = MANTRAS[dayOfYear % MANTRAS.length];

    var tpl = templateOf(t);
    var b = document.getElementById('templateBanner');
    if(tpl === 'luteal'){
      b.className = 'template-banner luteal';
      b.innerHTML = '<b>Luteal template active.</b><span class="t-note">Softer week on purpose. Twenty gentle minutes counts in full. Graded only against this template.</span>';
    } else if(tpl === 'menstrual'){
      b.className = 'template-banner menstrual';
      b.innerHTML = '<b>Menstrual week.</b><span class="t-note">Recovery and planning register. A valid, fully credited week type.</span>';
    } else if(tpl === 'standard'){
      b.className = 'template-banner';
      b.innerHTML = '<b>Standard template active.</b><span class="t-note">Full split available: Korrect Monday to Thursday, bachata Wednesday, run club Friday.</span>';
    } else {
      b.className = 'template-banner';
      b.innerHTML = '<b>No phase logged yet.</b><span class="t-note">Tap a phase on the Today card and the board grades itself against the right template.</span>';
    }
  }

  /* ---------- achievements ---------- */
  function winsInWindow(days, endOffset){
    var from = daysAgoISO(days + (endOffset||0) - 1), to = daysAgoISO(endOffset||0);
    return state.wins.filter(function(w){ return w.date >= from && w.date <= to; });
  }
  function blockersInWindow(days, endOffset){
    var from = daysAgoISO(days + (endOffset||0) - 1), to = daysAgoISO(endOffset||0);
    return state.blockers.filter(function(b){ return b.date >= from && b.date <= to; });
  }
  function dayHasData(dateISO){
    var d = dailyRaw(dateISO);
    var dl = d && (d.phase || d.sleep || d.symptom != null || (d.notes||'').length || d.movement.length || Object.keys(d.floor).some(function(k){ return d.floor[k]; }) || d.sunday_reset);
    if(dl) return true;
    return ['wins','blockers','bids','money','posts'].some(function(coll){
      return state[coll].some(function(x){ return x.date === dateISO; });
    });
  }
  function renderAchievements(){
    var wins28 = winsInWindow(28).length;
    var ttiAll = state.blockers.map(function(b){ return b.tti; });
    var pr = ttiAll.length ? Math.min.apply(null, ttiAll) : null;
    var med28 = median(blockersInWindow(28).map(function(b){ return b.tti; }));
    var medPrev = median(blockersInWindow(28, 28).map(function(b){ return b.tti; }));
    var phasesDone = state.phases.filter(function(p){ return p.status === 'complete'; }).length;
    var evidence = state.wins.filter(function(w){ return w.ccase; }).length;
    var markersDone = Object.keys(state.markers).length;

    var trendSub = 'first window still building';
    if(med28 != null && medPrev != null){
      trendSub = med28 <= medPrev ? 'down from ' + fmtTti(medPrev) + ' the window before' : 'prior window was ' + fmtTti(medPrev) + ', trend is the long game';
    } else if(med28 != null){ trendSub = 'across ' + blockersInWindow(28).length + ' logged events'; }

    document.getElementById('achStrip').innerHTML =
      tile('terra','Wins · 28 days', wins28, wins28 === 1 ? 'registered win' : 'registered wins') +
      tile('gold','Interrupt record', pr == null ? '·' : fmtTti(pr), pr == null ? 'first event sets it' : 'personal record') +
      tile('sage','Interrupt median · 28d', med28 == null ? '·' : fmtTti(med28), trendSub) +
      tile('gold','Migration', phasesDone + '<small> / 8</small>', 'phases complete') +
      tile('slate','Evidence entries', evidence, 'in the conversion case') +
      tile('gold','2026 markers', markersDone + '<small> / 9</small>', 'best-case checklist');

    function tile(cls, label, value, sub){
      return '<div class="ach ' + cls + '"><span class="a-label">' + label + '</span><span class="a-value">' + value + '</span><span class="a-sub">' + sub + '</span></div>';
    }

    var nm = document.getElementById('nextMilestone');
    var nextPhase = state.phases.find(function(p){ return p.status !== 'complete'; });
    var nextMarker = MARKERS.find(function(mk){ return !state.markers[mk.id]; });
    if(nextPhase){
      nm.innerHTML = '<span class="diamond">&#9670;</span> Nearest gold: migration phase ' + nextPhase.n + ', ' + esc(nextPhase.name) + '.';
    } else if(nextMarker){
      nm.innerHTML = '<span class="diamond">&#9670;</span> Nearest gold: ' + esc(nextMarker.label);
    } else {
      nm.innerHTML = '<span class="diamond">&#9670;</span> Every marker on the board is gold. Time to write the next list.';
    }

    var daysWithData = 0;
    for(var i = 0; i < 112; i++){ if(dayHasData(daysAgoISO(i))) daysWithData++; }
    var bachata = 0, allDaily = Object.keys(state.daily);
    allDaily.forEach(function(k){ state.daily[k].movement.forEach(function(mv){ if(mv.type === 'bachata') bachata++; }); });
    document.getElementById('allTime').innerHTML =
      '<span><b>' + state.wins.length + '</b> wins all time</span>' +
      '<span><b>' + state.blockers.filter(function(b){ return b.caught; }).length + '</b> interrupts caught</span>' +
      '<span><b>' + daysWithData + '</b> days with data, last 16 weeks</span>' +
      '<span><b>' + bachata + '</b> bachata nights</span>' +
      '<span><b>' + state.posts.length + '</b> posts and drafts</span>';
  }

  /* ---------- today ---------- */
  var mvSauna = false, mvCold = false;
  function renderToday(){
    var t = todayISO();
    var dateInput = document.getElementById('logDate');
    dateInput.value = selDate;
    dateInput.max = t;
    document.getElementById('todayTitle').textContent = selDate === t ? 'Today' : fmtShort(selDate) + ' · backfill';

    var d = daily(selDate);
    var tpl = templateOf(selDate) || 'standard';
    var dow = fromISO(selDate).getDay();

    /* phase chips */
    document.getElementById('phaseRow').innerHTML = PHASES4.map(function(p){
      return '<button type="button" class="phase-chip' + (d.phase === p ? ' on' : '') + '" data-phase="' + p + '">' + p + '</button>';
    }).join('');
    document.querySelectorAll('#phaseRow .phase-chip').forEach(function(btn){
      btn.addEventListener('click', function(){
        d.phase = d.phase === btn.getAttribute('data-phase') ? null : btn.getAttribute('data-phase');
        save(); renderAll();
      });
    });

    /* floor list */
    var floorHTML = FLOOR.map(function(f){
      return '<label class="floor-item"><input type="checkbox" data-floor="' + f.k + '"' + (d.floor[f.k] ? ' checked' : '') + '> <span>' + f.label + '</span></label>';
    }).join('');
    var moved = d.movement.length > 0;
    floorHTML += '<div class="floor-item auto"><input type="checkbox" disabled' + (moved ? ' checked' : '') + '> <span>Some form of movement, per the active template <span class="autotag">auto, from the log</span></span></div>';
    document.getElementById('floorList').innerHTML = floorHTML;
    document.querySelectorAll('#floorList input[data-floor]').forEach(function(cb){
      cb.addEventListener('change', function(){
        d.floor[cb.getAttribute('data-floor')] = cb.checked;
        save(); renderTodaySoft();
      });
    });
    renderFloorCount(d, moved);

    /* symptoms */
    var sym = '<span class="sym-label">Symptoms</span>';
    for(var i = 1; i <= 5; i++){
      sym += '<button type="button" class="sym-chip' + (d.symptom === i ? ' on' : '') + '" data-sym="' + i + '">' + i + '</button>';
    }
    document.getElementById('symRow').innerHTML = sym;
    document.querySelectorAll('#symRow .sym-chip').forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = +btn.getAttribute('data-sym');
        d.symptom = d.symptom === v ? null : v;
        save(); renderAll();
      });
    });

    /* sleep + notes */
    var sleep = document.getElementById('sleepHours');
    sleep.value = d.sleep == null ? '' : d.sleep;
    sleep.onchange = function(){ d.sleep = sleep.value === '' ? null : +sleep.value; save(); renderShowup(); };
    var notes = document.getElementById('dayNotes');
    notes.value = d.notes || '';
    notes.onchange = function(){
      d.notes = notes.value.trim(); save();
      renderBattery(d); renderShowup();
    };
    renderBattery(d);

    /* assignment card */
    var assignSub = { standard:'Standard template. The split is the plan.', luteal:'Luteal template. Gentle is the assignment, not the fallback.', menstrual:'Menstrual week. Recovery register.' }[tpl];
    document.getElementById('assignSub').textContent = assignSub;
    var ma = document.getElementById('moveAssign');
    if(tpl === 'luteal'){ ma.innerHTML = '<b>Movement:</b> ' + LUTEAL_MOVE + '<span class="a-extra">' + LUTEAL_EXTRA + '</span>'; }
    else if(tpl === 'menstrual'){ ma.innerHTML = '<b>Movement:</b> ' + MENS_MOVE; }
    else { ma.innerHTML = '<b>Movement:</b> ' + STD.move[dow]; }

    var mvType = document.getElementById('mvType');
    mvType.innerHTML = MOVE_TYPES.map(function(mt){ return '<option value="' + mt + '">' + mt + '</option>'; }).join('');
    mvType.value = (tpl === 'standard') ? STD.suggest[dow] : 'yoga';

    var list = document.getElementById('movedList');
    list.innerHTML = '';
    d.movement.forEach(function(mv, idx){
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(mv.type) + '</span>' + (mv.minutes ? '<span>' + mv.minutes + ' min</span>' : '') +
        (mv.sauna ? '<span class="autotag" style="color:#C4896F;font-size:10.5px;font-weight:600">SAUNA</span>' : '') +
        (mv.cold ? '<span class="autotag" style="color:#3A5470;font-size:10.5px;font-weight:600">COLD</span>' : '') +
        '<button class="x" type="button" aria-label="Remove">&#10005;</button>';
      li.querySelector('.x').addEventListener('click', function(){ d.movement.splice(idx, 1); save(); renderAll(); });
      list.appendChild(li);
    });

    var wf = document.getElementById('workFocus');
    if(tpl === 'luteal'){ wf.innerHTML = '<b>Work:</b> ' + LUTEAL_FOCUS; }
    else if(tpl === 'menstrual'){ wf.innerHTML = '<b>Work:</b> ' + MENS_FOCUS; }
    else { wf.innerHTML = '<b>Work:</b> ' + STD.focus[dow]; }

    var anchors = (tpl === 'standard') ? STD.anchors[dow].slice() : [];
    if(tpl !== 'standard' && dow === 5) anchors.push('Money check: twenty minutes, still on');
    if(dow === 0 && tpl !== 'standard') anchors.push('Sondery reset, the gentle version');
    var al = document.getElementById('anchorList');
    al.innerHTML = anchors.map(function(a){ return '<li>' + a + '</li>'; }).join('');
    if(dow === 0){
      var li = document.createElement('li');
      li.style.listStyle = 'none';
      li.innerHTML = '<label class="floor-item" style="padding:2px 0"><input type="checkbox" id="sondery"' + (d.sunday_reset ? ' checked' : '') + '> <span>Sondery reset sequence completed</span></label>';
      al.appendChild(li);
      document.getElementById('sondery').addEventListener('change', function(){
        d.sunday_reset = this.checked; save(); renderShowup();
        if(this.checked) toast('The Sondery is reset. The week has a floor under it.', 'sage');
      });
    }
  }
  function renderFloorCount(d, moved){
    var n = FLOOR.filter(function(f){ return d.floor[f.k]; }).length + (moved ? 1 : 0);
    var el = document.getElementById('floorDone');
    el.textContent = n + ' of 10 floor habits on ' + (selDate === todayISO() ? 'today' : fmtShort(selDate)) + (n === 10 ? '. The floor held.' : '.');
  }
  function renderTodaySoft(){
    var d = daily(selDate);
    renderFloorCount(d, d.movement.length > 0);
    renderShowup();
  }
  function renderBattery(d){
    var slot = document.getElementById('batterySlot');
    if(hasDepletion(d.notes)){
      slot.innerHTML = '<div class="battery-card"><b>Battery check before anything else.</b> Sleep last night? Last real meal? Phase? Load? That note reads like depletion, and depletion routes to logistics, never to character review.</div>';
    } else {
      slot.innerHTML = '';
    }
  }

  /* ---------- milestones ---------- */
  function renderMilestones(){
    var done = state.phases.filter(function(p){ return p.status === 'complete'; }).length;
    document.getElementById('phaseBar').style.width = (done / 8 * 100) + '%';
    document.getElementById('phaseCount').textContent = done + ' of 8 phases complete.';

    var track = document.getElementById('phaseTrack');
    track.innerHTML = '';
    state.phases.forEach(function(p){
      var li = document.createElement('li');
      if(p.status === 'complete') li.className = 'complete';
      li.innerHTML =
        '<span class="ph-num">0' + p.n + '</span>' +
        (p.status === 'complete' ? '<span class="diamond">&#9670;</span>' : '') +
        '<span class="ph-name">' + esc(p.name) + ' <button class="linklike" data-act="rename" style="font-size:11px">rename</button></span>' +
        (p.date ? '<span class="ph-date">' + fmtShort(p.date) + '</span>' : '') +
        '<button type="button" class="ph-status ' + (p.status === 'in_progress' ? 'inprog' : p.status === 'complete' ? 'complete' : '') + '">' +
          (p.status === 'not_started' ? 'not started' : p.status === 'in_progress' ? 'in progress' : 'complete') + '</button>';
      li.querySelector('[data-act="rename"]').addEventListener('click', function(){
        var name = prompt('Name this phase', p.name);
        if(name && name.trim()){ p.name = name.trim(); save(); renderAll(); }
      });
      li.querySelector('.ph-status').addEventListener('click', function(){
        if(p.status === 'not_started'){ p.status = 'in_progress'; p.date = null; }
        else if(p.status === 'in_progress'){
          p.status = 'complete'; p.date = todayISO();
          save(); renderAll();
          toast('Phase ' + p.n + ' complete. That is a milestone, and it goes in the case.', 'gold', 'Log the win', function(){
            openWinModal({ domain:'career', desc:'Migration phase ' + p.n + ' complete: ' + p.name, ccase:true });
          });
          return;
        }
        else { p.status = 'not_started'; p.date = null; }
        save(); renderAll();
      });
      track.appendChild(li);
    });

    var evidence = state.wins.filter(function(w){ return w.ccase; });
    document.getElementById('evidenceCount').textContent = evidence.length + ' dated evidence ' + (evidence.length === 1 ? 'entry' : 'entries') + ' on file.';

    var ml = document.getElementById('markerList');
    ml.innerHTML = '';
    MARKERS.forEach(function(mk){
      var checked = !!state.markers[mk.id];
      var li = document.createElement('li');
      if(checked) li.className = 'checked';
      li.innerHTML = '<input type="checkbox"' + (checked ? ' checked' : '') + '> <span>' + mk.label + '</span>' +
        (checked ? '<span class="m-date">&#9670; ' + fmtShort(state.markers[mk.id]) + '</span>' : '');
      li.querySelector('input').addEventListener('change', function(){
        if(this.checked){
          state.markers[mk.id] = todayISO();
          save(); renderAll();
          toast('2026 marker registered. Gold on the board.', 'gold');
        } else {
          delete state.markers[mk.id];
          save(); renderAll();
        }
      });
      ml.appendChild(li);
    });

    var feed = document.getElementById('winFeed');
    var recent = state.wins.slice().sort(function(a,b){ return a.date < b.date ? 1 : -1; }).slice(0, 5);
    feed.innerHTML = recent.length ? '' : '<li style="color:#8C6E5D">The next win goes here. They count small: a plain sentence in a meeting counts.</li>';
    recent.forEach(function(w){
      var li = document.createElement('li');
      li.innerHTML = '<div class="w-meta"><span class="w-date">' + fmtShort(w.date) + '</span>' +
        '<span class="domain-tag' + (w.ccase ? ' ccase' : '') + '">' + (w.ccase ? 'evidence' : w.domain) + '</span>' +
        (w.held ? '<span style="font-size:11px;color:#C9A96E">held the minute</span>' : '') + '</div>' +
        esc(w.desc);
      feed.appendChild(li);
    });
  }

  function exportCase(){
    var lines = ['# Conversion Case: Evidence Document', '', 'Generated ' + fmtLong(todayISO()) + '.', '', '## Migration progress', ''];
    state.phases.forEach(function(p){
      var status = p.status === 'complete' ? 'complete, ' + fmtShort(p.date) + ' 2026' : p.status.replace('_', ' ');
      lines.push('- Phase ' + p.n + ', ' + p.name + ': ' + status);
    });
    lines.push('', '## Dated evidence', '');
    var evidence = state.wins.filter(function(w){ return w.ccase; }).sort(function(a,b){ return a.date < b.date ? -1 : 1; });
    if(!evidence.length) lines.push('(No evidence entries logged yet.)');
    evidence.forEach(function(w){ lines.push('- ' + w.date + ': ' + w.desc); });
    lines.push('', '## Wins by domain, full log', '');
    state.wins.slice().sort(function(a,b){ return a.date < b.date ? -1 : 1; }).forEach(function(w){
      lines.push('- ' + w.date + ' [' + w.domain + ']: ' + w.desc);
    });
    download('conversion-case-' + todayISO() + '.md', lines.join('\n'));
    toast('Evidence document exported. The case writes itself now.', 'gold');
  }

  /* ---------- regulation ---------- */
  function renderRegulation(){
    var box = document.getElementById('ttiChart');
    var events = state.blockers.filter(function(b){ return b.date >= daysAgoISO(89); })
      .sort(function(a,b){ return a.date < b.date ? -1 : 1; });

    if(events.length < 3){
      box.innerHTML = '<div class="chart-empty">' + (events.length === 0
        ? 'The first logged interrupt starts the trend line. Catching it at all is the skill.'
        : 'Trend line appears at three logged events. ' + (3 - events.length) + ' to go, no rush.') + '</div>';
    } else {
      var W = 560, H = 190, padL = 44, padR = 14, padT = 14, padB = 26;
      var ticks = [0, 10, 60, 480, 1440];
      var tickLabels = ['0m','10m','1h','8h','1d'];
      var maxT = Math.max(1440, Math.max.apply(null, events.map(function(e){ return e.tti; })));
      function yOf(m){ return padT + (1 - Math.log10(m + 1) / Math.log10(maxT + 1)) * (H - padT - padB); }
      function xOf(i){ return padL + (events.length === 1 ? 0 : i / (events.length - 1) * (W - padL - padR)); }
      var svg = '';
      ticks.forEach(function(tk, i){
        if(tk > maxT) return;
        var y = yOf(tk);
        svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#F0E8DF" stroke-width="1"/>';
        svg += '<text class="axis-label" x="' + (padL - 8) + '" y="' + (y + 3) + '" text-anchor="end">' + tickLabels[i] + '</text>';
      });
      /* rolling median, window of 5 */
      var medPts = events.map(function(e, i){
        var win = events.slice(Math.max(0, i - 4), i + 1).map(function(x){ return x.tti; });
        return xOf(i).toFixed(1) + ',' + yOf(median(win)).toFixed(1);
      });
      svg += '<polyline points="' + medPts.join(' ') + '" fill="none" stroke="#3A5470" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      var pr = Math.min.apply(null, events.map(function(e){ return e.tti; }));
      events.forEach(function(e, i){
        var isPR = e.tti === pr;
        svg += '<circle cx="' + xOf(i) + '" cy="' + yOf(e.tti) + '" r="' + (isPR ? 5 : 3.5) + '" fill="' + (isPR ? '#C9A96E' : '#7A8FA6') + '"' +
          (isPR ? ' stroke="#FFFFFF" stroke-width="1.5"' : '') + '><title>' + fmtLong(e.date) + ': ' + fmtTti(e.tti) + ', ' + BLOCKER_TYPES[e.type] + '</title></circle>';
      });
      svg += '<text class="axis-label" x="' + padL + '" y="' + (H - 8) + '">' + fmtShort(events[0].date) + '</text>';
      svg += '<text class="axis-label" x="' + (W - padR) + '" y="' + (H - 8) + '" text-anchor="end">' + fmtShort(events[events.length - 1].date) + '</text>';
      box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Time to interrupt, last 90 days. Dots are events, the line is the rolling median.">' + svg + '</svg>' +
        '<p class="sub" style="margin-top:6px">Dots are events in the last 90 days. The slate line is the rolling median. Down is growth.</p>';
    }

    var prSlot = document.getElementById('prSlot');
    var all = state.blockers.map(function(b){ return b.tti; });
    prSlot.innerHTML = all.length
      ? '<span class="pr-badge"><span class="diamond">&#9670;</span> Personal record: caught ' + (Math.min.apply(null, all) === 0 ? 'mid-sentence' : 'in ' + fmtTti(Math.min.apply(null, all))) + '</span>'
      : '';

    var b28 = blockersInWindow(28);
    var caught = b28.filter(function(b){ return b.caught; }).length;
    var protoCounts = {};
    b28.forEach(function(b){ protoCounts[b.protocol] = (protoCounts[b.protocol] || 0) + 1; });
    var topProto = Object.keys(protoCounts).sort(function(a, b){ return protoCounts[b] - protoCounts[a]; })[0];
    document.getElementById('regStats').innerHTML =
      '<div class="reg-stat"><span class="label">Events · 28d</span><span class="value">' + b28.length + '</span></div>' +
      '<div class="reg-stat"><span class="label">Caught rate</span><span class="value">' + (b28.length ? Math.round(caught / b28.length * 100) + '%' : '·') + '</span></div>' +
      '<div class="reg-stat"><span class="label">Median gap</span><span class="value">' + (b28.length ? fmtTti(median(b28.map(function(b){ return b.tti; }))) : '·') + '</span></div>' +
      '<div class="reg-stat"><span class="label">Go-to protocol</span><span class="value" style="font-size:15px;line-height:1.3">' + (topProto ? PROTOCOLS[topProto] : '·') + '</span></div>';

    var typeCounts = {};
    b28.forEach(function(b){ typeCounts[b.type] = (typeCounts[b.type] || 0) + 1; });
    var maxCount = Math.max.apply(null, [1].concat(Object.keys(typeCounts).map(function(k){ return typeCounts[k]; })));
    var bars = Object.keys(typeCounts).sort(function(a, b){ return typeCounts[b] - typeCounts[a]; }).map(function(k){
      return '<div class="type-bar"><span class="tb-name">' + BLOCKER_TYPES[k] + '</span>' +
        '<span class="tb-track"><i style="width:' + (typeCounts[k] / maxCount * 100) + '%"></i></span>' +
        '<span class="tb-n">' + typeCounts[k] + '</span></div>';
    }).join('');
    document.getElementById('typeBars').innerHTML = bars || '<p class="sub" style="margin-top:10px">Event types appear here as they are logged.</p>';
  }

  /* ---------- rhythm ---------- */
  function learningWeek(wk){
    if(!state.learning[wk]) state.learning[wk] = { passive:false, active:false, applied:false, appliedDesc:'' };
    return state.learning[wk];
  }
  function renderRhythm(){
    var wk = weekKey(todayISO());
    var lw = learningWeek(wk);
    var modes = [
      { k:'passive', name:'Passive', day:'Monday: podcast or audiobook' },
      { k:'active',  name:'Active',  day:'Wednesday: 45 minute deep block' },
      { k:'applied', name:'Applied', day:'Thursday: ship one improvement' }
    ];
    document.getElementById('paaRow').innerHTML = modes.map(function(md){
      return '<div class="paa' + (lw[md.k] ? ' on' : '') + '" data-mode="' + md.k + '">' +
        (lw[md.k] ? '<span class="p-check">&#10003;</span>' : '') +
        '<span class="p-name">' + md.name + '</span><span class="p-day">' + md.day + '</span></div>';
    }).join('');
    document.querySelectorAll('#paaRow .paa').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.getAttribute('data-mode');
        lw[k] = !lw[k];
        save(); renderAll();
        if(lw.passive && lw.active && lw.applied) toast('Three of three learning modes this week. The compounding kind.', 'gold');
      });
    });
    var ad = document.getElementById('appliedDesc');
    ad.value = lw.appliedDesc || '';
    ad.onchange = function(){ lw.appliedDesc = ad.value.trim(); save(); };

    document.getElementById('learnDots').innerHTML = lastWeeks(8).map(function(w){
      var l = state.learning[w] || {};
      return '<div class="dot-col"><span class="dot' + (l.passive ? ' on' : '') + '"></span>' +
        '<span class="dot' + (l.active ? ' on' : '') + '"></span>' +
        '<span class="dot' + (l.applied ? ' gold' : '') + '"></span>' +
        '<span class="d-label">' + fmtShort(w).replace(' ', '') + '</span></div>';
    }).join('');

    /* bids */
    var bidsWeek = state.bids.filter(function(b){ return weekKey(b.date) === wk && b.initiated; }).length;
    var bt = document.getElementById('bidTarget');
    bt.innerHTML = '<b>' + bidsWeek + '</b> initiated this week. ' + (bidsWeek >= 2 ? 'Reciprocity is running.' : 'Two warm lines count as one.');
    var from = daysAgoISO(27);
    var sent = state.bids.filter(function(b){ return b.date >= from && b.initiated; }).length;
    var recv = state.bids.filter(function(b){ return b.date >= from && !b.initiated; }).length;
    document.getElementById('bidRatio').innerHTML = 'Last 28 days: initiated <b>' + sent + '</b>, received <b>' + recv + '</b>.';

    /* money */
    var dots = '';
    for(var i = 3; i >= 0; i--){
      var wStart = iso(addDays(fromISO(weekKey(todayISO())), -7 * i));
      var hit = state.money.some(function(mc){ return mc.completed && weekKey(mc.date) === wStart; });
      dots += '<span class="md' + (hit ? ' hit' : '') + '">' + (hit ? '&#10003;' : '&middot;') + '</span>';
    }
    var monthHits = [0,1,2,3].filter(function(i){
      var wStart = iso(addDays(fromISO(weekKey(todayISO())), -7 * i));
      return state.money.some(function(mc){ return mc.completed && weekKey(mc.date) === wStart; });
    }).length;
    document.getElementById('moneyDots').innerHTML = dots + '<span class="week-target" style="margin:0 0 0 6px">' + monthHits + ' of 4, last four weeks</span>';

    var lastCheck = state.money.filter(function(mc){ return mc.completed; }).sort(function(a,b){ return a.date < b.date ? 1 : -1; })[0];
    var watched = document.getElementById('watchedNumber');
    watched.innerHTML = lastCheck && lastCheck.number
      ? esc(lastCheck.number) + ' <small>watched on ' + fmtShort(lastCheck.date) + '</small>'
      : '';

    var nudge = document.getElementById('moneyNudge');
    var todayDow = fromISO(todayISO()).getDay();
    var checkedThisWeek = state.money.some(function(mc){ return mc.completed && weekKey(mc.date) === wk; });
    var daysSince = lastCheck ? Math.round((fromISO(todayISO()) - fromISO(lastCheck.date)) / 86400000) : null;
    if(daysSince != null && daysSince >= 7){
      nudge.innerHTML = '<div class="nudge">It has been ' + daysSince + ' days since the last look. Twenty minutes, one number, done. The numbers are facts, and facts are handleable.</div>';
    } else if(todayDow === 5 && !checkedThisWeek){
      nudge.innerHTML = '<div class="nudge">It is Friday. The twenty minute money check is on today’s plate.</div>';
    } else {
      nudge.innerHTML = '';
    }

    /* posts */
    document.getElementById('postDots').innerHTML = lastWeeks(8).map(function(w){
      var posted = state.posts.some(function(p){ return weekKey(p.date) === w && p.ptype === 'post'; });
      var drafted = state.posts.some(function(p){ return weekKey(p.date) === w && p.ptype === 'draft'; });
      return '<div class="dot-col"><span class="dot' + (posted ? ' gold' : drafted ? ' on' : '') + '"></span>' +
        '<span class="d-label">' + fmtShort(w).replace(' ', '') + '</span></div>';
    }).join('') + '<p class="sub" style="width:100%;margin-top:6px">Gold: posted. Sage: drafted. Cadence is the metric, engagement is not on this board.</p>';
  }
  function lastWeeks(n){
    var out = [], cur = weekKey(todayISO());
    for(var i = n - 1; i >= 0; i--) out.push(iso(addDays(fromISO(cur), -7 * i)));
    return out;
  }

  /* ---------- cycle ---------- */
  function renderCycle(){
    var strip = '';
    for(var i = 27; i >= 0; i--){
      var dISO = daysAgoISO(i);
      var d = dailyRaw(dISO);
      var p = d && d.phase;
      strip += '<div class="ps-cell' + (p ? ' ' + p : '') + '" title="' + fmtShort(dISO) + (p ? ': ' + p : ': not logged') + '"></div>';
    }
    document.getElementById('phaseStrip').innerHTML = strip;

    /* symptom chart, last 56 days */
    var pts = [];
    for(var j = 55; j >= 0; j--){
      var dj = dailyRaw(daysAgoISO(j));
      if(dj && dj.symptom != null) pts.push({ i: 55 - j, v: dj.symptom });
    }
    var box = document.getElementById('symChart');
    if(pts.length < 2){
      box.innerHTML = '<div class="chart-empty">Symptom trend appears after a couple of logged days. The luteal week is the one worth capturing most.</div>';
    } else {
      var W = 520, H = 130, padL = 22, padB = 18, padT = 10;
      function x(i){ return padL + i / 55 * (W - padL - 8); }
      function y(v){ return padT + (5 - v) / 4 * (H - padT - padB); }
      var svg = '';
      for(var lv = 1; lv <= 5; lv++){
        svg += '<line x1="' + padL + '" y1="' + y(lv) + '" x2="' + (W - 8) + '" y2="' + y(lv) + '" stroke="#F0E8DF"/>' +
          '<text class="axis-label" x="' + (padL - 6) + '" y="' + (y(lv) + 3) + '" text-anchor="end">' + lv + '</text>';
      }
      svg += '<polyline points="' + pts.map(function(p){ return x(p.i).toFixed(1) + ',' + y(p.v).toFixed(1); }).join(' ') + '" fill="none" stroke="#3A5470" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(function(p){ svg += '<circle cx="' + x(p.i) + '" cy="' + y(p.v) + '" r="3" fill="#3A5470"/>'; });
      box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Symptom severity, last 56 days, 1 to 5.">' + svg + '</svg>' +
        '<p class="sub" style="margin-top:6px">Symptom severity, last 56 days. Watching it across cycles is the point.</p>';
    }

    /* protocol stats */
    var suppDays = 0, loggedDays = 0, phaseDays = 0;
    for(var k = 0; k < 28; k++){
      var dd = dailyRaw(daysAgoISO(k));
      if(dd){
        if(Object.keys(dd.floor || {}).length || dd.phase || dd.movement.length) loggedDays++;
        if(dd.floor && dd.floor.supplements) suppDays++;
        if(dd.phase) phaseDays++;
      }
    }
    var cycles = trackedCycles();
    document.getElementById('cycleStats').innerHTML =
      '<div class="reg-stat"><span class="label">Supplements · 28d</span><span class="value">' + (loggedDays ? Math.round(suppDays / loggedDays * 100) + '%' : '·') + '</span></div>' +
      '<div class="reg-stat"><span class="label">Phase logged · 28d</span><span class="value">' + phaseDays + '<small style="font-family:Jost;font-size:12px;color:#8C6E5D"> / 28</small></span></div>' +
      '<div class="reg-stat"><span class="label">Cycles tracked</span><span class="value">' + cycles + '</span></div>' +
      '<div class="reg-stat"><span class="label">Escalation path</span><span class="value" style="font-size:15px;line-height:1.3">' + (state.escalation.booked ? 'care booked &#9670;' : cycles >= 2 ? 'decision window' : 'tracking') + '</span></div>';

    var slot = document.getElementById('escalationSlot');
    var dismissedRecently = state.escalation.dismissedAt && (fromISO(todayISO()) - fromISO(state.escalation.dismissedAt)) / 86400000 < 14;
    var firstLog = Object.keys(state.daily).sort()[0];
    var trackedLongEnough = firstLog && (fromISO(todayISO()) - fromISO(firstLog)) / 86400000 >= 42;
    if(!state.escalation.booked && cycles >= 2 && trackedLongEnough && !dismissedRecently){
      slot.innerHTML = '<div class="escalation"><b>Two to three cycles are on the record now.</b> If the protocol is not producing real relief, this is the moment: book the sliding scale appointment. Booking it is a win, not a failure.' +
        '<div style="display:flex;gap:12px;align-items:center"><button class="btn btn-gold btn-sm" id="escBook" type="button">Booked it, log the win</button>' +
        '<button class="linklike" id="escLater" type="button">Not yet</button></div></div>';
      document.getElementById('escBook').addEventListener('click', function(){
        state.escalation.booked = todayISO();
        save();
        openWinModal({ domain:'health', desc:'Booked the sliding scale appointment. The escalation path worked as designed.' });
      });
      document.getElementById('escLater').addEventListener('click', function(){
        state.escalation.dismissedAt = todayISO();
        save(); renderCycle();
      });
    } else if(state.escalation.booked){
      slot.innerHTML = '<div class="escalation"><b>Care booked ' + fmtShort(state.escalation.booked) + '.</b> Either branch was the win, and this one is on the record.</div>';
    } else {
      slot.innerHTML = '';
    }
  }
  function trackedCycles(){
    var dates = Object.keys(state.daily).filter(function(k){ return state.daily[k].phase; }).sort();
    var starts = 0, prev = null;
    dates.forEach(function(k){
      var p = state.daily[k].phase;
      if(p === 'menstrual' && prev && prev !== 'menstrual') starts++;
      prev = p;
    });
    return starts;
  }

  /* ---------- review ---------- */
  function renderReview(){
    var wk = weekKey(todayISO());
    var rv = state.reviews[wk] || {};
    document.getElementById('revBuilt').value = rv.built || '';
    document.getElementById('revShowed').value = rv.showedUpFor || '';
    document.getElementById('revAdjust').value = rv.adjustment || '';

    var mix = { standard:0, luteal:0, menstrual:0, unlogged:0 };
    for(var i = 0; i < 7; i++){
      var dISO = iso(addDays(fromISO(wk), i));
      if(dISO > todayISO()) break;
      var tpl = templateOf(dISO);
      if(!tpl) mix.unlogged++;
      else if(tpl === 'standard') mix.standard++;
      else mix[tpl]++;
    }
    document.getElementById('mixLine').textContent = 'Template mix so far this week: ' + mix.standard + ' standard, ' + mix.luteal + ' luteal, ' + mix.menstrual + ' menstrual' + (mix.unlogged ? ', ' + mix.unlogged + ' unlogged' : '') + '.';

    var past = Object.keys(state.reviews).filter(function(k){ return k !== wk && state.reviews[k].built; }).sort().reverse().slice(0, 4);
    document.getElementById('pastReviews').innerHTML = past.map(function(k){
      var r = state.reviews[k];
      return '<li><span class="pr-week">week of ' + fmtShort(k) + '</span>' + esc(r.built) + (r.adjustment ? ' <span style="color:#8C6E5D">(adjusted: ' + esc(r.adjustment) + ')</span>' : '') + '</li>';
    }).join('');
  }

  /* ---------- showing up ---------- */
  function dayLogCount(dateISO){
    var n = 0;
    var d = dailyRaw(dateISO);
    if(d){
      if(d.phase) n++;
      if(d.movement.length) n += d.movement.length;
      if(Object.keys(d.floor || {}).some(function(k){ return d.floor[k]; })) n++;
      if(d.notes) n++;
      if(d.sleep != null || d.symptom != null) n++;
      if(d.sunday_reset) n++;
    }
    ['wins','blockers','bids','money','posts'].forEach(function(coll){
      n += state[coll].filter(function(x){ return x.date === dateISO; }).length;
    });
    return n;
  }
  function renderShowup(){
    var grid = document.getElementById('showupGrid');
    grid.innerHTML = '';
    var today = fromISO(todayISO());
    var endWeekStart = addDays(today, -today.getDay());
    var start = addDays(endWeekStart, -15 * 7);
    var withData = 0, total = 0;
    for(var w = 0; w <= 15; w++){
      var col = document.createElement('div');
      col.className = 'su-col';
      for(var day = 0; day < 7; day++){
        var d = addDays(start, w * 7 + day);
        var cell = document.createElement('div');
        cell.className = 'su-cell';
        if(d <= today){
          total++;
          var c = dayLogCount(iso(d));
          if(c > 0){
            withData++;
            cell.className += ' l' + Math.min(4, c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4);
          }
          cell.title = fmtShort(iso(d)) + (c ? ': ' + c + ' logged' : ': nothing logged, which is data too');
        }
        col.appendChild(cell);
      }
      grid.appendChild(col);
    }
    document.getElementById('showupNote').textContent = withData + ' of the last ' + total + ' days have data. Missing days are missing, never failure. Backfill is one tap on the date field above.';
  }

  /* ---------- backup ---------- */
  function download(name, text){
    var blob = new Blob([text], { type: name.endsWith('.json') ? 'application/json' : 'text/markdown' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  document.getElementById('exportBtn').addEventListener('click', function(){
    download('knox-dashboard-' + todayISO() + '.json', JSON.stringify(state, null, 2));
  });
  document.getElementById('importBtn').addEventListener('click', function(){ document.getElementById('importFile').click(); });
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
    if(!confirm('Erase everything on this board from this browser? Export a backup first if in doubt.')) return;
    state = blank();
    save(); renderAll();
  });
  document.getElementById('exportCase').addEventListener('click', exportCase);

  /* ---------- static wiring ---------- */
  document.getElementById('logDate').addEventListener('change', function(){
    if(this.value && this.value <= todayISO()){ selDate = this.value; renderAll(); }
  });
  document.getElementById('qWin').addEventListener('click', function(){ openWinModal(); });
  document.getElementById('qBlocker').addEventListener('click', openBlockerModal);
  document.getElementById('qBid').addEventListener('click', openBidModal);

  document.getElementById('mvSauna').addEventListener('click', function(){ mvSauna = !mvSauna; this.classList.toggle('on', mvSauna); });
  document.getElementById('mvCold').addEventListener('click', function(){ mvCold = !mvCold; this.classList.toggle('on', mvCold); });
  document.getElementById('mvLog').addEventListener('click', function(){
    var d = daily(selDate);
    var mins = document.getElementById('mvMins').value;
    d.movement.push({ type: document.getElementById('mvType').value, minutes: mins ? +mins : null, sauna: mvSauna, cold: mvCold });
    mvSauna = false; mvCold = false;
    document.getElementById('mvSauna').classList.remove('on');
    document.getElementById('mvCold').classList.remove('on');
    document.getElementById('mvMins').value = '';
    save(); renderAll();
    var tpl = templateOf(selDate);
    toast(tpl === 'luteal' || tpl === 'menstrual' ? 'Logged, and it counts in full.' : 'Movement logged.', 'sage');
  });

  var bidInitState = true;
  document.getElementById('bidInit').addEventListener('click', function(){
    bidInitState = !bidInitState;
    this.classList.toggle('on', bidInitState);
    this.textContent = bidInitState ? 'I initiated' : 'I received';
  });
  document.getElementById('bidLog').addEventListener('click', function(){
    logBid(document.getElementById('bidCircle').value, document.getElementById('bidType').value, bidInitState);
  });

  document.getElementById('moneyLog').addEventListener('click', function(){
    var num = document.getElementById('moneyNumber').value.trim();
    state.money.push({ id:uid(), date:selDate, completed:true, number:num, notes:'' });
    document.getElementById('moneyNumber').value = '';
    save(); renderAll();
    toast('Money check done. Twenty minutes of facts, handled.', 'sage');
  });

  var postPerspState = true;
  document.getElementById('postPersp').addEventListener('click', function(){
    postPerspState = !postPerspState;
    this.classList.toggle('on', postPerspState);
    this.textContent = postPerspState ? 'from perspective' : 'not this one';
  });
  document.getElementById('postLog').addEventListener('click', function(){
    state.posts.push({ id:uid(), date:selDate, ptype: document.getElementById('postType').value, persp: postPerspState });
    save(); renderAll();
    toast('On the record. The author voice is a cadence, and it held this week.', 'sage');
  });

  document.getElementById('revSave').addEventListener('click', function(){
    var wk = weekKey(todayISO());
    state.reviews[wk] = {
      built: document.getElementById('revBuilt').value.trim(),
      showedUpFor: document.getElementById('revShowed').value.trim(),
      adjustment: document.getElementById('revAdjust').value.trim()
    };
    save(); renderAll();
    toast('Review saved. Something got built, and now it is written down.', 'gold');
  });

  /* ---------- installable app ---------- */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }

  /* ---------- render everything ---------- */
  function renderAll(){
    renderHeader();
    renderAchievements();
    renderToday();
    renderMilestones();
    renderRegulation();
    renderRhythm();
    renderCycle();
    renderReview();
    renderShowup();
  }

  var renderedDay = todayISO();
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden && todayISO() !== renderedDay){
      renderedDay = todayISO();
      if(selDate < renderedDay) selDate = renderedDay;
      renderAll();
    }
  });

  renderAll();
})();
