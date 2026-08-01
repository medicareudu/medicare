import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';
import { Medicine, PrescriptionItem, Prescription } from '../types';
import { ShoppingBag, Plus, Trash2, CheckCircle2, Printer, RefreshCw, AlertCircle, ShoppingCart, ShieldCheck } from 'lucide-react';
import { printInvoice } from '../utils/printInvoice';

export const DirectPurchase: React.FC = () => {
  const { medicines, directPurchasePrescription, pharmacyInfo, prescriptions, currentUser } = useAppState();

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [referenceNo, setReferenceNo] = useState('');
  const [issuedBy, setIssuedBy] = useState(currentUser?.name || 'Staff User');
  const [discount, setDiscount] = useState<number>(0);

  const [selectedMeds, setSelectedMeds] = useState<PrescriptionItem[]>([]);
  const [tempMedId, setTempMedId] = useState('');
  const [tempQty, setTempQty] = useState<number>(10);
  const [tempUnit, setTempUnit] = useState('tablets');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Prescription | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name) setIssuedBy(currentUser.name);
  }, [currentUser]);

  // Generate Reference Number
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const prefix = `OTC-${currentYear}-`;
    const seqs = prescriptions
      .filter((p) => p.patientNo && p.patientNo.startsWith(prefix))
      .map((p) => parseInt(p.patientNo.split('-')[2], 10) || 0);
    const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
    setReferenceNo(`${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`);
  }, [prescriptions]);

  const activeMedicines = medicines.filter((m) => m.qty > 0);
  const selectedMedObj = medicines.find((m) => m.id === tempMedId);

  const handleAddMed = () => {
    if (!tempMedId || !selectedMedObj) {
      alert('Please select a medicine.');
      return;
    }

    if (tempQty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (tempQty > selectedMedObj.qty) {
      alert(`Cannot add ${tempQty} units. Only ${selectedMedObj.qty} units available in stock.`);
      return;
    }

    const existingIndex = selectedMeds.findIndex((m) => m.medicineId === tempMedId);
    if (existingIndex > -1) {
      const newMeds = [...selectedMeds];
      const newTotalQty = newMeds[existingIndex].qty + tempQty;
      if (newTotalQty > selectedMedObj.qty) {
        alert(`Cannot add ${tempQty} more units. Total requested (${newTotalQty}) exceeds available stock (${selectedMedObj.qty}).`);
        return;
      }
      newMeds[existingIndex].qty = newTotalQty;
      setSelectedMeds(newMeds);
    } else {
      setSelectedMeds((prev) => [
        ...prev,
        {
          medicineId: selectedMedObj.id,
          name: selectedMedObj.name,
          qty: tempQty,
          price: selectedMedObj.price,
          unit: tempUnit,
        },
      ]);
    }

    setTempMedId('');
    setTempQty(10);
  };

  const handleRemoveMed = (medId: string) => {
    setSelectedMeds((prev) => prev.filter((m) => m.medicineId !== medId));
  };

  const handleQtyChange = (medId: string, val: number) => {
    const medObj = medicines.find((m) => m.id === medId);
    const maxAvailable = medObj ? medObj.qty : 9999;
    const safeQty = Math.max(1, Math.min(val, maxAvailable));

    setSelectedMeds((prev) =>
      prev.map((m) => {
        if (m.medicineId === medId) {
          return { ...m, qty: safeQty };
        }
        return m;
      })
    );
  };

  const medicineSubtotal = selectedMeds.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = Math.max(0, medicineSubtotal - discount);

  const handleSubmitSale = async () => {
    if (selectedMeds.length === 0) {
      alert('Please add at least one medicine to the purchase list.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const saleRecord = await directPurchasePrescription({
        patientName: customerName.trim() || 'Walk-in Customer',
        patientNo: referenceNo,
        medicines: selectedMeds,
        totalAmount: grandTotal,
        discount,
      });

      if (saleRecord) {
        setCompletedSale(saleRecord);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete direct purchase';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCompletedSale(null);
    setSelectedMeds([]);
    setCustomerName('Walk-in Customer');
    setDiscount(0);
    setErrorMessage(null);
  };

  if (completedSale) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
        <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/40 shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest bg-emerald-700/60 px-3 py-1 rounded-full font-bold">
              Transaction Complete
            </span>
            <h2 className="text-2xl font-bold mt-2">Direct OTC Purchase Issued</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Token <strong className="font-mono text-white text-base">{completedSale.token}</strong> created & medicines issued. Stock decremented automatically.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Token / Ref</div>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{completedSale.token}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Customer</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{completedSale.patientName}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Date & Time</div>
              <div className="font-semibold text-slate-700 text-xs mt-0.5">{completedSale.issuedAt || completedSale.date}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Cashier / Issued By</div>
              <div className="font-semibold text-slate-700 text-xs mt-0.5">{completedSale.issuedBy || currentUser?.name}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Issued Items</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Medicine</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSale.medicines.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{m.name}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-700">{m.qty}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">LKR {m.price.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800">LKR {(m.price * m.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Consultation & Medical Procedure fees: <strong className="text-slate-700 font-bold">LKR 0.00</strong></span>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold">Total Charged</div>
              <div className="text-2xl font-bold text-slate-900">LKR {completedSale.totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => printInvoice(completedSale, pharmacyInfo)}
              className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer size={16} /> Print Receipt / Invoice
            </button>
            <button
              onClick={handleResetForm}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={16} /> New Direct Purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-sky-500/20 text-sky-300 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-sky-400/30 flex items-center gap-1">
              <ShoppingBag size={12} /> Direct OTC Purchase Module
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Over-The-Counter Medicine Checkout</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Issue medicines directly to patients without consultation fees or additional procedure charges. Inventory deducts immediately upon checkout.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right flex flex-col items-end">
          <span className="text-[10px] text-slate-300 font-semibold uppercase">Consultation Fee</span>
          <span className="text-lg font-extrabold text-emerald-400">LKR 0.00 <span className="text-[10px] text-slate-300 font-normal">(Exempted)</span></span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Medicine Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Sale Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Customer & Sale Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Patient Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in Customer"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Reference No</label>
                <input
                  type="text"
                  value={referenceNo}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cashier / Staff</label>
                <input
                  type="text"
                  value={issuedBy}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Medicine Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex justify-between items-center">
              <span>2. Select Medicine from Stock</span>
              <span className="text-[10px] text-sky-600 font-semibold normal-case bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                {activeMedicines.length} Available in Inventory
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name</label>
                <select
                  value={tempMedId}
                  onChange={(e) => setTempMedId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Medicine --</option>
                  {activeMedicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category}) — LKR {m.price.toFixed(2)} [Stock: {m.qty}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedMedObj ? selectedMedObj.qty : 999}
                  value={tempQty}
                  onChange={(e) => setTempQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-bold text-center"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                <select
                  value={tempUnit}
                  onChange={(e) => setTempUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium"
                >
                  <option value="tablets">tablets</option>
                  <option value="capsules">capsules</option>
                  <option value="bottles">bottles</option>
                  <option value="strips">strips</option>
                  <option value="sachets">sachets</option>
                  <option value="items">items</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddMed}
                  disabled={!tempMedId}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {selectedMedObj && (
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Selected: </span>
                  <strong className="text-slate-800">{selectedMedObj.name}</strong>
                  <span className="text-slate-400 ml-2">Category: {selectedMedObj.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-medium">Unit Price: <strong>LKR {selectedMedObj.price.toFixed(2)}</strong></span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${selectedMedObj.qty <= selectedMedObj.minThreshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    Available Stock: {selectedMedObj.qty}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Added Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 flex justify-between items-center">
              <span>3. Items in Current Sale ({selectedMeds.length})</span>
            </h3>

            {selectedMeds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center gap-2">
                <ShoppingCart size={24} className="text-slate-300" />
                <span>No medicines added yet. Select a medicine above to add to cart.</span>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Medicine Name</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-center">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Line Total</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMeds.map((item) => (
                      <tr key={item.medicineId} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">LKR {item.price.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(item.medicineId, parseInt(e.target.value, 10) || 1)}
                            className="w-16 py-1 px-2 text-xs border border-slate-200 rounded-lg text-center font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          LKR {(item.price * item.qty).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMed(item.medicineId)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Payment Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Medicine Subtotal ({selectedMeds.length} items)</span>
                <span className="font-semibold text-slate-800">LKR {medicineSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 py-1.5 border-t border-dashed border-slate-100">
                <span className="flex items-center gap-1.5">
                  Consultation Fee
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">Exempt</span>
                </span>
                <span className="font-bold text-emerald-600">LKR 0.00</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 py-1.5 border-t border-dashed border-slate-100">
                <span className="flex items-center gap-1.5">
                  Procedure & Testing Fees
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">Exempt</span>
                </span>
                <span className="font-bold text-emerald-600">LKR 0.00</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Discount (LKR)</label>
                <input
                  type="number"
                  min="0"
                  max={medicineSubtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-semibold text-right"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-sky-600">LKR {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitSale}
              disabled={isSubmitting || selectedMeds.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Processing Sale & Deducting Stock...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Complete & Issue Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
