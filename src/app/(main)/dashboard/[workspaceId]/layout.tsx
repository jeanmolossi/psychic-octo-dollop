import MobileSidebar from '@/components/sidebar/mobile-sidebar';
import { Sidebar } from '@/components/sidebar/sidebar';
import React from 'react'

const Layout = ({
    children,
    params,
}: {
    children: React.ReactNode;
    params: {
        workspaceId: string;
    };
}) => {
    return (
        <main className='flex overflow-hidden h-screen w-screen'>
            <Sidebar params={params} />

            <MobileSidebar>
                <Sidebar params={params} className='w-screen inline-block sm:hidden' />
            </MobileSidebar>

            <div
                className="dark:border-Neutrals-12/70
                border-l-[1px]
                w-full
                relative
                overflow-y-scroll"
            >
                {children}
            </div>
        </main>
    )
}

export default Layout;
export const metadata = {
    title: {
        template: 'Workspace | %s',
        default: 'Workspace'
    }
}
