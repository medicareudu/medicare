import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Medicine,
  Supplier,
  Staff,
  Prescription,
  HistoryItem,
  PharmacyInfo,
  PharmacyBranch,
  ServiceFee,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'medicare_access_token';
const REFRESH_KEY = 'medicare_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        setTokens(data.accessToken, refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface AppData {
  medicines: Medicine[];
  suppliers: Supplier[];
  staff: Staff[];
  pharmacyInfo: PharmacyInfo | null;
  branches: PharmacyBranch[];
  prescriptions: Prescription[];
  history: HistoryItem[];
  serviceFees: ServiceFee[];
}

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    setTokens(data.accessToken, data.refreshToken);
    return data.user as Staff;
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      clearTokens();
    }
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.user as Staff;
  },
};

export const dataApi = {
  getAll: async (): Promise<AppData> => {
    const { data } = await api.get('/data');
    return data;
  },
};

export interface ImportResult {
  medicines: Medicine[];
  addCount: number;
  updateCount: number;
  skipCount: number;
  totalImported: number;
}

export const medicinesApi = {
  create: async (med: Omit<Medicine, '_uid'>) => {
    const { data } = await api.post('/medicines', med);
    return data as Medicine;
  },
  update: async (uid: number, med: Partial<Medicine>) => {
    const { data } = await api.put(`/medicines/${uid}`, med);
    return data as Medicine;
  },
  delete: async (uid: number) => {
    await api.delete(`/medicines/${uid}`);
  },
  import: async (items: Array<Omit<Medicine, '_uid'> & { action?: 'update' | 'skip' }>): Promise<ImportResult> => {
    const { data } = await api.post('/medicines/import', items);
    return data as ImportResult;
  },
};

export const suppliersApi = {
  create: async (sup: Supplier) => {
    const { data } = await api.post('/suppliers', sup);
    return data as Supplier;
  },
  update: async (id: string, sup: Partial<Supplier>) => {
    const { data } = await api.put(`/suppliers/${id}`, sup);
    return data as Supplier;
  },
  delete: async (id: string) => {
    await api.delete(`/suppliers/${id}`);
  },
};

export const staffApi = {
  create: async (stf: Staff) => {
    const { data } = await api.post('/staff', stf);
    return data as Staff;
  },
  update: async (id: string, stf: Partial<Staff>) => {
    const { data } = await api.put(`/staff/${id}`, stf);
    return data as Staff;
  },
  delete: async (id: string) => {
    await api.delete(`/staff/${id}`);
  },
};

export const prescriptionsApi = {
  create: async (p: Omit<Prescription, 'token'>) => {
    const { data } = await api.post('/prescriptions', p);
    return data as Prescription;
  },
  dispense: async (token: string) => {
    const { data } = await api.post(`/prescriptions/${token}/dispense`);
    return data as Prescription;
  },
  updateStatus: async (token: string, status: Prescription['status']) => {
    const { data } = await api.patch(`/prescriptions/${token}/status`, { status });
    return data as Prescription;
  },
};

export const historyApi = {
  clear: async () => {
    await api.delete('/history');
  },
};

export const settingsApi = {
  updatePharmacy: async (info: Partial<PharmacyInfo>) => {
    const { data } = await api.put('/settings/pharmacy', info);
    return data as PharmacyInfo;
  },
  createBranch: async (b: PharmacyBranch) => {
    const { data } = await api.post('/settings/branches', b);
    return data as PharmacyBranch;
  },
  updateBranch: async (id: string, b: Partial<PharmacyBranch>) => {
    const { data } = await api.put(`/settings/branches/${id}`, b);
    return data as PharmacyBranch;
  },
  deleteBranch: async (id: string) => {
    await api.delete(`/settings/branches/${id}`);
  },
  createServiceFee: async (fee: Omit<ServiceFee, 'id'>) => {
    const { data } = await api.post('/settings/service-fees', fee);
    return data as ServiceFee;
  },
  updateServiceFee: async (id: string, fee: Partial<ServiceFee>) => {
    const { data } = await api.put(`/settings/service-fees/${id}`, fee);
    return data as ServiceFee;
  },
  deleteServiceFee: async (id: string) => {
    await api.delete(`/settings/service-fees/${id}`);
  },
};

export const backupApi = {
  download: async () => {
    const response = await api.get('/backup/download', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const disposition = response.headers['content-disposition'];
    let filename = `Medicare_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/['"]/g, '');
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  },
  reschedule: async () => {
    await api.post('/backup/re-schedule');
  }
};

export const reportsApi = {
  downloadIncomeLedger: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/reports/income/download?${params.toString()}`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const disposition = response.headers['content-disposition'];
    let filename = `Income_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/['"]/g, '');
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error;
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
