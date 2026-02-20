"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-300/30 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-300/20 rounded-full blur-3xl animate-pulse-slow animate-delay-200"></div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
            <Heart size={16} fill="white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-stone-800">OurLoveNotes</span>
        </div>
        <Link href="/login" className="text-sm font-medium text-stone-500 hover:text-stone-900">
          Login
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md space-y-6 w-full"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-rose-100/80 text-rose-600 text-xs font-semibold tracking-wider uppercase border border-rose-200">
            The new way to say it
          </span>

          <h1 className="text-5xl md:text-6xl font-heading font-bold leading-tight text-stone-900">
            Share a link <br />
            <span className="text-rose-500 italic font-handwritten font-normal">they'll never forget.</span>
          </h1>

          <p className="text-lg text-stone-500 max-w-xs mx-auto leading-relaxed">
            Create beautiful stories or receive anonymous heartfelt notes.
          </p>

          <div className="pt-8 flex flex-col gap-4 w-full">
            <Link href="/create" className="w-full">
              <button className="w-full group relative inline-flex items-center justify-center px-8 py-4 bg-stone-900 text-white border-2 border-stone-900 rounded-full font-medium text-lg overflow-hidden transition-all hover:bg-stone-800 active:scale-95 shadow-xl shadow-stone-900/10">
                <span className="mr-2">Send a 💌 note</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <ClaimInboxForm />
          </div>
        </motion.div>
      </main>

      {/* Footer / Social Proof */}
      <footer className="p-6 text-center z-10 w-full mt-auto">
        <p className="text-sm text-stone-400">
          Trusted by hopeless romantics everywhere.
        </p>
      </footer>
    </div>
  );
}

function ClaimInboxForm() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await res.json() as { error?: string, username?: string };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim inbox');
      }

      // Successfully claimed, push to their inbox
      router.push(`/inbox/${data.username}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleClaim} className="flex flex-col gap-2 w-full">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-stone-400 font-medium">ourlovenotes.com/</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="yourname"
          className="w-full pl-[135px] pr-4 py-4 rounded-full border-2 border-stone-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none text-lg font-medium text-stone-900 transition-all"
          disabled={loading}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || username.length < 3}
        className="w-full group relative inline-flex items-center justify-center px-8 py-4 bg-stone-900 text-white rounded-full font-medium text-lg overflow-hidden shadow-xl shadow-stone-900/20 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : 'Claim your Inbox'}
      </button>
    </form>
  );
}
