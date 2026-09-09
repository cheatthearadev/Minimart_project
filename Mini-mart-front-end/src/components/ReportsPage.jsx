import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { StatCard, LoadingSpinner, Tabs } from './ui';
import { useLanguage } from '../context/LanguageContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="font-medium text-slate-300 text-xs mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold" style={{ color: p.color }}>${parseFloat(p.value).toLocaleString()}</p>)}
    </div>
  );
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [zDate, setZDate] = useState(new Date().toISOString().split('T')[0]);
  const [zReport, setZReport] = useState(null);
  const [zLoading, setZLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { period };
    if (period === 'custom' && from && to) { params.from = from; params.to = to; }
    api.getReports(params).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [period, from, to]);

  const fetchZReport = useCallback(() => {
    setZLoading(true);
    api.getZReport(zDate).then(d => { setZReport(d); setZLoading(false); }).catch(() => setZLoading(false));
  }, [zDate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchZReport(); }, [fetchZReport]);

  const periodTabs = [
    { key: 'daily', label: t('reports.daily') },
    { key: 'weekly', label: t('reports.weekly') },
    { key: 'monthly', label: t('reports.monthly') },
    { key: 'custom', label: t('reports.custom') },
  ];

  if (loading) return <LoadingSpinner text={t('reports.loading')} />;
  if (!data) return <div className="text-center py-20 text-slate-500">{t('reports.failed')}</div>;

  const summary = data.summary || {};
  const totalOrders = parseInt(summary.total_orders || 0);
  const totalRevenue = parseFloat(summary.total_revenue || 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
  const chartData = (data.daily_revenue || []).map(d => ({ label: d.date, revenue: parseFloat(d.revenue) }));
  const topProducts = (data.top_products || []).map(p => ({ ...p, total_sales: parseInt(p.qty) }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs tabs={periodTabs} active={period} onChange={setPeriod} />
        {period === 'custom' && (
          <div className="flex gap-3 items-center">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field text-sm" />
            <span className="text-slate-400">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field text-sm" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label={t('reports.revenue')} value={`$${totalRevenue.toLocaleString()}`} color="green" />
        <StatCard icon="🧾" label={t('reports.orders')} value={totalOrders} color="blue" />
        <StatCard icon="📊" label={t('reports.avgOrder')} value={`$${avgOrder.toFixed(2)}`} color="orange" />
        <StatCard icon="💵" label={t('reports.cashReceived')} value={`$${parseFloat(summary.total_cash || 0).toLocaleString()}`} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('reports.revenueTrend')}</h3>
            <p className="text-sm text-slate-500">{period} {t('reports.overview')}</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">{t('reports.noChartData')}</div>}
        </div>

        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('reports.topProducts')}</h3>
            <p className="text-sm text-slate-500">{t('reports.bestSellers')}</p>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_sales" fill="#f97316" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">{t('reports.noData')}</div>}
        </div>
      </div>

      {data.hourly_distribution && (
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('reports.hourlyDistribution')}</h3>
            <p className="text-sm text-slate-500">{t('reports.salesByHour')}</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.hourly_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card border-l-4 border-l-slate-600">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>🧾</span> {t('reports.dailyZReport')}
            </h3>
            <p className="text-sm text-slate-500">{t('reports.endOfDayReconciliation')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={zDate} onChange={e => setZDate(e.target.value)} className="input-field text-sm" />
            <button onClick={fetchZReport} className="btn-primary text-sm">{t('reports.view')}</button>
          </div>
        </div>

        {zLoading ? <LoadingSpinner text={t('reports.loadingZReport')} /> : zReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-slate-500 mb-1">{t('reports.totalOrders')}</p>
                <p className="text-2xl font-bold text-slate-800">{zReport.summary?.total_orders || 0}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-slate-500 mb-1">{t('reports.totalRevenue')}</p>
                <p className="text-2xl font-bold text-emerald-600">${parseFloat(zReport.summary?.total_revenue || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-slate-500 mb-1">{t('reports.totalCashReceived')}</p>
                <p className="text-2xl font-bold text-blue-600">${parseFloat(zReport.summary?.total_cash || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-slate-500 mb-1">{t('reports.discounts')}</p>
                <p className="text-2xl font-bold text-amber-600">-${parseFloat(zReport.summary?.total_discounts || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-xs text-slate-500 mb-1">{t('reports.changeGiven')}</p>
                <p className="text-2xl font-bold text-orange-600">${parseFloat(zReport.summary?.total_change || 0).toFixed(2)}</p>
              </div>
            </div>

            {zReport.by_type?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">{t('reports.byOrderType')}</h4>
                <div className="flex gap-3 flex-wrap">
                  {zReport.by_type.map(bt => (
                    <div key={bt.order_type} className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 capitalize">{bt.order_type?.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-slate-800">{bt.count} <span className="text-xs font-normal text-slate-400">{t('reports.ordersLabel')}</span></p>
                      <p className="text-sm font-semibold text-emerald-600">${parseFloat(bt.revenue || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {zReport.by_cashier?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">{t('reports.byCashier')}</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead><tr className="bg-emerald-50/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{t('reports.cashier')}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{t('reports.ordersCount')}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{t('reports.revenueLabel')}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {zReport.by_cashier.map(c => (
                        <tr key={c.cashier} className="hover:bg-emerald-50/30">
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{c.cashier || 'Unknown'}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{c.orders}</td>
                          <td className="px-4 py-2.5 text-sm font-semibold text-emerald-600">${parseFloat(c.revenue || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {zReport.shift && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">{t('reports.currentShift')}</h4>
                <div className="flex gap-6 text-sm">
                  <div><span className="text-slate-500">{t('reports.startingCash')}:</span> <span className="font-bold text-slate-800">${parseFloat(zReport.shift.starting_cash || 0).toFixed(2)}</span></div>
                  <div><span className="text-slate-500">{t('reports.statusLabel')}:</span> <span className={`font-bold ${zReport.shift.status === 'active' ? 'text-emerald-600' : 'text-slate-600'}`}>{zReport.shift.status}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
