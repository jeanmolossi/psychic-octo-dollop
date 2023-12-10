'use client';

import React from 'react'
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerProps {
    children: React.ReactNode;
    getValue?: (emoji: string) => void;
}

export const EmojiPicker = ({
    children,
    getValue
}: EmojiPickerProps) => {
    const router = useRouter()
    const Picker = dynamic(() => import('emoji-picker-react'));

    const onClick = (selected: EmojiClickData) => {
        getValue?.(selected.emoji)
    }

    return (
        <div className="flex items-center">
            <Popover>
                <PopoverTrigger className='cursor-pointer'>{children}</PopoverTrigger>
                <PopoverContent className='p-0 border-none'>
                    <Picker
                        onEmojiClick={onClick}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default EmojiPicker
