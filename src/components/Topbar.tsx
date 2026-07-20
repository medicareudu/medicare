import React, { useState, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { Search, Bell, Settings, ChevronRight, AlertTriangle, X } from 'lucide-react';

interface TopbarProps {
  onVerifyWithToken?: (token: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onVerifyWithToken }) => {
  const { currentUser, currentTab, setTab, notifications, prescriptions } = useAppState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  // Breadcrumb title helper
  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard';
      case 'medicines': return 'Medicine Management';
      case 'request': return 'New Medicine Request';
      case 'stock': return 'Stock Overview';
      case 'patients': return 'Patients Log';
      case 'suppliers': return 'Suppliers Directory';
      case 'history': return 'System History Logs';
      case 'reports': return 'Operational Analytics & Reports';
      case 'settings': return 'Admin Settings';
      case 'verify': return 'Verify Token & Dispense';
      default: return 'Overview';
    }
  };

  const activeRoleName = currentUser.role === 'Admin' ? 'Administrator' : 'Pharmacy Staff';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;

    // Search by token or patient ID (patientNo)
    const found = prescriptions.find(
      pr => pr.token.toUpperCase() === q || pr.patientNo?.toUpperCase() === q
    );

    if (found) {
      setSearchError(false);
      setSearchQuery('');
      if (currentUser.role === 'Staff' && onVerifyWithToken) {
        onVerifyWithToken(found.token);
      } else {
        // Admin: go to Patients Log to view the record
        setTab('patients');
      }
    } else {
      setSearchError(true);
      setTimeout(() => setSearchError(false), 2000);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm relative z-20 flex-shrink-0 select-none">
      {/* Breadcrumb Path */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">MediCare</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-400 font-medium">{activeRoleName}</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{getBreadcrumbTitle()}</span>
      </div>

      {/* Action Panels */}
      <div className="flex items-center gap-4">
        {/* Functional Search Bar */}
        <form
          onSubmit={handleSearch}
          className={`hidden md:flex items-center gap-2 border rounded-full px-4 py-1.5 w-64 focus-within:border-sky-500 transition-all duration-150 ${
            searchError
              ? 'bg-red-50 border-red-300'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <Search size={14} className={searchError ? 'text-red-400 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchError(false); }}
            placeholder={searchError ? 'Not found — try again' : 'Search Token # or Patient ID...'}
            className={`bg-transparent text-xs w-full focus:outline-none ${
              searchError ? 'placeholder-red-400 text-red-700' : 'placeholder-slate-400 text-slate-800'
            }`}
          />
        </form>

        {/* Low-stock alerts */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer transition duration-150 relative outline-none ${
              notifications.length > 0 ? 'text-[#B91C1C]' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all duration-150">
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-[#B45309]" />
                  Stock Alerts ({notifications.length})
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    All medicines are properly stocked! No active warnings.
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition duration-100 text-left">
                      <p className="text-[11px] leading-relaxed text-slate-700">{notif}</p>
                    </div>
                  ))
                )}
              </div>
              {currentUser.role === 'Admin' && (
                <div className="p-2 border-t border-slate-50 text-center bg-slate-50">
                  <button
                    onClick={() => {
                      setTab('stock');
                      setShowNotifications(false);
                    }}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    Manage Inventory Stock
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Shortcut Button */}
        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setTab('settings')}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600 transition duration-150 outline-none"
            title="System Settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
