import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, EmptyState, LoadingSpinner, Badge } from './ui';

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'green' },
  { value: 'supervisor', label: 'Supervisor', color: 'blue' },
  { value: 'cashier', label: 'Cashier', color: 'slate' },
  { value: 'stock_clerk', label: 'Stock Clerk', color: 'orange' },
];

const ROLE_COLORS = {
  admin: 'green',
  supervisor: 'blue',
  cashier: 'slate',
  stock_clerk: 'orange',
};

const AVATAR_GRADIENTS = {
  admin: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200',
  supervisor: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200',
  cashier: 'bg-gradient-to-br from-slate-400 to-slate-500',
  stock_clerk: 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-200',
};

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'cashier',
    profile_image: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchUsers = () => api.getUsers().then(d => { setUsers(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => {
    setForm({ full_name: '', username: '', password: '', role: 'cashier', profile_image: '' });
    setImageFile(null);
    setImagePreview('');
    setErrors({});
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profile_image: 'Only JPG and PNG images are allowed' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profile_image: 'Image size must be less than 2MB' }));
      return;
    }
    setErrors(prev => ({ ...prev, profile_image: '' }));
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageSelect(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview('');
    setForm(prev => ({ ...prev, profile_image: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!editing && !form.password) errs.password = 'Password is required';
    if (!form.role) errs.role = 'Role is required';
    if (imageFile && imageFile.size > 2 * 1024 * 1024) errs.profile_image = 'Image size must be less than 2MB';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let profileImageUrl = form.profile_image;
      if (imageFile) {
        profileImageUrl = await api.uploadProfileImage(imageFile);
      }

      const body = {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        role: form.role,
        profile_image: profileImageUrl || '',
        admin_id: currentUser?.id,
      };

      if (!editing) {
        body.password = form.password;
        await api.createUser(body);
      } else {
        body.id = editing.id;
        if (form.password) body.password = form.password;
        await api.updateUser(body);
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteUser(delId, currentUser?.id);
      setShowDelete(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      full_name: u.full_name || u.username,
      username: u.username,
      password: '',
      role: u.role,
      profile_image: u.profile_image || '',
    });
    setImageFile(null);
    setImagePreview(u.profile_image || '');
    setErrors({});
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">User Management</h2>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">+ Add User</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length === 0 ? (
          <div className="col-span-full"><EmptyState icon="👤" title="No users found" /></div>
        ) : users.map(u => (
          <div key={u.id} className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden ${
                u.profile_image ? '' : AVATAR_GRADIENTS[u.role] || AVATAR_GRADIENTS.cashier
              }`}>
                {u.profile_image ? (
                  <img src={u.profile_image} alt={u.full_name || u.username} className="w-full h-full object-cover" />
                ) : (
                  (u.full_name || u.username)?.[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{u.full_name || u.username}</h4>
                <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                <Badge color={ROLE_COLORS[u.role] || 'slate'}>{u.role?.replace('_', ' ')}</Badge>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(u)} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Edit</button>
                <button onClick={() => { setDelId(u.id); setShowDelete(true); }} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Add User'} maxWidth="480px">
        <div className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errors.submit}</div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleImageDrop}
              onClick={() => document.getElementById('profile-image-input')?.click()}
              className={`w-28 h-28 rounded-full cursor-pointer border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative ${
                isDragging ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' :
                imagePreview ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); handleImageRemove(); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors">
                    x
                  </button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <span className="text-[9px] text-slate-400 text-center leading-tight">Upload Photo</span>
                </>
              )}
              <input id="profile-image-input" type="file" accept="image/jpeg,image/png" onChange={(e) => handleImageSelect(e.target.files[0])} className="hidden" />
            </div>
            {errors.profile_image && <p className="text-xs text-red-500">{errors.profile_image}</p>}
            <p className="text-xs text-slate-400">JPG or PNG, max 2MB</p>
          </div>

          <div>
            <label className="label-field">Full Name *</label>
            <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input-field" placeholder="Enter full name" />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="label-field">Username *</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input-field" placeholder="Enter username" disabled={!!editing} />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="label-field">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" placeholder="Enter password" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="label-field">Role *</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field">
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {showDelete && <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete User?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3"><button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleDelete} className="btn-danger flex-1">Delete</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}
