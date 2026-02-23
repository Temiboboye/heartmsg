"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PushPrompt({ inboxId, username }: { inboxId: string, username: string }) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if push is supported and sw is registered
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);

            // Check current subscription status
            navigator.serviceWorker.register('/sw.js').then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (subscription) {
                        setIsSubscribed(true);
                    } else {
                        // Only show prompt if they haven't subscribed yet
                        // Wait a few seconds before popping it up to not overwhelm them
                        setTimeout(() => setShowPrompt(true), 3000);
                    }
                });
            });
        }
    }, [username]);

    // Convert VAPID key
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // Re-check permission just in case
            if (Notification.permission === 'denied') {
                alert('You have blocked notifications. Please enable them in your browser settings.');
                setIsLoading(false);
                setShowPrompt(false);
                return;
            }

            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!publicVapidKey) {
                console.error("Missing VAPID public key");
                setIsLoading(false);
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Send to our backend
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inboxId,
                    subscription
                })
            });

            if (res.ok) {
                setIsSubscribed(true);
                setShowPrompt(false);
            } else {
                console.error('Failed to save subscription');
            }
        } catch (error) {
            // User likely denied permission
            console.error('Error subscribing to push:', error);
            setShowPrompt(false);
        }
        setIsLoading(false);
    };

    if (!isSupported || isSubscribed) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white/90 backdrop-blur-xl border border-brand-rose/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 z-50"
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
