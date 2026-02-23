"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Crown, Medal, ArrowLeft, Loader2, Award } from 'lucide-react';
import Link from 'next/link';
import { getCreatorLevel, formatNumberShort } from '@/lib/levels';

export const runtime = 'edge';

interface LeaderboardUser {
    username: string;
    total_earned: number;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard', { cache: 'no-store' })
            .then(res => res.json())
            .then((data: any) => {
                if (data.success && data.leaderboard) {
                    setUsers(data.leaderboard);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="text-yellow-500 fill-yellow-500" size={24} />;
        if (index === 1) return <Medal className="text-slate-400 fill-slate-300" size={24} />;
        if (index === 2) return <Medal className="text-amber-600 fill-amber-500" size={24} />;
        return <span className="font-bold text-lg text-brand-muted/50 w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="relative min-h-[100dvh] w-full flex flex-col items-center bg-brand-bg font-heading overflow-x-hidden selection:bg-brand-rose/20 selection:text-brand-rose pb-20">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-peach/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-brand-rose/10 rounded-full blur-[100px] animate-pulse-slow animate-delay-200"></div>
                <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 w-full max-w-2xl px-6 pt-12 pb-8 flex flex-col items-center">
                <Link href="/" className="absolute left-6 top-12 p-3 bg-white/50 hover:bg-white rounded-full transition-all text-brand-dark shadow-sm">
                    <ArrowLeft size={20} />
                </Link>

                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-brand-rose to-pink-400 rounded-2xl shadow-xl shadow-brand-rose/20 mb-6 rotate-3">
                    <Trophy size={32} className="text-white fill-white/20" />
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-brand-dark text-center leading-tight mb-4">
                    Top Creators
                </h1>
                <p className="text-brand-muted text-center text-lg max-w-md">
                    The most loved users on OurLoveNotes. Climb the ranks by receiving premium notes!
                </p>
            </div>

            {/* Leaderboard List */}
            <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col gap-3">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-brand-rose" size={40} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 flex flex-col items-center text-center opacity-50">
                        <Award size={48} className="mb-4 text-brand-muted" />
                        <p className="text-xl font-bold">No Ranked Creators Yet</p>
                        <p>Be the first to earn Hearts and claim the #1 spot!</p>
                    </div>
                ) : (
                    users.map((user, index) => {
                        const level = getCreatorLevel(user.total_earned);
                        const LevelIcon = level.icon;
                        const isTop3 = index < 3;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                                key={user.username}
                            >
                                <Link href={`/send/${user.username}`}>
                                    <div className={`
                                        flex items-center gap-4 p-4 md:p-5 rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98] group
                                        ${isTop3 ? 'bg-white/90 shadow-xl border border-white/60' : 'bg-white/60 shadow-sm hover:bg-white/80 border border-white/40'}
                                    `}>
                                        {/* Rank */}
                                        <div className="w-10 flex justify-center">
                                            {getRankIcon(index)}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 flex flex-col">
                                            <span className={`font-bold text-xl ${isTop3 ? 'text-brand-dark' : 'text-brand-dark/80'}`}>
                                                @{user.username}
                                            </span>

                                            {/* Level Badge inline */}
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <LevelIcon size={12} className={level.textClass} />
                                                <span className={`text-[10px] uppercase tracking-wider font-bold ${level.textClass}`}>
                                                    {level.level}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Hearts Total */}
                                        <div className={`
                                            flex items-center gap-2 px-4 py-2 rounded-2xl
                                            ${isTop3 ? level.bgClass : 'bg-brand-rose/10'}
                                        `}>
                                            <Heart size={16} className={isTop3 ? 'text-white fill-white' : 'text-brand-rose fill-brand-rose/20'} />
                                            <span className={`font-bold text-lg ${isTop3 ? 'text-white' : 'text-brand-rose'}`}>
                                                {formatNumberShort(user.total_earned)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Sticky Bottom CTA to start earning */}
            <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
                <Link href="/" className="pointer-events-auto">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full shadow-2xl font-bold tracking-wide hover:shadow-stone-900/30 transition-all font-heading"
                    >
                        <span>Start Earning Hearts</span>
                        <Heart size={16} className="fill-brand-rose text-brand-rose" />
                    </motion.button>
                </Link>
            </div>
        </div>
    );
}
