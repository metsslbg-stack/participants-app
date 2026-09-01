const SUPABASE_URL = 'https://cpqhljqwxjgscdoepant.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcWhsanF3eGpnc2Nkb2VwYW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTM1NTcsImV4cCI6MjA5Mzc4OTU1N30.XATDTbvL7iDrsn-Si0crJWZebw5FSx0weWRmmcL2Z7c';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const eventId = params.get('event');
const isWalkin = params.get('walkin') === '1';
const BASE_URL = window.location.origin + window.location.pathname.replace('index.html', '');

let eventPrefix = 'P';
let sigCanvas, sigCtx, drawing = false;

function getEventBannerUrl(ev) {
  var url = (ev && ev.banner_url) ? String(ev.banner_url).trim() : '';
  if (!url) return 'banner.jpg';
  if (!/^https?:\/\//i.test(url)) return 'banner.jpg';
  return url;
}

async function init() {
  if (!eventId) { document.getElementById('no-event').style.display = 'block'; return; }

  const { data, error } = await db.from('events').select('*').eq('id', eventId).single();
  if (error || !data) { document.getElementById('no-event').style.display = 'block'; return; }

  if (data.program) eventPrefix = data.program.replace(/[^A-Z]/g, '').slice(0, 3) || 'P';

  document.getElementById('event-ui').style.display = 'block';
  { const _b = document.getElementById('reg-banner'); if (_b) _b.src = getEventBannerUrl(data); }
  // Live email validation on blur
  document.getElementById('f-email').addEventListener('blur', () => {
    const v = validateEmail(document.getElementById('f-email').value.trim());
    const errEl = document.getElementById('err-msg');
    if (!v.valid && document.getElementById('f-email').value.trim()) {
      errEl.textContent = v.msg; errEl.style.display = 'block';
    } else { errEl.style.display = 'none'; }
  });
  document.getElementById('f-phone').addEventListener('blur', () => {
    const v = validatePhone(document.getElementById('f-phone').value.trim());
    const errEl = document.getElementById('err-msg');
    if (!v.valid && document.getElementById('f-phone').value.trim()) {
      errEl.textContent = v.msg; errEl.style.display = 'block';
    } else { errEl.style.display = 'none'; }
  });
  document.getElementById('event-name').textContent = data.name;
  const displayProg = (data.program && data.program !== 'Other') ? data.program : null;
  document.getElementById('event-program').textContent = [data.event_code, displayProg].filter(Boolean).join(' · ') || 'Registration';
  document.getElementById('event-meta').textContent = [
    data.organizer,
    data.event_date ? new Date(data.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : null
  ].filter(Boolean).join(' · ');
  document.title = data.name;

  // Show pre-program question on pre-reg only, hide on walk-in
  if (!isWalkin && data.mel_question) {
    document.getElementById('mel-question-group').style.display = 'block';
    const melRequired = data.mel_question_required === true || data.mel_question_required === 'true';
    const melLabel = data.mel_question ||
      (melRequired ? 'Comments or Questions' : 'Comments or Questions (optional)');
    document.getElementById('mel-question-label').textContent = melLabel;
    if (melRequired) {
      document.getElementById('mel-question-label').innerHTML =
        melLabel + ' <span style="color:var(--red)">*</span>';
    }
    window._melRequired = melRequired;
  window._eventName = data.name || '';
  window._eventDate = data.event_date || '';
  }

  if (isWalkin) {
    document.getElementById('form-type-label').textContent = 'Walk-in Reg Form';
    document.getElementById('walkin-fields').style.display = 'block';
    document.getElementById('submit-btn').textContent = 'Submit & Sign';

    const days = data.days || 1;
    if (days > 1) {
      const container = document.getElementById('day-buttons');
      for (let i = 1; i <= days; i++) {
        const btn = document.createElement('button');
        btn.className = 'toggle-btn';
        btn.textContent = 'Day ' + i;
        btn.onclick = () => setDay('Day ' + i);
        container.appendChild(btn);
      }
      document.getElementById('day-group').style.display = 'block';
    } else {
      document.getElementById('f-day').value = 'Day 1';
    }
    initSignature();
  } else {
    document.getElementById('form-type-label').textContent = 'Pre-Reg Form';
    document.getElementById('f-day').value = '';
  }
}

function goBack() {
  window.location.href = BASE_URL + 'event.html?event=' + eventId;
}

function initSignature() {
  sigCanvas = document.getElementById('sig-canvas');
  sigCtx = sigCanvas.getContext('2d');
  sigCanvas.width = sigCanvas.offsetWidth;
  sigCanvas.height = sigCanvas.offsetHeight;
  sigCtx.strokeStyle = '#1a1a1a';
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = 'round';

  const getPos = e => {
    const r = sigCanvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };
  sigCanvas.addEventListener('mousedown', e => { drawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); hideSigHint(); });
  sigCanvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); });
  sigCanvas.addEventListener('mouseup', () => drawing = false);
  sigCanvas.addEventListener('mouseleave', () => drawing = false);
  sigCanvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); hideSigHint(); }, { passive: false });
  sigCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); }, { passive: false });
  sigCanvas.addEventListener('touchend', () => drawing = false);
}

function hideSigHint() { document.querySelector('.sig-hint').style.display = 'none'; }
function clearSig() { sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); document.querySelector('.sig-hint').style.display = 'block'; }
function isSigEmpty() { return !sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data.some(v => v !== 0); }

function setSex(v) {
  document.getElementById('f-sex').value = v;
  document.getElementById('btn-male').classList.toggle('active', v === 'Male');
  document.getElementById('btn-female').classList.toggle('active', v === 'Female');
}

function setDay(v) {
  document.getElementById('f-day').value = v;
  document.querySelectorAll('#day-buttons .toggle-btn').forEach(b => b.classList.toggle('active', b.textContent === v));
}

function fval(id) { return document.getElementById(id).value.trim(); }

function validateEmail(email) {
  if (!email) return { valid: true };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return { valid: false, msg: 'Enter a valid email address (e.g. name@org.com).' };
  // Common typo domains
  const typos = { 'gmial.com':'gmail.com', 'gmai.com':'gmail.com', 'gmail.co':'gmail.com',
    'yahoocom':'yahoo.com', 'yaho.com':'yahoo.com', 'hotmai.com':'hotmail.com',
    'outlok.com':'outlook.com', 'outloook.com':'outlook.com' };
  const domain = email.split('@')[1].toLowerCase();
  if (typos[domain]) return { valid: false, msg: `Did you mean @${typos[domain]}?` };
  return { valid: true };
}

function validatePhone(phone) {
  if (!phone) return { valid: true };
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // Accept: 0XXXXXXXXX (10 digits), +233XXXXXXXXX, 233XXXXXXXXX
  const local = /^0\d{9}$/.test(cleaned);
  const intl  = /^(\+233|233)\d{9}$/.test(cleaned);
  if (!local && !intl) {
    return { valid: false, msg: 'Enter a valid phone number (e.g. 0244 000 000 or +233244000000).' };
  }
  return { valid: true };
}

async function getNextCode() {
  const { data } = await db.from('participants').select('code').eq('event_id', eventId).not('code', 'is', null);
  if (!data || !data.length) return eventPrefix + '-001';
  const nums = data.map(p => { const m = (p.code || '').match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
  return eventPrefix + '-' + String(Math.max(...nums) + 1).padStart(3, '0');
}

async function registerParticipant() {
  const errEl = document.getElementById('err-msg');
  const name = fval('f-name'), sex = fval('f-sex'), org = fval('f-org'),
        prog = fval('f-prog'), position = fval('f-position'),
        email = fval('f-email'), phone = fval('f-phone');

  if (!name || !sex || !org || !prog || !position || !email || !phone) {
    errEl.textContent = 'Please fill in all required fields.'; errEl.style.display = 'block'; return;
  }
  // Validate MEL question if mandatory
  if (!isWalkin && window._melRequired) {
    const melVal = fval('f-mel');
    if (!melVal) { errEl.textContent = 'Please answer the pre-reg question.'; errEl.style.display = 'block'; return; }
  }
  if (email) {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) { errEl.textContent = emailCheck.msg; errEl.style.display = 'block'; return; }
  }
  if (phone) {
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) { errEl.textContent = phoneCheck.msg; errEl.style.display = 'block'; return; }
  }
  if (isWalkin) {
    const day = fval('f-day');
    if (!day) { errEl.textContent = 'Please select a day.'; errEl.style.display = 'block'; return; }
    if (isSigEmpty()) { errEl.textContent = 'Please provide your signature.'; errEl.style.display = 'block'; return; }
  }
  errEl.style.display = 'none';

  // Duplicate check — only if not bypassed
  if (!window._dupBypass) {
    const dup = await checkDuplicates(name, phone);
    if (dup) {
      showDupWarning(dup, name, phone);
      return;
    }
  }
  window._dupBypass = false;

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Submitting...'; btn.disabled = true;

  const code = await getNextCode();
  const payload = {
    name, sex, org, prog,
    position_title: position,
    email, phone,
    notes: fval('f-mel'),
    event_id: eventId,
    code,
    reg_type: isWalkin ? 'Walk-in' : 'Pre-registration'
  };
  if (isWalkin) {
    payload.day_attended = fval('f-day');
    payload.signature = sigCanvas.toDataURL('image/png');
  }

  const { data: inserted, error } = await db.from('participants').insert([payload]).select().single();
  btn.textContent = isWalkin ? 'Submit & Sign' : 'Submit & Register';
  btn.disabled = false;

  if (error) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'block'; return; }

  // Walk-in: create attendance record immediately with signature
  if (isWalkin && inserted && payload.signature) {
    try {
      const day = payload.day_attended || 'Day 1';
      // Convert base64 dataURL to Blob without fetch()
      const base64 = payload.signature.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const sigBlob = new Blob([bytes], { type: 'image/png' });
      const path = eventId + '/' + inserted.id + '/' + day.replace(' ', '_') + '_' + Date.now() + '.png';
      const { error: upErr } = await db.storage.from('signatures').upload(path, sigBlob, { contentType: 'image/png' });
      if (!upErr) {
        const { data: { publicUrl } } = db.storage.from('signatures').getPublicUrl(path);
        await db.from('attendance').insert([{
          participant_id: inserted.id,
          event_id: eventId,
          day,
          signature_url: publicUrl
        }]);
      }
    } catch(e) { console.warn('Auto-attendance failed:', e.message); }
  }

  ['f-name','f-org','f-prog','f-position','f-email','f-phone','f-mel'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-sex').value = '';
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  if (isWalkin) { clearSig(); document.getElementById('f-day').value = ''; }

  document.getElementById('confirm-name').textContent = name;
  document.getElementById('confirm-code').textContent = code;
  document.getElementById('confirm-hint').textContent = isWalkin
    ? 'You may need this code for event days.'
    : 'Keep this code — you will need it on the event day.';

  const modal = document.getElementById('success-modal');
  modal.style.display = 'flex';

  // Send confirmation email if participant has an email address
  if (inserted && payload.email) {
    const signUrl = BASE_URL + 'sign.html?participant=' + inserted.id + '&event=' + eventId;
    const evDateStr = window._eventDate
      ? new Date(window._eventDate).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
      : '';
    sendConfirmationEmail(payload.email, name, code, window._eventName || 'Event', evDateStr, inserted.id, signUrl);
  }
}

function showDupWarning(dup, name, phone) {
  const p = dup.participant;
  const messages = {
    both: 'Very likely duplicate — same phone number and similar name already registered.',
    phone: 'Same phone number already registered under a different name.',
    name: 'Similar name already registered in this event.'
  };
  document.getElementById('dup-title').textContent = messages[dup.type];
  document.getElementById('dup-details').innerHTML =
    `<p style="margin-bottom:4px"><strong>Existing:</strong> ${p.name}</p>` +
    `<p style="margin-bottom:4px"><strong>Code:</strong> <span style="font-family:monospace;color:var(--orange);font-weight:700">${p.code || '—'}</span></p>` +
    `<p style="margin-bottom:4px"><strong>Organisation:</strong> ${p.org || '—'}</p>` +
    `<p><strong>Phone:</strong> ${p.phone || '—'}</p>`;
  const modal = document.getElementById('dup-modal');
  modal.style.display = 'flex';
}

function closeDupModal() {
  document.getElementById('dup-modal').style.display = 'none';
  window._dupBypass = false;
}

function proceedDespiteDuplicate() {
  document.getElementById('dup-modal').style.display = 'none';
  window._dupBypass = true;
  registerParticipant();
}

// ── Email confirmation ──
// Worker URL set after Cloudflare Worker is deployed
const EMAIL_WORKER_URL = 'https://participants-email.metsslbg.workers.dev';

async function sendConfirmationEmail(toEmail, participantName, code, eventName, eventDate, participantId, signUrl) {
  if (!toEmail) return;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(signUrl)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:600px">

            <!-- Header band -->
            <tr>
              <td style="background:linear-gradient(90deg,#EB001B 0%,#FF5F00 60%,#F79E1B 100%);padding:28px 32px">
                <p style="margin:0;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Registration Confirmed</p>
                <h1 style="margin:6px 0 0;color:white;font-size:22px;font-weight:800">${eventName}</h1>
                ${eventDate ? `<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${eventDate}</p>` : ''}
              </td>
            </tr>

            <!-- Body -->
            <tr><td style="padding:32px">
              <p style="margin:0 0 6px;color:#666;font-size:14px">Dear <strong style="color:#000">${participantName}</strong>,</p>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6">
                Your registration has been confirmed. Please keep your participant code safe — you will need it to sign attendance on event day.
              </p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                <tr>
                  <td style="background:#f9f9f9;border-radius:10px;padding:20px;text-align:center">
                    <p style="margin:0 0 6px;color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Your Participant Code</p>
                    <p style="margin:0;color:#FF5F00;font-size:40px;font-weight:800;letter-spacing:0.1em;font-family:monospace">${code}</p>
                  </td>
                </tr>
              </table>

              <!-- QR code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                <tr>
                  <td style="text-align:center">
                    <p style="margin:0 0 12px;color:#555;font-size:13px">Scan this QR code on event day to sign attendance directly</p>
                    <img src="${qrImageUrl}" width="150" height="150" style="border:3px solid #F79E1B;border-radius:8px" alt="QR Code" />
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#999;font-size:12px;text-align:center">
                If you have any questions, please contact the event organiser.
              </p>
            </td></tr>

            <!-- Footer -->
            <tr>
              <td style="background:#000;padding:16px 32px;text-align:center">
                <p style="margin:0;color:#F79E1B;font-size:11px;font-weight:700">Participant Reg App</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await fetch(EMAIL_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        subject: 'Registration Confirmed — ' + eventName + ' [' + code + ']',
        html
      })
    });
  } catch(e) {
    console.warn('Email send failed:', e.message);
  }
}

function closeSuccessModal() {
  document.getElementById('success-modal').style.display = 'none';
}

init();

// ── Duplicate detection ──
function levenshtein(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function nameSimilarity(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalisePhone(p) {
  if (!p) return '';
  return p.replace(/[\s\-().+]/g, '').replace(/^233/, '0').replace(/^0+/, '0');
}

async function checkDuplicates(name, phone) {
  try {
  const { data, error } = await db.from('participants')
    .select('id, name, phone, code, org')
    .eq('event_id', eventId);
  if (error || !data || !data.length) return null;

  const normPhone = normalisePhone(phone);
  const results = [];

  for (const p of data) {
    const samePhone = normPhone && normalisePhone(p.phone) === normPhone;
    const nameSim = nameSimilarity(name, p.name);
    const fuzzyName = nameSim >= 0.80;

    if (samePhone && fuzzyName) {
      results.push({ participant: p, type: 'both', sim: nameSim });
    } else if (samePhone) {
      results.push({ participant: p, type: 'phone', sim: nameSim });
    } else if (fuzzyName) {
      results.push({ participant: p, type: 'name', sim: nameSim });
    }
  }

  // Return highest confidence match
  if (!results.length) return null;
  return results.sort((a, b) => {
    const rank = { both: 3, phone: 2, name: 1 };
    return rank[b.type] - rank[a.type];
  })[0];
  } catch(e) { console.warn('Duplicate check failed:', e.message); return null; }
}
