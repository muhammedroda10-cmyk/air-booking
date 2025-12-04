'use client';

import { motion } from 'framer-motion';

export function FlightPath() {
    return (
        <div className="relative w-full h-64 overflow-hidden bg-slate-900 rounded-xl">
            {/* World Map Background (Simplified SVG) */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 400">
                <path d="M150,200 Q300,100 450,200 T750,200" fill="none" stroke="#334155" strokeWidth="2" />
                <circle cx="150" cy="200" r="4" fill="#64748b" />
                <circle cx="750" cy="200" r="4" fill="#64748b" />
            </svg>

            {/* Animated Path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
                <motion.path
                    d="M150,200 Q300,100 450,200 T750,200"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="3"
                    strokeDasharray="0 1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </svg>

            {/* Moving Plane */}
            <motion.div
                className="absolute top-0 left-0"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{
                    offsetPath: "path('M150,200 Q300,100 450,200 T750,200')",
                    width: "24px",
                    height: "24px",
                    background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%23f59e0b\"><path d=\"M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z\"/></svg>') no-repeat center/contain"
                }}
            />
        </div>
    );
}
