import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SearchInput, Modal, ConfirmDialog, EmptyState, ImageUpload, LoadingSpinner } from './ui';

const UNITS = ['piece', 'kg', 'liter', 'pack', 'box'];

export default function ProductsPage({ categories, suppliers, isAdmin, cart, setCart, addNotification }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [delId, setDelId] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [addImg, setAddImg] = useState(null);
  const [addPrev, setAddPrev] = useState('');
  const [addDrag, setAddDrag] = useState(false);
  const [editImg, setEditImg] = useState(null);
  const [editPrev, setEditPrev] = useState('');
  const [editDrag, setEditDrag] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [notification, setNotification] = useState(null);

  const [eBarcode, setEBarcode] = useState('');
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eStock, setEStock] = useState('');
  const [eCategoryId, setECategoryId] = useState('');
  const [eSupplierId, setESupplierId] = useState('');
  const [eUnit, setEUnit] = useState('piece');
  const [eCostPrice, setECostPrice] = useState('');

  const fetchProducts = () => api.getProducts().then(d => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q));
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target.elements;
    let img = null;
    if (addImg) { try { img = await api.upload(addImg); } catch (err) { alert(err.message); return; } }
    const body = {
      barcode: form.aBarcode.value, name: form.aName.value, price: parseFloat(form.aPrice.value),
      stock: parseInt(form.aStock.value), category_id: form.aCategory.value || null,
      supplier_id: form.aSupplier.value || null, unit: form.aUnit.value,
      cost_price: parseFloat(form.aCostPrice.value) || 0, image: img
    };
    api.createProduct(body).then(() => { setAddImg(null); setAddPrev(''); e.target.reset(); fetchProducts(); }).catch(err => alert(err.message));
  };

  const openEdit = (p) => {
    setEditing(p);
    setEBarcode(p.barcode); setEName(p.name); setEPrice(p.price); setEStock(p.stock);
    setECategoryId(p.category_id || ''); setESupplierId(p.supplier_id || '');
    setEUnit(p.unit || 'piece'); setECostPrice(p.cost_price || '');
    setEditPrev(p.image || ''); setEditImg(null);
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    let img = editPrev || null;
    if (editImg) { try { img = await api.upload(editImg); } catch (err) { alert(err.message); return; } }
    api.updateProduct({ id: editing.id, barcode: eBarcode, name: eName, price: parseFloat(ePrice),
      stock: parseInt(eStock), category_id: eCategoryId || null, supplier_id: eSupplierId || null,
      unit: eUnit, cost_price: parseFloat(eCostPrice) || 0, image: img
    }).then(() => { setShowEdit(false); fetchProducts(); }).catch(err => alert(err.message));
  };

  const handleDelete = () => api.deleteProduct(delId).then(() => { setShowDelete(false); fetchProducts(); }).catch(err => alert(err.message));

  const toggleFavorite = (p) => {
    api.toggleFavorite(p.id).then(d => {
      setProducts(prev => prev.map(prod => prod.id === d.id ? { ...prod, is_favorite: d.is_favorite } : prod));
      if (addNotification) addNotification('order', d.is_favorite ? `"${p.name}" added to favorites` : `"${p.name}" removed from favorites`);
    }).catch(() => {});
  };

  const handleImport = () => {
    if (!importCsv.trim()) return;
    api.post('ImportCsv.php', { csv: importCsv }).then(() => { setShowImport(false); setImportCsv(''); fetchProducts(); }).catch(err => alert(err.message));
  };

  const generateQR = (p) => {
    import('qrcode').then(QRCode => {
      QRCode.default.toDataURL(JSON.stringify({ id: p.id, barcode: p.barcode, name: p.name, price: p.price }),
        { width: 220, margin: 2, color: { dark: '#064e3b', light: '#ffffff' } }).then(url => {
        setQrUrl(url); setQrProduct(p);
      });
    });
  };

  const downloadQR = () => {
    const a = document.createElement('a'); a.href = qrUrl; a.download = `QR_${qrProduct.barcode}.png`; a.click();
  };

  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFFID,Barcode,Name,Price,Stock,Category,Unit,Cost\n";
    products.forEach(p => { csv += `${p.id},${p.barcode},"${p.name}",${p.price},${p.stock},${p.category_id || ''},${p.unit || ''},${p.cost_price || 0}\n`; });
    const l = document.createElement("a"); l.href = encodeURI(csv); l.download = "Products.csv"; l.click();
  };

  const handleImgChange = (e, type) => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    if (type === 'add') { setAddImg(f); setAddPrev(url); } else { setEditImg(f); setEditPrev(url); }
  };
  const handleDrop = (e, type) => {
    e.preventDefault(); if (type === 'add') setAddDrag(false); else setEditDrag(false);
    const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      if (type === 'add') { setAddImg(f); setAddPrev(url); } else { setEditImg(f); setEditPrev(url); }
    }
  };

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOrder = (p) => {
    if (parseInt(p.stock) <= 0) {
      notify('error', `"${p.name}" is out of stock!`);
      addNotification('stock', `"${p.name}" is out of stock!`);
      return;
    }
    const existing = cart.find(i => i.id === p.id);
    if (existing && existing.quantity >= parseInt(p.stock)) {
      notify('error', `Insufficient stock for "${p.name}"!`);
      addNotification('stock', `Insufficient stock for "${p.name}"!`);
      return;
    }
    if (existing) {
      setCart(prev => prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      notify('success', `"${p.name}" x${existing.quantity + 1} in cart`);
      addNotification('order', `${p.name} x${existing.quantity + 1} added to cart by ${user?.username || 'user'}`);
    } else {
      setCart(prev => [...prev, { id: p.id, name: p.name, price: parseFloat(p.price), stock: parseInt(p.stock), quantity: 1, image: p.image }]);
      notify('success', `"${p.name}" added to cart`);
      addNotification('order', `${p.name} added to cart by ${user?.username || 'user'}`);
    }
  };

  if (loading) return <LoadingSpinner text={t('products.loading')} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {notification && (
        <div className={`fixed top-4 right-4 z-[1100] overflow-hidden relative flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold animate-slideUp ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span className="text-lg">{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
          <div className={`absolute bottom-0 left-0 h-1 rounded-b-xl ${
            notification.type === 'success' ? 'bg-emerald-300' : 'bg-red-300'
          }`} style={{ animation: 'shrink 3s linear forwards', width: '100%' }} />
        </div>
      )}
      {isAdmin && (
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{t('products.addNewProduct')}</h3>
          <form onSubmit={handleAdd}>
            <div className="flex gap-6 flex-wrap">
              <ImageUpload preview={addPrev} isDragging={addDrag}
                onDragOver={(e) => { e.preventDefault(); setAddDrag(true); }}
                onDragLeave={() => setAddDrag(false)}
                onDrop={(e) => handleDrop(e, 'add')}
                onChange={(e) => handleImgChange(e, 'add')}
                onRemove={() => { setAddImg(null); setAddPrev(''); }} />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label-field">{t('products.barcode')}</label>
                  <input name="aBarcode" className="input-field" placeholder={t('products.barcodePlaceholder')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">{t('products.productName')} *</label>
                  <input name="aName" className="input-field" required placeholder={t('products.productNamePlaceholder')} />
                </div>
                <div>
                  <label className="label-field">{t('products.price')} *</label>
                  <input name="aPrice" type="number" step="0.01" className="input-field" required placeholder="0.00" />
                </div>
                <div>
                  <label className="label-field">{t('products.costPrice')}</label>
                  <input name="aCostPrice" type="number" step="0.01" className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label className="label-field">{t('products.stock')} *</label>
                  <input name="aStock" type="number" className="input-field" required placeholder="0" />
                </div>
                <div>
                  <label className="label-field">{t('products.category')}</label>
                  <select name="aCategory" className="input-field">
                    <option value="">{t('common.select')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">{t('products.supplier')}</label>
                  <select name="aSupplier" className="input-field">
                    <option value="">{t('common.select')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">{t('products.unit')}</label>
                  <select name="aUnit" className="input-field">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button type="submit" className="btn-primary">{t('products.addProduct')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder={t('products.searchPlaceholder')} className="w-80" />
        <div className="flex gap-2">
          {isAdmin && <button onClick={() => setShowImport(true)} className="btn-outline">{t('products.importCSV')}</button>}
          <button onClick={exportCSV} className="btn-outline">{t('products.exportCSV')}</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title={t('products.noProductsFound')} description={t('products.addFirstProduct')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filtered.map(p => (
            <div key={p.id} className="product-card group">
              <div className="product-card-image">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400/20 to-emerald-600/20">
                    <span className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">📦</span>
                  </div>
                )}
                <div className="product-card-badges-top">
                  {parseInt(p.stock) === 0 && (
                    <span className="badge badge-red">{t('products.soldOut')}</span>
                  )}
                  {parseInt(p.stock) > 0 && parseInt(p.stock) < 10 && (
                    <span className="badge badge-amber">{t('products.lowStock')}</span>
                  )}
                </div>
                <button onClick={() => toggleFavorite(p)}
                  className={`product-card-fav ${p.is_favorite ? 'active' : ''}`}>
                  {p.is_favorite ? '♥' : '♡'}
                </button>
                <div className="product-card-stock-badge">
                  {p.stock} {p.unit || 'pcs'}
                </div>
              </div>
              <div className="product-card-body">
                <div className="product-card-info">
                  <p className="product-card-barcode">{p.barcode}</p>
                  <h4 className="product-card-name">{p.name}</h4>
                  {p.category_name && <p className="product-card-category">{p.category_name}</p>}
                  <p className="product-card-price">${parseFloat(p.price).toFixed(2)}</p>
                </div>
                <div className="product-card-actions">
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(p)} className="product-btn product-btn-edit">{t('common.edit')}</button>
                      <button onClick={() => generateQR(p)} className="product-btn product-btn-qr">{t('products.qr')}</button>
                      <button onClick={() => { setDelId(p.id); setShowDelete(true); }} className="product-btn product-btn-delete">{t('common.delete')}</button>
                    </>
                  )}
                  <button onClick={() => handleOrder(p)}
                    disabled={parseInt(p.stock) === 0}
                    className={`product-btn product-btn-order ${isAdmin ? '' : 'w-full'}`}>
                    {parseInt(p.stock) === 0 ? t('products.outOfStock') : t('products.order')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={t('products.editProduct')} maxWidth="700px">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="flex gap-4">
            <ImageUpload preview={editPrev} isDragging={editDrag}
              onDragOver={(e) => { e.preventDefault(); setEditDrag(true); }}
              onDragLeave={() => setEditDrag(false)}
              onDrop={(e) => handleDrop(e, 'edit')}
              onChange={(e) => handleImgChange(e, 'edit')}
              onRemove={() => { setEditImg(null); setEditPrev(''); }} />
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">{t('products.barcode')}</label><input value={eBarcode} onChange={e => setEBarcode(e.target.value)} className="input-field" /></div>
                <div><label className="label-field">{t('products.productName')} *</label><input value={eName} onChange={e => setEName(e.target.value)} className="input-field" required /></div>
                <div><label className="label-field">{t('products.price')} *</label><input type="number" step="0.01" value={ePrice} onChange={e => setEPrice(e.target.value)} className="input-field" required /></div>
                <div><label className="label-field">{t('products.costPrice')}</label><input type="number" step="0.01" value={eCostPrice} onChange={e => setECostPrice(e.target.value)} className="input-field" /></div>
                <div><label className="label-field">{t('products.stock')} *</label><input type="number" value={eStock} onChange={e => setEStock(e.target.value)} className="input-field" required /></div>
                <div><label className="label-field">{t('products.unit')}</label>
                  <select value={eUnit} onChange={e => setEUnit(e.target.value)} className="input-field">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div><label className="label-field">{t('products.category')}</label>
                  <select value={eCategoryId} onChange={e => setECategoryId(e.target.value)} className="input-field">
                    <option value="">{t('common.select')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label-field">{t('products.supplier')}</label>
                  <select value={eSupplierId} onChange={e => setESupplierId(e.target.value)} className="input-field">
                    <option value="">{t('common.select')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('common.update')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title={t('products.deleteProduct')} message={t('products.deleteConfirm')} />

      <Modal open={!!qrProduct} onClose={() => { setQrProduct(null); setQrUrl(''); }} title={t('products.productQRCode')} maxWidth="380px">
        {qrProduct && (
          <div className="text-center space-y-4">
            {qrUrl && <img src={qrUrl} alt="QR" className="mx-auto rounded-xl shadow-lg" />}
            <div>
              <p className="font-bold text-slate-800">{qrProduct.name}</p>
              <p className="text-sm text-slate-500">{qrProduct.barcode}</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">${parseFloat(qrProduct.price).toFixed(2)}</p>
            </div>
            <button onClick={downloadQR} className="btn-primary w-full">{t('products.downloadQRCode')}</button>
          </div>
        )}
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title={t('products.importProductsCSV')} maxWidth="550px">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{t('products.importCSVDesc')}</p>
          <textarea value={importCsv} onChange={e => setImportCsv(e.target.value)} rows={10}
            className="input-field font-mono text-xs" placeholder="barcode,name,price,stock..." />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowImport(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleImport} className="btn-primary">{t('common.import')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
