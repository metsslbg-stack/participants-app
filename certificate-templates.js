// ════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATES — Participant Registration App
// W=841.89pt H=595.28pt — A4 Landscape, all coordinates proportional
// ════════════════════════════════════════════════════════════════════

window.CERT_TEMPLATES = {

  // ── TEMPLATE 1: Navy Gold Classic ────────────────────────────────
  navy_gold: {
    name: 'Navy Gold Classic',
    desc: 'Deep navy panel with gold accents',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const NAVY = [15, 40, 90];
      const GLD  = [212,175,55];
      const LGLD = [240,210,100];
      const WHT  = [255,255,255];
      const OFFWH= [245,242,230];
      const GRY  = [140,140,140];
      const CX   = W / 2;
      const PW   = W * 0.30; // left panel width
      const RX   = PW + W * 0.006 + W * 0.003; // right body start
      const RCX  = RX + (W - RX) / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || 'DD Month YYYY';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=0a1940&bgcolor=f5f2e6&data=${encodeURIComponent('https://participants-app-five.vercel.app/'+(p?.code||''))}`;

      // Off-white base
      doc.setFillColor(...OFFWH); doc.rect(0,0,W,H,'F');

      // Navy left panel
      doc.setFillColor(...NAVY); doc.rect(0,0,PW,H,'F');

      // Gold separator lines
      doc.setFillColor(...GLD);  doc.rect(PW,0,W*0.006,H,'F');
      doc.setFillColor(...LGLD); doc.rect(PW+W*0.006,0,W*0.003,H,'F');

      // Gold top + bottom borders on right body
      doc.setFillColor(...GLD);
      doc.rect(RX,0,W-RX,H*0.012,'F');
      doc.rect(RX,H*0.988,W-RX,H*0.012,'F');
      doc.rect(W*0.994,0,W*0.006,H,'F');

      // ── LEFT PANEL ───────────────────────────────────────────────
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.026); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE', PW/2, H*0.170, {align:'center', charSpace:2});

      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.018); doc.setFont('helvetica','normal');
      doc.text('OF PARTICIPATION', PW/2, H*0.205, {align:'center', charSpace:1.5});

      doc.setDrawColor(...GLD); doc.setLineWidth(0.5);
      doc.line(PW*0.18,H*0.228,PW*0.82,H*0.228);

      // Date block
      doc.setTextColor(160,175,215);
      doc.setFontSize(H*0.015); doc.setFont('helvetica','normal');
      doc.text('EVENT DATE', PW/2, H*0.278, {align:'center'});
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','bold');
      doc.text(DATE_STR, PW/2, H*0.302, {align:'center'});

      doc.setTextColor(160,175,215);
      doc.setFontSize(H*0.015); doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', PW/2, H*0.348, {align:'center'});
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.018); doc.setFont('helvetica','bold');
      doc.text(ISSUE_DATE, PW/2, H*0.370, {align:'center'});

      doc.setDrawColor(...GLD); doc.setLineWidth(0.5);
      doc.line(PW*0.18,H*0.400,PW*0.82,H*0.400);

      doc.setTextColor(160,175,215);
      doc.setFontSize(H*0.015); doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', PW/2, H*0.436, {align:'center'});
      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.028); doc.setFont('helvetica','bold');
      doc.text(CODE, PW/2, H*0.464, {align:'center'});

      // QR code
      const QS = H*0.120;
      const QX = PW/2 - QS/2;
      const QY = H*0.510;
      doc.setFillColor(255,255,255);
      doc.roundedRect(QX-H*0.008,QY-H*0.008,QS+H*0.016,QS+H*0.016,H*0.008,H*0.008,'F');
      try { doc.addImage(QR_URL,'PNG',QX,QY,QS,QS); }
      catch(e) {
        doc.setTextColor(150,150,150);
        doc.setFontSize(H*0.018);
        doc.text('QR',PW/2,QY+QS/2,{align:'center'});
      }
      doc.setTextColor(160,175,215);
      doc.setFontSize(H*0.013); doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', PW/2, QY+QS+H*0.022, {align:'center'});

      // Signatory
      doc.setDrawColor(...GLD); doc.setLineWidth(0.5);
      doc.line(PW*0.10,H*0.848,PW*0.90,H*0.848);
      if (sigB64) doc.addImage(sigB64,'PNG',PW*0.12,H*0.778,PW*0.76,H*0.065);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.018); doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, PW/2, H*0.872, {align:'center'});
      doc.setTextColor(160,175,215);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text(SIG_TITLE, PW/2, H*0.892, {align:'center'});

      // ── RIGHT BODY ───────────────────────────────────────────────
      doc.setTextColor(...NAVY);
      doc.setFontSize(H*0.028); doc.setFont('helvetica','italic');
      doc.text('This is to certify that', RCX, H*0.175, {align:'center'});

      doc.setFillColor(...GLD);
      doc.rect(RCX-W*0.15,H*0.190,W*0.30,H*0.004,'F');

      const nFs = NAME.length>32?H*0.056:NAME.length>22?H*0.068:H*0.082;
      doc.setFontSize(nFs); doc.setFont('helvetica','bold');
      doc.setTextColor(...NAVY);
      doc.text(NAME, RCX, H*0.305, {align:'center'});

      const nW = Math.min(doc.getTextWidth(NAME), W*0.56);
      doc.setFillColor(...GLD);
      doc.rect(RCX-nW/2,H*0.318,nW,H*0.005,'F');

      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.024); doc.setFont('helvetica','normal');
      doc.text([POSITION, ORG_NAME].filter(Boolean).join('   ·   '), RCX, H*0.358, {align:'center'});

      doc.setTextColor(100,100,100);
      doc.setFontSize(H*0.026); doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', RCX, H*0.420, {align:'center'});

      doc.setTextColor(...NAVY);
      doc.setFontSize(H*0.038); doc.setFont('helvetica','bold');
      const evL = doc.splitTextToSize(EV_NAME, W*0.54);
      doc.text(evL, RCX, H*0.490, {align:'center'});

      const evB = H*0.490 + (evL.length-1)*H*0.046;
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','normal');
      doc.text([PROGRAM, ORGANISER].filter(Boolean).join('   ·   '), RCX, evB+H*0.040, {align:'center'});
    }
  },

  // ── TEMPLATE 2: Emerald Minimal ───────────────────────────────────
  emerald_minimal: {
    name: 'Emerald Minimal',
    desc: 'Clean white with emerald green and gold',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const EMR  = [0, 100, 80];
      const DEMR = [0,  70, 55];
      const GLD  = [200,165,45];
      const BLK  = [30,  30, 30];
      const WHT  = [255,255,255];
      const GRY  = [130,130,130];
      const CX   = W / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || 'DD Month YYYY';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=006450&bgcolor=ffffff&data=${encodeURIComponent('https://participants-app-five.vercel.app/'+(p?.code||''))}`;

      // White base
      doc.setFillColor(...WHT); doc.rect(0,0,W,H,'F');

      // Emerald top band
      doc.setFillColor(...DEMR); doc.rect(0,0,W,H*0.160,'F');

      // Gold line below top band
      doc.setFillColor(...GLD); doc.rect(0,H*0.160,W,H*0.007,'F');

      // Emerald bottom band
      doc.setFillColor(...DEMR); doc.rect(0,H*0.848,W,H*0.152,'F');

      // Gold line above bottom band
      doc.setFillColor(...GLD); doc.rect(0,H*0.841,W,H*0.007,'F');

      // Thin emerald outer border
      doc.setDrawColor(...DEMR); doc.setLineWidth(1.5);
      doc.rect(H*0.012,H*0.012,W-H*0.024,H-H*0.024);

      // ── TOP BAND ─────────────────────────────────────────────────
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.056); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE OF PARTICIPATION', CX, H*0.098, {align:'center', charSpace:H*0.004});

      doc.setTextColor(180,230,210);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','normal');
      doc.text('Official Participant Recognition', CX, H*0.138, {align:'center'});

      // ── BODY ─────────────────────────────────────────────────────
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.028); doc.setFont('helvetica','italic');
      doc.text('This is to certify that', CX, H*0.252, {align:'center'});

      const nFs = NAME.length>32?H*0.056:NAME.length>22?H*0.068:H*0.082;
      doc.setFontSize(nFs); doc.setFont('helvetica','bold');
      doc.setTextColor(...DEMR);
      doc.text(NAME, CX, H*0.360, {align:'center'});

      const nW = Math.min(doc.getTextWidth(NAME), W*0.68);
      doc.setFillColor(...GLD);
      doc.rect(CX-nW/2,H*0.374,nW,H*0.005,'F');

      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.024); doc.setFont('helvetica','normal');
      doc.text([POSITION, ORG_NAME].filter(Boolean).join('   ·   '), CX, H*0.414, {align:'center'});

      doc.setTextColor(100,100,100);
      doc.setFontSize(H*0.026); doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', CX, H*0.470, {align:'center'});

      doc.setTextColor(...BLK);
      doc.setFontSize(H*0.038); doc.setFont('helvetica','bold');
      const evL = doc.splitTextToSize(EV_NAME, W*0.72);
      doc.text(evL, CX, H*0.530, {align:'center'});

      const evB = H*0.530 + (evL.length-1)*H*0.046;
      doc.setTextColor(EMR[0],EMR[1],EMR[2]);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','normal');
      doc.text([PROGRAM, ORGANISER].filter(Boolean).join('   ·   '), CX, evB+H*0.038, {align:'center'});

      // ── BOTTOM BAND ───────────────────────────────────────────────
      const BX = W*0.075;
      const BY = H*0.878;

      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('EVENT DATE', BX, BY);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','bold');
      doc.text(DATE_STR, BX, BY+H*0.026);

      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', BX, BY+H*0.060);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.024); doc.setFont('helvetica','bold');
      doc.text(CODE, BX, BY+H*0.084);

      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', BX, BY+H*0.110);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.016); doc.setFont('helvetica','normal');
      doc.text(ISSUE_DATE, BX, BY+H*0.130);

      // QR centre
      const QS = H*0.106;
      const QX = CX - QS/2;
      const QY = H*0.864;
      doc.setFillColor(255,255,255);
      doc.roundedRect(QX-H*0.007,QY-H*0.007,QS+H*0.014,QS+H*0.014,H*0.007,H*0.007,'F');
      try { doc.addImage(QR_URL,'PNG',QX,QY,QS,QS); }
      catch(e) {
        doc.setTextColor(100,100,100);
        doc.setFontSize(H*0.018);
        doc.text('QR',CX,QY+QS/2,{align:'center'});
      }
      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.013); doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', CX, QY+QS+H*0.020, {align:'center'});

      // Signature right
      const SX = CX+W*0.100;
      const SY = H*0.950;
      const LW = W*0.260;
      if (sigB64) doc.addImage(sigB64,'PNG',SX,SY-H*0.072,W*0.200,H*0.060);
      doc.setDrawColor(...WHT); doc.setLineWidth(0.7);
      doc.line(SX,SY,SX+LW,SY);
      doc.setTextColor(...WHT);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, SX+LW/2, SY+H*0.026, {align:'center'});
      doc.setTextColor(170,220,200);
      doc.setFontSize(H*0.015); doc.setFont('helvetica','normal');
      doc.text(SIG_TITLE, SX+LW/2, SY+H*0.044, {align:'center'});
    }
  },

  // ── TEMPLATE 3: Burgundy Prestige ────────────────────────────────
  burgundy_prestige: {
    name: 'Burgundy Prestige',
    desc: 'Rich burgundy with cream and gold',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const DBRG = [80,  10, 25];
      const LBRG = [160, 50, 70];
      const CRM  = [255,248,230];
      const GLD  = [200,165,45];
      const LGLD = [230,200,90];
      const BLK  = [30,  30, 30];
      const GRY  = [130,100,110];
      const CX   = W / 2;

      const NAME      = p?.name             || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title   || 'Position Title';
      const ORG_NAME  = p?.org              || 'Organisation Name';
      const EV_NAME   = evName              || 'Full Title of the Event or Programme Convening';
      const PROGRAM   = ev?.program         || 'Programme Name';
      const ORGANISER = ev?.organizer       || 'Organising Institution';
      const DATE_STR  = dateStr             || 'DD Month YYYY';
      const ISSUE_DATE= new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const CODE      = p?.code             || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=78142b&bgcolor=fff8e6&data=${encodeURIComponent('https://participants-app-five.vercel.app/'+(p?.code||''))}`;

      // Cream base
      doc.setFillColor(...CRM); doc.rect(0,0,W,H,'F');

      // Double gold border
      doc.setDrawColor(...GLD); doc.setLineWidth(2.5);
      doc.rect(W*0.018,H*0.024,W*0.964,H*0.952);
      doc.setDrawColor(...LGLD); doc.setLineWidth(0.7);
      doc.rect(W*0.028,H*0.036,W*0.944,H*0.928);

      // Burgundy top band
      doc.setFillColor(...DBRG); doc.rect(W*0.018,H*0.024,W*0.964,H*0.162,'F');

      // Gold line below top band
      doc.setFillColor(...GLD);  doc.rect(W*0.018,H*0.186,W*0.964,H*0.008,'F');
      doc.setFillColor(...LGLD); doc.rect(W*0.018,H*0.194,W*0.964,H*0.003,'F');

      // Burgundy bottom band
      doc.setFillColor(...DBRG); doc.rect(W*0.018,H*0.848,W*0.964,H*0.128,'F');

      // Gold line above bottom band
      doc.setFillColor(...LGLD); doc.rect(W*0.018,H*0.841,W*0.964,H*0.003,'F');
      doc.setFillColor(...GLD);  doc.rect(W*0.018,H*0.844,W*0.964,H*0.008,'F');

      // Corner ornaments
      const cs = H*0.038;
      [[W*0.018,H*0.024],[W*0.982-cs,H*0.024],[W*0.018,H*0.976-cs],[W*0.982-cs,H*0.976-cs]].forEach(([x,y])=>{
        doc.setFillColor(...GLD); doc.rect(x,y,cs,cs,'F');
        doc.setFillColor(...DBRG); doc.rect(x+cs*0.25,y+cs*0.25,cs*0.5,cs*0.5,'F');
      });

      // ── TOP BAND ─────────────────────────────────────────────────
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.058); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE OF PARTICIPATION', CX, H*0.106, {align:'center', charSpace:H*0.004});

      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.018); doc.setFont('helvetica','normal');
      doc.text('Official Recognition of Achievement', CX, H*0.146, {align:'center', charSpace:1.5});

      doc.setDrawColor(...GLD); doc.setLineWidth(0.4);
      doc.line(CX-W*0.16,H*0.168,CX+W*0.16,H*0.168);

      // ── BODY ─────────────────────────────────────────────────────
      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.028); doc.setFont('helvetica','italic');
      doc.text('This is to certify that', CX, H*0.258, {align:'center'});

      const nFs = NAME.length>32?H*0.054:NAME.length>22?H*0.066:H*0.080;
      doc.setFontSize(nFs); doc.setFont('helvetica','bold');
      doc.setTextColor(...DBRG);
      doc.text(NAME, CX, H*0.362, {align:'center'});

      const nW = Math.min(doc.getTextWidth(NAME), W*0.70);
      doc.setFillColor(...GLD);
      doc.rect(CX-nW/2,H*0.375,nW,H*0.005,'F');

      doc.setTextColor(...GRY);
      doc.setFontSize(H*0.023); doc.setFont('helvetica','normal');
      doc.text([POSITION, ORG_NAME].filter(Boolean).join('   ·   '), CX, H*0.414, {align:'center'});

      doc.setTextColor(120,80,90);
      doc.setFontSize(H*0.026); doc.setFont('helvetica','italic');
      doc.text('has successfully participated in', CX, H*0.472, {align:'center'});

      doc.setTextColor(...BLK);
      doc.setFontSize(H*0.036); doc.setFont('helvetica','bold');
      const evL = doc.splitTextToSize(EV_NAME, W*0.72);
      doc.text(evL, CX, H*0.532, {align:'center'});

      const evB = H*0.532 + (evL.length-1)*H*0.044;
      doc.setTextColor(...LBRG);
      doc.setFontSize(H*0.019); doc.setFont('helvetica','normal');
      doc.text([PROGRAM, ORGANISER].filter(Boolean).join('   ·   '), CX, evB+H*0.038, {align:'center'});

      // ── BOTTOM BAND ───────────────────────────────────────────────
      const BX = W*0.065;
      const BY = H*0.878;

      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('EVENT DATE', BX, BY);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.020); doc.setFont('helvetica','bold');
      doc.text(DATE_STR, BX, BY+H*0.026);

      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('CERTIFICATE ID', BX, BY+H*0.058);
      doc.setTextColor(...LGLD);
      doc.setFontSize(H*0.024); doc.setFont('helvetica','bold');
      doc.text(CODE, BX, BY+H*0.082);

      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text('ISSUE DATE', BX, BY+H*0.108);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.016); doc.setFont('helvetica','normal');
      doc.text(ISSUE_DATE, BX, BY+H*0.128);

      // QR centre
      const QS = H*0.104;
      const QX = CX-QS/2;
      const QY = H*0.863;
      doc.setFillColor(...CRM);
      doc.roundedRect(QX-H*0.007,QY-H*0.007,QS+H*0.014,QS+H*0.014,H*0.007,H*0.007,'F');
      try { doc.addImage(QR_URL,'PNG',QX,QY,QS,QS); }
      catch(e) {
        doc.setTextColor(100,100,100);
        doc.setFontSize(H*0.018);
        doc.text('QR',CX,QY+QS/2,{align:'center'});
      }
      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.013); doc.setFont('helvetica','normal');
      doc.text('VERIFICATION', CX, QY+QS+H*0.018, {align:'center'});

      // Signature right
      const SX = CX+W*0.100;
      const SY = H*0.950;
      const LW = W*0.260;
      if (sigB64) doc.addImage(sigB64,'PNG',SX,SY-H*0.070,W*0.200,H*0.058);
      doc.setDrawColor(...GLD); doc.setLineWidth(0.7);
      doc.line(SX,SY,SX+LW,SY);
      doc.setTextColor(...GLD);
      doc.setFontSize(H*0.019); doc.setFont('helvetica','bold');
      doc.text(SIG_NAME, SX+LW/2, SY+H*0.025, {align:'center'});
      doc.setTextColor(180,150,160);
      doc.setFontSize(H*0.014); doc.setFont('helvetica','normal');
      doc.text(SIG_TITLE, SX+LW/2, SY+H*0.043, {align:'center'});
    }
  }

};
