import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import LoginPage from '../page/login.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import DashboardPage from './DashboardPage.jsx';
import ProductsPage from './ProductsPage.jsx';
import CategoriesPage from './CategoriesPage.jsx';
import POSPage from './POSPage.jsx';
import OrdersPage from './OrdersPage.jsx';
import DeliveriesPage from './DeliveriesPage.jsx';
import ReturnsPage from './ReturnsPage.jsx';
import CustomersPage from './CustomersPage.jsx';
import CustomerDetailPage from './CustomerDetailPage.jsx';
import SuppliersPage from './SuppliersPage.jsx';
import DiscountsPage from './DiscountsPage.jsx';
import CouponsPage from './CouponsPage.jsx';
import ReportsPage from './ReportsPage.jsx';
import UsersPage from './UsersPage.jsx'; 
import ProfilePage from './ProfilePage.jsx';
import ShiftsPage from './ShiftsPage.jsx';
import StorePage from './StorePage.jsx';
import { LoadingSpinner } from './ui';

let notificationSeq = 0;

function AppContent() {
  const { t } = useLanguage();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [customerDetailId, setCustomerDetailId] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem('minimart_dark') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [screenWidth, setScreenWidth] = useState(() => window.innerWidth);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const isMobile = screenWidth <= 768;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [storeOpen, setStoreOpen] = useState(false);

  const addNotification = useCallback((type, message, extra = {}) => {
    const n = { id: `${Date.now()}-${notificationSeq++}`, type, message, time: new Date(), read: false, ...extra };
    setNotifications(prev => [n, ...prev]);
  }, []);

  const navigate = useCallback((p) => {
    setCustomerDetailId(null);
    setPage(p);
  }, []);

  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);
  useEffect(() => { if (!isMobile) setSidebarOpen(true); }, [isMobile]);

  useEffect(() => {
    if (!authLoading && !isAdmin && !['pos', 'products'].includes(page)) {
      setPage('pos');
    }
  }, [authLoading, isAdmin, page]);

  const fetchAll = useCallback(() => {
    if (!user) return;
    Promise.allSettled([
      api.getProducts().then(d => setProducts(d)),
      api.getCategories().then(d => setCategories(d)),
      api.getSuppliers().then(d => setSuppliers(d)),
      api.getCustomers().then(d => setCustomers(d)),
    ]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => { localStorage.setItem('minimart_dark', dark); }, [dark]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'F1') { e.preventDefault(); setPage('pos'); }
      if (e.key === 'F2' && page === 'pos') { e.preventDefault(); window.dispatchEvent(new CustomEvent('pos-focus-search')); }
      if (e.key === 'F5') { e.preventDefault(); fetchAll(); }
      if (e.key === 'F9') { e.preventDefault(); setPage('dashboard'); }
      if (e.key === 'F10') { e.preventDefault(); setPage('orders'); }
      if ((e.key === '/' || e.key === '?') && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); setShowShortcuts(prev => !prev);
      }
      if (e.key === 'Escape') { setShowShortcuts(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [page, fetchAll]);

  if (storeOpen) return <StorePage onExit={() => setStoreOpen(false)} />;
  if (authLoading) return <LoadingSpinner text={t('common.loading')} />;
  if (!user) return <LoginPage onBrowseStore={() => setStoreOpen(true)} />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'products': return <ProductsPage categories={categories} suppliers={suppliers} isAdmin={isAdmin} cart={cart} setCart={setCart} addNotification={addNotification} />;
      case 'categories': return <CategoriesPage />;
      case 'pos': return null;
      case 'orders': return <OrdersPage />;
      case 'deliveries': return <DeliveriesPage />;
      case 'returns': return <ReturnsPage />;
      case 'customers':
        return customerDetailId
          ? <CustomerDetailPage customerId={customerDetailId} onBack={() => setCustomerDetailId(null)} />
          : <CustomersPage onViewCustomer={setCustomerDetailId} />;
      case 'suppliers': return <SuppliersPage />;
      case 'discounts': return <DiscountsPage />;
      case 'coupons': return <CouponsPage />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersPage />;
      case 'profile': return <ProfilePage />;
      case 'shifts': return <ShiftsPage />;
      default: return <DashboardPage />;
    }
  };

  const isPOS = page === 'pos';

  return (
    <div className={`min-h-screen bg-emerald-50/30 ${dark ? 'dark' : ''}`} onClick={() => {}}>
      {!isPOS && (
        <Sidebar
          page={page} setPage={navigate}
          open={sidebarOpen} collapsed={sidebarCollapsed}
          onToggle={() => {
            if (isMobile) setSidebarOpen(!sidebarOpen);
            else setSidebarCollapsed(!sidebarCollapsed);
          }}
          isMobile={isMobile}
        />
      )}

      <div className={`transition-all duration-300 ease-in-out ${isPOS ? '' : ''}`} style={{ marginLeft: isPOS ? 0 : (isMobile ? 0 : (sidebarCollapsed ? 80 : 256)) }}>
        {!isPOS && (
          <TopBar
            page={page}
            onToggleSidebar={() => {
              if (isMobile) setSidebarOpen(!sidebarOpen);
              else setSidebarCollapsed(!sidebarCollapsed);
            }}
            dark={dark}
            onDarkToggle={() => setDark(!dark)}
            user={user}
            notifications={notifications}
            setNotifications={setNotifications}
            onOpenStore={() => setStoreOpen(true)}
            onNavigate={navigate}
          />
        )}

        <main className={isPOS ? '' : 'p-4 sm:p-6'}>
          {isPOS ? (
            <POSPage
              products={products} categories={categories} customers={customers}
              cart={cart} setCart={setCart} onOrderComplete={fetchAll}
              addNotification={addNotification} user={user}
              onNavigate={navigate}
            />
          ) : renderPage()}
        </main>
      </div>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{t('shortcuts.title')}</h3>
              <button onClick={() => setShowShortcuts(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
            </div>
            <div className="space-y-2.5">
              {[
                ['F1', t('shortcuts.goToPOS')],
                ['F2', t('shortcuts.focusSearch')],
                ['F5', t('shortcuts.refreshData')],
                ['F9', t('shortcuts.goToDashboard')],
                ['F10', t('shortcuts.goToOrders')],
                ['/', t('shortcuts.toggleShortcuts')],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <span className="text-sm text-slate-600">{desc}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
