// ════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATES — Participant Registration App
// W=841.89pt H=595.28pt — A4 Landscape, all coordinates proportional
// ════════════════════════════════════════════════════════════════════

window.CERT_TEMPLATES = {

  // ── TEMPLATE 1: Navy Gold Classic ────────────────────────────────
  navy_gold: {
    name: 'Navy Gold Classic',
    desc: 'Deep navy with gold accents — formal and prestigious',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const NAVY  = [15,  40, 90];
      const DNVY  = [10,  25, 60];
      const GLD   = [212,175, 55];
      const LGLD  = [240,210,100];
      const WHT   = [255,255,255];
      const OFFWH = [245,242,230];
      const GRY   = [160,160,160];
      const CX    = W / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || '19 May 2026';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=0a1940&bgcolor=ffffff&data=${encodeURIComponent('https://metsslbg-stack.github.io/participants-app/'+(p?.code||''))}`;

      // Off-white base
      doc.setFillColor(...OFFWH); doc.rect(0, 0, W, H, 'F');

      // Navy left panel (30% width)
      doc.setFillColor(...DNVY); doc.rect(0, 0, W*0.30, H, 'F');

      // Gold vertical accent line between panel and body
      doc.setFillColor(...GLD); doc.rect(W*0.30, 0, W*0.006, H, 'F');
      doc.setFillColor(...LGLD); doc.rect(W*0.306, 0, W*0.003, H, 'F');

      // Gold top border line
      doc.setFillColor(...GLD); doc.rect(W*0.309, 0, W*0.691, H*0.012, 'F');

      // Gold bottom border line
      doc.setFillColor(...GLD); doc.rect(W*0.309, H*0.988, W*0.691, H*0.012, 'F');

      // Gold right border line
      doc.setFillColor(...GLD); doc.rect(W*0.994, 0, W*0.006, H, 'F');

      // ── LEFT PANEL ───────────────────────────────────────────────
      // "CERTIFICATE" vertical text simulation — rotated title
      doc.setTextColor(...GLD);
      doc.setFontSize(H * 0.028);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE', W*0.155, H*0.18, { align:'center', charSpace: 2 });

      doc.setTextColor(...LGLD);
      doc.setFontSize(H * 0.020);
      doc.setFont('helvetica', 'normal');
      doc.text('OF PARTICIPATION', W*0.155, H*0.218, { align:'center', charSpace: 1.5 });

      // Gold divider line in left panel
      doc.setDrawColor(...GLD); doc.setLineWidth(0.6);
      doc.line(W*0.06, H*0.240, W*0.25, H*0.240);

      // Date block in left panel
      doc.setTextColor(180, 190, 220);
      doc.setFontSize(H * 0.016);
      doc.setFont('helvetica', 'normal');
      doc.text('EVENT DATE', W*0.155, H*0.30, { align:'center' });

      doc.setTextColor(...GLD);
      doc.setFontSize(H * 0.022);
      doc.setFont('helvetica', 'bold');
      doc.text(DATE_STR, W*0.155, H*0.328, { align:'center' });

      // Issue date
      doc.setTextColor(180,190,220);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', W*0.155, H*0.375, { align:'center' });

      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.020);
      doc.setFont('helvetica','bold');
      doc.text(ISSUE_DATE, W*0.155, H*0.400, { align:'center' });

      // Certificate ID
      doc.setDrawColor(...GLD); doc.setLineWidth(0.5);
      doc.line(W*0.06, H*0.430, W*0.25, H*0.430);

      doc.setTextColor(180,190,220);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', W*0.155, H*0.468, { align:'center' });

      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.030);
      doc.setFont('helvetica','bold');
      doc.text(CODE, W*0.155, H*0.500, { align:'center' });

      // QR code in left panel
      doc.setFillColor(255,255,255);
      doc.roundedRect(W*0.070, H*0.560, W*0.168, H*0.168, H*0.008, H*0.008, 'F');
      try {
        doc.addImage(QR_URL, 'PNG', W*0.076, H*0.566, W*0.156, H*0.156);
      } catch(e) {
        doc.setTextColor(150,150,150);
        doc.setFontSize(H*0.018);
        doc.text('QR', W*0.155, H*0.648, { align:'center' });
      }
      doc.setTextColor(180,190,220);
      doc.setFontSize(H*0.014);
      doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', W*0.155, H*0.748, { align:'center' });

      // Signatory at bottom of left panel
      doc.setDrawColor(...GLD); doc.setLineWidth(0.6);
      doc.line(W*0.045, H*0.870, W*0.260, H*0.870);
      if (sigB64) {
        doc.addImage(sigB64,'PNG', W*0.065, H*0.800, W*0.180, H*0.065);
      }
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.020);
      doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, W*0.155, H*0.895, { align:'center' });

      doc.setTextColor(180,190,220);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text(SIG_TITLE, W*0.155, H*0.916, { align:'center' });

      // ── RIGHT BODY ───────────────────────────────────────────────
      const RX = W*0.309; // right body start
      const RCX = RX + (W - RX) / 2; // centre of right body

      // "This is to certify that"
      doc.setTextColor(...NAVY);
      doc.setFontSize(H*0.030);
      doc.setFont('helvetica','italic');
      doc.text('This is to certify that', RCX, H*0.180, { align:'center' });

      // Gold underline
      doc.setFillColor(...GLD);
      doc.rect(RCX - W*0.18, H*0.196, W*0.36, H*0.004, 'F');

      // Participant name
      const nFs = NAME.length > 32 ? H*0.058 : NAME.length > 22 ? H*0.070 : H*0.084;
      doc.setFontSize(nFs);
      doc.setFont('helvetica','bold');
      doc.setTextColor(...DNVY);
      doc.text(NAME, RCX, H*0.315, { align:'center' });

      // Name underline gold
      const nW = Math.min(doc.getTextWidth(NAME), W*0.58);
      doc.setFillColor(...GLD);
      doc.rect(RCX - nW/2, H*0.330, nW, H*0.006, 'F');

      // Position · Org
      const det = [POSITION, ORG_NAME].filter(Boolean).join('   ·   ');
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.026);
      doc.setFont('helvetica','normal');
      doc.text(det, RCX, H*0.372, { align:'center' });

      // "has successfully participated in"
      doc.setTextColor(100,100,100);
      doc.setFontSize(H*0.028);
      doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', RCX, H*0.440, { align:'center' });

      // Event name
      doc.setTextColor(...NAVY);
      doc.setFontSize(H*0.040);
      doc.setFont('helvetica','bold');
      const evLines = doc.splitTextToSize(EV_NAME, W*0.56);
      doc.text(evLines, RCX, H*0.510, { align:'center' });

      // Programme · Organiser
      const evBottom = H*0.510 + (evLines.length - 1)*H*0.048;
      const orgLine = [PROGRAM, ORGANISER].filter(Boolean).join('   ·   ');
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','normal');
      doc.text(orgLine, RCX, evBottom + H*0.044, { align:'center' });

      // Gold decorative bottom line
      doc.setFillColor(...GLD);
      doc.rect(RX + W*0.04, H*0.870, W*0.60, H*0.005, 'F');
    }
  },

  // ── TEMPLATE 2: Emerald Minimal ───────────────────────────────────
  emerald_minimal: {
    name: 'Emerald Minimal',
    desc: 'Clean white with emerald green — modern and elegant',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const EMR   = [0,  100,  80];
      const DEMR  = [0,   70,  55];
      const LEMR  = [0,  140, 110];
      const GLD   = [200,165,  45];
      const BLK   = [ 30,  30,  30];
      const WHT   = [255,255,255];
      const GRY   = [130,130,130];
      const LGRY  = [245,248,246];
      const CX    = W / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || '19 May 2026';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=006450&bgcolor=ffffff&data=${encodeURIComponent('https://metsslbg-stack.github.io/participants-app/'+(p?.code||''))}`;

      // Light green-white base
      doc.setFillColor(...LGRY); doc.rect(0, 0, W, H, 'F');
      doc.setFillColor(...WHT); doc.rect(W*0.03, H*0.04, W*0.94, H*0.92, 'F');

      // Emerald top band
      doc.setFillColor(...DEMR); doc.rect(W*0.03, H*0.04, W*0.94, H*0.155, 'F');

      // Gold accent line under top band
      doc.setFillColor(...GLD); doc.rect(W*0.03, H*0.195, W*0.94, H*0.007, 'F');

      // Emerald bottom band
      doc.setFillColor(...DEMR); doc.rect(W*0.03, H*0.855, W*0.94, H*0.125, 'F');

      // Gold accent line above bottom band
      doc.setFillColor(...GLD); doc.rect(W*0.03, H*0.848, W*0.94, H*0.007, 'F');

      // Thin emerald outer border
      doc.setDrawColor(...DEMR); doc.setLineWidth(1.5);
      doc.rect(W*0.012, H*0.020, W*0.976, H*0.960);

      // ── TOP BAND ─────────────────────────────────────────────────
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.058);
      doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE OF PARTICIPATION', CX, H*0.110, { align:'center', charSpace: H*0.005 });

      doc.setTextColor(180, 230, 210);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','normal');
      doc.text('Official Participant Recognition', CX, H*0.155, { align:'center' });

      // ── BODY ─────────────────────────────────────────────────────
      // "This is to certify that"
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.030);
      doc.setFont('helvetica','italic');
      doc.text('This is to certify that', CX, H*0.268, { align:'center' });

      // Participant name
      const nFs = NAME.length > 32 ? H*0.058 : NAME.length > 22 ? H*0.070 : H*0.084;
      doc.setFontSize(nFs);
      doc.setFont('helvetica','bold');
      doc.setTextColor(...DEMR);
      doc.text(NAME, CX, H*0.378, { align:'center' });

      // Emerald underline
      const nW = Math.min(doc.getTextWidth(NAME), W*0.68);
      doc.setFillColor(...GLD);
      doc.rect(CX - nW/2, H*0.393, nW, H*0.006, 'F');

      // Position · Org
      const det = [POSITION, ORG_NAME].filter(Boolean).join('   ·   ');
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.026);
      doc.setFont('helvetica','normal');
      doc.text(det, CX, H*0.434, { align:'center' });

      // "has successfully participated in"
      doc.setTextColor(100,100,100);
      doc.setFontSize(H*0.028);
      doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', CX, H*0.492, { align:'center' });

      // Event name
      doc.setTextColor(...BLK);
      doc.setFontSize(H*0.040);
      doc.setFont('helvetica','bold');
      const evLines = doc.splitTextToSize(EV_NAME, W*0.72);
      doc.text(evLines, CX, H*0.554, { align:'center' });

      // Programme · Organiser
      const evBottom = H*0.554 + (evLines.length-1)*H*0.048;
      const orgLine = [PROGRAM, ORGANISER].filter(Boolean).join('   ·   ');
      doc.setTextColor(LEMR[0], LEMR[1], LEMR[2]);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','normal');
      doc.text(orgLine, CX, evBottom + H*0.042, { align:'center' });

      // ── BOTTOM BAND — three columns ───────────────────────────────
      // Left: dates + ID
      const BX = W*0.08;
      const BY = H*0.883;
      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text('EVENT DATE', BX, BY);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','bold');
      doc.text(DATE_STR, BX, BY + H*0.030);

      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', BX, BY + H*0.064);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.026);
      doc.setFont('helvetica','bold');
      doc.text(CODE, BX, BY + H*0.090);

      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', BX, BY + H*0.116);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.018);
      doc.setFont('helvetica','normal');
      doc.text(ISSUE_DATE, BX, BY + H*0.138);

      // Centre: QR
      const QX = CX - H*0.058;
      const QY = H*0.872;
      const QS = H*0.110;
      doc.setFillColor(255,255,255);
      doc.roundedRect(QX - H*0.008, QY - H*0.006, QS + H*0.016, QS + H*0.016, H*0.008, H*0.008, 'F');
      try {
        doc.addImage(QR_URL, 'PNG', QX, QY, QS, QS);
      } catch(e) {
        doc.setTextColor(100,100,100);
        doc.setFontSize(H*0.018);
        doc.text('QR', CX, QY + QS/2 + H*0.008, { align:'center' });
      }
      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.014);
      doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', CX, QY + QS + H*0.022, { align:'center' });

      // Right: Signature
      const SX = CX + W*0.10;
      const SY = H*0.958;
      const lineW = W*0.26;
      if (sigB64) doc.addImage(sigB64,'PNG', SX, SY - H*0.074, W*0.20, H*0.062);
      doc.setDrawColor(...WHT); doc.setLineWidth(0.7);
      doc.line(SX, SY, SX + lineW, SY);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, SX + lineW/2, SY + H*0.028, { align:'center' });
      doc.setFontSize(H*0.017);
      doc.setFont('helvetica','normal');
      doc.setTextColor(170,220,200);
      doc.text(SIG_TITLE, SX + lineW/2, SY + H*0.048, { align:'center' });
    }
  },

  // ── TEMPLATE 3: Burgundy Prestige ────────────────────────────────
  burgundy_prestige: {
    name: 'Burgundy Prestige',
    desc: 'Rich burgundy with cream — premium and authoritative',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const BRG   = [120,  20,  40];
      const DBRG  = [ 80,  10,  25];
      const LBRG  = [160,  50,  70];
      const CRM   = [255, 248, 230];
      const GLD   = [200, 165,  45];
      const LGLD  = [230, 200,  90];
      const BLK   = [ 30,  30,  30];
      const GRY   = [130, 100, 110];
      const CX    = W / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || '19 May 2026';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=78142b&bgcolor=fff8e6&data=${encodeURIComponent('https://metsslbg-stack.github.io/participants-app/'+(p?.code||''))}`;

      // Cream base
      doc.setFillColor(...CRM); doc.rect(0, 0, W, H, 'F');

      // Double gold outer border
      doc.setDrawColor(...GLD); doc.setLineWidth(2.5);
      doc.rect(W*0.018, H*0.025, W*0.964, H*0.950);
      doc.setDrawColor(...LGLD); doc.setLineWidth(0.8);
      doc.rect(W*0.028, H*0.038, W*0.944, H*0.924);

      // Burgundy top band
      doc.setFillColor(...DBRG); doc.rect(W*0.018, H*0.025, W*0.964, H*0.170, 'F');

      // Gold line below top band
      doc.setFillColor(...GLD); doc.rect(W*0.018, H*0.195, W*0.964, H*0.008, 'F');
      doc.setFillColor(...LGLD); doc.rect(W*0.018, H*0.203, W*0.964, H*0.003, 'F');

      // Burgundy bottom band
      doc.setFillColor(...DBRG); doc.rect(W*0.018, H*0.848, W*0.964, H*0.127, 'F');

      // Gold line above bottom band
      doc.setFillColor(...LGLD); doc.rect(W*0.018, H*0.841, W*0.964, H*0.003, 'F');
      doc.setFillColor(...GLD); doc.rect(W*0.018, H*0.844, W*0.964, H*0.008, 'F');

      // Corner gold ornaments — simple squares
      const cs = H*0.040;
      [[W*0.018,H*0.025],[W*0.982-cs,H*0.025],[W*0.018,H*0.975-cs],[W*0.982-cs,H*0.975-cs]].forEach(([x,y]) => {
        doc.setFillColor(...GLD); doc.rect(x, y, cs, cs, 'F');
        doc.setFillColor(...DBRG); doc.rect(x+cs*0.25, y+cs*0.25, cs*0.5, cs*0.5, 'F');
      });

      // ── TOP BAND ─────────────────────────────────────────────────
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.060);
      doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE OF PARTICIPATION', CX, H*0.110, { align:'center', charSpace: H*0.005 });

      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.020);
      doc.setFont('helvetica','normal');
      doc.text('Official Recognition of Achievement', CX, H*0.155, { align:'center', charSpace: 1.5 });

      // Thin gold rule
      doc.setDrawColor(...GLD); doc.setLineWidth(0.5);
      doc.line(CX - W*0.18, H*0.176, CX + W*0.18, H*0.176);

      // ── BODY ─────────────────────────────────────────────────────
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.030);
      doc.setFont('helvetica','italic');
      doc.text('This is to certify that', CX, H*0.264, { align:'center' });

      // Participant name
      const nFs = NAME.length > 32 ? H*0.056 : NAME.length > 22 ? H*0.068 : H*0.082;
      doc.setFontSize(nFs);
      doc.setFont('helvetica','bold');
      doc.setTextColor(...DBRG);
      doc.text(NAME, CX, H*0.372, { align:'center' });

      // Gold name underline
      const nW = Math.min(doc.getTextWidth(NAME), W*0.70);
      doc.setFillColor(...GLD);
      doc.rect(CX - nW/2, H*0.386, nW, H*0.006, 'F');

      // Position · Org
      const det = [POSITION, ORG_NAME].filter(Boolean).join('   ·   ');
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.025);
      doc.setFont('helvetica','normal');
      doc.text(det, CX, H*0.426, { align:'center' });

      // "has successfully participated in"
      doc.setTextColor(120,80,90);
      doc.setFontSize(H*0.027);
      doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', CX, H*0.484, { align:'center' });

      // Event name
      doc.setTextColor(...BLK);
      doc.setFontSize(H*0.038);
      doc.setFont('helvetica','bold');
      const evLines = doc.splitTextToSize(EV_NAME, W*0.72);
      doc.text(evLines, CX, H*0.546, { align:'center' });

      // Programme · Organiser
      const evBottom = H*0.546 + (evLines.length-1)*H*0.046;
      const orgLine = [PROGRAM, ORGANISER].filter(Boolean).join('   ·   ');
      doc.setTextColor(...LBRG);
      doc.setFontSize(H*0.021);
      doc.setFont('helvetica','normal');
      doc.text(orgLine, CX, evBottom + H*0.040, { align:'center' });

      // ── BOTTOM BAND ───────────────────────────────────────────────
      const BX = W*0.07;
      const BY = H*0.882;
      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.015);
      doc.setFont('helvetica','normal');
      doc.text('EVENT DATE', BX, BY);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.022);
      doc.setFont('helvetica','bold');
      doc.text(DATE_STR, BX, BY + H*0.028);

      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.015);
      doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', BX, BY + H*0.060);
      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.026);
      doc.setFont('helvetica','bold');
      doc.text(CODE, BX, BY + H*0.086);

      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.015);
      doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', BX, BY + H*0.112);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.018);
      doc.setFont('helvetica','normal');
      doc.text(ISSUE_DATE, BX, BY + H*0.132);

      // Centre QR
      const QX = CX - H*0.056;
      const QY = H*0.869;
      const QS = H*0.108;
      doc.setFillColor(...CRM);
      doc.roundedRect(QX - H*0.008, QY - H*0.006, QS + H*0.016, QS + H*0.016, H*0.008, H*0.008, 'F');
      try {
        doc.addImage(QR_URL, 'PNG', QX, QY, QS, QS);
      } catch(e) {
        doc.setTextColor(100,100,100);
        doc.setFontSize(H*0.018);
        doc.text('QR', CX, QY + QS/2, { align:'center' });
      }
      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.013);
      doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', CX, QY + QS + H*0.020, { align:'center' });

      // Signature right
      const SX = CX + W*0.10;
      const SY = H*0.956;
      const lineW = W*0.26;
      if (sigB64) doc.addImage(sigB64,'PNG', SX, SY - H*0.072, W*0.20, H*0.060);
      doc.setDrawColor(...GLD); doc.setLineWidth(0.7);
      doc.line(SX, SY, SX + lineW, SY);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.021);
      doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, SX + lineW/2, SY + H*0.027, { align:'center' });
      doc.setFontSize(H*0.016);
      doc.setFont('helvetica','normal');
      doc.setTextColor(180,150,160);
      doc.text(SIG_TITLE, SX + lineW/2, SY + H*0.046, { align:'center' });
    }
  }

};
