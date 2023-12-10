import React from 'react'
import SubscriptionModalProvider from '@/lib/providers/subscription-modal-provider';
import { getActiveProductsWithPrice } from '@/lib/supabase/queries';

const Layout = async ({
    children
}: {
    children: React.ReactNode;
    params: any;
}) => {
    const { products, getProductsErr } = await getActiveProductsWithPrice();

    if (getProductsErr) throw new Error('failed to get active products');

    return (
        <main className='flex overflow-hidden h-screen'>
            <SubscriptionModalProvider products={products}>
                {children}
            </SubscriptionModalProvider>
        </main>
    )
}

export default Layout;
