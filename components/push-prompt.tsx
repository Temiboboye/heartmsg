"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OneSignal from 'react-onesignal';

export default function PushPrompt({ inboxId, username }: { inboxId: string, username: string }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const initOneSignal = async () => {
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            if (!appId) return;

            try {
                // Check if already sliding down or initialized
                if (!window.OneSignal) {
                    await OneSignal.init({
                        appId: appId,
                        allowLocalhostAsSecureOrigin: true
                    });
                }

                const hasOptedIn = OneSignal.User.PushSubscription.optedIn;

                if (hasOptedIn) {
                    setIsSubscribed(true);
                    // Ensure the user is logged in with this inbox's username so we can target them
                    OneSignal.login(username);
                } else {
                    // Show our custom prompt slightly delayed
                    setTimeout(() => setShowPrompt(true), 3000);
                }
            } catch (e) {
                console.error("OneSignal initialization failed", e);
            }
        };

        if (typeof window !== 'undefined') {
            initOneSignal();
        }
    }, [username]);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            await OneSignal.Slidedown.promptPush();

            // Re-check permission after prompt
            const hasOptedIn = OneSignal.User.PushSubscription.optedIn;
            if (hasOptedIn) {
                setIsSubscribed(true);
                setShowPrompt(false);
                // "Login" the user to this external ID (their username)
                // so we can target them by username from the backend REST API
                await OneSignal.login(username);
            } else {
                setShowPrompt(false);
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            setShowPrompt(false);
        }
        setIsLoading(false);
    };

    if (isSubscribed) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white/90 backdrop-blur-xl border border-brand-rose/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 z-50 pointer-events-auto"
                >
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose shrink-0">
                            <Bell size={24} className={isLoading ? "animate-pulse" : ""} />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-dark leading-tight">Get instant alerts</h3>
                            <p className="text-xs text-brand-muted mt-0.5">Know the exact second someone loves you 💌</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="w-full mt-2 py-3 bg-brand-rose text-white rounded-2xl font-bold hover:bg-brand-rose/90 transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Turn on Notifications"}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
