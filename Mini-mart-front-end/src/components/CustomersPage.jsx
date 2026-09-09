import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge } from './ui';
import { useLanguage } from '../context/LanguageContext';

const TIER_BADGE_COLORS = {
  bronze:   'bg-orange-50 text-orange-700 ring-orange-600/20',
  silver:   'bg-slate-100 text-slate-700 ring-slate-600/20',
  gold:     'bg-amber-50 text-amber-700 ring-amber-600/20',
  platinum: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

function TierBadge({ tier }) {
  const color = TIER_BADGE_COLORS[tier] || TIER_BADGE_COLORS.bronze;
  const label = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Bronze';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${color}`}>
      {label}
    </span>
  );
}


export default function CustomersPage({ onViewCustomer }) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetch = () => api.getCustomers().then(d => { setCustomers(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const filtered = customers.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const handleSubmit = () => {
    const action = editing ? api.updateCustomer({ id: editing.id, ...form }) : api.createCustomer(form);
    action.then(() => { setShowModal(false); setEditing(null); setForm({ name: '', phone: '', email: '' }); fetch(); }).catch(err => alert(err.message));
  };
  const handleDelete = () => api.deleteCustomer(delId).then(() => { setShowDelete(false); fetch(); }).catch(err => alert(err.message));
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '' }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', email: '' }); setShowModal(true); };

  if (loading) return <LoadingSpinner text={t('customers.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder={t('customers.searchPlaceholder')} className="w-80" />
        <button onClick={openAdd} className="btn-primary">{t('customers.addCustomer')}</button>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>              <tr className="bg-emerald-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.customer')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.phone')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.email')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.tier')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.points')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('customers.totalSpent')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.actions')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="👥" title={t('customers.noCustomersFound')} /></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} onClick={() => onViewCustomer && onViewCustomer(c.id)} className="hover:bg-emerald-50/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{c.email || '—'}</td>
                  <td className="px-4 py-3.5"><TierBadge tier={c.loyalty_tier} /></td>
                  <td className="px-4 py-3.5"><Badge color="green">{c.points || 0}</Badge></td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-800">${parseFloat(c.total_spent || 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">{t('common.edit')}</button>
                      <button onClick={(e) => { e.stopPropagation(); setDelId(c.id); setShowDelete(true); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('customers.editCustomer') : t('customers.addCustomerModal')} maxWidth="480px">
        <div className="space-y-4">
          <div><label className="label-field">{t('customers.name')} *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required placeholder={t('customers.customerNamePlaceholder')} /></div>
          <div><label className="label-field">{t('customers.phone')}</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" placeholder={t('customers.phonePlaceholder')} /></div>
          <div><label className="label-field">{t('customers.email')}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder={t('customers.emailPlaceholder')} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={!form.name.trim()}>{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>

      {showDelete && <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('customers.deleteCustomer')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('common.undoable')}</p>
            <div className="flex gap-3"><button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">{t('common.cancel')}</button><button onClick={handleDelete} className="btn-danger flex-1">{t('common.delete')}</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}
