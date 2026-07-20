import React from 'react';
import { useAppState } from '../context/StateContext';
import { Prescription } from '../types';
import {
  Pill,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FileUp,
  Clock,
  FilePlus,
  Package,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    medicines,
    prescriptions,
    history,
    setTab,
    pharmacyInfo
  } = useAppState();

  // ─── Real-time Statistics Calculation ───
  const totalMedicinesCount = medicines.length;
  const pendingRequestsCount = prescriptions.filter(p => p.status === 'Pending').length;
  
  // Dynamic threshold from settings
  const defaultThreshold = pharmacyInfo.lowStockThreshold ?? 50;

  // Low Stock Items (below individual/global threshold)
  const lowStockMedicines = medicines.filter(m => m.qty < (m.minThreshold ?? defaultThreshold));
  const criticalCount = lowStockMedicines.filter(m => m.qty < 20).length;

  // Issued Today calculation
  const completedTodayCount = prescriptions.filter(p => p.status === 'Completed').length;

  // Recent Requests (last 5)
  const recentPrescriptions = prescriptions.slice(0, 5);

  // Dynamic Low stock items for tracker view (top 4 critical/warning)
  const displayedLowStock = [...lowStockMedicines]
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 4);

  // Daily issuances bars array
  const bars = [18, 24, 31, 28, 22, 35, 34, 29, 41, 38, 27, 33, 36, 40, 28, 30, 34, 31, 37, 42, 29, 35, 38, 31, 34, 39, 34];
  const maxV = Math.max(...bars);

  // Recent 4 Audit activities from state
  const displayedLogs = history.slice(0, 4);

  const getTimelineMarkerStyles = (type: string) => {
    switch (type) {
      case 'Import': return 'bg-blue-50 border border-blue-200 text-blue-700';
      case 'Completed': return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'Alert': return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'Request': return 'bg-sky-50 border border-sky-100 text-sky-700';
      default: return 'bg-slate-50 border border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Good morning, Admin</h2>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; {pendingRequestsCount} active requests pending pharmacy counter.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setTab('stock')} className="btn font-semibold cursor-pointer">
            <Package size={14} className="text-slate-600" />
            <span>View Stock</span>
          </button>
          <button onClick={() => setTab('request')} className="btn btn-primary font-semibold cursor-pointer">
            <FilePlus size={14} />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* ─── LOW STOCK ALERTS — display only, clears automatically after Excel import restocks ─── */}
      {lowStockMedicines.length > 0 && (
        <div className="bg-gradient-to-r from-red-50/70 to-amber-50/70 border-l-4 border-red-500 rounded-r-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-red-900">
              <AlertTriangle className="text-red-500 animate-bounce flex-shrink-0" size={18} />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Low Stock Alerts</h3>
                <p className="text-[10px] text-slate-500">
                  The following medicines are below their threshold ({defaultThreshold} units). Import an updated Excel sheet to restock — this alert will disappear automatically.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
              {lowStockMedicines.length} Items Low
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lowStockMedicines.map(med => {
              const itemThreshold = med.minThreshold ?? defaultThreshold;
              const isCritical = med.qty < 20;
              const isOutOfStock = med.qty <= 0;
              return (
                <div key={med.id} className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]" title={med.name}>
                      {med.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                      isOutOfStock ? 'bg-red-100 text-red-700'
                        : isCritical ? 'bg-orange-50 text-orange-700 border border-orange-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {isOutOfStock ? 'Empty' : isCritical ? 'Critical' : 'Low'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                    <span>Available Stock:</span>
                    <span className="font-mono font-bold text-slate-800">{med.qty} units</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                    <span>Min Threshold:</span>
                    <span className="font-mono">{itemThreshold} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-150">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1A4A7A] flex items-center justify-center mb-3"><Pill size={18} /></div>
          <div className="text-2xl font-bold text-slate-800">{totalMedicinesCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Medicines Types</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-2.5">↑ Active database list</div>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-150">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3"><ClipboardList size={18} /></div>
          <div className="text-2xl font-bold text-slate-800">{pendingRequestsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Pending Dispensing</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-2.5">Awaiting pharmacy verification</div>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-150">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-[#B91C1C] flex items-center justify-center mb-3"><AlertTriangle size={18} /></div>
          <div className="text-2xl font-bold text-[#B91C1C]">{lowStockMedicines.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Low Stock Alerts</div>
          <div className="text-[10px] text-red-600 font-semibold mt-2.5">{criticalCount} critical items below threshold</div>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-150">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0D7E5A] flex items-center justify-center mb-3"><CheckCircle size={18} /></div>
          <div className="text-2xl font-bold text-slate-800">{completedTodayCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Issued Prescriptions</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-2.5">Patients successfully served today</div>
        </div>
      </div>

      {/* Grid: Left and Right Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Patient Requests</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Clinic activity log today</p>
            </div>
            <button onClick={() => setTab('patients')} className="btn btn-xs font-semibold cursor-pointer flex items-center gap-1">
              <span>View All Registry</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Token</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name / No</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meds</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentPrescriptions.map((p: Prescription, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition duration-100">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">{p.token}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-800">{p.patientName || 'Unregistered / Walk-in'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.patientNo}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600">
                      {p.medicines.length} medicine{p.medicines.length > 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                      LKR {p.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : p.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-100'
                          : 'bg-red-50 text-red-800 border border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentPrescriptions.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">No recent requests recorded.</div>
          )}
        </div>

        {/* Low Stock Tracker */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Low Stock Medicines</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Requires attention</p>
            </div>
            <button onClick={() => setTab('stock')} className="text-sky-600 font-semibold text-xs hover:text-sky-700 hover:underline cursor-pointer">
              Manage
            </button>
          </div>
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-56 pr-1">
            {displayedLowStock.map((m, idx) => {
              const capMax = 200;
              const pct = Math.min(100, Math.round((m.qty / capMax) * 100));
              const barColor = m.qty < 20 ? 'bg-red-500' : 'bg-amber-500';
              const textBadge = m.qty < 20 ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50';
              return (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-slate-800 truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">{m.qty} / {capMax} units left</div>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${textBadge}`}>
                    {m.qty < 20 ? 'Critical' : 'Low'}
                  </span>
                </div>
              );
            })}
            {displayedLowStock.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">All medicines have healthy stock levels.</div>
            )}
          </div>
          {/* Daily Issuances Micro Chart */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">Daily Issuances — June 2026</h4>
            <div className="flex items-end gap-[2px] h-20 pt-2 px-1">
              {bars.map((val, idx) => {
                const heightPct = Math.round((val / maxV) * 100);
                const isLast = idx === bars.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t-sm cursor-pointer transition-all duration-150 ${isLast ? 'bg-sky-600 hover:opacity-90' : 'bg-sky-200 hover:bg-sky-300'}`}
                    style={{ height: `${heightPct}%` }}
                    title={`Day ${idx + 1}: ${val} issued`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[8.5px] font-semibold text-slate-400 mt-1.5 px-0.5">
              <span>Jun 1</span><span>Jun 14</span><span>Jun 28</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent System Activity */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
          Recent System Activity
        </h3>
        <div className="mt-4 space-y-4">
          {displayedLogs.map((log, idx) => (
            <div key={idx} className="flex gap-4 items-start text-xs text-left">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium ${getTimelineMarkerStyles(log.type)}`}>
                {log.type === 'Import' && <FileUp size={14} />}
                {log.type === 'Issued' && <CheckCircle size={14} />}
                {log.type === 'Alert' && <AlertTriangle size={14} />}
                {log.type === 'Request' && <ClipboardList size={14} />}
                {!['Import', 'Issued', 'Alert', 'Request'].includes(log.type) && <Clock size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 leading-relaxed font-medium">{log.detail}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {log.time} &nbsp;·&nbsp; {log.user} &nbsp;·&nbsp; {log.reference}
                </span>
              </div>
            </div>
          ))}
          {displayedLogs.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-400">No activity recorded yet.</div>
          )}
        </div>
      </div>

    </div>
  );
};
