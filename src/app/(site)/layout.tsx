import Header from '@/components/landing-page/header';
import React from 'react';

export default function Layout({ children }: {
    children: React.ReactNode,
}) {
    return (
        <main>
            <Header />
            {children}
        </main>
    )
}