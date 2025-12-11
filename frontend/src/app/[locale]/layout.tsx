import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/context/language-context";
import { ToastProvider } from "@/context/toast-context";
import { locales } from "@/i18n/config";
import { ClientErrorBoundary } from "@/components/client-error-boundary";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Voyager - Air Ticket Booking",
    description: "Book your flights easily with Voyager",
};

export async function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    const currentLocale = (locale === 'ar' || locale === 'en') ? locale : 'en';
    const dir = currentLocale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={currentLocale} dir={dir} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased ${currentLocale === 'ar' ? 'font-arabic' : ''}`}
                suppressHydrationWarning
            >
                <LanguageProvider locale={currentLocale as 'en' | 'ar'}>
                    <ToastProvider>
                        <AuthProvider>
                            <ClientErrorBoundary>
                                {children}
                            </ClientErrorBoundary>
                        </AuthProvider>
                    </ToastProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
