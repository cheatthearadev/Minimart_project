import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ROLE_COLORS = {
  admin: 'bg-emerald-100 text-emerald-700',
  supervisor: 'bg-blue-100 text-blue-700',
  cashier: 'bg-slate-100 text-slate-700',
  stock_clerk: 'bg-orange-100 text-orange-700',
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [imagePreview, setImagePreview] = useState(user?.profile_image || '');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImageSelect = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    setError('');
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await api.uploadProfileImage(file);
      await api.updateProfile({ id: user.id, profile_image: url });
      const updatedUser = { ...user, profile_image: url };
      setUser(updatedUser);
      sessionStorage.setItem('minimart_user', JSON.stringify(updatedUser));
      setMessage('Profile picture updated!');
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      setImagePreview(user?.profile_image || '');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const body = { id: user.id, full_name: fullName.trim() || user.full_name };
      if (password) body.password = password;
      const res = await api.updateProfile(body);
      const updatedUser = { ...user, ...res.user };
      setUser(updatedUser);
      sessionStorage.setItem('minimart_user', JSON.stringify(updatedUser));
      setMessage('Profile updated successfully');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <h2 className="text-lg font-bold text-slate-800">My Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-500 relative">
          <div className="absolute -bottom-12 left-8">
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center transition-all relative ${
                uploading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:ring-2 hover:ring-emerald-300'
              } ${imagePreview ? '' : 'bg-gradient-to-br from-orange-400 to-orange-500'}`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handleImageSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          {message && (
            <div className="bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl mb-4 border border-emerald-100">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-4 border border-red-100">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mb-4">Click the avatar above to upload a new profile picture (JPG/PNG, max 2MB)</p>

          <div className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="label-field">Username</label>
              <input
                value={user?.username || ''}
                disabled
                className="input-field disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="label-field">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="label-field">Role</label>
              <div className="flex items-center gap-2">
                <input
                  value={user?.role?.replace('_', ' ') || ''}
                  disabled
                  className="input-field disabled:bg-slate-50 disabled:text-slate-500 capitalize"
                />
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${ROLE_COLORS[user?.role] || 'bg-slate-100 text-slate-700'}`}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
            <button onClick={handleSaveName} className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
