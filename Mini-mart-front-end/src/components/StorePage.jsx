import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Modal, LoadingSpinner, EmptyState } from './ui';

const DELIVERY_FEE = '2.00';
const POINTS_VALUE = 0.01;

function Money({ n }) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export default function StorePage({ onExit }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [resultQR, setResultQR] = useState('');
  const [resultMeta, setResultMeta] = useState(null);

  const [orderType, setOrderType] = useState('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(DELIVERY_FEE);
  const [payMethod, setPayMethod] = useState('cash');
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [member, setMember] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.allSettled([
      api.getProducts().then(setProducts),
      api.getCategories().then(setCategories),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      const ms = p.name.toLowerCase().includes(q);
      const mc = category === 'all' || String(p.category_id) === String(category);
      return ms && mc;
    });
  }, [products, search, category]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const promoDiscount = appliedPromo
    ? (appliedPromo.type === 'percent' ? subtotal * parseFloat(appliedPromo.value) / 100 : Math.min(parseFloat(appliedPromo.value), subtotal))
    : 0;
  const pointsDiscount = redeemPoints > 0 ? redeemPoints * POINTS_VALUE : 0;
  const deliveryFeeNum = orderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
  const total = subtotal - promoDiscount - pointsDiscount + deliveryFeeNum;

  const addToCart = (p, qty = 1) => {
    if (parseInt(p.stock) <= 0) {
      notify('error', `"${p.name}" is out of stock`);
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        const next = ex.quantity + qty;
        if (next > parseInt(p.stock)) {
          notify('error', `Only ${p.stock} left of "${p.name}"`);
          return prev;
        }
        return prev.map(i => i.id === p.id ? { ...i, quantity: next } : i);
      }
      return [...prev, { id: p.id, name: p.name, price: parseFloat(p.price), stock: parseInt(p.stock), quantity: qty, image: p.image }];
    });
    notify('success', `"${p.name}" added to cart`);
  };

  const updateQty = (id, q) => {
    if (q <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(q, i.stock) } : i));
  };

  const openDetail = (p) => { setDetail(p); setDetailQty(1); };

  const applyPromo = () => {
    if (!promo.trim()) { setFormErr('Enter a promo code'); return; }
    api.validateDiscount(promo.trim(), subtotal).then(d => {
      setAppliedPromo(d); setFormErr('');
      notify('success', `Promo "${d.code}" applied!`);
    }).catch(err => { setFormErr(err.message); setAppliedPromo(null); });
  };

  const lookupMember = async () => {
    if (!phone.trim() || phone.trim().length < 7) { setMember(null); setRedeemPoints(0); return; }
    try {
      const c = await api.lookupCustomer({ name: name.trim() || undefined, phone: phone.trim() });
      setMember(c);
      setRedeemPoints(0);
      if (c.is_new) notify('success', `Welcome, new member! 🎉`);
      else notify('success', `Welcome back, ${c.name || 'member'}! (${c.points} pts)`);
    } catch {
      setMember(null);
    }
  };

  const openCheckout = () => {
    if (!cart.length) return;
    setCheckoutOpen(true);
    setCartOpen(false);
    setFormErr('');
  };

  const placeOrder = () => {
    setFormErr('');
    if (!cart.length) { setFormErr('Your cart is empty'); return; }
    if (!name.trim() || !phone.trim()) { setFormErr('Please enter your name and phone number'); return; }
    if (orderType === 'delivery' && !address.trim()) { setFormErr('Please enter your delivery address'); return; }

    const payload = {
      items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
      cash_received: total,
      discount_id: appliedPromo?.id || null,
      discount_amount: promoDiscount + pointsDiscount,
      redeem_points: redeemPoints,
      customer_id: member?.id || null,
      user_id: null,
      order_type: orderType,
      payment_method: payMethod,
    };
    if (orderType === 'delivery') {
      payload.delivery_name = name.trim();
      payload.delivery_phone = phone.trim();
      payload.delivery_address = address.trim();
      payload.delivery_notes = notes.trim();
      payload.delivery_fee = deliveryFeeNum;
    }

    setPlacing(true);
    api.createOrder(payload).then(d => {
      setResult(d);
      setResultMeta({ orderType, payMethod });
      setCart([]);
      setCartOpen(false);
      setCheckoutOpen(false);
      setAppliedPromo(null); setPromo('');
      setRedeemPoints(0); setMember(null);
      setName(''); setPhone(''); setAddress(''); setNotes('');
      setOrderType('delivery'); setPayMethod('cash'); setDeliveryFee(DELIVERY_FEE);
      notify('success', `Order ${d.invoice_number} placed!`);
      import('qrcode').then(QRCode => {
        QRCode.default.toDataURL(JSON.stringify({ type: 'order', store: 'Mini Mart', invoice: d.invoice_number, total: d.total_amount, date: new Date().toISOString() }),
          { width: 150, margin: 1, color: { dark: '#059669', light: '#ffffff' } }).then(url => setResultQR(url)).catch(() => {});
      });
    }).catch(err => { setFormErr(err.message); setPlacing(false); });
  };

  const stockCount = (p) => {
    const inCart = cart.find(i => i.id === p.id);
    return (inCart?.quantity || 0);
  };

  return (
    <div className="min-h-screen bg-emerald-50/30">
      {toast && (
        <div className={`fixed top-4 right-4 z-[1100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold animate-slideUp ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 h-[68px] bg-white/90 backdrop-blur-xl border-b border-emerald-100 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
            <img src="/logo-white.svg" alt="Mini Mart" className="w-7 h-7" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-emerald-800 leading-tight block">Mini Mart</span>
            <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Online Store</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCartOpen(true)}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-orange-200">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <button onClick={onExit}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 transition-all">
            🔐 Staff Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #10b981 75%, #34d399 100%)' }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full animate-float" />
        <div className="absolute bottom-0 right-10 w-40 h-40 bg-orange-400/10 rounded-full animate-float2" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Fresh groceries,<br />great prices 🛒
          </h1>
          <p className="mt-3 text-emerald-100/85 max-w-lg leading-relaxed">
            Order online for quick pickup or free delivery around town. Earn loyal points on every purchase!
          </p>
          <div className="mt-7 max-w-lg relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur text-slate-800 text-sm placeholder-slate-400 shadow-xl shadow-emerald-900/10 outline-none focus:ring-4 ring-orange-300/40 transition-all" />
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          <button onClick={() => setCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              category === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'
            }`}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(String(c.id))}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === String(c.id) ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'
              }`}>
              {c.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 font-medium mb-4">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <LoadingSpinner text="Loading products..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No products found" description="Try a different search or category" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => {
              const out = parseInt(p.stock) <= 0;
              const inCartQty = stockCount(p);
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-emerald-100/60 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <button onClick={() => openDetail(p)} className="relative h-40 sm:h-44 bg-emerald-50 flex items-center justify-center overflow-hidden group">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <span className="text-5xl opacity-40">📦</span>}
                    {out && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow">OUT OF STOCK</span>
                    )}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">{inCartQty}</span>
                    )}
                  </button>
                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.category_name || 'General'} · {p.stock} in stock</p>
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <span className="text-lg font-extrabold text-emerald-700">${parseFloat(p.price).toFixed(2)}</span>
                      <button onClick={() => addToCart(p)}
                        disabled={out}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-emerald-100 bg-white py-8 text-center">
        <p className="text-sm font-bold text-emerald-800">Mini Mart</p>
        <p className="text-xs text-slate-400 mt-1">Open Daily 7AM - 10PM · Free delivery available</p>
      </footer>

      {/* Product detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || 'Product'} maxWidth="560px">
        {detail && (
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="sm:w-44 h-44 rounded-2xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
              {detail.image ? <img src={detail.image} alt="" className="w-full h-full object-cover" /> : <span className="text-5xl opacity-40">📦</span>}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                {detail.category_name || 'General'} {detail.unit ? `· ${detail.unit}` : ''}
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">${parseFloat(detail.price).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{detail.description || 'No description available.'}</p>
              <p className={`text-xs font-semibold mt-3 ${parseInt(detail.stock) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {parseInt(detail.stock) > 0 ? `✓ ${detail.stock} in stock` : '✕ Out of stock'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">−</button>
                  <span className="w-8 text-center font-bold text-slate-800">{detailQty}</span>
                  <button onClick={() => setDetailQty(q => Math.min(parseInt(detail.stock) || 1, q + 1))} className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">+</button>
                </div>
                <button onClick={() => { addToCart(detail, detailQty); setDetail(null); }}
                  disabled={parseInt(detail.stock) <= 0}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-200 hover:shadow-lg transition-all disabled:opacity-40">
                  Add to Cart — ${(parseFloat(detail.price) * detailQty).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50">
              <h3 className="font-bold text-slate-800">🛒 Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-40">🛒</div>
                  <p className="text-sm text-slate-400 font-medium">Your cart is empty</p>
                  <p className="text-xs text-slate-300 mt-1">Browse products and add them here</p>
                </div>
              ) : cart.map(i => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{i.name}</p>
                    <p className="text-xs text-slate-400">{Money(i.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(i.id, i.quantity - 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold">−</button>
                    <span className="w-7 text-center font-bold text-slate-800">{i.quantity}</span>
                    <button onClick={() => updateQty(i.id, i.quantity + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold">+</button>
                  </div>
                  <p className="text-sm font-bold text-slate-800 w-16 text-right">${(i.price * i.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-emerald-50 space-y-3">
              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <button onClick={openCheckout} disabled={cart.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Checkout
              </button>
              <button onClick={() => setCartOpen(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout" maxWidth="560px">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                orderType === 'takeaway' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              🏪 Pickup
            </button>
            <button onClick={() => setOrderType('delivery')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                orderType === 'delivery' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              🚚 Delivery
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Your Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="input-field w-full" />
            </div>
            <div>
              <label className="label-field">Phone Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} onBlur={lookupMember} placeholder="e.g. 012 345 678" className="input-field w-full" />
            </div>
          </div>

          {orderType === 'delivery' && (
            <div>
              <label className="label-field">Delivery Address *</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, village, city" className="input-field w-full" />
            </div>
          )}

          <div>
            <label className="label-field">Order Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything we should know? (optional)" className="input-field w-full" />
          </div>

          {member && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center gap-2">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-semibold text-amber-800">
                {member.is_new ? 'You are now a member — earn points on this order!' : `Welcome back, ${member.name || 'member'}! You have ${member.points} pts ($${(member.points * POINTS_VALUE).toFixed(2)})`}
              </span>
              {!member.is_new && member.points > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <input type="number" min="0" max={member.points} value={redeemPoints}
                    onChange={e => setRedeemPoints(Math.min(parseInt(e.target.value) || 0, member.points))}
                    className="w-20 text-xs px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-center" placeholder="pts" />
                  <span className="text-[10px] font-bold text-amber-700">Redeem</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label-field">Promo Code</label>
            <div className="flex gap-2">
              <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter promo code" className="input-field flex-1" />
              <button onClick={applyPromo} className="btn-primary text-xs px-4">Apply</button>
            </div>
          </div>

          {orderType === 'delivery' && (
            <div>
              <label className="label-field">Delivery Fee ($)</label>
              <input type="number" step="0.50" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="input-field w-full" />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setPayMethod('cash')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                payMethod === 'cash' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              💵 Cash on delivery
            </button>
            <button onClick={() => setPayMethod('wing')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                payMethod === 'wing' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              🏦 Pay with Wing
            </button>
          </div>

          {formErr && (
            <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2.5 rounded-lg border border-red-100 animate-scaleIn">{formErr}</div>
          )}

          <div className="space-y-1.5 text-sm rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium"><span>Promo ({appliedPromo?.code})</span><span>-${promoDiscount.toFixed(2)}</span></div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-medium"><span>Points ({redeemPoints} pts)</span><span>-${pointsDiscount.toFixed(2)}</span></div>
            )}
            {deliveryFeeNum > 0 && (
              <div className="flex justify-between text-blue-600 font-medium"><span>Delivery Fee</span><span>${deliveryFeeNum.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-emerald-700 pt-2 border-t border-slate-200">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={placeOrder} disabled={placing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60">
            {placing ? 'Placing order...' : payMethod === 'cash' ? `Place Order — ${total.toFixed(2)}` : `Pay ${total.toFixed(2)} via Wing`}
          </button>
        </div>
      </Modal>

      {/* Order success modal */}
      <Modal open={!!result} onClose={() => { setResult(null); setResultQR(''); }} title="Order Placed! 🎉" maxWidth="420px">
        {result && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <p className="text-xs text-slate-400">Invoice Number</p>
              <p className="font-mono font-bold text-slate-800 text-lg">{result.invoice_number}</p>
            </div>
            {resultQR && <img src={resultQR} alt="Order QR" className="mx-auto rounded-xl" />}
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Order type</span>
                <span className="font-medium capitalize">{(resultMeta?.orderType === 'takeaway' ? 'pickup' : resultMeta?.orderType || 'delivery').replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment</span>
                <span className="font-medium">{resultMeta?.payMethod === 'wing' ? 'Wing Bank' : 'Cash'}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                <span>Total</span><span>$${parseFloat(result.total_amount).toFixed(2)}</span>
              </div>
              {result.points_earned > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Points Earned</span><span>+{result.points_earned} ⭐</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {resultMeta?.orderType === 'delivery'
                ? 'Our store has received your order and will contact you shortly to confirm delivery.'
                : 'Pick up your order at the store — show your invoice number at the counter.'}
            </p>
            <button onClick={() => { setResult(null); setResultQR(''); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200">
              Continue Shopping
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}