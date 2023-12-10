'use client';

import { useAppState } from '@/lib/providers/state-provider';
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import CypressProfileIcon from '../icons/cypress-profile-icon';

const AvatarPic = () => {
    const { state: { avatarUrl } } = useAppState()

    return (
        <Avatar>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
                <CypressProfileIcon />
            </AvatarFallback>
        </Avatar>
    )
}

export default AvatarPic
