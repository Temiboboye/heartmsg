import { Sparkles, Star, Trophy, Diamond, Award, LucideIcon } from 'lucide-react';

export type CreatorLevel = 'Bronze Heart' | 'Silver Heart' | 'Gold Heart' | 'Diamond Heart';

export interface LevelThreshold {
    level: CreatorLevel;
    minEarned: number;
    color: string;
    bgClass: string;
    textClass: string;
    icon: LucideIcon;
    description: string;
}

export const CREATOR_LEVELS: LevelThreshold[] = [
    {
        level: 'Diamond Heart',
        minEarned: 10000,
        color: '#00F0FF',
        bgClass: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        textClass: 'text-cyan-500',
        icon: Diamond,
        description: 'Elite Tier Creator'
    },
    {
        level: 'Gold Heart',
        minEarned: 5000,
        color: '#FFD700',
        bgClass: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        textClass: 'text-amber-500',
        icon: Trophy,
        description: 'Star Creator'
    },
    {
        level: 'Silver Heart',
        minEarned: 1000,
        color: '#C0C0C0',
        bgClass: 'bg-gradient-to-r from-slate-300 to-slate-400',
        textClass: 'text-slate-500',
        icon: Star,
        description: 'Rising Creator'
    },
    {
        level: 'Bronze Heart',
        minEarned: 0,
        color: '#CD7F32',
        bgClass: 'bg-gradient-to-r from-orange-300 to-orange-400',
        textClass: 'text-orange-500',
        icon: Award,
        description: 'New Creator'
    }
];

export function getCreatorLevel(totalEarned: number): LevelThreshold {
    // Array is ordered highest to lowest, so we find the first one they qualify for
    return CREATOR_LEVELS.find(tier => totalEarned >= tier.minEarned) || CREATOR_LEVELS[3];
}

export function formatNumberShort(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}
