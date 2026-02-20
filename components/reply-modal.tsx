"use client";

import { X, Share2, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { InboxMessageData } from '@/lib/types';

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: InboxMessageData;
    username: string;
}

export default function ReplyModal({ isOpen, onClose, message, username }: ReplyModalProps) {
    const [replyText, setReplyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // First pass to ensure images/fonts are loaded if any
            await htmlToImage.toPng(cardRef.current, { cacheBust: true });

            // Second pass for the final image (higher quality)
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 3, // High res for Insta stories
                cacheBust: true,
                style: { transform: 'scale(1)', margin: '0' }
            });

            // Convert dataUrl to Blob for Web Share API
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'ourlovenotes-reply.png', { type: 'image/png' });

            const shareData = {
                title: 'My Anonymous Reply',
                files: [file]
            };

            // Try native share (Mobile Instagram/Snapchat/WhatsApp)
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback to Download for Desktop
                const link = document.createElement('a');
                link.download = `reply-to-${username}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Error sharing image:', error);
            alert('Failed to generate sharing image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-sm flex flex-col gap-4 relative z-10"
            >
                {/* Header Actions */}
                <div className="flex justify-between items-center px-4">
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md">
                        <X size={24} />
                    </button>
                    <span className="text-white font-bold font-heading tracking-wide">Story Reply</span>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* The Shareable Card Image Container */}
                <div
                    ref={cardRef}
                    className="relative w-full rounded-[2.5rem] p-8 flex flex-col justify-center items-center overflow-hidden min-h-[450px]"
                    style={{
                        background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)' // Beautiful Instagram-style gradient base
                    }}
                >
                    {/* Background Noise/Texture */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                    {/* Decorative Blobs */}
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] left-[-20%] w-48 h-48 bg-rose-400/30 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Original Message Bubble */}
                    <div className="w-full bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl mb-4 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full">They asked</span>
                        </div>
                        <p className="text-gray-800 font-medium text-[17px] leading-relaxed break-words font-sans">
                            {message.content}
                        </p>
                    </div>

                    {/* Reply Bubble */}
                    {replyText.trim() && (
                        <div className="w-full bg-rose-500/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl text-white relative z-10 mt-auto">
                            <div className="flex items-center gap-2 mb-2 justify-end">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest px-2 py-0.5 bg-black/10 rounded-full">@{username} replied</span>
                            </div>
                            <p className="font-bold text-[19px] leading-relaxed break-words font-heading text-right">
                                {replyText}
                            </p>
                        </div>
                    )}

                    {/* Footer Branding for the Screenshot */}
                    <div className="absolute bottom-4 left-0 w-full text-center z-10">
                        <span className="text-[11px] font-bold text-rose-900/40 tracking-widest uppercase">ourlovenotes.com/{username}</span>
                    </div>
                </div>

                {/* Input Area (Not included in image) */}
                <div className="w-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-brand-rose/20 text-gray-800 placeholder-gray-400 p-4 resize-none h-24 font-medium"
                        maxLength={200}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-400 font-medium px-2">
                        <span>{replyText.length}/200</span>
                        <span>Will be saved as an image</span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleShare}
                    disabled={isGenerating || !replyText.trim()}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold font-heading text-lg shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Generating Image...</span>
                        </>
                    ) : (
                        <>
                            {typeof navigator.canShare === 'function' ? <Share2 size={20} /> : <Download size={20} />}
                            <span>{typeof navigator.canShare === 'function' ? 'Share to Instagram/Snapchat' : 'Download Story Image'}</span>
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
