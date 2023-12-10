'use client';

import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { User } from '@/lib/supabase/supabase.types';
import React, { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Loader2, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { getUsersFromSearch } from '@/lib/supabase/queries';

interface CollaboratorSearchProps {
    existingCollaborators: User[];
    getCollaborator: (collaborator: User) => void;
    children: React.ReactNode;
}

const CollaboratorSearch = ({
    children,
    existingCollaborators,
    getCollaborator,
}: CollaboratorSearchProps) => {
    const { user } = useSupabaseUser()

    const [searchResults, setSearchResults] = useState<User[]>([])
    const [loading, setLoading] = useState(false)

    const timerRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoading(true)
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () => {
            const users = await getUsersFromSearch(e.target.value)
            setSearchResults(users)
            setLoading(false)
        }, 700)
    }

    const alreadySelectedAndLogged = (searchResult: User) => {
        return !existingCollaborators.some(existing => existing.id === searchResult.id)
            && searchResult.id !== user?.id
    }

    return (
        <Sheet>
            <SheetTrigger className='w-full'>{children}</SheetTrigger>
            <SheetContent className='w-[400px] sm:w-[540px]'>
                <SheetHeader>
                    <SheetTitle>Search Collaborator</SheetTitle>
                    <SheetDescription>
                        <p className="text-sm text-muted-foreground">
                            You can also remove collaborators after adding them{' '}
                            on settings tab.
                        </p>
                    </SheetDescription>
                </SheetHeader>

                <div className="flex justify-center items-center gap-2 mt-2">
                    {loading ? (
                        <Loader2 className='animate-slow-spin' />
                    ) : (
                        <Search />
                    )}
                    <Input
                        name='name'
                        className='dark:bg-background'
                        placeholder='E-mail'
                        onChange={onChangeHandler}
                    />
                </div>

                <ScrollArea className='mt-6 w-full rounded-md'>
                    {searchResults
                        .filter(alreadySelectedAndLogged)
                        .map(user => (
                            <div key={user.id} className='p-4 flex justify-between items-center'>
                                <div className='flex gap-4 items-center'>
                                    <Avatar className='w-8 h-8'>
                                        <AvatarImage src="/avatars/7.png" />
                                        <AvatarFallback>CP</AvatarFallback>
                                    </Avatar>

                                    <div
                                        className="text-sm gap-2 overflow-hidden overflow-ellipsis w-[180px] text-muted-foreground"
                                    >
                                        {user.email}
                                    </div>
                                </div>

                                <Button variant={'secondary'}
                                    onClick={() => getCollaborator(user)}
                                >
                                    Add
                                </Button>
                            </div>
                        ))}

                    {searchResults
                        .filter(alreadySelectedAndLogged)
                        .length === 0
                    && (
                        <div className="min-h-[240px] flex flex-col justify-center items-center gap-4">
                            <p className='text-center'>
                                Your search has empty result
                                {existingCollaborators.length > 0 && searchResults.length > 0
                                    ? ' or you have added all collaborators'
                                    : ' try another search'}
                            </p>

                            <span className='text-5xl'>
                                {existingCollaborators.length > 0 && searchResults.length > 0 ? '😄' : '😢'}
                            </span>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

export default CollaboratorSearch
