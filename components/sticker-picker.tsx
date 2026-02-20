"use client";

import { X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

const STICKERS = [
    { id: 'couple', src: '/stickers/couple.png', alt: 'Cute couple' },
    { id: 'cat', src: '/stickers/cat.png', alt: 'Cat with heart' },
    { id: 'bear', src: '/stickers/bear.png', alt: 'Bear with heart eyes' },
    { id: 'bunny', src: '/stickers/bunny.png', alt: 'Happy bunny' },
    { id: 'dog', src: '/stickers/dog.png', alt: 'Loyal dog' },
    { id: 'fox', src: '/stickers/fox.png', alt: 'Cute fox' },
    { id: 'frog', src: '/stickers/frog.png', alt: 'Happy frog' },
    { id: 'koala', src: '/stickers/koala.png', alt: 'Sleepy koala' },
    { id: 'monkey', src: '/stickers/monkey.png', alt: 'Cheeky monkey' },
    { id: 'panda', src: '/stickers/panda.png', alt: 'Sweet panda' },
    { id: 'penguin', src: '/stickers/penguin.png', alt: 'Little penguin' },
    { id: 'turtle', src: '/stickers/turtle.png', alt: 'Friendly turtle' },
];

interface StickerPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StickerPicker({ isOpen, onClose, onSelect, onUpload }: StickerPickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={onClose} />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-[100] shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-stone-900">Add a photo</h2>
                            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-stone-500 font-medium mb-4">Choose a cute character</p>

                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {STICKERS.map((sticker) => (
                                <button
                                    key={sticker.id}
                                    onClick={() => onSelect(sticker.src)}
                                    className="aspect-square bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors p-2 flex items-center justify-center border border-transparent hover:border-pink-200"
                                >
                                    <img src={sticker.src} alt={sticker.alt} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <ImageIcon size={20} />
                            Upload from gallery
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={onUpload}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
