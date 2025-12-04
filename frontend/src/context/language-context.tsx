"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';

import en from '@/dictionaries/en.json';
import ar from '@/dictionaries/ar.json';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

type Dictionary = typeof en;

interface LanguageContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
    dir: 'ltr' | 'rtl';
    toggleLanguage: () => void;
    t: Dictionary;
    switchLanguage: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Locale, Dictionary> = {
    en,
    ar
};

export function LanguageProvider({
    children,
    locale
}: {
    children: React.ReactNode;
    locale?: Locale;
}) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get locale from URL params or prop
    const urlLocale = (params?.locale as Locale) || locale || defaultLocale;
    const [language, setLanguageState] = useState<Locale>(urlLocale);

    // Sync with URL locale
    useEffect(() => {
        if (urlLocale && locales.includes(urlLocale)) {
            setLanguageState(urlLocale);
        }
    }, [urlLocale]);

    // Update document direction and lang attribute
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        // Add Arabic font class
        if (language === 'ar') {
            document.documentElement.classList.add('font-arabic');
        } else {
            document.documentElement.classList.remove('font-arabic');
        }
    }, [language]);

    const setLanguage = (lang: Locale) => {
        setLanguageState(lang);
    };

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ar' : 'en';
        switchLanguage(newLang);
    };

    // Switch language with URL update
    const switchLanguage = (lang: Locale) => {
        if (!pathname) return;

        // Replace current locale in path with new locale
        const segments = pathname.split('/');
        if (locales.includes(segments[1] as Locale)) {
            segments[1] = lang;
        } else {
            segments.splice(1, 0, lang);
        }
        const newPath = segments.join('/') || `/${lang}`;

        router.push(newPath);
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const t = dictionaries[language] || dictionaries[defaultLocale];

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            dir,
            toggleLanguage,
            t,
            switchLanguage
        }}>
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
