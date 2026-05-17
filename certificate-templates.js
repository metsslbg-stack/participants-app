// ════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATES — METSS LBG Participant Registration App
// W=841.89pt H=595.28pt — all coordinates use W/H ratios
// ════════════════════════════════════════════════════════════════════

window.CERT_TEMPLATES = {

  colorful_vibrant: {
    name: 'Colorful Vibrant',
    desc: 'Bright geometric shapes, medal icon, bold playful style',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const ORG=[255,140,0], PNK=[233,30,99], CYN=[0,188,212],
            LPNK=[255,182,193], BRN=[101,67,33], TEAL=[0,150,136],
            WHT=[255,255,255], GRY=[120,120,120];
      const CX=W/2;

      doc.setFillColor(...WHT); doc.rect(0,0,W,H,'F');

      // LEFT EDGE
      doc.setFillColor(...ORG);  doc.triangle(0,0,     W*0.17,0,    0,H*0.52,'F');
      doc.setFillColor(...CYN);  doc.triangle(0,0,     W*0.10,0,    0,H*0.30,'F');
      doc.setFillColor(...PNK);  doc.triangle(0,H*0.20,W*0.09,H*0.33,0,H*0.38,'F');
      doc.setFillColor(...PNK);  doc.triangle(0,H*0.42,W*0.09,H*0.52,0,H*0.58,'F');
      doc.setFillColor(...ORG);  doc.triangle(0,H*0.58,W*0.09,H*0.68,0,H*0.72,'F');
      doc.setFillColor(255,182,193); doc.ellipse(W*0.055,H*0.74,W*0.055,H*0.115,'F');
      doc.setDrawColor(255,160,170); doc.setLineWidth(1.5);
      doc.ellipse(W*0.055,H*0.74,W*0.055,H*0.115,'D');

      // TOP EDGE
      doc.setFillColor(...ORG);  doc.triangle(W*0.24,0, W*0.35,0, W*0.27,H*0.14,'F');
      doc.setFillColor(...ORG);  doc.triangle(W*0.41,0, W*0.52,0, W*0.46,H*0.11,'F');
      doc.setFillColor(...CYN);  doc.triangle(W*0.60,0, W*0.70,0, W*0.64,H*0.09,'F');
      doc.setFillColor(255,200,200); doc.ellipse(W*0.88,H*0.04,W*0.08,H*0.12,'F');
      doc.setFillColor(...ORG);  doc.ellipse(W*0.97,H*0.24,W*0.038,H*0.075,'F');
      doc.setFillColor(30,30,50); doc.circle(W*0.93,H*0.08,H*0.013,'F');

      // RIGHT EDGE
      doc.setFillColor(...PNK);  doc.triangle(W,H*0.32,W*0.87,H*0.42,W,H*0.52,'F');
      doc.setFillColor(...CYN);  doc.triangle(W,H*0.50,W*0.90,H*0.59,W,H*0.68,'F');
      doc.setFillColor(...ORG);  doc.triangle(W,H*0.65,W*0.88,H*0.74,W,H*0.82,'F');
      doc.setFillColor(...PNK);  doc.triangle(W,H*0.80,W*0.90,H*0.88,W,H,'F');

      // BOTTOM EDGE
      doc.setFillColor(...ORG);  doc.triangle(0,H*0.72,  W*0.14,H,   0,H,'F');
      doc.setFillColor(...PNK);  doc.triangle(W*0.10,H,  W*0.27,H,   W*0.14,H*0.86,'F');
      doc.setFillColor(...TEAL); doc.triangle(W*0.34,H,  W*0.48,H,   W*0.41,H*0.91,'F');
      doc.setFillColor(...CYN);  doc.triangle(W*0.52,H,  W*0.62,H,   W*0.57,H*0.94,'F');
      doc.setFillColor(235,80,50);   doc.ellipse(W*0.325,H*0.924,W*0.018,H*0.032,'F');
      doc.setFillColor(220,220,220); doc.ellipse(W*0.360,H*0.936,W*0.013,H*0.024,'F');

      // CERTIFICATE heading
      doc.setTextColor(...BRN); doc.setFontSize(H*0.082); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE', CX, H*0.205, {align:'center', charSpace: H*0.016});

      // Medal icon
      const MX=CX, MY=H*0.375, MR=H*0.095;
      doc.setFillColor(...ORG);
      doc.triangle(MX-MR*0.5,MY+MR*0.65, MX+MR*0.05,MY+MR*0.65, MX-MR*0.25,MY+MR*1.45,'F');
      doc.setFillColor(180,100,55);
      doc.triangle(MX-MR*0.05,MY+MR*0.65, MX+MR*0.5,MY+MR*0.65, MX+MR*0.25,MY+MR*1.45,'F');
      doc.setFillColor(...ORG);
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6, a2=a+Math.PI/12, a3=a+Math.PI/6;
        doc.triangle(MX,MY, MX+Math.cos(a)*MR,MY+Math.sin(a)*MR, MX+Math.cos(a2)*MR*0.84,MY+Math.sin(a2)*MR*0.84,'F');
        doc.triangle(MX,MY, MX+Math.cos(a2)*MR*0.84,MY+Math.sin(a2)*MR*0.84, MX+Math.cos(a3)*MR,MY+Math.sin(a3)*MR,'F');
      }
      doc.setFillColor(255,255,255); doc.circle(MX,MY,MR*0.72,'F');
      doc.setFillColor(255,182,193); doc.circle(MX,MY,MR*0.65,'F');
      doc.setFillColor(255,255,255); doc.circle(MX,MY,MR*0.50,'F');

      // OF PARTICIPATION
      doc.setTextColor(...ORG); doc.setFontSize(H*0.038); doc.setFont('helvetica','bold');
      doc.text('OF PARTICIPATION', CX, H*0.545, {align:'center', charSpace:1.5});

      // Presented to
      doc.setTextColor(...BRN); doc.setFontSize(H*0.036); doc.setFont('helvetica','normal');
      doc.text('This certificate is presented to:', CX, H*0.626, {align:'center'});

      // Participant name
      const nFs=(p.name||'').length>30?H*0.055:(p.name||'').length>20?H*0.065:H*0.076;
      doc.setFontSize(nFs); doc.setFont('helvetica','bold'); doc.setTextColor(...BRN);
      doc.text(p.name||'', CX, H*0.716, {align:'center'});

      // Underline
      doc.setDrawColor(180,120,70); doc.setLineWidth(1.0);
      doc.line(CX-W*0.24, H*0.734, CX+W*0.24, H*0.734);

      // Event name
      const evL=doc.splitTextToSize(evName,W*0.55);
      doc.setTextColor(...GRY); doc.setFontSize(H*0.026); doc.setFont('helvetica','italic');
      doc.text(evL,CX,H*0.770,{align:'center'});

      // Bottom signature lines
      const bY=H*0.880;
      doc.setDrawColor(180,120,70); doc.setLineWidth(0.9);
      doc.line(CX-W*0.24, bY, CX-W*0.04, bY);
      doc.line(CX+W*0.04, bY, CX+W*0.24, bY);

      if(sigB64) doc.addImage(sigB64,'PNG',CX-W*0.24,bY-H*0.072,W*0.19,H*0.065);

      doc.setTextColor(...GRY); doc.setFontSize(H*0.024); doc.setFont('helvetica','bold');
      doc.text(ev.signatory_name||'Authorised Signatory', CX-W*0.14, bY+H*0.034, {align:'center'});
      doc.setFontSize(H*0.019); doc.setFont('helvetica','normal');
      if(ev.signatory_title) doc.text(ev.signatory_title, CX-W*0.14, bY+H*0.054, {align:'center'});

      doc.setFontSize(H*0.024); doc.setFont('helvetica','bold');
      doc.text(dateStr, CX+W*0.14, bY+H*0.034, {align:'center'});
      doc.setFontSize(H*0.019); doc.setFont('helvetica','normal');
      doc.text('Ref: '+(p.code||''), CX+W*0.14, bY+H*0.054, {align:'center'});
    }
  }

};
