"use client";

import { X, MoreHorizontal, Lock, Send, Heart, Sparkles, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { InboxData } from '@/lib/types';
import InboxCheckoutModal from '@/components/inbox-checkout-modal';

export const runtime = 'edge';

export default function SendPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [inbox, setInbox] = useState<InboxData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [senderName, setSenderName] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

    useEffect(() => {
        if (!username) return;
        const fetchInbox = async () => {
            try {
                const res = await fetch(`/api/inbox/${username}`);
                const data = await res.json() as { error?: string, inbox?: InboxData };
                if (!res.ok) throw new Error(data.error || 'Failed to load inbox');
                if (data.inbox) setInbox(data.inbox);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInbox();
    }, [username]);


    const handlePremiumCheckout = async (checkoutData: any) => {
        if (!content.trim() || !inbox) return;
        setIsSending(true);
        try {
            // 1. Create the message (marked as pending/premium)
            const msgRes = await fetch(`/api/inbox/${inbox.username}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    sender_name: senderName.trim(),
                    is_premium: true,
                    addons: checkoutData.addons
                })
            });
            const msgData = await msgRes.json() as { error?: string, messageId?: string };
            if (!msgRes.ok || !msgData.messageId) throw new Error(msgData.error || 'Failed to create message');

            // 2. Initialize Checkout (Stripe only for now)
            if (checkoutData.currency === 'USD') {
                const checkoutRes = await fetch('/api/inbox-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messageId: msgData.messageId,
                        addons: checkoutData.addons,
                        email: checkoutData.email,
                        username: inbox.username
                    })
                });
                const checkoutSession = await checkoutRes.json() as { url?: string, error?: string };
                if (!checkoutRes.ok || !checkoutSession.url) {
                    throw new Error(checkoutSession.error || 'Failed to initialize checkout');
                }
                // Redirect to Stripe
                window.location.href = checkoutSession.url;
            } else {
                alert('Paystack for inbox messages is coming soon. Please use USD.');
                setIsSending(false);
            }

        } catch (e: any) {
            alert(e.message);
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg text-brand-dark">
                <Loader2 className="animate-spin text-brand-rose" size={32} />
            </div>
        );
    }

    if (error || !inbox) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg text-brand-dark">
                <p>Inbox not found.</p>
                <Link href="/" className="mt-4 text-brand-rose underline">Go home</Link>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-brand-dark bg-brand-bg selection:bg-brand-rose/20 selection:text-brand-rose overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-brand-peach/30 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-rose/10 rounded-full blur-3xl animate-pulse-slow animate-delay-200"></div>
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 0 20px 40px -10px rgba(238, 43, 91, 0.1);
                }
                .text-area-shadow {
                    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
                }
            `}</style>

            <div className="relative w-full max-w-md h-full flex flex-col p-6">
                <div className="flex items-center justify-between w-full mb-8 z-20">
                    <Link href={`/inbox/${inbox.username}`} className="text-brand-dark/80 hover:bg-white/50 rounded-full p-2 transition-colors">
                        <X size={28} strokeWidth={2.5} />
                    </Link>
                    <button className="text-brand-muted hover:text-brand-rose transition-colors">
                        <MoreHorizontal size={28} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {sendSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="glass-card w-full rounded-[2.5rem] p-8 flex flex-col items-center gap-6 relative z-10 text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                <Check size={40} className="text-green-600" strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-brand-dark">Message Sent!</h2>
                            <p className="text-brand-muted mb-4 text-lg">Want to find out what people think of you?</p>

                            <Link href="/" className="w-full">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold font-heading text-lg shadow-xl shadow-stone-900/20"
                                >
                                    Claim your own Inbox in 10s
                                </motion.button>
                            </Link>

                            <button
                                onClick={() => { setSendSuccess(false); setContent(''); setSenderName(''); }}
                                className="text-sm font-bold text-brand-muted/70 hover:text-brand-dark mt-2 transition-colors"
                            >
                                Send another anonymous note
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="glass-card w-full rounded-[2.5rem] p-8 flex flex-col items-center gap-6 relative z-10"
                        >
                            <div className="absolute top-6 right-8 text-brand-rose/20 transform rotate-12">
                                <Heart size={48} fill="currentColor" />
                            </div>

                            <div className="flex flex-col items-center gap-5 w-full mt-2">
                                <div className="text-center space-y-1">
                                    <p className="text-brand-rose font-heading font-bold text-xs tracking-[0.2em] uppercase">Send a note</p>
                                    <h1 className="text-3xl font-serif font-bold text-brand-dark leading-tight break-all">
                                        Leave a little love for<br />{inbox.username}
                                    </h1>
                                </div>
                            </div>

                            <div className="w-full mt-2">
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="Your name (optional)"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-brand-rose/10 focus:border-brand-rose/30 focus:ring-4 focus:ring-brand-rose/5 text-stone-900 placeholder:text-brand-muted/40 font-heading text-sm outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full min-h-[160px] resize-none rounded-3xl bg-white border border-brand-rose/10 focus:border-brand-rose/30 focus:ring-4 focus:ring-brand-rose/5 text-stone-900 placeholder:text-brand-muted/40 p-6 text-lg leading-relaxed transition-all outline-none text-area-shadow font-heading"
                                        placeholder="Write something sweet... maybe a shared memory or just to say hi!"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-brand-muted/80 text-[11px] font-bold tracking-wide px-4 py-2 bg-white/50 rounded-full">
                                <Lock size={12} strokeWidth={2.5} />
                                <span>Your message can remain 100% anonymous.</span>
                            </div>

                            <div className="flex flex-col w-full gap-3 mt-2">
                                <motion.button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    disabled={isSending || !content.trim()}
                                    whileHover={{ scale: content.trim() ? 1.02 : 1 }}
                                    whileTap={{ scale: content.trim() ? 0.98 : 1 }}
                                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-white shadow-md transition-all font-heading font-bold text-lg tracking-wide ${content.trim() ? 'bg-gradient-to-r from-brand-rose to-[#ff6b8b] shadow-brand-rose/25 cursor-pointer' : 'bg-stone-300 cursor-not-allowed'}`}
                                >
                                    <Sparkles size={18} />
                                    <span>Send Love Note</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 flex justify-center pb-4">
                    <div className="text-brand-muted/40 text-xs font-bold tracking-widest flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                        Powered by ourheart <Heart size={10} className="fill-brand-rose text-brand-rose" />
                    </div>
                </div>
            </div>

            {isCheckoutOpen && (
                <InboxCheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    onSubmit={handlePremiumCheckout}
                    isProcessing={false}
                />
            )}
        </div>
    );
}
