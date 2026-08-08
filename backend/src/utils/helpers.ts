import { prisma } from '../lib/prisma.js';
import { HistoryType } from '@prisma/client';

export async function addHistoryLog(
  type: HistoryType,
  reference: string,
  detail: string,
  user = 'System'
) {
  const now = new Date();
  const formattedDate = now.toLocaleString('sv-SE', { timeZone: 'Asia/Colombo' }).substring(0, 16);
  const historyId = `HIST-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

  return prisma.historyLog.create({
    data: {
      historyId,
      time: formattedDate,
      type,
      reference,
      detail,
      user,
    },
  });
}

export async function findExistingMedicine(
  tx: any,
  medicineId: string,
  name: string = '',
  cachedMeds?: any[],
  genericName?: string,
  tradeName?: string,
) {
  const safeId = (medicineId || '').toUpperCase().trim();

  // 1. Match by exact Medicine ID (most reliable)
  if (safeId) {
    const existingById = await tx.medicine.findUnique({
      where: { medicineId: safeId }
    });
    if (existingById) return existingById;
  }

  // 2. Match by exact (genericName + tradeName) pair — handles re-import of same product
  const safeGeneric = (genericName || name || '').trim().toLowerCase();
  const safeTrade = (tradeName || name || '').trim().toLowerCase();

  if (safeGeneric && safeTrade) {
    const allMeds = cachedMeds || await tx.medicine.findMany();
    const exactMatch = allMeds.find((m: any) => {
      const dbGeneric = (m.genericName || m.name || '').trim().toLowerCase();
      const dbTrade = (m.tradeName || m.name || '').trim().toLowerCase();
      return dbGeneric === safeGeneric && dbTrade === safeTrade;
    });
    if (exactMatch) return exactMatch;
  }

  return null;
}


export function mapMedicine(m: {
  uid: number;
  medicineId: string;
  name: string;
  genericName?: string;
  tradeName?: string;
  category: string;
  qty: number;
  expiry: string;
  supplier: string;
  price: number;
  minThreshold: number;
}) {
  return {
    _uid: m.uid,
    id: m.medicineId || '',
    name: m.genericName || m.name || '',
    genericName: m.genericName || m.name || '',
    tradeName: m.tradeName || m.name || '',
    category: m.category || 'General',
    qty: m.qty ?? 0,
    expiry: m.expiry || '2027-12-31',
    supplier: m.supplier || '',
    price: Number(m.price) || 0,
    minThreshold: m.minThreshold ?? 50,
  };
}

export function mapSupplier(s: {
  supplierId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: string;
}) {
  return {
    id: s.supplierId,
    name: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    status: s.status as 'Active' | 'Inactive',
  };
}

export function mapStaff(u: {
  staffId: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  status: string;
}) {
  return {
    id: u.staffId,
    name: u.name,
    username: u.username,
    email: u.email ?? undefined,
    role: u.role === 'Admin' ? 'Admin' : 'Staff',
    status: u.status as 'Active' | 'Inactive',
  };
}

export function mapHistory(h: {
  historyId: string;
  time: string;
  type: string;
  reference: string;
  detail: string;
  user: string;
}) {
  return {
    id: h.historyId,
    time: h.time,
    type: h.type,
    reference: h.reference,
    detail: h.detail,
    user: h.user,
  };
}

export function mapBranch(b: {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
}) {
  return {
    id: b.branchId,
    name: b.name,
    address: b.address,
    phone: b.phone,
    isMain: b.isMain,
  };
}

export function mapServiceFee(f: { feeId: string; name: string; defaultFee: number }) {
  return { id: f.feeId, name: f.name, defaultFee: f.defaultFee };
}

export function mapPrescription(p: {
  token: string;
  patientName: string;
  patientNo: string;
  doctor: string;
  date: string;
  medicines: unknown;
  consultationFee: number;
  additionalCharges: unknown;
  totalAmount: number;
  status: string;
  issuedAt: string | null;
  issuedBy: string | null;
}) {
  return {
    token: p.token,
    patientName: p.patientName,
    patientNo: p.patientNo,
    doctor: p.doctor,
    date: p.date,
    medicines: p.medicines,
    consultationFee: p.consultationFee,
    additionalCharges: p.additionalCharges,
    totalAmount: p.totalAmount,
    status: p.status,
    issuedAt: p.issuedAt ?? undefined,
    issuedBy: p.issuedBy ?? undefined,
  };
}

export function mapPharmacyInfo(s: {
  name: string;
  address: string;
  phone: string;
  website: string;
  defaultConsultationFee: number;
  lowStockThreshold: number;
  enableQrCode: boolean;
  taxRate: number;
  expiryReminderDays: number;
  emailNotifications: boolean;
  systemAlerts: boolean;
  tokenPrefix: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
  autoBackup: boolean;
  autoBackupFrequency: string;
  printerPaperSize: string;
  printerMargins: string;
  sessionTimeout: number;
  enable2Fa: boolean;
}) {
  return { ...s };
}
