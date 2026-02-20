"use client";

import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AddonId, INBOX_ADDONS_USD, INBOX_ADDONS_NGN } from '@/lib/types';

export interface InboxCheckoutData {
    email: string;
    addons: AddonId[];
    totalAmount: number;
    currency: 'USD' | 'NGN';
}

interface InboxCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InboxCheckoutData) => void;
    isProcessing: boolean;
}

export default function InboxCheckoutModal({ isOpen, onClose, onSubmit, isProcessing }: InboxCheckoutModalProps) {
    const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([]);
    const [email, setEmail] = useState('');
    const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');

    const toggleAddon = (id: AddonId) => {
        if (selectedAddons.includes(id)) {
            setSelectedAddons(selectedAddons.filter(a => a !== id));
        } else {
            setSelectedAddons([...selectedAddons, id]);
        }
    };

    const addons = currency === 'USD' ? INBOX_ADDONS_USD : INBOX_ADDONS_NGN;
    const basePrice = currency === 'USD' ? 1.00 : 1000;
    const addonPrice = currency === 'USD' ? 0.50 : 500;
    const total = basePrice + (selectedAddons.length * addonPrice);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-pink-500">Make it special ✨</h2>
                            <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Currency Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
                                <button
                                    onClick={() => setCurrency('USD')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currency === 'USD' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    USD ($)
                                </button>
                                <button
                                    onClick={() => setCurrency('NGN')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currency === 'NGN' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    NGN (₦)
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <p className="text-sm text-stone-500 mb-2">Upgrade to a Premium Note</p>
                            <span className="text-4xl font-black text-pink-500 tracking-tight">
                                {currency === 'USD' ? `$${total.toFixed(2)}` : `₦${total.toLocaleString()}`}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-6">
                            {addons.map((addon) => {
                                const isSelected = selectedAddons.includes(addon.id);
                                return (
                                    <button
                                        key={addon.id}
                                        onClick={() => toggleAddon(addon.id)}
                                        className={`relative p-4 rounded-xl border flex flex-row items-center gap-4 transition-all duration-200 ${isSelected
                                            ? 'bg-pink-50 border-pink-200 shadow-sm'
                                            : 'bg-white border-stone-100 hover:border-stone-200'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-stone-300'
                                            }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 text-left flex justify-between items-center">
                                            <p className="font-bold text-sm text-stone-800">{addon.name}</p>
                                            <p className="text-xs font-semibold text-pink-500">
                                                + {currency === 'USD' ? `$${addon.price.toFixed(2)}` : `₦${addon.price}`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-stone-700 mb-2">Your email (for receipt)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-stone-400 text-stone-900 font-medium"
                            />
                        </div>

                        <button
                            onClick={() => onSubmit({ email, addons: selectedAddons, totalAmount: total, currency })}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-pink-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isProcessing ? 'bg-stone-300 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : (currency === 'USD' ? `Pay Securely` : `Pay with Paystack`)}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
