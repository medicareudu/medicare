import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { TrendingUp, CheckCircle, Clock, Banknote, HelpCircle, BarChart3, Pill } from 'lucide-react';

export const Reports: React.FC = () => {
  const { prescriptions, medicines } = useAppState();
  const [reportPeriod, setReportPeriod] = useState('This Month');

  // Calculations
  const totalRequestsCount = prescriptions.length;
  const completedRequestsCount = prescriptions.filter(p => p.status === 'Completed').length;
  const pendingRequestsCount = prescriptions.filter(p => p.status === 'Pending').length;
  
  const totalRevenue = prescriptions
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  // Daily statistics dataset for June
  const dailyStats = [
    { date: 'Jun 28', count: 34, consult: 51000, meds: 28560, other: 14200, total: 93760 },
    { date: 'Jun 27', count: 29, consult: 43500, meds: 23940, other: 9800, total: 77240 },
    { date: 'Jun 26', count: 41, consult: 61500, meds: 34440, other: 18200, total: 114140 },
    { date: 'Jun 25', count: 28, consult: 42000, meds: 19600, other: 8400, total: 70000 },
  ];

  // Top dispensed medicines rankings (mock or simulated aggregate)
  const topDispensed = [
    { name: 'Paracetamol 500mg', count: 462, pct: 95 },
    { name: 'Amoxicillin 500mg', count: 312, pct: 64 },
    { name: 'Metformin 850mg', count: 280, pct: 58 },
    { name: 'Vitamin C 500mg', count: 240, pct: 49 },
    { name: 'Omeprazole 20mg', count: 195, pct: 40 },
  ];

  // SVG Chart points
  const chartHeight = 120;
  const chartWidth = 500;
  const chartPoints = [18, 24, 31, 28, 22, 35, 34, 29, 41, 38, 27, 33, 36, 40, 28, 30, 34, 31, 37, 42, 29, 35, 38, 31, 34, 39, 34];
  const maxPoint = Math.max(...chartPoints);

  const downloadPDF = () => {
    const executeDownload = () => {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const stats = { total: totalRequestsCount, completed: completedRequestsCount, pending: pendingRequestsCount, revenue: totalRevenue };
      const daily = dailyStats;
      const top = topDispensed;
      const lm = 18;
      const rm = 192;
      let cy = 22;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Financial & Operational Analytics', 105, cy, { align: 'center' });
      cy += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${reportPeriod}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`, 105, cy, { align: 'center' });
      cy += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('SUMMARY OVERVIEW', lm, cy);
      cy += 6;

      const sl = ['Total Prescriptions', 'Completed & Dispensed', 'Pending in Queue', 'Total Revenue (LKR)'];
      const sv = [String(stats.total), String(stats.completed), String(stats.pending), 'LKR ' + stats.revenue.toLocaleString()];
      
      sl.forEach((label, i) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(lm + (i % 2) * 90, cy + Math.floor(i / 2) * 18, 85, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(sv[i], lm + (i % 2) * 90 + 42, cy + Math.floor(i / 2) * 18 + 9, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(label, lm + (i % 2) * 90 + 42, cy + Math.floor(i / 2) * 18 + 13, { align: 'center' });
      });
      cy += 42;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('TOP DISPENSED MEDICINES', lm, cy);
      cy += 6;

      top.forEach((item) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(item.name, lm, cy);
        doc.setFont('helvetica', 'bold');
        doc.text(item.count + ' items', rm, cy, { align: 'right' });
        cy += 5;
        doc.setFillColor(226, 232, 240);
        doc.rect(lm, cy, 130, 2, 'F');
        doc.setFillColor(17, 60, 107);
        doc.rect(lm, cy, (130 * item.pct) / 100, 2, 'F');
        cy += 6;
      });
      cy += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('FINANCIAL BILLING LEDGER', lm, cy);
      cy += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(lm, cy, rm, cy);
      cy += 5;

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      ['Date', 'Requests', 'Consultation', 'Medications', 'Other', 'Daily Total'].forEach((h, i) => {
        doc.text(h, lm + [0, 22, 45, 75, 105, 138][i], cy);
      });
      cy += 4;
      doc.line(lm, cy, rm, cy);
      cy += 5;

      daily.forEach((row) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(row.date, lm, cy);
        doc.text(String(row.count), lm + 22, cy);
        doc.text(row.consult.toLocaleString(), lm + 45, cy);
        doc.text(row.meds.toLocaleString(), lm + 75, cy);
        doc.text(row.other.toLocaleString(), lm + 105, cy);
        doc.setFont('helvetica', 'bold');
        doc.text('LKR ' + row.total.toLocaleString(), rm, cy, { align: 'right' });
        cy += 7;
      });

      doc.save('MediCare_Report.pdf');
    };

    if ((window as any).jspdf) {
      executeDownload();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      executeDownload();
    };
    document.body.appendChild(script);
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Financial & Operational Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time billing revenues, patient traffic insights, and popular medicine distributions.
          </p>
        </div>
        <div className="flex gap-2.5">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="w-40 bg-white border border-slate-200 text-xs text-slate-800 py-2 px-3 focus:outline-none rounded-lg cursor-pointer"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
          </select>
          <button
            onClick={downloadPDF}
            className="btn btn-primary font-semibold"
          >
            ⬇ Download as PDF
          </button>
        </div>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <TrendingUp size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalRequestsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Prescriptions Received</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{completedRequestsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Dispensed & Completed</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{pendingRequestsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Outstanding in Queue</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <Banknote size={18} />
          </div>
          <div className="text-2xl font-bold text-sky-600">LKR {totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Aggregated Sales Revenue</div>
        </div>
      </div>

      {/* Chart and Top dispensed medicine rows grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Bar chart custom */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <BarChart3 size={14} className="text-sky-500" />
            Daily Clinic Issuances (June 2026)
          </h3>
          <div className="flex items-end gap-[3px] h-32 pt-4 px-1">
            {chartPoints.map((v, i) => {
              const barHeight = Math.round((v / maxPoint) * 110);
              const isLast = i === chartPoints.length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm cursor-pointer transition-all duration-150 ${
                    isLast ? 'bg-sky-600 hover:opacity-95' : 'bg-sky-200 hover:bg-sky-300'
                  }`}
                  style={{ height: `${barHeight}px` }}
                  title={`Jun ${i + 1}: ${v} items dispensed`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-semibold text-slate-400 mt-2">
            <span>Jun 1</span>
            <span>Jun 14</span>
            <span>Jun 28</span>
          </div>
        </div>

        {/* Right: Top Dispensed Medicine lists */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Pill size={14} className="text-sky-500" />
            Top Dispensed Medications Rank
          </h3>
          <div className="space-y-4">
            {topDispensed.map(item => (
              <div key={item.name} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-mono text-slate-500 font-bold">{item.count} items</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-sky-600" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Billing Summary table representation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider p-5 border-b border-slate-100">
          Financial Billing Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total Requests</th>
                <th className="px-5 py-3">Consultation Subtotal</th>
                <th className="px-5 py-3">Medication Sales</th>
                <th className="px-5 py-3">Other service fees</th>
                <th className="px-5 py-3">Daily Combined Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {dailyStats.map(stat => (
                <tr key={stat.date} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-700">
                    {stat.date}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800">
                    {stat.count} requests
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                    LKR {stat.consult.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                    LKR {stat.meds.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                    LKR {stat.other.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                    LKR {stat.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
