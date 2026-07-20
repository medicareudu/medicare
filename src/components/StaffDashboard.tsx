import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Clock, CheckCircle, AlertCircle, Scan, ArrowRight, UserCheck, Eye } from 'lucide-react';

interface StaffDashboardProps {
  onVerifyWithToken: (token: string) => void;
  isAdminViewing?: boolean;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onVerifyWithToken, isAdminViewing = false }) => {
  const { prescriptions, setTab } = useAppState();
  const [tokenSearch, setTokenSearch] = useState('');

  // ─── Real-time Statistics Calculation ───
  const pendingRequests = prescriptions.filter(p => p.status === 'Pending');
  const completedToday = prescriptions.filter(p => p.status === 'Completed');
  const overdueCount = prescriptions.filter(p => p.status === 'Overdue').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenSearch.trim()) return;
    onVerifyWithToken(tokenSearch.trim().toUpperCase());
  };

  const handleQuickDispense = (token: string) => {
    onVerifyWithToken(token);
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Admin View-Only Banner */}
      {isAdminViewing && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <Eye size={18} className="flex-shrink-0 text-amber-500" />
          <div>
            <span className="font-bold text-sm">Admin View-Only Mode</span>
            <p className="text-xs mt-0.5 text-amber-700">You are viewing the Staff Dashboard as an administrator. Medicine dispensing actions are restricted to staff only.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Staff Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; {pendingRequests.length} pending medicine request{pendingRequests.length !== 1 ? 's' : ''} awaiting issue.
          </p>
        </div>
        <button
          onClick={() => setTab('verify')}
          className="btn btn-primary font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Scan size={14} />
          <span>Verify Token</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{pendingRequests.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Waiting for Dispensing</div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{completedToday.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Completed Requests</div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
            <AlertCircle size={18} />
          </div>
          <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Overdue Requests (&gt;1 hr)</div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <UserCheck size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            12<span className="text-xs font-normal text-slate-400"> min</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Avg Patient Wait Time</div>
        </div>
      </div>

      {/* Quick Search Panel */}
      <form onSubmit={handleSearchSubmit} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Scan size={18} />
            </div>
            <input
              type="text"
              placeholder="Enter token number — e.g. TKN-00132"
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 text-slate-800 font-mono font-medium rounded-lg py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all duration-150 text-sm tracking-wide"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary h-auto py-3.5 px-6 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/10"
          >
            <span>Verify Token</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Pending Queue List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pending Medicine Requests</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Admin-created requests — verify token to issue medicines</p>
          </div>
          {overdueCount > 0 && (
            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold animate-pulse">
              {overdueCount} Overdue Alerts
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Token</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Request Details</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Medicines</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Requested By</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pendingRequests.map((p) => {
                const isOverdue = p.status === 'Overdue';
                const statusLabel = isOverdue ? 'Overdue' : 'Pending';
                const badgeStyle = isOverdue
                  ? 'bg-red-50 text-red-700 border border-red-100 font-bold'
                  : 'bg-amber-50 text-amber-700 border border-amber-100 font-bold';

                const tests = p.additionalCharges?.filter(c => c.checked).map(c => c.name).join(', ');

                return (
                  <tr key={p.token} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {p.token}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{p.patientName || 'Medicine request'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{p.patientNo}</div>
                      {tests && (
                        <div className="text-[10px] text-sky-600 mt-1">Tests: {tests}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {p.medicines.length} medicine{p.medicines.length > 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {p.doctor}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                      {p.date}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${badgeStyle}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleQuickDispense(p.token)}
                        className="btn btn-xs btn-success font-bold"
                      >
                        Verify & Issue
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    No pending requests. Admin will create new medicine requests here.
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
