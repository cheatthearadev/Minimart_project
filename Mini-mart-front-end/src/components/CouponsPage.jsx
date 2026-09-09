import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge } from './ui';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const defaultForm = { code: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: 1 };
  const [form, setForm] = useState(defaultForm);

  const fetch = () => api.getCoupons().then(d => { setCoupons(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const filtered = coupons.filter(c => (c.code || '').toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    const payload = {
      ...form,
      is_active: form.is_active ? 1 : 0,
    };
    const action = editing ? api.updateCoupon({ id: editing.id, ...payload }) : api.createCoupon(payload);
    action.then(() => { setShowModal(false); setEditing(null); setForm(defaultForm); fetch(); }).catch(err => alert(err.message));
  };
  const handleDelete = () => api.deleteCoupon(delId).then(() => { setShowDelete(false); fetch(); }).catch(err => alert(err.message));
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: c.value,
      min_order_amount: c.min_order_amount || '',
      max_uses: c.max_uses || '',
      expires_at: c.expires_at || '',
      is_active: parseInt(c.is_active) ? 1 : 0,
    });
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner text="Loading coupons..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search coupons..." className="w-80" />
        <button onClick={() => { setEditing(null); setForm(defaultForm); setShowModal(true); }} className="btn-primary">+ Add Coupon</button>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="🎟️" title="No coupons found" /></td></tr>
              ) : filtered.map(c => {
                const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                const isMaxed = c.max_uses && parseInt(c.used_count || 0) >= parseInt(c.max_uses);
                const isInactive = !parseInt(c.is_active);
                const status = isExpired ? 'Expired' : isMaxed ? 'Maxed' : isInactive ? 'Inactive' : 'Active';
                return (
                  <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3.5"><span className="font-mono font-bold text-emerald-600">{c.code}</span></td>
                    <td className="px-4 py-3.5"><Badge color={c.type === 'percentage' ? 'blue' : 'green'}>{c.type}</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{c.type === 'percentage' ? `${parseFloat(c.value).toFixed(2)}%` : `$${parseFloat(c.value).toFixed(2)}`}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{c.min_order_amount ? `$${parseFloat(c.min_order_amount).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{c.expires_at || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge color={status === 'Active' ? 'green' : 'red'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Edit</button>
                        <button onClick={() => { setDelId(c.id); setShowDelete(true); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} maxWidth="520px">
        <div className="space-y-4">
          <div><label className="label-field">Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field font-mono" required placeholder="e.g. SAVE10" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div><label className="label-field">Value *</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="input-field" required placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-field">Min Order ($)</label><input type="number" step="0.01" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} className="input-field" placeholder="None" /></div>
            <div><label className="label-field">Max Uses</label><input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} className="input-field" placeholder="Unlimited" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div><label className="label-field">Expires At</label><input type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} className="input-field" /></div>
            <div>
              <label className="label-field block mb-1">Status</label>
              <select value={form.is_active ? '1' : '0'} onChange={e => setForm({...form, is_active: e.target.value === '1' ? 1 : 0})} className="input-field">
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={!form.code.trim() || !form.value}>{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {showDelete && <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Coupon?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3"><button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleDelete} className="btn-danger flex-1">Delete</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}
