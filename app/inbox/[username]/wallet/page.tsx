"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, TrendingUp, Banknote, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MIN_WITHDRAWAL_COINS, coinsToUsd, coinsToNgn } from '@/lib/coins';

export const runtime = 'edge';

interface WalletData {
    wallet: { coins: number; total_earned: number };
    transactions: Array<{ type: string; amount: number; reason: string; reference: string; created_at: string }>;
    withdrawals: Array<{ id: string; coins: number; status: string; payout_info: string; created_at: string }>;
}

export default function WalletPage() {
    const params = useParams();
    const username = params.username as string;

    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawCoins, setWithdrawCoins] = useState(500);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch(`/api/wallet/${username}`)
            .then(r => r.json())
            .then((d: WalletData) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [username]);

    const handleWithdraw = async () => {
        if (!bankName || !accountNumber || !accountName) {
            setErrorMsg('Please fill in all bank details.');
            return;
        }
        setWithdrawing(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    coins: withdrawCoins,
                    payoutInfo: { bankName, accountNumber, accountName }
                })
            });
            const json = await res.json() as { success?: boolean; error?: string };
            if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit');
            setSuccessMsg(`🎉 Withdrawal of ${withdrawCoins} Hearts submitted! We'll process it within 24–48 hours.`);
            setShowWithdrawForm(false);
            // Refresh
            fetch(`/api/wallet/${username}`).then(r => r.json()).then((d: WalletData) => setData(d));
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
                <Loader2 className="animate-spin text-rose-400" size={36} />
            </div>
        );
    }

    const coins = data?.wallet.coins ?? 0;
    const totalEarned = data?.wallet.total_earned ?? 0;
    const canWithdraw = coins >= MIN_WITHDRAWAL_COINS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 pb-16">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-rose-100 px-4 py-3 flex items-center gap-3">
                <Link href={`/inbox/${username}`} className="p-2 rounded-full text-stone-600 hover:bg-rose-50 transition-colors">
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-stone-900 font-heading">Your Hearts Wallet 💖</h1>
                    <p className="text-xs text-stone-500">@{username}</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-red-400 p-6 shadow-2xl shadow-rose-500/30 text-white"
                >
                    <div className="absolute right-6 top-6 opacity-20">
                        <Heart size={80} fill="white" />
                    </div>
                    <p className="text-sm font-semibold opacity-70 uppercase tracking-widest mb-1">Available Hearts</p>
                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-6xl font-black tracking-tight">{coins.toLocaleString()}</span>
                        <span className="text-2xl mb-2 opacity-70">❤️</span>
                    </div>
                    <p className="text-sm opacity-70">≈ {coinsToUsd(coins)} USD · {coinsToNgn(coins / 100 * 1000)} NGN</p>

                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                        <TrendingUp size={14} className="opacity-60" />
                        <span className="text-xs opacity-60">All time earned: <strong>{totalEarned.toLocaleString()} Hearts</strong></span>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">Exchange Rate</p>
                        <p className="text-xl font-black text-stone-900">100 ❤️</p>
                        <p className="text-xs text-stone-500">=&nbsp;$1.00 / ₦1,000</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">Min Withdraw</p>
                        <p className="text-xl font-black text-stone-900">{MIN_WITHDRAWAL_COINS} ❤️</p>
                        <p className="text-xs text-stone-500">= $5.00 / ₦5,000</p>
                    </div>
                </div>

                {/* Success / Error messages */}
                {successMsg && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-500 mt-0.5" />
                        <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                    </div>
                )}

                {/* Withdraw CTA */}
                {!showWithdrawForm ? (
                    <button
                        onClick={() => setShowWithdrawForm(true)}
                        disabled={!canWithdraw}
                        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canWithdraw ? 'bg-stone-900 text-white shadow-xl shadow-stone-900/20 hover:bg-stone-800' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                    >
                        <Banknote size={20} />
                        {canWithdraw ? 'Withdraw Hearts' : `Need ${MIN_WITHDRAWAL_COINS - coins} more Hearts to withdraw`}
                    </button>
                ) : (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 space-y-4"
                        >
                            <h3 className="font-bold text-stone-900 text-lg">Withdraw Hearts 💸</h3>

                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Hearts to withdraw</label>
                                <input
                                    type="number"
                                    value={withdrawCoins}
                                    min={MIN_WITHDRAWAL_COINS}
                                    max={coins}
                                    step={50}
                                    onChange={e => setWithdrawCoins(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-stone-900 font-bold"
                                />
                                <p className="text-xs text-stone-400 mt-1">≈ {coinsToUsd(withdrawCoins)} USD</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Bank Name</label>
                                <input value={bankName} onChange={e => setBankName(e.target.value)}
                                    placeholder="e.g. GTBank, Access Bank"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-stone-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Account Number</label>
                                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                                    placeholder="10-digit account number"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-stone-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Account Name</label>
                                <input value={accountName} onChange={e => setAccountName(e.target.value)}
                                    placeholder="Full name on account"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-stone-900" />
                            </div>

                            {errorMsg && (
                                <div className="flex items-center gap-2 text-red-500 text-sm">
                                    <AlertCircle size={14} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setShowWithdrawForm(false)} className="flex-1 py-3 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleWithdraw} disabled={withdrawing} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                                    {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                                    {withdrawing ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Earning History */}
                <div>
                    <h2 className="font-bold text-stone-700 text-sm uppercase tracking-widest mb-3">Earning History</h2>
                    {data?.transactions && data.transactions.length > 0 ? (
                        <div className="space-y-2">
                            {data.transactions.map((tx, i) => (
                                <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm border border-rose-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                            {tx.type === 'earn' ? <Heart size={14} className="text-green-600" fill="currentColor" /> : <Banknote size={14} className="text-orange-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-stone-800">{tx.reason}</p>
                                            <p className="text-xs text-stone-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {tx.type === 'earn' ? '+' : '-'}{tx.amount} ❤️
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center border border-rose-50">
                            <Heart size={32} className="mx-auto text-rose-200 mb-3" />
                            <p className="text-sm text-stone-400">No earnings yet. Share your inbox link to start earning Hearts!</p>
                        </div>
                    )}
                </div>

                {/* Withdrawals History */}
                {data?.withdrawals && data.withdrawals.length > 0 && (
                    <div>
                        <h2 className="font-bold text-stone-700 text-sm uppercase tracking-widest mb-3">Withdrawal Requests</h2>
                        <div className="space-y-2">
                            {data.withdrawals.map((w, i) => {
                                const statusIcon = w.status === 'paid' ? <CheckCircle size={14} className="text-green-500" /> :
                                    w.status === 'rejected' ? <XCircle size={14} className="text-red-500" /> :
                                        <Clock size={14} className="text-yellow-500" />;
                                const statusColor = w.status === 'paid' ? 'text-green-600' : w.status === 'rejected' ? 'text-red-600' : 'text-yellow-600';
                                return (
                                    <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm border border-rose-50">
                                        <div className="flex items-center gap-3">
                                            {statusIcon}
                                            <div>
                                                <p className="text-sm font-semibold text-stone-800">{w.coins} Hearts withdrawal</p>
                                                <p className="text-xs text-stone-400">{new Date(w.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold uppercase ${statusColor}`}>{w.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
