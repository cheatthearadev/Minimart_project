import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { api } from '../services/api';
import { StatCard, LoadingSpinner } from './ui';
import { useLanguage } from '../context/LanguageContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="font-medium text-slate-300 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          ${parseFloat(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={t('dashboard.loading')} />;
  if (!stats) return <div className="text-center py-20 text-slate-500">{t('dashboard.failed')}</div>;

  const revenueData = stats.revenue_chart || [];
  const topProducts = stats.top_products || [];

  const kpis = [
    { icon: '📦', label: t('dashboard.totalProducts'), value: stats.total_products || 0, color: 'green' },
    { icon: '💰', label: t('dashboard.stockValue'), value: `$${parseFloat(stats.stock_value || 0).toLocaleString()}`, color: 'emerald' },
    { icon: '⚠️', label: t('dashboard.lowStock'), value: stats.low_stock || 0, color: 'yellow' },
    { icon: '🚫', label: t('dashboard.outOfStock'), value: stats.out_of_stock || 0, color: 'red' },
    { icon: '🧾', label: t('dashboard.todaysOrders'), value: stats.today_orders || 0, color: 'blue' },
    { icon: '💵', label: t('dashboard.todaysRevenue'), value: `$${parseFloat(stats.today_revenue || 0).toLocaleString()}`, color: 'orange' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <StatCard key={i} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{t('dashboard.revenueTrend')}</h3>
              <p className="text-sm text-slate-500">{t('dashboard.last14Days')}</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
              {t('dashboard.days14')}
            </div>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">{t('dashboard.noRevenueData')}</div>
          )}
        </div>

        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('dashboard.topProducts')}</h3>
            <p className="text-sm text-slate-500">{t('dashboard.bestSellers')}</p>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={80} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_sales" fill="#f97316" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">{t('dashboard.noSalesData')}</div>
          )}
        </div>
      </div>

      {stats.weekly_summary && (
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('dashboard.weeklySummary')}</h3>
            <p className="text-sm text-slate-500">{t('dashboard.ordersRevenueBreakdown')}</p>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {stats.weekly_summary.map((d, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors border border-emerald-100/40">
                <p className="text-xs font-semibold text-slate-500 mb-2">{d.day}</p>
                <p className="text-lg font-bold text-slate-800">{d.orders}</p>
                <p className="text-xs text-emerald-600 font-semibold">${parseFloat(d.revenue || 0).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.low_stock_products && stats.low_stock_products.length > 0 && (
        <div className="card border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="text-amber-500">⚠️</span> {t('dashboard.lowStockAlert')}
              </h3>
              <p className="text-sm text-slate-500">{stats.low_stock_products.length} {t('dashboard.runningLow')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {stats.low_stock_products.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100/50">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg overflow-hidden border border-amber-100">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{t('dashboard.threshold')} {p.low_stock_threshold || 10}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.stock <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.stock} {t('dashboard.left')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
