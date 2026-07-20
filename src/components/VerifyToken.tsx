import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';
import { Pill, Check, CheckCircle2, AlertTriangle, Scan, Search, ArrowLeft, Printer } from 'lucide-react';
import { printInvoice } from '../utils/printInvoice';

interface VerifyTokenProps {
  initialToken?: string;
  onClearInitialToken?: () => void;
}

export const VerifyToken: React.FC<VerifyTokenProps> = ({ initialToken, onClearInitialToken }) => {
  const { prescriptions, medicines, dispensePrescription, currentUser, setTab, pharmacyInfo } = useAppState();

  const handlePrintInvoice = (p: any) => {
    printInvoice(p, pharmacyInfo);
  };

  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [activePrescription, setActivePrescription] = useState<any | null>(null);
  
  // Checklist states mapped to index
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [dispenseSuccess, setDispenseSuccess] = useState(false);

  // Look up when initialToken is passed
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      handleLookup(initialToken);
    }
  }, [initialToken, prescriptions]);

  const handleLookup = (tokStr = tokenInput) => {
    setDispenseSuccess(false);
    const p = prescriptions.find(pr => pr.token.toUpperCase().trim() === tokStr.toUpperCase().trim());
    if (p) {
      setActivePrescription(p);
      setChecklist(p.medicines.map(() => false));
    } else {
      setActivePrescription(null);
      setChecklist([]);
    }
  };

  const handleToggleChecklist = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => (i === idx ? !item : item)));
  };

  const handleConfirmDispense = async () => {
    if (!activePrescription) return;

    const allChecked = checklist.every(val => val);
    if (!allChecked) {
      const confirmIncomplete = confirm('Some items in the dispensing checklist have not been checked off. Do you still want to issue these medications to the patient?');
      if (!confirmIncomplete) return;
    }

    const staffName = currentUser?.name || 'Pharmacy Staff';
    const updated = await dispensePrescription(activePrescription.token, staffName);

    if (updated) {
      setDispenseSuccess(true);
      setActivePrescription(updated);
    } else {
      alert('Could not complete request. It may already be completed or the token is invalid.');
    }
  };

  const handleResetSearch = () => {
    setActivePrescription(null);
    setTokenInput('');
    setChecklist([]);
    setDispenseSuccess(false);
    if (onClearInitialToken) onClearInitialToken();
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Verify Token & Issue Medicines</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter the token from the request receipt, verify medicines, and mark the request as Completed.
          </p>
        </div>
        <button
          onClick={() => setTab('dashboard')}
          className="btn font-semibold flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Queue</span>
        </button>
      </div>

      {/* Token Search lookup bar */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Enter token number to fetch details — e.g. MED-00132"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-800 tracking-wider text-xs rounded-lg py-2.5 pl-10 pr-4 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleLookup()}
            className="btn btn-primary font-bold px-5 cursor-pointer"
          >
            Look up Request
          </button>
          <button
            onClick={handleResetSearch}
            className="btn bg-white border-slate-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {dispenseSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
          <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
          <div>
            <strong className="font-bold text-emerald-950 block">Request marked as Completed successfully!</strong>
            <span className="text-[11px] block mt-0.5">Medicine inventory quantities have been deducted in real time. Log updated.</span>
          </div>
        </div>
      )}

      {/* Active Prescription Details panels */}
      {activePrescription ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Area: Prescription metadata & checklists (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Metadata Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Prescription Metadata
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activePrescription.status === 'Completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  Status: {activePrescription.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">TOKEN ID</span>
                  <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">{activePrescription.token}</span>
                </div>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">PATIENT SEQUENCE</span>
                  <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">{activePrescription.patientNo}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Patient Name:</span>
                  <strong className="text-slate-800 font-bold">{activePrescription.patientName || 'Anonymous patient'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Prescribing Doctor:</span>
                  <strong className="text-slate-800 font-bold">{activePrescription.doctor}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Registered Timestamp:</span>
                  <strong className="text-slate-800 font-bold">{activePrescription.date}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-800">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-sky-600">LKR {activePrescription.totalAmount.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handlePrintInvoice(activePrescription)}
                    className="btn border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print Bill Invoice</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist dispensing block */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dispensing checklist</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Collect drugs and tick them off before handing over</p>
              </div>

              <div className="space-y-2">
                {activePrescription.medicines.map((item: any, idx: number) => {
                  const isChecked = checklist[idx] || activePrescription.status === 'Completed';
                  
                  return (
                    <label
                      key={item.medicineId}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition ${
                        isChecked ? 'bg-slate-50/50 border-slate-200' : 'border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={activePrescription.status === 'Completed'}
                          checked={isChecked}
                          onChange={() => handleToggleChecklist(idx)}
                          className="w-4 h-4 accent-[#0D7E5A] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{item.name}</div>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Quantity: {item.qty} {item.unit}</span>
                        </div>
                      </div>

                      {isChecked && <Check className="text-emerald-600 bg-emerald-100 p-0.5 rounded-full" size={16} />}
                    </label>
                  );
                })}
              </div>

              {activePrescription.status !== 'Completed' && (
                <div className="pt-2">
                  <button
                    onClick={handleConfirmDispense}
                    className="btn btn-primary w-full py-3 justify-center font-bold tracking-wider cursor-pointer shadow-lg shadow-sky-900/10"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark as Completed</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Area: Stock previews (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Real-time stock impact previews */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1">
                <Pill size={14} className="text-sky-500" />
                Inventory Stock Adjustments
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-slate-400 uppercase">Medicine</th>
                      <th className="px-3 py-2 text-center font-bold text-slate-400 uppercase">Needed</th>
                      <th className="px-3 py-2 text-center font-bold text-slate-400 uppercase">Available</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-400 uppercase">After Dispense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activePrescription.medicines.map((item: any, idx: number) => {
                      const med = medicines.find(m => m.id === item.medicineId);
                      const currentStock = med ? med.qty : 0;
                      const postStock = Math.max(0, currentStock - item.qty);
                      const isShortage = currentStock < item.qty;

                      return (
                        <tr key={idx}>
                          <td className="px-3 py-3 font-semibold text-slate-800 text-xs">
                            {item.name}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono">
                            {item.qty}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-600 font-mono">
                            {currentStock}
                          </td>
                          <td className={`px-3 py-3 text-right font-mono font-bold ${
                            isShortage ? 'text-red-600' : 'text-emerald-700'
                          }`}>
                            {activePrescription.status === 'Completed' ? currentStock : postStock}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* In stock warnings alert */}
              {activePrescription.medicines.some((item: any) => {
                const med = medicines.find(m => m.id === item.medicineId);
                return med ? med.qty < item.qty : true;
              }) && activePrescription.status !== 'Completed' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 animate-pulse">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Inventory Shortage Warn:</span> One or more drugs prescribed are currently short of requested quantities. Ensure proper supplier coordination.
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center select-none text-slate-400 space-y-3">
          <Scan size={36} className="mx-auto text-slate-300 animate-pulse" />
          <div className="font-semibold text-slate-500">Awaiting Prescription Token Lookup</div>
          <p className="max-w-md mx-auto text-xs text-slate-400 leading-relaxed">
            Scan the barcode on the patient’s receipt or enter their MED token number above to retrieve prescribed medications, prices, and checklist controls.
          </p>
        </div>
      )}
    </div>
  );
};
