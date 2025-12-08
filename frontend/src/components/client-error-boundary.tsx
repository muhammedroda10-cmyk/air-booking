'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface Props {
    children: ReactNode;
}

export function ClientErrorBoundary({ children }: Props) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
}
