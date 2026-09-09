import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { SearchInput, Modal, ConfirmDialog, EmptyState, LoadingSpinner, Badge } from './ui';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });

  const fetch = () => {
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([c, p]) => { setCategories(c); setProducts(p); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const filtered = categories.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  const getCount = (catId) => products.filter(p => String(p.category_id) === String(catId)).length;

  const handleSubmit = () => {
    const action = editing ? api.updateCategory({ id: editing.id, ...form }) : api.createCategory(form);
    action.then(() => { setShowModal(false); setEditing(null); setForm({ name: '', description: '', color: '#6366f1' }); fetch(); }).catch(err => alert(err.message));
  };

  const handleDelete = () => api.deleteCategory(delId).then(() => { setShowDelete(false); fetch(); }).catch(err => alert(err.message));

  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', color: c.color || '#6366f1' }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', color: '#6366f1' }); setShowModal(true); };

  if (loading) return <LoadingSpinner text={t('categories.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder={t('categories.searchPlaceholder')} className="w-80" />
        <button onClick={openAdd} className="btn-primary">{t('categories.addCategory')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl shrink-0 shadow-lg" style={{ backgroundColor: c.color || '#6366f1' }} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800">{c.name}</h4>
                <p className="text-sm text-slate-500 truncate">{c.description || t('categories.noDescription')}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge color="indigo">{getCount(c.id) + ' ' + t('categories.productsCount')}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => openEdit(c)} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">{t('common.edit')}</button>
              <button onClick={() => { setDelId(c.id); setShowDelete(true); }} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon="🏷️" title={t('categories.noCategoriesFound')} />}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('categories.editCategory') : t('categories.addCategoryModal')} maxWidth="480px">
        <div className="space-y-4">
          <div>
            <label className="label-field">{t('categories.name')} *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required placeholder={t('categories.categoryNamePlaceholder')} />
          </div>
          <div>
            <label className="label-field">{t('categories.description')}</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} placeholder={t('categories.optionalDescription')} />
          </div>
          <div>
            <label className="label-field">{t('categories.color')}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              <span className="text-sm text-slate-500 font-mono">{form.color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={!form.name.trim()}>{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title={t('categories.deleteCategory')} message={t('categories.deleteConfirm')} />
    </div>
  );
}
