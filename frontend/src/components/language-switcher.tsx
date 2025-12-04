'use client';

import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
    const { language, switchLanguage } = useLanguage();

    if (variant === 'compact') {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => switchLanguage(language === 'en' ? 'ar' : 'en')}
                className="gap-2 font-medium"
            >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'عربي' : 'English'}</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {language === 'en' ? 'English' : 'العربية'}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => switchLanguage('en')}
                    className={language === 'en' ? 'bg-accent' : ''}
                >
                    <span className="mr-2">🇺🇸</span>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => switchLanguage('ar')}
                    className={language === 'ar' ? 'bg-accent' : ''}
                >
                    <span className="mr-2">🇸🇦</span>
                    العربية
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
