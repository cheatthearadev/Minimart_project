import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge } from './ui';
import { useLanguage } from '../context/LanguageContext';

export default function SuppliersPage() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  const fetchAll = () => Promise.all([api.getSuppliers(), api.getProducts()]).then(([s, p]) => { setSuppliers(s); setProducts(p); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetchAll(); }, []);

  const filtered = suppliers.filter(s => (s.name || '').toLowerCase().includes(search.toLowerCase()));
  const getCount = (id) => products.filter(p => String(p.supplier_id) === String(id)).length;

  const handleSubmit = () => {
    const action = editing ? api.updateSupplier({ id: editing.id, ...form }) : api.createSupplier(form);
    action.then(() => { setShowModal(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); fetchAll(); }).catch(err => alert(err.message));
  };
  const handleDelete = () => api.deleteSupplier(delId).then(() => { setShowDelete(false); fetchAll(); }).catch(err => alert(err.message));
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' }); setShowModal(true); };

  if (loading) return <LoadingSpinner text={t('suppliers.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder={t('suppliers.searchPlaceholder')} className="w-80" />
        <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); setShowModal(true); }}
          className="btn-primary">{t('suppliers.addSupplier')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full"><EmptyState icon="🚚" title={t('suppliers.noSuppliersFound')} /></div>
        ) : filtered.map(s => (
          <div key={s.id} className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-xl text-white shrink-0 shadow-lg shadow-orange-200">
                🚚
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800">{s.name}</h4>
                {s.phone && <p className="text-sm text-slate-500 mt-0.5">📱 {s.phone}</p>}
                {s.email && <p className="text-sm text-slate-500">✉️ {s.email}</p>}
                {s.address && <p className="text-xs text-slate-400 mt-1 truncate">📍 {s.address}</p>}
                <div className="mt-2"><Badge color="orange">{getCount(s.id)} {t('suppliers.productsCount')}</Badge></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => openEdit(s)} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">{t('common.edit')}</button>
              <button onClick={() => { setDelId(s.id); setShowDelete(true); }} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('suppliers.editSupplier') : t('suppliers.addSupplierModal')} maxWidth="520px">
        <div className="space-y-4">
          <div><label className="label-field">{t('suppliers.name')} *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required placeholder={t('suppliers.supplierNamePlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-field">{t('suppliers.phone')}</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" placeholder={t('suppliers.phonePlaceholder')} /></div>
            <div><label className="label-field">{t('suppliers.email')}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder={t('suppliers.emailPlaceholder')} /></div>
          </div>
          <div><label className="label-field">{t('suppliers.address')}</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" placeholder={t('suppliers.addressPlaceholder')} /></div>
          <div><label className="label-field">{t('suppliers.notes')}</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={3} placeholder={t('suppliers.notesPlaceholder')} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={!form.name.trim()}>{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>

      {showDelete && <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('suppliers.deleteSupplier')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('common.undoable')}</p>
            <div className="flex gap-3"><button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">{t('common.cancel')}</button><button onClick={handleDelete} className="btn-danger flex-1">{t('common.delete')}</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}
