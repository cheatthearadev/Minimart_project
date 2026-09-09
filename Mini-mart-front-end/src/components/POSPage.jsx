import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Modal } from './ui';
import qrCodeImage from '../assets/Qrcode.png';

const CATEGORY_EMOJIS = {
  'alcohol': '🍺', 'beverages': '🥤', 'dairy': '🥛', 'bakery': '🍞',
  'household': '🧴', 'cleaning': '🧹', 'noodles': '🍜', 'food': '🍝',
  'personal': '🧼', 'snacks': '🍿', 'candy': '🍬', 'frozen': '🧊',
  'fresh': '🥬', 'meat': '🥩', 'seafood': '🦐', 'produce': '🥑',
  'bread': '🍞', 'eggs': '🥚', 'cheese': '🧀', 'coffee': '☕',
  'tea': '🍵', 'juice': '🧃', 'water': '💧', 'soda': '🥤',
  'chips': '🍟', 'cookies': '🍪', 'cereal': '🥣', 'rice': '🍚',
  'pasta': '🍝', 'sauce': '🫙', 'spice': '🌶️', 'oil': '🫒',
  'default': '📦'
};

const POS_NAV = [
  { key: 'checkout', icon: '🛒', label: 'Checkout' },
  { key: 'inventory', icon: '📦', label: 'Inventory' },
  { key: 'sales', icon: '📋', label: 'Sales History' },
  { key: 'loyalty', icon: '⭐', label: 'Loyalty' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function POSPage({ products, categories, customers, cart, setCart, onOrderComplete, addNotification, user, onNavigate }) {
  const { t } = useLanguage();
  const [posTab, setPosTab] = useState('checkout');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favFilter, setFavFilter] = useState('all');
  const [showSoldOut, setShowSoldOut] = useState(false);
  const [cashIn, setCashIn] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [orderType, setOrderType] = useState('dine_in');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [posErr, setPosErr] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptQR, setReceiptQR] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('2.00');
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [notification, setNotification] = useState(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [savedCarts, setSavedCarts] = useState([]);
  const [savedCartId, setSavedCartId] = useState(null);
  const [cartPulse, setCartPulse] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currency, setCurrency] = useState(() => localStorage.getItem('pos_currency') || 'usd');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const searchRef = useRef(null);
  const searchWrapRef = useRef(null);

  const KHR_RATE = 4100;
  const formatPrice = (usd) => {
    if (currency === 'khr') {
      const khr = Math.round(usd * KHR_RATE);
      return `៛${khr.toLocaleString()}`;
    }
    return `$${parseFloat(usd).toFixed(2)}`;
  };
  const formatDual = (usd) => {
    const khr = Math.round(usd * KHR_RATE);
    return `$${parseFloat(usd).toFixed(2)} / ៛${khr.toLocaleString()}`;
  };

  useEffect(() => { localStorage.setItem('pos_currency', currency); }, [currency]);

  useEffect(() => {
    if (posTab === 'sales') {
      setOrdersLoading(true);
      api.getOrders().then(d => { setOrders(d); setOrdersLoading(false); }).catch(() => setOrdersLoading(false));
    }
    if (posTab === 'loyalty') {
      setLoyaltyLoading(true);
      api.getCustomers().then(d => { setLoyaltyCustomers(d); setLoyaltyLoading(false); }).catch(() => setLoyaltyLoading(false));
    }
  }, [posTab]);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const showToast = (type, message) => {
    setToast({ type, message, exiting: false });
    setTimeout(() => setToast(prev => prev ? { ...prev, exiting: true } : null), 1500);
    setTimeout(() => setToast(null), 1800);
  };

  const getCategoryEmoji = (name) => {
    if (!name) return CATEGORY_EMOJIS.default;
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
      if (lower.includes(key)) return emoji;
    }
    return CATEGORY_EMOJIS.default;
  };

  const getStockBadgeClass = (stock) => {
    const s = parseInt(stock);
    if (s <= 0) return 'pos-stock-low';
    if (s < 10) return 'pos-stock-low';
    if (s <= 50) return 'pos-stock-medium';
    return 'pos-stock-high';
  };

  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 100); }, []);

  useEffect(() => {
    const handler = () => { searchRef.current?.focus(); };
    window.addEventListener('pos-focus-search', handler);
    return () => window.removeEventListener('pos-focus-search', handler);
  }, []);

  const posProducts = products.filter(p => {
    const q = search.toLowerCase();
    const ms = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q));
    const mc = categoryFilter === 'all' || String(p.category_id) === String(categoryFilter);
    const mf = favFilter === 'all' || (favFilter === 'favorites' && p.is_favorite) || (favFilter === 'non-favorites' && !p.is_favorite);
    const mst = showSoldOut || parseInt(p.stock) > 0;
    return ms && mc && mf && mst;
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = appliedDiscount
    ? (appliedDiscount.type === 'percent' ? subtotal * parseFloat(appliedDiscount.value) / 100 : Math.min(parseFloat(appliedDiscount.value), subtotal))
    : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount || 0 : 0;
  const pointsRedeemDiscount = redeemPoints > 0 ? redeemPoints * 0.01 : 0;
  const deliveryFeeNum = orderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
  const cartTotal = subtotal - discountAmount - couponDiscount - pointsRedeemDiscount + deliveryFeeNum;
  const cashNum = parseFloat(cashIn) || 0;

  const addToCart = (p) => {
    if (parseInt(p.stock) <= 0) {
      setPosErr(t('pos.outOfStock'));
      notify('error', `"${p.name}" is out of stock!`);
      if (addNotification) addNotification('stock', `"${p.name}" is out of stock!`);
      return;
    }
    setPosErr('');
    setCartPulse(p.id);
    setTimeout(() => setCartPulse(null), 350);
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.quantity >= parseInt(p.stock)) {
          setPosErr(t('pos.insufficientStock'));
          notify('error', `Insufficient stock for "${p.name}"!`);
          if (addNotification) addNotification('stock', `Insufficient stock for "${p.name}"!`);
          return prev;
        }
        showToast('success', `✅ ${p.name} x${ex.quantity + 1}`);
        if (addNotification) addNotification('order', `${p.name} x${ex.quantity + 1} in cart (POS)`);
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      showToast('success', `✅ ${p.name} added`);
      if (addNotification) addNotification('order', `${p.name} added to cart (POS)`);
      return [...prev, { id: p.id, name: p.name, price: parseFloat(p.price), stock: parseInt(p.stock), quantity: 1, image: p.image }];
    });
  };

  const updateQty = (id, q) => {
    if (q <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(q, i.stock) } : i));
  };

  const toggleFavorite = (e, p) => {
    e.stopPropagation();
    api.toggleFavorite(p.id).then(d => {
      products.forEach(prod => { if (prod.id === d.id) prod.is_favorite = d.is_favorite; });
      setCart(prev => [...prev]);
      if (addNotification) addNotification('order', d.is_favorite ? `"${p.name}" added to favorites` : `"${p.name}" removed from favorites`);
    }).catch(() => {});
  };

  const handleApplyDiscount = () => {
    if (!selectedDiscount) return;
    api.validateDiscount(selectedDiscount, subtotal).then(d => {
      setAppliedDiscount(d); setPosErr('');
    }).catch(err => { setPosErr(err.message); setAppliedDiscount(null); });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    api.validateCoupon(couponCode.trim().toUpperCase(), subtotal).then(d => {
      setAppliedCoupon(d); setPosErr('');
    }).catch(err => { setPosErr(err.message); setAppliedCoupon(null); });
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(''); };

  const handleCheckout = () => {
    setPosErr('');
    if (!cart.length) { setPosErr(t('pos.cartEmpty') + '!'); return; }
    if (orderType === 'delivery') {
      if (!deliveryName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim()) {
        setPosErr(t('pos.customerName') + ' / ' + t('pos.phoneNumber') + ' / ' + t('pos.deliveryAddress'));
        return;
      }
    }
    if (payMethod === 'cash' && cashNum < cartTotal) { setPosErr(t('pos.cashReceived') + '!'); return; }
    const cashVal = payMethod === 'wing' ? cartTotal : cashNum;
    const orderPayload = {
      items: cart.map(c => ({ id: c.id, quantity: c.quantity })),
      cash_received: cashVal, discount_id: appliedDiscount?.id || null, customer_id: selectedCustomer || null,
      order_type: orderType, user_id: user?.id || null,
      discount_amount: discountAmount + pointsRedeemDiscount,
      coupon_code: appliedCoupon?.code || null,
      coupon_discount_amount: appliedCoupon?.discount_amount || 0,
      redeem_points: redeemPoints,
      payment_method: payMethod
    };
    if (orderType === 'delivery') {
      orderPayload.delivery_name = deliveryName.trim();
      orderPayload.delivery_phone = deliveryPhone.trim();
      orderPayload.delivery_address = deliveryAddress.trim();
      orderPayload.delivery_notes = deliveryNotes.trim();
      orderPayload.delivery_fee = deliveryFeeNum;
    }
    api.createOrder(orderPayload).then(d => {
      const receiptData = { ...d, items: [...cart], subtotal, discountAmount, couponDiscount, appliedCoupon, pointsRedeemDiscount, deliveryFee: deliveryFeeNum, total: cartTotal, payMethod, orderType };
      setReceipt(receiptData);
      notify('success', `Order ${d.invoice_number} completed!`);
      const items = cart.map(c => c.name).join(', ');
      if (addNotification) addNotification('order', `Order ${d.invoice_number} completed — $${cartTotal.toFixed(2)} (${payMethod}, ${orderType}) — ${items}`);
      setCart([]); setCashIn(''); setSearch(''); setAppliedDiscount(null);
      setSelectedDiscount(''); setAppliedCoupon(null); setCouponCode('');
      setSelectedCustomer(''); setPayMethod('cash'); setOrderType('dine_in');
      setDeliveryName(''); setDeliveryPhone(''); setDeliveryAddress(''); setDeliveryNotes(''); setDeliveryFee('2.00'); setRedeemPoints(0);
      setTimeout(() => searchRef.current?.focus(), 100);
      import('qrcode').then(QRCode => {
        QRCode.default.toDataURL(JSON.stringify({ type: 'payment', store: 'Mini Mart', invoice: d.invoice_number, total: cartTotal.toFixed(2), method: payMethod, orderType, date: new Date().toISOString() }),
          { width: 160, margin: 1, color: { dark: '#059669', light: '#ffffff' } }).then(url => setReceiptQR(url)).catch(() => {});
      });
      if (onOrderComplete) onOrderComplete();
    }).catch(err => setPosErr(err.message));
  };

  const handleHoldCart = () => {
    if (!cart.length) {
      setPosErr(t('pos.cartEmpty'));
      notify('error', t('pos.cartEmpty'));
      return;
    }
    const held = {
      id: savedCartId || Date.now(),
      items: cart,
      orderType,
      selectedCustomer,
      redeemPoints,
      appliedDiscount,
      selectedDiscount,
      appliedCoupon,
      couponCode,
      deliveryFee: orderType === 'delivery' ? deliveryFee : '2.00'
    };
    setSavedCarts(prev => [held, ...prev.filter(c => c.id !== held.id)]);
    setSavedCartId(held.id);
    setCart([]);
    setAppliedDiscount(null);
    setSelectedDiscount('');
    setAppliedCoupon(null);
    setCouponCode('');
    setSelectedCustomer('');
    setRedeemPoints(0);
    setOrderType('dine_in');
    setDeliveryFee('2.00');
    setPosErr('');
    notify('success', t('pos.orderHeld'));
    if (addNotification) addNotification('order', `Order held with ${held.items.length} item(s) for later`);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handleRecallCart = (held) => {
    const missing = held.items.filter(i => {
      const p = products.find(pd => pd.id === i.id);
      return !p || p.stock < i.quantity;
    });
    setCart(held.items.filter(i => !missing.includes(i)));
    setOrderType(held.orderType || 'dine_in');
    setSelectedCustomer(held.selectedCustomer || '');
    setRedeemPoints(held.redeemPoints || 0);
    setAppliedDiscount(held.appliedDiscount || null);
    setSelectedDiscount(held.selectedDiscount || '');
    setAppliedCoupon(held.appliedCoupon || null);
    setCouponCode(held.couponCode || '');
    if (held.orderType === 'delivery') setDeliveryFee(held.deliveryFee || '2.00');
    setSavedCartId(held.id);
    setPosErr('');
    if (missing.length) {
      notify('error', `${missing.map(m => m.name).join(', ')} unavailable - removed from order`);
    } else {
      notify('success', 'Order recalled - ready to continue');
    }
    if (addNotification) addNotification('order', missing.length
      ? `Recalled held order - removed ${missing.length} unavailable item(s)`
      : 'Recalled held order');
  };

  const handleRemoveHold = (id) => {
    setSavedCarts(prev => prev.filter(c => c.id !== id));
    if (savedCartId === id) setSavedCartId(null);
    notify('success', t('pos.heldOrderRemoved'));
  };

  const clearHeldCarts = () => {
    setSavedCarts([]);
    setSavedCartId(null);
    notify('success', t('pos.allHeldOrdersCleared'));
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    const q = val.trim().toLowerCase();
    if (!q) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const exact = products.filter(p => p.barcode && p.barcode.toLowerCase() === q);
    if (exact.length === 1) { addToCart(exact[0]); setSearch(''); setShowSuggestions(false); setTimeout(() => searchRef.current?.focus(), 50); return; }
    const matches = products.filter(p => {
      const ms = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q));
      return ms && parseInt(p.stock) > 0;
    }).slice(0, 5);
    setSearchSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSuggestionClick = (p) => {
    addToCart(p);
    setSearch('');
    setShowSuggestions(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const printReceipt = () => {
    if (!receipt) return;
    const w = window.open('', '_blank', 'width=350,height=600');
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;padding:15px;font-size:12px;max-width:280px;margin:0 auto}hr{border:none;border-top:1px dashed #333;margin:8px 0}.c{text-align:center}.b{font-weight:bold}</style></head><body><div class="c b" style="font-size:16px">Mini Mart</div><hr/><div class="c" style="font-size:10px">Invoice: ${receipt.invoice_number}</div><div class="c" style="font-size:10px">${new Date().toLocaleString()}</div><div class="c" style="font-size:10px">Payment: ${receipt.payMethod === 'wing' ? 'Wing Bank' : 'Cash'}${receipt.orderType ? ' | ' + receipt.orderType.replace('_', ' ').toUpperCase() : ''}</div><hr/>${(receipt.items || []).map(i => `<div style="display:flex;justify-content:space-between"><span>${i.name} x${i.quantity}</span><span>$${(parseFloat(i.price) * parseInt(i.quantity)).toFixed(2)}</span></div>`).join('')}<hr/>${receipt.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-$${receipt.discountAmount.toFixed(2)}</span></div>` : ''}${receipt.couponDiscount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Coupon (${receipt.appliedCoupon ? receipt.appliedCoupon.code : 'code'}):</span><span>-$${receipt.couponDiscount.toFixed(2)}</span></div>` : ''}${receipt.deliveryFee > 0 ? `<div style="display:flex;justify-content:space-between"><span>Delivery Fee:</span><span>$${receipt.deliveryFee.toFixed(2)}</span></div>` : ''}<div style="display:flex;justify-content:space-between"><span class="b">Total:</span><span class="b" style="font-size:14px">$${parseFloat(receipt.total || receipt.total_amount).toFixed(2)}</span></div><div style="display:flex;justify-content:space-between"><span>Cash:</span><span>$${parseFloat(receipt.cash_received).toFixed(2)}</span></div><div style="display:flex;justify-content:space-between"><span class="b">Change:</span><span class="b">$${parseFloat(receipt.cash_return).toFixed(2)}</span></div>${receipt.points_earned > 0 ? `<div style="display:flex;justify-content:space-between"><span>Points Earned:</span><span>+${receipt.points_earned}</span></div>` : ''}</body></html>`);
    w.document.close(); w.print();
  };

  const sendToTelegram = () => {
    if (!receipt || sendingTelegram) return;
    setSendingTelegram(true);
    const typeEmoji = { dine_in: '🍽️', takeaway: '🥡', delivery: '🚚' };
    const items = receipt.items.map(i => `  ${i.name} x${i.quantity}  $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    const msg = [
      `${typeEmoji[receipt.orderType] || '🛒'} NEW SALE`,
      `━━━━━━━━━━━━━━━━━━`,
      `🧾 Invoice: ${receipt.invoice_number}`,
      `📦 Type: ${receipt.orderType}`,
      '',
      `Items:`,
      items,
      '',
      `━━━━━━━━━━━━━━━━━━`,
      `💰 Total: ${formatPrice(parseFloat(receipt.total || receipt.total_amount))}`,
      `💵 Received: ${formatPrice(parseFloat(receipt.cash_received))}`,
      `🔄 Change: ${formatPrice(parseFloat(receipt.cash_return))}`,
      `💳 Method: ${receipt.payMethod === 'wing' ? 'Wing Bank' : 'Cash'}`,
      `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
    api.sendTelegram(msg).then(() => {
      notify('success', t('pos.receiptSent'));
      setSendingTelegram(false);
    }).catch(err => {
      notify('error', err.message || 'Failed to send to Telegram');
      setSendingTelegram(false);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#F4F6F8] overflow-hidden">
      {/* ── Notification Toast ── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[1100] max-w-sm w-auto overflow-hidden flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold animate-slideUp ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span className="text-lg shrink-0">{notification.type === 'success' ? '✓' : '✕'}</span>
          <span className="whitespace-nowrap">{notification.message}</span>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold pointer-events-none animate-slideUp ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}
          style={{ animation: toast.exiting ? 'toastOut 0.3s ease forwards' : undefined }}>
          <span className="text-lg shrink-0">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="whitespace-nowrap">{toast.message}</span>
        </div>
      )}

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── POS Left Sidebar ── */}
        <aside className={`
          w-[220px] bg-white border-r border-gray-200 flex flex-col shrink-0
          lg:relative lg:translate-x-0
          fixed top-0 left-0 h-full z-[1001] transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-[60px] flex items-center gap-3 px-5 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-lg">🛒</span>
            </div>
            <div className="flex-1">
              <span className="text-[15px] font-bold text-gray-900 tracking-tight">MART POS</span>
              <span className="block text-[10px] text-gray-400 font-medium -mt-0.5">Retail System</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {POS_NAV.map(item => (
              <button key={item.key}
                onClick={() => { setPosTab(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  posTab === item.key
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-2">
            {/* Currency Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button onClick={() => setCurrency('usd')}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  currency === 'usd' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                $ USD
              </button>
              <button onClick={() => setCurrency('khr')}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  currency === 'khr' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                ៛ KHR
              </button>
            </div>
            <p className="text-[9px] text-center text-gray-400">Rate: 1 USD = {KHR_RATE.toLocaleString()} KHR</p>

            <button onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
              <span className="text-lg">🏠</span>
              Back to Admin
            </button>
            <div className="px-3 py-2 rounded-lg bg-gray-50">
              <p className="text-[11px] font-semibold text-gray-700">{user?.name || 'Cashier'}</p>
              <p className="text-[10px] text-gray-400">{user?.role || 'Staff'}</p>
            </div>
          </div>
        </aside>

        {/* ── Content Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Top Filter Bar (checkout only) ── */}
          {posTab === 'checkout' && (
          <header className="bg-white border-b border-gray-200 px-4 lg:px-5 py-3">
            <div className="flex items-center gap-4 mb-3">
              {/* Hamburger (mobile only) */}
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 shrink-0 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="relative flex-1" ref={searchWrapRef}>
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input ref={searchRef} value={search} onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search item name, brand, or scan barcode..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="pos-search-dropdown">
                    {searchSuggestions.map(p => (
                      <div key={p.id} className="pos-search-item" onClick={() => handleSuggestionClick(p)}>
                        <div className="pos-search-item-img">
                          {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-lg opacity-60">📦</span>}
                        </div>
                        <div className="pos-search-item-info">
                          <p className="pos-search-item-name">{p.name}</p>
                          <p className="pos-search-item-price">{formatPrice(p.price)}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">stk: {p.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[13px] text-gray-500 shrink-0 font-medium hidden sm:block">{posProducts.length} items</div>
              <button onClick={() => setShowSoldOut(!showSoldOut)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 hidden sm:block ${showSoldOut ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {showSoldOut ? '👁 Hide Sold Out' : '👁 Show Sold Out'}
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  categoryFilter === 'all' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                🏪 All Items ({products.filter(p => showSoldOut || parseInt(p.stock) > 0).length})
              </button>
              {categories.map(c => {
                const count = products.filter(p => String(p.category_id) === String(c.id) && (showSoldOut || parseInt(p.stock) > 0)).length;
                return (
                  <button key={c.id} onClick={() => setCategoryFilter(String(c.id))}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                      categoryFilter === String(c.id) ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {getCategoryEmoji(c.name)} {c.name} ({count})
                  </button>
                );
              })}
              <button onClick={() => setFavFilter(favFilter === 'favorites' ? 'all' : 'favorites')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  favFilter === 'favorites' ? 'bg-rose-500 text-white shadow-sm shadow-rose-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                ♥ Favorites
              </button>
            </div>
          </header>
          )}

          {/* ── Middle: Product Grid + Cart Panel ── */}
          <div className="flex-1 flex overflow-hidden">
            {/* ── Content Area (tab-based) ── */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4">

              {/* ═══ CHECKOUT TAB ═══ */}
              {posTab === 'checkout' && (
                <>
                  {posProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-4">🔍</div>
                      <p className="text-sm font-semibold text-gray-500">No products found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3">
                      {posProducts.map(p => {
                        const inCart = cart.find(i => i.id === p.id);
                        const stock = parseInt(p.stock);
                        const discountPercent = p.discount_percent || p.discount || 0;
                        const originalPrice = discountPercent > 0 ? (parseFloat(p.price) / (1 - discountPercent / 100)) : null;
                        return (
                          <div key={p.id}
                            className={`pos-card ${inCart ? 'in-cart' : ''} ${stock === 0 ? 'opacity-50' : ''} ${cartPulse === p.id ? 'pos-card-add-pulse' : ''}`}>
                            <div className="pos-card-image">
                              {p.image
                                ? <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                                : <div className="pos-card-image-placeholder">📦</div>
                              }
                              {discountPercent > 0 && (
                                <div className="pos-discount-badge">{discountPercent}% OFF</div>
                              )}
                              <span role="button" tabIndex={0}
                                aria-label={p.is_favorite ? `Remove ${p.name} from favorites` : `Add ${p.name} to favorites`}
                                onClick={(e) => toggleFavorite(e, p)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavorite(e, p); } }}
                                className={`pos-card-fav ${p.is_favorite ? 'active' : ''}`}>
                                {p.is_favorite ? '♥' : '♡'}
                              </span>
                              <span className={`pos-card-stock ${getStockBadgeClass(p.stock)}`}>
                                {stock <= 0 ? 'Sold Out' : `In Stock: ${stock}`}
                              </span>
                            </div>
                            <div className="pos-card-body">
                              <p className="pos-card-name" title={p.name}>{p.name}</p>
                              {p.barcode && <p className="pos-card-meta font-mono">{p.barcode}</p>}
                              {(p.category_name || p.unit) && (
                                <p className="pos-card-meta">{p.category_name || ''}{p.category_name && p.unit ? ' · ' : ''}{p.unit || ''}</p>
                              )}
                              <div className="pos-card-price-row">
                                <span className="pos-card-price">{formatPrice(p.price)}</span>
                                {originalPrice && (
                                  <span className="pos-card-original-price">{formatPrice(originalPrice)}</span>
                                )}
                              </div>
                              {inCart ? (
                                <div className="pos-qty-stepper" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => updateQty(p.id, inCart.quantity - 1)}>−</button>
                                  <span>{inCart.quantity}</span>
                                  <button onClick={() => updateQty(p.id, inCart.quantity + 1)}>+</button>
                                </div>
                              ) : (
                                <button className="pos-add-to-dish" onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={stock <= 0}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ═══ INVENTORY TAB ═══ */}
              {posTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Inventory Overview</h2>
                    <button onClick={() => onNavigate('products')} className="btn-primary text-sm">Manage Products</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">📦</div>
                      <p className="text-2xl font-extrabold text-gray-800">{products.length}</p>
                      <p className="text-xs text-gray-400">Total Products</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-2xl font-extrabold text-emerald-600">{products.filter(p => parseInt(p.stock) > 10).length}</p>
                      <p className="text-xs text-gray-400">In Stock</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">⚠️</div>
                      <p className="text-2xl font-extrabold text-amber-600">{products.filter(p => { const s = parseInt(p.stock); return s > 0 && s <= 10; }).length}</p>
                      <p className="text-xs text-gray-400">Low Stock</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">🚫</div>
                      <p className="text-2xl font-extrabold text-red-600">{products.filter(p => parseInt(p.stock) <= 0).length}</p>
                      <p className="text-xs text-gray-400">Sold Out</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">Low Stock Items</p>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                      {products.filter(p => parseInt(p.stock) <= 10).length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">All products are well stocked</div>
                      ) : products.filter(p => parseInt(p.stock) <= 10).map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">📦</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[11px] text-gray-400">{p.category_name || 'Uncategorized'}</p>
                          </div>
                          <span className={`text-[12px] font-bold px-2 py-1 rounded-lg ${parseInt(p.stock) <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {parseInt(p.stock) <= 0 ? 'Sold Out' : `${p.stock} left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SALES HISTORY TAB ═══ */}
              {posTab === 'sales' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Sales History</h2>
                    <button onClick={() => onNavigate('orders')} className="btn-primary text-sm">View All Orders</button>
                  </div>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <svg className="w-6 h-6 animate-spin mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Loading orders...
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {orders.length === 0 ? (
                          <div className="px-4 py-12 text-center text-gray-400 text-sm">No orders yet</div>
                        ) : orders.slice(0, 20).map(o => (
                          <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${
                              o.order_type === 'delivery' ? 'bg-blue-100' : o.order_type === 'takeaway' ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}>
                              {o.order_type === 'delivery' ? '🚚' : o.order_type === 'takeaway' ? '🛍️' : '🏪'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800">{o.invoice_number}</p>
                              <p className="text-[11px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[13px] font-bold text-gray-800">{formatPrice(o.total_amount)}</p>
                              <p className={`text-[10px] font-medium capitalize ${o.payment_method === 'wing' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                {o.payment_method === 'wing' ? '💳 Card' : '💵 Cash'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ LOYALTY TAB ═══ */}
              {posTab === 'loyalty' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Customer Loyalty</h2>
                    <button onClick={() => onNavigate('customers')} className="btn-primary text-sm">Manage Customers</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">👥</div>
                      <p className="text-2xl font-extrabold text-gray-800">{loyaltyCustomers.length}</p>
                      <p className="text-xs text-gray-400">Total Customers</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">⭐</div>
                      <p className="text-2xl font-extrabold text-amber-600">{loyaltyCustomers.reduce((s, c) => s + (parseInt(c.points) || 0), 0)}</p>
                      <p className="text-xs text-gray-400">Total Points</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-2">🏆</div>
                      <p className="text-2xl font-extrabold text-emerald-600">{loyaltyCustomers.filter(c => parseInt(c.points) >= 100).length}</p>
                      <p className="text-xs text-gray-400">Gold Members (100+ pts)</p>
                    </div>
                  </div>
                  {loyaltyLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <svg className="w-6 h-6 animate-spin mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Loading customers...
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700">Top Customers by Points</p>
                      </div>
                      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {loyaltyCustomers.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">No customers yet</div>
                        ) : loyaltyCustomers.sort((a, b) => (parseInt(b.points) || 0) - (parseInt(a.points) || 0)).slice(0, 15).map(c => (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                              (parseInt(c.points) || 0) >= 100 ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              {(c.name || c.username || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800 truncate">{c.name || c.username}</p>
                              <p className="text-[11px] text-gray-400">{c.phone || c.email || 'No contact'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[14px] font-bold text-amber-600">{c.points || 0} ⭐</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SETTINGS TAB ═══ */}
              {posTab === 'settings' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-800">POS Settings</h2>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Currency Display</label>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrency('usd')}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${currency === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          $ USD
                        </button>
                        <button onClick={() => setCurrency('khr')}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${currency === 'khr' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          ៛ KHR
                        </button>
                        <button onClick={() => setCurrency('dual')}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${currency === 'dual' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          Both
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Rate: 1 USD = {KHR_RATE.toLocaleString()} KHR</p>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Quick Actions</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onNavigate('dashboard')}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                          <span className="text-xl">🏠</span>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-700">Dashboard</p>
                            <p className="text-[10px] text-gray-400">View analytics</p>
                          </div>
                        </button>
                        <button onClick={() => onNavigate('products')}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                          <span className="text-xl">📦</span>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-700">Products</p>
                            <p className="text-[10px] text-gray-400">Manage inventory</p>
                          </div>
                        </button>
                        <button onClick={() => onNavigate('orders')}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                          <span className="text-xl">📋</span>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-700">All Orders</p>
                            <p className="text-[10px] text-gray-400">Full order history</p>
                          </div>
                        </button>
                        <button onClick={() => onNavigate('customers')}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                          <span className="text-xl">👥</span>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-700">Customers</p>
                            <p className="text-[10px] text-gray-400">Manage customers</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
                          {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-700">{user?.full_name || user?.username || 'Cashier'}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{user?.role || 'Staff'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* ── Cart Panel (desktop) ── */}
            <div className="hidden lg:flex w-[380px] bg-white border-l border-gray-200 flex-col shrink-0">
              {/* Order Context Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <span className="text-sm">🧾</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">
                      Transaction #{Date.now().toString().slice(-4)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {selectedCustomer ? customers.find(c => String(c.id) === String(selectedCustomer))?.name || 'Customer' : 'Customer: Walk-in'}
                    </p>
                  </div>
                </div>
                {cart.length > 0 && (
                  <div className="flex gap-1.5">
                    <button onClick={handleHoldCart}
                      className="text-[11px] font-medium px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                      Hold
                    </button>
                    <button onClick={() => { setCart([]); setAppliedDiscount(null); setAppliedCoupon(null); setCouponCode(''); setPosErr(''); }}
                      className="text-[11px] text-red-500 hover:text-red-600 font-medium">Clear</button>
                  </div>
                )}
              </div>

              {/* Customer Select */}
              <div className="px-4 py-2 border-b border-gray-100 shrink-0">
                <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); setRedeemPoints(0); }}
                  className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points || 0} pts)</option>)}
                </select>
              </div>

              {/* Segmented Control: Order Type */}
              <div className="flex gap-1 p-1.5 mx-4 mt-3 bg-gray-100 rounded-xl shrink-0">
                <button onClick={() => setOrderType('dine_in')}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    orderType === 'dine_in' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  🏪 In-Store
                </button>
                <button onClick={() => setOrderType('takeaway')}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    orderType === 'takeaway' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  🛍️ Pickup
                </button>
                <button onClick={() => setOrderType('delivery')}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    orderType === 'delivery' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  🚚 Delivery
                </button>
              </div>

              {/* Delivery Info */}
              {orderType === 'delivery' && (
                <div className="mx-4 mt-2 space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Delivery Info</p>
                  <input value={deliveryName} onChange={e => setDeliveryName(e.target.value)} placeholder="Customer Name *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="Phone Number *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Delivery Address *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder="Notes" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">Fee</label>
                    <input type="number" step="0.50" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              )}

              {/* ── Scrollable Content: Cart Items + Summary + Payment + QR ── */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Cart Items */}
                <div className="px-4 py-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl mb-3">🛒</div>
                      <p className="text-[13px] font-semibold text-gray-500">Cart is empty</p>
                      <p className="text-[11px] text-gray-400 mt-1">Click products to add them</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{formatPrice(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">−</button>
                        <span className="w-7 text-center text-[13px] font-bold text-gray-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">+</button>
                      </div>
                      <p className="text-[12px] font-bold text-gray-800 w-20 text-right shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Discount / Coupon */}
                {cart.length > 0 && (
                  <div className="px-4 py-2 space-y-2 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input value={selectedDiscount} onChange={e => setSelectedDiscount(e.target.value)}
                        placeholder="Discount code" className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      <button onClick={handleApplyDiscount} className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-colors shrink-0">Apply</button>
                    </div>
                    <div className="flex gap-2">
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code" className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      {appliedCoupon ? (
                        <button onClick={handleRemoveCoupon} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium hover:bg-red-100 transition-colors shrink-0">Remove</button>
                      ) : (
                        <button onClick={handleApplyCoupon} className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-colors shrink-0">Apply</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                  {posErr && (
                    <div className="bg-red-50 text-red-600 text-[12px] font-medium px-3 py-2 rounded-lg border border-red-100">{posErr}</div>
                  )}
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Sub Total</span>
                    <span className="font-semibold text-gray-700">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Discount ({appliedDiscount.code})</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Coupon ({appliedCoupon.code})</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {pointsRedeemDiscount > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Points ({redeemPoints} pts)</span>
                      <span className="font-semibold text-amber-600">-{formatPrice(pointsRedeemDiscount)}</span>
                    </div>
                  )}
                  {orderType === 'delivery' && deliveryFeeNum > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Delivery Fee</span>
                      <span className="font-semibold text-blue-600">{formatPrice(deliveryFeeNum)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-[15px] font-bold text-gray-800">Total Amount</span>
                    <span className="text-[18px] font-extrabold text-emerald-600">{formatDual(cartTotal)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="px-4 pb-2">
                  <div className="flex gap-2">
                    <div className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      payMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => setPayMethod('cash')}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        payMethod === 'cash' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>💵</div>
                      <span className={`text-[11px] font-semibold ${payMethod === 'cash' ? 'text-emerald-700' : 'text-gray-500'}`}>Cash</span>
                    </div>
                    <div className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      payMethod === 'wing' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => setPayMethod('wing')}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        payMethod === 'wing' ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>💳</div>
                      <span className={`text-[11px] font-semibold ${payMethod === 'wing' ? 'text-emerald-700' : 'text-gray-500'}`}>Card</span>
                    </div>
                    <div className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      payMethod === 'qr' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => setPayMethod('qr')}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        payMethod === 'qr' ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}>📱</div>
                      <span className={`text-[11px] font-semibold ${payMethod === 'qr' ? 'text-emerald-700' : 'text-gray-500'}`}>QR Pay</span>
                    </div>
                  </div>
                </div>

                {/* ── QR Code Section ── */}
                {payMethod === 'qr' && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-col items-center p-5 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
                      {/* Scan to Pay header */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </div>
                        <p className="text-[13px] font-bold text-gray-800">Scan to Pay</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-4">Use your banking app to scan</p>

                      {/* QR Code Image */}
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 w-full flex justify-center">
                        <img src={qrCodeImage} alt="Payment QR Code"
                          className="w-[220px] h-[220px] max-w-full object-contain" />
                      </div>

                      {/* Amount Display */}
                      <div className="mt-4 w-full bg-emerald-50 rounded-xl py-3 px-4 text-center border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-0.5">Amount to Pay</p>
                        <p className="text-[20px] font-extrabold text-emerald-700">{formatDual(cartTotal)}</p>
                      </div>

                      {/* Branding Area */}
                      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-100 w-full">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                          <span className="text-sm">🏦</span>
                          <span className="text-[11px] font-bold text-blue-700">Wing Bank</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                          <span className="text-sm">💳</span>
                          <span className="text-[11px] font-bold text-purple-700">KHQR</span>
                        </div>
                      </div>

                      {/* Instruction */}
                      <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
                        Scan this QR code to complete payment
                      </p>

                      {/* Status placeholder */}
                      <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-100 w-full">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-amber-700">Waiting for payment...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Input */}
                {payMethod === 'cash' && (
                  <div className="px-4 pb-4">
                    <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Cash Received</label>
                    <input type="number" step="0.01" value={cashIn} onChange={e => setCashIn(e.target.value)}
                      placeholder="0.00" className="w-full text-lg font-bold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    {cashNum > 0 && (
                      <p className="text-[14px] font-bold text-emerald-600 mt-1.5">
                        Change: {formatPrice(cashNum - cartTotal)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Fixed Checkout Button at Bottom ── */}
              <div className="p-4 pt-3 border-t border-gray-100 shrink-0 bg-white">
                <button onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="pos-checkout-btn">
                  Complete Sale & Print Receipt — {formatDual(cartTotal)}
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom Bar: Held Carts ── */}
          <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-3 overflow-x-auto">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Held:</span>
            {savedCarts.length === 0 ? (
              <span className="text-[12px] text-gray-400">No held carts</span>
            ) : savedCarts.map(held => {
              const total = held.items.reduce((s, i) => s + i.price * i.quantity, 0);
              const typeEmoji = { dine_in: '🏪', takeaway: '🛍️', delivery: '🚚' };
              return (
                <div key={held.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                  <span className="text-sm">{typeEmoji[held.orderType] || '🛒'}</span>
                  <span className="text-[11px] font-bold text-gray-700">{held.items.length} item{held.items.length > 1 ? 's' : ''}</span>
                  <span className="text-[11px] font-bold text-amber-700">{formatPrice(total)}</span>
                  <button onClick={() => handleRecallCart(held)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                    Recall
                  </button>
                  <button onClick={() => handleRemoveHold(held.id)}
                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold">✕</button>
                </div>
              );
            })}
            {savedCarts.length > 1 && (
              <button onClick={clearHeldCarts}
                className="text-[11px] text-gray-400 hover:text-red-500 font-medium shrink-0">Clear All</button>
            )}
          </footer>
        </div>
      </div>

      {/* ── Floating Cart Button (mobile only, checkout tab) ── */}
      {cart.length > 0 && posTab === 'checkout' && (
        <button onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-[900] bg-emerald-500 text-white rounded-full px-5 py-3.5 shadow-2xl shadow-emerald-500/30 flex items-center gap-3 hover:bg-emerald-600 active:scale-95 transition-all">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-400 text-[10px] font-bold flex items-center justify-center">{cart.length}</span>
          </div>
          <span className="text-sm font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* ── Mobile Cart Modal ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-0 bg-white flex flex-col animate-slideUp">
            {/* Mobile Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-sm">🧾</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Your Cart</p>
                  <p className="text-[10px] text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {cart.length > 0 && (
                  <button onClick={handleHoldCart}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Hold
                  </button>
                )}
                <button onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Customer Select */}
            <div className="px-4 py-2 border-b border-gray-100 shrink-0">
              <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); setRedeemPoints(0); }}
                className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points || 0} pts)</option>)}
              </select>
            </div>

            {/* Order Type */}
            <div className="flex gap-1 p-1.5 mx-4 mt-2 bg-gray-100 rounded-xl shrink-0">
              <button onClick={() => setOrderType('dine_in')}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${orderType === 'dine_in' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                🏪 In-Store
              </button>
              <button onClick={() => setOrderType('takeaway')}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${orderType === 'takeaway' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                🛍️ Pickup
              </button>
              <button onClick={() => setOrderType('delivery')}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${orderType === 'delivery' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                🚚 Delivery
              </button>
            </div>

            {/* Delivery Info */}
            {orderType === 'delivery' && (
              <div className="mx-4 mt-2 space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
                <input value={deliveryName} onChange={e => setDeliveryName(e.target.value)} placeholder="Customer Name *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="Phone Number *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Delivery Address *" className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            )}

            {/* Mobile Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl mb-3">🛒</div>
                  <p className="text-[13px] font-semibold text-gray-500">Cart is empty</p>
                  <p className="text-[11px] text-gray-400 mt-1">Tap products to add them</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{formatPrice(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold">−</button>
                    <span className="w-7 text-center text-[13px] font-bold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold">+</button>
                  </div>
                  <p className="text-[12px] font-bold text-gray-800 w-20 text-right shrink-0">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Mobile Cart Footer */}
            {cart.length > 0 && (
              <div className="shrink-0 border-t border-gray-200 bg-white">
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Sub Total</span>
                    <span className="font-semibold text-gray-700">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Discount</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Coupon</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-[15px] font-bold text-gray-800">Total</span>
                    <span className="text-[18px] font-extrabold text-emerald-600">{formatDual(cartTotal)}</span>
                  </div>
                </div>
                {/* Payment */}
                <div className="px-4 pb-2">
                  <div className="flex gap-2">
                    <button onClick={() => setPayMethod('cash')}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all ${payMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      💵 Cash
                    </button>
                    <button onClick={() => setPayMethod('wing')}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all ${payMethod === 'wing' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      💳 Card
                    </button>
                    <button onClick={() => setPayMethod('qr')}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all ${payMethod === 'qr' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      📱 QR Pay
                    </button>
                  </div>
                </div>
                {/* Mobile QR Code Display */}
                {payMethod === 'qr' && (
                  <div className="px-4 pb-2">
                    <div className="flex flex-col items-center p-5 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </div>
                        <p className="text-[13px] font-bold text-gray-800">Scan to Pay</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-4">Use your banking app to scan</p>
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                        <img src={qrCodeImage} alt="Payment QR Code" className="w-[200px] h-[200px] object-contain" />
                      </div>
                      <div className="mt-4 w-full bg-emerald-50 rounded-xl py-3 px-4 text-center border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-0.5">Amount to Pay</p>
                        <p className="text-[20px] font-extrabold text-emerald-700">{formatDual(cartTotal)}</p>
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100 w-full">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                          <span className="text-sm">🏦</span>
                          <span className="text-[11px] font-bold text-blue-700">Wing Bank</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                          <span className="text-sm">💳</span>
                          <span className="text-[11px] font-bold text-purple-700">KHQR</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-3 text-center">Scan this QR code to complete payment</p>
                      <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-100 w-full">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-amber-700">Waiting for payment...</span>
                      </div>
                    </div>
                  </div>
                )}
                {payMethod === 'cash' && (
                  <div className="px-4 pb-2">
                    <input type="number" step="0.01" value={cashIn} onChange={e => setCashIn(e.target.value)}
                      placeholder="Cash received" className="w-full text-lg font-bold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    {cashNum > 0 && (
                      <p className="text-[14px] font-bold text-emerald-600 mt-1.5">Change: {formatPrice(cashNum - cartTotal)}</p>
                    )}
                  </div>
                )}
                <div className="px-4 pb-4 pt-2">
                  <button onClick={() => { handleCheckout(); if (!posErr) setCartOpen(false); }}
                    disabled={cart.length === 0}
                    className="pos-checkout-btn">
                    Complete Sale — {formatDual(cartTotal)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      <Modal open={!!receipt} onClose={() => { setReceipt(null); setReceiptQR(''); }} title="Order Complete" maxWidth="420px">
        {receipt && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Invoice</p>
              <p className="font-mono font-bold text-gray-800">{receipt.invoice_number}</p>
            </div>
            {receiptQR && <img src={receiptQR} alt="QR" className="mx-auto rounded-xl" />}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-left text-sm">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                <span>Total</span><span>{formatDual(parseFloat(receipt.total || receipt.total_amount))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{receipt.payMethod === 'wing' ? 'Card' : 'Cash'}</span>
                <span>{formatDual(parseFloat(receipt.cash_received))}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Change</span><span>{formatPrice(parseFloat(receipt.cash_return))}</span>
              </div>
              {receipt.points_earned > 0 && (
                <div className="flex justify-between text-amber-600 font-medium pt-1 border-t border-gray-200">
                  <span>Points Earned</span><span>+{receipt.points_earned} ⭐</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={printReceipt} className="flex-1 py-2.5 rounded-xl border-2 border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors">Print Receipt</button>
              <button onClick={sendToTelegram} disabled={sendingTelegram}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  sendingTelegram ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                {sendingTelegram ? 'Sending...' : 'Send to Telegram'}
              </button>
              <button onClick={() => { setReceipt(null); setReceiptQR(''); }} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
