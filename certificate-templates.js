// ════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATES — Participant Registration App
// A4 Landscape: W=841.89pt H=595.28pt — all coordinates proportional
// ════════════════════════════════════════════════════════════════════

window.CERT_TEMPLATES = {

  clean_institutional: {
    name: 'Clean Institutional',
    desc: 'MCF brand colours, formal layout, donor-ready',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const RED  = [235,  0, 27];
      const ORG  = [255, 95,  0];
      const YEL  = [247,158, 27];
      const BLK  = [ 20, 20, 20];
      const WHT  = [255,255,255];
      const GRY  = [120,120,120];
      const CX   = W / 2;

      // ── PLACEHOLDERS (replace with live data when approved) ───────
      const NAME      = p?.name           || 'PARTICIPANT FULL NAME';
      const POSITION  = p?.position_title || 'Position Title';
      const ORG_NAME  = p?.org            || 'Organisation Name';
      const EV_NAME   = evName            || 'Event Name Goes Here — Full Title of the Programme Event';
      const PROGRAM   = ev?.program       || 'Programme Name';
      const ORGANISER = ev?.organizer     || 'Organising Institution';
      const DATE_STR  = dateStr           || '19 May 2026';
      const CODE      = p?.code           || '001';
      const SIG_NAME  = ev?.signatory_name  || 'Signatory Full Name';
      const SIG_TITLE = ev?.signatory_title || 'Title, Institution';
      // ─────────────────────────────────────────────────────────────

      // White base
      doc.setFillColor(...WHT); doc.rect(0, 0, W, H, 'F');

      // Top red band
      doc.setFillColor(...RED); doc.rect(0, 0, W, H * 0.18, 'F');

      // Yellow accent line
      doc.setFillColor(...YEL); doc.rect(0, H * 0.18, W, H * 0.008, 'F');

      // Orange accent line
      doc.setFillColor(...ORG); doc.rect(0, H * 0.188, W, H * 0.004, 'F');

      // Left orange vertical stripe
      doc.setFillColor(...ORG); doc.rect(0, H * 0.192, W * 0.008, H * 0.686, 'F');

      // Right yellow vertical stripe
      doc.setFillColor(...YEL); doc.rect(W * 0.992, H * 0.192, W * 0.008, H * 0.686, 'F');

      // Bottom black band
      doc.setFillColor(...BLK); doc.rect(0, H * 0.878, W, H * 0.122, 'F');

      // Yellow top line of black band
      doc.setFillColor(...YEL); doc.rect(0, H * 0.874, W, H * 0.006, 'F');

      // ── CERTIFICATE OF PARTICIPATION ──────────────────────────────
      doc.setTextColor(...WHT);
      doc.setFontSize(H * 0.062);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF PARTICIPATION', CX, H * 0.115, {
        align: 'center', charSpace: H * 0.006
      });

      // Thin white rule
      doc.setDrawColor(255,255,255); doc.setLineWidth(0.5);
      doc.line(CX - W * 0.22, H * 0.148, CX + W * 0.22, H * 0.148);

      // ── "This is to certify that" ─────────────────────────────────
      doc.setTextColor(...GRY);
      doc.setFontSize(H * 0.034);
      doc.setFont('helvetica', 'italic');
      doc.text('This is to certify that', CX, H * 0.285, { align: 'center' });

      // ── Participant name ──────────────────────────────────────────
      const nFs = NAME.length > 32 ? H * 0.064
                : NAME.length > 22 ? H * 0.076
                : H * 0.092;
      doc.setFontSize(nFs);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLK);
      doc.text(NAME, CX, H * 0.405, { align: 'center' });

      // Yellow underline
      const nW = Math.min(doc.getTextWidth(NAME), W * 0.72);
      doc.setFillColor(...YEL);
      doc.rect(CX - nW / 2, H * 0.422, nW, H * 0.007, 'F');

      // ── Position · Organisation ───────────────────────────────────
      const det = [POSITION, ORG_NAME].filter(Boolean).join('   ·   ');
      doc.setTextColor(...GRY);
      doc.setFontSize(H * 0.028);
      doc.setFont('helvetica', 'normal');
      doc.text(det, CX, H * 0.466, { align: 'center' });

      // ── "has successfully participated in" ────────────────────────
      doc.setTextColor(...GRY);
      doc.setFontSize(H * 0.030);
      doc.setFont('helvetica', 'italic');
      doc.text('has successfully participated in', CX, H * 0.528, { align: 'center' });

      // ── Event name ────────────────────────────────────────────────
      doc.setTextColor(...ORG);
      doc.setFontSize(H * 0.044);
      doc.setFont('helvetica', 'bold');
      const evLines = doc.splitTextToSize(EV_NAME, W * 0.72);
      doc.text(evLines, CX, H * 0.592, { align: 'center' });

      // ── Programme · Organiser ─────────────────────────────────────
      const orgLine = [PROGRAM, ORGANISER].filter(Boolean).join('   ·   ');
      const evBottom = H * 0.592 + (evLines.length - 1) * H * 0.052;
      doc.setTextColor(...GRY);
      doc.setFontSize(H * 0.024);
      doc.setFont('helvetica', 'normal');
      doc.text(orgLine, CX, evBottom + H * 0.048, { align: 'center' });

      // ── Bottom band left — date + ref ─────────────────────────────
      const BX = W * 0.06;
      const BY = H * 0.924;
      doc.setTextColor(...WHT);
      doc.setFontSize(H * 0.026);
      doc.setFont('helvetica', 'normal');
      doc.text(DATE_STR, BX, BY);

      doc.setTextColor(...YEL);
      doc.setFontSize(H * 0.028);
      doc.setFont('helvetica', 'bold');
      doc.text('Ref: ' + CODE, BX, BY + H * 0.046);

      // ── Bottom band right — signature + signatory ─────────────────
      const SX    = CX + W * 0.06;
      const SY    = H * 0.962;
      const lineW = W * 0.30;

      if (sigB64) {
        doc.addImage(sigB64, 'PNG', SX, SY - H * 0.076, W * 0.22, H * 0.065);
      }

      doc.setDrawColor(...WHT); doc.setLineWidth(0.8);
      doc.line(SX, SY, SX + lineW, SY);

      doc.setTextColor(...WHT);
      doc.setFontSize(H * 0.026);
      doc.setFont('helvetica', 'bold');
      doc.text(SIG_NAME, SX + lineW / 2, SY + H * 0.030, { align: 'center' });

      doc.setFontSize(H * 0.020);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(SIG_TITLE, SX + lineW / 2, SY + H * 0.050, { align: 'center' });
    }
  }

};
