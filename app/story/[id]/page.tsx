"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { THEMES, ThemeId, FontId, StoryData, SlideData, Theme, MUSIC_TRACKS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronLeft, ChevronRight, Share2, Lock, Play, Pause, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const runtime = 'edge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function StoryViewPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get('success');

    const [story, setStory] = useState<StoryData | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [musicAutoStarted, setMusicAutoStarted] = useState(false);
    const [showReplyConfirm, setShowReplyConfirm] = useState(false);

    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const verifyPaystack = async () => {
            const reference = searchParams.get('reference');
            const provider = searchParams.get('payment_provider');

            if (provider === 'paystack' && reference && id) {
                setVerifying(true);
                try {
                    const res = await fetch('/api/verify-payment/paystack', {
                        method: 'POST',
                        body: JSON.stringify({ reference, storyId: id }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await res.json() as { success: boolean };

                    if (data.success) {
                        // Reload or update verification state locally
                        window.location.href = `/story/${id}?success=true`;
                    } else {
                        setError("Payment verification failed. Please contact support.");
                    }
                } catch (e) {
                    setError("Error verifying payment.");
                } finally {
                    setVerifying(false);
                }
            }
        }

        verifyPaystack();
    }, [id, searchParams]);

    useEffect(() => {
        if (isSuccess && story?.isPaid) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ee2b5b', '#ff9a9e', '#ffffff']
            });
        }
    }, [isSuccess, story]);

    useEffect(() => {
        // Trigger confetti celebration if addon is present and story is paid
        if (story?.isPaid && story.addons?.includes('confetti')) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ee2b5b', '#ff9a9e', '#ffffff']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ee2b5b', '#ff9a9e', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [story]);

    useEffect(() => {
        const fetchStory = async () => {
            try {
                const response = await fetch(`/api/stories/${id}`, { cache: 'no-store' });
                if (!response.ok) {
                    const errorData = await response.json() as { error?: string };
                    throw new Error(errorData.error || 'Failed to load story');
                }

                const data = await response.json() as StoryData;
                setStory(data);
            } catch (err: any) {
                console.error('Error fetching story:', err);
                setError(err.message || 'Failed to load story');
            } finally {
                setLoading(false);
            }
        };

        if (id && !verifying) fetchStory();
    }, [id, verifying]);

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 gap-4">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-rose-500 rounded-full animate-spin" />
                <p className="text-stone-400 font-medium animate-pulse">Reliving the memories...</p>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                    <Heart size={40} className="text-stone-300" />
                </div>
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Story Not Found</h1>
                <p className="text-stone-500 max-w-xs">{error || "This love story might have moved on, or the link is incorrect."}</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-8 px-8 py-3 bg-stone-900 text-white rounded-full font-bold shadow-lg"
                >
                    Create Your Own
                </button>
            </div>
        );
    }

    // Payment Check
    if (!story.isPaid) {
        // Fallback theme for locked state (or use story's theme if available but locked)
        const lockedTheme = THEMES.find(t => t.id === story.themeId) || THEMES[0];

        return (
            <div className={cn(
                "h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-1000",
                lockedTheme.gradient
            )}>
                {/* Premium Grain Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                <div className={cn("w-24 h-24 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-xl animate-float border border-white/20", lockedTheme.glassClass)}>
                    <Lock size={40} className="text-white" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-sm font-heading">A Gift Awaits</h1>
                <p className="text-white/90 max-w-xs mb-8 text-lg font-medium leading-relaxed">
                    This special story has been created using OurLoveNotes Premium. Unlock it to view the memories.
                </p>

                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ storyId: story.id })
                            });

                            if (!res.ok) throw new Error('Checkout failed');

                            const { url } = await res.json() as { url: string };
                            if (url) window.location.href = url;
                        } catch (e) {
                            alert("Something went wrong initiating payment.");
                        }
                    }}
                    className="group relative px-8 py-4 bg-white text-rose-600 rounded-[2rem] font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-3 overflow-hidden"
                >
                    <span className="relative z-10">Unlock Story</span>
                    <span className="relative z-10 w-px h-4 bg-rose-200"></span>
                    <span className="relative z-10">$5.00</span>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        );
    }

    const currentTheme = THEMES.find(t => t.id === story.themeId) || THEMES[0];
    const currentSlide = story.slides[currentSlideIndex];

    const handleReply = async () => {
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyId: story.id, type: 'reply', amount: 200, currency: 'usd' })
            });
            if (!res.ok) throw new Error('Checkout failed');
            const { url } = await res.json() as { url: string };
            if (url) window.location.href = url;
        } catch (e) {
            alert('Something went wrong initiating your reply payment.');
        }
    };

    const handleFirstInteraction = () => {
        setMusicAutoStarted(true);
    };

    const nextSlide = () => {
        if (currentSlideIndex < story.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    return (
        <div
            className={cn(
                "relative w-full h-[100dvh] overflow-hidden flex flex-col transition-colors duration-1000 ease-in-out font-sans",
                currentTheme.gradient
            )}
            onClick={handleFirstInteraction}
            onTouchStart={handleFirstInteraction}
        >
            {/* Premium Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Top Bar */}
            <header className="relative z-[60] w-full px-6 py-6 flex items-center justify-between">
                <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
                    <Heart size={24} className={cn("fill-current", currentTheme.textColor)} />
                </button>

                <div className="flex flex-col items-center">
                    <span className={cn("text-[10px] font-bold tracking-[0.3em] uppercase opacity-40", currentTheme.textColor)}>
                        Page {currentSlideIndex + 1} / {story.slides.length}
                    </span>
                    <div className="flex gap-1 mt-1.5">
                        {story.slides.map((_, i) => (
                            <div key={i} className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                i === currentSlideIndex ? "w-4 opacity-100" : "w-1 opacity-20",
                                currentTheme.textColor.replace('text-', 'bg-')
                            )} />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        navigator.share?.({
                            title: 'OurLoveNotes Story',
                            url: window.location.href
                        }).catch(() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                        });
                    }}
                    className="p-3 rounded-full hover:bg-black/5 transition-colors"
                >
                    <Share2 size={24} className={currentTheme.textColor} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full relative flex flex-col items-center justify-center p-6 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[500px] flex flex-col items-center"
                    >
                        {/* Memory Canvas */}
                        <div className="w-full aspect-[4/5] md:aspect-square relative mb-8 md:mb-12 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/20 shrink-0">
                            {currentSlide.imageUrl ? (
                                <img
                                    src={currentSlide.imageUrl}
                                    alt="Story memory"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <div className={cn("absolute inset-0 flex items-center justify-center", currentTheme.glassClass)}>
                                    <Heart size={80} className={cn("opacity-10", currentTheme.textColor)} />
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="w-full px-4 text-center">
                            <h2 className={cn(
                                "text-3xl md:text-5xl font-extrabold leading-[1.3] transition-all duration-300",
                                currentTheme.textColor,
                                story.fontId
                            )}>
                                {currentSlide.content}
                            </h2>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Navigation Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-20">
                <button
                    onClick={prevSlide}
                    className={cn(
                        "p-4 rounded-full pointer-events-auto transition-all transform active:scale-95",
                        currentSlideIndex === 0 ? "opacity-0 invisible" : "opacity-40 hover:opacity-100"
                    )}
                >
                    <ChevronLeft size={48} className={currentTheme.textColor} />
                </button>
                <button
                    onClick={nextSlide}
                    className={cn(
                        "p-4 rounded-full pointer-events-auto transition-all transform active:scale-95",
                        currentSlideIndex === story.slides.length - 1 ? "opacity-0 invisible" : "opacity-40 hover:opacity-100"
                    )}
                >
                    <ChevronRight size={48} className={currentTheme.textColor} />
                </button>
            </div>

            {/* Brand Footer with PLG CTA */}
            <footer className="relative z-60 w-full pb-10 flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => {
                            navigator.share?.({
                                title: 'OurLoveNotes Story',
                                url: window.location.href
                            }).catch(() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied!');
                            });
                        }}
                        className={cn(
                            "px-6 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-48",
                            currentTheme.buttonClass
                        )}
                    >
                        <Share2 size={16} />
                        Share this Story
                    </button>
                    <button
                        onClick={handleReply}
                        className={cn(
                            "px-6 py-3 rounded-full font-bold shadow transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-48",
                            currentTheme.glassClass
                        )}
                    >
                        <MessageCircle size={16} className="fill-current" />
                        Send a Reply ❤️
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className={cn(
                            "px-4 py-2 rounded-full font-bold text-xs shadow transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1 opacity-40 hover:opacity-80",
                            currentTheme.textColor
                        )}
                    >
                        Create your own story <Heart size={10} className="fill-current" />
                    </button>
                    <div className="flex items-center gap-2 opacity-30">
                        <span className={cn("text-[10px] font-bold tracking-widest uppercase", currentTheme.textColor)}>Powered by OurLoveNotes</span>
                    </div>
                </div>
            </footer>

            {/* Music Control - Floating Bottom Right */}
            {story.musicId && (
                <div className="absolute bottom-6 right-6 z-[70]">
                    <MusicPlayer musicId={story.musicId} theme={currentTheme} autoStart={musicAutoStarted} />
                </div>
            )}
        </div>
    );
}

function MusicPlayer({ musicId, theme, autoStart }: { musicId: string, theme: Theme, autoStart: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const track = MUSIC_TRACKS.find(t => t.id === musicId);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!track) return;
        audioRef.current = new Audio(track.src);
        audioRef.current.loop = true;

        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        };
    }, [track]);

    // Autoplay on first user interaction
    useEffect(() => {
        if (autoStart && !hasStarted.current && audioRef.current) {
            hasStarted.current = true;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
    }, [autoStart]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    if (!track) return null;

    return (
        <button
            onClick={togglePlay}
            className={cn(
                "p-3 rounded-full shadow-xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 pr-4",
                theme.glassClass,
                isPlaying ? "bg-white/90 text-stone-900" : theme.textColor
            )}
        >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
            <span className="text-xs font-bold max-w-[100px] truncate">{track.name}</span>
        </button>
    );
}
