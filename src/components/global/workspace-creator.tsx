'use client';

import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { User, workspace } from '@/lib/supabase/supabase.types';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Lock, Plus, Share } from 'lucide-react';
import { Button } from '../ui/button';
import { v4 } from 'uuid';
import { addCollaborators, createWorkspace } from '@/lib/supabase/queries';
import CollaboratorSearch from './collaborator-search';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '../ui/use-toast';

export const WorkspaceCreator = () => {
    const { user, subscription } = useSupabaseUser()
    const router = useRouter()
    const { toast } = useToast();

    const [permissions, setPermissions] = useState('private')
    const [title, setTitle] = useState('')
    const [collaborators, setCollaborators] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false)

    const addCollaborator = (user: User) => {
        setCollaborators((prevCollaborators) => [...prevCollaborators, user])
    }

    const removeCollaborator = (user: User) => {
        setCollaborators(
            (prevCollaborators) =>
                prevCollaborators.filter(colab => colab.id !== user.id),
        )
    }

    const createItem = async () => {
        const uuid = v4()
        setIsLoading(true);

        if (user?.id) {
            const newWorkspace: workspace = {
                data: null,
                createdAt: new Date().toISOString(),
                iconId: '🧑‍💼',
                workspaceId: uuid,
                inTrash: '',
                title,
                workspaceOwner: user.id,
                logo: null,
                bannerUrl: '',
            }

            await createWorkspace(newWorkspace);

            if (permissions === 'shared') {
                await addCollaborators(collaborators, uuid);
            }

            toast({ title: 'Success', description: 'Created the workspace' })
            router.refresh();
        }

        setIsLoading(false);
    }

    const createButtonDisabled = !title
        || (permissions === 'shared' && collaborators.length === 0)
        || isLoading

    return (
        <div className='flex gap-4 flex-col'>
            <div>
                <Label htmlFor='name' className='text-sm text-muted-foreground'>
                    Name
                </Label>

                <div className="flex justify-center items-center gap-2">
                    <Input
                        name='name'
                        value={title}
                        placeholder='Workspace name'
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
            </div>
            <>
                <Label
                    htmlFor='permissions'
                    className='text-sm text-muted-foreground'
                >
                    Permission
                </Label>

                <Select
                    onValueChange={(value) => setPermissions(value)}
                    defaultValue={permissions}
                >
                    <SelectTrigger className='w-full h-26 -mt-3'>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="private">
                                <div className='p-2 flex gap-4 justify-center items-center'>
                                    <Lock />
                                    <article className='text-left flex flex-col'>
                                        <span>Private</span>
                                        <p>Your workspace is private to you. You can choose to share it later.</p>
                                    </article>
                                </div>
                            </SelectItem>

                            <SelectItem value="shared">
                                <div className='p-2 flex gap-4 justify-center items-center'>
                                    <Share />
                                    <article className='text-left flex flex-col'>
                                        <span>Shared</span>
                                        <p>You can invite collaborators.</p>
                                    </article>
                                </div>
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </>

            {permissions === 'shared' && (
                <div>
                    <CollaboratorSearch
                        existingCollaborators={collaborators}
                        getCollaborator={addCollaborator}
                    >
                        <Button type='button'
                            className='text-sm mt-4'
                        >
                            <Plus />
                            Add Collaborators
                        </Button>
                    </CollaboratorSearch>

                    <div className="mt-4">
                        <span className="text-sm text-muted-foreground">
                            Collaborators {collaborators.length || ''}
                        </span>

                        <ScrollArea
                            className='h-[120px] w-full
                            rounded-md border border-muted-foreground/20'
                        >
                            {collaborators.length
                                ?  collaborators.map(c => (
                                    <div className="p-4 flex w-full" key={c.id}>
                                        <div className="flex gap-4 items-center w-full">
                                            <Avatar>
                                                <AvatarImage src="/avatars/7.png"></AvatarImage>
                                                <AvatarFallback>PJ</AvatarFallback>
                                            </Avatar>

                                            <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis flex-1">
                                                {c.email}
                                            </div>
                                        </div>

                                        <Button
                                            variant={'secondary'}
                                            onClick={() => removeCollaborator(c)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))
                                : (
                                    <div className="absolute inset-0 flex justify-center items-center">
                                        <span className="text-muted-foreground text-sm">You have no collaborators</span>
                                    </div>
                                )}
                        </ScrollArea>
                    </div>
                </div>
            )}

            <Button
                type='button'
                disabled={createButtonDisabled}
                onClick={createItem}
                variant={'secondary'}
            >
                Create
            </Button>
        </div>
    )
}
