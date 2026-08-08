import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Medicine, AdditionalCharge, PrescriptionItem, Prescription } from '../types';
import { FilePlus, Check, Pill, Plus, X, AlertCircle, Receipt, Printer, ArrowLeft, RefreshCw } from 'lucide-react';
import { printInvoice } from '../utils/printInvoice';


export const NewRequest: React.FC = () => {
  const { medicines, addPrescription, pharmacyInfo, prescriptions, serviceFees, currentUser } = useAppState();

  const [step, setStep] = useState(1);
  const [generatedToken, setGeneratedToken] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<Prescription | null>(null);

  const [requestDetails, setRequestDetails] = useState('');
  const [requestRef, setRequestRef] = useState('');
  const [requestedBy, setRequestedBy] = useState(currentUser?.name || 'Admin User');
  const [consultationFee, setConsultationFee] = useState<number>(pharmacyInfo.defaultConsultationFee ?? 1500);
  const [discount, setDiscount] = useState<number>(0);

  React.useEffect(() => {
    if (currentUser?.name) setRequestedBy(currentUser.name);
  }, [currentUser]);

  React.useEffect(() => {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const seqs = prescriptions
      .filter(p => p.patientNo.startsWith(prefix))
      .map(p => parseInt(p.patientNo.split('-')[2], 10) || 0);
    const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
    setRequestRef(`${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`);
  }, [prescriptions]);

  const [selectedMeds, setSelectedMeds] = useState<PrescriptionItem[]>([]);

  // Temporary selectors for adding a medicine
  const [tempMedId, setTempMedId] = useState('');
  const [tempQty, setTempQty] = useState(10);
  const [tempUnit, setTempUnit] = useState('tablets');

  // ─── Additional Charges State ───
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() =>
    serviceFees.map((fee, idx) => ({
      name: fee.name,
      fee: fee.defaultFee,
      checked: idx === 0, // Make first service checked by default (usually Nebulizer)
    }))
  );

  React.useEffect(() => {
    setAdditionalCharges(prev =>
      serviceFees.map((fee, idx) => {
        const existing = prev.find(c => c.name === fee.name);
        return {
          name: fee.name,
          fee: existing ? existing.fee : fee.defaultFee,
          checked: existing ? existing.checked : idx === 0,
        };
      })
    );
  }, [serviceFees]);

  // ─── Helper: Add Medicine to prescription list ───
  const handleAddMedItem = () => {
    if (!tempMedId) {
      alert('Please select a medicine first.');
      return;
    }
    const targetMed = medicines.find(m => m.id === tempMedId);
    if (!targetMed) return;

    // Check duplicate
    if (selectedMeds.some(m => m.medicineId === tempMedId)) {
      alert('Medicine already added to this prescription. Please adjust the quantity in the table directly.');
      return;
    }

    setSelectedMeds(prev => [
      ...prev,
      {
        medicineId: targetMed.id,
        name: targetMed.name,
        qty: tempQty,
        price: targetMed.price,
        unit: tempUnit,
      }
    ]);
    setTempMedId('');
  };

  const handleRemoveMedItem = (medId: string) => {
    setSelectedMeds(prev => prev.filter(m => m.medicineId !== medId));
  };

  const handleQtyChange = (medId: string, val: number) => {
    setSelectedMeds(prev => prev.map(m => {
      if (m.medicineId === medId) {
        return { ...m, qty: Math.max(1, val) };
      }
      return m;
    }));
  };

  // ─── Toggle Additional Charges ───
  const handleToggleCharge = (idx: number) => {
    setAdditionalCharges(prev => prev.map((c, i) => {
      if (i === idx) {
        return { ...c, checked: !c.checked };
      }
      return c;
    }));
  };

  // ─── Bill Calculations ───
  const medicinesSubtotal = selectedMeds.reduce((acc, m) => acc + (m.qty * m.price), 0);
  const additionalChargesTotal = additionalCharges.filter(c => c.checked).reduce((acc, c) => acc + c.fee, 0);
  const totalAmount = Math.max(0, Number(consultationFee) + medicinesSubtotal + additionalChargesTotal - Number(discount));

  // ─── Submit handler: Generate Bill & Token ───
  const handleGenerateInvoice = async () => {
    const stockErrors: string[] = [];
    selectedMeds.forEach(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) {
        stockErrors.push(`Medicine ${item.name} not found in inventory.`);
      } else if (med.qty < item.qty) {
        stockErrors.push(`${item.name}: only ${med.qty} units available, ${item.qty} requested.`);
      }
    });

    if (stockErrors.length > 0) {
      const proceed = confirm(
        `STOCK WARNING:\n\n${stockErrors.join('\n')}\n\nSubmit anyway? Staff will be notified during issuing.`
      );
      if (!proceed) return;
    }

    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 16);

    // Open window synchronously to avoid popup blockers
    const printWindow = window.open('', '_blank', 'width=600,height=700');

    try {
      const newPrescriptionData = {
        patientName: requestDetails.trim() || 'Walk-in',
        patientNo: requestRef,
        doctor: requestedBy,
        date: formattedDate,
        medicines: selectedMeds,
        consultationFee: Number(consultationFee),
        additionalCharges: additionalCharges.filter(c => c.checked),
        totalAmount,
        discount: Number(discount),
        status: 'Pending' as const,
      };

      const token = await addPrescription(newPrescriptionData);

      setGeneratedToken(token);
      const generatedPre: Prescription = {
        ...newPrescriptionData,
        token,
      };
      setSubmittedRequest(generatedPre);
      setStep(2);
      
      // Auto-open PDF download with the pre-opened window
      printInvoice(generatedPre, pharmacyInfo, printWindow);
    } catch {
      if (printWindow) printWindow.close();
      alert('Failed to submit medicine request. Ensure the backend is running and try again.');
    }
  };

  const getNextRequestRef = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const seqs = prescriptions
      .filter(p => p.patientNo.startsWith(prefix))
      .map(p => parseInt(p.patientNo.split('-')[2], 10) || 0);
    const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  const handleResetForm = () => {
    setStep(1);
    setRequestDetails('');
    setRequestRef(getNextRequestRef());
    setSelectedMeds([]);
    setDiscount(0);
    setAdditionalCharges(prev => prev.map(c => ({ ...c, checked: false })));
    setSubmittedRequest(null);
  };

  const handlePrint = () => {
    if (submittedRequest) {
      printInvoice(submittedRequest, pharmacyInfo);
    } else {
      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 16);
      const p: Prescription = {
        token: generatedToken,
        patientName: requestDetails.trim(),
        patientNo: requestRef,
        doctor: requestedBy,
        date: formattedDate,
        medicines: selectedMeds,
        consultationFee: Number(consultationFee),
        additionalCharges: additionalCharges.filter(c => c.checked),
        totalAmount,
        discount: Number(discount),
        status: 'Pending',
      };
      printInvoice(p, pharmacyInfo);
    }
  };

  const handleDownload = () => {
    if (submittedRequest) {
      printInvoice(submittedRequest, pharmacyInfo);
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">New Medicine Request</h2>
          <p className="text-xs text-slate-500 mt-1">
            Admin creates internal medicine requests. A unique token is generated and sent to the Staff dashboard for issuing.
          </p>
        </div>
        {step === 2 && (
          <button
            onClick={handleResetForm}
            className="btn font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>New Request</span>
          </button>
        )}
      </div>

      {/* Workflow Stepper Indicator */}
      <div className="flex items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {step > 1 ? <Check size={12} /> : '1'}
            </div>
            <span className={`font-semibold ${step >= 1 ? 'text-sky-600' : 'text-slate-400'}`}>Request Details</span>
          </div>
          <div className={`h-[2px] flex-1 mx-4 ${step > 1 ? 'bg-sky-600' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
            <span className={`font-semibold ${step === 2 ? 'text-sky-600' : 'text-slate-400'}`}>Token Receipt (Staff Queue)</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Prescription Input Form */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block: Patient Info and Charges (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Patient Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Request Information
              </h3>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Request Details *</label>
                <textarea
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder="e.g. Ward 3 emergency supply, outpatient clinic morning session..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Request Reference</label>
                  <input
                    type="text"
                    readOnly
                    value={requestRef}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Requested By</label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="text-slate-500 font-semibold">Discount Amount (LKR)</label>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="Optional discount..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Additional Charges Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Optional Medical Tests & Services
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {additionalCharges.map((charge, idx) => (
                  <div
                    key={charge.name}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none flex-grow py-1">
                      <input
                        type="checkbox"
                        checked={charge.checked}
                        onChange={() => handleToggleCharge(idx)}
                        className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-700">{charge.name}</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">LKR</span>
                      <input
                        type="number"
                        min={0}
                        value={charge.fee}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAdditionalCharges(prev => prev.map((c, i) => i === idx ? { ...c, fee: val } : c));
                        }}
                        disabled={!charge.checked}
                        className="w-20 text-right bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-md py-1 px-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Block: Medicine Prescribing Table & Bill Summary (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Prescribing Table Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Prescribed Medications</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select and append drugs to list</p>
                </div>
              </div>

              {/* In-Line Adder Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine</label>
                  <select
                    value={tempMedId}
                    onChange={(e) => setTempMedId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Drug --</option>
                    {medicines.map(m => (
                      <option key={m._uid} value={m.id}>
                        {m.genericName || m.name} — {m.tradeName || m.name} (LKR {m.price.toFixed(2)} | {m.qty} left)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={tempQty}
                    onChange={(e) => setTempQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddMedItem}
                    className="btn btn-teal w-full justify-center font-bold text-xs h-9"
                  >
                    <Plus size={14} />
                    <span>Prescribe</span>
                  </button>
                </div>
              </div>

              {/* Table list of selected medicines */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-slate-400 uppercase">Drug</th>
                      <th className="px-3 py-2 text-center font-bold text-slate-400 uppercase">Prescribed Qty</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-400 uppercase">Unit price</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-400 uppercase">Total</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedMeds.map((item, idx) => {
                      // Get stock constraints
                      const med = medicines.find(m => m.id === item.medicineId);
                      const isLowStock = med ? med.qty < item.qty : true;
                      const availableQty = med ? med.qty : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3 font-semibold text-slate-800 text-xs">
                            <div>{item.name}</div>
                            {isLowStock && (
                              <div className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                <span>Shortage Warning: {availableQty} left in inventory</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => handleQtyChange(item.medicineId, Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 text-center rounded py-1 font-semibold text-xs"
                            />
                          </td>
                          <td className="px-3 py-3 text-slate-500 font-mono font-medium">
                            LKR {item.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                            LKR {(item.qty * item.price).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedItem(item.medicineId)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {selectedMeds.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                          No medications prescribed yet. Select from the adder dropdown above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary and Submit Card */}
            <div className="p-5 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50/50 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-sky-100">
                Prescription Bill Summary
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Consultation Fee:</span>
                  <span className="font-mono">LKR {Number(consultationFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Prescribed Medications ({selectedMeds.length}):</span>
                  <span className="font-mono">LKR {medicinesSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Additional Charges / Lab services:</span>
                  <span className="font-mono">LKR {additionalChargesTotal.toLocaleString()}</span>
                </div>
                {Number(discount) > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- LKR {Number(discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-sky-200/60 pt-3 flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-base text-sky-600">LKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="btn btn-primary w-full py-3 justify-center font-bold text-xs tracking-wider cursor-pointer shadow-lg shadow-blue-900/10"
              >
                <Receipt size={14} />
                <span>Generate Bill & Unique Token</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: Token Created & Print Receipt view */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn text-xs">
          
          {/* Real-time Pharmacy Integration notification */}
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl flex items-center gap-3 shadow-sm">
            <Check className="text-emerald-700 bg-emerald-100 p-1.5 rounded-full flex-shrink-0" size={26} />
            <div>
              <strong className="font-bold text-emerald-900 block">Token {generatedToken} Generated & Transmitted to Staff Pharmacy Dashboard</strong>
              <span className="text-emerald-700 leading-relaxed mt-0.5 block">
                The pharmacy counter has received this prescription immediately. Hand the printed receipt to the patient.
              </span>
              <div className="mt-1.5 text-emerald-800 font-semibold bg-emerald-100/50 inline-block px-3 py-1 rounded">
                Final Bill Amount: LKR {(submittedRequest?.totalAmount ?? totalAmount).toLocaleString()} 
                {(submittedRequest?.discount ?? 0) > 0 && ` (Includes LKR ${Number(submittedRequest?.discount).toLocaleString()} Discount)`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Block: The Printable Receipt Paper (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="btn btn-primary flex-1 justify-center font-bold text-xs py-2.5 shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 font-bold text-xs px-5 py-2.5 cursor-pointer flex items-center gap-1 justify-center"
                >
                  Download PDF
                </button>
              </div>

              {/* PDF/Print Receipt Container */}
              <div
                id="printable-receipt"
                className="receipt-paper border border-slate-200/80 rounded-xl p-5 bg-[#FDFEFF] shadow-xl space-y-4 text-slate-800 text-left"
              >
                {/* Clinic Info */}
                <div className="receipt-clinic text-center border-b border-dashed border-slate-200 pb-3">
                  <h4 className="receipt-clinic-name font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
                    <Pill size={14} className="text-sky-500 transform -rotate-45" />
                    {pharmacyInfo.name}
                  </h4>
                  <p className="receipt-clinic-sub text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                    {pharmacyInfo.address} <br />
                    Tel: {pharmacyInfo.phone} &nbsp;·&nbsp; {pharmacyInfo.website}
                  </p>
                </div>

                {/* Token Indicator Block */}
                <div className="receipt-token-block bg-slate-800 text-white rounded-lg p-3 text-center shadow-inner">
                  <span className="receipt-token-label text-[9px] uppercase tracking-wider text-slate-300 font-medium block">
                    Pharmacy Token Number
                  </span>
                  <div className="receipt-token-number text-xl font-bold font-mono tracking-widest text-white my-1">
                    {generatedToken}
                  </div>
                  <span className="receipt-token-hint text-[9px] text-slate-400 font-medium block">
                    Present this receipt at pharmacy counter for medicine collection
                  </span>
                </div>

                {/* Patient Information */}
                <div>
                  <div className="receipt-section-label text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                    Patient Details
                  </div>
                  <div className="space-y-1.5">
                    <div className="receipt-row flex justify-between font-medium">
                      <span className="text-slate-400">Date/Time:</span>
                      <span className="font-semibold">{submittedRequest?.date || new Date().toLocaleString()}</span>
                    </div>
                    <div className="receipt-row flex justify-between font-medium">
                      <span className="text-slate-400">Patient Sequence:</span>
                      <span className="font-semibold font-mono">{submittedRequest?.patientNo || ''}</span>
                    </div>
                    {submittedRequest?.patientName && (
                      <div className="receipt-row flex justify-between font-medium">
                        <span className="text-slate-400">Patient Name:</span>
                        <span className="font-semibold">{submittedRequest.patientName}</span>
                      </div>
                    )}
                    <div className="receipt-row flex justify-between font-medium">
                      <span className="text-slate-400">Consultant:</span>
                      <span className="font-semibold">{submittedRequest?.doctor || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Prescribed Medications */}
                <div>
                  <div className="receipt-section-label text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                    Prescribed Medicines
                  </div>
                  <div className="space-y-1.5">
                    {(submittedRequest?.medicines || selectedMeds).map((m, idx) => (
                      <div key={idx} className="receipt-row flex justify-between text-slate-700 font-medium">
                        <span>
                          {m.name} <span className="text-[10px] text-slate-400 font-medium">({m.qty} {m.unit})</span>
                        </span>
                        <span className="font-mono">LKR {(m.qty * m.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other charges */}
                {((submittedRequest?.consultationFee ?? 0) > 0 || (submittedRequest?.additionalCharges ?? []).length > 0) && (
                  <div>
                    <div className="receipt-section-label text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                      Consultation & Services
                    </div>
                    <div className="space-y-1.5">
                      {(submittedRequest?.consultationFee ?? 0) > 0 && (
                        <div className="receipt-row flex justify-between text-slate-700 font-medium">
                          <span>Consultation Fee</span>
                          <span className="font-mono">LKR {Number(submittedRequest?.consultationFee).toFixed(2)}</span>
                        </div>
                      )}
                      {(submittedRequest?.additionalCharges ?? []).map((c, idx) => (
                        <div key={idx} className="receipt-row flex justify-between text-slate-700 font-medium">
                          <span>{c.name}</span>
                          <span className="font-mono">LKR {c.fee.toFixed(2)}</span>
                        </div>
                      ))}
                      {(submittedRequest?.discount ?? 0) > 0 && (
                        <div className="receipt-row flex justify-between text-slate-700 font-medium">
                          <span>Discount Applied</span>
                          <span className="font-mono text-emerald-600">-LKR {Number(submittedRequest?.discount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total amount Row */}
                <div className="receipt-total-row flex justify-between items-center text-slate-800 text-sm font-bold border-t-2 border-slate-200 pt-3">
                  <span>Grand Total Amount:</span>
                  <span className="font-mono text-base text-slate-800">LKR {(submittedRequest?.totalAmount ?? totalAmount).toLocaleString()}</span>
                </div>

                {/* Barcode Mockup */}
                <div className="barcode-wrap border border-slate-100 bg-slate-50/50 rounded-lg p-3 text-center space-y-2 mt-4">
                  <span className="barcode-title text-[9px] uppercase tracking-widest text-slate-400 font-medium block">
                    Scan At Counter to Dispense
                  </span>
                  <div className="flex items-end justify-center gap-[2px] h-9">
                    {Array.from({ length: 32 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-slate-800 w-[1.5px]"
                        style={{ height: `${20 + Math.abs(Math.sin(i * 0.8)) * 14}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-slate-400 font-semibold block">
                    {generatedToken}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
                  </span>
                </div>
              </div>

            </div>

            {/* Right Block: Live Token workflow tracking (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Token Workflow tracker card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Pharmacy Live Token Workflow
                </h3>

                <div className="space-y-4">
                  {[
                    { label: 'Token generated & registered securely in data store', done: true },
                    { label: `Prescription queue updated with token: ${generatedToken}`, done: true },
                    { label: 'Printed receipt delivered to patient', done: false },
                    { label: 'Patient presents token receipt at pharmacy counter', done: false },
                    { label: 'Pharmacist verifies prescription items and dispenses', done: false },
                    { label: 'Available inventory levels auto-deducted in real-time', done: false },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-3.5 items-center text-xs">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${step.done ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                        {step.done ? <Check size={12} /> : idx + 1}
                      </div>
                      <span className={step.done ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResetForm}
                  className="btn btn-teal flex-1 justify-center py-3 font-bold text-xs cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>New Request Form</span>
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn bg-white border-slate-200 text-slate-700 py-3 px-6 font-bold text-xs cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
