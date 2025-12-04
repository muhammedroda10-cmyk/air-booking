'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type Locale } from '@/i18n/config';

interface LocaleLinkProps extends Omit<React.ComponentProps<typeof Link>, 'href'> {
    href: string;
    children: React.ReactNode;
}

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
    const params = useParams();
    const locale = (params?.locale as Locale) || 'en';

    // If href already starts with locale, don't add it again
    const localizedHref = href.startsWith(`/${locale}`) || href.startsWith('http')
        ? href
        : `/${locale}${href.startsWith('/') ? href : `/${href}`}`;

    return (
        <Link href={localizedHref} {...props}>
            {children}
        </Link>
    );
}
