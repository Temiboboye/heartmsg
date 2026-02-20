import Link from 'next/link';
import { Heart, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center font-sans bg-stone-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-300/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-md">
                <div className="w-24 h-24 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-8 border border-rose-100 rotate-12 transition-transform hover:rotate-0 duration-300">
                    <Search size={40} className="text-rose-400" />
                </div>

                <h1 className="text-6xl font-heading font-black text-stone-900 mb-4 tracking-tight">
                    404
                </h1>

                <h2 className="text-2xl font-bold text-stone-800 mb-3">
                    Nothing to see here!
                </h2>

                <p className="text-stone-500 mb-10 text-lg leading-relaxed max-w-sm">
                    Are you looking for an inbox or a story? The link might be broken, or it hasn't been created yet.
                </p>

                <Link href="/">
                    <button className="group relative px-8 py-4 bg-stone-900 text-white rounded-full font-bold shadow-2xl shadow-stone-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden">
                        <span className="relative z-10">Claim your own Inbox</span>
                        <Heart size={18} className="fill-current text-rose-400 group-hover:scale-110 transition-transform relative z-10" />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-stone-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </Link>
            </div>

            <div className="absolute bottom-8 left-0 w-full text-center">
                <span className="text-xs font-bold text-stone-400 tracking-widest uppercase">ourlovenotes.com</span>
            </div>
        </div>
    );
}
