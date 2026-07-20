import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Prescription } from '../types';
import { printInvoice } from '../utils/printInvoice';
import {
  Search,
  Calendar,
  Users,
  FileText,
  UserCheck,
  CreditCard,
  Pill,
  ChevronRight,
  Sparkles,
  Printer,
  Clock,
  BriefcaseMedical,
  CheckCircle2,
  DollarSign,
  Compass,
  ArrowUpDown
} from 'lucide-react';

export const PatientsLog: React.FC = () => {
  const { prescriptions, dispensePrescription, currentUser, pharmacyInfo } = useAppState();

  // Active sub-navigation tab
  const [activeTab, setActiveTab] = useState<'finder' | 'registry'>('finder');

  const handlePrintInvoice = (p: Prescription) => {
    printInvoice(p, pharmacyInfo);
  };

  // ─── Token Search states (Tab 1) ───
  const [searchToken, setSearchToken] = useState('MED-00132'); // Pre-populate with a valid seed token for instant UX
  const [inspectedPrescription, setInspectedPrescription] = useState<Prescription | null>(() => {
    return prescriptions.find(p => p.token === 'MED-00132') || null;
  });

  // ─── Registry Filter states (Tab 2) ───
  const [registrySearch, setRegistrySearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('2026-06-28'); // Visit counter specific day
  const [startDate, setStartDate] = useState('2026-06-25');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Find prescription by token search form
  const handleTokenSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchToken.trim().toUpperCase();
    const found = prescriptions.find(p => p.token === token || p.token.replace('MED-', '') === token);
    if (found) {
      setInspectedPrescription(found);
    } else {
      setInspectedPrescription(null);
      alert(`No clinical record found for token: "${token}"`);
    }
  };

  const handleInspectToken = (token: string) => {
    const found = prescriptions.find(p => p.token === token);
    if (found) {
      setSearchToken(token);
      setInspectedPrescription(found);
      setActiveTab('finder');
    }
  };

  // ─── Calculators & Filters for Registry ───
  // Specific-day count calculator
  const countOnSpecificDay = prescriptions.filter(p => p.date.substring(0, 10) === selectedDay).length;

  // Range and Search filter logic
  const filteredRegistry = prescriptions.filter(p => {
    const pDate = p.date.substring(0, 10); // YYYY-MM-DD
    
    // Date range filter
    const matchesStart = !startDate || pDate >= startDate;
    const matchesEnd = !endDate || pDate <= endDate;
    const matchesRange = matchesStart && matchesEnd;

    // Keyword search
    const matchesSearch = 
      p.patientNo.toLowerCase().includes(registrySearch.toLowerCase()) ||
      p.patientName.toLowerCase().includes(registrySearch.toLowerCase()) ||
      p.token.toLowerCase().includes(registrySearch.toLowerCase()) ||
      p.doctor.toLowerCase().includes(registrySearch.toLowerCase());

    return matchesRange && matchesSearch;
  });

  // Actionable dispense directly from token view
  const handleDispenseFromFinder = async (token: string) => {
    const activeStaffName = currentUser?.name || 'Admin User';
    const updated = await dispensePrescription(token, activeStaffName);
    if (updated) {
      setInspectedPrescription(updated);
      alert(`Prescription ${token} successfully dispensed and stock levels updated!`);
    } else {
      alert('Could not dispense prescription.');
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Patient Tracking & History Registry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search active patients by sequence, track optional consultation profiles, calculate daily metrics, and retrieve history.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-200/60 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setActiveTab('finder')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'finder'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            File Locator (Token)
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'registry'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Visit Registry & Stats
          </button>
        </div>
      </div>

      {/* TAB 1: FILE LOCATOR / SEARCH BY TOKEN */}
      {activeTab === 'finder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input search form (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Token Search</h3>
                <p className="text-[10px] text-slate-400">Scan or enter the unique 5-digit token number issued during physician consultation.</p>
              </div>

              <form onSubmit={handleTokenSearchSubmit} className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-00132"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2.5 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none rounded-lg font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn btn-primary font-bold py-2.5 rounded-lg text-xs justify-center flex items-center gap-1 cursor-pointer"
                >
                  Retrieve Patient File
                  <ChevronRight size={14} />
                </button>
              </form>

              {/* Seed suggestions list to help tester */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Available Patient Tokens</h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {prescriptions.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchToken(p.token);
                        setInspectedPrescription(p);
                      }}
                      className={`w-full p-2 rounded-lg text-left border flex justify-between items-center transition ${
                        inspectedPrescription?.token === p.token
                          ? 'bg-sky-50/50 border-sky-300'
                          : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                      }`}
                    >
                      <div className="font-mono font-bold text-slate-700 text-[10px]">{p.token}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[140px]">
                        {p.patientName || 'Walk-in'} &middot; {p.patientNo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Complete Clinical Invoice/Receipt Card (8 cols) */}
          <div className="lg:col-span-8">
            {inspectedPrescription ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-fadeIn">
                {/* File Card Header banner */}
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-sky-500 text-slate-900 px-2 py-0.5 rounded text-[11px]">
                        {inspectedPrescription.token}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">ID: {inspectedPrescription.patientNo}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Consulted via: {inspectedPrescription.doctor}</div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    inspectedPrescription.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : inspectedPrescription.status === 'Pending'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {inspectedPrescription.status}
                  </span>
                </div>

                {/* Patient Profile */}
                <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Demographic File</span>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {inspectedPrescription.patientName ? (
                        <span>{inspectedPrescription.patientName}</span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">No Name Registered (Walk-in Patient / Optional Name omitted)</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-right md:text-right text-slate-500">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registration Time</span>
                    <div className="font-semibold text-slate-700 text-xs flex items-center justify-end gap-1">
                      <Clock size={12} />
                      {inspectedPrescription.date}
                    </div>
                  </div>
                </div>

                {/* Prescribed Medicines Grid */}
                <div className="p-5 space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Pill size={12} className="text-sky-500" /> Prescribed Medications List
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px]">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Medication Name</th>
                          <th className="px-4 py-2.5 text-right">Dosage Count</th>
                          <th className="px-4 py-2.5 text-right">Unit Price</th>
                          <th className="px-4 py-2.5 text-right">Total (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                        {inspectedPrescription.medicines.map((item, mIdx) => (
                          <tr key={mIdx}>
                            <td className="px-4 py-3 text-slate-800">{item.name}</td>
                            <td className="px-4 py-3 text-right font-mono">{item.qty} {item.unit}</td>
                            <td className="px-4 py-3 text-right font-mono">LKR {item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-800">
                              LKR {(item.qty * item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {inspectedPrescription.medicines.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">No medications in this prescription.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing summary & charge details */}
                <div className="p-5 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Additional / Clinical service charges */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <BriefcaseMedical size={12} className="text-sky-500" /> Diagnostic & Additional Charges
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/50">
                        <span className="text-slate-600 font-medium">Physician Consultation Fee</span>
                        <span className="font-mono font-bold text-slate-800">LKR {inspectedPrescription.consultationFee.toLocaleString()}</span>
                      </div>

                      {inspectedPrescription.additionalCharges.map((c, cIdx) => (
                        <div key={cIdx} className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/50">
                          <span className="text-slate-600 font-medium">{c.name}</span>
                          <span className="font-mono font-bold text-slate-800">
                            {c.checked ? `LKR ${c.fee.toLocaleString()}` : <span className="text-slate-400 font-normal">Waived / Omitted</span>}
                          </span>
                        </div>
                      ))}

                      {inspectedPrescription.discount > 0 && (
                        <div className="flex justify-between p-2 bg-white rounded-lg border border-emerald-200/50">
                          <span className="text-emerald-600 font-medium">Discount Applied</span>
                          <span className="font-mono font-bold text-emerald-600">
                            - LKR {inspectedPrescription.discount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Receipt Grand Total summary */}
                  <div className="flex flex-col justify-between">
                    <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 text-right relative overflow-hidden">
                      {/* Abstract decorative icon */}
                      <DollarSign size={80} className="absolute -left-4 -bottom-4 text-white/5 pointer-events-none" />

                      <div className="space-y-1 z-10">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Grand Invoice Total</span>
                        <div className="text-2xl font-mono font-extrabold text-sky-400">
                          LKR {inspectedPrescription.totalAmount.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">All clinical duties, taxes and medicines inclusive.</p>
                      </div>
                    </div>

                    {/* Action button if status is Pending */}
                    <div className="pt-4 flex justify-end gap-2.5">
                      <button
                        onClick={() => handlePrintInvoice(inspectedPrescription)}
                        className="btn border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 font-semibold"
                      >
                        <Printer size={13} />
                        <span>Print Invoice</span>
                      </button>

                      {inspectedPrescription.status !== 'Completed' ? (
                        <button
                          onClick={() => handleDispenseFromFinder(inspectedPrescription.token)}
                          className="btn btn-primary font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>Dispense & Complete</span>
                        </button>
                      ) : (
                        <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg flex items-center gap-1.5 text-[10px] font-semibold">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Dispensed by {inspectedPrescription.issuedBy || 'Staff'} at {inspectedPrescription.issuedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <Compass size={40} className="text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No Patient File Loaded</h4>
                  <p className="text-slate-400 max-w-sm">Enter a valid token number in the search sidebar to fetch demographic data, prescribed dosages, and clinical billing sheets.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VISIT REGISTRY & DAILY VISIT METRICS */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          {/* Interactive Metrics widgets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Specific Day Visit Counter */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-850 p-5 rounded-2xl border border-slate-800 text-white flex flex-col justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-sky-400">Interactive Visit Audit</span>
                <h3 className="text-sm font-bold">Daily Visit Counter</h3>
                <p className="text-[10px] text-slate-400">Select any calendar date to tally patient volume serving clinical sessions.</p>
              </div>

              <div className="my-4 flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xl font-extrabold font-mono px-4 py-2.5 rounded-xl flex items-center justify-center min-w-[70px]">
                  {countOnSpecificDay}
                </div>
              </div>

              <span className="text-[9.5px] text-slate-500 font-mono">
                Tally matches logs for date sequence: <span className="font-bold text-slate-300">{selectedDay}</span>
              </span>
            </div>

            {/* Date Range Past Records Retrieval (Filters panel) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400">Chronological Audits</span>
                <h3 className="text-sm font-bold text-slate-800">Historical Date-Range Filters</h3>
                <p className="text-[10px] text-slate-500">Define boundaries to fetch and filter past medical records sequentially.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="space-y-1 text-left">
                  <label className="font-semibold text-slate-600">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-semibold text-slate-600">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Users size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500">Found <strong className="font-bold text-slate-800">{filteredRegistry.length}</strong> visits in selected window</span>
                </div>
                <button
                  onClick={() => {
                    setStartDate('2026-06-01');
                    setEndDate('2026-06-30');
                    setRegistrySearch('');
                  }}
                  className="text-sky-600 font-semibold text-[10.5px] hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Registry Search Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center relative">
            <Search size={14} className="absolute left-7 top-7 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter list by Sequence ID (P-XXX), Name, Doctor or Token..."
              value={registrySearch}
              onChange={(e) => setRegistrySearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2.5 pl-9 pr-4 text-xs text-slate-800 focus:outline-none rounded-lg"
            />
          </div>

          {/* Registry Table List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="px-5 py-3">Patient No.</th>
                    <th className="px-5 py-3">Patient Name</th>
                    <th className="px-5 py-3">Token No.</th>
                    <th className="px-5 py-3">Assigned Physician</th>
                    <th className="px-5 py-3">Consult Date</th>
                    <th className="px-5 py-3">Prescribed Medications</th>
                    <th className="px-5 py-3">Total Charged</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRegistry.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700">
                        {p.patientNo}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800">
                        {p.patientName || <span className="text-slate-400 font-normal italic">Walk-in Patient</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold">
                        <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                          {p.token}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-semibold">
                        {p.doctor}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono">
                        {p.date}
                      </td>
                      <td className="px-5 py-4 text-slate-500 truncate max-w-[200px]" title={p.medicines.map(m => `${m.name} (x${m.qty})`).join(', ')}>
                        {p.medicines.map(m => `${m.name} (x${m.qty})`).join(', ')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        LKR {p.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          p.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : 'bg-red-50 text-red-800 border border-red-100'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleInspectToken(p.token)}
                          className="px-2.5 py-1 text-sky-600 hover:text-sky-800 border border-sky-200 hover:border-sky-400 rounded-lg hover:bg-sky-50 font-bold transition duration-150"
                        >
                          Inspect File
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRegistry.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                        No matching historical records found for the defined search and date parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
