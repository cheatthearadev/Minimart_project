import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmptyState, LoadingSpinner, Badge } from './ui';
import { useLanguage } from '../context/LanguageContext';

export default function ReturnsPage() {
  const { t } = useLanguage();
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ order_id: '', product_id: '', quantity: 1, reason: '', refund_amount: '' });
  const [orderItems, setOrderItems] = useState([]);

  const fetchAll = () => Promise.all([api.getReturns(), api.getOrders()]).then(([r, o]) => { setReturns(r); setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (form.order_id) {
      const found = orders.find(o => String(o.id) === String(form.order_id));
      setOrderItems(found?.items || []);
      setForm(prev => ({ ...prev, product_id: '', refund_amount: '' }));
    }
  }, [form.order_id, orders]);

  const handleSubmit = () => {
    if (!form.order_id || !form.product_id || !form.quantity) { alert(t('returns.fillRequired')); return; }
    api.createReturn({
      ...form, quantity: parseInt(form.quantity), refund_amount: parseFloat(form.refund_amount) || 0
    }).then(() => { setForm({ order_id: '', product_id: '', quantity: 1, reason: '', refund_amount: '' }); setOrderItems([]); fetchAll(); }).catch(err => alert(err.message));
  };

  if (loading) return <LoadingSpinner text={t('returns.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">↩️</div>
          <div>
            <h3 className="font-bold text-slate-800">{t('returns.newReturn')}</h3>
            <p className="text-xs text-slate-500">{t('returns.processReturnDesc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label-field">{t('returns.order')} *</label>
            <select value={form.order_id} onChange={e => setForm({...form, order_id: e.target.value})} className="input-field">
              <option value="">{t('returns.selectOrder')}</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.invoice_number} - {'$'}{parseFloat(o.total_amount).toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">{t('returns.product')} *</label>
            <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="input-field" disabled={!form.order_id}>
              <option value="">{t('returns.selectProduct')}</option>
              {orderItems.map((item, i) => (
                <option key={i} value={item.product_id || item.id}>{item.name || item.product_name} (x{item.quantity})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">{t('returns.quantity')} *</label>
            <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="label-field">{t('returns.refundAmount')} ($)</label>
            <input type="number" step="0.01" value={form.refund_amount} onChange={e => setForm({...form, refund_amount: e.target.value})} className="input-field" placeholder="0.00" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">{t('returns.reason')}</label>
            <input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="input-field" placeholder={t('returns.reasonPlaceholder')} />
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleSubmit} className="btn-primary">{t('returns.processReturn')}</button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t('returns.returnHistory')}</h3>
        {returns.length === 0 ? (
          <EmptyState icon="↩️" title={t('returns.noReturnsRecorded')} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>              <tr className="bg-emerald-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('returns.order')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('returns.product')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('returns.quantity')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('returns.refundAmount')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('returns.reason')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.date')}</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map(r => (
                  <tr key={r.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-sm font-semibold text-emerald-600">{r.invoice_number || r.order_id}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{r.product_name || r.product_id}</td>
                    <td className="px-4 py-3.5"><Badge color="slate">{r.quantity}</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-medium text-red-600">-{'$'}{parseFloat(r.refund_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">{r.reason || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
