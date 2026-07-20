import { Medicine, Supplier, Staff, Prescription, HistoryItem, PharmacyInfo, PharmacyBranch } from './types';

export const DEFAULT_MEDICINES: Medicine[] = [];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'PharmaCo', contactPerson: 'Saman Kumara', phone: '077-1234567', email: 'saman@pharmaco.com', status: 'Active' },
  { id: 'SUP-002', name: 'MediSupply', contactPerson: 'Anura Bandara', phone: '071-7654321', email: 'anura@medisupply.lk', status: 'Active' },
  { id: 'SUP-003', name: 'MedPlus', contactPerson: 'Nisha Perera', phone: '076-9876543', email: 'nisha@medplus.lk', status: 'Active' },
];

export const DEFAULT_STAFF: Staff[] = [
  { id: 'STF-001', name: 'Admin', username: 'admin', password: 'admin123', role: 'Admin', status: 'Active' },
  { id: 'STF-002', name: 'Staff', username: 'staff', password: 'staff456', role: 'Staff', status: 'Active' },
];

export const DEFAULT_PHARMACY_INFO: PharmacyInfo = {
  name: 'MediCare Clinic & Pharmacy',
  address: '123 Hospital Road, Kandy, Sri Lanka',
  phone: '081-234-5678',
  website: 'medicareclinic.lk',
  defaultConsultationFee: 1500,
  lowStockThreshold: 50,
  enableQrCode: true,
  taxRate: 2.5,
  expiryReminderDays: 30,
  emailNotifications: true,
  systemAlerts: true,
  tokenPrefix: 'TKN',
  currency: 'LKR',
  dateFormat: 'YYYY-MM-DD HH:mm',
  timeZone: 'Asia/Colombo',
  autoBackup: true,
  autoBackupFrequency: 'Daily',
  printerPaperSize: '80mm',
  printerMargins: '0.5in',
  sessionTimeout: 30,
  enable2Fa: false,
};

export const DEFAULT_BRANCHES: PharmacyBranch[] = [
  { id: 'BR-001', name: 'MediCare Main Pharmacy', address: '123 Hospital Road, Kandy', phone: '081-234-5678', isMain: true },
  { id: 'BR-002', name: 'MediCare Town Branch', address: '45 Colombo Street, Kandy', phone: '081-234-9988', isMain: false },
];


export const DEFAULT_PRESCRIPTIONS: Prescription[] = [];

export const DEFAULT_HISTORY: HistoryItem[] = [];

export const DEFAULT_SERVICE_FEES = [
  { id: 'fee-1', name: 'Nebulizer treatment', defaultFee: 800 },
  { id: 'fee-2', name: 'ECG service', defaultFee: 1200 },
  { id: 'fee-3', name: 'Medical procedure', defaultFee: 2000 },
  { id: 'fee-4', name: 'Other services', defaultFee: 1000 },
];

export const loadState = <T>(key: string, defaultValue: T): T => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val) as T;
  } catch {
    return defaultValue;
  }
};

export const saveState = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};
