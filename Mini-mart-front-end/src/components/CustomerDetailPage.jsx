import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Badge, EmptyState, LoadingSpinner } from './ui';

const TIER_STYLES = {
  bronze:   { badge: 'bg-orange-50 text-orange-700 ring-orange-600/20',        dot: 'bg-orange-500',  label: 'Bronze' },
  silver:   { badge: 'bg-slate-100 text-slate-700 ring-slate-600/20',         dot: 'bg-slate-400',   label: 'Silver' },
  gold:     { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20',          dot: 'bg-amber-400',   label: 'Gold' },
  platinum: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',       dot: 'bg-indigo-500',  label: 'Platinum' },
};

function TierBadge({ tier }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${style.badge}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function statusColor(status) {
  const map = {
    completed: 'green',
    pending: 'yellow',
    cancelled: 'red',
  };
  return map[status] || 'slate';
}

export default function CustomerDetailPage({ customerId, onBack }) {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback((page) => {
    setLoading(true);
    setError(null);
    api.getCustomerDetail(customerId, page)
      .then((data) => {
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load customer details');
        setLoading(false);
      });
  }, [customerId]);

  useEffect(() => { load(1); }, [load]);

  if (loading) return <LoadingSpinner text="Loading customer details..." />;

  if (error) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <button onClick={onBack} className="btn-secondary">← Back to customers</button>
        <div className="card text-start">
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Something went wrong</h3>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button onClick={() => load(pagination.page || 1)} className="btn-primary">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const tier = customer?.loyalty_tier || 'bronze';
  const infoRows = [
    { label: 'Phone', value: customer?.phone || '—' },
    { label: 'Email', value: customer?.email || '—' },
    { label: 'Customer since', value: customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="btn-secondary">← Back to customers</button>

      {/* Customer info card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {(customer?.name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-800">{customer?.name || 'Customer'}</h2>
              <TierBadge tier={tier} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
              {infoRows.map((r) => (
                <span key={r.label}><span className="font-medium text-slate-400">{r.label}:</span> {r.value}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Points</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{customer?.points || 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spent</p>
            <p className="mt-1 text-2xl font-bold text-slate-800 tabular-nums">${parseFloat(customer?.total_spent || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="card p-0">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Order History</h3>
          {pagination.total > 0 && <Badge color="green">{pagination.total} orders</Badge>}
        </div>

        {orders.length === 0 ? (
          <EmptyState icon="🧾" title="No orders yet" description="This customer hasn't made any orders." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-semibold text-emerald-600 whitespace-nowrap">{o.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600"><Badge color="slate">{o.items?.length || 0} items</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-800">${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5"><Badge color={statusColor(o.status)}>{o.status || 'completed'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.total_pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => load(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >← Prev</button>
            <button
              onClick={() => load(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
