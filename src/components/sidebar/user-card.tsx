import db from '@/lib/supabase/db';
import { Subscription } from '@/lib/supabase/supabase.types'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import CypressProfileIcon from '../icons/cypress-profile-icon';
import LogoutButton from '../global/logout-button';
import { LogOut } from 'lucide-react';
import ModeToggle from '../global/mode-toggle';
import AvatarPic from './avatar';

interface UserCardProps {
    subscription: Subscription | null;
}

const UserCard = async ({ subscription }: UserCardProps) => {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

  return (
    <article className='hidden sm:flex justify-between items-center px-4 py-2 dark:bg-Neutrals/neutrals-12 rounded-3xl'>
        <aside className="flex justify-center items-center gap-2">
            <AvatarPic />

            <div className="flex flex-col">
                <span className="text-muted-foreground">
                    {subscription?.status === 'active' ? 'Pro Plan' : 'Free Plan'}
                </span>

                <small className="w-[100px] overflow-hidden overflow-ellipsis">
                    {user.email}
                </small>
            </div>
        </aside>

        <div className="flex items-center justify-center">
            <LogoutButton>
                <LogOut />
            </LogoutButton>

            <ModeToggle />
        </div>
    </article>
  )
}

export default UserCard
