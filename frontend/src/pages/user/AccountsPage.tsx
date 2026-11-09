import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Account } from '../../types';
import {
  CreditCard,
  Send,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/my');
      if (res.data.success) {
        setAccounts(res.data.data);
        if (res.data.data.length > 0 && !selectedSource) {
          setSelectedSource(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsTransferring(true);
      setTransferError(null);
      setTransferSuccess(null);

      // Generate client-side idempotency key for financial safety
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await api.post('/accounts/transfer', {
        sourceAccountId: selectedSource,
        destinationAccountId: destinationId.trim(),
        amount: parseFloat(amount),
        description: description.trim() || 'Internal funds movement',
        idempotencyKey,
      });

      if (res.data.success) {
        setTransferSuccess(`Transfer posted successfully! Ref: ${res.data.data.referenceNumber}`);
        setAmount('');
        setDescription('');
        setDestinationId('');
        await fetchAccounts();
        setTimeout(() => {
          setIsModalOpen(false);
          setTransferSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      setTransferError(err.response?.data?.error || 'Failed to complete transaction.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Accounts & Financial Ledgers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Provable double-entry balanced accounts protected against overdrafts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAccounts()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Account Balances"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={accounts.length === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Move Money</span>
          </button>
        </div>
      </div>

      {/* Account Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading ledger balances...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No active accounts provisioned</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Accounts are provisioned automatically as soon as your onboarding identity verification is reviewed and approved by compliance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {acc.accountType} Account
                  </span>
                  <p className="font-mono text-lg font-bold text-slate-100 tracking-wider mt-1">
                    {acc.accountNumber}
                  </p>
                  <span className="text-[11px] text-slate-500 font-mono">UUID: {acc.id}</span>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    acc.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {acc.status}
                </span>
              </div>

              <div className="pt-6 border-t border-slate-800/60 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <p className="text-3xl font-extrabold text-white mt-0.5">
                    ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Balanced</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Post Balanced Ledger Transfer</h3>
                <p className="text-xs text-slate-400">Atomic, double-entry transfer with idempotency protection</p>
              </div>
            </div>

            {transferError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Source Account
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} — ${Number(acc.balance).toFixed(2)} ({acc.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Destination Account ID (UUID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice payment, Settlement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isTransferring ? 'Posting...' : 'Execute Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
