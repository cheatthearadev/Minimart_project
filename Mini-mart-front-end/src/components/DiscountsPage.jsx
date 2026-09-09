import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge } from './ui';
import { useLanguage } from '../context/LanguageContext';

export default function DiscountsPage() {
  const { t } = useLanguage();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const defaultForm = { code: '', type: 'percent', value: '', min_order: '0', max_uses: '', start_date: '', end_date: '' };
  const [form, setForm] = useState(defaultForm);

  const fetch = () => api.getDiscounts().then(d => { setDiscounts(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const filtered = discounts.filter(d => (d.code || '').toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    const action = editing ? api.updateDiscount({ id: editing.id, ...form }) : api.createDiscount(form);
    action.then(() => { setShowModal(false); setEditing(null); setForm(defaultForm); fetch(); }).catch(err => alert(err.message));
  };
  const handleDelete = () => api.deleteDiscount(delId).then(() => { setShowDelete(false); fetch(); }).catch(err => alert(err.message));
  const openEdit = (d) => { setEditing(d); setForm({ code: d.code, type: d.type, value: d.value, min_order: d.min_order || '0', max_uses: d.max_uses || '', start_date: d.start_date || '', end_date: d.end_date || '' }); setShowModal(true); };

  if (loading) return <LoadingSpinner text={t('discounts.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder={t('discounts.searchPlaceholder')} className="w-80" />
        <button onClick={() => { setEditing(null); setForm(defaultForm); setShowModal(true); }} className="btn-primary">{t('discounts.addDiscount')}</button>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-emerald-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.code')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.type')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.value')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.minOrder')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.usage')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('discounts.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.actions')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="🏷️" title={t('discounts.noDiscountsFound')} /></td></tr>
              ) : filtered.map(d => {
                const isExpired = d.end_date && new Date(d.end_date) < new Date();
                const isMaxed = d.max_uses && parseInt(d.usage_count || 0) >= parseInt(d.max_uses);
                return (
                  <tr key={d.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3.5"><span className="font-mono font-bold text-emerald-600">{d.code}</span></td>
                    <td className="px-4 py-3.5"><Badge color={d.type === 'percent' ? 'blue' : 'green'}>{d.type}</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{d.type === 'percent' ? `${d.value}%` : `$${parseFloat(d.value).toFixed(2)}`}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">${parseFloat(d.min_order || 0).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{d.usage_count || 0}{d.max_uses ? ` / ${d.max_uses}` : ''}</td>
                    <td className="px-4 py-3.5">
                      <Badge color={isExpired || isMaxed ? 'red' : 'green'}>
                        {isExpired ? t('discounts.expired') : isMaxed ? t('discounts.maxed') : t('discounts.active')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">{t('common.edit')}</button>
                        <button onClick={() => { setDelId(d.id); setShowDelete(true); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('discounts.editDiscount') : t('discounts.addDiscountModal')} maxWidth="520px">
        <div className="space-y-4">
          <div><label className="label-field">{t('discounts.code')} *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field font-mono" required placeholder={t('discounts.codePlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t('discounts.type')} *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option value="percent">{t('discounts.percentage')}</option>
                <option value="fixed">{t('discounts.fixedAmount')}</option>
              </select>
            </div>
            <div><label className="label-field">{t('discounts.value')} *</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="input-field" required placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-field">{t('discounts.minOrderDollar')}</label><input type="number" step="0.01" value={form.min_order} onChange={e => setForm({...form, min_order: e.target.value})} className="input-field" placeholder="0" /></div>
            <div><label className="label-field">{t('discounts.maxUses')}</label><input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} className="input-field" placeholder={t('discounts.unlimited')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-field">{t('discounts.startDate')}</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="input-field" /></div>
            <div><label className="label-field">{t('discounts.endDate')}</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={!form.code.trim() || !form.value}>{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>

      {showDelete && <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('discounts.deleteDiscount')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('common.undoable')}</p>
            <div className="flex gap-3"><button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">{t('common.cancel')}</button><button onClick={handleDelete} className="btn-danger flex-1">{t('common.delete')}</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}
