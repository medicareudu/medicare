import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Supplier } from '../types';
import { Truck, Plus, Edit, Trash2, Mail, Phone, User, AlertTriangle } from 'lucide-react';

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useAppState();

  // Modal and form states
  const [showModal, setShowModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [deleteConfirmSup, setDeleteConfirmSup] = useState<Supplier | null>(null);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleOpenAdd = () => {
    setEditingSup(null);
    setFormId(`SUP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('Active');
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSup(sup);
    setFormId(sup.id);
    setFormName(sup.name);
    setFormContact(sup.contactPerson);
    setFormPhone(sup.phone);
    setFormEmail(sup.email);
    setFormStatus(sup.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) return;

    const payload: Supplier = {
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      contactPerson: formContact.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      status: formStatus,
    };

    if (editingSup) {
      updateSupplier(editingSup.id, payload);
    } else {
      if (suppliers.some(s => s.id.toUpperCase() === payload.id)) {
        alert('Supplier ID already exists. Please choose a unique ID.');
        return;
      }
      addSupplier(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (sup: Supplier) => {
    setDeleteConfirmSup(sup);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmSup) return;
    await deleteSupplier(deleteConfirmSup.id);
    setDeleteConfirmSup(null);
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Suppliers Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain and audit medical supplier credentials, emails, contacts, and status directory.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Main Grid Card Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map(sup => (
          <div
            key={sup.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header inside card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{sup.name}</h3>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{sup.id}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  sup.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {sup.status}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-2 pt-2 border-t border-slate-50 text-slate-600">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400 flex-shrink-0" />
                  <span>Contact: <strong className="font-semibold text-slate-700">{sup.contactPerson || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 flex-shrink-0" />
                  <span>Phone: <strong className="font-semibold text-slate-700 font-mono">{sup.phone || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">Email: <strong className="font-semibold text-slate-700">{sup.email || '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions Footer inside Card */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(sup)}
                className="btn btn-sm text-xs font-semibold px-2"
              >
                <Edit size={12} className="text-slate-500" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(sup)}
                className="btn btn-sm btn-danger-outline text-xs font-semibold px-2"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 font-medium">
            No suppliers found in directory. Add one to associate with medicines.
          </div>
        )}
      </div>

      {/* SUPPLIER MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck size={16} className="text-sky-500" />
                {editingSup ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-slate-600">ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSup}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. PharmaCo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g. Saman Kumara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Phone Contact</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 077-1234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. saman@pharmaco.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Active Status</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'Active'}
                      onChange={() => setFormStatus('Active')}
                      className="accent-sky-500"
                    />
                    <span>Active supplier</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'Inactive'}
                      onChange={() => setFormStatus('Inactive')}
                      className="accent-sky-500"
                    />
                    <span>Inactive / Suspended</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs font-semibold"
                >
                  {editingSup ? 'Update Supplier' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmSup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 p-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Delete Supplier?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deleteConfirmSup.name}</strong> ({deleteConfirmSup.id})? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteConfirmSup(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer outline-none transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer outline-none transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
