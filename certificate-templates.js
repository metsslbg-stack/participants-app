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

      // ── White background
      doc.setFillColor(...WHT); doc.rect(0,0,W,H,'F');

      // ── LEFT EDGE — stacked triangles
      doc.setFillColor(...ORG);  doc.triangle(0,0,     W*0.17,0,    0,H*0.52,'F');
      doc.setFillColor(...CYN);  doc.triangle(0,0,     W*0.10,0,    0,H*0.30,'F');
      doc.setFillColor(...PNK);  doc.triangle(0,H*0.20,W*0.09,H*0.33,0,H*0.38,'F');
      doc.setFillColor(...PNK);  doc.triangle(0,H*0.42,W*0.09,H*0.52,0,H*0.58,'F');
      doc.setFillColor(...ORG);  doc.triangle(0,H*0.58,W*0.09,H*0.68,0,H*0.72,'F');
      doc.setFillColor(255,182,193); doc.ellipse(W*0.055,H*0.74,W*0.055,H*0.115,'F');
      doc.setDrawColor(255,160,170); doc.setLineWidth(1.5);
      doc.ellipse(W*0.055,H*0.74,W*0.055,H*0.115,'D');

      // ── TOP EDGE — scattered triangles
      doc.setFillColor(...ORG);  doc.triangle(W*0.24,0, W*0.35,0, W*0.27,H*0.14,'F');
      doc.setFillColor(...ORG);  doc.triangle(W*0.41,0, W*0.52,0, W*0.46,H*0.11,'F');
      doc.setFillColor(...CYN);  doc.triangle(W*0.60,0, W*0.70,0, W*0.64,H*0.09,'F');
      doc.setFillColor(255,200,200); doc.ellipse(W*0.88,H*0.04,W*0.08,H*0.12,'F');
      doc.setFillColor(...ORG);  doc.ellipse(W*0.97,H*0.24,W*0.038,H*0.075,'F');
      doc.setFillColor(30,30,50); doc.circle(W*0.93,H*0.08,H*0.013,'F');

      // ── RIGHT EDGE — stacked triangles
      doc.setFillColor(...PNK);  doc.triangle(W,H*0.32,W*0.87,H*0.42,W,H*0.52,'F');
      doc.setFillColor(...CYN);  doc.triangle(W,H*0.50,W*0.90,H*0.59,W,H*0.68,'F');
      doc.setFillColor(...ORG);  doc.triangle(W,H*0.65,W*0.88,H*0.74,W,H*0.82,'F');
      doc.setFillColor(...PNK);  doc.triangle(W,H*0.80,W*0.90,H*0.88,W,H,'F');

      // ── BOTTOM EDGE
      doc.setFillColor(...ORG);  doc.triangle(0,H*0.72,  W*0.14,H,   0,H,'F');
      doc.setFillColor(...PNK);  doc.triangle(W*0.10,H,  W*0.27,H,   W*0.14,H*0.86,'F');
      doc.setFillColor(...TEAL); doc.triangle(W*0.34,H,  W*0.48,H,   W*0.41,H*0.91,'F');
      doc.setFillColor(...CYN);  doc.triangle(W*0.52,H,  W*0.62,H,   W*0.57,H*0.94,'F');
      doc.setFillColor(235,80,50);   doc.ellipse(W*0.325,H*0.924,W*0.018,H*0.032,'F');
      doc.setFillColor(220,220,220); doc.ellipse(W*0.360,H*0.936,W*0.013,H*0.024,'F');

      // ── CERTIFICATE heading
      doc.setTextColor(...BRN); doc.setFontSize(H*0.082); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE', CX, H*0.205, {align:'center', charSpace: H*0.016});

      // ── Medal icon
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

      // ── OF PARTICIPATION
      doc.setTextColor(...ORG); doc.setFontSize(H*0.038); doc.setFont('helvetica','bold');
      doc.text('OF PARTICIPATION', CX, H*0.545, {align:'center', charSpace:1.5});

      // ── Presented to phrase
      doc.setTextColor(...BRN); doc.setFontSize(H*0.036); doc.setFont('helvetica','normal');
      doc.text('This certificate is presented to:', CX, H*0.626, {align:'center'});

      // ── Participant name
      const nFs=(p.name||'').length>30?H*0.055:(p.name||'').length>20?H*0.065:H*0.076;
      doc.setFontSize(nFs); doc.setFont('helvetica','bold'); doc.setTextColor(...BRN);
      doc.text(p.name||'', CX, H*0.716, {align:'center'});

      // ── Name underline
      doc.setDrawColor(180,120,70); doc.setLineWidth(1.0);
      doc.line(CX-W*0.24, H*0.734, CX+W*0.24, H*0.734);

      // ── Event name
      const evL=doc.splitTextToSize(evName,W*0.55);
      doc.setTextColor(...GRY); doc.setFontSize(H*0.026); doc.setFont('helvetica','italic');
      doc.text(evL,CX,H*0.770,{align:'center'});

      // ── Two bottom signature lines
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
  },

  purple_gold_elegant: {
    name: 'Purple & Gold Elegant',
    desc: 'Dark purple background, gold border, ornamental corners, gold seal',
    render: ({doc, p, ev, evName, dateStr, sigB64, W, H}) => {
      const PRP=[15,5,60], DPRP=[26,8,80], MPRP=[80,0,160],
            GLD=[212,175,55], LGLD=[240,210,100], WHT=[255,255,255],
            OFFWHT=[230,220,255];
      const CX=W/2;

      // ── Deep purple background
      doc.setFillColor(...DPRP); doc.rect(0,0,W,H,'F');

      // ── Subtle purple gradient overlay (lighter centre)
      doc.setFillColor(40,15,100); doc.rect(W*0.15,H*0.1,W*0.7,H*0.8,'F');

      // ── Purple ribbon top-right
      doc.setFillColor(...MPRP);
      doc.triangle(W*0.62,0, W,0, W,H*0.28,'F');
      doc.triangle(W*0.75,0, W,0, W,H*0.18,'F');

      // ── Purple ribbon bottom-left
      doc.setFillColor(...MPRP);
      doc.triangle(0,H*0.72, 0,H, W*0.38,H,'F');
      doc.triangle(0,H*0.82, 0,H, W*0.22,H,'F');

      // ── Gold outer border
      doc.setDrawColor(...GLD); doc.setLineWidth(2.2);
      doc.rect(W*0.03,H*0.04,W*0.94,H*0.92);

      // ── Gold inner border
      doc.setDrawColor(...LGLD); doc.setLineWidth(0.7);
      doc.rect(W*0.045,H*0.055,W*0.91,H*0.89);

      // ── Corner leaf/floral — top left (gold triangles as leaves)
      const drawLeaf=(lx,ly,sx,sy)=>{
        doc.setFillColor(...GLD);
        doc.triangle(lx,ly, lx+sx*0.18,ly-sy*0.35, lx+sx*0.38,ly,'F');
        doc.triangle(lx,ly, lx+sx*0.1,ly-sy*0.55, lx+sx*0.25,ly-sy*0.2,'F');
        doc.triangle(lx,ly, lx+sx*0.28,ly-sy*0.62, lx+sx*0.42,ly-sy*0.15,'F');
        doc.triangle(lx,ly, lx-sx*0.05,ly-sy*0.45, lx+sx*0.15,ly-sy*0.5,'F');
        // stem
        doc.setDrawColor(...GLD); doc.setLineWidth(1.2);
        doc.line(lx,ly, lx+sx*0.22,ly-sy*0.7);
      };
      drawLeaf(W*0.075,H*0.18, W*0.14,H*0.16);
      // top-left secondary leaf cluster
      doc.setFillColor(...GLD);
      doc.triangle(W*0.06,H*0.08, W*0.19,H*0.05, W*0.14,H*0.19,'F');
      doc.triangle(W*0.07,H*0.06, W*0.22,H*0.03, W*0.16,H*0.16,'F');

      // Bottom-right leaf cluster (mirrored)
      const drawLeafBR=(lx,ly)=>{
        doc.setFillColor(...GLD);
        doc.triangle(lx,ly, lx-W*0.18,ly+H*0.35, lx-W*0.38,ly,'F');
        doc.triangle(lx,ly, lx-W*0.1,ly+H*0.55, lx-W*0.25,ly+H*0.2,'F');
        doc.triangle(lx,ly, lx-W*0.28,ly+H*0.62, lx-W*0.42,ly+H*0.15,'F');
        doc.setDrawColor(...GLD); doc.setLineWidth(1.2);
        doc.line(lx,ly, lx-W*0.22,ly+H*0.7);
      };
      drawLeafBR(W*0.93,H*0.82);
      doc.setFillColor(...GLD);
      doc.triangle(W*0.94,H*0.92, W*0.81,H*0.95, W*0.86,H*0.81,'F');
      doc.triangle(W*0.93,H*0.94, W*0.78,H*0.97, W*0.84,H*0.84,'F');

      // ── Side scroll ornaments — left
      const drawScroll=(sx,sy,flip)=>{
        const d=flip?-1:1;
        doc.setDrawColor(...GLD); doc.setLineWidth(1.0);
        for(let i=0;i<3;i++){
          doc.roundedRect(sx-W*0.018*d,sy+H*i*0.042,W*0.036,H*0.032,W*0.008,H*0.012,'D');
        }
      };
      drawScroll(W*0.06,H*0.36,false);
      drawScroll(W*0.94,H*0.36,true);

      // ── CERTIFICATE heading
      doc.setTextColor(...GLD); doc.setFontSize(H*0.115); doc.setFont('helvetica','bold');
      doc.text('CERTIFICATE', CX, H*0.22, {align:'center', charSpace:H*0.008});

      // ── OF PARTICIPATION
      doc.setFontSize(H*0.052); doc.setFont('helvetica','bold');
      doc.text('OF PARTICIPATION', CX, H*0.31, {align:'center', charSpace:H*0.012});

      // ── Thin gold divider line under title
      doc.setDrawColor(...GLD); doc.setLineWidth(0.6);
      doc.line(CX-W*0.22,H*0.345, CX+W*0.22,H*0.345);

      // ── Presented to text
      doc.setTextColor(...OFFWHT); doc.setFontSize(H*0.032); doc.setFont('helvetica','normal');
      doc.text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', CX, H*0.40, {align:'center', charSpace:2});

      // ── Participant name
      const nFs=(p.name||'').length>30?H*0.062:(p.name||'').length>20?H*0.074:H*0.088;
      doc.setTextColor(...GLD); doc.setFontSize(nFs); doc.setFont('helvetica','bold');
      doc.text(p.name||'', CX, H*0.495, {align:'center'});

      // ── Name underline (gold)
      const nW=Math.min(doc.getTextWidth(p.name||''),W*0.7);
      doc.setDrawColor(...GLD); doc.setLineWidth(0.8);
      doc.line(CX-nW/2,H*0.515, CX+nW/2,H*0.515);

      // ── Position and org
      const det=[p.position_title,p.org].filter(Boolean).join('   ·   ');
      if(det){
        doc.setTextColor(...OFFWHT); doc.setFontSize(H*0.028); doc.setFont('helvetica','normal');
        doc.text(det, CX, H*0.548, {align:'center'});
      }

      // ── Event name
      doc.setTextColor(...LGLD); doc.setFontSize(H*0.034); doc.setFont('helvetica','italic');
      const evL=doc.splitTextToSize(evName,W*0.6);
      doc.text(evL, CX, H*0.595, {align:'center'});

      // ── Gold seal medallion — bottom centre
      const MX=CX, MY=H*0.81, MR=H*0.11;
      // Outer dotted ring
      doc.setFillColor(...GLD); doc.circle(MX,MY,MR,'F');
      // Gear teeth
      for(let i=0;i<24;i++){
        const a=i*Math.PI/12;
        const x1=MX+Math.cos(a)*(MR*0.88), y1=MY+Math.sin(a)*(MR*0.88);
        const x2=MX+Math.cos(a+Math.PI/24)*(MR*0.78), y2=MY+Math.sin(a+Math.PI/24)*(MR*0.78);
        const x3=MX+Math.cos(a+Math.PI/12)*(MR*0.88), y3=MY+Math.sin(a+Math.PI/12)*(MR*0.88);
        doc.setFillColor(...LGLD);
        doc.triangle(MX,MY,x1,y1,x2,y2,'F');
        doc.triangle(MX,MY,x2,y2,x3,y3,'F');
      }
      // Inner purple circle
      doc.setFillColor(...MPRP); doc.circle(MX,MY,MR*0.72,'F');
      // Thin gold ring
      doc.setDrawColor(...GLD); doc.setLineWidth(1.2); doc.circle(MX,MY,MR*0.72,'D');
      // Dotted inner ring
      doc.setDrawColor(...LGLD); doc.setLineWidth(0.5); doc.circle(MX,MY,MR*0.64,'D');
      // Inner deep purple circle
      doc.setFillColor(...DPRP); doc.circle(MX,MY,MR*0.56,'F');
      // Participant code text in seal
      doc.setTextColor(...GLD); doc.setFontSize(H*0.028); doc.setFont('helvetica','bold');
      doc.text(p.code||'', MX, MY+H*0.012, {align:'center'});

      // ── Signatory block — left of seal
      const SX=CX-W*0.28, SY=H*0.865;
      if(sigB64) doc.addImage(sigB64,'PNG',SX-W*0.07,SY-H*0.065,W*0.18,H*0.055);
      doc.setDrawColor(...GLD); doc.setLineWidth(0.7);
      doc.line(SX-W*0.09,SY,SX+W*0.09,SY);
      doc.setTextColor(...LGLD); doc.setFontSize(H*0.026); doc.setFont('helvetica','bold');
      doc.text(ev.signatory_name||'Authorised Signatory', SX, SY+H*0.028, {align:'center'});
      doc.setFontSize(H*0.020); doc.setFont('helvetica','normal'); doc.setTextColor(...OFFWHT);
      if(ev.signatory_title) doc.text(ev.signatory_title, SX, SY+H*0.046, {align:'center'});

      // ── Date — right of seal
      const DX=CX+W*0.28;
      doc.setDrawColor(...GLD); doc.setLineWidth(0.7);
      doc.line(DX-W*0.09,SY,DX+W*0.09,SY);
      doc.setTextColor(...LGLD); doc.setFontSize(H*0.026); doc.setFont('helvetica','bold');
      doc.text(dateStr, DX, SY+H*0.028, {align:'center'});
      doc.setFontSize(H*0.020); doc.setFont('helvetica','normal'); doc.setTextColor(...OFFWHT);
      if(ev.organizer) doc.text(ev.organizer, DX, SY+H*0.046, {align:'center'});
    }
  }

};
