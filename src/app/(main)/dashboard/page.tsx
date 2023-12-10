import DashboardSetup from '@/components/dashboard-setup/dashboard-setup';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react'
import { getUserSubscriptionStatus, getUserWorkspace } from '@/lib/supabase/queries'

const Dashboard = async () => {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null;

    const { workspace } = await getUserWorkspace(user.id);
    const { subscription, subscriptionErr } = await getUserSubscriptionStatus(user.id);

    if (!workspace) {
        return (
            <div
                className='bg-background
                h-screen
                w-screen
                flex
                justify-center
                items-center'
            >
                <DashboardSetup
                    user={user}
                    subscription={subscription}
                />
            </div>
        )
    }

    redirect(`/dashboard/${workspace.workspaceId}`)
}

export default Dashboard;
