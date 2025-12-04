'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// Standard spinner loading
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className={cn("animate-spin rounded-full border-b-2 border-primary", sizeClasses[size], className)} />
    );
}

interface AirplaneLoaderProps {
    text?: string;
    className?: string;
}

// Flying airplane loader for search operations
export function AirplaneLoader({ text = "Searching flights...", className }: AirplaneLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12", className)}>
            {/* Airplane Animation Container */}
            <div className="relative w-64 h-24 mb-6">
                {/* Cloud Trail */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="cloud-trail" />
                </div>

                {/* Flying Airplane */}
                <div className="airplane-fly">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-12 h-12 text-primary drop-shadow-lg"
                    >
                        <path
                            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                            fill="currentColor"
                        />
                    </svg>
                </div>

                {/* Speed Lines */}
                <div className="speed-lines">
                    <div className="speed-line delay-0" />
                    <div className="speed-line delay-100" />
                    <div className="speed-line delay-200" />
                </div>
            </div>

            {/* Loading Text */}
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300 animate-pulse">
                {text}
            </p>

            {/* Progress Dots */}
            <div className="flex gap-1 mt-3">
                <span className="loading-dot" style={{ animationDelay: '0ms' }} />
                <span className="loading-dot" style={{ animationDelay: '150ms' }} />
                <span className="loading-dot" style={{ animationDelay: '300ms' }} />
            </div>

            <style jsx>{`
                .airplane-fly {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    animation: flyAcross 2s ease-in-out infinite;
                }
                
                @keyframes flyAcross {
                    0% {
                        left: -20%;
                        transform: translateY(-50%) rotate(-5deg);
                    }
                    25% {
                        transform: translateY(-60%) rotate(-2deg);
                    }
                    50% {
                        left: 50%;
                        transform: translateY(-50%) translateX(-50%) rotate(0deg);
                    }
                    75% {
                        transform: translateY(-40%) rotate(2deg);
                    }
                    100% {
                        left: 120%;
                        transform: translateY(-50%) rotate(5deg);
                    }
                }
                
                .speed-lines {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                }
                
                .speed-line {
                    position: absolute;
                    height: 2px;
                    background: linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5), transparent);
                    animation: speedLine 0.8s ease-out infinite;
                }
                
                .speed-line:nth-child(1) {
                    top: 30%;
                    width: 60px;
                }
                .speed-line:nth-child(2) {
                    top: 50%;
                    width: 80px;
                }
                .speed-line:nth-child(3) {
                    top: 70%;
                    width: 50px;
                }
                
                .delay-0 { animation-delay: 0ms; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                
                @keyframes speedLine {
                    0% {
                        left: 100%;
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                    }
                    100% {
                        left: -100px;
                        opacity: 0;
                    }
                }
                
                .cloud-trail {
                    position: absolute;
                    top: 50%;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(to right, 
                        transparent 0%, 
                        rgba(203, 213, 225, 0.3) 20%, 
                        rgba(203, 213, 225, 0.6) 40%, 
                        rgba(203, 213, 225, 0.3) 60%, 
                        transparent 100%
                    );
                    transform: translateY(-50%);
                    animation: cloudTrail 2s linear infinite;
                }
                
                @keyframes cloudTrail {
                    0% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                    100% {
                        opacity: 0.3;
                    }
                }
                
                .loading-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: linear-gradient(to right, #3b82f6, #60a5fa);
                    animation: bounce 0.6s infinite alternate;
                }
                
                @keyframes bounce {
                    0% {
                        transform: translateY(0);
                        opacity: 0.5;
                    }
                    100% {
                        transform: translateY(-8px);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

// Full page loading overlay
export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <AirplaneLoader text={text} />
        </div>
    );
}

// Skeleton loader for cards
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow animate-pulse">
            <div className="h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
        </div>
    );
}

// Flight card skeleton
export function FlightCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-center space-y-1">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                    </div>
                    <div className="h-0.5 w-24 bg-slate-200 dark:bg-slate-700" />
                    <div className="text-center space-y-1">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
            </div>
        </div>
    );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                </td>
            ))}
        </tr>
    );
}

// Inline loading button state
export function ButtonLoader({ className }: { className?: string }) {
    return (
        <svg
            className={cn("animate-spin h-4 w-4", className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}
