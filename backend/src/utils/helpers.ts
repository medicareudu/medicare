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
  name: string,
  cachedMeds?: any[]
) {
  // 1. Match by Unique ID
  const existingById = await tx.medicine.findUnique({
    where: { medicineId: medicineId.toUpperCase().trim() }
  });
  if (existingById) return existingById;

  // 2. Match by Name (exact case-insensitive)
  const existingByName = await tx.medicine.findFirst({
    where: { name: { equals: name.trim(), mode: 'insensitive' } }
  });
  if (existingByName) return existingByName;

  // 3. Fallback: Fuzzy/substring name comparison
  const allMeds = cachedMeds || await tx.medicine.findMany();
  const cleanInput = name.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const prefixInput = cleanInput.substring(0, 4);

  const matched = allMeds.find((m: any) => {
    const cleanDb = m.name.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    if (cleanDb === cleanInput) return true;
    if (cleanDb.includes(cleanInput) || cleanInput.includes(cleanDb)) return true;
    
    const prefixDb = cleanDb.substring(0, 4);
    if (prefixDb.length >= 4 && prefixDb === prefixInput) return true;
    
    return false;
  });

  return matched || null;
}


export function mapMedicine(m: {
  uid: number;
  medicineId: string;
  name: string;
  genericName: string;
  category: string;
  qty: number;
  expiry: string;
  supplier: string;
  price: number;
  minThreshold: number;
}) {
  return {
    _uid: m.uid,
    id: m.medicineId,
    name: m.name,
    genericName: m.genericName,
    category: m.category,
    qty: m.qty,
    expiry: m.expiry,
    supplier: m.supplier,
    price: m.price,
    minThreshold: m.minThreshold,
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
