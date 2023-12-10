'use client';

import React from 'react'
import { MAX_FOLDERS_FREE_PLAN } from '@/lib/constants';
import { useAppState } from '@/lib/providers/state-provider';
import { Subscription } from '@/lib/supabase/supabase.types';
import CypressDiamondIcon from '../icons/cypress-diamond-icon';
import { Progress } from '../ui/progress';

interface PlanUsageProps {
    foldersLength?: number;
    subscription: Subscription | null;
}

const PlanUsage = ({
    foldersLength = 0,
    subscription
}: PlanUsageProps) => {
    const { workspaceId, state } = useAppState();

    const stateFoldersLength = state.workspaces.find(
        workspace => workspace.workspaceId === workspaceId
    )?.folders.length || foldersLength;

    const usagePercentage = (stateFoldersLength / MAX_FOLDERS_FREE_PLAN) * 100

    return (
        <article className="mb-4">
            {subscription?.status !== 'active' && (
                <>
                    <NotActiveSubscription usagePercentage={usagePercentage} />
                    <Progress
                        value={usagePercentage}
                        className='h-1'
                    />
                </>
            )}
        </article>
    )
}

export default PlanUsage;

const NotActiveSubscription = ({
    usagePercentage,
}: {
    usagePercentage: number
}) => {
    return (
        <div className="flex gap-2 text-muted-foreground mb-2 items-center">
            <div className="h-4 w-4">
                <CypressDiamondIcon />
            </div>

            <div className="flex justify-between w-full items-center">
                <div>Free Plan</div>
                <small>{usagePercentage.toFixed(0)}% / 100%</small>
            </div>
        </div>
    )
}
