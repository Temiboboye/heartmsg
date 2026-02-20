"use client";

import { Heart, Lock, Settings, Mail, Compass, PlusCircle, User, Share2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InboxData, InboxMessageData } from '@/lib/types';
import ReplyModal from '@/components/reply-modal';

export const runtime = 'edge';

export default function InboxPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [inbox, setInbox] = useState<InboxData | null>(null);
    const [messages, setMessages] = useState<InboxMessageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReplyMessage, setSelectedReplyMessage] = useState<InboxMessageData | null>(null);

    useEffect(() => {
        if (!username) return;

        const fetchInbox = async () => {
            try {
                const res = await fetch(`/api/inbox/${username}`);
                const data = await res.json() as { error?: string, inbox?: InboxData, messages?: InboxMessageData[] };

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to load inbox');
                }

                if (data.inbox && data.messages) {
                    setInbox(data.inbox);
                    setMessages(data.messages);
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInbox();
    }, [username]);

    const handleShare = () => {
        const url = `${window.location.origin}/send/${username}`;
        if (navigator.share) {
            navigator.share({ title: 'Send me an anonymous note', url }).catch(() => {
                navigator.clipboard.writeText(url);
                alert('Sent link copied to clipboard!');
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Sent link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg text-brand-dark">
                <Loader2 className="animate-spin text-brand-rose" size={32} />
                <p className="mt-4 font-semibold opacity-70">Opening your inbox...</p>
            </div>
        );
    }

    if (error || !inbox) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg text-brand-dark p-6">
                <Heart size={48} className="text-brand-muted mb-4" />
                <h1 className="text-2xl font-bold font-serif mb-2">Inbox Not Found</h1>
                <p className="opacity-70 text-center mb-8 max-w-xs">This inbox doesn't exist. Claim it for yourself and start receiving love notes!</p>
                <Link href="/" className="px-6 py-3 bg-brand-rose text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95">Claim this Inbox</Link>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center font-heading text-brand-dark bg-brand-bg overflow-hidden selection:bg-brand-rose/20 selection:text-brand-rose">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-peach/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-rose/10 rounded-full blur-3xl animate-pulse-slow animate-delay-200"></div>
                <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-white/40 rounded-full blur-3xl"></div>
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 8px 32px 0 rgba(238, 43, 91, 0.05);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 4px 12px 0 rgba(238, 43, 91, 0.03);
                }
                .glass-card-premium {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 107, 139, 0.3);
                    box-shadow: 0 8px 24px -4px rgba(255, 107, 139, 0.2);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Main Container */}
            <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden">

                {/* Header Area */}
                <div className="pt-8 px-6 pb-2 flex flex-col items-center justify-center relative z-10 w-full mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart size={20} className="text-brand-rose fill-brand-rose animate-pulse-slow" />
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark">Your Inbox</h1>
                    </div>
                    <span className="text-sm font-medium text-brand-muted mb-3">@{inbox.username}</span>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white/60 hover:bg-white backdrop-blur-md border border-white/40 rounded-full text-brand-rose text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <Share2 size={14} strokeWidth={3} /> Share on Socials
                    </button>

                    <button className="absolute right-6 top-8 p-2 rounded-full bg-white/50 text-brand-muted hover:bg-white/80 hover:text-brand-dark transition-colors">
                        <Settings size={20} />
                    </button>
                </div>

                {/* Messages List Area */}
                <div className="flex-1 overflow-visible relative px-4 pt-2 pb-28">
                    <div className="no-scrollbar h-full overflow-y-auto pt-2 pb-8 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50 text-center px-8">
                                <Mail size={40} className="mb-4" />
                                <p className="font-semibold text-lg">It's quiet in here...</p>
                                <p className="text-sm">Share your link to start receiving anonymous notes!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    className={`flex flex-col gap-3 rounded-[2rem] p-6 active:scale-[0.98] transition-all cursor-pointer group hover:bg-white/90 ${msg.is_premium ? 'glass-card-premium' : 'glass-card'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose group-hover:bg-brand-rose/20 transition-colors relative">
                                                {msg.is_premium ? <Sparkles size={16} className="text-[#ff477e]" /> : <Lock size={16} />}
                                            </div>
                                            <span className="font-heading font-bold text-lg text-brand-dark">
                                                {msg.sender_name || 'Anonymous'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-medium text-brand-muted tracking-wide">
                                                {new Date(msg.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            {msg.is_premium && <span className="text-[10px] font-bold text-[#ff477e] uppercase tracking-wider mt-0.5">Premium</span>}
                                        </div>
                                    </div>
                                    <p className="pl-[52px] text-[15px] leading-relaxed text-brand-dark/90 font-inter whitespace-pre-wrap">
                                        {msg.content}
                                    </p>

                                    {/* Quick Reply for Premium Upsell */}
                                    <div className="pl-[52px] mt-2 flex gap-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedReplyMessage(msg); }}
                                            className="text-xs font-bold text-brand-rose opacity-70 hover:opacity-100 transition-opacity"
                                        >
                                            Share Reply to Story &rarr;
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {/* Empty Space for Scrolling */}
                        <div className="h-12" />
                    </div>

                    {/* Gradient Fade at Bottom of List */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-bg to-transparent pointer-events-none z-10"></div>
                </div>

                {/* Floating "Share" Button */}
                <div className="absolute bottom-28 left-0 right-0 px-6 z-20 flex justify-center">
                    <motion.button
                        onClick={handleShare}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full max-w-[320px] flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-brand-rose to-[#ff6b8b] py-4 text-white shadow-xl shadow-brand-rose/30 transition-all font-heading font-bold text-lg tracking-wide hover:shadow-brand-rose/40"
                    >
                        <Share2 size={20} className="stroke-[2.5px]" />
                        <span>Share Your Link</span>
                    </motion.button>
                </div>

                {/* Bottom Navigation */}
                <div className="absolute bottom-6 left-0 right-0 px-6 z-30">
                    <div className="glass-panel rounded-full px-2 py-2 flex items-center justify-between shadow-lg shadow-brand-dark/5">
                        <Link href={`/inbox/${username}`} className="relative flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all">
                            {/* Active Indicator */}
                            <div className="absolute inset-2 bg-brand-rose/10 rounded-full"></div>
                            <div className="relative z-10 text-brand-rose">
                                <Mail size={24} className="fill-brand-rose" strokeWidth={2.5} />
                            </div>
                        </Link>

                        <button className="flex-1 flex flex-col items-center justify-center h-12 text-brand-muted hover:text-brand-dark transition-colors">
                            <Compass size={24} strokeWidth={2} />
                        </button>

                        <Link href="/create" className="flex-1 flex flex-col items-center justify-center h-12 text-brand-muted hover:text-brand-dark transition-colors">
                            <PlusCircle size={24} strokeWidth={2} />
                        </Link>

                        <button className="flex-1 flex flex-col items-center justify-center h-12 text-brand-muted hover:text-brand-dark transition-colors">
                            <User size={24} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedReplyMessage && (
                <ReplyModal
                    isOpen={!!selectedReplyMessage}
                    onClose={() => setSelectedReplyMessage(null)}
                    message={selectedReplyMessage}
                    username={username}
                />
            )}
        </div>
    );
}
