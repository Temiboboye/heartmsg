"use client";

import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { AddonId } from '@/lib/types';

export const ADDONS_USD: { id: AddonId; name: string; price: number }[] = [
    { id: 'no-watermark', name: 'No watermark', price: 0.50 },
    { id: 'elegant-font', name: 'Elegant font', price: 0.50 },
    { id: 'romantic-music', name: 'Romantic Love track', price: 0.50 },
    { id: 'effects', name: 'Effects ✨', price: 0.50 },
    { id: 'confetti', name: 'Confetti 🎉', price: 0.50 },
    { id: 'custom-link', name: 'Custom Link 🔗', price: 0.50 },
];

export const ADDONS_NGN: { id: AddonId; name: string; price: number }[] = [
    { id: 'no-watermark', name: 'No watermark', price: 500 },
    { id: 'elegant-font', name: 'Elegant font', price: 500 },
    { id: 'romantic-music', name: 'Romantic Love track', price: 500 },
    { id: 'effects', name: 'Effects ✨', price: 500 },
    { id: 'confetti', name: 'Confetti 🎉', price: 500 },
    { id: 'custom-link', name: 'Custom Link 🔗', price: 500 },
];

export interface CheckoutData {
    email: string;
    addons: AddonId[];
    totalAmount: number;
    currency: 'USD' | 'NGN';
    customSlug?: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckoutData) => void;
    isProcessing: boolean;
    numPages?: number;
}

export default function CheckoutModal({ isOpen, onClose, onSubmit, isProcessing, numPages = 1 }: CheckoutModalProps) {
    const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([]);
    const [email, setEmail] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');

    const toggleAddon = (id: AddonId) => {
        if (selectedAddons.includes(id)) {
            setSelectedAddons(selectedAddons.filter(a => a !== id));
        } else {
            setSelectedAddons([...selectedAddons, id]);
        }
    };

    const addons = currency === 'USD' ? ADDONS_USD : ADDONS_NGN;
    const basePrice = currency === 'USD' ? 1.00 : 1000;
    const addonPrice = currency === 'USD' ? 0.50 : 500;

    // Calculate extra pages (first page is free)
    const extraPages = Math.max(0, numPages - 1);
    const extraPageCost = extraPages * addonPrice;

    const total = basePrice + (selectedAddons.length * addonPrice) + extraPageCost;

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
                            <h2 className="text-xl font-bold text-pink-500">Complete your love story</h2>
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
                            <span className="text-4xl font-black text-pink-500 tracking-tight">
                                {currency === 'USD' ? `$${total.toFixed(2)}` : `₦${total.toLocaleString()}`}
                            </span>
                            <p className="text-xs text-stone-400 mt-1">
                                {selectedAddons.includes('custom-link') && customSlug
                                    ? `ourlovenotes.com/${customSlug}`
                                    : 'ourlovenotes.com/story-9w4ge6'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {addons.map((addon) => {
                                const isSelected = selectedAddons.includes(addon.id);
                                return (
                                    <button
                                        key={addon.id}
                                        onClick={() => toggleAddon(addon.id)}
                                        className={`relative p-4 rounded-xl border flex flex-col items-start gap-2 transition-all duration-200 ${isSelected
                                            ? 'bg-pink-50 border-pink-200 shadow-sm'
                                            : 'bg-white border-stone-100 hover:border-stone-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-stone-300'
                                            }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-stone-800 text-left">{addon.name}</p>
                                            <p className="text-xs text-stone-400 mt-0.5 text-left">
                                                + {currency === 'USD' ? `$${addon.price.toFixed(2)}` : `₦${addon.price}`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Extra Pages Info */}
                            {extraPages > 0 && (
                                <div className="relative p-4 rounded-xl border flex flex-col items-start gap-2 bg-pink-50 border-pink-200 shadow-sm opacity-90">
                                    <div className="w-5 h-5 rounded-full border flex items-center justify-center bg-pink-500 border-pink-500">
                                        <Check size={12} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-stone-800 text-left">Extra page{extraPages > 1 ? 's' : ''}</p>
                                        <p className="text-xs text-stone-400 mt-0.5 text-left">
                                            + {currency === 'USD' ? `$${extraPageCost.toFixed(2)}` : `₦${extraPageCost}`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Custom Slug Input - Conditionally Rendered */}
                        <AnimatePresence>
                            {selectedAddons.includes('custom-link') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="block text-sm font-bold text-stone-700 mb-2">Custom Link</label>
                                    <div className="flex items-center">
                                        <span className="bg-stone-100 border border-r-0 border-stone-200 text-stone-500 px-3 py-3 rounded-l-xl text-sm font-mono">ourlovenotes.com/</span>
                                        <input
                                            type="text"
                                            value={customSlug}
                                            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="maria-love"
                                            className="w-full px-4 py-3 rounded-r-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-stone-400 text-stone-900 font-medium"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-stone-700 mb-2">Your email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-stone-400 text-stone-900 font-medium"
                            />
                        </div>

                        <button
                            onClick={() => onSubmit({ email, addons: selectedAddons, totalAmount: total, currency, customSlug })}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-pink-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isProcessing ? 'bg-stone-300 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : (currency === 'USD' ? `Pay with Card` : `Pay with Paystack`)}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
