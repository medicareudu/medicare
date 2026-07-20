export interface Medicine {
  _uid: number;
  id: string; // e.g. MED-001
  name: string;
  category: string;
  qty: number;
  expiry: string; // YYYY-MM-DD
  supplier: string; // Name of supplier
  price: number; // LKR unit price
  minThreshold: number; // default is 50
}

export interface Supplier {
  id: string; // e.g. SUP-001
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface Staff {
  id: string; // e.g. STF-001
  name: string;
  username: string;
  email?: string;
  password?: string;
  role: 'Admin' | 'Staff';
  status: 'Active' | 'Inactive';
}

export interface PrescriptionItem {
  medicineId: string;
  name: string;
  qty: number;
  price: number; // Unit price at the time of prescription
  unit: string;
}

export interface AdditionalCharge {
  name: string;
  fee: number;
  checked: boolean;
}

export interface Prescription {
  token: string; // e.g. MED-00132
  patientName: string; // Optional
  patientNo: string; // e.g. P-2025-0312
  doctor: string;
  date: string; // YYYY-MM-DD HH:MM
  medicines: PrescriptionItem[];
  consultationFee: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  discount: number;
  status: 'Pending' | 'Completed' | 'Overdue';
  issuedAt?: string;
  issuedBy?: string;
}

export interface HistoryItem {
  id: string; // e.g. HIST-001
  time: string; // YYYY-MM-DD HH:MM
  type: 'Import' | 'Request' | 'Issued' | 'Alert' | 'Stock' | 'Staff' | 'Supplier' | 'Settings';
  reference: string;
  detail: string;
  user: string;
}

export interface PharmacyInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  defaultConsultationFee: number;
  lowStockThreshold: number; // default e.g. 50
  enableQrCode?: boolean;
  taxRate?: number; // e.g. 2.5
  expiryReminderDays?: number;
  emailNotifications?: boolean;
  systemAlerts?: boolean;
  tokenPrefix?: string;
  currency?: string;
  dateFormat?: string;
  timeZone?: string;
  autoBackup?: boolean;
  autoBackupFrequency?: string;
  printerPaperSize?: string;
  printerMargins?: string;
  sessionTimeout?: number;
  enable2Fa?: boolean;
}

export interface PharmacyBranch {
  id: string; // e.g. BR-001
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface ServiceFee {
  id: string;
  name: string;
  defaultFee: number;
}


