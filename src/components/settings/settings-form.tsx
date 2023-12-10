'use client';

import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useToast } from '../ui/use-toast'
import { useAppState } from '@/lib/providers/state-provider';
import { User } from '@/lib/supabase/supabase.types';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Briefcase, CreditCard, ExternalLink, Lock, LogOut, Plus, Share, UserIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import CollaboratorSearch from '../global/collaborator-search';
import { addCollaborators, deleteWorkspace, getCollaborators, removeCollaborators, updateWorkspace } from '@/lib/supabase/queries';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import CypressProfileIcon from '../icons/cypress-profile-icon';
import Link from 'next/link';
import { postData } from '@/lib/utils';
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider';
import LogoutButton from '../global/logout-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { v4 } from 'uuid';
import Loader from '../global/loader';

const SettingsForm = () => {
    const { toast } = useToast()
    const { state, workspaceId, dispatch } = useAppState()
    const { user, subscription } = useSupabaseUser()
    const { setOpen } = useSubscriptionModal()
    const router = useRouter()
    const supabase = createClientComponentClient()

    const { avatarUrl } = state
    const workspace = state.workspaces.find(w => w.workspaceId === workspaceId)

    const [permissions, setPermissions] = useState('private')
    const [collaborators, setCollaborators] = useState<User[]>([])
    const [openAlertMessage, setOpenAlertMessage] = useState(false);
    const [workspaceDetails, setWorkspaceDetails] = useState(workspace);
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [loadingPortal, setLoadingPortal] = useState(false);

    const titleTimerRef = useRef<ReturnType<typeof setTimeout>>()

    // Callbacks and handlers

    const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!workspaceId || !e.target.value) return;
        dispatch({
            type: 'UPDATE_WORKSPACE',
            payload: {
                workspace: { title: e.target.value },
                workspaceId
            }
        })

        if (!!titleTimerRef.current) clearTimeout(titleTimerRef.current)

        titleTimerRef.current = setTimeout(async () => {
            await updateWorkspace({ title: e.target.value }, workspaceId)
        }, 700)
    }

    const onChangeWorkspaceLogo = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!workspaceId) return;

        const file = e.target.files?.[0];

        if (!file) return;

        const uuid = v4();

        setUploadingLogo(true);

        const { data, error } = await supabase.storage
            .from("workspace-logos")
            .upload(`workspaceLogo.${uuid}`, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (!error) {
            dispatch({
                type: "UPDATE_WORKSPACE",
                payload: { workspace: { logo: data.path }, workspaceId },
            });

            await updateWorkspace({ logo: data.path }, workspaceId);
            setUploadingLogo(false);
        }
    };

    const onPermissionsChange = (val: string) => {
        if (val === 'private') {
            setOpenAlertMessage(true);
        } else {
            setPermissions(val);
        }
    }

    const onClickAlertConfirm = async () => {
        if (!workspaceId) return;

        if (collaborators.length > 0) {
            await removeCollaborators(collaborators, workspaceId)
        }

        setPermissions('private')
        setOpenAlertMessage(false)
    }

    const onDeleteWorkspace = async () => {
        if (!workspaceId) return;

        const result = prompt(`Type "${workspace?.title}" to confirm`)

        if (result !== workspace?.title) {
            alert('Wrong response, the workspace will NOT be deleted')
            return;
        }

        await deleteWorkspace(workspaceId);
        toast({ title: 'Successfully deleted your workspace' })
        dispatch({ type: 'DELETE_WORKSPACE', payload: workspaceId })

        router.replace('/dashboard');
    }

    const addCollaborator = async (profile: User) => {
        if (!workspaceId) return;

        if (subscription?.status !== 'active' && collaborators.length >= 2) {
            // setOpen(true)
            return;
        }

        await addCollaborators([profile], workspaceId);
        setCollaborators((prevCollabs) => [...prevCollabs, profile]);
    }

    const removeCollaborator = async (user: User) => {
        if (!workspaceId) return;
        if (collaborators.length === 1) {
            setPermissions('private')
        }

        await removeCollaborators([user], workspaceId);

        setCollaborators(
            collaborators.filter(collab => collab.id !== user.id)
        )

        router.refresh();
    }

    const onChangeProfilePicture = async (e: ChangeEvent<HTMLInputElement>) => {
        setUploadingProfilePic(true)

        try {
            const file = e.target.files?.[0]

            if (!user?.id) throw new Error('Unauthenticated');
            if (!file) throw new Error('Has no file')

            await supabase.storage
                .from('avatars')
                .upload(`user-avatar.${user.id}`, file, {
                    cacheControl: '3600',
                    upsert: true,
                })

            const tempUrl = URL.createObjectURL(file)

            dispatch({
                type: 'UPDATE_PROFILE_PIC',
                payload: { avatarUrl: tempUrl },
            })

            toast({ title: 'Avatar sent!' })
        } catch (error: any) {
            if ('Unauthenticated'.includes(error.message)) {
                toast({
                    title: 'Error',
                    description: 'Your session was expired, log-in again'
                })
                return;
            }

            if ('Has no file'.includes(error.message)) {
                return;
            }

            toast({
                title: 'Error',
                description: 'Some error happened. Try again later'
            })
        } finally {
            setUploadingProfilePic(false)
        }
    }

    const redirectToCustomerPortal = async () => {
        setLoadingPortal(true);

        try {
            const { url } = await postData({ url: '/api/create-portal-link' });
            window.location.assign(url);
        } catch (error) {
            console.log(error);
        }

        setLoadingPortal(false);
    }

    // Side effects

    useEffect(() => {
        if (workspace)
            setWorkspaceDetails(workspace)
    }, [workspace])

    useEffect(() => {
        if (!workspaceId) return;

        getCollaborators(workspaceId)
            .then((collab) => {
                if (collab.length) {
                    setPermissions('shared');
                    setCollaborators(collab)
                }
            })
    }, [workspaceId])

    return (
        <div className="flex gap-4 flex-col">
            <p className="flex items-center gap-2 mt-6">
                <Briefcase size={20} />
                Workspace
            </p>

            <Separator />

            <div className="flex flex-col gap-2">
                <Label
                    htmlFor='workspaceName'
                    className='text-sm text-muted-foreground'
                >
                    Name
                </Label>

                <Input
                    name='workspaceName'
                    id='workspaceName'
                    value={workspaceDetails ? workspaceDetails.title : ''}
                    placeholder='Workspace name'
                    onChange={workspaceNameChange}
                />

                <Label
                    htmlFor='workspaceLogo'
                    className='text-sm text-muted-foreground'
                >
                    Workspace logo
                </Label>

                <Input
                    name='workspaceLogo'
                    id='workspaceLogo'
                    type='file'
                    accept='image/*'
                    placeholder='Workspace logo'
                    onChange={onChangeWorkspaceLogo}
                    disabled={uploadingLogo || subscription?.status !== 'active'}
                />

                {subscription?.status !== 'active' && (
                    <small className="text-muted-foreground">
                        To customize your workspace, you need to be on a Pro Plan
                    </small>
                )}
            </div>

            <>
                <Label htmlFor='permissions'>Permission</Label>
                <Select
                    onValueChange={onPermissionsChange}
                    value={permissions}
                >
                    <SelectTrigger className='w-full h-26 -mt-3'>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value='private'>
                                <div className="p-2 flex gap-4 justify-center items-center">
                                    <Lock />
                                    <article className="text-left flex flex-col">
                                        <span>Private</span>
                                        <p>
                                            Your workspace is private to your.
                                            You can choose to share it later.
                                        </p>
                                    </article>
                                </div>
                            </SelectItem>

                            <SelectItem value="shared">
                                <div className="p-2 flex gap-4 justify-center items-center">
                                    <Share />
                                    <article className='text-left flex flex-col'>
                                        <span>Shared</span>
                                        <span>You can invite collaborats.</span>
                                    </article>
                                </div>
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {permissions === 'shared' && (
                    <div>
                        <CollaboratorSearch
                            existingCollaborators={collaborators}
                            getCollaborator={(user) => {
                                addCollaborator(user);
                            }}
                        >
                            <Button type='button' className='text-sm mt-4'>
                                <Plus />
                                Add Collaborators
                            </Button>
                        </CollaboratorSearch>

                        <div className="mt-4">
                            <span className="text-sm text-muted-foreground">
                                Collaborators {collaborators.length || 0}
                            </span>

                            <ScrollArea className='h-[120px] overflow-y-scroll w-full rounded-md border border-muted-foreground/20'>
                                {collaborators.length ? (
                                    collaborators.map(c => (
                                        <div className="p-4 flex justify-between items-center" key={c.id}>
                                            <div className="flex gap-4 items-center">
                                                <Avatar>
                                                    <AvatarImage src="/avatars/7.png" />
                                                    <AvatarFallback>PJ</AvatarFallback>
                                                </Avatar>

                                                <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis w-full">
                                                    {c.email}
                                                </div>
                                            </div>

                                            <Button variant={"secondary"} onClick={() => removeCollaborator(c)}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="absolute inset-0 flex justify-center items-center">
                                        <span className='text-muted-foreground text-sm'>
                                            You have no collaborators
                                        </span>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <Alert variant={'destructive'}>
                    <AlertDescription>
                        Warning! deleting you workspace will permanently delete all data
                        related to this workspace.
                    </AlertDescription>

                    <Button
                        type='submit'
                        size={'sm'}
                        variant={'destructive'}
                        className='mt-4 text-sm bg-destructive/40 border-2 border-destructive'
                        onClick={onDeleteWorkspace}
                    >
                        Delete workspace
                    </Button>
                </Alert>

                <p className="flex items-center gap-2 mt-6">
                    <UserIcon size={20} /> Profile
                </p>

                <Separator />

                <div className="flex items-center">
                    <Avatar>
                        {uploadingProfilePic
                        ? <Loader />
                        : (<>
                            <AvatarImage key={avatarUrl} src={avatarUrl} />
                            <AvatarFallback>
                                <CypressProfileIcon />
                            </AvatarFallback>
                        </>)}
                    </Avatar>

                    <div className="flex flex-col ml-6">
                        <small className="text-muted-foreground cursor-not-allowed">
                            {user ? user.email : ''}
                        </small>
                        <Label
                            htmlFor='profilePicture'
                            className='text-sm text-muted-foreground'
                        >
                            Profile Picture
                        </Label>
                        <Input
                            id="profilePicture"
                            type='file'
                            accept='image/*'
                            placeholder='Profile Picture'
                            disabled={uploadingProfilePic}
                            onChange={onChangeProfilePicture}
                        />
                    </div>
                </div>

                <LogoutButton>
                    <div className="flex items-center">
                        <LogOut />
                    </div>
                </LogoutButton>

                <p className="flex items-center gap-2 mt-6">
                    <CreditCard size={20} /> Billing &amp; Plan
                </p>

                <Separator />

                <p className="text-muted-foreground">
                    Your are currently on a{' '}
                    {subscription?.status === 'active' ? 'Pro' : 'Free'} Plan
                </p>

                <Link href={'/'} target='_blank' className='text-muted-foreground flex flex-row items-center gap-2'>
                    View Plan <ExternalLink size={16} />
                </Link>

                {subscription?.status === 'active' ? (
                    <div>
                        <Button
                            type='button'
                            size="sm"
                            variant={'secondary'}
                            disabled={loadingPortal}
                            className='text-sm'
                            onClick={redirectToCustomerPortal}
                        >
                            Manage Subcription
                        </Button>
                    </div>
                ) : (
                    <div>
                        <Button
                            type='button'
                            size="sm"
                            variant={"secondary"}
                            className='text-sm'
                            onClick={() => setOpen(true)}
                        >
                            Start Plan
                        </Button>
                    </div>
                )}
            </>

            <AlertDialog open={openAlertMessage}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Changing a Shared workspace to a Private workspace{' '}
                            will remove all collaborators permanently
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction onClick={onClickAlertConfirm}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default SettingsForm
