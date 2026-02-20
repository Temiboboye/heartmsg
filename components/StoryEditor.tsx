"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEMES, ThemeId, SlideData, MUSIC_TRACKS, MusicTrack } from '@/lib/types';
import { Plus, Music, Type, Palette, Sparkles, ChevronLeft, Trash2, Heart, Image as ImageIcon, Check, Eye, Play, Pause, X } from 'lucide-react';
import Link from 'next/link';
import StickerPicker from './sticker-picker';
import CheckoutModal, { CheckoutData } from './checkout-modal';
import { AddonId } from '@/lib/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type FontId = 'font-heading' | 'font-body' | 'font-handwritten';

interface FontOption {
    id: FontId;
    name: string;
    class: string;
}

const FONTS: FontOption[] = [
    { id: 'font-heading', name: 'Modern', class: 'font-heading' },
    { id: 'font-body', name: 'Classic', class: 'font-body' },
    { id: 'font-handwritten', name: 'Handwritten', class: 'font-handwritten' },
];

const slideVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 5 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.3, ease: "easeIn" as any } }
};

export default function StoryEditor() {
    const router = useRouter();
    const [slides, setSlides] = useState<SlideData[]>([{ id: '1', content: '' }]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPublishing, setIsPublishing] = useState(false);
    const [activeTheme, setActiveTheme] = useState<ThemeId>('rose');
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [currentFont, setCurrentFont] = useState<FontId>('font-heading');
    const [currentMusic, setCurrentMusic] = useState<MusicTrack | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textEditorRef = useRef<HTMLDivElement>(null);
    const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];
    const currentFontOption = FONTS.find(f => f.id === currentFont) || FONTS[0];
    const currentSlide = slides[currentSlideIndex];

    // Audio cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handlePublishClick = () => {
        setShowCheckoutModal(true);
    };

    const handleFinalPublish = async (checkoutData: CheckoutData) => {
        setIsPublishing(true);
        setShowCheckoutModal(false);
        try {
            // 1. Prepare story data
            const storyData = {
                theme_id: activeTheme,
                font_id: currentFont,
                music_id: currentMusic?.id,
                email: checkoutData.email,
                addons: checkoutData.addons,
                customSlug: checkoutData.customSlug,
                slides: slides.map((slide, index) => ({
                    content: slide.content,
                    image_url: slide.imageUrl,
                    order: index
                }))
            };

            // 2. POST to local API
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storyData)
            });

            if (!response.ok) {
                const errorData = await response.json() as { error?: string };
                throw new Error(errorData.error || 'Failed to publish story');
            }

            const { id } = await response.json() as { id: string };

            // 3. Initiate Checkout based on currency
            let checkoutUrl = '';

            if (checkoutData.currency === 'USD') {
                // Stripe Flow
                const checkoutResponse = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storyId: id,
                        addons: checkoutData.addons,
                        email: checkoutData.email,
                        numPages: slides.length
                    })
                });

                if (!checkoutResponse.ok) {
                    const err = await checkoutResponse.json() as { error?: string };
                    throw new Error(err.error || 'Failed to initiate Stripe checkout');
                }
                const { url } = await checkoutResponse.json() as { url: string };
                checkoutUrl = url;
            } else {
                // Paystack Flow (NGN)
                const checkoutResponse = await fetch('/api/checkout/paystack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storyId: id,
                        addons: checkoutData.addons,
                        email: checkoutData.email,
                        numPages: slides.length
                    })
                });

                if (!checkoutResponse.ok) {
                    const err = await checkoutResponse.json() as { error?: string };
                    throw new Error(err.error || 'Failed to initiate Paystack checkout');
                }
                const { url } = await checkoutResponse.json() as { url: string };
                checkoutUrl = url;
            }

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error publishing story:', error);
            alert(`Failed to publish story: ${error.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const addSlide = () => {
        const newSlide = { id: Date.now().toString(), content: '' };
        setSlides([...slides, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const updateSlideContent = (content: string) => {
        if (content.length > 200) return; // Character limit
        const newSlides = [...slides];
        newSlides[currentSlideIndex].content = content;
        setSlides(newSlides);
    };

    // Sync contenteditable cursor bug when switching slides
    useEffect(() => {
        const el = textEditorRef.current;
        if (!el) return;
        const current = el.innerText;
        if (current !== currentSlide.content) {
            el.innerText = currentSlide.content;
        }
    }, [currentSlideIndex]);

    const handleTextInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = (e.currentTarget.innerText || '').slice(0, 200);
        updateSlideContent(text);
    };

    const handleTextTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        textEditorRef.current?.focus();
    };

    const updateSlideImage = (url: string) => {
        const newSlides = [...slides];
        newSlides[currentSlideIndex].imageUrl = url;
        setSlides(newSlides);
        setShowStickerPicker(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Show local preview immediately for better UX
        const localUrl = URL.createObjectURL(file);
        updateSlideImage(localUrl);

        try {
            // 2. Upload to local API (which handles R2)
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const { url } = await response.json() as { url: string };
            updateSlideImage(url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Note: Image upload failed. The story can still be published, but this image might not persist.');
        }
    };

    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimize = async () => {
        if (!currentSlide.content.trim()) return;
        setIsOptimizing(true);
        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentSlide.content })
            });
            const data = await response.json() as { optimized?: string };
            if (data.optimized) {
                updateSlideContent(data.optimized);
            }
        } catch (error) {
            console.error('Optimization failed:', error);
        } finally {
            setIsOptimizing(false);
        }
    };

    const deleteSlide = () => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter((_, i) => i !== currentSlideIndex);
        setSlides(newSlides);
        if (currentSlideIndex >= newSlides.length) {
            setCurrentSlideIndex(newSlides.length - 1);
        }
    };

    return (
        <div className={cn(
            "relative w-full h-[100dvh] overflow-hidden flex flex-col transition-colors duration-1000 ease-in-out font-sans",
            currentTheme.gradient
        )}>
            {/* Premium Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] mix-blend-overlay animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/20 rounded-full blur-[120px] mix-blend-overlay animate-float animation-delay-500" />
            </div>

            {/* Structured Top Navigation Bar */}
            <header className="relative z-[60] w-full px-6 py-4 flex items-center justify-between">
                <Link href="/inbox" className="p-2 rounded-full hover:bg-black/5 transition-colors">
                    <ChevronLeft size={24} className={currentTheme.textColor} />
                </Link>

                <div className="flex flex-col items-center">
                    <span className={cn("text-sm font-bold tracking-widest uppercase opacity-40", currentTheme.textColor)}>
                        Page {currentSlideIndex + 1} / {slides.length}
                    </span>
                    <div className="flex gap-1 mt-1">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    idx === currentSlideIndex ? "w-4" : "w-1 opacity-20",
                                    currentTheme.textColor.replace('text-', 'bg-')
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {slides.length > 1 && (
                        <button onClick={deleteSlide} className="p-2 rounded-full hover:bg-red-500/10 text-stone-600 hover:text-red-500 transition-all">
                            <Trash2 size={22} />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Editor Canvas - Refined and Polished */}
            <main className="flex-1 w-full relative flex flex-col items-center justify-center p-6 z-10 transition-all duration-500">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide.id}
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-[450px] flex flex-col items-center gap-10"
                    >
                        {/* Photo Card Area - Minimalist Frame */}
                        <div className="relative group w-full flex justify-center shrink-0 mb-8 md:mb-10">
                            <motion.div
                                onClick={() => setShowStickerPicker(true)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                    "relative w-72 h-72 md:w-80 md:h-80 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden shrink-0",
                                    currentTheme.glassClass.replace('bg-', 'bg-opacity-40 bg-'),
                                    "border-white/30",
                                    currentSlide.imageUrl ? "border-solid border-white/20" : "hover:border-white/60"
                                )}
                            >
                                {currentSlide.imageUrl ? (
                                    <img
                                        src={currentSlide.imageUrl}
                                        alt="Story memory"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center p-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/40 flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/20">
                                            <ImageIcon size={28} className={currentTheme.textColor} />
                                        </div>
                                        <p className={cn("text-lg font-bold font-heading", currentTheme.textColor)}>Select Photo</p>
                                        <p className="text-xs opacity-50 font-medium">Capture a memory</p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </motion.div>
                        </div>
                        {/* Text Content Area - contenteditable for iOS compat */}
                        <div
                            className="w-full relative px-4 pt-4 pb-32 text-center z-[100] pointer-events-auto min-h-[250px] cursor-text flex flex-col items-center justify-start"
                            onClick={(e) => { e.stopPropagation(); textEditorRef.current?.focus(); }}
                            onTouchEnd={(e) => { e.stopPropagation(); textEditorRef.current?.focus(); }}
                        >
                            <div
                                ref={textEditorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleTextInput}
                                data-placeholder="Type your story..."
                                className={cn(
                                    "w-full max-w-full bg-transparent text-center text-4xl md:text-5xl font-extrabold outline-none leading-[1.3] transition-all duration-300 cursor-text min-h-[3em] empty:before:content-[attr(data-placeholder)] empty:before:opacity-10",
                                    currentTheme.textColor,
                                    currentFont
                                )}
                                style={{ WebkitUserSelect: 'text', userSelect: 'text', touchAction: 'manipulation', WebkitTouchCallout: 'default', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                spellCheck={false}
                            />

                            {/* Progressive Character Limit Bar */}
                            <div className="mt-8 flex flex-col items-center gap-2 pointer-events-none">
                                <div className="w-48 h-[2px] bg-black/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentSlide.content.length / 200) * 100}%` }}
                                        className={cn("h-full", currentTheme.textColor.replace('text-', 'bg-'))}
                                    />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">
                                    {currentSlide.content.length} / 200
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Floating Hub - Segmented controls */}
            <div className="absolute bottom-0 left-0 right-0 z-[70] w-full px-6 pb-8 md:pb-12 pt-6 bg-gradient-to-t from-black/20 to-transparent flex flex-col items-center">
                <div className="w-full max-w-[450px] space-y-4">

                    {/* Pickers (Themed Sliders) */}
                    <div className="flex justify-center gap-4">
                        <AnimatePresence>
                            {showThemePicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className={cn("absolute bottom-full mb-4 flex gap-2 p-2 rounded-full backdrop-blur-3xl border border-white/20 shadow-xl", currentTheme.glassClass)}
                                >
                                    {THEMES.map(t => (
                                        <button key={t.id} onClick={() => setActiveTheme(t.id)}
                                            className={cn("w-8 h-8 rounded-full border-2 transition-transform", t.accentColor, activeTheme === t.id ? "border-white scale-110" : "border-transparent hover:scale-105")}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showFontPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className={cn("absolute bottom-full mb-4 flex gap-2 p-1 rounded-full backdrop-blur-3xl border border-white/20 shadow-xl", currentTheme.glassClass)}
                                >
                                    {FONTS.map(f => (
                                        <button key={f.id} onClick={() => { setCurrentFont(f.id); setShowFontPicker(false); }}
                                            className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", currentFont === f.id ? "bg-white text-stone-900" : cn("hover:bg-white/10", currentTheme.textColor))}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showMusicPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className={cn("absolute bottom-full mb-4 flex flex-col gap-1 p-2 rounded-[1.5rem] backdrop-blur-3xl border border-white/20 shadow-xl w-64", currentTheme.glassClass)}
                                >
                                    <div className={cn("px-2 py-1 text-xs font-bold opacity-50 uppercase tracking-wider", currentTheme.textColor)}>Select Music</div>
                                    {MUSIC_TRACKS.map(track => (
                                        <button
                                            key={track.id}
                                            onClick={() => {
                                                if (currentMusic?.id === track.id) {
                                                    // Toggle play/pause preview
                                                    if (isPlayingPreview) {
                                                        setIsPlayingPreview(false);
                                                        audioRef.current?.pause();
                                                    } else {
                                                        setIsPlayingPreview(true);
                                                        audioRef.current?.play().catch(e => console.error("Audio play failed", e));
                                                    }
                                                } else {
                                                    audioRef.current?.pause();
                                                    setCurrentMusic(track);
                                                    setIsPlayingPreview(true);

                                                    const newAudio = new Audio(track.src);
                                                    audioRef.current = newAudio;
                                                    newAudio.play().catch(e => console.error("Audio play failed", e));
                                                    newAudio.onended = () => setIsPlayingPreview(false);
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all",
                                                currentMusic?.id === track.id ? "bg-white text-stone-900" : cn("hover:bg-white/10", currentTheme.textColor)
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {currentMusic?.id === track.id && isPlayingPreview ? <Pause size={14} /> : <Play size={14} />}
                                                {track.name}
                                            </div>
                                            {currentMusic?.id === track.id && <Check size={14} />}
                                        </button>
                                    ))}
                                    {currentMusic && (
                                        <button onClick={() => {
                                            audioRef.current?.pause();
                                            setCurrentMusic(null);
                                            setIsPlayingPreview(false);
                                        }} className={cn("mt-1 text-xs opacity-50 hover:opacity-100 py-1", currentTheme.textColor)}>
                                            Remove Music
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Integrated Dock + Side-by-Side Actions */}
                    <div className="flex flex-col gap-4">
                        {/* Interactive Icons */}
                        <div className={cn("flex items-center justify-between p-2 rounded-full backdrop-blur-3xl border border-white/20 shadow-lg", currentTheme.glassClass)}>
                            <div className="flex items-center gap-1">
                                <IconButton icon={<Palette size={20} />} active={showThemePicker} onClick={() => { setShowThemePicker(!showThemePicker); setShowFontPicker(false); setShowMusicPicker(false); }} theme={currentTheme} />
                                <IconButton icon={<Type size={20} />} active={showFontPicker} onClick={() => { setShowFontPicker(!showFontPicker); setShowThemePicker(false); setShowMusicPicker(false); }} theme={currentTheme} />
                            </div>

                            <motion.button onClick={addSlide} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className={cn("w-12 h-12 rounded-full text-white shadow-md flex items-center justify-center", currentTheme.buttonClass)}
                            >
                                <Plus size={24} strokeWidth={3} />
                            </motion.button>

                            <div className="flex items-center gap-1">
                                <IconButton icon={<Music size={20} />} active={showMusicPicker} onClick={() => { setShowMusicPicker(!showMusicPicker); setShowThemePicker(false); setShowFontPicker(false); }} theme={currentTheme} />
                                <IconButton
                                    icon={isOptimizing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                                    onClick={handleOptimize}
                                    theme={currentTheme}
                                />
                            </div>
                        </div>

                        {/* Primary Commit Row */}
                        <div className="grid grid-cols-2 gap-3 pb-2 z-[80] relative">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="h-14 rounded-[1.5rem] bg-white text-stone-900 border border-white shadow-xl flex items-center justify-center gap-2 font-bold text-sm tracking-tight cursor-pointer active:scale-95 transition-transform relative z-[85]"
                                onClick={() => setShowPreview(true)}
                            >
                                <Eye size={18} />
                                Preview
                            </motion.button>

                            <motion.button
                                onClick={handlePublishClick}
                                disabled={isPublishing}
                                whileTap={{ scale: 0.97 }}
                                className={cn(
                                    "h-14 rounded-[1.5rem] bg-stone-950 text-white shadow-xl flex items-center justify-center gap-2 font-bold text-sm tracking-tight transition-all cursor-pointer active:scale-95",
                                    isPublishing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isPublishing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Publishing...
                                    </div>
                                ) : (
                                    <>
                                        <Heart size={18} className="fill-white" />
                                        Publish
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={(url) => updateSlideImage(url)}
                onUpload={handleImageUpload}
            />

            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                onSubmit={handleFinalPublish}
                isProcessing={isPublishing}
                numPages={slides.length}
            />

            {/* Live Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden font-sans",
                            currentTheme.gradient
                        )}
                    >
                        {/* Premium Grain Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        {/* Top Bar Navigation */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                            <button
                                onClick={() => setShowPreview(false)}
                                className={cn(
                                    "p-3 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-xl",
                                    currentTheme.glassClass,
                                    currentTheme.textColor
                                )}
                            >
                                <X size={24} />
                            </button>
                            <div className={cn("text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md shadow-lg", currentTheme.glassClass, currentTheme.textColor)}>
                                PREVIEW MODE
                            </div>
                        </div>

                        {/* Slide Content (Reused styles from viewer) */}
                        <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center p-6 z-10">
                            <div className="relative group w-full flex justify-center shrink-0 mb-10">
                                <div className={cn(
                                    "relative w-[320px] h-[320px] rounded-[3rem] shadow-2xl overflow-hidden shrink-0 border border-white/20 transition-all",
                                    currentTheme.glassClass.replace('bg-', 'bg-opacity-40 bg-')
                                )}>
                                    {currentSlide.imageUrl ? (
                                        <img
                                            src={currentSlide.imageUrl}
                                            alt="Story memory"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center opacity-50">
                                            <ImageIcon size={48} className={cn("mb-4", currentTheme.textColor)} />
                                            <p className={cn("text-lg font-bold font-heading", currentTheme.textColor)}>No Photo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full relative px-4 text-center">
                                <p className={cn(
                                    "text-4xl md:text-5xl font-extrabold leading-[1.3] break-words whitespace-pre-wrap",
                                    currentTheme.textColor,
                                    currentFont
                                )}>
                                    {currentSlide.content || "Empty content"}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IconButton({ icon, onClick, active, theme }: { icon: React.ReactNode, onClick?: () => void, active?: boolean, theme: any }) {
    return (
        <button onClick={onClick} className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            active ? "bg-white/20 scale-90" : "hover:bg-white/10",
            theme.textColor
        )}>
            {icon}
        </button>
    );
}
