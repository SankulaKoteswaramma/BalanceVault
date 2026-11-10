import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Vault,
  ArrowLeft,
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Bar with Back Button & Main Logo */}
      <div className="flex items-center justify-between pb-2 border-b border-cream-300">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-ink-950 hover:text-crimson-600 px-3.5 py-2 rounded-xl bg-white border border-cream-300 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-crimson-600" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="bg-white border-2 border-black text-black p-1.5 rounded-lg shadow-sm">
            <Vault className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-extrabold text-sm text-black tracking-tight">BalanceVault</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-ink-950 tracking-tight">
            Accounts & Provable Ledger
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            Bank-grade accounts backed by double-entry records and zero-floor balance checking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAccounts()}
            className="p-3 rounded-xl bg-white border border-cream-300 text-ink-950 hover:text-white hover:bg-crimson-600 hover:border-crimson-600 shadow-clean transition-all"
            title="Refresh Account Balances"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={accounts.length === 0}
            className="px-6 py-3 rounded-xl bg-white border-2 border-black hover:bg-cream-100 disabled:bg-cream-200 disabled:text-ink-400 disabled:border disabled:border-cream-300 disabled:cursor-not-allowed text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-2"
          >
            <ArrowRightLeft className="h-4 w-4 text-black" />
            <span className="text-black font-extrabold">Post Ledger Transfer</span>
          </button>
        </div>
      </div>

      {/* Account Cards Styled Like Luxury Physical Cards */}
      {loading ? (
        <div className="py-24 text-center text-ink-400 font-mono text-xs">Loading ledger balances...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-cream-300 rounded-2xl p-12 text-center shadow-card">
          <div className="bg-cream-100 w-16 h-16 rounded-2xl flex items-center justify-center text-ink-400 mx-auto mb-4">
            <CreditCard className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-ink-950">No active accounts provisioned</h3>
          <p className="text-ink-500 text-sm mt-1 max-w-md mx-auto">
            Accounts are provisioned automatically as soon as your identity dossier is verified by compliance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc, index) => {
            const isDarkCard = index % 2 === 0;
            return (
              <div
                key={acc.id}
                className={`p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                  isDarkCard
                    ? 'bg-ink-950 text-white shadow-elevated border border-ink-850 hover:border-crimson-600/50'
                    : 'bg-white text-ink-950 shadow-card border border-cream-300 hover:border-crimson-600/40'
                }`}
              >
                {/* Micro watermark */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Vault className="h-28 w-28" />
                </div>

                <div>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold uppercase tracking-widest font-mono ${isDarkCard ? 'text-cream-400' : 'text-ink-500'}`}>
                          {acc.accountType} LEDGER
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-crimson-600"></span>
                      </div>
                      <p className={`font-mono text-xl font-bold tracking-widest mt-2 ${isDarkCard ? 'text-white' : 'text-ink-950'}`}>
                        {acc.accountNumber}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider border ${
                        acc.status === 'ACTIVE'
                          ? isDarkCard
                            ? 'bg-crimson-600/30 text-crimson-400 border-crimson-500/40'
                            : 'bg-cream-100 text-ink-900 border-cream-300'
                          : 'bg-crimson-600 text-white border-crimson-700'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono block ${isDarkCard ? 'text-ink-400' : 'text-ink-400'}`}>
                    UUID: {acc.id}
                  </span>
                </div>

                <div className={`pt-8 mt-8 border-t flex items-end justify-between ${isDarkCard ? 'border-ink-800' : 'border-cream-200'}`}>
                  <div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest block font-bold ${isDarkCard ? 'text-ink-400' : 'text-ink-500'}`}>
                      Available Balance
                    </span>
                    <p className={`text-3xl font-display font-extrabold mt-0.5 tracking-tight ${isDarkCard ? 'text-white' : 'text-ink-950'}`}>
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`flex items-center space-x-1.5 text-xs font-medium ${isDarkCard ? 'text-cream-300' : 'text-crimson-700 font-bold'}`}>
                    <ShieldCheck className="h-4 w-4 text-crimson-600" />
                    <span className="font-mono text-[11px] uppercase tracking-wider">Zero Overdraft</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-lg w-full p-8 shadow-elevated relative animate-in fade-in duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-ink-400 hover:text-ink-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-cream-200">
              <div className="bg-crimson-600 text-white p-2.5 rounded-xl shadow-crimson">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-ink-950">Post Balanced Ledger Transfer</h3>
                <p className="text-xs text-ink-500">Atomic, double-entry transfer with idempotency protection</p>
              </div>
            </div>

            {transferError && (
              <div className="mb-5 p-4 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs flex items-center space-x-2 font-medium">
                <AlertCircle className="h-4 w-4 text-crimson-600 flex-shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-cream-100 border border-cream-300 text-ink-950 text-xs flex items-center space-x-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-crimson-600 flex-shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Source Account
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} — ${Number(acc.balance).toFixed(2)} ({acc.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Destination Account ID (UUID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Transfer Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 font-mono focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Memo / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settlement, Liquidity Movement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sm text-ink-950 focus:outline-none focus:border-crimson-600 focus:ring-1 focus:ring-crimson-600"
                />
              </div>

              <div className="pt-4 border-t border-cream-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 text-ink-950 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-7 py-3 rounded-xl bg-white border-2 border-black hover:bg-cream-100 disabled:bg-cream-200 disabled:text-ink-400 disabled:border disabled:border-cream-300 disabled:cursor-not-allowed text-black text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center space-x-2"
                >
                  <Send className="h-3.5 w-3.5 text-black" />
                  <span className="text-black font-extrabold">{isTransferring ? 'Posting...' : 'Execute Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
