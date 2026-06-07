const SUPABASE_URL = 'https://cpqhljqwxjgscdoepant.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcWhsanF3eGpnc2Nkb2VwYW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTM1NTcsImV4cCI6MjA5Mzc4OTU1N30.XATDTbvL7iDrsn-Si0crJWZebw5FSx0weWRmmcL2Z7c';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const eventId = params.get('event');
const BASE_URL = window.location.origin + window.location.pathname.replace('event.html', '');
let allParticipants = [];
let eventDays = 1;
let currentFilter = 'all';
let currentFilterDay = 'Day 1';
let attendanceByDay = {}; // day -> Set of participant_ids

function goBackToEvents() {
  window.location.href = BASE_URL + 'admin.html';
}

function openRegistration() {
  window.location.href = BASE_URL + 'register.html?event=' + eventId + '&return=' + encodeURIComponent('event.html?event=' + eventId);
}
function openPreReg() { window.location.href = BASE_URL + 'index.html?event=' + eventId; }
function openWalkin() { window.location.href = BASE_URL + 'index.html?event=' + eventId + '&walkin=1'; }

async function viewSig(participantId, day, e) {
  e.stopPropagation();
  const { data: att } = await db.from('attendance')
    .select('signature_url').eq('participant_id', participantId)
    .eq('event_id', eventId).eq('day', day).single();
  if (att?.signature_url) window.open(att.signature_url, '_blank');
}

// Show template picker modal
function openCertPicker(previewMode) {
  previewMode = 'image';
  const modal = document.getElementById('cert-picker-modal');
  const grid = document.getElementById('cert-template-grid');
  if (!modal || !grid || !window.CERT_TEMPLATES) return;
  grid.innerHTML = '';
  Object.entries(window.CERT_TEMPLATES).forEach(([key, tpl]) => {
    const card = document.createElement('div');
    card.style.cssText = 'border:1.5px solid #e0e0e0;border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s;background:white';
    card.onmouseover = () => { card.style.borderColor = 'var(--red)'; card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 12px rgba(235,0,27,0.15)'; };
    card.onmouseout  = () => { card.style.borderColor = '#e0e0e0'; card.style.transform = 'none'; card.style.boxShadow = 'none'; };
    card.innerHTML = '<div style="font-weight:800;font-size:13px;color:var(--red);margin-bottom:4px">' + tpl.name + '</div>' +
                     '<div style="font-size:11px;color:#666;line-height:1.4">' + tpl.desc + '</div>' +
                     '<div style="display:flex;gap:6px;margin-top:10px">' +
                       '<button class="cert-gen-btn" data-key="' + key + '" data-preview="0" style="flex:1;padding:7px;background:var(--red);color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">Generate All</button>' +
                       '<button class="cert-gen-btn" data-key="' + key + '" data-preview="1" style="flex:1;padding:7px;background:white;color:var(--red);border:1.5px solid var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">Preview</button>' +
                     '</div>';
    grid.appendChild(card);
  });
  grid.querySelectorAll('.cert-gen-btn').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      const key = b.dataset.key;
      const isPreview = b.dataset.preview === '1';
      closeCertPicker();
      generateEventCertificates(key, isPreview ? previewMode : false);
    };
  });
  modal.style.display = 'flex';
}
function openCertificatePicker(eid) { openCertPicker(false); }



function showCertPreviewImage(doc, templateName) {
  // Convert first page of PDF to image using jsPDF's output as data URI
  // Use canvas to render the PDF page as an image
  const pdfDataUri = doc.output('datauristring');
  // Open the preview modal with PDF embedded as iframe (renders consistently as image-like view)
  let modal = document.getElementById('cert-preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cert-preview-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;align-items:center;justify-content:center;padding:1rem;flex-direction:column';
    modal.innerHTML = '<div style="background:white;border-radius:12px;max-width:95vw;max-height:90vh;width:100%;display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--red);color:white">' +
          '<div><div style="font-size:11px;opacity:0.85;letter-spacing:1px">PREVIEW</div><div id="cpm-name" style="font-size:15px;font-weight:800"></div></div>' +
          '<button onclick="document.getElementById(\'cert-preview-modal\').style.display=\'none\'" style="background:rgba(255,255,255,0.2);color:white;border:none;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;font-weight:bold">×</button>' +
        '</div>' +
        '<div style="flex:1;overflow:auto;background:#222;padding:16px;text-align:center">' +
          '<img id="cpm-img" alt="Certificate preview" style="max-width:100%;height:auto;background:white;box-shadow:0 8px 32px rgba(0,0,0,0.4)" />' +
        '</div>' +
        '<div style="padding:10px 16px;background:#f5f5f5;text-align:center;font-size:11px;color:#666">This is a preview only — no file has been downloaded. Close to pick another template.</div>' +
      '</div>';
    document.body.appendChild(modal);
  }
  document.getElementById('cpm-name').textContent = templateName;
  renderPdfToImage(doc).then(imgUrl => {
    document.getElementById('cpm-img').src = imgUrl;
    modal.style.display = 'flex';
  });
  // When modal closes, reopen the template picker
  modal.onclick = (e) => {
    if (e.target === modal) { modal.style.display = 'none'; openCertificatePicker(eventId); }
  };
  // Update close button to reopen picker
  const closeBtn = modal.querySelector('button');
  if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; openCertificatePicker(eventId); };
}

async function renderPdfToImage(doc) {
  // Use PDF.js if available, otherwise fall back to embedding as iframe
  // For reliability, render the certificate to a high-res canvas directly using the same template
  // Best approach: get the PDF as blob, use canvas via FileReader + image
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  // Try PDF.js (loaded as needed)
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const pdf = await window.pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/png');
}

function closeCertPicker() {
  const modal = document.getElementById('cert-picker-modal');
  if (modal) modal.style.display = 'none';
}

async function generateEventCertificates(templateKey, previewOnly) {
  templateKey = templateKey || 'classic_mcf';
  previewOnly = previewOnly || false;
  const btn = document.getElementById('cert-btn');
  if (btn) { btn.textContent = 'Building...'; btn.disabled = true; }

  try {
    const tpl = window.CERT_TEMPLATES[templateKey] || window.CERT_TEMPLATES.classic_mcf;
    const { jsPDF } = window.jspdf;
    const evName = document.getElementById('event-name').textContent;
    const { data: ev } = await db.from('events').select('*').eq('id', eventId).single();
    if (!ev) { alert('Event not found.'); return; }

    // Certificate eligibility rule
    const eligibilityRule = ev.certificate_eligibility || 'signed_once';
    const { data: attendance } = await db.from('attendance').select('participant_id, day').eq('event_id', eventId);
    const attRows = attendance || [];

    let eligible = [];
    if (eligibilityRule === 'all_registered') {
      eligible = [...allParticipants];
    } else if (eligibilityRule === 'signed_all_days') {
      const totalDays = ev.days || 1;
      const daysByPart = {};
      attRows.forEach(a => {
        if (!daysByPart[a.participant_id]) daysByPart[a.participant_id] = new Set();
        daysByPart[a.participant_id].add(a.day);
      });
      eligible = allParticipants.filter(p => (daysByPart[p.id]?.size || 0) >= totalDays);
      if (!eligible.length) { alert('No participants have signed all ' + totalDays + ' event days yet.'); return; }
    } else {
      // signed_once (default)
      const signedIds = new Set(attRows.map(a => a.participant_id));
      eligible = allParticipants.filter(p => signedIds.has(p.id));
    }

    if (!eligible.length) { alert('No eligible participants found for the current certificate rule (' + eligibilityRule.replace(/_/g,' ') + ').'); return; }
    if (previewOnly) { eligible.splice(1); }

    async function loadImg(url) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise(r => { const reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(blob); });
      } catch { return null; }
    }

    const sigB64 = ev.signatory_signature_url ? await loadImg(ev.signatory_signature_url) : null;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const dateStr = ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

    eligible.forEach((p, idx) => {
      if (idx > 0) doc.addPage();
      tpl.render({ doc, p, ev, evName, dateStr, sigB64, W, H });
    });

    if (previewOnly) {
      // Option 3: render to canvas image in modal
      showCertPreviewImage(doc, tpl.name);
    } else {
      const safeName = evName.replace(/\s+/g, '-');
      if (typeof logAudit === 'function') logAudit('certificates_generated', 'event', eventId, { template: templateKey, count: eligible.length, rule: eligibilityRule });
      doc.save('certificates-' + templateKey + '-' + safeName + '-' + new Date().toISOString().slice(0,10) + '.pdf');
    }
  } catch(e) { alert('Certificate generation failed: '+e.message); console.error(e); }
  finally { if(btn){btn.textContent='🎓 Certificates';btn.disabled=false;} }
}

function showSkeletonStats() {
  const container = document.getElementById('stat-days');
  if (!container) return;
  container.innerHTML = Array(3).fill(
    '<div class="stat-card" style="border-top:3px solid #e0e0e0">' +
    '<div class="skeleton skeleton-num"></div>' +
    '<div class="skeleton skeleton-text"></div></div>'
  ).join('');
}

async function loadEventStats() {
  try {
    const { data: parts } = await db.from('participants').select('reg_type, sex').eq('event_id', eventId);
    if (!parts) return;
    const total   = parts.length;
    const prereg  = parts.filter(p => (p.reg_type||'').toLowerCase().includes('pre')).length;
    const walkin  = parts.filter(p => (p.reg_type||'').toLowerCase().includes('walk')).length;
    const female  = parts.filter(p => (p.sex||'').toLowerCase() === 'female').length;
    const { count: signed } = await db.from('attendance').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
    const set = id => { const el = document.getElementById(id); if (el) el.textContent = ''; };
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    s('es-total',  total);
    s('es-prereg', prereg);
    s('es-walkin', walkin);
    s('es-female', female);
    s('es-signed', signed || 0);
  } catch(e) {}
}


function applyStatusVisibility(status) {
  const rules = {
    'btn-prereg-link':         ['Open','Live'],
    'btn-walkin':              ['Live'],
    'btn-not-signed':          ['Live'],
    'btn-checkin-qr':          ['Live'],
    'btn-self-sign-inperson':  ['Live'],
    'btn-self-sign-online':    ['Live'],
    'btn-export-pdf':          ['Closed','Archived','Live'],
    'btn-qr-sheet':            ['Closed','Archived'],
    'btn-certs':               ['Closed','Archived'],
    'btn-import-csv':          ['Draft','Open'],
    'btn-edit-parts':          ['Draft','Open','Live','Closed'],
  };
  Object.entries(rules).forEach(([id, allowed]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = allowed.includes(status) ? '' : 'none';
  });
  if (status === 'Archived') {
    ['btn-walkin','btn-prereg-link','btn-not-signed','btn-checkin-qr',
     'btn-self-sign-inperson','btn-self-sign-online','btn-import-csv','btn-edit-parts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
}

function renderReadinessChecklist(ev, participantCount) {
  const status = ev.status || 'Draft';
  const checks = [];

  function check(label, passed, warn, note) {
    checks.push({ label, passed, warn, note });
  }

  // Core setup checks
  check('Event date set',           !!ev.event_date,                      false, ev.event_date ? '' : 'Add a date in Edit Event');
  check('Number of days set',       (ev.days || 0) >= 1,                  false, '');
  check('Event code set',           !!ev.event_code,                      true,  ev.event_code ? '' : 'Recommended for participant codes');
  check('Status set',               !!ev.status,                          false, '');
  check('Certificate rule set',     !!ev.certificate_eligibility,         true,  ev.certificate_eligibility ? '' : 'Set in Edit Event');
  const dmValid = ['in_person','online','hybrid'].includes(ev.delivery_mode);
  check('Delivery mode set',        dmValid,                               false, dmValid ? '' : 'Set in Edit Event — In-person, Online, or Hybrid');

  // Participants
  check('Participants loaded',       participantCount > 0,                 true,  participantCount > 0 ? participantCount + ' registered' : 'No participants yet');

  // Signatory — optional but flagged
  const hasSig = !!(ev.signatory_name && ev.signatory_title && ev.signatory_signature_url);
  checks.push({ label: 'Signatory details (optional)', passed: hasSig, warn: true,
    note: hasSig ? '' : 'Add signatory name, title & signature for certificates' });

  // Status-based workflow checks
  const preRegOk = ['Open','Live'].includes(status);
  check('Pre-reg link available',     preRegOk, true,  preRegOk ? '' : 'Set status to Open or Live');
  check('Registration Desk available', status === 'Live', true, status === 'Live' ? '' : 'Set status to Live on event day');
  check('Certificates available',     ['Closed','Archived'].includes(status), true,
    ['Closed','Archived'].includes(status) ? '' : 'Set status to Closed after the event');

  // Render
  const panel = document.getElementById('readiness-panel');
  const list  = document.getElementById('readiness-list');
  if (!panel || !list) return;

  const allRequired = checks.filter(c => !c.warn);
  const allPassed   = allRequired.every(c => c.passed);

  list.innerHTML = checks.map(c => {
    const icon = c.passed ? '✓' : (c.warn ? '⚠' : '✗');
    const color = c.passed ? '#009444' : (c.warn ? '#FF5F00' : '#EB001B');
    const noteHtml = (!c.passed && c.note) ? '<span style="font-size:10px;color:#888;margin-left:4px">' + c.note + '</span>' : '';
    return '<div style="display:flex;align-items:baseline;gap:6px;padding:3px 0">' +
      '<span style="font-size:12px;font-weight:700;color:' + color + ';flex-shrink:0;width:14px">' + icon + '</span>' +
      '<span style="font-size:12px;color:#333">' + c.label + noteHtml + '</span>' +
    '</div>';
  }).join('');

  // Summary line
  const total = checks.length;
  const passed = checks.filter(c => c.passed).length;
  const summaryColor = allPassed ? '#009444' : (passed >= total * 0.7 ? '#FF5F00' : '#EB001B');
  const advisoryPassed = checks.filter(c => c.warn && c.passed).length;
  const advisoryTotal = checks.filter(c => c.warn).length;
  const allAdvisoryPassed = advisoryPassed === advisoryTotal;
  const summaryText = allPassed
    ? (allAdvisoryPassed ? passed + ' of ' + total + ' checks passed — ready'
      : 'Required checks passed — advisory items remain')
    : passed + ' of ' + total + ' checks passed';
  list.innerHTML += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;font-weight:700;color:' + summaryColor + '">' + summaryText + '</div>';

  panel.style.display = 'block';
}

async function init() {
  // Show Back to Events button if opened from admin
  const fromAdmin = new URLSearchParams(window.location.search).get('from') === 'admin';
  if (fromAdmin) {
    document.getElementById('back-to-events-btn').style.display = 'inline-block'; // always visible
    const showEl = id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; };
    showEl('edit-participants-btn');
    showEl('cert-btn');
    showEl('edit-event-btn');
    showEl('import-csv-btn');
    showEl('delete-event-btn');
  }
  if (!eventId) { document.getElementById('no-event').style.display = 'block'; return; }

  const { data: ev, error } = await db.from('events').select('*').eq('id', eventId).single();
  if (error || !ev) { document.getElementById('no-event').style.display = 'block'; return; }

  eventDays = ev.days || 1;
  // Store for stats use
  window._eventDays = eventDays;
  document.getElementById('event-ui').style.display = 'block';
  loadEventStats();
  document.getElementById('event-name').textContent = ev.name;
  document.getElementById('back-to-events-btn').style.display = 'inline-block';
  // Status-aware UI
  const evStatus = ev.status || 'Draft';
  applyStatusVisibility(evStatus);
  // Show status badge
  const badge = document.getElementById('event-status-badge');
  if (badge) {
    const sc = {Draft:['#888','#f0f0f0'],Open:['#FF5F00','#fff3ec'],Live:['#009444','#ecf7ee'],Closed:['#EB001B','#ffecea'],Archived:['#aaa','#f8f8f8']}[evStatus]||['#888','#f0f0f0'];
    badge.textContent = evStatus;
    badge.style.color = sc[0];
    badge.style.background = sc[1];
    badge.style.display = 'inline-block';
  }
  const evDisplayProg = (ev.program && ev.program !== 'Other') ? ev.program : null;
  document.getElementById('event-code-prog').textContent = [ev.event_code, evDisplayProg].filter(Boolean).join(' · ');
  document.getElementById('event-meta').textContent = [
    ev.organizer,
    ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : null,
    ev.days > 1 ? ev.days + ' days' : null
  ].filter(Boolean).join(' · ');
  document.title = ev.name + ' — Participants';

  await loadParticipants();
  // Render readiness checklist after participants are loaded
  renderReadinessChecklist(ev, allParticipants.length);
}

async function loadParticipants() {
  const [{ data: parts }, { data: att }] = await Promise.all([
    db.from('participants').select('*').eq('event_id', eventId).order('code', { ascending: true }),
    db.from('attendance').select('day').eq('event_id', eventId)
  ]);
  allParticipants = parts || [];
  // Build day counts
  window._attendanceByDay = {};
  (att || []).forEach(a => {
    window._attendanceByDay[a.day] = (window._attendanceByDay[a.day] || 0) + 1;
  });
  renderStats();
  // Data loaded — exports now have allParticipants available
}

async function updateUnsignedCount() {
  try {
    const today = new Date();
    const days = Array.from({ length: eventDays }, (_, i) => 'Day ' + (i + 1));
    // Find which day is today based on event date
    const { data: ev } = await db.from('events').select('event_date,days').eq('id', eventId).single();
    let currentDay = null;
    if (ev && ev.event_date) {
      const start = new Date(ev.event_date);
      for (let i = 0; i < (ev.days || 1); i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        if (d.toDateString() === today.toDateString()) { currentDay = 'Day ' + (i + 1); break; }
      }
    }
    if (!currentDay) currentDay = days[0];
    const signed = new Set((await db.from('attendance').select('participant_id').eq('event_id', eventId).eq('day', currentDay)).data?.map(a => a.participant_id) || []);
    const unsigned = allParticipants.filter(p => !signed.has(p.id)).length;
    const btn = document.querySelector('button[onclick="openUnsigned()"]');
    if (btn && unsigned > 0) btn.textContent = '⚠ Not Yet Signed (' + unsigned + ')';
  } catch(e) {}
}

function renderStats() {
  const total = allParticipants.length;
  const female = allParticipants.filter(p => p.sex === 'Female').length;
  const male = allParticipants.filter(p => p.sex === 'Male').length;
  // Count signed (any day)
  const signedCount = allParticipants.filter(p =>
    Object.values(attendanceByDay).some(set => set.has(p.id))
  ).length;

  let html = `<div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Registered</div></div>`;
  if (signedCount) html += `<div class="stat-card"><div class="stat-num">${signedCount}</div><div class="stat-label">Signed</div></div>`;
  if (female) html += `<div class="stat-card"><div class="stat-num">${female}</div><div class="stat-label">Female</div></div>`;
  if (male) html += `<div class="stat-card"><div class="stat-num">${male}</div><div class="stat-label">Male</div></div>`;

  // Per-day attendance stats — fetched separately
  if (window._attendanceByDay) {
    const numDays = window._eventDays || 1;
    Array.from({ length: numDays }, (_, i) => 'Day ' + (i + 1)).forEach(d => {
      const c = window._attendanceByDay[d] || 0;
      html += `<div class="stat-card"><div class="stat-num">${c}</div><div class="stat-label">${d}</div></div>`;
    });
  }
  const statsEl = document.getElementById('view-stats') || document.getElementById('stat-days');
  if (statsEl) statsEl.innerHTML = html;
}

function buildDaySelector() {
  const sel = document.getElementById('filter-day');
  if (!sel) return;
  sel.innerHTML = '';
  Array.from({ length: eventDays }, (_, i) => 'Day ' + (i + 1)).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    if (d === currentFilterDay) opt.selected = true;
    sel.appendChild(opt);
  });
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('filter-' + f).classList.add('active');
  // Show day selector only when filtering by signed status
  const daySelVisible = f !== 'all';
  const fdEl = document.getElementById('filter-day'); if (fdEl) fdEl.style.display = daySelVisible ? 'block' : 'none';
  filterParticipants();
}

function applyDayFilter() {
  const fdVal = document.getElementById('filter-day'); if (fdVal) currentFilterDay = fdVal.value;
  filterParticipants();
}

function filterParticipants() {
  const q = (document.getElementById('p-search').value || '').toLowerCase();
  if (!q) {
    document.getElementById('participants-list').innerHTML =
      '<div style="padding:2.5rem 1rem;text-align:center;color:var(--text-muted);font-size:13px">Type a name, code, or organisation to search.</div>';
    document.getElementById('list-count-label').textContent = '';
    return;
  }
  const filtered = allParticipants.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.org || '').toLowerCase().includes(q) ||
    (p.position_title || '').toLowerCase().includes(q) ||
    (p.code || '').toLowerCase().includes(q)
  );
  const container = document.getElementById('participants-list');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty">${allParticipants.length ? 'No results.' : 'No participants registered yet.'}</div>`;
    return;
  }
  let html = `<div style="overflow-x:auto"><table id="participants-table">
    <thead><tr>
      <th style="width:9%">Code</th>
      <th style="width:16%">Name</th>
      <th style="width:6%">Sex</th>
      <th style="width:16%">Organization</th>
      <th style="width:13%">Position</th>
      <th style="width:13%">Program</th>
      <th style="width:8%">Type</th>
      <th style="width:11%">Days Signed</th>
      <th style="width:8%">Signature</th>
    </tr></thead><tbody>`;
  filtered.forEach(p => {
    const pAtt = attendanceByDay;
    const daysSigned = Object.entries(pAtt)
      .filter(([, set]) => set.has(p.id))
      .map(([d]) => d).sort().join(', ') || '&mdash;';
    const sigLinks = Object.entries(pAtt)
      .filter(([, set]) => set.has(p.id))
      .map(([d]) => `<a href="#" style="font-size:10px;color:var(--orange)" onclick="viewSig('${p.id}','${d}',event)">${d}</a>`)
      .join(' ');
    let regTypeBadge;
    if (p.attendance_mode === 'online') {
      regTypeBadge = '<span style="background:#e8f4fd;color:#1565c0;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Online</span>';
    } else if (p.attendance_mode === 'in_person') {
      regTypeBadge = '<span style="background:#f0fff4;color:#2d6a4f;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">In-person</span>';
    } else if (p.reg_type === 'Walk-in') {
      regTypeBadge = '<span style="background:#fff3e8;color:var(--orange);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Same-day</span>';
    } else {
      regTypeBadge = '<span style="background:#f0f9f4;color:#005c2a;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Pre-reg</span>';
    }
    const sigUrl = BASE_URL + 'sign.html?participant=' + p.id + '&event=' + eventId + (new URLSearchParams(window.location.search).get('from') === 'admin' ? '&from=admin' : '');
    html += `<tr data-pid="${p.id}" data-url="${sigUrl}" style="cursor:pointer">
      <td style="font-weight:700;font-family:monospace;color:var(--orange)">${esc(p.code) || '&mdash;'}</td>
      <td style="font-weight:500">${esc(p.name)}</td>
      <td>${esc(p.sex) || '&mdash;'}</td>
      <td title="${esc(p.org)}">${esc(p.org)}</td>
      <td>${esc(p.position_title) || '&mdash;'}</td>
      <td>${esc(p.prog) || '&mdash;'}</td>
      <td>${regTypeBadge}</td>
      <td style="font-size:12px">${daysSigned}</td>
      <td style="font-size:11px">${sigLinks || '&mdash;'}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Event delegation — attach once to table body
  const tbody = container.querySelector('tbody');
  if (tbody) {
    tbody.addEventListener('click', e => {
      const row = e.target.closest('tr[data-pid]');
      if (row) openSignForm(row.dataset.pid);
    });
  }
}





function openSignForm(participantId) {
  window.location.href = BASE_URL + 'sign.html?participant=' + participantId + '&event=' + eventId;
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();


async function exportEventPDF() {
  const btn = document.getElementById('btn-export-pdf');
  if (btn) { btn.textContent = 'Building...'; btn.disabled = true; }
  try {
    const { jsPDF } = window.jspdf;
    const evName = document.getElementById('event-name').textContent;
    const evMeta = document.getElementById('event-meta').textContent;
    const MARGIN = 30;

    const [{ data: ev }, { data: attendance }] = await Promise.all([
      db.from('events').select('*').eq('id', eventId).single(),
      db.from('attendance').select('*').eq('event_id', eventId).order('signed_at', { ascending: true })
    ]);
    const numDays = ev?.days || 1;
    const dm = ev?.delivery_mode || 'in_person';
    const dmLabel = dm === 'online' ? 'ONLINE ONLY' : dm === 'hybrid' ? 'HYBRID' : 'IN-PERSON ONLY';
    const isHybrid = dm === 'hybrid';

    const attMap = {};
    (attendance || []).forEach(a => {
      if (!attMap[a.participant_id]) attMap[a.participant_id] = {};
      attMap[a.participant_id][a.day] = a;
    });

    async function urlToBase64(url) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch { return null; }
    }
    const sigCache = {};
    const urlsToFetch = [];
    allParticipants.forEach(p => {
      const days = attMap[p.id] || {};
      Object.values(days).forEach(a => {
        if (a.signature_url && !sigCache[a.signature_url]) urlsToFetch.push(a.signature_url);
      });
    });
    await Promise.all(urlsToFetch.map(async url => { sigCache[url] = await urlToBase64(url); }));

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header band — 64pt to fit 4 lines
    doc.setFillColor(235, 0, 27);   doc.rect(0, 0, pageW * 0.4, 64, 'F');
    doc.setFillColor(255, 95, 0);   doc.rect(pageW * 0.4, 0, pageW * 0.4, 64, 'F');
    doc.setFillColor(247, 158, 27); doc.rect(pageW * 0.8, 0, pageW * 0.2, 64, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text(evName, MARGIN, 18);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(dmLabel, MARGIN, 30);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    doc.text(evMeta, MARGIN, 41);

    // Count line — include In-person/Online breakdown for hybrid
    const inPersonCount = allParticipants.filter(p => p.attendance_mode === 'in_person').length;
    const onlineCount   = allParticipants.filter(p => p.attendance_mode === 'online').length;
    let countLine = 'Registered: ' + allParticipants.length + '   Signed: ' + Object.keys(attMap).length;
    if (isHybrid && (inPersonCount || onlineCount)) {
      countLine += '   In-person: ' + inPersonCount + '   Online: ' + onlineCount;
    }
    doc.text(countLine, MARGIN, 52);

    const dayLabels = Array.from({ length: numDays }, (_, i) => 'Day ' + (i + 1));

    // Columns — no Type column; Mode column added for hybrid only
    const FIXED_COLS = [
      { label: '#', w: 18 }, { label: 'Code', w: 38 }, { label: 'Name', w: 85 },
      { label: 'Sex', w: 24 }, { label: 'Organization', w: 90 },
      { label: 'Position', w: 75 }, { label: 'Program', w: 70 }
    ];
    if (isHybrid) FIXED_COLS.push({ label: 'Mode', w: 38 });

    const usable = pageW - MARGIN * 2 - FIXED_COLS.reduce((a,b) => a + b.w, 0);
    const dayW = Math.max(55, Math.floor(usable / numDays));
    const ALL_COLS = [...FIXED_COLS, ...dayLabels.map(d => ({ label: d, w: dayW }))];
    let cx = MARGIN;
    ALL_COLS.forEach(c => { c.x = cx; cx += c.w; });

    const SIG_H = 55;
    const TEXT_H = 20;

    function drawHeaderRow(y) {
      doc.setFillColor(0, 0, 0);
      doc.rect(MARGIN, y, pageW - MARGIN * 2, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      ALL_COLS.forEach(c => doc.text(c.label, c.x + 2, y + 9.5));
      doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.4);
      ALL_COLS.forEach((c, ci) => { if (ci > 0) doc.line(c.x, y, c.x, y + 14); });
    }

    function trunc(s, n) { s = s||''; return s.length > n ? s.slice(0,n-1)+'…' : s; }

    drawHeaderRow(68);
    let y = 82;

    for (let idx = 0; idx < allParticipants.length; idx++) {
      const p = allParticipants[idx];
      const pAtt = attMap[p.id] || {};
      const hasSig = Object.values(pAtt).some(a => a.signature_url && sigCache[a.signature_url]);
      const rowH = hasSig ? SIG_H : TEXT_H;

      if (y + rowH > pageH - 20) {
        doc.addPage();
        y = 14;
        drawHeaderRow(y); y += 14;
      }

      doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 249);
      doc.rect(MARGIN, y, pageW - MARGIN * 2, rowH, 'F');
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
      doc.rect(MARGIN, y, pageW - MARGIN * 2, rowH, 'S');
      doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.3);
      ALL_COLS.forEach((c, ci) => { if (ci > 0) doc.line(c.x, y, c.x, y + rowH); });

      const ty = y + (rowH > TEXT_H ? 8 : 13);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(0,0,0); doc.text(String(idx+1), FIXED_COLS[0].x+2, ty);
      doc.setTextColor(255,95,0); doc.setFont('helvetica','bold');
      doc.text(trunc(p.code||'—',10), FIXED_COLS[1].x+2, ty);
      doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');
      doc.text(trunc(p.name||'',22), FIXED_COLS[2].x+2, ty);
      doc.text(trunc(p.sex||'—',6), FIXED_COLS[3].x+2, ty);
      doc.text(trunc(p.org||'',24), FIXED_COLS[4].x+2, ty);
      doc.text(trunc(p.position_title||'',20), FIXED_COLS[5].x+2, ty);
      doc.text(trunc(p.prog||'',18), FIXED_COLS[6].x+2, ty);

      // Mode column (hybrid only)
      if (isHybrid) {
        const modeText = p.attendance_mode === 'online' ? 'Online' : 'In-person';
        doc.setTextColor(p.attendance_mode === 'online' ? 21 : 45, p.attendance_mode === 'online' ? 101 : 106, p.attendance_mode === 'online' ? 192 : 79);
        doc.text(modeText, FIXED_COLS[7].x+2, ty);
      }

      // Day signature columns
      dayLabels.forEach(dl => {
        const dc = ALL_COLS.find(c => c.label === dl);
        const att = pAtt[dl];
        if (att?.signature_url && sigCache[att.signature_url]) {
          try {
            doc.addImage(sigCache[att.signature_url],'PNG', dc.x+2, y+2, dc.w-4, rowH-4);
          } catch { doc.setFontSize(6); doc.setTextColor(180,180,180); doc.text('[err]',dc.x+2,ty); }
        } else {
          doc.setDrawColor(230,230,230);
          doc.rect(dc.x+2, y+2, dc.w-4, rowH-4);
        }
      });
      doc.setTextColor(0,0,0);
      y += rowH;
    }

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5); doc.setTextColor(150,150,150);
      doc.text('Page '+i+' of '+pages+'  ·  '+evName, MARGIN, pageH-10);
    }

    doc.save('attendance-'+evName.replace(/\s+/g,'-')+'-'+new Date().toISOString().slice(0,10)+'.pdf');
  } catch(e) {
    alert('PDF export failed: ' + e.message);
    console.error(e);
  } finally {
    if (btn) { btn.textContent = '📄 Export PDF'; btn.disabled = false; }
  }
}

function openUnsigned() {
  window.location.href = BASE_URL + 'unsigned.html?event=' + eventId;
}

async function exportEventQRSheet() {
  const btn = document.getElementById('qr-sheet-btn');
  if (btn) { btn.textContent = 'Building...'; btn.disabled = true; }
  try {
    const { jsPDF } = window.jspdf;
    const evName = document.getElementById('event-name').textContent;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const MARGIN = 30;

    doc.setFillColor(235, 0, 27);   doc.rect(0, 0, W * 0.4, 40, 'F');
    doc.setFillColor(255, 95, 0);   doc.rect(W * 0.4, 0, W * 0.35, 40, 'F');
    doc.setFillColor(247, 158, 27); doc.rect(W * 0.75, 0, W * 0.25, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(evName, MARGIN, 18);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Participant QR Codes  ·  Scan to sign attendance', MARGIN, 32);

    const BASE = window.location.origin + window.location.pathname.replace('event.html', '');
    const COLS = 3;
    const CELL_W = (W - MARGIN * 2) / COLS;
    const QR_SIZE = 90;
    const CELL_H = QR_SIZE + 55;
    let x = MARGIN, y = 55, col = 0;

    for (const p of allParticipants) {
      const signUrl = BASE + 'sign.html?participant=' + p.id + '&event=' + eventId;
      const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=' + QR_SIZE + 'x' + QR_SIZE + '&data=' + encodeURIComponent(signUrl);
      const qrDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = QR_SIZE; c.height = QR_SIZE;
          c.getContext('2d').drawImage(img, 0, 0, QR_SIZE, QR_SIZE);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = qrApiUrl;
      });

      if (y + CELL_H > H - 20) { doc.addPage(); y = 20; }

      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x + 4, y + 2, CELL_W - 8, CELL_H - 4, 6, 6, 'FD');
      doc.addImage(qrDataUrl, 'PNG', x + (CELL_W - QR_SIZE) / 2, y + 8, QR_SIZE, QR_SIZE);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.setTextColor(255, 95, 0);
      doc.text(p.code || '—', x + CELL_W / 2, y + QR_SIZE + 20, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text((p.name||'').slice(0,22), x + CELL_W / 2, y + QR_SIZE + 33, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text((p.org||'').slice(0,25), x + CELL_W / 2, y + QR_SIZE + 44, { align: 'center' });

      col++;
      if (col >= COLS) { col = 0; x = MARGIN; y += CELL_H; } else { x += CELL_W; }
    }

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5); doc.setTextColor(150, 150, 150);
      doc.text('Page ' + i + ' of ' + pages + '  ·  ' + evName, MARGIN, H - 10);
    }

    doc.save('qr-codes-' + evName.replace(/\s+/g, '-') + '.pdf');
  } catch(e) { alert('QR export failed: ' + e.message); }
  finally { if (btn) { btn.textContent = 'Export QR Sheet'; btn.disabled = false; } }
}

// ── Admin password modal ──
let _adminAction = null;

function promptAdminAction(action) {
  _adminAction = action;
  const modal = document.getElementById('admin-pwd-modal');
  if (modal) {
    document.getElementById('admin-pwd-input').value = '';
    document.getElementById('admin-pwd-err').textContent = '';
    modal.style.display = 'flex';
    document.getElementById('admin-pwd-input').focus();
  }
}

function promptEditEvent() { promptAdminAction('edit'); }
function promptDeleteEvent() { promptAdminAction('delete'); }

function closeAdminPwd() {
  document.getElementById('admin-pwd-modal').style.display = 'none';
  _adminAction = null;
}

async function checkAdminPwd() {
  const pwd = document.getElementById('admin-pwd-input').value;
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd.toUpperCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  if (hashHex !== '3b33a25d09dbd7a9f00296a32852e0cb064eaaa76d4294c370b1b6da15ebb0bc') {
    const errEl = document.getElementById('admin-pwd-err');
    const input = document.getElementById('admin-pwd-input');
    errEl.textContent = 'Incorrect password. Try again.';
    errEl.style.display = 'block';
    input.value = '';
    input.style.borderColor = '#EB001B';
    input.style.animation = 'shake 0.4s ease';
    setTimeout(() => { input.style.animation = ''; input.style.borderColor = ''; input.focus(); }, 500);
    return;
  }
  const action = _adminAction; // save before closeAdminPwd clears it
  closeAdminPwd();
  if (action === 'edit')      editEvent();
  else if (action === 'delete')    deleteEventFromPage();
  else if (action === 'back')      goBackToEvents();
  else if (action === 'editparts') toggleParticipantList();
  else if (action === 'certs')     openCertificatePicker(eventId);
  else if (action === 'cert-preview') openCertificatePicker(eventId);
}

// ── Manage zone functions (admin only) ──
async function editEvent() {
  window.location.href = BASE_URL + 'edit-event.html?event=' + eventId;
}

async function saveInlineEdit() {
  const name = document.getElementById('ie-name').value.trim();
  if (!name) { document.getElementById('ie-err').textContent = 'Event name required.'; document.getElementById('ie-err').style.display = 'block'; return; }
  const btn = document.querySelector('#inline-edit-modal button');
  btn.textContent = 'Saving...'; btn.disabled = true;
  const { error } = await db.from('events').update({
    name,
    organizer: document.getElementById('ie-organizer').value.trim() || null,
    event_date: document.getElementById('ie-date').value || null,
    days: parseInt(document.getElementById('ie-days').value) || 1,
    event_code: document.getElementById('ie-code').value.trim() || null,
    signatory_name: document.getElementById('ie-sig-name').value.trim() || null,
    signatory_title: document.getElementById('ie-sig-title').value.trim() || null,
  }).eq('id', eventId);
  if (error) { document.getElementById('ie-err').textContent = 'Error: ' + error.message; document.getElementById('ie-err').style.display = 'block'; btn.textContent = 'Save Changes'; btn.disabled = false; return; }
  document.getElementById('inline-edit-modal').remove();
  init(); // reload page data
}

function importCSV() {
  // Open admin panel and trigger import for this event
  const adminUrl = BASE_URL + 'admin.html?importEvent=' + eventId;
  window.location.href = adminUrl;
}

function copyShareLink(type) {
  let url;
  if (type === 'prereg') url = BASE_URL + 'index.html?event=' + eventId;
  else if (type === 'walkin') url = BASE_URL + 'index.html?event=' + eventId + '&walkin=1';
  else if (type === 'view') url = BASE_URL + 'event.html?event=' + eventId;
  else if (type === 'checkin') url = BASE_URL + 'checkin.html?event=' + eventId;
  else if (type === 'self-inperson') url = BASE_URL + 'register.html?event=' + eventId + '&signin=1&mode=in_person';
  else if (type === 'self-online') url = BASE_URL + 'register.html?event=' + eventId + '&signin=1&mode=online';

  const btnIdMap = {
    'prereg': 'btn-prereg-link', 'walkin': 'btn-walkin',
    'self-inperson': 'btn-self-sign-inperson', 'self-online': 'btn-self-sign-online'
  };
  const btn = document.getElementById(btnIdMap[type] || ('share-' + type + '-btn'));
  const orig = btn ? btn.textContent : '';
  navigator.clipboard.writeText(url).then(() => {
    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = orig, 2000); }
  });
}

async function deleteEventFromPage() {
  if (!confirm('Delete this event and all its participants? This cannot be undone.')) return;
  const { error } = await db.from('events').delete().eq('id', eventId);
  if (!error) window.location.href = BASE_URL + 'admin.html';
  else alert('Delete failed: ' + error.message);
}

// ── Participant list toggle ──
function toggleParticipantList() {
  window.location.href = BASE_URL + 'edit-participants.html?event=' + eventId;
}

// ── Check-in QR on Participants page ──
function showEventCheckinQR() {
  const evName = document.getElementById('event-name').textContent;
  document.getElementById('ev-qr-event-name').textContent = evName;
  const url = BASE_URL + 'checkin.html?event=' + eventId;
  const canvas = document.getElementById('ev-checkin-qr-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 220; canvas.height = 220;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,220,220);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => ctx.drawImage(img, 0, 0, 220, 220);
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url);
  document.getElementById('checkin-qr-modal-ev').style.display = 'flex';
}

function downloadEvCheckinQR() {
  const canvas = document.getElementById('ev-checkin-qr-canvas');
  const evName = document.getElementById('event-name').textContent;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'checkin-qr-' + evName.replace(/\s+/g,'-') + '.png';
  a.click();
}


