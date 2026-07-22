import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medicine, Supplier, Staff, Prescription, HistoryItem, PharmacyInfo, PharmacyBranch, ServiceFee } from '../types';
import {
  DEFAULT_MEDICINES,
  DEFAULT_SUPPLIERS,
  DEFAULT_STAFF,
  DEFAULT_PHARMACY_INFO,
  DEFAULT_PRESCRIPTIONS,
  DEFAULT_HISTORY,
  DEFAULT_BRANCHES,
  DEFAULT_SERVICE_FEES,
  loadState,
  saveState,
} from '../data';
import axios from 'axios';
import {
  authApi,
  dataApi,
  medicinesApi,
  suppliersApi,
  staffApi,
  prescriptionsApi,
  historyApi,
  settingsApi,
  getErrorMessage,
} from '../api/client';

interface StateContextType {
  medicines: Medicine[];
  suppliers: Supplier[];
  staff: Staff[];
  pharmacyInfo: PharmacyInfo;
  branches: PharmacyBranch[];
  prescriptions: Prescription[];
  history: HistoryItem[];
  currentUser: Staff | null;
  currentTab: string;
  notifications: string[];
  serviceFees: ServiceFee[];
  isLoading: boolean;
  isInitialized: boolean;
  apiError: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  setTab: (tab: string) => void;

  addMedicine: (med: Omit<Medicine, '_uid'>) => Promise<void>;
  updateMedicine: (uid: number, med: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (uid: number) => Promise<void>;
  importMedicines: (imported: Array<Omit<Medicine, '_uid'> & { action?: 'update' | 'skip' }>) => Promise<{ addCount: number; updateCount: number; skipCount: number; totalImported: number }>;

  addSupplier: (sup: Supplier) => Promise<void>;
  updateSupplier: (id: string, sup: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addStaff: (stf: Staff) => Promise<void>;
  updateStaff: (id: string, stf: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  addBranch: (b: PharmacyBranch) => Promise<void>;
  updateBranch: (id: string, b: Partial<PharmacyBranch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;

  addServiceFee: (fee: Omit<ServiceFee, 'id'>) => Promise<void>;
  updateServiceFee: (id: string, fee: Partial<ServiceFee>) => Promise<void>;
  deleteServiceFee: (id: string) => Promise<void>;

  addPrescription: (p: Omit<Prescription, 'token'>) => Promise<string>;
  dispensePrescription: (token: string, staffName: string) => Promise<Prescription | null>;
  updatePrescriptionStatus: (token: string, status: 'Pending' | 'Completed' | 'Overdue') => Promise<void>;

  updatePharmacyInfo: (info: Partial<PharmacyInfo>) => Promise<void>;

  addHistoryLog: (type: HistoryItem['type'], reference: string, detail: string, user?: string) => void;
  clearHistory: () => Promise<void>;
  restoreState: (data: Record<string, unknown>) => void;
  refreshData: () => Promise<void>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>(DEFAULT_MEDICINES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [staff, setStaff] = useState<Staff[]>(DEFAULT_STAFF);
  const [pharmacyInfo, setPharmacyInfo] = useState<PharmacyInfo>(DEFAULT_PHARMACY_INFO);
  const [branches, setBranches] = useState<PharmacyBranch[]>(DEFAULT_BRANCHES);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(DEFAULT_PRESCRIPTIONS);
  const [history, setHistory] = useState<HistoryItem[]>(DEFAULT_HISTORY);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [currentTab, setCurrentTab] = useState<string>(() => loadState('current_tab', 'dashboard'));
  const [notifications, setNotifications] = useState<string[]>([]);
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>(DEFAULT_SERVICE_FEES);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => { saveState('current_tab', currentTab); }, [currentTab]);

  const applyAppData = useCallback((data: Awaited<ReturnType<typeof dataApi.getAll>>) => {
    setMedicines(data.medicines);
    setSuppliers(data.suppliers);
    setStaff(data.staff);
    if (data.pharmacyInfo) setPharmacyInfo(data.pharmacyInfo);
    setBranches(data.branches);
    setPrescriptions(data.prescriptions as Prescription[]);
    setHistory(data.history);
    setServiceFees(data.serviceFees);
  }, []);

  const refreshData = useCallback(async () => {
    const data = await dataApi.getAll();
    applyAppData(data);
  }, [applyAppData]);

  const refreshHistory = useCallback(async () => {
    const data = await dataApi.getAll();
    setHistory(data.history);
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const user = await authApi.me();
        setCurrentUser(user);
        await refreshData();
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    init();
  }, [refreshData]);

  useEffect(() => {
    if (pharmacyInfo.systemAlerts === false) {
      setNotifications([]);
      return;
    }
    const alerts: string[] = [];
    medicines.forEach(med => {
      const threshold = med.minThreshold ?? pharmacyInfo.lowStockThreshold ?? 50;
      if (med.qty <= 0) {
        alerts.push(`CRITICAL: ${med.name} is completely OUT OF STOCK (0 units remaining).`);
      } else if (med.qty < 20) {
        alerts.push(`CRITICAL: ${med.name} stock level is extremely low (${med.qty} units remaining).`);
      } else if (med.qty < threshold) {
        alerts.push(`Warning: ${med.name} stock level is low (${med.qty} units remaining, threshold is ${threshold}).`);
      }
    });
    setNotifications(alerts);
  }, [medicines, pharmacyInfo]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setApiError(null);
    try {
      const user = await authApi.login(username, password);
      setCurrentUser(user);
      await refreshData();
      setCurrentTab('dashboard');
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
      setApiError(msg.includes('Network') || msg.includes('ECONNREFUSED') || msg.includes('404')
        ? 'Cannot connect to server. Start the backend with: cd backend && npm run dev'
        : msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setCurrentUser(null);
  };

  const setTab = (tab: string) => setCurrentTab(tab);

  const addHistoryLog = (_type: HistoryItem['type'], _reference: string, _detail: string, _user?: string) => {
    // History is managed server-side; refresh after mutations
  };

  const addMedicine = async (med: Omit<Medicine, '_uid'>) => {
    const result = await medicinesApi.create(med);
    setMedicines(prev => {
      const exists = prev.some(m => m._uid === result._uid);
      if (exists) {
        return prev.map(m => m._uid === result._uid ? result : m);
      }
      return [...prev, result];
    });
    await refreshHistory();
  };

  const updateMedicine = async (uid: number, medUpdates: Partial<Medicine>) => {
    const updated = await medicinesApi.update(uid, medUpdates);
    setMedicines(prev => prev.map(m => m._uid === uid ? updated : m));
    await refreshHistory();
  };

  const deleteMedicine = async (uid: number) => {
    await medicinesApi.delete(uid);
    setMedicines(prev => prev.filter(m => m._uid !== uid));
    await refreshHistory();
  };

  const importMedicines = async (imported: Array<Omit<Medicine, '_uid'> & { action?: 'update' | 'skip' }>) => {
    const result = await medicinesApi.import(imported);
    setMedicines(result.medicines);
    await refreshHistory();
    return { addCount: result.addCount, updateCount: result.updateCount, skipCount: result.skipCount, totalImported: result.totalImported };
  };

  const addSupplier = async (sup: Supplier) => {
    const created = await suppliersApi.create(sup);
    setSuppliers(prev => [...prev, created]);
    await refreshHistory();
  };

  const updateSupplier = async (id: string, supUpdates: Partial<Supplier>) => {
    const updated = await suppliersApi.update(id, supUpdates);
    setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
    await refreshHistory();
  };

  const deleteSupplier = async (id: string) => {
    await suppliersApi.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    await refreshHistory();
  };

  const addStaff = async (stf: Staff) => {
    const created = await staffApi.create(stf);
    setStaff(prev => [...prev, created]);
    await refreshHistory();
  };

  const updateStaff = async (id: string, stfUpdates: Partial<Staff>) => {
    const updated = await staffApi.update(id, stfUpdates);
    setStaff(prev => prev.map(s => s.id === id ? updated : s));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
    await refreshHistory();
  };

  const deleteStaff = async (id: string) => {
    await staffApi.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
    await refreshHistory();
  };

  const addPrescription = async (p: Omit<Prescription, 'token'>): Promise<string> => {
    const created = await prescriptionsApi.create(p);
    setPrescriptions(prev => [created, ...prev]);
    await refreshHistory();
    return created.token;
  };

  const dispensePrescription = async (token: string, _staffName: string): Promise<Prescription | null> => {
    try {
      const updated = await prescriptionsApi.dispense(token);
      setPrescriptions(prev => prev.map(pr => pr.token === token ? updated : pr));
      const data = await dataApi.getAll();
      setMedicines(data.medicines);
      setHistory(data.history);
      return updated;
    } catch {
      return null;
    }
  };

  const updatePrescriptionStatus = async (token: string, status: 'Pending' | 'Completed' | 'Overdue') => {
    const updated = await prescriptionsApi.updateStatus(token, status);
    setPrescriptions(prev => prev.map(pr => pr.token === token ? updated : pr));
  };

  const updatePharmacyInfo = async (infoUpdates: Partial<PharmacyInfo>) => {
    const updated = await settingsApi.updatePharmacy(infoUpdates);
    setPharmacyInfo(updated);
    await refreshHistory();
  };

  const addBranch = async (b: PharmacyBranch) => {
    const created = await settingsApi.createBranch(b);
    setBranches(prev => [...prev, created]);
    await refreshHistory();
  };

  const updateBranch = async (id: string, branchUpdates: Partial<PharmacyBranch>) => {
    const updated = await settingsApi.updateBranch(id, branchUpdates);
    setBranches(prev => prev.map(b => b.id === id ? updated : b));
    await refreshHistory();
  };

  const deleteBranch = async (id: string) => {
    await settingsApi.deleteBranch(id);
    setBranches(prev => prev.filter(b => b.id !== id));
    await refreshHistory();
  };

  const addServiceFee = async (fee: Omit<ServiceFee, 'id'>) => {
    const created = await settingsApi.createServiceFee(fee);
    setServiceFees(prev => [...prev, created]);
    await refreshHistory();
  };

  const updateServiceFee = async (id: string, feeUpdates: Partial<ServiceFee>) => {
    const updated = await settingsApi.updateServiceFee(id, feeUpdates);
    setServiceFees(prev => prev.map(f => f.id === id ? updated : f));
    await refreshHistory();
  };

  const deleteServiceFee = async (id: string) => {
    await settingsApi.deleteServiceFee(id);
    setServiceFees(prev => prev.filter(f => f.id !== id));
    await refreshHistory();
  };

  const clearHistory = async () => {
    await historyApi.clear();
    await refreshHistory();
  };

  const restoreState = (data: Record<string, unknown>) => {
    if (data.medicines) setMedicines(data.medicines as Medicine[]);
    if (data.suppliers) setSuppliers(data.suppliers as Supplier[]);
    if (data.staff) setStaff(data.staff as Staff[]);
    if (data.pharmacyInfo) setPharmacyInfo(data.pharmacyInfo as PharmacyInfo);
    if (data.branches) setBranches(data.branches as PharmacyBranch[]);
    if (data.prescriptions) setPrescriptions(data.prescriptions as Prescription[]);
    if (data.history) setHistory(data.history as HistoryItem[]);
    if (data.serviceFees) setServiceFees(data.serviceFees as ServiceFee[]);
  };

  return (
    <StateContext.Provider value={{
      medicines,
      suppliers,
      staff,
      pharmacyInfo,
      branches,
      prescriptions,
      history,
      currentUser,
      currentTab,
      notifications,
      serviceFees,
      isLoading,
      isInitialized,
      apiError,
      login,
      logout,
      setTab,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      importMedicines,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addStaff,
      updateStaff,
      deleteStaff,
      addBranch,
      updateBranch,
      deleteBranch,
      addServiceFee,
      updateServiceFee,
      deleteServiceFee,
      addPrescription,
      dispensePrescription,
      updatePrescriptionStatus,
      updatePharmacyInfo,
      addHistoryLog,
      clearHistory,
      restoreState,
      refreshData,
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};
