import { NextRequest, NextResponse } from 'next/server'

const locales = ['en', 'ar']
const defaultLocale = 'en'

// Paths that should not be redirected to locale
const publicPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/images',
    '/fonts',
]

function getLocale(request: NextRequest): string {
    // Check if locale is in the pathname
    const pathname = request.nextUrl.pathname
    const pathnameLocale = locales.find(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
    if (pathnameLocale) return pathnameLocale

    // Check Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language')
    if (acceptLanguage) {
        const preferredLocale = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().substring(0, 2))
            .find(lang => locales.includes(lang))
        if (preferredLocale) return preferredLocale
    }

    return defaultLocale
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // Check if pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (pathnameHasLocale) {
        return NextResponse.next()
    }

    // Redirect to default locale
    const locale = getLocale(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)

    // Preserve query string
    newUrl.search = request.nextUrl.search

    return NextResponse.redirect(newUrl)
}

export const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}
