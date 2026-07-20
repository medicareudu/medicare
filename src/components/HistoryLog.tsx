import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { HistoryItem } from '../types';
import { Search, Trash2, Calendar, FileText, Download, RefreshCw } from 'lucide-react';

export const HistoryLog: React.FC = () => {
  const { history, clearHistory } = useAppState();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredLogs = history.filter(item => {
    const matchesSearch =
      item.reference.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase()) ||
      item.user.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'All' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const getLogTypeBadge = (type: HistoryItem['type']) => {
    switch (type) {
      case 'Import':
        return 'bg-blue-50 text-blue-700 border border-blue-100 font-bold';
      case 'Request':
        return 'bg-sky-50 text-sky-700 border border-sky-100 font-bold';
      case 'Issued':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold';
      case 'Alert':
        return 'bg-red-50 text-red-700 border border-red-100 font-bold';
      case 'Stock':
        return 'bg-purple-50 text-purple-700 border border-purple-100 font-bold';
      case 'Settings':
        return 'bg-slate-100 text-slate-700 border border-slate-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-100';
    }
  };

  const handleExport = () => {
    const headers = 'ID,Timestamp,Type,Reference,Detail,User\n';
    const csvContent = history.map(h => 
      `"${h.id}","${h.time}","${h.type}","${h.reference}","${h.detail.replace(/"/g, '""')}","${h.user}"`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medicare_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Audit & History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse complete clinic audit logs & security actions, automatically recorded and encrypted.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleExport}
            className="btn font-semibold border-slate-200 hover:border-slate-300 cursor-pointer"
          >
            <Download size={14} className="text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to completely wipe all historical logs? This action is irreversible for compliance.')) {
                await clearHistory();
              }
            }}
            className="btn btn-danger-outline font-semibold cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <Search size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by action description, reference key, or acting user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2.5 pl-9 pr-4 text-xs text-slate-800 focus:outline-none rounded-lg"
          />
        </div>

        {/* Action filter */}
        <div className="w-full sm:w-44 flex-shrink-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 py-2.5 px-3 focus:outline-none rounded-lg cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Import">Excel Imports</option>
            <option value="Request">Prescriptions</option>
            <option value="Issued">Dispensing</option>
            <option value="Alert">Stock Alerts</option>
            <option value="Stock">Stock Manual</option>
            <option value="Staff">Staff Management</option>
            <option value="Supplier">Supplier Management</option>
            <option value="Settings">System Config</option>
          </select>
        </div>
      </div>

      {/* History table list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Log ID</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Reference Key</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">User Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-400">
                    {item.id}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                    {item.time}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] tracking-wide ${getLogTypeBadge(item.type)}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                    {item.reference}
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium max-w-sm">
                    {item.detail}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-semibold">
                    {item.user}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No matching audit log items found.
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
