const SUPABASE_URL = 'https://cpqhljqwxjgscdoepant.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcWhsanF3eGpnc2Nkb2VwYW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTM1NTcsImV4cCI6MjA5Mzc4OTU1N30.XATDTbvL7iDrsn-Si0crJWZebw5FSx0weWRmmcL2Z7c';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const eventId = params.get('event');
const returnUrl = decodeURIComponent(params.get('return') || '') || 'event.html?event=' + eventId;
const BASE_URL = window.location.origin + window.location.pathname.replace('register.html', '');
const signinRoute = params.get('signin') === '1';
const modeParam = params.get('mode');

let eventData = null;
let allParticipants = [];
let attendanceMap = {};
let selectedParticipant = null;
let selectedDay = null;
let selectedSex = null;
let activeTab = 'code';
let sigs = {};
let drawing = {};
let attendanceMode = null;
let submissionMethod = 'attendant_assisted';
let isHybrid = false;

async function init() {
  if (!eventId) return;

  // Show cached stats instantly if available
  const cacheKey = 'stats_' + eventId;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const c = JSON.parse(cached);
      const el = id => document.getElementById(id);
      // Day stats only — restored from cache via daysHtml below
      const daysBox = document.getElementById('stat-days-boxes');
      if (daysBox && c.days) daysBox.innerHTML = c.days;
      document.getElementById('stats-row').style.display = 'block';
    } catch(e) {}
  } else {
    // Show skeleton immediately
    showStatsSkeleton();
  }

  const { data: ev } = await db.from('events').select('*').eq('id', eventId).single();
  if (!ev) return;

  // Status-level access control — Registration Desk only works on Live events
  const evStatus = ev.status || 'Draft';
  if (evStatus !== 'Live') {
    document.querySelector('.app-header').style.display = 'none';
    document.querySelector('.stats-row') && (document.querySelector('.stats-row').style.display = 'none');
    const main = document.getElementById('main-content') || document.body;
    const msg = document.createElement('div');
    msg.style.cssText = 'padding:2rem;text-align:center;margin-top:3rem';
    msg.innerHTML = '<p style="font-size:16px;font-weight:700;color:#EB001B">Registration Desk is not available.</p><p style="color:#888">This event is currently ' + evStatus + '. Registration opens when the event is Live.</p>';
    document.body.appendChild(msg);
    return;
  }

  eventData = ev;

  // Delivery mode / hybrid setup
  const dm = ev.delivery_mode || 'in_person';
  isHybrid = dm === 'hybrid';
  if (modeParam === 'in_person' || modeParam === 'online') {
    attendanceMode = modeParam;
  } else if (dm === 'in_person') {
    attendanceMode = 'in_person';
  } else if (dm === 'online') {
    attendanceMode = 'online';
  }
  submissionMethod = signinRoute ? 'self_completed' : 'attendant_assisted';

  document.getElementById('header-event-name').textContent = ev.name;
  const dateStr = ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : '';
  document.getElementById('header-meta').textContent = [dateStr, (ev.days||1) > 1 ? ev.days + ' days' : '1 day'].filter(Boolean).join(' · ');

  await loadData();
  buildDayButtons('sign-day-row');
  buildDayButtons('new-day-row');
  buildStatsDays();
  updateStats();
  initSig('sign-canvas', 'sign');
  initSig('new-canvas', 'new');

  if (isHybrid) {
    const hSign = document.getElementById('hybrid-mode-sign');
    const hNew = document.getElementById('hybrid-mode-new');
    if (hSign) hSign.style.display = 'block';
    if (hNew) hNew.style.display = 'block';
    if (attendanceMode) setAttendanceMode(attendanceMode);
  }

  showScreen('find');
  if (signinRoute) {
    setScreenLabel('Self Sign-in');
    setHeaderBtn('← Back', () => window.history.back());
    const ub = document.getElementById('unsigned-btn');
    if (ub) ub.style.display = 'none';
  } else {
    setScreenLabel('Participant Reg Form');
    setHeaderBtn('← Back to Event Admin Form', exitRegistration);
    const ub = document.getElementById('unsigned-btn');
    if (ub) ub.style.display = 'block';
  }
  setTimeout(() => { const i = document.getElementById('code-input'); if(i) i.focus(); }, 400);
}

async function loadData() {
  const [pr, ar] = await Promise.all([
    db.from('participants').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
    db.from('attendance').select('*').eq('event_id', eventId)
  ]);
  allParticipants = pr.data || [];
  attendanceMap = {};
  (ar.data || []).forEach(a => {
    if (!attendanceMap[a.participant_id]) attendanceMap[a.participant_id] = {};
    attendanceMap[a.participant_id][a.day] = a;
  });
  updateStats();
}

function buildStatsDays() {
  const cached = sessionStorage.getItem('stats_' + eventId);
  if (cached) {
    try {
      const c = JSON.parse(cached);
      if (c.days) { document.getElementById('stat-days-boxes').innerHTML = c.days; return; }
    } catch(e) {}
  }
  const days = eventData.days || 1;
  const container = document.getElementById('stat-days-boxes');
  container.innerHTML = '';
  for (let i = 1; i <= days; i++) {
    const d = 'Day ' + i;
    container.innerHTML += '<div class="kpi-card" style="border:1.5px solid #e8e8e8">' +
      '<div class="kpi-num" style="color:#333" id="stat-day-num-' + i + '">0</div>' +
      '<div class="kpi-lbl">' + d + '</div></div>';
  }
}

function showStatsSkeleton() {
  document.getElementById('stats-row').style.display = 'block';
}

function updateStats() {
  const days = eventData ? eventData.days || 1 : 1;
  const total = allParticipants.length;
  const female = allParticipants.filter(p => (p.sex||'').toLowerCase() === 'female').length;
  const male   = allParticipants.filter(p => (p.sex||'').toLowerCase() === 'male').length;

  // Signed today and unsigned today
  const today = new Date();
  let currentDay = 'Day 1';
  if (eventData && eventData.event_date) {
    const start = new Date(eventData.event_date);
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      if (d.toDateString() === today.toDateString()) { currentDay = 'Day ' + (i + 1); break; }
    }
  }
  const signedTodayIds = new Set(Object.entries(attendanceMap)
    .filter(([,v]) => v[currentDay]).map(([k]) => k));
  const signedToday  = signedTodayIds.size;
  const unsignedToday = total - signedToday;

  const el = id => document.getElementById(id);
  if (el('stat-registered')) el('stat-registered').textContent = total;
  if (el('stat-female'))     el('stat-female').textContent = female;
  if (el('stat-male'))       el('stat-male').textContent = male;
  if (el('stat-signed-today'))   el('stat-signed-today').textContent = signedToday;
  if (el('stat-unsigned-today')) el('stat-unsigned-today').textContent = unsignedToday;

  // Build day chips
  let daysHtml = '';
  for (let i = 1; i <= days; i++) {
    const d = 'Day ' + i;
    const count = Object.values(attendanceMap).filter(a => a[d]).length;
    const isToday = d === currentDay;
    daysHtml += '<span class="stat-chip' + (isToday ? ' active-day' : '') + '"><strong id="stat-day-num-' + i + '">' + count + '</strong><span>' + d + '</span></span>';
  }

  try {
    sessionStorage.setItem('stats_' + eventId, JSON.stringify({ total, female, male, signedToday, unsignedToday, days: daysHtml }));
  } catch(e) {}

  const db = document.getElementById('stat-days-boxes');
  if (db) db.innerHTML = daysHtml;
}

function buildDayButtons(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const days = eventData.days || 1;
  for (let i = 1; i <= days; i++) {
    const label = 'Day ' + i;
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    btn.textContent = label;
    btn.dataset.day = label;
    btn.onclick = () => {
      selectedDay = label;
      container.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (containerId === 'sign-day-row' && selectedParticipant) {
        const att = attendanceMap[selectedParticipant.id] || {};
        const preview = document.getElementById('sign-sig-preview');
        const canvas  = document.getElementById('sign-canvas');
        const clearBtn = document.querySelector('[onclick*="clearSig"]');
        const confirmBtn = document.getElementById('btn-confirm');
        const hint = document.getElementById('sign-hint');
        const sigLabel = document.querySelector('#screen-sign .section-lbl');
        if (att[label] && att[label].signature_url) {
          // Signed day: show signature preview, hide canvas, confirm, hint, label
          if (preview) { preview.src = att[label].signature_url; preview.style.display = 'block'; }
          if (canvas) canvas.style.display = 'none';
          if (clearBtn) clearBtn.style.display = 'none';
          if (confirmBtn) confirmBtn.style.display = 'none';
          if (hint) hint.style.display = 'none';
          if (sigLabel) sigLabel.style.display = 'none';
          document.getElementById('sign-err').textContent = label + ' attendance confirmed ✓';
          document.getElementById('sign-err').style.display = 'block';
          document.getElementById('sign-err').style.color = '#2F7B6B';
        } else {
          // Unsigned day: show canvas, confirm, hint, label — hide preview
          if (preview) preview.style.display = 'none';
          if (canvas) canvas.style.display = 'block';
          if (clearBtn) clearBtn.style.display = '';
          if (confirmBtn) confirmBtn.style.display = '';
          if (hint) hint.style.display = '';
          if (sigLabel) sigLabel.style.display = '';
          document.getElementById('sign-err').style.display = 'none';
          document.getElementById('sign-err').style.color = '';
          clearSig('sign');
        }
      }
    };
    container.appendChild(btn);
  }
}

function markSignedDays(containerId, participantId) {
  const att = attendanceMap[participantId] || {};
  document.querySelectorAll('#' + containerId + ' .day-btn').forEach(btn => {
    if (att[btn.dataset.day]) {
      btn.classList.add('done');
      btn.textContent = btn.dataset.day + ' ✓';
      btn.classList.remove('active');
    }
  });
}

// ── Signature ──
function initSig(canvasId, key) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth || 360;
  canvas.height = 150;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  sigs[key] = { canvas, ctx };
  drawing[key] = false;

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: (s.clientX - r.left) * (canvas.width / r.width), y: (s.clientY - r.top) * (canvas.height / r.height) };
  };
  const start = e => { e.preventDefault(); drawing[key] = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); document.getElementById(key + '-hint').style.display = 'none'; };
  const move  = e => { e.preventDefault(); if (!drawing[key]) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const stop  = () => drawing[key] = false;
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', stop);
}

function clearSig(key) {
  const { canvas, ctx } = sigs[key];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById(key + '-hint').style.display = 'block';
}

function isSigEmpty(key) {
  const { canvas, ctx } = sigs[key];
  return !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(v => v !== 0);
}

// ── Screens ──
function showScreen(name) {
  ['find','sign','new','success'].forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });
  window.scrollTo(0, 0);
}

function showFind() {
  document.getElementById('stats-row').style.display = 'block';
  setHeaderBtn('← Back to Event Admin Form', exitRegistration);
  const _ub = document.getElementById('unsigned-btn'); if (_ub) _ub.style.display = 'block';
  setScreenLabel('Participant Reg Form');
  selectedParticipant = null; selectedDay = null;
  document.getElementById('code-input').value = '';
  document.getElementById('name-input').value = '';
  document.getElementById('name-results').innerHTML = '';
  document.getElementById('find-err').style.display = 'none';
  clearSig('sign'); clearSig('new');
  buildDayButtons('sign-day-row');
  buildDayButtons('new-day-row');
  showScreen('find');
  loadData();
  setTimeout(() => { const i = document.getElementById(activeTab === 'code' ? 'code-input' : 'name-input'); if(i) { i.focus(); i.select(); } }, 300);
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-code').classList.toggle('active', tab === 'code');
  document.getElementById('tab-name').classList.toggle('active', tab === 'name');
  document.getElementById('find-by-code').style.display = tab === 'code' ? 'block' : 'none';
  document.getElementById('find-by-name').style.display = tab === 'name' ? 'block' : 'none';
  document.getElementById('find-err').style.display = 'none';
  setTimeout(() => document.getElementById(tab === 'code' ? 'code-input' : 'name-input').focus(), 100);
}

function openUnsigned() {
  window.location.href = BASE_URL + 'unsigned.html?event=' + eventId;
}

function exitRegistration() {
  window.location.href = BASE_URL + returnUrl + (returnUrl.includes('?') ? '&' : '?') + 'from=admin';
}

// ── Find ──
async function findByCode() {
  const raw = document.getElementById('code-input').value.trim().toUpperCase();
  if (!raw) return;
  // Clear previous results
  const phoneRes = document.getElementById('phone-results');
  if (phoneRes) { phoneRes.innerHTML = ''; }
  const rawNorm = raw.replace(/[^0-9]/g, ''); // digits only for phone matching
  // Find all matches — by code or partial phone
  const matches = allParticipants.filter(x => {
    const c = (x.code || '').toUpperCase();
    const phone = (x.phone || '').replace(/[^0-9]/g, '');
    const codeMatch = c === raw || c.endsWith('-' + raw) || c.endsWith('-' + raw.replace(/^0+/, ''));
    const phoneMatch = rawNorm.length >= 3 && phone.includes(rawNorm);
    return codeMatch || phoneMatch;
  });
  if (!matches.length) {
    document.getElementById('find-err').textContent = 'No participant found. Try a different code or phone number.';
    document.getElementById('find-err').style.display = 'block';
    return;
  }
  document.getElementById('find-err').style.display = 'none';
  if (matches.length === 1) {
    openSignScreen(matches[0]);
  } else {
    // Show list if multiple phone matches
    const container = document.getElementById('phone-results');
    container.style.display = 'block';
    container.innerHTML = '<p style="font-size:12px;color:#888;margin-bottom:6px">' + matches.length + ' matches — select one:</p>' +
      matches.slice(0,8).map(p =>
        '<div class="result-item" onclick="selectResult(\'' + p.id + '\')">' +
          '<div class="result-name">' + esc(p.name) + '</div>' +
          '<div class="result-meta">' + esc(p.code||'') + ' · ' + esc(p.phone||'') + '</div>' +
        '</div>'
      ).join('');
  }
}

function fuzzyScore(str, q) {
  str = (str||'').toLowerCase(); q = q.toLowerCase();
  if (str.includes(q)) return 2; // exact substring highest
  let si = 0, qi = 0, score = 0;
  while (si < str.length && qi < q.length) { if (str[si] === q[qi]) { score++; qi++; } si++; }
  return qi === q.length ? score / str.length : 0;
}

function findByName() {
  const q = document.getElementById('name-input').value.trim();
  if (!q) return;
  const scored = allParticipants.map(p => ({
    p,
    score: Math.max(fuzzyScore(p.name, q), fuzzyScore(p.org, q), fuzzyScore(p.prog, q))
  })).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0,10);

  const container = document.getElementById('name-results');
  if (!scored.length) {
    container.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:10px 0">No results. Use New Participant below.</p>';
    return;
  }
  container.innerHTML = scored.map(({p}) =>
    '<div class="result-item" onclick="selectResult(\''+ p.id +'\')">'  +
      '<div class="result-name">' + esc(p.name) + '</div>' +
      '<div class="result-meta">' + esc(p.code||'')+' · '+esc(p.org||'')+( p.prog?' · '+esc(p.prog):'')+'</div>' +
    '</div>'
  ).join('');
}

function selectResult(id) {
  const p = allParticipants.find(x => x.id === id);
  if (p) openSignScreen(p);
}

function openSignScreen(p) {
  document.getElementById('stats-row').style.display = 'none';
  const _ub = document.getElementById('unsigned-btn'); if (_ub) _ub.style.display = 'none';
  setHeaderBtn('← Back to Participant Reg Form', showFind);
  setScreenLabel('Sign Attendance Form');
  selectedParticipant = p;
  document.getElementById('sign-code').textContent = p.code || '';
  document.getElementById('sign-name').textContent = p.name || '';
  document.getElementById('sign-org').textContent = p.org || '';
  document.getElementById('sign-pos').textContent = p.position_title || '';
  buildDayButtons('sign-day-row');
  markSignedDays('sign-day-row', p.id);
  // Auto-select first unsigned day
  const days = Array.from({ length: eventData.days || 1 }, (_, i) => 'Day ' + (i + 1));
  const att = attendanceMap[p.id] || {};
  const firstUnsigned = days.find(d => !att[d]);
  const preview = document.getElementById('sign-sig-preview');
  const canvas  = document.getElementById('sign-canvas');
  const clearBtn = document.querySelector('[onclick*="clearSig"]');
  const confirmBtn = document.getElementById('btn-confirm');
  if (firstUnsigned) {
    selectedDay = firstUnsigned;
    document.querySelector('#sign-day-row [data-day="' + firstUnsigned + '"]')?.classList.add('active');
    if (preview) preview.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (clearBtn) clearBtn.style.display = '';
    if (confirmBtn) confirmBtn.style.display = '';
    clearSig('sign');
  } else {
    // All days signed — show last day's signature
    const lastDay = days[days.length - 1];
    selectedDay = lastDay;
    document.querySelector('#sign-day-row [data-day="' + lastDay + '"]')?.classList.add('active');
    if (att[lastDay] && att[lastDay].signature_url) {
      if (preview) { preview.src = att[lastDay].signature_url; preview.style.display = 'block'; }
    }
    if (canvas) canvas.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    const hint2 = document.getElementById('sign-hint'); if (hint2) hint2.style.display = 'none';
    const sigLbl2 = document.querySelector('#screen-sign .section-lbl'); if (sigLbl2) sigLbl2.style.display = 'none';
    document.getElementById('sign-err').textContent = 'All days signed ✓';
    document.getElementById('sign-err').style.display = 'block';
    document.getElementById('sign-err').style.color = '#2F7B6B';
  }
  document.getElementById('sign-err').style.display = 'none';
  showScreen('sign');
}

// ── Confirm attendance ──
async function confirmAttendance() {
  const errEl = document.getElementById('sign-err');
  if (!selectedDay) { errEl.textContent = 'Please select a day.'; errEl.style.display = 'block'; return; }
  const att = attendanceMap[selectedParticipant.id] || {};
  if (att[selectedDay]) { errEl.textContent = selectedDay + ' already signed.'; errEl.style.display = 'block'; return; }
  if (isHybrid && !attendanceMode) { errEl.textContent = 'Please select how you are joining today.'; errEl.style.display = 'block'; return; }
  if (isSigEmpty('sign')) { errEl.textContent = 'Please sign before confirming.'; errEl.style.display = 'block'; return; }

  const btn = document.getElementById('btn-confirm');
  btn.textContent = 'Saving...'; btn.disabled = true;
  try {
    const { canvas } = sigs['sign'];
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const path = eventId + '/' + selectedParticipant.id + '/' + selectedDay.replace(' ','_') + '_' + Date.now() + '.png';
    const { error: upErr } = await db.storage.from('signatures').upload(path, blob, { contentType: 'image/png' });
    if (upErr) throw new Error(upErr.message);
    const { data: { publicUrl } } = db.storage.from('signatures').getPublicUrl(path);
    const { error } = await db.from('attendance').upsert([{
      participant_id: selectedParticipant.id, event_id: eventId, day: selectedDay, signature_url: publicUrl
    }], { onConflict: 'event_id,participant_id,day', ignoreDuplicates: false });
    if (error) throw new Error(error.message);
    if (attendanceMode && !selectedParticipant.attendance_mode) {
      await db.from('participants').update({ attendance_mode: attendanceMode, submission_method: submissionMethod }).eq('id', selectedParticipant.id);
      selectedParticipant.attendance_mode = attendanceMode;
    }
    if (typeof logAudit === 'function') logAudit('attendance_signed', 'attendance', null, { participant_id: selectedParticipant.id, day: selectedDay, attendance_mode: attendanceMode });
    document.getElementById('success-name').textContent = selectedParticipant.name;
    document.getElementById('success-day').textContent = 'Attendance recorded for ' + selectedDay;
  const _ub = document.getElementById('unsigned-btn'); if (_ub) _ub.style.display = 'none';
    showScreen('success');
  } catch(e) {
    let msg = e.message;
    if (msg.includes('row-level security') || msg.includes('duplicate') || msg.includes('unique')) {
      msg = 'This day has already been signed. No duplicate record was created.';
    }
    errEl.textContent = msg; errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Confirm Attendance'; btn.disabled = false;
  }
}

// ── New registration ──
function showNewRegistration() {
  document.getElementById('stats-row').style.display = 'none';
  const _ub = document.getElementById('unsigned-btn'); if (_ub) _ub.style.display = 'none';
  setHeaderBtn('← Back to Participant Reg Form', showFind);
  setScreenLabel('Walk-in Participant Reg Form');
  selectedDay = null; selectedSex = null;
  ['new-name','new-org','new-prog','new-position','new-email','new-phone'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('sex-male').classList.remove('active');
  document.getElementById('sex-female').classList.remove('active');
  buildDayButtons('new-day-row');
  clearSig('new');
  document.getElementById('new-err').style.display = 'none';
  showScreen('new');
  setTimeout(() => document.getElementById('new-name').focus(), 200);
}

function setSex(sex) {
  selectedSex = sex;
  document.getElementById('sex-male').classList.toggle('active', sex === 'Male');
  document.getElementById('sex-female').classList.toggle('active', sex === 'Female');
}

function setAttendanceMode(mode) {
  attendanceMode = mode;
  const ipSign = document.getElementById('mode-inperson-sign');
  const onSign = document.getElementById('mode-online-sign');
  if (ipSign) ipSign.classList.toggle('active', mode === 'in_person');
  if (onSign) onSign.classList.toggle('active', mode === 'online');
  const ipNew = document.getElementById('mode-inperson-new');
  const onNew = document.getElementById('mode-online-new');
  if (ipNew) ipNew.classList.toggle('active', mode === 'in_person');
  if (onNew) onNew.classList.toggle('active', mode === 'online');
}

async function submitNew() {
  const errEl = document.getElementById('new-err');
  errEl.style.display = 'none';
  const name = document.getElementById('new-name').value.trim();
  const org  = document.getElementById('new-org').value.trim();
  const prog = document.getElementById('new-prog').value.trim();
  const pos  = document.getElementById('new-position').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const phone = document.getElementById('new-phone').value.trim();

  if (!name) { errEl.textContent = 'Full name required.'; errEl.style.display = 'block'; return; }
  if (!selectedSex) { errEl.textContent = 'Please select sex.'; errEl.style.display = 'block'; return; }
  if (!email) { errEl.textContent = 'Email is required.'; errEl.style.display = 'block'; return; }
  if (!phone) { errEl.textContent = 'Phone is required.'; errEl.style.display = 'block'; return; }
  if (!/^0\d{9}$/.test(phone.replace(/\s/g,''))) { errEl.textContent = 'Phone must be 10 digits starting with 0 (e.g. 0244123456).'; errEl.style.display = 'block'; return; }
  if (!org) { errEl.textContent = 'Organisation required.'; errEl.style.display = 'block'; return; }
  if (!prog) { errEl.textContent = 'Program required.'; errEl.style.display = 'block'; return; }
  if (!pos) { errEl.textContent = 'Position required.'; errEl.style.display = 'block'; return; }
  if (!selectedDay) { errEl.textContent = 'Please select a day.'; errEl.style.display = 'block'; return; }
  if (isHybrid && !attendanceMode) { errEl.textContent = 'Please select how you are joining today.'; errEl.style.display = 'block'; return; }
  if (isSigEmpty('new')) { errEl.textContent = 'Please sign.'; errEl.style.display = 'block'; return; }

  const btn = document.getElementById('btn-submit-new');
  btn.textContent = 'Saving...'; btn.disabled = true;
  try {
    // Atomic code generation via Supabase function (safe under concurrent submissions)
    let code;
    try {
      const { data: rpcCode, error: rpcErr } = await db.rpc('get_next_participant_code', { p_event_id: eventId });
      if (!rpcErr && rpcCode) { code = rpcCode; }
    } catch(e) {}
    if (!code) {
      // Fallback if RPC not deployed yet
      const nums = allParticipants.map(p => { const m = (p.code||'').match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
      code = String((nums.length ? Math.max(...nums) + 1 : 1)).padStart(3, '0');
    }

    const { data: ins, error } = await db.from('participants').insert([{
      name, sex: selectedSex, org, prog, position_title: pos,
      email: email || null, phone: phone || null,
      reg_type: 'Walk-in', event_id: eventId, code, day_attended: selectedDay,
      attendance_mode: attendanceMode || null,
      submission_method: submissionMethod || 'attendant_assisted'
    }]).select().single();
    if (error) throw new Error(error.message);

    // Upload signature + insert attendance atomically (rollback participant on failure)
    try {
      const { canvas } = sigs['new'];
      const b64 = canvas.toDataURL('image/png').split(',')[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const sigBlob = new Blob([bytes], { type: 'image/png' });
      const path = eventId + '/' + ins.id + '/' + selectedDay.replace(' ','_') + '_' + Date.now() + '.png';
      let publicUrl = null;
      const { error: upErr } = await db.storage.from('signatures').upload(path, sigBlob, { contentType: 'image/png' });
      if (!upErr) {
        const { data: { publicUrl: url } } = db.storage.from('signatures').getPublicUrl(path);
        publicUrl = url;
      }
      const { error: attErr } = await db.from('attendance').upsert([{
        participant_id: ins.id, event_id: eventId, day: selectedDay, signature_url: publicUrl
      }], { onConflict: 'event_id,participant_id,day', ignoreDuplicates: false });
      if (attErr) throw new Error(attErr.message);
      if (typeof logAudit === 'function') logAudit('attendance_signed', 'attendance', null, { participant_id: ins.id, day: selectedDay, reg_type: 'Walk-in' });
    } catch(stepErr) {
      await db.from('participants').delete().eq('id', ins.id);
      throw new Error('Registration incomplete — rolled back. Try again.');
    }
    allParticipants.push(ins);
    // Send email confirmation if email provided
    if (email) {
      const signUrl = BASE_URL + 'sign.html?participant=' + ins.id + '&event=' + eventId;
      const dateStr = eventData.event_date
        ? new Date(eventData.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
        : '';
      sendEmail(email, name, ins.code, eventData.name, dateStr, signUrl);
    }
    sessionStorage.removeItem('stats_' + eventId); // invalidate cache
    document.getElementById('success-name').textContent = name;
    document.getElementById('success-day').textContent = 'Registered and signed for ' + selectedDay;
  const _ub = document.getElementById('unsigned-btn'); if (_ub) _ub.style.display = 'none';
    showScreen('success');
  } catch(e) {
    errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Submit & Sign'; btn.disabled = false;
  }
}

async function sendEmail(toEmail, participantName, code, eventName, eventDate, signUrl) {
  const qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(signUrl);
  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
    '<div style="background:linear-gradient(90deg,#EB001B,#FF5F00,#F79E1B);padding:24px 28px">' +
      '' +
      '<h1 style="color:white;font-size:20px;font-weight:800;margin:0">' + eventName + '</h1>' +
      (eventDate ? '<p style="color:rgba(255,255,255,0.85);font-size:12px;margin:4px 0 0">' + eventDate + '</p>' : '') +
    '</div>' +
    '<div style="padding:28px;background:#fff">' +
      '<p style="color:#555;font-size:14px">Dear <strong>' + participantName + '</strong>,</p>' +
      '<p style="color:#555;font-size:14px;line-height:1.6">Your registration is confirmed. Keep your participant code — you may need it for future event days.</p>' +
      '<div style="background:#f9f9f9;border-radius:10px;padding:20px;text-align:center;margin:20px 0">' +
        '<p style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 6px">Participant Code</p>' +
        '<p style="color:#FF5F00;font-size:36px;font-weight:800;margin:0;font-family:monospace">' + code + '</p>' +
      '</div>' +
      '<div style="text-align:center;margin:16px 0">' +
        '<img src="' + qrImageUrl + '" width="150" height="150" style="border:3px solid #F79E1B;border-radius:8px" />' +
        '<p style="color:#888;font-size:12px;margin-top:8px">Scan to sign attendance</p>' +
      '</div>' +
    '</div>' +
    '<div style="background:#000;padding:14px 28px;text-align:center">' +
      '<p style="color:#F79E1B;font-size:11px;font-weight:700;margin:0">Participant Reg App</p>' +
    '</div>' +
  '</div>';
  try {
    await fetch('https://participants-email.metsslbg.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toEmail, subject: 'Registration Confirmed — ' + eventName + ' [' + code + ']', html })
    });
  } catch(e) { console.warn('Email failed:', e.message); }
}

function setHeaderBtn(text, action) {
  const btn = document.getElementById('header-action-btn');
  if (btn) { btn.textContent = text; btn.onclick = action; }
}

function setScreenLabel(text) {
  const lbl = document.getElementById('screen-name-label');
  if (lbl) lbl.textContent = text;
  const formLbl = document.getElementById('screen-form-label');
  if (!formLbl) return;
  const upper = text.toUpperCase();
  formLbl.textContent = upper;
  formLbl.style.fontSize = '';
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

init();
