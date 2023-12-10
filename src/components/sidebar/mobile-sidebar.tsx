'use client';

import { Menu } from 'lucide-react';
import React, { useState } from 'react'
import CypressPageIcon from '../icons/cypress-page-icon';
import clsx from 'clsx';

export const nativeNavigations = [
    {
        title: 'Sidebar',
        id: 'sidebar',
        customIcon: Menu,
    },
    {
        title: 'Pages',
        id: 'pages',
        customIcon: CypressPageIcon,
    }
] as const;

const MobileSidebar = ({
    children
}: {
    children: React.ReactNode;
}) => {
    const [selectedNav, setSelectedNav] = useState<'sidebar' | 'pages' | ''>('')
  return (
    <>
        {selectedNav === 'sidebar' && <>{children}</>}
        <nav
            className='bg-black/10
            backdrop-blur-lg
            sm:hidden
            fixed
            z-50
            bottom-0
            left-0
            right-0
            '
        >
            <ul
                className='flex
                justify-between
                items-center
                p-4'
            >
                {nativeNavigations.map((item) => (
                    <li
                        key={item.id}
                        className='flex items-center flex-col justify-center'
                        onClick={() => setSelectedNav(item.id)}
                    >
                        <item.customIcon />
                        <small className={clsx({ 'text-muted-foreground': selectedNav !== item.id })}>{item.title}</small>
                    </li>
                ))}
            </ul>
        </nav>
    </>
  )
}

export default MobileSidebar
