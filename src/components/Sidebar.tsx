import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import {
  LayoutDashboard,
  Pill,
  FilePlus,
  Receipt,
  Package,
  History,
  TrendingUp,
  FileUp,
  UserSearch,
  Truck,
  Settings,
  ScanLine,
  User,
  Banknote,
  LogOut,
  ShoppingBag
} from 'lucide-react';

interface SidebarProps {
  onLogoutClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogoutClick }) => {
  const { currentUser, currentTab, setTab, prescriptions, medicines } = useAppState();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Count pending prescriptions for Staff Badge
  const pendingStaffCount = prescriptions.filter(p => p.status === 'Pending').length;

  // Count critical stock levels for Admin Stock Badge
  const criticalStockCount = medicines.filter(m => m.qty <= (m.minThreshold ?? 50)).length;

  const navAdmin = [
    {
      section: 'Overview',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
        { id: 'staffdashboard', icon: User, label: 'Staff Dashboard', badge: null },
        { id: 'medicines', icon: Pill, label: 'Medicines', badge: null },
      ]
    },
    {
      section: 'Workflow',
      items: [
        { id: 'request', icon: FilePlus, label: 'Medicine Request', badge: null },
        { id: 'directsale', icon: ShoppingBag, label: 'Direct Purchase', badge: null },
      ]
    },
    {
      section: 'Management',
      items: [
        { id: 'stock', icon: Package, label: 'Stock Overview', badge: criticalStockCount > 0 ? `${criticalStockCount}` : null, badgeType: 'red' },
        { id: 'patients', icon: UserSearch, label: 'Request Log', badge: null },
        { id: 'suppliers', icon: Truck, label: 'Suppliers', badge: null },
        { id: 'history', icon: History, label: 'System History', badge: null },
        { id: 'reports', icon: TrendingUp, label: 'Reports', badge: null },
        { id: 'income', icon: Banknote, label: 'Income Ledger', badge: null },
        { id: 'settings', icon: Settings, label: 'Settings', badge: null },
      ]
    }
  ];

  const navStaff = [
    {
      section: 'Pharmacy Staff',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: pendingStaffCount > 0 ? `${pendingStaffCount}` : null, badgeType: 'amber' },
        { id: 'directsale', icon: ShoppingBag, label: 'Direct Purchase', badge: null },
        { id: 'verify', icon: ScanLine, label: 'Verify & Issue', badge: null },
      ]
    }
  ];

  const activeNav = role === 'Admin' ? navAdmin : navStaff;
  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0 border-r border-slate-800 shadow-xl select-none z-10 text-white">
      {/* Brand Logo Header (Perfect match with Professional Polish Design) */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-md shadow-sky-500/20">
          M
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          MediCare <span className="text-sky-400 font-light">Pro</span>
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {activeNav.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1 px-3">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              {section.section}
            </div>
            {section.items.map(item => {
              const isActive = currentTab === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-semibold transition-all duration-150 relative text-left outline-none ${
                    isActive
                      ? 'bg-white/10 text-white border-l-4 border-sky-400 nav-active'
                      : 'text-slate-400 hover:bg-[#f8fafc20] hover:text-white sidebar-link'
                  }`}
                >
                  <IconComp size={16} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-sky-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User & Connected Status Footer */}
      <div className="flex flex-col bg-slate-950 border-t border-slate-800 divide-y divide-slate-800/40">
        {/* User Profile */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-400">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentUser.role === 'Admin' ? 'System Administrator' : 'Pharmacy Staff'}
            </div>
          </div>
          <button
            onClick={onLogoutClick}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition duration-150 outline-none"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </aside>
  );
};
