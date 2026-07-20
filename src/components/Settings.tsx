import React, { useState, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { backupApi } from '../api/client';
import { Staff, PharmacyBranch } from '../types';
import {
  Settings,
  Shield,
  Plus,
  Trash2,
  Home,
  CheckCircle2,
  RefreshCw,
  QrCode,
  MapPin,
  Percent,
  Edit2,
  Phone,
  Globe,
  Bell,
  Lock,
  Database,
  Printer,
  Sliders,
  Users,
  Key,
  Clock,
  Coins,
  Calendar,
  Download,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export const SettingsComponent: React.FC = () => {
  const {
    staff,
    addStaff,
    deleteStaff,
    updateStaff,
    pharmacyInfo,
    updatePharmacyInfo,
    branches,
    addBranch,
    updateBranch,
    deleteBranch,
    clearHistory,
    currentUser,
    history,
    restoreState,
    medicines,
    suppliers,
    prescriptions,
    serviceFees,
    addServiceFee,
    updateServiceFee,
    deleteServiceFee
  } = useAppState();

  // ─── Settings Navigation Tabs ───
  const [subTab, setSubTab] = useState<'clinic' | 'notifications' | 'system' | 'security' | 'staff' | 'fees'>('clinic');

  // Success save notification
  const [saveSuccess, setSaveSuccess] = useState('');

  // File input ref for restoring backup
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Service Fees State ───
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeDefault, setNewFeeDefault] = useState<number>(1000);

  // ─── Pharmacy Clinic Metadata ───
  const [pharmName, setPharmName] = useState(pharmacyInfo.name);
  const [pharmAddress, setPharmAddress] = useState(pharmacyInfo.address);
  const [pharmPhone, setPharmPhone] = useState(pharmacyInfo.phone);
  const [pharmWebsite, setPharmWebsite] = useState(pharmacyInfo.website);
  const [defaultFee, setDefaultFee] = useState<number>(pharmacyInfo.defaultConsultationFee);
  const [taxRate, setTaxRate] = useState<number>(pharmacyInfo.taxRate ?? 2.5);

  // ─── Notification Config States ───
  const [globalThreshold, setGlobalThreshold] = useState<number>(pharmacyInfo.lowStockThreshold);
  const [expiryDays, setExpiryDays] = useState<number>(pharmacyInfo.expiryReminderDays ?? 30);
  const [emailNotif, setEmailNotif] = useState<boolean>(pharmacyInfo.emailNotifications ?? true);
  const [sysAlerts, setSysAlerts] = useState<boolean>(pharmacyInfo.systemAlerts ?? true);

  // ─── System Parameters Config States ───
  const [tokenPrefix, setTokenPrefix] = useState<string>(pharmacyInfo.tokenPrefix ?? 'TKN');
  const [currency, setCurrency] = useState<string>(pharmacyInfo.currency ?? 'LKR');
  const [dateFormat, setDateFormat] = useState<string>(pharmacyInfo.dateFormat ?? 'YYYY-MM-DD HH:mm');
  const [timeZone, setTimeZone] = useState<string>(pharmacyInfo.timeZone ?? 'Asia/Colombo');
  const [autoBackup, setAutoBackup] = useState<boolean>(pharmacyInfo.autoBackup ?? true);
  const [backupFreq, setBackupFreq] = useState<string>(pharmacyInfo.autoBackupFrequency ?? 'Daily');
  const [paperSize, setPaperSize] = useState<string>(pharmacyInfo.printerPaperSize ?? '80mm');
  const [margins, setMargins] = useState<string>(pharmacyInfo.printerMargins ?? '0.5in');

  // ─── Security Parameters Config States ───
  const [sessTimeout, setSessTimeout] = useState<number>(pharmacyInfo.sessionTimeout ?? 30);
  const [twoFa, setTwoFa] = useState<boolean>(pharmacyInfo.enable2Fa ?? false);
  const [enableQrCode, setEnableQrCode] = useState<boolean>(pharmacyInfo.enableQrCode ?? true);

  // ─── Change Password Form States ───
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // ─── Staff CRUD Modals & States ───
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Admin' | 'Staff'>('Staff');
  const [newStaffStatus, setNewStaffStatus] = useState<'Active' | 'Inactive'>('Active');

  // ─── Branch CRUD Modals & States ───
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<PharmacyBranch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchIsMain, setNewBranchIsMain] = useState(false);

  // Trigger Save Feedback
  const triggerSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // ─── Save All Core Config Form Handlers ───
  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyInfo({
      name: pharmName,
      address: pharmAddress,
      phone: pharmPhone,
      website: pharmWebsite,
      defaultConsultationFee: Number(defaultFee),
      taxRate: Number(taxRate),
    });
    triggerSuccess('Clinic metadata saved successfully!');
  };

  const handleSaveNotificationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyInfo({
      lowStockThreshold: Number(globalThreshold),
      expiryReminderDays: Number(expiryDays),
      emailNotifications: emailNotif,
      systemAlerts: sysAlerts,
    });
    triggerSuccess('Notification rules updated successfully!');
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyInfo({
      tokenPrefix: tokenPrefix.trim().toUpperCase(),
      currency: currency.trim(),
      dateFormat: dateFormat,
      timeZone: timeZone,
      autoBackup: autoBackup,
      autoBackupFrequency: backupFreq,
      printerPaperSize: paperSize,
      printerMargins: margins,
    });
    
    // Reschedule auto backups on the backend with new settings
    try {
      await backupApi.reschedule();
    } catch (err) {
      console.error('Failed to reschedule backups on server', err);
    }
    
    triggerSuccess('System localization & printer configuration saved successfully!');
  };

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyInfo({
      sessionTimeout: Number(sessTimeout),
      enable2Fa: twoFa,
      enableQrCode: enableQrCode,
    });
    triggerSuccess('Security preferences saved successfully!');
  };

  // ─── Change User Password Handler ───
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Please fill out all password fields.');
      return;
    }

    // Verify current password match
    const currentStaffProfile = staff.find(s => s.id === currentUser.id);
    if (currentStaffProfile?.password !== oldPassword) {
      alert('The current password you entered is incorrect.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('The new password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 3) {
      alert('Password must be at least 3 characters long.');
      return;
    }

    // Update staff record
    updateStaff(currentUser.id, {
      password: newPassword,
    });

    // Reset password form
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerSuccess('Your system account password was changed successfully!');
  };

  // ─── Staff Registration Handlers ───
  const handleCreateOrUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUser.trim() || !newStaffEmail.trim()) {
      alert('Name, Username, and Email are required.');
      return;
    }

    if (editingStaff) {
      // Update existing
      updateStaff(editingStaff.id, {
        name: newStaffName.trim(),
        username: newStaffUser.trim().toLowerCase(),
        email: newStaffEmail.trim().toLowerCase(),
        password: newStaffPass ? newStaffPass : editingStaff.password,
        role: newStaffRole,
        status: newStaffStatus,
      });
      triggerSuccess(`Staff profile updated: ${newStaffName}`);
    } else {
      // Create new
      if (!newStaffPass) {
        alert('Password is required for new registration.');
        return;
      }
      if (staff.some(s => s.username.toLowerCase() === newStaffUser.toLowerCase().trim())) {
        alert('Username already exists. Please pick another.');
        return;
      }

      const payload: Staff = {
        id: `STF-${Math.floor(100 + Math.random() * 900)}`,
        name: newStaffName.trim(),
        username: newStaffUser.trim().toLowerCase(),
        email: newStaffEmail.trim().toLowerCase(),
        password: newStaffPass,
        role: newStaffRole,
        status: newStaffStatus,
      };

      addStaff(payload);
      triggerSuccess(`Successfully registered staff: ${newStaffName}`);
    }

    setShowStaffModal(false);
    setEditingStaff(null);
    setNewStaffName('');
    setNewStaffUser('');
    setNewStaffEmail('');
    setNewStaffPass('');
    setNewStaffRole('Staff');
    setNewStaffStatus('Active');
  };

  const handleEditStaffClick = (stf: Staff) => {
    setEditingStaff(stf);
    setNewStaffName(stf.name);
    setNewStaffUser(stf.username);
    setNewStaffEmail(stf.email || '');
    setNewStaffPass(''); // blank to keep unchanged
    setNewStaffRole(stf.role);
    setNewStaffStatus(stf.status);
    setShowStaffModal(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (id === currentUser?.id) {
      alert('You are currently logged in with this account. You cannot revoke your own clearance.');
      return;
    }
    const target = staff.find(s => s.id === id);
    if (confirm(`Are you absolutely sure you want to remove ${target?.name}? They will lose dashboard access immediately.`)) {
      deleteStaff(id);
      triggerSuccess('Staff credential access revoked.');
    }
  };

  // ─── Branch Management Handlers ───
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchAddress.trim() || !newBranchPhone.trim()) {
      alert('All fields are required to register a location.');
      return;
    }

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        name: newBranchName.trim(),
        address: newBranchAddress.trim(),
        phone: newBranchPhone.trim(),
        isMain: newBranchIsMain,
      });
      triggerSuccess(`Branch location updated: "${newBranchName}"`);
    } else {
      const payload: PharmacyBranch = {
        id: `BR-${Math.floor(100 + Math.random() * 900)}`,
        name: newBranchName.trim(),
        address: newBranchAddress.trim(),
        phone: newBranchPhone.trim(),
        isMain: newBranchIsMain,
      };
      addBranch(payload);
      triggerSuccess(`New clinic branch registered: "${newBranchName}"`);
    }

    setShowBranchModal(false);
    setEditingBranch(null);
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setNewBranchIsMain(false);
  };

  const handleEditBranchClick = (b: PharmacyBranch) => {
    setEditingBranch(b);
    setNewBranchName(b.name);
    setNewBranchAddress(b.address);
    setNewBranchPhone(b.phone);
    setNewBranchIsMain(b.isMain);
    setShowBranchModal(true);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete branch: "${name}"?`)) {
      deleteBranch(id);
      triggerSuccess('Branch location removed.');
    }
  };

  // ─── System Restore Defaults ───
  const handleResetLocalStorage = () => {
    if (confirm('CRITICAL: Restoring defaults will clear all database entries including current medicines inventory, custom staff members, and sales prescriptions. Proceed?')) {
      localStorage.clear();
      alert('System cache cleared! Loading seed defaults and restarting...');
      window.location.reload();
    }
  };

  // ─── Create & Download JSON Backup Handler ───
  const handleDownloadBackup = async () => {
    try {
      triggerSuccess('Preparing backup file from server...');
      await backupApi.download();
      triggerSuccess('Backup file downloaded successfully!');
    } catch (err) {
      console.error('Download backup failed', err);
      alert('Failed to download backup from server.');
    }
  };

  // ─── Restore JSON Backup Handler ───
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        const parsed = JSON.parse(result);
        
        // Basic validation of fields
        if (!parsed.medicines || !parsed.staff || !parsed.pharmacyInfo || !parsed.prescriptions) {
          alert('Invalid backup file structure. Missing critical state nodes.');
          return;
        }

        if (confirm(`Do you want to restore this backup file?\nExported at: ${parsed.backupMeta?.exportedAt || 'Unknown'}\nExported by: ${parsed.backupMeta?.exportedBy || 'Unknown'}\nThis will overwrite current system states.`)) {
          restoreState(parsed);
          alert('System state loaded from backup successfully! App will now refresh to apply properties.');
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse backup JSON. Please check file integrity.');
      }
    };
    reader.readAsText(file);
  };

  // ─── Extract dynamic login history from history log context ───
  const loginLogs = history.filter(item => 
    item.type === 'Staff' && 
    (item.detail.toLowerCase().includes('logged in') || item.detail.toLowerCase().includes('logged out'))
  );

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-sky-500 animate-spin-slow" />
            Control Center & Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure parameters, manage notifications rules, enforce authentication, execute backup snapshots, and maintain locations.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Settings Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand Navigation Sidebar (3 columns) */}
        <div className="lg:col-span-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Configuration Group
          </div>
          
          <button
            onClick={() => setSubTab('clinic')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'clinic' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Home size={15} />
            <span>Clinic & Locations</span>
          </button>

          <button
            onClick={() => setSubTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'notifications' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Bell size={15} />
            <span>Notification Settings</span>
          </button>

          <button
            onClick={() => setSubTab('system')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'system' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Sliders size={15} />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => setSubTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'security' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Lock size={15} />
            <span>Security Settings</span>
          </button>

          <button
            onClick={() => setSubTab('staff')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'staff' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Users size={15} />
            <span>Authorize Staff</span>
          </button>

          <button
            onClick={() => setSubTab('fees')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold text-left transition ${
              subTab === 'fees' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Coins size={15} />
            <span>Service Fees</span>
          </button>
        </div>

        {/* Right Hand Settings Main Form Panel (9 columns) */}
        <div className="lg:col-span-9">

          {/* TAB 1: CLINIC METADATA AND BRANCHES */}
          {subTab === 'clinic' && (
            <div className="space-y-6">
              {/* Clinic Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Home size={14} className="text-sky-500" />
                  Clinic Identity & Basic Billing Rules
                </h3>

                <form onSubmit={handleSaveClinicSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold flex items-center gap-1">
                        Clinic/Pharmacy Name
                      </label>
                      <input
                        type="text"
                        required
                        value={pharmName}
                        onChange={(e) => setPharmName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold flex items-center gap-1">
                        Official Website URL
                      </label>
                      <input
                        type="text"
                        required
                        value={pharmWebsite}
                        onChange={(e) => setPharmWebsite(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold flex items-center gap-1">
                      Clinic Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={pharmAddress}
                      onChange={(e) => setPharmAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold flex items-center gap-1">
                        Telephone Hotline
                      </label>
                      <input
                        type="text"
                        required
                        value={pharmPhone}
                        onChange={(e) => setPharmPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold">
                        Default Consultation Fee ({currency})
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={defaultFee}
                        onChange={(e) => setDefaultFee(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold">
                        Standard Handling/VAT Tax (%)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={0.1}
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="btn btn-primary font-bold px-5 py-2 cursor-pointer shadow-xs"
                    >
                      Save Identity Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Branches CRUD */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} className="text-sky-500" />
                    Locations & branches directory
                  </h3>
                  <button
                    onClick={() => {
                      setEditingBranch(null);
                      setNewBranchName('');
                      setNewBranchAddress('');
                      setNewBranchPhone('');
                      setNewBranchIsMain(false);
                      setShowBranchModal(true);
                    }}
                    className="btn btn-xs btn-teal font-bold"
                  >
                    <Plus size={10} />
                    <span>Add Branch</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map(b => (
                    <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col justify-between hover:shadow-xs transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">{b.name}</span>
                          {b.isMain && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-sky-100 text-sky-800 font-bold uppercase tracking-wider">
                              Main
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin size={10} className="text-slate-400" />
                          <span>{b.address}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Phone size={10} className="text-slate-400" />
                          <span>{b.phone}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 mt-2">
                        <button
                          onClick={() => handleEditBranchClick(b)}
                          className="p-1 text-slate-400 hover:text-sky-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                          title="Edit location Details"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                          title="Remove Location"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATION SETTINGS */}
          {subTab === 'notifications' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Bell size={14} className="text-sky-500" />
                Notification rules & alert thresholds
              </h3>

              <form onSubmit={handleSaveNotificationSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold block">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={globalThreshold}
                      onChange={(e) => setGlobalThreshold(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-[10px] text-slate-400 block">Default warning trigger level for generic medicines in inventory.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold block">Expiry Warning Advance Days</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-[10px] text-slate-400 block">Generates warnings for medicines approaching expiration within this window.</span>
                  </div>
                </div>

                <div className="pt-2 divide-y divide-slate-100">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block">System Banner Notifications</span>
                      <span className="text-[10px] text-slate-400 block">Generate real-time system warnings and low-stock indicators on the home dashboard.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sysAlerts}
                        onChange={(e) => setSysAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block">Supplier Email Dispatch Logs</span>
                      <span className="text-[10px] text-slate-400 block">Draft email logs in reorder history for suppliers when inventory levels collapse.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={emailNotif}
                        onChange={(e) => setEmailNotif(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button type="submit" className="btn btn-primary font-bold px-5 py-2 cursor-pointer shadow-xs">
                    Apply Rules
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SYSTEM SETTINGS */}
          {subTab === 'system' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Sliders size={14} className="text-sky-500" />
                System localization & receipt configuration
              </h3>

              <form onSubmit={handleSaveSystemSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block flex items-center gap-1">
                      <Key size={11} className="text-slate-400" /> Token Prefix Code
                    </label>
                    <input
                      type="text"
                      required
                      value={tokenPrefix}
                      onChange={(e) => setTokenPrefix(e.target.value)}
                      placeholder="e.g. TKN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to newly generated prescriptions (e.g., {tokenPrefix}-00133).</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block flex items-center gap-1">
                      <Coins size={11} className="text-slate-400" /> System Base Currency
                    </label>
                    <input
                      type="text"
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="e.g. LKR"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Applied across reports, billing, and receipts.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" /> System Date Format
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm (2026-06-29 10:45)</option>
                      <option value="DD/MM/YYYY hh:mm A">DD/MM/YYYY hh:mm A (29/06/2026 10:45 AM)</option>
                      <option value="MM-DD-YYYY">MM-DD-YYYY (06-29-2026)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 font-semibold block flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" /> System Timezone
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                    <Printer size={13} className="text-sky-500" /> Receipt Printer Configurations
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold text-[10px] block">Printer Paper Dimension</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800"
                      >
                        <option value="80mm">80mm Thermal Receipt (Standard Roll)</option>
                        <option value="58mm">58mm Thermal Receipt (Mini Printer)</option>
                        <option value="A4">A4 Full Sheet (Office Standard)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold text-[10px] block">Receipt Margin Space</label>
                      <select
                        value={margins}
                        onChange={(e) => setMargins(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800"
                      >
                        <option value="0.1in">Minimalist (0.1 inch)</option>
                        <option value="0.25in">Narrow (0.25 inch)</option>
                        <option value="0.5in">Balanced (0.5 inch)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block">Auto Backup Settings</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Automatically trigger dynamic local backups on critical transitions.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {autoBackup && (
                      <select
                        value={backupFreq}
                        onChange={(e) => setBackupFreq(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-semibold text-slate-800"
                      >
                        <option value="Daily">Daily Snapshot</option>
                        <option value="Weekly">Weekly Snapshot</option>
                        <option value="Monthly">Monthly Snapshot</option>
                      </select>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoBackup}
                        onChange={(e) => setAutoBackup(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button type="submit" className="btn btn-primary font-bold px-5 py-2 cursor-pointer shadow-xs">
                    Apply Localization Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY SETTINGS */}
          {subTab === 'security' && (
            <div className="space-y-6">
              
              {/* Change Password Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Key size={14} className="text-sky-500" />
                  Change User Account Password ({currentUser?.name})
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold block">Enter Current Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Current secret key"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold block">New Password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 3 letters"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold block">Confirm New Password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn btn-teal font-bold px-4 py-1.5 cursor-pointer shadow-xs">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Advanced Security Preferences */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Shield size={14} className="text-sky-500" />
                  Access Control & System Hardening
                </h3>

                <form onSubmit={handleSaveSecuritySettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-600 font-semibold block">Session Idle Timeout</label>
                      <select
                        value={sessTimeout}
                        onChange={(e) => setSessTimeout(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                      >
                        <option value={15}>15 Minutes (High Safety)</option>
                        <option value={30}>30 Minutes (Balanced)</option>
                        <option value={60}>60 Minutes</option>
                        <option value={0}>Disabled / Stay Connected</option>
                      </select>
                      <span className="text-[10px] text-slate-400 block">Locks dashboard access automatically after no user mouse activities.</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700 block">Two-Factor Authentication (UI Only)</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Require an authenticator verification code prompt at staff login.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={twoFa}
                          onChange={(e) => setTwoFa(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block">Enforce QR Code Verification</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Include high-resolution security tokens and QR codes on printed receipts to prevent patient fraudulent bills.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableQrCode}
                        onChange={(e) => setEnableQrCode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn btn-primary font-bold px-5 py-2 cursor-pointer shadow-xs">
                      Enforce Security Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Login Audit Trail */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-500" />
                  Staff Authentication Audit Trail (Login History)
                </h3>

                {loginLogs.length === 0 ? (
                  <p className="text-slate-400 italic py-2">No login sessions recorded in current system state.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left">
                          <th className="px-4 py-2 font-bold text-slate-600">Timestamp</th>
                          <th className="px-4 py-2 font-bold text-slate-600">Event Detail</th>
                          <th className="px-4 py-2 font-bold text-slate-600">User Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                        {loginLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 text-slate-500">{log.time}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800">{log.detail}</td>
                            <td className="px-4 py-2 text-slate-600">ID: {log.reference} · {log.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: STAFF CRUD */}
          {subTab === 'staff' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-sky-500" />
                  Authorize Staff Credentials
                </h3>
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setNewStaffName('');
                    setNewStaffUser('');
                    setNewStaffPass('');
                    setNewStaffRole('Staff');
                    setNewStaffStatus('Active');
                    setShowStaffModal(true);
                  }}
                  className="btn btn-xs btn-teal font-bold"
                >
                  <Plus size={10} />
                  <span>Add Staff Member</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto pr-1">
                {staff.map(stf => (
                  <div key={stf.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 transition px-2 rounded-lg">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-sm">{stf.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                          stf.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stf.role}
                        </span>
                        {stf.status === 'Inactive' && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-red-50 text-red-600 border border-red-100">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Username: {stf.username} &nbsp;·&nbsp; Email: {stf.email || 'None'} &nbsp;·&nbsp; ID: {stf.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditStaffClick(stf)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                        title="Edit profile"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(stf.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Revoke system access"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SERVICE FEES */}
          {subTab === 'fees' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins size={14} className="text-sky-500" />
                    Additional Service Fees Management
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure default fees for procedures, treatments, and other services.</p>
                </div>
              </div>

              {/* Add New Service Fee Section */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 space-y-3">
                <span className="font-bold text-xs text-slate-800 block">Create New Service Fee</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Service / Treatment Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ECG service, Nebulizer, etc."
                      value={newFeeName}
                      onChange={(e) => setNewFeeName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Default Price (LKR)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="1000"
                      value={newFeeDefault || ''}
                      onChange={(e) => setNewFeeDefault(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!newFeeName.trim()) {
                        alert('Please enter a service name.');
                        return;
                      }
                      if (newFeeDefault < 0) {
                        alert('Default fee cannot be negative.');
                        return;
                      }
                      addServiceFee({ name: newFeeName.trim(), defaultFee: newFeeDefault });
                      setNewFeeName('');
                      setNewFeeDefault(1000);
                      triggerSuccess('New service fee created successfully!');
                    }}
                    className="btn btn-teal btn-xs font-bold"
                  >
                    <Plus size={10} />
                    <span>Create Fee</span>
                  </button>
                </div>
              </div>

              {/* Service Fees List */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-800 block pb-1 border-b border-slate-100">Configured Service Fees ({serviceFees.length})</span>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {serviceFees.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No service fees configured. Add one above.</p>
                  ) : (
                    serviceFees.map(fee => (
                      <div key={fee.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition px-2 rounded-lg">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 text-xs block">{fee.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono block">ID: {fee.id}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold">LKR</span>
                            <input
                              type="number"
                              min={0}
                              value={fee.defaultFee}
                              onChange={(e) => updateServiceFee(fee.id, { defaultFee: Number(e.target.value) })}
                              className="w-24 text-right bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the "${fee.name}" service fee? This will remove it from future billing presets.`)) {
                                deleteServiceFee(fee.id);
                                triggerSuccess('Service fee deleted successfully!');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete service fee"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* REGISTER / EDIT STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-sky-500" />
                {editingStaff ? 'Modify Staff Member' : 'Register New Staff'}
              </h3>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  setEditingStaff(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateStaff} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Nirmala NM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. nirmala@medicare.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Username *</label>
                  <input
                    type="text"
                    required
                    value={newStaffUser}
                    onChange={(e) => setNewStaffUser(e.target.value)}
                    placeholder="e.g. nirmala"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    {editingStaff ? 'Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={newStaffPass}
                    onChange={(e) => setNewStaffPass(e.target.value)}
                    placeholder={editingStaff ? 'Unchanged' : 'password123'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">System Clearance Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'Admin' | 'Staff')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Staff">Staff Pharmacist</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Status</label>
                  <select
                    value={newStaffStatus}
                    onChange={(e) => setNewStaffStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setEditingStaff(null);
                  }}
                  className="btn btn-slate py-1 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary py-1 px-4 text-xs font-semibold"
                >
                  {editingStaff ? 'Save Updates' : 'Authorize Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRANCH MANAGEMENT DIALOG MODAL */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={16} className="text-sky-500" />
                {editingBranch ? 'Modify Location Details' : 'Add Pharmacy Branch'}
              </h3>
              <button
                onClick={() => {
                  setShowBranchModal(false);
                  setEditingBranch(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Location Name *</label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. Town Square Dispensary"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Physical Address *</label>
                <input
                  type="text"
                  required
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="e.g. 45 Colombo Road, Kandy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Branch Telephone *</label>
                  <input
                    type="text"
                    required
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    placeholder="e.g. 081-234-9988"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer py-2 text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={newBranchIsMain}
                      onChange={(e) => setNewBranchIsMain(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                    <span>Set as Main branch</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBranchModal(false);
                    setEditingBranch(null);
                  }}
                  className="btn btn-slate py-1 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary py-1 px-4 text-xs font-semibold"
                >
                  {editingBranch ? 'Save Changes' : 'Register Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
