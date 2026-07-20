import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Medicine } from '../types';
import { Package, Search, Edit3, ShieldAlert, Sparkles, Check, ChevronDown } from 'lucide-react';

export const StockOverview: React.FC = () => {
  const { medicines, updateMedicine, pharmacyInfo } = useAppState();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');

  // Editing state
  const [editingUid, setEditingUid] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editThreshold, setEditThreshold] = useState(50);

  // Stats
  const totalMedCount = medicines.length;
  const criticalCount = medicines.filter(m => m.qty < 20).length;
  const lowCount = medicines.filter(m => m.qty >= 20 && m.qty < (m.minThreshold ?? 50)).length;
  const healthyCount = medicines.filter(m => m.qty >= (m.minThreshold ?? 50)).length;

  // Filter
  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    
    let matchesLevel = true;
    if (filterLevel === 'Critical') {
      matchesLevel = m.qty < 20;
    } else if (filterLevel === 'Low') {
      matchesLevel = m.qty >= 20 && m.qty < (m.minThreshold ?? 50);
    } else if (filterLevel === 'Healthy') {
      matchesLevel = m.qty >= (m.minThreshold ?? 50);
    }

    return matchesSearch && matchesLevel;
  });

  const handleOpenEdit = (m: Medicine) => {
    setEditingUid(m._uid);
    setEditQty(m.qty);
    setEditThreshold(m.minThreshold ?? 50);
  };

  const handleSave = (uid: number) => {
    updateMedicine(uid, {
      qty: Number(editQty),
      minThreshold: Number(editThreshold),
    });
    setEditingUid(null);
  };

  const getStockFillColor = (qty: number, threshold = 50) => {
    if (qty < 20) return 'bg-red-500';
    if (qty < threshold) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStockTextColor = (qty: number, threshold = 50) => {
    if (qty < 20) return 'text-red-600 font-bold';
    if (qty < threshold) return 'text-amber-600 font-bold';
    return 'text-emerald-600 font-bold';
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Real-time Stock Overview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track and modify drug counts, adjust alert thresholds, and monitor low stock warnings instantly.
          </p>
        </div>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Package size={16} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{totalMedCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Medicine Catalog</div>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Check size={16} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{healthyCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Healthy Stocks</div>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">{lowCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Low Stocks</div>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <ShieldAlert size={16} className="text-red-500 animate-bounce" />
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{criticalCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Critical Shortages</div>
          </div>
        </div>
      </div>

      {/* Low stock reminder block */}
      {criticalCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 font-medium">
          <ShieldAlert size={18} className="text-red-600 flex-shrink-0" />
          <span>
            <strong>Attention:</strong> {criticalCount} medicines have fallen below critical stock level (20 units). Order replenishment from suppliers immediately.
          </span>
        </div>
      )}

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full relative">
            <Search size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter stock by name or drug ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2.5 pl-9 pr-4 text-xs text-slate-800 focus:outline-none rounded-lg"
            />
          </div>

          <div className="w-full sm:w-44 flex-shrink-0">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 py-2.5 px-3 focus:outline-none rounded-lg cursor-pointer"
            >
              <option value="All">All Stock Levels</option>
              <option value="Healthy">Healthy Stock</option>
              <option value="Low">Low Stock</option>
              <option value="Critical">Critical Shortage</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Medicine Name</th>
                <th className="px-5 py-3">Current Stock</th>
                <th className="px-5 py-3">Min Threshold</th>
                <th className="px-5 py-3">Stock Bar</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map(m => {
                const threshold = m.minThreshold ?? 50;
                const isEditing = editingUid === m._uid;
                const barColor = getStockFillColor(m.qty, threshold);
                const textColor = getStockTextColor(m.qty, threshold);
                const fillPct = Math.min(100, Math.round((m.qty / 200) * 100));

                return (
                  <tr key={m._uid} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {m.id}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800 text-sm">
                      {m.name}
                    </td>
                    
                    {/* Current Stock Input / Label */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editQty}
                          onChange={(e) => setEditQty(Number(e.target.value))}
                          className="w-20 bg-slate-50 border border-sky-500 text-center font-bold text-xs py-1.5 rounded focus:outline-none"
                        />
                      ) : (
                        <span className={`text-sm ${textColor}`}>{m.qty} <span className="text-slate-400 font-normal">units</span></span>
                      )}
                    </td>

                    {/* Threshold Input / Label */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-sky-500 text-center font-bold text-xs py-1.5 rounded focus:outline-none"
                        />
                      ) : (
                        <span>{threshold} units</span>
                      )}
                    </td>

                    {/* Stock Fill Indicator Bar */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full ${barColor}`} style={{ width: `${fillPct}%` }} />
                        </div>
                        <span className="text-slate-400 font-mono font-semibold">{fillPct}%</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {m.supplier}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        m.qty < 20
                          ? 'bg-red-50 text-red-700'
                          : m.qty < threshold
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {m.qty < 20 ? 'Critical' : m.qty < threshold ? 'Low Stock' : 'Good Stock'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleSave(m._uid)}
                            className="btn btn-xs btn-success font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUid(null)}
                            className="btn btn-xs bg-white text-slate-500 border border-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="btn btn-xs flex items-center gap-1 font-semibold"
                        >
                          <Edit3 size={11} />
                          <span>Adjust Stock</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                    No matching stock items in catalog.
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
