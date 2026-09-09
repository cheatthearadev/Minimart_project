import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SearchInput, Modal, EmptyState, LoadingSpinner, Badge, Tabs } from './ui';
import { useLanguage } from '../context/LanguageContext';

export default function DeliveriesPage() {
  const { t } = useLanguage();
  const STATUS_MAP = {
    pending: { label: t('deliveries.pending'), color: 'yellow', icon: '⏳' },
    assigned: { label: t('deliveries.assigned'), color: 'blue', icon: '👤' },
    picked_up: { label: t('deliveries.pickedUp'), color: 'indigo', icon: '📦' },
    in_transit: { label: t('deliveries.inTransit'), color: 'orange', icon: '🚚' },
    delivered: { label: t('deliveries.delivered'), color: 'green', icon: '✅' },
    cancelled: { label: t('deliveries.cancelled'), color: 'red', icon: '❌' },
  };
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchDeliveries = useCallback(() => {
    api.getDeliveries(statusFilter).then(d => { setDeliveries(d); setLoading(false); }).catch(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const filtered = deliveries.filter(d => {
    const matchSearch = !search ||
      d.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.customer_phone?.includes(search) ||
      d.delivery_address?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleUpdateStatus = (deliveryId, newStatus) => {
    setUpdating(true);
    const payload = { id: deliveryId, status: newStatus };
    if (driverName.trim()) payload.driver_name = driverName.trim();
    if (driverPhone.trim()) payload.driver_phone = driverPhone.trim();
    api.updateDeliveryStatus(payload).then(() => {
      fetchDeliveries();
      setShowUpdateModal(null);
      setSelectedDelivery(null);
      setDriverName('');
      setDriverPhone('');
    }).catch(() => {}).finally(() => setUpdating(false));
  };

  const stats = {
    pending: deliveries.filter(d => d.status === 'pending').length,
    active: deliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    total: deliveries.length,
  };

  const statusTabs = [
    { key: 'all', label: `${t('common.all')} (${stats.total})` },
    { key: 'pending', label: `${t('deliveries.pending')} (${stats.pending})` },
    { key: 'in_transit', label: `${t('deliveries.inTransit')} (${stats.active})` },
    { key: 'delivered', label: `${t('deliveries.delivered')} (${stats.delivered})` },
  ];

  if (loading) return <LoadingSpinner text={t('deliveries.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
        <SearchInput value={search} onChange={setSearch} placeholder={t('deliveries.searchPlaceholder')} className="w-80" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
          <div className="text-2xl mb-1">⏳</div>
          <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
          <p className="text-xs text-slate-500">{t('deliveries.pending')}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="text-2xl mb-1">🚚</div>
          <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
          <p className="text-xs text-slate-500">{t('deliveries.inProgress')}</p>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-2xl font-bold text-slate-800">{stats.delivered}</p>
          <p className="text-xs text-slate-500">{t('deliveries.delivered')}</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-50 to-gray-50 border-slate-100">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">{t('deliveries.total')}</p>
        </div>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.invoice')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.address')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.total')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.fee')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="🚚" title={t('deliveries.noDeliveriesFound')} description={t('deliveries.noMatchFilter')} /></td></tr>
              ) : filtered.map(d => {
                const statusInfo = STATUS_MAP[d.status] || STATUS_MAP.pending;
                return (
                  <tr key={d.id} onClick={() => setSelectedDelivery(d)} className="hover:bg-emerald-50/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-semibold text-emerald-600">{d.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.customer_name}</p>
                        <p className="text-xs text-slate-400">{d.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">{d.delivery_address}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-800">${parseFloat(d.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-sm text-blue-600 font-medium">${parseFloat(d.delivery_fee).toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <Badge color={statusInfo.color}>{statusInfo.icon} {statusInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      {d.status !== 'delivered' && d.status !== 'cancelled' && (
                        <button onClick={() => { setShowUpdateModal(d); setDriverName(d.driver_name || ''); setDriverPhone(d.driver_phone || ''); }}
                          className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 font-medium transition-colors">
                          {t('deliveries.update')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedDelivery} onClose={() => setSelectedDelivery(null)} title={t('deliveries.deliveryDetails')} maxWidth="520px">
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Invoice</p>
                <p className="font-mono font-bold text-emerald-600">{selectedDelivery.invoice_number}</p>
              </div>
              <Badge color={STATUS_MAP[selectedDelivery.status]?.color || 'slate'}>
                {STATUS_MAP[selectedDelivery.status]?.icon} {STATUS_MAP[selectedDelivery.status]?.label}
              </Badge>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{t('deliveries.deliveryInfo')}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">{t('deliveries.name')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.customer_name}</span></div>
                <div><span className="text-slate-500">{t('deliveries.phone')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.customer_phone}</span></div>
              </div>
              <div className="text-sm"><span className="text-slate-500">{t('deliveries.addressLabel')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.delivery_address}</span></div>
              {selectedDelivery.delivery_notes && <div className="text-sm"><span className="text-slate-500">{t('deliveries.notes')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.delivery_notes}</span></div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">{t('deliveries.feeLabel')}:</span> <span className="font-medium text-blue-600">${parseFloat(selectedDelivery.delivery_fee).toFixed(2)}</span></div>
                <div><span className="text-slate-500">{t('deliveries.estTime')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.estimated_time} min</span></div>
              </div>
              {selectedDelivery.driver_name && (
                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-blue-100">
                  <div><span className="text-slate-500">{t('deliveries.driver')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.driver_name}</span></div>
                  <div><span className="text-slate-500">{t('deliveries.driverPhoneLabel')}:</span> <span className="font-medium text-slate-800">{selectedDelivery.driver_phone}</span></div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.orderItems')}</p>
              {(selectedDelivery.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium text-slate-800">${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm text-slate-500"><span>{t('deliveries.subtotal')}</span><span>${(parseFloat(selectedDelivery.total_amount) - parseFloat(selectedDelivery.delivery_fee)).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-blue-600"><span>{t('deliveries.deliveryFee')}</span><span>${parseFloat(selectedDelivery.delivery_fee).toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-1 border-t border-slate-200"><span>{t('deliveries.totalLabel')}</span><span>${parseFloat(selectedDelivery.total_amount).toFixed(2)}</span></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">{new Date(selectedDelivery.created_at).toLocaleString()}</p>
            {selectedDelivery.status !== 'delivered' && selectedDelivery.status !== 'cancelled' && (
              <button onClick={() => { setShowUpdateModal(selectedDelivery); setDriverName(selectedDelivery.driver_name || ''); setDriverPhone(selectedDelivery.driver_phone || ''); setSelectedDelivery(null); }}
                className="w-full btn-primary">{t('deliveries.updateStatus')}</button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!showUpdateModal} onClose={() => { setShowUpdateModal(null); setDriverName(''); setDriverPhone(''); }} title={t('deliveries.updateStatus')} maxWidth="420px">
        {showUpdateModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">{t('deliveries.invoiceLabel')} <span className="font-mono font-bold text-emerald-600">{showUpdateModal.invoice_number}</span></p>
              <p className="text-sm text-slate-600">{t('deliveries.customerLabel')} <span className="font-medium">{showUpdateModal.customer_name}</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.driverInfo')}</label>
              <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder={t('deliveries.driverName')} className="input-field text-sm" />
              <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder={t('deliveries.driverPhone')} className="input-field text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('deliveries.newStatus')}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_MAP).filter(([key]) => key !== showUpdateModal.status).map(([key, info]) => (
                  <button key={key} onClick={() => handleUpdateStatus(showUpdateModal.id, key)}
                    disabled={updating}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-40 ${
                      key === 'delivered' ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 text-emerald-700' :
                      key === 'cancelled' ? 'border-red-200 bg-red-50 hover:border-red-400 text-red-700' :
                      'border-slate-200 bg-white hover:border-emerald-300 text-slate-700'
                    }`}>
                    {info.icon} {info.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
