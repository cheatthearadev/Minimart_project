import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge, Tabs } from './ui';
import { useLanguage } from '../context/LanguageContext';

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { api.getOrders().then(d => { setOrders(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = orders.filter(o => {
    const matchDate = dateFilter === 'all' || (() => {
      const d = new Date(o.created_at);
      const now = new Date();
      if (dateFilter === 'today') return d.toDateString() === now.toDateString();
      if (dateFilter === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    })();
    const matchSearch = !search || o.invoice_number?.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchSearch;
  });

  const dateTabs = [
    { key: 'all', label: t('orders.all') },
    { key: 'today', label: t('orders.today') },
    { key: 'week', label: t('orders.thisWeek') },
    { key: 'month', label: t('orders.thisMonth') },
  ];

  if (loading) return <LoadingSpinner text={t('orders.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs tabs={dateTabs} active={dateFilter} onChange={setDateFilter} />
        <SearchInput value={search} onChange={setSearch} placeholder={t('orders.searchPlaceholder')} className="w-72" />
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.invoice')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.items')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.total')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.cash')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.change')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="🧾" title={t('orders.noOrdersFound')} /></td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-emerald-50/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-sm font-semibold text-emerald-600">{o.invoice_number}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    <Badge color="slate">{o.items?.length || 0} {t('common.items')}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-slate-800">${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">${parseFloat(o.cash_received).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">${parseFloat(o.cash_return || 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={t('orders.orderDetails')} maxWidth="500px">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{t('orders.invoice')}</p>
                <p className="font-mono font-bold text-emerald-600">{selectedOrder.invoice_number}</p>
              </div>
              <Badge color="green">{t('orders.paid')}</Badge>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              {(selectedOrder.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name || item.product_name} x{item.quantity}</span>
                  <span className="font-medium text-slate-800">${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>{t('orders.subtotal')}</span><span>${parseFloat(selectedOrder.total_amount).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>{t('orders.cashReceived')}</span><span>${parseFloat(selectedOrder.cash_received).toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                <span>{t('orders.change')}</span><span>${parseFloat(selectedOrder.cash_return || 0).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">{new Date(selectedOrder.created_at).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
