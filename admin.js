const SUPABASE_URL = 'https://cpqhljqwxjgscdoepant.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcWhsanF3eGpnc2Nkb2VwYW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTM1NTcsImV4cCI6MjA5Mzc4OTU1N30.XATDTbvL7iDrsn-Si0crJWZebw5FSx0weWRmmcL2Z7c';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_URL = window.location.origin + window.location.pathname.replace('admin.html', '');

let currentEventId = null;
let currentParticipants = [];
let currentEventDays = 1;
let currentAttendance = {};

function showPane(name) {
  ['create','link','events','participants','edit'].forEach(p => {
    const el = document.getElementById('pane-' + p);
    if (el) el.style.display = p === name ? 'block' : 'none';
  });
  // Show back button only when not on events pane
  const backBtn = document.getElementById('admin-back-btn');
  const dashBtn = document.getElementById('admin-dashboard-btn');
  const newBtn  = document.getElementById('admin-new-btn');
  if (backBtn) backBtn.style.display = name !== 'events' ? 'inline-flex' : 'none';
  if (dashBtn) dashBtn.style.display = name !== 'events' ? 'none' : 'inline-flex';
  if (newBtn)  newBtn.style.display  = name !== 'events' ? 'none' : 'inline-flex';
  if (name === 'events') loadEvents();
}

function val(id) { return document.getElementById(id).value.trim(); }

async function submitEvent() {
  const errEl = document.getElementById('e-err');
  try {
    const name = val('e-name');
    if (!name) { errEl.textContent = 'Event name is required.'; errEl.style.display = 'inline'; return; }
    errEl.style.display = 'none';

    const btn = document.querySelector('#pane-create .btn-primary');
    btn.textContent = 'Creating...'; btn.disabled = true;

    const progVal = document.getElementById('e-prog').value;
    const progOther = val('e-prog-other');
    const finalProg = (progVal === 'Other' && progOther) ? progOther : (progVal || null);
    const rawCode = val('e-code');
    const sigName = val('e-signatory-name');
    const sigTitle = val('e-signatory-title');
    const melReq = document.getElementById('e-mel-required') ? document.getElementById('e-mel-required').value === 'true' : false;

    const { data, error } = await db.from('events').insert([{
      name,
      organizer: val('e-organizer') || null,
      program: finalProg,
      event_date: document.getElementById('e-date').value || null,
      days: parseInt(document.getElementById('e-days').value) || 1,
      mel_question: val('e-mel') || null,
      mel_question_required: melReq,
      event_code: rawCode ? rawCode.toUpperCase() : null,
      signatory_name: sigName || null,
      signatory_title: sigTitle || null,
      status: document.getElementById('e-status') ? document.getElementById('e-status').value : 'Draft',
      certificate_eligibility: document.getElementById('e-cert-eligibility') ? document.getElementById('e-cert-eligibility').value : 'signed_once',
      delivery_mode: document.getElementById('e-delivery-mode') ? document.getElementById('e-delivery-mode').value : 'in_person'
    }]).select();

    btn.textContent = 'Create event'; btn.disabled = false;

    if (error) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'inline'; return; }
    if (!data || !data.length) { errEl.textContent = 'No data returned.'; errEl.style.display = 'inline'; return; }

    // Capture sig file BEFORE clearing form
    const sigFile = document.getElementById('e-signatory-sig').files[0];

    ['e-name','e-organizer','e-date','e-mel','e-code','e-prog-other','e-signatory-name','e-signatory-title','e-signatory-sig'].forEach(id => document.getElementById(id).value = '');
    setMelRequired('e', false);
    document.getElementById('e-mel-required-group').style.display = 'none';
    document.getElementById('e-prog').selectedIndex = 0;
    document.getElementById('e-days').selectedIndex = 0;
    document.getElementById('e-prog-other-group').style.display = 'none';
    if (sigFile && data[0]) {
      const path = 'signatories/' + data[0].id + '.' + sigFile.name.split('.').pop();
      const { error: upErr } = await db.storage.from('signatures').upload(path, sigFile, { contentType: sigFile.type, upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = db.storage.from('signatures').getPublicUrl(path);
        await db.from('events').update({ signatory_signature_url: publicUrl }).eq('id', data[0].id);
      }
    }

    if (typeof logAudit === 'function') logAudit('event_created', 'event', data[0].id, { name: data[0].name, status: data[0].status || 'Draft' });
    document.getElementById('share-link').textContent = BASE_URL + 'index.html?event=' + data[0].id;
    showPane('link');
  } catch(e) {
    errEl.textContent = 'Unexpected error: ' + e.message; errEl.style.display = 'inline';
  }
}

function copyLink() {
  const link = document.getElementById('share-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.querySelector('#pane-link .btn-sm');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

async function loadEvents() {
  document.getElementById('events-loading').style.display = 'block';
  document.getElementById('events-list').style.display = 'none';

  const { data: events } = await db.from('events').select('*').order('created_at', { ascending: false });
  const { data: counts } = await db.from('participants').select('event_id');

  const countMap = {};
  (counts || []).forEach(p => { countMap[p.event_id] = (countMap[p.event_id] || 0) + 1; });

  document.getElementById('events-loading').style.display = 'none';
  document.getElementById('events-list').style.display = 'block';

  if (!events || !events.length) {
    document.getElementById('events-list').innerHTML = '<div class="empty">No events yet. Create your first event.</div>';
    return;
  }

  let html = '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;box-shadow:0 1px 6px rgba(0,0,0,0.06)">';
  events.forEach((e, i) => {
    const count = countMap[e.id] || 0;
    html += renderEventCard(e, count, i);
  });
  html += '</div>';
  if (!events.length) html = '<div class="empty" style="padding:2rem;text-align:center;color:#aaa">No events yet. Create your first event.</div>';
  document.getElementById('events-list').innerHTML = html;
}

function copyEventLink(id, type, btn) {
  let url;
  if (type === 'view') url = BASE_URL + 'event.html?event=' + id;
  else if (type === 'walkin') url = BASE_URL + 'index.html?event=' + id + '&walkin=1';
  else url = BASE_URL + 'index.html?event=' + id;
  navigator.clipboard.writeText(url).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

async function deleteEvent(id) {
  if (!confirm('Delete this event and all its participants? This cannot be undone.')) return;
  await db.from('participants').delete().eq('event_id', id);
  await db.from('events').delete().eq('id', id);
  loadEvents();
}





async function viewParticipants(eventId, eventName) {
  window.location.href = BASE_URL + 'event.html?event=' + eventId + '&from=admin';
  return;
  currentEventId = eventId;
  document.getElementById('view-event-name').textContent = eventName;
  showPane('participants');

  const [{ data: parts }, { data: ev }] = await Promise.all([
    db.from('participants').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
    db.from('events').select('days').eq('id', eventId).single()
  ]);
  currentParticipants = parts || [];
  currentEventDays = ev?.days || 1;
  currentAttendance = {};
  try {
    const { data: att } = await db.from('attendance').select('*').eq('event_id', eventId);
    (att || []).forEach(a => {
      if (!currentAttendance[a.participant_id]) currentAttendance[a.participant_id] = [];
      currentAttendance[a.participant_id].push(a);
    });
  } catch(e) { console.warn('Attendance table not available:', e.message); }
  renderStats();
  filterParticipants();
}

function renderStats() {
  const total = currentParticipants.length;
  const female = currentParticipants.filter(p => p.sex === 'Female').length;
  const male = currentParticipants.filter(p => p.sex === 'Male').length;

  // Count attendance per day from attendance table
  const dayCounts = {};
  Object.values(currentAttendance).forEach(records => {
    records.forEach(a => { dayCounts[a.day] = (dayCounts[a.day] || 0) + 1; });
  });
  const totalSigned = Object.values(currentAttendance).filter(r => r.length > 0).length;

  let html = `<div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Registered</div></div>`;
  if (totalSigned) html += `<div class="stat-card"><div class="stat-num">${totalSigned}</div><div class="stat-label">Signed</div></div>`;
  if (female) html += `<div class="stat-card"><div class="stat-num">${female}</div><div class="stat-label">Female</div></div>`;
  if (male) html += `<div class="stat-card"><div class="stat-num">${male}</div><div class="stat-label">Male</div></div>`;
  // Only show days within the event's configured day count
  const validDays = Array.from({ length: currentEventDays }, (_, i) => 'Day ' + (i + 1));
  validDays.forEach(d => {
    const c = dayCounts[d] || 0;
    html += `<div class="stat-card"><div class="stat-num">${c}</div><div class="stat-label">${d}</div></div>`;
  });
  document.getElementById('view-stats').innerHTML = html;
}

function filterParticipants() {
  const q = (document.getElementById('p-search').value || '').toLowerCase();
  const filtered = currentParticipants.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.org.toLowerCase().includes(q) ||
    (p.position_title || '').toLowerCase().includes(q) ||
    (p.prog || '').toLowerCase().includes(q) ||
    (p.code || '').toLowerCase().includes(q)
  );
  const container = document.getElementById('participants-list');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty">${currentParticipants.length ? 'No results.' : 'No participants registered yet.'}</div>`;
    return;
  }
  let html = `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th style="width:11%">Code</th>
      <th style="width:22%">Name</th>
      <th style="width:7%">Sex</th>
      <th style="width:20%">Organization</th>
      <th style="width:17%">Position</th>
      <th style="width:13%">Program</th>
      <th style="width:10%">Type</th>
    </tr></thead><tbody>`;
  filtered.forEach(p => {
    const att = currentAttendance[p.id] || [];
    const regTypeBadge = p.reg_type === 'Walk-in'
      ? '<span style="background:#fff3e8;color:var(--orange);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Walk-in</span>'
      : '<span style="background:#f0f9f4;color:#005c2a;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Pre-reg</span>';
    html += `<tr data-pid="${p.id}" style="cursor:pointer">
      <td style="font-weight:700;font-family:monospace;color:var(--orange)">${esc(p.code) || '&mdash;'}</td>
      <td title="${esc(p.name)}" style="font-weight:500">${esc(p.name)}</td>
      <td>${esc(p.sex) || '&mdash;'}</td>
      <td title="${esc(p.org)}">${esc(p.org)}</td>
      <td>${esc(p.position_title) || '&mdash;'}</td>
      <td>${esc(p.prog) || '&mdash;'}</td>
      <td>${regTypeBadge}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Event delegation for row clicks → open sign form
  const tbody = container.querySelector('tbody');
  if (tbody) {
    tbody.addEventListener('click', e => {
      const row = e.target.closest('tr[data-pid]');
      if (row) {
        window.location.href = BASE_URL + 'sign.html?participant=' + row.dataset.pid + '&event=' + currentEventId;
      }
    });
  }
}

async function exportCSV() {
  const { data: attendance } = await db.from('attendance')
    .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });

  const attMap = {};
  (attendance || []).forEach(a => {
    if (!attMap[a.participant_id]) attMap[a.participant_id] = [];
    attMap[a.participant_id].push(a);
  });

  // Wrap plain text values in quotes, escaping internal quotes
  function q(v) { return '"' + (v || '').toString().replace(/"/g, '""') + '"'; }

  const headers = ['Code','Name','Sex','Organization','Program','Position','Registration Type',
    'Email','Phone','Signed','Days Signed','Signed At',
    'Signature Image (Sheets)','Signature URL','MEL Response','Registered'];

  const rows = currentParticipants.map(p => {
    const att = attMap[p.id] || [];
    const daysSigned = att.map(a => a.day).join('; ');
    const signedAt = att.map(a => a.signed_at ? new Date(a.signed_at).toLocaleString() : '').join('; ');
    const lastSigUrl = (att.filter(a => a.signature_url).slice(-1)[0] || {}).signature_url || '';
    const allUrls = att.filter(a => a.signature_url).map(a => a.signature_url).join('; ');

    // Quoted formula cell — Google Sheets reads =IMAGE("url") and renders signature inline
    const imageCell = lastSigUrl ? '"=IMAGE(\""' + lastSigUrl + '\"")"' : '""';

    return [
      q(p.code), q(p.name), q(p.sex), q(p.org), q(p.prog), q(p.position_title),
      q(p.reg_type || 'Pre-registration'),
      q(p.email), q(p.phone),
      q(att.length > 0 ? 'Yes' : 'No'),
      q(daysSigned), q(signedAt),
      imageCell,
      q(allUrls),
      q(p.notes), q(p.created_at)
    ].join(',');
  });

  const csv = [headers.map(h => '"' + h + '"').join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'participants-' + document.getElementById('view-event-name').textContent.replace(/\s+/g,'-') + '-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

showPane('events');

// Auto-open import if triggered from Participants page
const _importParam = new URLSearchParams(window.location.search).get('importEvent');
if (_importParam) {
  setTimeout(async () => {
    const { data: ev } = await db.from('events').select('id,name').eq('id', _importParam).single();
    if (ev) openImportForEvent(ev.id, ev.name);
  }, 800);
}

function openEdit(e) {
  document.getElementById('edit-id').value = e.id;
  document.getElementById('edit-name').value = e.name || '';
  document.getElementById('edit-organizer').value = e.organizer || '';
  document.getElementById('edit-date').value = e.event_date || '';
  document.getElementById('edit-mel').value = e.mel_question || '';
  document.getElementById('edit-signatory-name').value = e.signatory_name || '';
  document.getElementById('edit-signatory-title').value = e.signatory_title || '';
  const sigCurrent = document.getElementById('edit-signatory-current');
  sigCurrent.textContent = e.signatory_signature_url ? 'Current signature on file ✓' : 'No signature uploaded yet';
  toggleMelRequired('edit');
  if (e.mel_question_required) setMelRequired('edit', true);
  else setMelRequired('edit', false);
  document.getElementById('edit-code').value = e.event_code || '';
  const ep = document.getElementById('edit-prog');
  ep.value = e.program || '';
  document.getElementById('edit-prog-other-group').style.display = (e.program && !['AYAW','FIRST+II','BIA','FILMA','MCF'].includes(e.program)) ? 'block' : 'none';
  document.getElementById('edit-prog-other').value = (e.program && !['AYAW','FIRST+II','BIA','FILMA','MCF'].includes(e.program)) ? e.program : '';
  const _dmSel = document.getElementById('edit-delivery-mode');
  if (_dmSel) _dmSel.value = e.delivery_mode || 'in_person';

  const progSel = document.getElementById('edit-prog');
  progSel.value = e.program || '';

  const daysSel = document.getElementById('edit-days');
  daysSel.value = String(e.days || 1);

  document.getElementById('edit-err').style.display = 'none';
  ['create','link','events','participants','edit'].forEach(p => {
    document.getElementById('pane-' + p).style.display = p === 'edit' ? 'block' : 'none';
  });
}

async function saveEdit() {
  const errEl = document.getElementById('edit-err');
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { errEl.textContent = 'Event name is required.'; errEl.style.display = 'inline'; return; }

  // Warn if days are being reduced
  const editId = document.getElementById('edit-id').value;
  const { data: currentEv } = await db.from('events').select('days').eq('id', editId).single();
  const newDays = parseInt(document.getElementById('edit-days').value) || 1;
  if (currentEv && newDays < (currentEv.days || 1)) {
    const ok = confirm(
      'Reducing days from ' + (currentEv.days || 1) + ' to ' + newDays + '.\n\n' +
      'Attendance records for Day ' + (newDays + 1) + ' and above will no longer appear in exports or sign-in, but data is not deleted.\n\nProceed?'
    );
    if (!ok) return;
  }

  const btn = document.querySelector('#pane-edit .btn-primary');
  btn.textContent = 'Saving...'; btn.disabled = true;

  const { error } = await db.from('events').update({
    name,
    organizer: document.getElementById('edit-organizer').value.trim() || null,
    program: getProgram('edit-prog', 'edit-prog-other'),
    event_date: document.getElementById('edit-date').value || null,
    days: parseInt(document.getElementById('edit-days').value) || 1,
    mel_question: document.getElementById('edit-mel').value.trim() || null,
    mel_question_required: document.getElementById('edit-mel-required').value === 'true',
    signatory_name: document.getElementById('edit-signatory-name').value.trim() || null,
    signatory_title: document.getElementById('edit-signatory-title').value.trim() || null,
    event_code: document.getElementById('edit-code').value.trim().toUpperCase() || null,
    delivery_mode: (document.getElementById('edit-delivery-mode') ? document.getElementById('edit-delivery-mode').value : null) || 'in_person'
  }).eq('id', document.getElementById('edit-id').value);

  btn.textContent = 'Save changes'; btn.disabled = false;

  if (error) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'inline'; return; }
  showPane('events');
}

async function fetchAndEdit(id) {
  const { data, error } = await db.from('events').select('*').eq('id', id).single();
  if (error || !data) { alert('Could not load event.'); return; }
  openEdit(data);
}

function openRegLink() {
  window.location.href = BASE_URL + 'index.html?event=' + currentEventId;
}

function openWalkinLink() {
  window.location.href = BASE_URL + 'index.html?event=' + currentEventId + '&walkin=1';
}

function openViewLink() {
  window.location.href = BASE_URL + 'event.html?event=' + currentEventId;
}

function toggleGuide() {
  const box = document.getElementById('guide-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function toggleOther(selectId, groupId) {
  const val = document.getElementById(selectId).value;
  document.getElementById(groupId).style.display = val === 'Other' ? 'block' : 'none';
}

function getProgram(selectId, otherId) {
  const val = document.getElementById(selectId).value;
  if (val === 'Other') {
    const other = document.getElementById(otherId).value.trim();
    return other || null;  // null if no name specified — don't save "Other"
  }
  return val || null;
}

async function generateEventCode(inputId) {
  const manual = document.getElementById(inputId).value.trim().toUpperCase();
  if (manual) return manual;
  // Auto-generate: EVT + 3-digit sequence
  const { data } = await db.from('events').select('event_code').not('event_code', 'is', null);
  const nums = (data || []).map(e => {
    const m = (e.event_code || '').match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return 'EVT-' + String(next).padStart(3, '0');
}

async function exportPDF() {
  const btn = document.querySelector('[onclick="exportPDF()"]');
  const origText = btn.textContent;
  btn.textContent = 'Building PDF...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const eventName = document.getElementById('view-event-name').textContent;
    const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

    // Fetch attendance for this event
    const { data: attendance } = await db.from('attendance')
      .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });
    const attMap = {};
    (attendance || []).forEach(a => {
      if (!attMap[a.participant_id]) attMap[a.participant_id] = [];
      attMap[a.participant_id].push(a);
    });

    // Fetch signature images as base64
    async function urlToBase64(url) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch { return null; }
    }

    // Header
    doc.setFillColor(235, 0, 27); // MCF red
    doc.rect(0, 0, 297, 18, 'F');
    doc.setFillColor(243, 112, 33); // MCF orange
    doc.rect(100, 0, 197, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(eventName, 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Attendance Register · Exported ' + today, 14, 16);
    doc.setTextColor(0, 0, 0);

    // Stats row
    const total = currentParticipants.length;
    const signed = Object.keys(attMap).length;
    const female = currentParticipants.filter(p => p.sex === 'Female').length;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total registered: ${total}   Signed: ${signed}   Female: ${female}   Male: ${total - female}`, 14, 24);

    // Table — one row per participant, signature embedded
    const tableRows = [];
    for (const p of currentParticipants) {
      const att = attMap[p.id] || [];
      const daysSigned = att.map(a => a.day).join(', ') || '—';
      const sigUrl = (att.filter(a => a.signature_url).slice(-1)[0] || {}).signature_url || null;
      tableRows.push({
        code: p.code || '—',
        name: p.name,
        sex: p.sex || '—',
        org: p.org || '—',
        position: p.position_title || '—',
        type: p.reg_type || 'Pre-registration',
        days: daysSigned,
        sigUrl
      });
    }

    // Build autotable without signature column first to get row positions
    doc.autoTable({
      startY: 28,
      head: [['Code','Name','Sex','Organization','Position','Type','Days Signed','Signature']],
      body: tableRows.map(r => [r.code, r.name, r.sex, r.org, r.position, r.type, r.days, '']),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 112, 33], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 248, 244] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 40 },
        2: { cellWidth: 12 },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 38 }
      },
      rowPageBreak: 'avoid',
      didDrawCell: async (data) => {
        // Signatures are added after table draw (see below)
      }
    });

    // Embed signature images into signature column cells
    // Re-draw with images using didDrawPage callback approach
    // Collect cell positions from a second pass
    const sigColIndex = 7;
    const cellPositions = [];

    doc.autoTable({
      startY: 28,
      head: [['Code','Name','Sex','Organization','Position','Type','Days Signed','Signature']],
      body: tableRows.map(r => [r.code, r.name, r.sex, r.org, r.position, r.type, r.days, '']),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 112, 33], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 248, 244] },
      columnStyles: {
        0: { cellWidth: 18 }, 1: { cellWidth: 40 }, 2: { cellWidth: 12 },
        3: { cellWidth: 45 }, 4: { cellWidth: 35 }, 5: { cellWidth: 22 },
        6: { cellWidth: 22 }, 7: { cellWidth: 38 }
      },
      rowPageBreak: 'avoid',
      didDrawCell: (data) => {
        if (data.column.index === sigColIndex && data.section === 'body') {
          cellPositions.push({
            rowIndex: data.row.index,
            x: data.cell.x, y: data.cell.y,
            w: data.cell.width, h: data.cell.height,
            pageNumber: data.pageNumber || 1
          });
        }
      }
    });

    // Fetch and embed signatures
    btn.textContent = 'Embedding signatures...';
    for (const pos of cellPositions) {
      const row = tableRows[pos.rowIndex];
      if (!row || !row.sigUrl) continue;
      const b64 = await urlToBase64(row.sigUrl);
      if (!b64) continue;
      doc.setPage(pos.pageNumber);
      const padding = 1;
      doc.addImage(b64, 'PNG',
        pos.x + padding, pos.y + padding,
        pos.w - padding * 2, pos.h - padding * 2
      );
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Page ' + i + ' of ' + pageCount + '  ·  Participant Reg App', 14, doc.internal.pageSize.height - 5);
    }

    doc.save('attendance-register-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');

  } catch(e) {
    alert('PDF export failed: ' + e.message);
    console.error(e);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ── PDF Export (admin) ──
async function exportPDF() {
  const btn = [...document.querySelectorAll('.btn-secondary')].find(b => b.textContent === 'Export PDF');
  if (btn) { btn.textContent = 'Building PDF...'; btn.disabled = true; }
  try {
    const { jsPDF } = window.jspdf;
    const eventName = document.getElementById('view-event-name').textContent;

    const { data: ev } = await db.from('events').select('*').eq('id', currentEventId).single();
    const numDays = ev ? (ev.days || 1) : 1;

    const { data: attendance } = await db.from('attendance')
      .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });
    const attMap = {};
    (attendance || []).forEach(a => {
      if (!attMap[a.participant_id]) attMap[a.participant_id] = {};
      attMap[a.participant_id][a.day] = a;
    });

    // Pre-fetch signatures
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
    currentParticipants.forEach(p => {
      const days = attMap[p.id] || {};
      Object.values(days).forEach(a => {
        if (a.signature_url && !sigCache[a.signature_url]) urlsToFetch.push(a.signature_url);
      });
    });
    await Promise.all(urlsToFetch.map(async url => { sigCache[url] = await urlToBase64(url); }));

    const SIG_H = 22; // row height in points for rows with signatures
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const MARGIN = 30;

    // Header band
    doc.setFillColor(235, 0, 27);
    doc.rect(0, 0, pageW * 0.4, 50, 'F');
    doc.setFillColor(243, 112, 33);
    doc.rect(pageW * 0.4, 0, pageW * 0.4, 50, 'F');
    doc.setFillColor(247, 158, 27);
    doc.rect(pageW * 0.8, 0, pageW * 0.2, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(eventName, MARGIN, 22);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Attendance Register  ·  ' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }), MARGIN, 36);
    doc.text('Registered: ' + currentParticipants.length + '   Signed: ' + Object.keys(attMap).length, MARGIN, 47);

    // Day labels for columns
    const dayLabels = Array.from({ length: numDays }, (_, i) => 'Day ' + (i + 1));

    // Build head row
    const fixedHead = ['#','Code','Name','Sex','Organization','Position','Program','Type'];
    const head = [...fixedHead, ...dayLabels];

    // Fixed column widths in pts
    const fixedWidths = [20, 40, 90, 28, 90, 80, 70, 42];
    const usable = pageW - MARGIN * 2 - fixedWidths.reduce((a,b) => a+b, 0);
    const dayW = Math.max(55, Math.floor(usable / numDays));

    const colWidths = [...fixedWidths, ...dayLabels.map(() => dayW)];

    // Build body — text cells only; we draw signature images after
    const body = currentParticipants.map((p, idx) => {
      const pAtt = attMap[p.id] || {};
      const rt = p.reg_type === 'Walk-in' ? 'Walk-in' : 'Pre-reg';
      const row = [
        String(idx + 1),
        p.code || '—',
        p.name || '',
        p.sex || '—',
        p.org || '',
        p.position_title || '',
        p.prog || '',
        rt,
        ...dayLabels.map(d => pAtt[d]?.signature_url ? '' : '—')
      ];
      return row;
    });

    doc.autoTable({
      head: [head],
      body,
      startY: 58,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 7.5, cellPadding: 3, overflow: 'ellipsize', minCellHeight: 10 },
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      columnStyles: Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }])),
      didParseCell: (data) => {
        // Make day columns taller when they have a signature
        if (data.section === 'body' && data.column.index >= fixedHead.length) {
          const p = currentParticipants[data.row.index];
          if (!p) return;
          const pAtt = attMap[p.id] || {};
          const dayLabel = dayLabels[data.column.index - fixedHead.length];
          if (pAtt[dayLabel]?.signature_url) {
            data.row.height = SIG_H * 2.8; // pts
          }
        }
        // Code cell orange
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [243, 112, 33];
          data.cell.styles.fontStyle = 'bold';
        }
        // Type cell colour
        if (data.section === 'body' && data.column.index === fixedHead.length - 1) {
          const p = currentParticipants[data.row.index];
          if (p?.reg_type === 'Walk-in') data.cell.styles.textColor = [243, 112, 33];
          else data.cell.styles.textColor = [0, 92, 42];
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index < fixedHead.length) return;
        const p = currentParticipants[data.row.index];
        if (!p) return;
        const pAtt = attMap[p.id] || {};
        const dayLabel = dayLabels[data.column.index - fixedHead.length];
        const att = pAtt[dayLabel];
        if (att?.signature_url && sigCache[att.signature_url]) {
          try {
            const pad = 3;
            doc.addImage(
              sigCache[att.signature_url], 'PNG',
              data.cell.x + pad, data.cell.y + pad,
              data.cell.width - pad * 2, data.cell.height - pad * 2
            );
          } catch(e) { /* skip broken image */ }
        }
      }
    });

    // Page footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal');
      doc.text('Page ' + i + ' of ' + pages + '  ·  ' + eventName + '  ·  Participant Reg App', MARGIN, pageH - 14);
    }

    doc.save('attendance-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');
  } catch(e) {
    alert('PDF export failed: ' + e.message);
    console.error(e);
  } finally {
    if (btn) { btn.textContent = 'Export PDF'; btn.disabled = false; }
  }
}


// ── CSV Import ──
let importRows = [];
let importValidRows = [];

function openImportForEvent(eventId, eventName) {
  // Set hidden select and display name
  const sel = document.getElementById('import-event-sel');
  sel.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = eventId; opt.textContent = eventName; opt.selected = true;
  sel.appendChild(opt);
  document.getElementById('import-event-name').textContent = eventName;
  // Reset form state
  document.getElementById('import-file').value = '';
  document.getElementById('import-preview').style.display = 'none';
  document.getElementById('import-confirm-btn').style.display = 'none';
  document.getElementById('import-err').style.display = 'none';
  importRows = []; importValidRows = [];
  showImportStep('upload');
  document.getElementById('import-modal').style.display = 'flex';
}

async function promptImport() {
  showImportStep('upload');
  document.getElementById('import-modal').style.display = 'flex';
  const { data: events } = await db.from('events').select('id, name').order('created_at', { ascending: false });
  const sel = document.getElementById('import-event-sel');
  sel.innerHTML = '<option value="">-- Select event --</option>';
  (events || []).forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id; opt.textContent = e.name;
    sel.appendChild(opt);
  });
}

function closeImport() {
  document.getElementById('import-modal').style.display = 'none';
  document.getElementById('import-file').value = '';
  document.getElementById('import-preview').style.display = 'none';
  document.getElementById('import-confirm-btn').style.display = 'none';
  document.getElementById('import-err').style.display = 'none';
  importRows = []; importValidRows = [];
}

function showImportStep(step) {
  ['upload','done'].forEach(s => {
    const el = document.getElementById('import-step-' + s);
    if (el) el.style.display = s === step ? 'block' : 'none';
  });
}



function downloadTemplate() {
  const csv = 'Name,Sex,Organization,Program,Position,Email,Phone\nAma Asante,Female,Organisation Name,Program Name,MEL Officer,ama@example.com,0244000001\n';
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'participants-import-template.csv';
  a.click();
}

function previewCSV() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) { showImportErr('CSV has no data rows.'); return; }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g,''));
  const REQUIRED = { name:['name','fullname'], sex:['sex','gender'], org:['organization','org','organisation'],
    prog:['program','programme'], position:['position','role','title'], email:['email'], phone:['phone','phonenumber'] };

  // Map headers to fields
  const colMap = {};
  Object.entries(REQUIRED).forEach(([field, aliases]) => {
    const idx = headers.findIndex(h => aliases.includes(h));
    if (idx >= 0) colMap[field] = idx;
  });

  const missing = Object.keys(REQUIRED).filter(f => colMap[f] === undefined);
  if (missing.length) { showImportErr('Missing columns: ' + missing.join(', ')); return; }

  importRows = []; importValidRows = [];
  const errors = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    // Handle quoted fields
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
    const clean = cols.map(c => c.replace(/^"|"$/g,'').trim());

    const row = {};
    Object.entries(colMap).forEach(([field, idx]) => { row[field] = clean[idx] || ''; });
    row._line = i + 2;

    const rowErrors = [];
    if (!row.name) rowErrors.push('Name required');
    if (!row.sex || !['male','female'].includes(row.sex.toLowerCase())) rowErrors.push('Sex must be Male or Female');
    if (!row.org) rowErrors.push('Organization required');
    if (!row.prog) rowErrors.push('Program required');
    if (!row.position) rowErrors.push('Position required');
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.email)) rowErrors.push('Invalid email');
    if (row.phone && !/^(0\d{9}|\+?233\d{9})$/.test(row.phone.replace(/[\s\-().]/g,''))) rowErrors.push('Invalid phone');

    if (rowErrors.length) {
      errors.push('Row ' + row._line + ': ' + rowErrors.join(', '));
    } else {
      row.sex = row.sex.charAt(0).toUpperCase() + row.sex.slice(1).toLowerCase();
      importValidRows.push(row);
    }
    importRows.push({ ...row, _errors: rowErrors });
  });

  renderPreview(errors);
}

function showImportErr(msg) {
  const el = document.getElementById('import-err');
  el.textContent = msg; el.style.display = 'block';
}

function renderPreview(errors) {
  document.getElementById('import-err').style.display = 'none';
  document.getElementById('import-preview').style.display = 'block';
  document.getElementById('preview-count').textContent =
    '(' + importValidRows.length + ' valid' + (errors.length ? ', ' + errors.length + ' with issues' : '') + ')';

  // Preview table
  const table = document.getElementById('preview-table');
  const fields = ['name','sex','org','prog','position','email','phone'];
  let html = '<thead><tr>' + ['Name','Sex','Org','Program','Position','Email','Phone','Status']
    .map(h => `<th style="background:var(--black);color:white;padding:8px 10px;font-size:11px;white-space:nowrap">${h}</th>`).join('') + '</tr></thead><tbody>';

  importRows.forEach(row => {
    const ok = row._errors.length === 0;
    const bg = ok ? '' : 'background:rgba(235,0,27,0.06)';
    html += `<tr style="${bg}">` +
      fields.map(f => `<td style="padding:6px 10px;border-bottom:0.5px solid #eee;white-space:nowrap">${esc(row[f]||'')}</td>`).join('') +
      `<td style="padding:6px 10px;border-bottom:0.5px solid #eee;font-size:11px;white-space:nowrap;color:${ok?'var(--green)':'var(--red)'}">
        ${ok ? '✓ Valid' : '✗ ' + row._errors.join('; ')}
      </td></tr>`;
  });
  table.innerHTML = html + '</tbody>';

  // Error list
  const errDiv = document.getElementById('import-errors');
  if (errors.length) {
    errDiv.style.display = 'block';
    document.getElementById('error-list').innerHTML = errors.map(e => `<li>${e}</li>`).join('');
  } else {
    errDiv.style.display = 'none';
  }

  // Confirm button
  const btn = document.getElementById('import-confirm-btn');
  if (importValidRows.length > 0) {
    document.getElementById('import-valid-count').textContent = importValidRows.length;
    btn.style.display = 'inline-block';
  } else {
    btn.style.display = 'none';
  }
}

async function confirmImport() {
  const eventId = document.getElementById('import-event-sel').value;
  if (!eventId) { showImportErr('Please select an event.'); return; }

  const btn = document.getElementById('import-confirm-btn');
  btn.textContent = 'Importing...'; btn.disabled = true;

  // Get current participant count to generate codes
  const { data: existing } = await db.from('participants').select('code').eq('event_id', eventId).not('code','is',null);
  const { data: ev } = await db.from('events').select('program,event_code').eq('id', eventId).single();

  const progRaw = (ev?.program && ev.program !== 'Other') ? ev.program : '';
  const prefix = ev?.event_code || progRaw.replace(/[^A-Z]/g,'').slice(0,3) || 'P';

  const nums = (existing || []).map(p => { const m = (p.code||'').match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
  let nextNum = nums.length ? Math.max(...nums) + 1 : 1;

  const payload = importValidRows.map(row => ({
    name: row.name,
    sex: row.sex,
    org: row.org,
    prog: row.prog,
    position_title: row.position,
    email: row.email || null,
    phone: row.phone || null,
    reg_type: 'Pre-registration',
    event_id: eventId,
    code: prefix + '-' + String(nextNum++).padStart(3, '0')
  }));

  // Check for duplicates against existing participants
  const { data: existingParts } = await db.from('participants')
    .select('name, phone, code').eq('event_id', eventId);

  function lev(a, b) {
    a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
      dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
  }
  function normPhone(p) { return (p||'').replace(/[\s\-().+]/g,'').replace(/^233/,'0').replace(/^0+/,'0'); }
  function simScore(a,b) { const mx=Math.max(a.length,b.length); return mx?1-lev(a,b)/mx:1; }

  const dupWarnings = [];
  payload.forEach((row, i) => {
    for (const ex of (existingParts||[])) {
      const samePhone = normPhone(row.phone) && normPhone(row.phone) === normPhone(ex.phone);
      const sim = simScore(row.name, ex.name);
      if (samePhone || sim >= 0.80) {
        dupWarnings.push(`Row ${i+1} "${row.name}" — similar to existing participant "${ex.name}" (${ex.code})`);
        break;
      }
    }
  });

  if (dupWarnings.length) {
    const proceed = confirm(
      dupWarnings.length + ' possible duplicate(s) found:\n\n' +
      dupWarnings.slice(0,5).join('\n') +
      (dupWarnings.length > 5 ? '\n...and ' + (dupWarnings.length-5) + ' more.' : '') +
      '\n\nProceed with import anyway?'
    );
    if (!proceed) { btn.textContent = 'Import ' + importValidRows.length + ' participants'; btn.disabled = false; return; }
  }

  // Insert in batches of 20
  let inserted = 0;
  for (let i = 0; i < payload.length; i += 20) {
    const batch = payload.slice(i, i + 20);
    const { error } = await db.from('participants').insert(batch);
    if (!error) inserted += batch.length;
  }

  if (typeof logAudit === 'function') logAudit('csv_imported', 'event', importEventId || null, { count: inserted });
  document.getElementById('import-done-msg').textContent =
    inserted + ' participant' + (inserted !== 1 ? 's' : '') + ' imported successfully.';
  showImportStep('done');
  loadEvents(); // refresh counts
}

// ── MEL question required toggle ──
function toggleMelRequired(prefix) {
  const val = document.getElementById(prefix + '-mel').value.trim();
  document.getElementById(prefix + '-mel-required-group').style.display = val ? 'block' : 'none';
}

function setMelRequired(prefix, required) {
  document.getElementById(prefix + '-mel-required').value = required ? 'true' : 'false';
  document.getElementById(prefix + '-mel-opt').classList.toggle('active', !required);
  document.getElementById(prefix + '-mel-req').classList.toggle('active', required);
}

// ── QR Sheet Export ──
async function exportQRSheet() {
  const btn = [...document.querySelectorAll('.btn-sm')].find(b => b.textContent === 'Export QR Sheet');
  if (btn) { btn.textContent = 'Building...'; btn.disabled = true; }

  try {
    const { jsPDF } = window.jspdf;
    const eventName = document.getElementById('view-event-name').textContent;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const MARGIN = 30;

    // Header
    doc.setFillColor(235, 0, 27);   doc.rect(0, 0, pageW * 0.4, 40, 'F');
    doc.setFillColor(255, 95, 0);   doc.rect(pageW * 0.4, 0, pageW * 0.35, 40, 'F');
    doc.setFillColor(247, 158, 27); doc.rect(pageW * 0.75, 0, pageW * 0.25, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(eventName, MARGIN, 18);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Participant QR Codes  ·  Scan to sign attendance', MARGIN, 32);

    // Generate QR codes for each participant
    const BASE = window.location.origin + window.location.pathname.replace('admin.html', '');
    const COLS = 3;
    const CELL_W = (pageW - MARGIN * 2) / COLS;
    const QR_SIZE = 90;
    const CELL_H = QR_SIZE + 55;
    let x = MARGIN, y = 55, col = 0;

    for (let i = 0; i < currentParticipants.length; i++) {
      const p = currentParticipants[i];
      const signUrl = BASE + 'sign.html?participant=' + p.id + '&event=' + currentEventId;

      // Generate QR as data URL via canvas
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

      // Page break
      if (y + CELL_H > pageH - 20) {
        doc.addPage();
        y = 20;
      }

      // Draw card border
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x + 4, y + 2, CELL_W - 8, CELL_H - 4, 6, 6, 'FD');

      // QR image
      doc.addImage(qrDataUrl, 'PNG', x + (CELL_W - QR_SIZE) / 2, y + 8, QR_SIZE, QR_SIZE);

      // Code — orange bold
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.setTextColor(255, 95, 0);
      doc.text(p.code || '—', x + CELL_W / 2, y + QR_SIZE + 20, { align: 'center' });

      // Name
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const nameText = p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name;
      doc.text(nameText, x + CELL_W / 2, y + QR_SIZE + 33, { align: 'center' });

      // Org
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const orgText = (p.org || '').length > 25 ? (p.org || '').slice(0, 24) + '…' : (p.org || '');
      doc.text(orgText, x + CELL_W / 2, y + QR_SIZE + 44, { align: 'center' });

      // Move to next cell
      col++;
      if (col >= COLS) { col = 0; x = MARGIN; y += CELL_H; }
      else { x += CELL_W; }
    }

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5); doc.setTextColor(160, 160, 160);
      doc.text('Page ' + i + ' of ' + pages + '  ·  ' + eventName + '  ·  Participant Reg App', MARGIN, pageH - 10);
    }

    doc.save('qr-codes-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');
  } catch(e) {
    alert('QR export failed: ' + e.message);
    console.error(e);
  } finally {
    if (btn) { btn.textContent = 'Export QR Sheet'; btn.disabled = false; }
  }
}

// ── Check-in QR ──
let currentCheckinEventId = null;
let currentCheckinEventName = '';

function showCheckinQR(eventId, eventName) {
  currentCheckinEventId = eventId;
  currentCheckinEventName = eventName;
  const url = BASE_URL + 'checkin.html?event=' + eventId;
  document.getElementById('qr-event-name').textContent = eventName;
  const canvas = document.getElementById('checkin-qr-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 240; canvas.height = 240;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,240,240);
  const qrImg = new Image();
  qrImg.crossOrigin = 'anonymous';
  qrImg.onload = () => ctx.drawImage(qrImg, 0, 0, 240, 240);
  qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(url);
  document.getElementById('checkin-qr-modal').style.display = 'flex';
}

function closeCheckinQR() {
  document.getElementById('checkin-qr-modal').style.display = 'none';
}

function copyCheckinLink(eventId, btn) {
  navigator.clipboard.writeText(BASE_URL + 'checkin.html?event=' + eventId).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function downloadCheckinQR() {
  const canvas = document.getElementById('checkin-qr-canvas');
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'checkin-qr-' + currentCheckinEventName.replace(/\s+/g,'-') + '.png';
  a.click();
}

// ── Certificate Generation ──
async function generateCertificates() {
  const btn = [...document.querySelectorAll('.btn-sm')].find(b => b.textContent === '🎓 Certificates');
  if (btn) { btn.textContent = 'Building...'; btn.disabled = true; }

  try {
    const { jsPDF } = window.jspdf;
    const eventName = document.getElementById('view-event-name').textContent;

    const { data: ev } = await db.from('events').select('*').eq('id', currentEventId).single();
    if (!ev) { alert('Event not found.'); return; }

    const { data: attendance } = await db.from('attendance')
      .select('participant_id').eq('event_id', currentEventId);
    const signedIds = new Set((attendance || []).map(a => a.participant_id));
    const eligible = currentParticipants.filter(p => signedIds.has(p.id));

    if (!eligible.length) {
      alert('No participants have signed attendance yet.');
      return;
    }

    async function loadImage(url) {
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

    const sigB64 = ev.signatory_signature_url ? await loadImage(ev.signatory_signature_url) : null;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();  // 841.89
    const H = doc.internal.pageSize.getHeight(); // 595.28

    const RED    = [235, 0, 27];
    const ORANGE = [255, 95, 0];
    const YELLOW = [247, 158, 27];
    const BLACK  = [0, 0, 0];
    const WHITE  = [255, 255, 255];

    const dateStr = ev.event_date
      ? new Date(ev.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
      : new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

    eligible.forEach((p, idx) => {
      if (idx > 0) doc.addPage();

      // ── Background ──
      doc.setFillColor(...WHITE);
      doc.rect(0, 0, W, H, 'F');

      // ── Top thick band — red full width ──
      doc.setFillColor(...RED);
      doc.rect(0, 0, W, 55, 'F');

      // ── Orange strip inside top band ──
      doc.setFillColor(...ORANGE);
      doc.rect(0, 40, W, 15, 'F');

      // ── Yellow thin line below orange ──
      doc.setFillColor(...YELLOW);
      doc.rect(0, 55, W, 6, 'F');

      // ── Bottom thick band — black ──
      doc.setFillColor(...BLACK);
      doc.rect(0, H - 55, W, 55, 'F');

      // ── Yellow strip inside bottom band ──
      doc.setFillColor(...YELLOW);
      doc.rect(0, H - 55, W, 8, 'F');

      // ── Left colour column ──
      doc.setFillColor(...RED);
      doc.rect(0, 61, 10, H - 116, 'F');

      // ── Right colour column ──
      doc.setFillColor(...ORANGE);
      doc.rect(W - 10, 61, 10, H - 116, 'F');

      // ── "CERTIFICATE OF PARTICIPATION" — top band ──
      doc.setTextColor(...WHITE);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF PARTICIPATION', W / 2, 28, { align: 'center' });

      // ── bottom band left ──
      doc.setTextColor(...WHITE);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('', 30, H - 22);

      // ── Date — bottom band right ──
      doc.text(dateStr, W - 30, H - 22, { align: 'right' });

      // ── Content area margins ──
      const CX = 40;
      const CY_START = 85;

      // ── "This is to certify that" ──
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'italic');
      doc.text('This is to certify that', CX, CY_START);

      // ── Participant name — very large, red ──
      doc.setTextColor(...RED);
      doc.setFontSize(42);
      doc.setFont('helvetica', 'bold');
      const nameFontSize = p.name.length > 25 ? 32 : p.name.length > 20 ? 36 : 42;
      doc.setFontSize(nameFontSize);
      doc.text(p.name || '', CX, CY_START + 50);

      // ── Yellow underline under name ──
      const nameWidth = Math.min(doc.getTextWidth(p.name || ''), W - 80);
      doc.setFillColor(...YELLOW);
      doc.rect(CX, CY_START + 56, nameWidth, 4, 'F');

      // ── Position · Organisation ──
      const detailLine = [p.position_title, p.org].filter(Boolean).join('   ·   ');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      if (detailLine) doc.text(detailLine, CX, CY_START + 78);

      // ── "has successfully participated in" ──
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'italic');
      doc.text('has successfully participated in', CX, CY_START + 108);

      // ── Event name — large orange ──
      doc.setTextColor(...ORANGE);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const evLines = doc.splitTextToSize(eventName, W - 320);
      doc.text(evLines, CX, CY_START + 135);

      // ── Organiser ──
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      if (ev.organizer) doc.text('Organised by  ' + ev.organizer, CX, CY_START + 135 + evLines.length * 26 + 8);

      // ── Decorative large number — watermark style ──
      doc.setTextColor(247, 158, 27);
      doc.setFontSize(200);
      doc.setFont('helvetica', 'bold');
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.text('"', W - 80, H - 60, { align: 'right' });
      doc.setGState(new doc.GState({ opacity: 1 }));

      // ── Signatory section — bottom right ──
      const SIG_X = W - 260;
      const SIG_Y = H - 110;

      // Signature image
      if (sigB64) {
        doc.addImage(sigB64, 'PNG', SIG_X, SIG_Y - 45, 150, 40);
      }

      // Signature line
      doc.setDrawColor(...BLACK);
      doc.setLineWidth(1);
      doc.line(SIG_X, SIG_Y, SIG_X + 200, SIG_Y);

      doc.setTextColor(...BLACK);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(ev.signatory_name || 'Authorised Signatory', SIG_X, SIG_Y + 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      if (ev.signatory_title) doc.text(ev.signatory_title, SIG_X, SIG_Y + 26);

      // ── Participant code badge — bottom left content area ──
      const BADGE_X = CX;
      const BADGE_Y = H - 100;
      doc.setFillColor(...YELLOW);
      doc.roundedRect(BADGE_X, BADGE_Y - 14, 90, 20, 4, 4, 'F');
      doc.setTextColor(...BLACK);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(p.code || '', BADGE_X + 45, BADGE_Y - 0.5, { align: 'center' });
    });

    doc.save('certificates-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');

  } catch(e) {
    alert('Certificate generation failed: ' + e.message);
    console.error(e);
  } finally {
    if (btn) { btn.textContent = '🎓 Certificates'; btn.disabled = false; }
  }
}

function promptEditFromList(eventId) {
  const pwd = prompt('Admin password:');
  if (!pwd) return;
  (async () => {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd.toUpperCase().trim())))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if (hash !== '3b33a25d09dbd7a9f00296a32852e0cb064eaaa76d4294c370b1b6da15ebb0bc') { alert('Incorrect password.'); return; }
    const BASE_URL = window.location.origin + window.location.pathname.replace('admin.html','');
    window.location.href = BASE_URL + 'edit-event.html?event=' + eventId;
  })();
}

function promptDeleteFromList(eventId) {
  const pwd = prompt('Admin password to delete this event:');
  if (!pwd) return;
  (async () => {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd.toUpperCase().trim())))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if (hash !== '3b33a25d09dbd7a9f00296a32852e0cb064eaaa76d4294c370b1b6da15ebb0bc') { alert('Incorrect password.'); return; }
    if (!confirm('Delete this event and ALL its participants? This cannot be undone.')) return;
    await db.from('attendance').delete().eq('event_id', eventId);
    await db.from('participants').delete().eq('event_id', eventId);
    await db.from('events').delete().eq('id', eventId);
    if (typeof logAudit === 'function') logAudit('event_deleted', 'event', eventId, {});
    loadEvents();
  })();
}

function handleEventClick(el) {
  const id = el.getAttribute('data-eid');
  const name = el.querySelector('p').textContent;
  viewParticipants(id, name);
}

// Status config — defines colour and allowed actions per status
const STATUS_CONFIG = {
  Draft:    { color: '#888',    bg: '#f0f0f0', label: 'Draft',    canPreReg: false, canWalkin: false, canAttend: false, canExport: false },
  Open:     { color: '#FF5F00', bg: '#fff3ec', label: 'Open',     canPreReg: true,  canWalkin: false, canAttend: false, canExport: false },
  Live:     { color: '#009444', bg: '#ecf7ee', label: 'Live',     canPreReg: true,  canWalkin: true,  canAttend: true,  canExport: false },
  Closed:   { color: '#EB001B', bg: '#ffecea', label: 'Closed',   canPreReg: false, canWalkin: false, canAttend: false, canExport: true  },
  Archived: { color: '#aaa',    bg: '#f8f8f8', label: 'Archived', canPreReg: false, canWalkin: false, canAttend: false, canExport: true  }
};

const DM_LABELS = { in_person: 'In-person', online: 'Online', hybrid: 'Hybrid' };
const DM_COLORS = { in_person: { bg:'#ecf7ee', color:'#009444' }, online: { bg:'#e8f4fd', color:'#1565c0' }, hybrid: { bg:'#fff8e1', color:'#f57c00' } };

function renderEventCard(e, count, index) {
  const status = e.status || 'Draft';
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  const dateStr = e.event_date
    ? new Date(e.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
    : 'No date';
  const prog = (e.program && e.program !== 'Other') ? e.program : '';
  const meta = [prog, dateStr].filter(Boolean).join(' · ');
  const name = esc(e.name);
  const id = e.id;
  const dm = e.delivery_mode || 'in_person';
  const dmLabel = DM_LABELS[dm] || 'In-person';
  const dmc = DM_COLORS[dm] || DM_COLORS.in_person;

  // Alternate row colours — white and light yellow
  const bg = index % 2 === 0 ? '#ffffff' : '#fffbf0';

  return '<div data-eid="' + id + '" style="display:flex;align-items:center;padding:14px 16px;background:' + bg + ';border-bottom:1px solid #eee;cursor:pointer" ' +
    'onclick="handleEventClick(this)" ' +
    'onmouseover="this.style.background=\'#fff5ef\'" ' +
    'onmouseout="this.style.background=\'' + bg + '\'">' +

    // Left: name and meta
    '<div style="flex:1;min-width:0">' +
      '<p style="font-size:15px;font-weight:700;color:#000;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</p>' +
      '<p style="font-size:12px;color:#888">' + meta + '</p>' +
      '<span style="display:inline-block;margin-top:3px;padding:1px 8px;border-radius:20px;font-size:10px;font-weight:700;background:' + sc.bg + ';color:' + sc.color + '">' + sc.label + '</span>' +
      '&nbsp;<span style="display:inline-block;margin-top:3px;padding:1px 8px;border-radius:20px;font-size:10px;font-weight:700;background:' + dmc.bg + ';color:' + dmc.color + '">' + dmLabel + '</span>' +
    '</div>' +



    // Right: count
    '<div style="flex-shrink:0;text-align:right">' +
      '<p style="font-size:18px;font-weight:800;color:#EB001B;line-height:1">' + count + '</p>' +
      '<p style="font-size:10px;color:#aaa">registered</p>' +
    '</div>' +

    // Edit + Delete buttons (password protected) + Arrow
    '<button data-editid="' + id + '" onclick="event.stopPropagation();promptEditFromList(this.dataset.editid)" ' +
      'style="flex-shrink:0;margin-left:8px;padding:5px 10px;background:white;border:1.5px solid #000;border-radius:6px;font-size:11px;font-weight:700;color:#000;cursor:pointer;font-family:inherit">✏</button>' +
    '<button data-delid="' + id + '" onclick="event.stopPropagation();promptDeleteFromList(this.dataset.delid)" ' +
      'style="flex-shrink:0;margin-left:4px;padding:5px 10px;background:white;border:1.5px solid #EB001B;border-radius:6px;font-size:11px;font-weight:700;color:#EB001B;cursor:pointer;font-family:inherit">🗑</button>' +
    '<span style="flex-shrink:0;margin-left:8px;color:#ccc;font-size:18px">›</span>' +
  '</div>';
}


async function loadEvents() {
  document.getElementById('events-loading').style.display = 'block';
  document.getElementById('events-list').style.display = 'none';

  const { data: events } = await db.from('events').select('*').order('created_at', { ascending: false });
  const { data: counts } = await db.from('participants').select('event_id');

  const countMap = {};
  (counts || []).forEach(p => { countMap[p.event_id] = (countMap[p.event_id] || 0) + 1; });

  document.getElementById('events-loading').style.display = 'none';
  document.getElementById('events-list').style.display = 'block';

  if (!events || !events.length) {
    document.getElementById('events-list').innerHTML = '<div class="empty">No events yet. Create your first event.</div>';
    return;
  }

  let html = '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;box-shadow:0 1px 6px rgba(0,0,0,0.06)">';
  events.forEach((e, i) => {
    const count = countMap[e.id] || 0;
    html += renderEventCard(e, count, i);
  });
  html += '</div>';
  if (!events.length) html = '<div class="empty" style="padding:2rem;text-align:center;color:#aaa">No events yet. Create your first event.</div>';
  document.getElementById('events-list').innerHTML = html;
}

function copyEventLink(id, type, btn) {
  let url;
  if (type === 'view') url = BASE_URL + 'event.html?event=' + id;
  else if (type === 'walkin') url = BASE_URL + 'index.html?event=' + id + '&walkin=1';
  else url = BASE_URL + 'index.html?event=' + id;
  navigator.clipboard.writeText(url).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

async function deleteEvent(id) {
  if (!confirm('Delete this event and all its participants? This cannot be undone.')) return;
  await db.from('participants').delete().eq('event_id', id);
  await db.from('events').delete().eq('id', id);
  loadEvents();
}



async function viewParticipants(eventId, eventName) {
  window.location.href = BASE_URL + 'event.html?event=' + eventId + '&from=admin';
  return;
  currentEventId = eventId;
  document.getElementById('view-event-name').textContent = eventName;
  showPane('participants');

  const [{ data: parts }, { data: ev }] = await Promise.all([
    db.from('participants').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
    db.from('events').select('days').eq('id', eventId).single()
  ]);
  currentParticipants = parts || [];
  currentEventDays = ev?.days || 1;
  currentAttendance = {};
  try {
    const { data: att } = await db.from('attendance').select('*').eq('event_id', eventId);
    (att || []).forEach(a => {
      if (!currentAttendance[a.participant_id]) currentAttendance[a.participant_id] = [];
      currentAttendance[a.participant_id].push(a);
    });
  } catch(e) { console.warn('Attendance table not available:', e.message); }
  renderStats();
  filterParticipants();
}

function renderStats() {
  const total = currentParticipants.length;
  const female = currentParticipants.filter(p => p.sex === 'Female').length;
  const male = currentParticipants.filter(p => p.sex === 'Male').length;

  // Count attendance per day from attendance table
  const dayCounts = {};
  Object.values(currentAttendance).forEach(records => {
    records.forEach(a => { dayCounts[a.day] = (dayCounts[a.day] || 0) + 1; });
  });
  const totalSigned = Object.values(currentAttendance).filter(r => r.length > 0).length;

  let html = `<div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Registered</div></div>`;
  if (totalSigned) html += `<div class="stat-card"><div class="stat-num">${totalSigned}</div><div class="stat-label">Signed</div></div>`;
  if (female) html += `<div class="stat-card"><div class="stat-num">${female}</div><div class="stat-label">Female</div></div>`;
  if (male) html += `<div class="stat-card"><div class="stat-num">${male}</div><div class="stat-label">Male</div></div>`;
  // Only show days within the event's configured day count
  const validDays = Array.from({ length: currentEventDays }, (_, i) => 'Day ' + (i + 1));
  validDays.forEach(d => {
    const c = dayCounts[d] || 0;
    html += `<div class="stat-card"><div class="stat-num">${c}</div><div class="stat-label">${d}</div></div>`;
  });
  document.getElementById('view-stats').innerHTML = html;
}

function filterParticipants() {
  const q = (document.getElementById('p-search').value || '').toLowerCase();
  const filtered = currentParticipants.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.org.toLowerCase().includes(q) ||
    (p.position_title || '').toLowerCase().includes(q) ||
    (p.prog || '').toLowerCase().includes(q) ||
    (p.code || '').toLowerCase().includes(q)
  );
  const container = document.getElementById('participants-list');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty">${currentParticipants.length ? 'No results.' : 'No participants registered yet.'}</div>`;
    return;
  }
  let html = `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th style="width:11%">Code</th>
      <th style="width:22%">Name</th>
      <th style="width:7%">Sex</th>
      <th style="width:20%">Organization</th>
      <th style="width:17%">Position</th>
      <th style="width:13%">Program</th>
      <th style="width:10%">Type</th>
    </tr></thead><tbody>`;
  filtered.forEach(p => {
    const att = currentAttendance[p.id] || [];
    const regTypeBadge = p.reg_type === 'Walk-in'
      ? '<span style="background:#fff3e8;color:var(--orange);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Walk-in</span>'
      : '<span style="background:#f0f9f4;color:#005c2a;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">Pre-reg</span>';
    html += `<tr data-pid="${p.id}" style="cursor:pointer">
      <td style="font-weight:700;font-family:monospace;color:var(--orange)">${esc(p.code) || '&mdash;'}</td>
      <td title="${esc(p.name)}" style="font-weight:500">${esc(p.name)}</td>
      <td>${esc(p.sex) || '&mdash;'}</td>
      <td title="${esc(p.org)}">${esc(p.org)}</td>
      <td>${esc(p.position_title) || '&mdash;'}</td>
      <td>${esc(p.prog) || '&mdash;'}</td>
      <td>${regTypeBadge}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Event delegation for row clicks → open sign form
  const tbody = container.querySelector('tbody');
  if (tbody) {
    tbody.addEventListener('click', e => {
      const row = e.target.closest('tr[data-pid]');
      if (row) {
        window.location.href = BASE_URL + 'sign.html?participant=' + row.dataset.pid + '&event=' + currentEventId;
      }
    });
  }
}

async function exportCSV() {
  const { data: attendance } = await db.from('attendance')
    .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });

  const attMap = {};
  (attendance || []).forEach(a => {
    if (!attMap[a.participant_id]) attMap[a.participant_id] = [];
    attMap[a.participant_id].push(a);
  });

  // Wrap plain text values in quotes, escaping internal quotes
  function q(v) { return '"' + (v || '').toString().replace(/"/g, '""') + '"'; }

  const headers = ['Code','Name','Sex','Organization','Program','Position','Registration Type',
    'Email','Phone','Signed','Days Signed','Signed At',
    'Signature Image (Sheets)','Signature URL','MEL Response','Registered'];

  const rows = currentParticipants.map(p => {
    const att = attMap[p.id] || [];
    const daysSigned = att.map(a => a.day).join('; ');
    const signedAt = att.map(a => a.signed_at ? new Date(a.signed_at).toLocaleString() : '').join('; ');
    const lastSigUrl = (att.filter(a => a.signature_url).slice(-1)[0] || {}).signature_url || '';
    const allUrls = att.filter(a => a.signature_url).map(a => a.signature_url).join('; ');

    // Quoted formula cell — Google Sheets reads =IMAGE("url") and renders signature inline
    const imageCell = lastSigUrl ? '"=IMAGE(\""' + lastSigUrl + '\"")"' : '""';

    return [
      q(p.code), q(p.name), q(p.sex), q(p.org), q(p.prog), q(p.position_title),
      q(p.reg_type || 'Pre-registration'),
      q(p.email), q(p.phone),
      q(att.length > 0 ? 'Yes' : 'No'),
      q(daysSigned), q(signedAt),
      imageCell,
      q(allUrls),
      q(p.notes), q(p.created_at)
    ].join(',');
  });

  const csv = [headers.map(h => '"' + h + '"').join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'participants-' + document.getElementById('view-event-name').textContent.replace(/\s+/g,'-') + '-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

showPane('events');

function openEdit(e) {
  document.getElementById('edit-id').value = e.id;
  document.getElementById('edit-name').value = e.name || '';
  document.getElementById('edit-organizer').value = e.organizer || '';
  document.getElementById('edit-date').value = e.event_date || '';
  document.getElementById('edit-mel').value = e.mel_question || '';
  document.getElementById('edit-signatory-name').value = e.signatory_name || '';
  document.getElementById('edit-signatory-title').value = e.signatory_title || '';
  const sigCurrent = document.getElementById('edit-signatory-current');
  sigCurrent.textContent = e.signatory_signature_url ? 'Current signature on file ✓' : 'No signature uploaded yet';
  toggleMelRequired('edit');
  if (e.mel_question_required) setMelRequired('edit', true);
  else setMelRequired('edit', false);
  document.getElementById('edit-code').value = e.event_code || '';
  const ep = document.getElementById('edit-prog');
  ep.value = e.program || '';
  document.getElementById('edit-prog-other-group').style.display = (e.program && !['AYAW','FIRST+II','BIA','FILMA','MCF'].includes(e.program)) ? 'block' : 'none';
  document.getElementById('edit-prog-other').value = (e.program && !['AYAW','FIRST+II','BIA','FILMA','MCF'].includes(e.program)) ? e.program : '';
  const _dmSel = document.getElementById('edit-delivery-mode');
  if (_dmSel) _dmSel.value = e.delivery_mode || 'in_person';

  const progSel = document.getElementById('edit-prog');
  progSel.value = e.program || '';

  const daysSel = document.getElementById('edit-days');
  daysSel.value = String(e.days || 1);

  document.getElementById('edit-err').style.display = 'none';
  ['create','link','events','participants','edit'].forEach(p => {
    document.getElementById('pane-' + p).style.display = p === 'edit' ? 'block' : 'none';
  });
}

async function saveEdit() {
  const errEl = document.getElementById('edit-err');
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { errEl.textContent = 'Event name is required.'; errEl.style.display = 'inline'; return; }

  // Warn if days are being reduced
  const editId = document.getElementById('edit-id').value;
  const { data: currentEv } = await db.from('events').select('days').eq('id', editId).single();
  const newDays = parseInt(document.getElementById('edit-days').value) || 1;
  if (currentEv && newDays < (currentEv.days || 1)) {
    const ok = confirm(
      'Reducing days from ' + (currentEv.days || 1) + ' to ' + newDays + '.\n\n' +
      'Attendance records for Day ' + (newDays + 1) + ' and above will no longer appear in exports or sign-in, but data is not deleted.\n\nProceed?'
    );
    if (!ok) return;
  }

  const btn = document.querySelector('#pane-edit .btn-primary');
  btn.textContent = 'Saving...'; btn.disabled = true;

  const { error } = await db.from('events').update({
    name,
    organizer: document.getElementById('edit-organizer').value.trim() || null,
    program: getProgram('edit-prog', 'edit-prog-other'),
    event_date: document.getElementById('edit-date').value || null,
    days: parseInt(document.getElementById('edit-days').value) || 1,
    mel_question: document.getElementById('edit-mel').value.trim() || null,
    mel_question_required: document.getElementById('edit-mel-required').value === 'true',
    signatory_name: document.getElementById('edit-signatory-name').value.trim() || null,
    signatory_title: document.getElementById('edit-signatory-title').value.trim() || null,
    event_code: document.getElementById('edit-code').value.trim().toUpperCase() || null,
    delivery_mode: (document.getElementById('edit-delivery-mode') ? document.getElementById('edit-delivery-mode').value : null) || 'in_person'
  }).eq('id', document.getElementById('edit-id').value);

  btn.textContent = 'Save changes'; btn.disabled = false;

  if (error) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'inline'; return; }
  showPane('events');
}

async function fetchAndEdit(id) {
  const { data, error } = await db.from('events').select('*').eq('id', id).single();
  if (error || !data) { alert('Could not load event.'); return; }
  openEdit(data);
}

function openRegLink() {
  window.location.href = BASE_URL + 'index.html?event=' + currentEventId;
}

function openWalkinLink() {
  window.location.href = BASE_URL + 'index.html?event=' + currentEventId + '&walkin=1';
}

function openViewLink() {
  window.location.href = BASE_URL + 'event.html?event=' + currentEventId;
}

function toggleGuide() {
  const box = document.getElementById('guide-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function toggleOther(selectId, groupId) {
  const val = document.getElementById(selectId).value;
  document.getElementById(groupId).style.display = val === 'Other' ? 'block' : 'none';
}

function getProgram(selectId, otherId) {
  const val = document.getElementById(selectId).value;
  if (val === 'Other') {
    const other = document.getElementById(otherId).value.trim();
    return other || null;  // null if no name specified — don't save "Other"
  }
  return val || null;
}

async function generateEventCode(inputId) {
  const manual = document.getElementById(inputId).value.trim().toUpperCase();
  if (manual) return manual;
  // Auto-generate: EVT + 3-digit sequence
  const { data } = await db.from('events').select('event_code').not('event_code', 'is', null);
  const nums = (data || []).map(e => {
    const m = (e.event_code || '').match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return 'EVT-' + String(next).padStart(3, '0');
}

async function exportPDF() {
  const btn = document.querySelector('[onclick="exportPDF()"]');
  const origText = btn.textContent;
  btn.textContent = 'Building PDF...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const eventName = document.getElementById('view-event-name').textContent;
    const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

    // Fetch attendance for this event
    const { data: attendance } = await db.from('attendance')
      .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });
    const attMap = {};
    (attendance || []).forEach(a => {
      if (!attMap[a.participant_id]) attMap[a.participant_id] = [];
      attMap[a.participant_id].push(a);
    });

    // Fetch signature images as base64
    async function urlToBase64(url) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch { return null; }
    }

    // Header
    doc.setFillColor(235, 0, 27); // MCF red
    doc.rect(0, 0, 297, 18, 'F');
    doc.setFillColor(243, 112, 33); // MCF orange
    doc.rect(100, 0, 197, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(eventName, 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Attendance Register · Exported ' + today, 14, 16);
    doc.setTextColor(0, 0, 0);

    // Stats row
    const total = currentParticipants.length;
    const signed = Object.keys(attMap).length;
    const female = currentParticipants.filter(p => p.sex === 'Female').length;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total registered: ${total}   Signed: ${signed}   Female: ${female}   Male: ${total - female}`, 14, 24);

    // Table — one row per participant, signature embedded
    const tableRows = [];
    for (const p of currentParticipants) {
      const att = attMap[p.id] || [];
      const daysSigned = att.map(a => a.day).join(', ') || '—';
      const sigUrl = (att.filter(a => a.signature_url).slice(-1)[0] || {}).signature_url || null;
      tableRows.push({
        code: p.code || '—',
        name: p.name,
        sex: p.sex || '—',
        org: p.org || '—',
        position: p.position_title || '—',
        type: p.reg_type || 'Pre-registration',
        days: daysSigned,
        sigUrl
      });
    }

    // Build autotable without signature column first to get row positions
    doc.autoTable({
      startY: 28,
      head: [['Code','Name','Sex','Organization','Position','Type','Days Signed','Signature']],
      body: tableRows.map(r => [r.code, r.name, r.sex, r.org, r.position, r.type, r.days, '']),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 112, 33], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 248, 244] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 40 },
        2: { cellWidth: 12 },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 38 }
      },
      rowPageBreak: 'avoid',
      didDrawCell: async (data) => {
        // Signatures are added after table draw (see below)
      }
    });

    // Embed signature images into signature column cells
    // Re-draw with images using didDrawPage callback approach
    // Collect cell positions from a second pass
    const sigColIndex = 7;
    const cellPositions = [];

    doc.autoTable({
      startY: 28,
      head: [['Code','Name','Sex','Organization','Position','Type','Days Signed','Signature']],
      body: tableRows.map(r => [r.code, r.name, r.sex, r.org, r.position, r.type, r.days, '']),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 112, 33], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 248, 244] },
      columnStyles: {
        0: { cellWidth: 18 }, 1: { cellWidth: 40 }, 2: { cellWidth: 12 },
        3: { cellWidth: 45 }, 4: { cellWidth: 35 }, 5: { cellWidth: 22 },
        6: { cellWidth: 22 }, 7: { cellWidth: 38 }
      },
      rowPageBreak: 'avoid',
      didDrawCell: (data) => {
        if (data.column.index === sigColIndex && data.section === 'body') {
          cellPositions.push({
            rowIndex: data.row.index,
            x: data.cell.x, y: data.cell.y,
            w: data.cell.width, h: data.cell.height,
            pageNumber: data.pageNumber || 1
          });
        }
      }
    });

    // Fetch and embed signatures
    btn.textContent = 'Embedding signatures...';
    for (const pos of cellPositions) {
      const row = tableRows[pos.rowIndex];
      if (!row || !row.sigUrl) continue;
      const b64 = await urlToBase64(row.sigUrl);
      if (!b64) continue;
      doc.setPage(pos.pageNumber);
      const padding = 1;
      doc.addImage(b64, 'PNG',
        pos.x + padding, pos.y + padding,
        pos.w - padding * 2, pos.h - padding * 2
      );
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Page ' + i + ' of ' + pageCount + '  ·  Participant Reg App', 14, doc.internal.pageSize.height - 5);
    }

    doc.save('attendance-register-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');

  } catch(e) {
    alert('PDF export failed: ' + e.message);
    console.error(e);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ── PDF Export (admin) ──
async function exportPDF() {
  const btn = [...document.querySelectorAll('.btn-secondary')].find(b => b.textContent === 'Export PDF');
  if (btn) { btn.textContent = 'Building PDF...'; btn.disabled = true; }
  try {
    const { jsPDF } = window.jspdf;
    const eventName = document.getElementById('view-event-name').textContent;

    const { data: ev } = await db.from('events').select('*').eq('id', currentEventId).single();
    const numDays = ev ? (ev.days || 1) : 1;

    const { data: attendance } = await db.from('attendance')
      .select('*').eq('event_id', currentEventId).order('signed_at', { ascending: true });
    const attMap = {};
    (attendance || []).forEach(a => {
      if (!attMap[a.participant_id]) attMap[a.participant_id] = {};
      attMap[a.participant_id][a.day] = a;
    });

    // Pre-fetch signatures
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
    currentParticipants.forEach(p => {
      const days = attMap[p.id] || {};
      Object.values(days).forEach(a => {
        if (a.signature_url && !sigCache[a.signature_url]) urlsToFetch.push(a.signature_url);
      });
    });
    await Promise.all(urlsToFetch.map(async url => { sigCache[url] = await urlToBase64(url); }));

    const SIG_H = 22; // row height in points for rows with signatures
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const MARGIN = 30;

    // Header band
    doc.setFillColor(235, 0, 27);
    doc.rect(0, 0, pageW * 0.4, 50, 'F');
    doc.setFillColor(243, 112, 33);
    doc.rect(pageW * 0.4, 0, pageW * 0.4, 50, 'F');
    doc.setFillColor(247, 158, 27);
    doc.rect(pageW * 0.8, 0, pageW * 0.2, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(eventName, MARGIN, 22);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Attendance Register  ·  ' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }), MARGIN, 36);
    doc.text('Registered: ' + currentParticipants.length + '   Signed: ' + Object.keys(attMap).length, MARGIN, 47);

    // Day labels for columns
    const dayLabels = Array.from({ length: numDays }, (_, i) => 'Day ' + (i + 1));

    // Build head row
    const fixedHead = ['#','Code','Name','Sex','Organization','Position','Program','Type'];
    const head = [...fixedHead, ...dayLabels];

    // Fixed column widths in pts
    const fixedWidths = [20, 40, 90, 28, 90, 80, 70, 42];
    const usable = pageW - MARGIN * 2 - fixedWidths.reduce((a,b) => a+b, 0);
    const dayW = Math.max(55, Math.floor(usable / numDays));

    const colWidths = [...fixedWidths, ...dayLabels.map(() => dayW)];

    // Build body — text cells only; we draw signature images after
    const body = currentParticipants.map((p, idx) => {
      const pAtt = attMap[p.id] || {};
      const rt = p.reg_type === 'Walk-in' ? 'Walk-in' : 'Pre-reg';
      const row = [
        String(idx + 1),
        p.code || '—',
        p.name || '',
        p.sex || '—',
        p.org || '',
        p.position_title || '',
        p.prog || '',
        rt,
        ...dayLabels.map(d => pAtt[d]?.signature_url ? '' : '—')
      ];
      return row;
    });

    doc.autoTable({
      head: [head],
      body,
      startY: 58,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 7.5, cellPadding: 3, overflow: 'ellipsize', minCellHeight: 10 },
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      columnStyles: Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }])),
      didParseCell: (data) => {
        // Make day columns taller when they have a signature
        if (data.section === 'body' && data.column.index >= fixedHead.length) {
          const p = currentParticipants[data.row.index];
          if (!p) return;
          const pAtt = attMap[p.id] || {};
          const dayLabel = dayLabels[data.column.index - fixedHead.length];
          if (pAtt[dayLabel]?.signature_url) {
            data.row.height = SIG_H * 2.8; // pts
          }
        }
        // Code cell orange
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [243, 112, 33];
          data.cell.styles.fontStyle = 'bold';
        }
        // Type cell colour
        if (data.section === 'body' && data.column.index === fixedHead.length - 1) {
          const p = currentParticipants[data.row.index];
          if (p?.reg_type === 'Walk-in') data.cell.styles.textColor = [243, 112, 33];
          else data.cell.styles.textColor = [0, 92, 42];
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index < fixedHead.length) return;
        const p = currentParticipants[data.row.index];
        if (!p) return;
        const pAtt = attMap[p.id] || {};
        const dayLabel = dayLabels[data.column.index - fixedHead.length];
        const att = pAtt[dayLabel];
        if (att?.signature_url && sigCache[att.signature_url]) {
          try {
            const pad = 3;
            doc.addImage(
              sigCache[att.signature_url], 'PNG',
              data.cell.x + pad, data.cell.y + pad,
              data.cell.width - pad * 2, data.cell.height - pad * 2
            );
          } catch(e) { /* skip broken image */ }
        }
      }
    });

    // Page footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal');
      doc.text('Page ' + i + ' of ' + pages + '  ·  ' + eventName + '  ·  Participant Reg App', MARGIN, pageH - 14);
    }

    doc.save('attendance-' + eventName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.pdf');
  } catch(e) {
    alert('PDF export failed: ' + e.message);
    console.error(e);
  } finally {
    if (btn) { btn.textContent = 'Export PDF'; btn.disabled = false; }
  }
}


