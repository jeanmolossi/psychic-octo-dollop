
import {
    getCollaboratingWorkspaces,
    getFolders,
    getPrivateWorkspaces,
    getSharedWorkspaces,
    getUserSubscriptionStatus
} from '@/lib/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react'
import { twMerge } from 'tailwind-merge';
import { WorkspaceDropdown } from './workspace-dropdown';
import PlanUsage from './plan-usage';
import NativeNavigation from './native-navigation';
import { ScrollArea } from '../ui/scroll-area';
import FoldersDropdownList from './folders-dropdown-list';
import UserCard from './user-card';

interface SidebarProps {
    params: {
        workspaceId: string;
    }
    className?: string;
}

export const Sidebar = async ({
    params,
    className,
}: SidebarProps) => {
    const supabase = createServerComponentClient({ cookies })

    // user

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null;

    // subscription

    const { subscription, subscriptionErr } = await getUserSubscriptionStatus(user.id)

    // folders

    const { folders, foldersError } = await getFolders(params.workspaceId)

    // error

    if (subscriptionErr || foldersError) redirect('/dashboard')

    const [
        privateWorkspaces,
        collaboratingWorkspaces,
        sharedWorkspaces
    ] = await Promise.all([
        getPrivateWorkspaces(user.id),
        getCollaboratingWorkspaces(user.id),
        getSharedWorkspaces(user.id),
    ])

    const defaultWorkspace = [
        ...privateWorkspaces,
        ...sharedWorkspaces,
        ...collaboratingWorkspaces,
    ].find(w => w.workspaceId === params.workspaceId)


    // get all different workspaces private collaborating shared


    return (
        <aside
            className={twMerge(
                "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between",
                className
            )}
        >
            <div>
                <WorkspaceDropdown
                    privateWorkspaces={privateWorkspaces}
                    sharedWorkspaces={sharedWorkspaces}
                    collaboratingWorkspaces={collaboratingWorkspaces}
                    defaultValue={defaultWorkspace}
                />

                <PlanUsage
                    foldersLength={folders?.length}
                    subscription={subscription}
                />

                <NativeNavigation myWorkspaceId={params.workspaceId} />

                <ScrollArea className='relative h-[450px]'>
                    <div className="pointer-events-none w-full absolute bottom-0 h-20 bg-gradient-to-t from-background to-transparent z-40"></div>
                    <FoldersDropdownList
                        workspaceFolders={folders || []}
                        workspaceId={params.workspaceId}
                    />
                </ScrollArea>
            </div>

            <UserCard subscription={subscription} />
        </aside>
    )
}
