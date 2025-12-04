"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

import en from '@/dictionaries/en.json';
import ar from '@/dictionaries/ar.json';

type Language = 'en' | 'ar';
type Dictionary = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    dir: 'ltr' | 'rtl';
    toggleLanguage: () => void;
    t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries = {
    en,
    ar
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
            setLanguage(savedLang);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ar' : 'en');
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const t = dictionaries[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, dir, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
