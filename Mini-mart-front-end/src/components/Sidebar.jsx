import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: 'dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: 'Dashboard', admin: true },
  { key: 'products', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Products', admin: false },
  { key: 'categories', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>, label: 'Categories', admin: true },
  { key: 'pos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, label: 'POS', admin: false },
  { key: 'orders', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: 'Orders', admin: true },
  { key: 'deliveries', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: 'Deliveries', admin: true },
  { key: 'returns', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>, label: 'Returns', admin: true },
  { key: 'customers', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Customers', admin: true },
  { key: 'suppliers', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: 'Suppliers', admin: true },
  { key: 'discounts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>, label: 'Discounts', admin: true },
  { key: 'coupons', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="15" y2="15"/><circle cx="13.5" cy="10.5" r="1"/><circle cx="10.5" cy="13.5" r="1"/></svg>, label: 'Coupons', admin: true },
  { key: 'reports', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: 'Reports', admin: true },
  { key: 'users', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'Users', admin: true },
  { key: 'shifts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Shifts', admin: true },
];

export default function Sidebar({ page, setPage, open, collapsed, onToggle, isMobile }) {
  const { user, logout, isAdmin } = useAuth();
  const filtered = NAV.filter(n => !n.admin || isAdmin);

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={onToggle} />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        text-white
        transition-all duration-300 ease-in-out
        ${isMobile
          ? (open ? 'w-80 translate-x-0' : 'w-80 -translate-x-full')
          : (collapsed ? 'w-20' : 'w-64')
        }
      `} style={{ background: 'linear-gradient(180deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        {/* Logo area */}
        <div className={`flex items-center gap-3 h-[72px] shrink-0 px-5 border-b border-white/10 ${collapsed && !isMobile ? 'justify-center px-0' : ''}`}>
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg border border-white/10 hover:scale-110 transition-transform">
            <img src="/logo-white.svg" alt="Logo" className="w-8 h-8" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <span className="text-xl font-bold tracking-tight">Mini Mart</span>
              <span className="block text-xs text-emerald-200/60 font-medium -mt-0.5">Management System</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-0.5">
          {filtered.map(n => {
            const active = page === n.key;
            return (
              <button key={n.key}
                onClick={() => { setPage(n.key); if (isMobile) onToggle(); }}
                title={collapsed && !isMobile ? n.label : undefined}
                className={`
                  flex items-center gap-3.5 w-full rounded-xl text-[15px]
                  transition-all duration-200
                  ${collapsed && !isMobile ? 'px-0 py-3 justify-center' : 'px-4 py-3 justify-start'}
                  ${active
                    ? 'bg-white/20 text-white shadow-lg shadow-black/10 font-semibold backdrop-blur-sm'
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/8 font-medium'
                  }
                `}>
                <span className={`shrink-0 ${active ? 'text-white' : ''}`}>{n.icon}</span>
                {(!collapsed || isMobile) && <span className="truncate">{n.label}</span>}
                {active && (!collapsed || isMobile) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User area */}
        <div className={`p-3 border-t border-white/10 ${collapsed && !isMobile ? 'px-2' : 'p-4'}`}>
          {(!collapsed || isMobile) ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => setPage('profile')}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 shadow-lg overflow-hidden ${user?.profile_image ? '' : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-500/20'}`}>
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={user.full_name || user.username} className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-xs text-emerald-200/50 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-emerald-200/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                title="Logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <button onClick={logout} className="w-full py-3 flex justify-center text-emerald-200/40 hover:text-white transition-colors rounded-xl hover:bg-white/10"
              title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
