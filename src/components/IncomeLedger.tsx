import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../context/StateContext';
import { reportsApi } from '../api/client';
import { Download, Calendar, Activity, Receipt, Stethoscope, BriefcaseMedical } from 'lucide-react';

export const IncomeLedger: React.FC = () => {
  const { prescriptions, refreshData } = useAppState();
  
  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const filteredPrescriptions = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return prescriptions.filter(p => {
      if (p.status !== 'Completed') return false;
      const d = new Date(p.date);
      return d >= start && d <= end;
    });
  }, [prescriptions, startDate, endDate]);

  const totals = useMemo(() => {
    let consultation = 0;
    let medicines = 0;
    let other = 0;
    let discount = 0;
    let amount = 0;
    
    filteredPrescriptions.forEach(p => {
      let medsCost = 0;
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m: any) => {
          medsCost += (m.price || 0) * (m.qty || 0);
        });
      }
      
      let otherCost = 0;
      if (Array.isArray(p.additionalCharges)) {
        p.additionalCharges.forEach((c: any) => {
          otherCost += (c.fee || 0);
        });
      }

      consultation += p.consultationFee;
      medicines += medsCost;
      other += otherCost;
      discount += (p.discount || 0);
      amount += p.totalAmount;
    });

    return { consultation, medicines, other, discount, amount };
  }, [filteredPrescriptions]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await reportsApi.downloadIncomeLedger(startDate, endDate);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download income ledger');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity size={22} className="text-sky-500" />
            Income & Billing Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyze daily/weekly income, filter by dates, and view individual patient bills.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-slate-700 bg-transparent py-2 focus:outline-none"
            />
            <span className="text-slate-300">to</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-slate-700 bg-transparent py-2 focus:outline-none"
            />
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary font-semibold flex items-center gap-1.5"
          >
            <Download size={14} />
            {isDownloading ? 'Downloading...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Receipt size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR {totals.amount.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Earned Income</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <Stethoscope size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR {totals.consultation.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Consultation Fees</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <BriefcaseMedical size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR {totals.medicines.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Medicine Sales</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center mb-3">
            <Activity size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{filteredPrescriptions.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Patient Bills</div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-emerald-600 flex items-center justify-center mb-3">
            <Activity size={18} />
          </div>
          <div className="text-2xl font-bold text-emerald-600">- LKR {totals.discount.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Discounts Given</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider p-5 border-b border-slate-100 flex items-center gap-1.5">
          Patient Billing Ledger ({filteredPrescriptions.length} Records)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Token</th>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3 text-right">Consultation</th>
                <th className="px-5 py-3 text-right">Medicine</th>
                <th className="px-5 py-3 text-right">Other</th>
                <th className="px-5 py-3 text-right text-emerald-600">Discount</th>
                <th className="px-5 py-3 text-right text-emerald-700">Total Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map(p => {
                  let medsCost = 0;
                  if (Array.isArray(p.medicines)) {
                    p.medicines.forEach((m: any) => { medsCost += (m.price || 0) * (m.qty || 0); });
                  }
                  
                  let otherCost = 0;
                  if (Array.isArray(p.additionalCharges)) {
                    p.additionalCharges.forEach((c: any) => { otherCost += (c.fee || c.amount || 0); });
                  }

                  return (
                    <tr key={p.token} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        {new Date(p.date).toLocaleDateString()} {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-700">
                        {p.token}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800">
                        {p.patientName || 'Walk-in'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-slate-500">
                        LKR {p.consultationFee.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-slate-500">
                        LKR {medsCost.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-slate-600 font-mono">
                        {otherCost > 0 ? `LKR ${otherCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-emerald-600 font-mono">
                        {p.discount > 0 ? `- LKR ${p.discount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-emerald-700 font-mono font-bold">
                        LKR {p.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No completed bills found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
