import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PAGE_ICONS = {
  dashboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  products: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  categories: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>,
  pos: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  orders: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  returns: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  customers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  suppliers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>,
  discounts: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  coupons: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="15" y2="15"/><circle cx="13.5" cy="10.5" r="1"/><circle cx="10.5" cy="13.5" r="1"/></svg>,
  reports: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shifts: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

export default function TopBar({ page, onToggleSidebar, dark, onDarkToggle, user, notifications, setNotifications, onOpenStore, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const langRef = useRef(null);
  const { t, lang, setLang } = useLanguage();
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setOpen(false);
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return t('topbar.justNow');
    if (s < 3600) return `${Math.floor(s / 60)} ${t('topbar.minutesAgo')}`;
    if (s < 86400) return `${Math.floor(s / 3600)} ${t('topbar.hoursAgo')}`;
    return `${Math.floor(s / 86400)} ${t('topbar.daysAgo')}`;
  };

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-emerald-100/60 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all lg:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            {PAGE_ICONS[page]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('nav.' + page) || page}</h1>
            <p className="text-xs text-slate-400 -mt-0.5">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onOpenStore && (
          <button onClick={onOpenStore}
            className="px-3.5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all"
            title="Open Customer Store">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span className="hidden sm:inline">{t('topbar.store')}</span>
          </button>
        )}
        {/* Language Toggle */}
        <div className="relative" ref={langRef}>
          <button onClick={() => setLangOpen(!langOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all"
            title={t('language.label')}>
            {lang === 'km' ? 'ខ្មែរ' : 'EN'}
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-scaleIn z-50">
              <button
                onClick={() => { setLang('en'); setLangOpen(false); }}
                className={`w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-emerald-50 transition-colors ${lang === 'en' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-700'}`}>
                English
              </button>
              <button
                onClick={() => { setLang('km'); setLangOpen(false); }}
                className={`w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-emerald-50 transition-colors font-khmer ${lang === 'km' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-700'}`}>
                ភាសាខ្មែរ
              </button>
            </div>
          )}
        </div>

        <button onClick={onDarkToggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
          title={dark ? t('topbar.lightMode') : t('topbar.darkMode')}>
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(!open); if (!open) markRead(); }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center animate-bounce shadow-lg shadow-orange-200">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-scaleIn z-50">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-white">
                <h3 className="font-bold text-slate-800">{t('topbar.notifications')}</h3>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-orange-500 font-medium transition-colors">
                    {t('topbar.clearAll')}
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="opacity-30" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                    {t('topbar.noNotifications')}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-5 py-3.5 border-b border-emerald-50/50 flex items-start gap-3 transition-colors ${n.read ? 'bg-white' : 'bg-emerald-50/30'}`}>
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        n.type === 'order' ? 'bg-emerald-100 text-emerald-600'
                        : n.type === 'stock' ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600'
                      }`}>
                        {n.type === 'order' ? '🛒' : n.type === 'stock' ? '📦' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.time)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-emerald-100 cursor-pointer hover:bg-emerald-50 rounded-xl px-3 py-1.5 transition-colors" onClick={() => onNavigate?.('profile')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-orange-200 overflow-hidden">
            {user?.profile_image ? (
              <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.username}</p>
            <p className="text-[11px] text-emerald-600/60 capitalize font-medium">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
