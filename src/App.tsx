import React, { useState, useEffect } from 'react';
import { StateProvider, useAppState } from './context/StateContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { MedicineManagement } from './components/MedicineManagement';
import { NewRequest } from './components/NewRequest';
import { StockOverview } from './components/StockOverview';
import { PatientsLog } from './components/PatientsLog';
import { Suppliers } from './components/Suppliers';
import { HistoryLog } from './components/HistoryLog';
import { Reports } from './components/Reports';
import { SettingsComponent } from './components/Settings';
import { VerifyToken } from './components/VerifyToken';
import { AccessDenied } from './components/AccessDenied';
import { IncomeLedger } from './components/IncomeLedger';
import { LogOut } from 'lucide-react';

const ADMIN_TABS = new Set(['dashboard', 'staffdashboard', 'medicines', 'request', 'stock', 'patients', 'suppliers', 'history', 'reports', 'income', 'settings', 'verify']);
const STAFF_TABS = new Set(['dashboard', 'verify']);

const AppContent: React.FC = () => {
  const { currentUser, currentTab, setTab, logout, isInitialized, isLoading } = useAppState();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedVerifyToken, setSelectedVerifyToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!currentUser) return;
    const allowed = currentUser.role === 'Admin' ? ADMIN_TABS : STAFF_TABS;
    if (!allowed.has(currentTab)) {
      setTab('dashboard');
    }
  }, [currentUser, currentTab, setTab]);

  const handleVerifyWithToken = (token: string) => {
    setSelectedVerifyToken(token);
    setTab('verify');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium">Connecting to server...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium">Loading data...</div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'Admin';
  const isStaff = currentUser.role === 'Staff';

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return isAdmin ? <AdminDashboard /> : <StaffDashboard onVerifyWithToken={handleVerifyWithToken} />;
      case 'staffdashboard':
        return isAdmin ? <StaffDashboard onVerifyWithToken={handleVerifyWithToken} isAdminViewing={true} /> : <AccessDenied message="Access denied." />;
      case 'medicines':
        return isAdmin ? <MedicineManagement /> : <AccessDenied message="Only Admin can manage medicines and import Excel files." />;
      case 'request':
        return isAdmin ? <NewRequest /> : <AccessDenied message="Only Admin can create medicine requests." />;
      case 'stock':
        return isAdmin ? <StockOverview /> : <AccessDenied message="Only Admin can view stock overview." />;
      case 'patients':
        return isAdmin ? <PatientsLog /> : <AccessDenied message="Only Admin can access the full request log." />;
      case 'suppliers':
        return isAdmin ? <Suppliers /> : <AccessDenied message="Only Admin can manage suppliers." />;
      case 'history':
        return <HistoryLog />;
      case 'reports':
        return isAdmin ? <Reports /> : <AccessDenied message="Only Admin can view reports." />;
      case 'income':
        return isAdmin ? <IncomeLedger /> : <AccessDenied message="Only Admin can access the Income Ledger." />;
      case 'settings':
        return isAdmin ? <SettingsComponent /> : <AccessDenied message="Only Admin can change system settings." />;
      case 'verify':
        return isStaff || isAdmin ? (
          <VerifyToken initialToken={selectedVerifyToken} onClearInitialToken={() => setSelectedVerifyToken(undefined)} />
        ) : (
          <AccessDenied message="Medicine issuing is performed by Staff. Log in as staff to verify tokens." />
        );
      default:
        return <div className="p-8 text-center text-slate-400 font-semibold text-xs">Screen under development...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#F2F5F9] font-sans antialiased overflow-hidden select-none">
      <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onVerifyWithToken={handleVerifyWithToken} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F2F5F9]">
          <div className="max-w-7xl mx-auto">{renderActiveScreen()}</div>
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <LogOut size={20} className="transform rotate-180" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">Logout</h4>
              <p className="text-xs text-slate-500 font-medium">Are you sure you want to logout?</p>
            </div>
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logout();
                }}
                className="w-full py-2.5 bg-[#D32F2F] hover:bg-[#C62828] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer outline-none transition"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer outline-none transition border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StateProvider>
      <AppContent />
    </StateProvider>
  );
}
