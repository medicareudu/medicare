import { Prescription, PharmacyInfo } from '../types';

export const printInvoice = (p: Prescription, pharmacyInfo: PharmacyInfo, preOpenedWindow?: Window | null) => {
  const w = preOpenedWindow || window.open('', '_blank', 'width=600,height=700');
  if (!w) {
    alert('Please allow popups to generate the PDF invoice.');
    return;
  }

  // Pre-compute data for jsPDF script
  const medLines = JSON.stringify(
    p.medicines.map(item => ({
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      price: item.price.toFixed(2),
      total: (item.qty * item.price).toLocaleString(),
    }))
  );

  const chargeLines = JSON.stringify(
    p.additionalCharges.filter(c => c.checked).map(c => ({
      name: c.name,
      fee: c.fee.toLocaleString(),
    }))
  );

  const patientNameLine = p.patientName
    ? `doc.text('Patient Name:', lm, cy); doc.setFont('helvetica','bold'); doc.text(${JSON.stringify(p.patientName)}, 90, cy); doc.setFont('helvetica','normal'); cy += 7;`
    : '';

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${p.token}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 30px 16px; }
    .bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center; }
    .btn { border: none; border-radius: 10px; padding: 12px 26px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity .15s; }
    .btn:hover { opacity: .85; }
    .btn-pdf { background: #113c6b; color: #fff; }
    .btn-print { background: #e2e8f0; color: #334155; }
    .btn-close { background: #fff; border: 1px solid #e2e8f0; color: #94a3b8; }
    .status { font-size: 13px; color: #64748b; margin-bottom: 16px; font-style: italic; }
    .invoice { width: 100%; max-width: 480px; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.07); padding: 30px; border: 1px solid #e2e8f0; }
    .clinic-name { font-size: 18px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 4px; }
    .clinic-sub { font-size: 11px; color: #64748b; text-align: center; line-height: 1.5; margin-bottom: 20px; }
    .token-box { background: #113c6b; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 22px; }
    .token-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd; font-weight: 700; }
    .token-num { font-size: 28px; font-weight: 800; color: #fff; font-family: monospace; margin: 6px 0; }
    .sec-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 10px; margin-top: 18px; }
    .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .total-row { display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 14px; margin-top: 14px; }
    .total-label { font-size: 14px; font-weight: 800; }
    .total-amt { font-size: 20px; font-weight: 900; color: #113c6b; font-family: monospace; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 18px; line-height: 1.6; }
    @media print { .bar, .status { display: none !important; } body { background: #fff; padding: 0; } }
  </style>
</head>
<body>
  <div class="bar">
    <button class="btn btn-pdf" id="dlBtn" onclick="generatePDF()">⬇ Download PDF</button>
    <button class="btn btn-print" onclick="window.print()">🖨 Print</button>
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="status" id="statusMsg">Generating PDF, please wait...</div>

  <div class="invoice">
    <div class="clinic-name">🏥 ${pharmacyInfo.name}</div>
    <div class="clinic-sub">${pharmacyInfo.address}<br>Tel: ${pharmacyInfo.phone} &nbsp;·&nbsp; ${pharmacyInfo.website}</div>

    <div class="token-box">
      <div class="token-label">Pharmacy Token Number</div>
      <div class="token-num">${p.token}</div>
      <div style="font-size:10px;color:#93c5fd;">Present this receipt at the pharmacy counter</div>
    </div>

    <div class="sec-title">Patient Details</div>
    <div class="row"><span style="color:#64748b;">Date/Time</span><span style="font-weight:600;">${p.date}</span></div>
    <div class="row"><span style="color:#64748b;">Patient Number</span><span style="font-family:monospace;font-weight:600;">${p.patientNo}</span></div>
    ${p.patientName ? `<div class="row"><span style="color:#64748b;">Patient Name</span><span style="font-weight:600;">${p.patientName}</span></div>` : ''}
    <div class="row"><span style="color:#64748b;">Consulting Doctor</span><span style="font-weight:600;">${p.doctor}</span></div>

    <div class="sec-title">Prescribed Medicines</div>
    ${p.medicines.map(item => `
      <div class="row" style="flex-direction:column;gap:2px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-weight:600;">${item.name}</span>
          <span style="font-family:monospace;font-weight:700;">LKR ${(item.qty * item.price).toLocaleString()}</span>
        </div>
        <div style="font-size:11px;color:#64748b;">${item.qty} ${item.unit} × LKR ${item.price.toFixed(2)}</div>
      </div>`).join('')}

    <div class="sec-title">Charges &amp; Service Fees</div>
    <div class="row"><span style="color:#475569;">Physician Consultation Fee</span><span style="font-family:monospace;font-weight:600;">LKR ${p.consultationFee.toLocaleString()}</span></div>
    ${p.additionalCharges.filter(c => c.checked).map(c =>
      `<div class="row"><span style="color:#475569;">${c.name}</span><span style="font-family:monospace;font-weight:600;">LKR ${c.fee.toLocaleString()}</span></div>`
    ).join('')}
    ${(p.discount || 0) > 0 ? `<div class="row"><span style="color:#10b981;font-weight:600;">Discount Applied</span><span style="font-family:monospace;font-weight:600;color:#10b981;">- LKR ${(p.discount || 0).toLocaleString()}</span></div>` : ''}

    <div class="total-row">
      <span class="total-label">Grand Total Amount</span>
      <span class="total-amt">LKR ${p.totalAmount.toLocaleString()}</span>
    </div>

    <div class="footer">
      <strong>Thank you for visiting ${pharmacyInfo.name}</strong><br>
      For inquiries, call ${pharmacyInfo.phone}<br>
      Reference: ${p.token} · ${new Date().getFullYear()}
    </div>
  </div>

  <script>
    const medItems = ${medLines};
    const chargeItems = ${chargeLines};

    function generatePDF() {
      if (typeof window.jspdf === 'undefined') {
        document.getElementById('statusMsg').textContent = 'PDF library not loaded yet. Please try again.';
        return;
      }
      document.getElementById('dlBtn').textContent = '⏳ Generating...';
      document.getElementById('dlBtn').disabled = true;

      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const lm = 18, rm = 192;
        let cy = 22;

        // Clinic Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(${JSON.stringify(pharmacyInfo.name)}, 105, cy, { align: 'center' });
        cy += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(${JSON.stringify(pharmacyInfo.address)}, 105, cy, { align: 'center' });
        cy += 5;
        doc.text('Tel: ${pharmacyInfo.phone}  |  ${pharmacyInfo.website}', 105, cy, { align: 'center' });
        cy += 10;

        // Token Box
        doc.setFillColor(17, 60, 107);
        doc.roundedRect(lm, cy, 174, 24, 4, 4, 'F');
        doc.setTextColor(147, 197, 253);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('PHARMACY TOKEN NUMBER', 105, cy + 8, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text(${JSON.stringify(p.token)}, 105, cy + 18, { align: 'center' });
        cy += 32;

        function sectionTitle(title) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(title, lm, cy);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.line(lm, cy + 2, rm, cy + 2);
          cy += 9;
        }

        function detailRow(label, val) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(label + ':', lm, cy);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(String(val), 85, cy);
          doc.setFont('helvetica', 'normal');
          cy += 7;
        }

        // Patient Details
        sectionTitle('PATIENT DETAILS');
        detailRow('Date/Time', ${JSON.stringify(p.date)});
        detailRow('Patient Number', ${JSON.stringify(p.patientNo)});
        ${patientNameLine}
        detailRow('Consulting Doctor', ${JSON.stringify(p.doctor)});
        cy += 4;

        // Medicines
        sectionTitle('PRESCRIBED MEDICINES');
        medItems.forEach(function(item) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(item.name, lm, cy);
          doc.text('LKR ' + item.total, rm, cy, { align: 'right' });
          cy += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(item.qty + ' ' + item.unit + ' x LKR ' + item.price, lm + 3, cy);
          cy += 7;
        });
        cy += 2;

        // Fees
        sectionTitle('CHARGES & SERVICE FEES');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Physician Consultation Fee', lm, cy);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('LKR ${p.consultationFee.toLocaleString()}', rm, cy, { align: 'right' });
        cy += 7;

        chargeItems.forEach(function(c) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(c.name, lm, cy);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text('LKR ' + c.fee, rm, cy, { align: 'right' });
          cy += 7;
        });

        ${(p.discount || 0) > 0 ? `
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('Discount Applied', lm, cy);
        doc.setFont('helvetica', 'bold');
        doc.text('- LKR ${(p.discount || 0).toLocaleString()}', rm, cy, { align: 'right' });
        cy += 7;
        ` : ''}

        cy += 6;

        // Grand Total
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.line(lm, cy, rm, cy);
        cy += 9;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(17, 60, 107);
        doc.text('Grand Total: LKR ${p.totalAmount.toLocaleString()}', rm, cy, { align: 'right' });
        cy += 16;

        // Footer
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Thank you for visiting ${pharmacyInfo.name}', 105, cy, { align: 'center' });
        cy += 5;
        doc.text('Reference: ${p.token} - ${new Date().getFullYear()}', 105, cy, { align: 'center' });

        doc.save('Invoice_${p.token}.pdf');

        document.getElementById('dlBtn').textContent = '✓ Downloaded!';
        document.getElementById('statusMsg').textContent = 'PDF downloaded successfully. Check your downloads folder.';
        document.getElementById('statusMsg').style.color = '#16a34a';
        setTimeout(() => {
          document.getElementById('dlBtn').textContent = '⬇ Download PDF';
          document.getElementById('dlBtn').disabled = false;
        }, 3000);
      } catch(err) {
        document.getElementById('dlBtn').textContent = '⬇ Download PDF';
        document.getElementById('dlBtn').disabled = false;
        document.getElementById('statusMsg').textContent = 'Error generating PDF: ' + err.message;
      }
    }

    // Auto-trigger when jsPDF is loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        document.getElementById('statusMsg').textContent = '';
        generatePDF();
      }, 1000);
    });
  <\/script>
</body>
</html>`);
  w.document.close();
};
