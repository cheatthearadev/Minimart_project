import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, title, children, maxWidth = '600px' }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90dvh] overflow-y-auto animate-scaleIn"
        style={{ maxWidth, margin: '0 8px' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-50">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>,
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm'} maxWidth="420px">
      <p className="text-slate-600 mb-6">{message || 'Are you sure?'}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn-danger">Delete</button>
      </div>
    </Modal>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', text }) {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className={`${sizeClass} border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function Badge({ children, color = 'green', className = '' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    slate: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[color] || colors.green} ${className}`}>
      {children}
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        className="input-field pl-10" />
    </div>
  );
}

export function StatCard({ icon, label, value, color = 'green', trend }) {
  const bgMap = {
    green: 'bg-emerald-50',
    red: 'bg-red-50',
    yellow: 'bg-amber-50',
    blue: 'bg-blue-50',
    orange: 'bg-orange-50',
    indigo: 'bg-indigo-50',
    purple: 'bg-purple-50',
    teal: 'bg-teal-50',
  };
  const iconColorMap = {
    green: 'text-emerald-600',
    red: 'text-red-600',
    yellow: 'text-amber-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
  };
  return (
    <div className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bgMap[color] || bgMap.green} ${iconColorMap[color] || iconColorMap.green} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
        </div>
        {trend !== undefined && (
          <div className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-emerald-50/60 rounded-xl p-1 border border-emerald-100/50">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            active === t.key
              ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({ columns, data, onRowClick, emptyIcon, emptyTitle }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-emerald-100/60">
      <table className="w-full">
        <thead>
          <tr className="bg-emerald-50/50">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState icon={emptyIcon || '📭'} title={emptyTitle || 'No data found'} />
              </td>
            </tr>
          ) : data.map((row, ri) => (
            <tr key={row.id || ri}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-emerald-50/30' : ''}`}>
              {columns.map((col, ci) => (
                <td key={ci} className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImageUpload({ preview, isDragging, onDragOver, onDragLeave, onDrop, onChange, onRemove }) {
  const fileInputRef = React.useRef(null);
  return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`w-40 h-40 shrink-0 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative ${
        isDragging ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' :
        preview ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
      }`}>
      {preview ? (
        <>
          <img src={preview} alt="" className="w-full h-full object-cover" />
          {onRemove && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors">
              x
            </button>
          )}
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <span className="text-[10px] text-slate-400 text-center leading-tight px-2">Drag image<br/>or click</span>
        </>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </div>
  );
}
