// Types for the application

export type ThemeId = 'rose' | 'midnight' | 'gold' | 'berry' | 'forest' | 'ocean' | 'sunset' | 'lavender';

export interface Theme {
    id: ThemeId;
    name: string;
    gradient: string;
    textColor: string;
    accentColor: string;
    buttonClass: string;
    glassClass: string;
}

export const THEMES: Theme[] = [
    {
        id: 'rose',
        name: 'Rose',
        gradient: 'bg-gradient-to-br from-pink-100 via-rose-100 to-red-100',
        textColor: 'text-rose-900',
        accentColor: 'bg-rose-500',
        buttonClass: 'bg-rose-500 hover:bg-rose-600 text-white',
        glassClass: 'bg-white/40 border-white/40 shadow-rose-900/5',
    },
    {
        id: 'midnight',
        name: 'Midnight',
        gradient: 'bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-900',
        textColor: 'text-slate-100',
        accentColor: 'bg-indigo-500',
        buttonClass: 'bg-indigo-500 hover:bg-indigo-600 text-white',
        glassClass: 'bg-black/30 border-white/10 shadow-black/20 text-white',
    },
    {
        id: 'gold',
        name: 'Gold',
        gradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
        textColor: 'text-amber-900',
        accentColor: 'bg-amber-500',
        buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
        glassClass: 'bg-white/40 border-amber-200/40 shadow-amber-900/5',
    },
    {
        id: 'berry',
        name: 'Berry',
        gradient: 'bg-gradient-to-br from-fuchsia-100 via-purple-100 to-pink-100',
        textColor: 'text-fuchsia-900',
        accentColor: 'bg-fuchsia-600',
        buttonClass: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
        glassClass: 'bg-white/40 border-fuchsia-200/40 shadow-fuchsia-900/5',
    },
    {
        id: 'forest',
        name: 'Forest',
        gradient: 'bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100',
        textColor: 'text-emerald-900',
        accentColor: 'bg-emerald-500',
        buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        glassClass: 'bg-white/40 border-emerald-200/40 shadow-emerald-900/5',
    },
    {
        id: 'ocean',
        name: 'Ocean',
        gradient: 'bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100',
        textColor: 'text-sky-900',
        accentColor: 'bg-sky-500',
        buttonClass: 'bg-sky-500 hover:bg-sky-600 text-white',
        glassClass: 'bg-white/40 border-sky-200/40 shadow-sky-900/5',
    },
    {
        id: 'sunset',
        name: 'Sunset',
        gradient: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100',
        textColor: 'text-orange-900',
        accentColor: 'bg-orange-500',
        buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
        glassClass: 'bg-white/40 border-orange-200/40 shadow-orange-900/5',
    },
    {
        id: 'lavender',
        name: 'Lavender',
        gradient: 'bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100',
        textColor: 'text-purple-900',
        accentColor: 'bg-purple-500',
        buttonClass: 'bg-purple-500 hover:bg-purple-600 text-white',
        glassClass: 'bg-white/40 border-purple-200/40 shadow-purple-900/5',
    },
];

export type FontId = 'font-heading' | 'font-body' | 'font-handwritten';

export interface SlideData {
    id: string;
    content: string;
    imageUrl?: string;
    themeId?: ThemeId; // Optional override
    fontId?: FontId;   // Optional override
}

export interface MusicTrack {
    id: string;
    name: string;
    src: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
    { id: 'piano', name: 'Gentle Piano', src: '/music/piano.mp3' },
    { id: 'guitar', name: 'Acoustic Love', src: '/music/guitar.mp3' },
    { id: 'synth', name: 'Dreamy Synth', src: '/music/synth.mp3' },
    { id: 'lofi', name: 'Lo-Fi Chill', src: '/music/piano.mp3' }, // Placeholder reuse
    { id: 'orchestral', name: 'Cinematic', src: '/music/synth.mp3' }, // Placeholder reuse
    { id: 'jazz', name: 'Smooth Jazz', src: '/music/guitar.mp3' }, // Placeholder reuse
];

export type AddonId = 'no-watermark' | 'elegant-font' | 'romantic-music' | 'effects' | 'custom-link' | 'confetti';

export interface StoryData {
    id: string;
    themeId: ThemeId;
    fontId: FontId;
    musicId?: string;
    isPaid?: boolean;
    slides: SlideData[];
    created_at?: string;
    addons?: AddonId[];
    email?: string; // Add email for receipt
    customSlug?: string; // Optional custom URL slug
}

// --- New Inbox Types ---

export interface InboxData {
    id: string;
    username: string;
    created_at?: string;
}

export interface InboxMessageData {
    id: string;
    inbox_id: string;
    sender_name: string;
    content: string;
    is_premium: boolean;
    addons?: AddonId[];
    payment_reference?: string;
    created_at?: string;
}

export const INBOX_ADDONS_USD: { id: AddonId; name: string; price: number }[] = [
    { id: 'confetti', name: 'Confetti 🎉', price: 0.50 },
    { id: 'elegant-font', name: 'Elegant font ✨', price: 0.50 },
    { id: 'romantic-music', name: 'Love track 🎵', price: 0.50 }
];

export const INBOX_ADDONS_NGN: { id: AddonId; name: string; price: number }[] = [
    { id: 'confetti', name: 'Confetti 🎉', price: 500 },
    { id: 'elegant-font', name: 'Elegant font ✨', price: 500 },
    { id: 'romantic-music', name: 'Love track 🎵', price: 500 }
];
