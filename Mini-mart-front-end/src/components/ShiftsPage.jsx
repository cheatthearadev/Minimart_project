import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmptyState, LoadingSpinner, Badge } from './ui';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startCash, setStartCash] = useState('');
  const [endCash, setEndCash] = useState('');

  const fetch = () => api.getShifts().then(d => { setShifts(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const activeShift = shifts.find(s => !s.end_time);

  const handleStart = () => {
    api.startShift(parseFloat(startCash) || 0).then(() => { setStartCash(''); fetch(); }).catch(err => alert(err.message));
  };
  const handleEnd = () => {
    if (!activeShift) return;
    api.endShift(activeShift.id, parseFloat(endCash) || 0).then(() => { setEndCash(''); fetch(); }).catch(err => alert(err.message));
  };

  if (loading) return <LoadingSpinner text="Loading shifts..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {activeShift && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Active Shift</p>
              <p className="text-2xl font-bold mt-1">${parseFloat(activeShift.starting_cash || 0).toFixed(2)} starting cash</p>
              <p className="text-emerald-200 text-xs mt-1">Started {new Date(activeShift.start_time).toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl animate-pulse">
              ⏰
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🟢</div>
            <div>
              <h3 className="font-bold text-slate-800">Start Shift</h3>
              <p className="text-xs text-slate-500">Begin a new shift</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label-field">Starting Cash ($)</label>
              <input type="number" step="0.01" value={startCash} onChange={e => setStartCash(e.target.value)}
                className="input-field" placeholder="0.00" disabled={!!activeShift} />
            </div>
            <button onClick={handleStart} disabled={!!activeShift}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Start Shift
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl">🔴</div>
            <div>
              <h3 className="font-bold text-slate-800">End Shift</h3>
              <p className="text-xs text-slate-500">Close the current shift</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label-field">Ending Cash ($)</label>
              <input type="number" step="0.01" value={endCash} onChange={e => setEndCash(e.target.value)}
                className="input-field" placeholder="0.00" disabled={!activeShift} />
            </div>
            <button onClick={handleEnd} disabled={!activeShift}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-200 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              End Shift
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Shift History</h3>
        {shifts.length === 0 ? (
          <EmptyState icon="⏰" title="No shifts recorded" description="Start your first shift above" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>              <tr className="bg-emerald-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cashier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Cash</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End Cash</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map(s => {
                  const dur = s.end_time ? Math.round((new Date(s.end_time) - new Date(s.start_time)) / 60000) : null;
                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{s.username || s.cashier_name || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">${parseFloat(s.starting_cash || 0).toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{s.end_time ? `$${parseFloat(s.ending_cash || 0).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{dur !== null ? `${Math.floor(dur / 60)}h ${dur % 60}m` : '—'}</td>
                      <td className="px-4 py-3.5"><Badge color={s.end_time ? 'slate' : 'green'}>{s.end_time ? 'Closed' : 'Active'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
