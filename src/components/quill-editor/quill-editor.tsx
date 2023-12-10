'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { File, Folder, workspace } from '@/lib/supabase/supabase.types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { deleteFile, deleteFolder, findUser, getFileDetails, getFolderDetails, getWorkspaceDetails, updateFile, updateFolder, updateWorkspace } from '@/lib/supabase/queries';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import BannerImage from '../../../public/BannerImage.png';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import EmojiPicker from '../global/emoji-picker';
import BannerUpload from '../banner-upload/banner-upload';
import Link from 'next/link';
import { XCircleIcon } from 'lucide-react';
import { useSocket } from '@/lib/providers/socket-provider';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { Quill } from 'quill';

interface QuillEditorProps {
    dirDetails: File | Folder | workspace;
    fileId: string;
    dirType: 'workspace' | 'folder' | 'file'
}

const TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],

    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],

    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],

    ['clean']
]

const QuillEditor = ({
    dirDetails,
    dirType,
    fileId,
}: QuillEditorProps) => {
    const { state, workspaceId, folderId, dispatch } = useAppState()
    const router = useRouter();
    const pathname = usePathname()
    const supabase = createClientComponentClient();
    const { socket, isConnected } = useSocket()
    const { user } = useSupabaseUser()

    const [collaborators, setCollaborators] = useState<Array<{
        id: string;
        email: string;
        avatarUrl: string;
    }>>([
        {
          "id": "1",
          "email": "johndoe@example.com",
          "avatarUrl": "/avatars/1.png"
        },
        {
          "id": "2",
          "email": "janedoe@example.com",
          "avatarUrl": "/avatars/2.png"
        },
        {
          "id": "3",
          "email": "bobsmith@example.com",
          "avatarUrl": "/avatars/3.png"
        },
        {
          "id": "4",
          "email": "emilyjones@example.com",
          "avatarUrl": "/avatars/4.png"
        },
        {
          "id": "5",
          "email": "michaelsmith@example.com",
          "avatarUrl": "/avatars/5.png"
        }
    ])
    const [quill, setQuill] = useState<Quill>(null!)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [localCursors, setLocalCursors] = useState([] as any[])

    const workspace = state.workspaces.find(w => w.workspaceId === workspaceId);
    const folder = workspace?.folders.find(f => f.folderId === folderId);
    const file = folder?.files.find(f => f.fileId === fileId)

    const saveTimer = useRef<ReturnType<typeof setTimeout>>(null!)

    const details = useMemo(() => {
        let selectedDir;
        if (dirType === 'file') {
            selectedDir = file
        }

        if (dirType === 'folder') {
            selectedDir = workspace?.folders.find(f => f.folderId === fileId)
        }

        if (dirType === 'workspace') {
            selectedDir = state.workspaces.find(w => w.workspaceId === fileId)
        }

        if (selectedDir) return selectedDir

        return {
            title: dirDetails.title,
            iconId: dirDetails.iconId,
            createdAt: dirDetails.createdAt,
            data: dirDetails.data,
            inTrash: dirDetails.inTrash,
            bannerUrl: dirDetails.bannerUrl
        } as workspace | Folder | File;
    }, [
        file,
        dirType,
        fileId,
        state.workspaces,
        workspace?.folders,
        dirDetails,
    ])

    const breadcrumbs = useMemo(() => {
        if (!pathname || !workspace || !workspaceId) return;

        const [_, foldId, filId] = pathname.split('/').filter(val => val !== 'dashboard' && !!val)

        const workspaceBreadcrumb = workspace
            ? <Link href={`/dashboard/${workspaceId}`}>{`${workspace.iconId} ${workspace.title}`}</Link>
            : '';

        if (!foldId && !filId) return workspaceBreadcrumb

        const folderBreadcrumb = folder
            ? <Link href={`/dashboard/${workspaceId}/${foldId}`}>{`/ ${folder.iconId} ${folder.title}`}</Link>
            : '';

        if (!foldId) return `${workspaceBreadcrumb} ${folderBreadcrumb}`;

        const fileBreadcrumb = file
            ? `/ ${file.iconId} ${file.title}`
            : '';

        return <>{workspaceBreadcrumb} {folderBreadcrumb} {fileBreadcrumb}</>
    }, [pathname, workspaceId, workspace, folder, file])

    const wrapperRef = useCallback(async (wrapper: any) => {
        if (typeof window === 'undefined') return null;

        if (wrapper === null) return null;

        wrapper.innerHTML = '';

        const editor = document.createElement('div');
        editor.className = 'min-h-16'
        wrapper.append(editor);

        const Quill = (await import('quill')).default;
        const QuillCursors = (await import('quill-cursors')).default;

        Quill.register('modules/cursors', QuillCursors)

        const q = new Quill(editor, {
            theme: 'snow',
            modules: {
                toolbar: TOOLBAR_OPTIONS,
                cursors: {
                    transformOnTextChange: true,
                }
            },
            placeholder: 'Start typing here...'
        })

        setQuill(q);
    }, [])

    const restoreFileHandler = async () => {
        if (dirType === 'file') {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: 'UPDATE_FILE',
                payload: {
                    file: { inTrash: '' },
                    folderId,
                    fileId,
                    workspaceId,
                }
            })

            await updateFile({ inTrash: '' }, fileId)
        }

        if (dirType === 'folder') {
            if (!workspaceId || !fileId) return;

            dispatch({
                type: 'UPDATE_FOLDER',
                payload: {
                    folder: { inTrash: '' },
                    folderId: fileId,
                    workspaceId,
                }
            })

            await updateFolder({ inTrash: '' }, fileId)
        }
    }

    const deleteFileHandler = async () => {
        if (dirType === 'file') {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: 'DELETE_FILE',
                payload: {
                    folderId,
                    fileId,
                    workspaceId,
                }
            })

            await deleteFile(fileId)
            router.replace(`/dashboard/${workspaceId}/${folderId}`)
        }

        if (dirType === 'folder') {
            if (!workspaceId || !fileId) return;

            dispatch({
                type: 'DELETE_FOLDER',
                payload: {
                    folderId: fileId,
                    workspaceId,
                }
            })

            await deleteFolder(fileId)
            router.replace(`/dashboard/${workspaceId}`)
        }
    }

    const onChangeIcon = async (icon: string) => {
        if (!fileId) return;

        if (dirType === 'workspace') {
            dispatch({
                type: 'UPDATE_WORKSPACE',
                payload: { workspace: { iconId: icon }, workspaceId: fileId },
            })

            await updateWorkspace({ iconId: icon }, fileId);
        }

        if (dirType === 'folder') {
            if (!workspaceId) return;

            dispatch({
                type: 'UPDATE_FOLDER',
                payload: {
                    folder: { iconId: icon },
                    workspaceId,
                    folderId: fileId,
                }
            })

            await updateFolder({ iconId: icon }, fileId);
        }

        if (dirType === 'file') {
            if (!workspaceId || !folderId) return;

            dispatch({
                type: 'UPDATE_FILE',
                payload: {
                    file: { iconId: icon },
                    workspaceId,
                    folderId,
                    fileId,
                }
            })

            await updateFile({ iconId: icon }, fileId);
        }
    }

    const deleteWorkspaceBanner = async () => {
        if (!fileId || !details.bannerUrl) return;

        setDeleting(true);

        const removeBanner = async () => {
            if (!details.bannerUrl) return;

            await supabase
                .storage
                .from('file-banners')
                .remove([details.bannerUrl])
        }

        const emptyBanner = { bannerUrl: '' }

        if (dirType === 'file') {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: 'UPDATE_FILE',
                payload: {
                    file: emptyBanner,
                    fileId,
                    folderId,
                    workspaceId,
                }
            })

            await removeBanner();
            await updateFile(emptyBanner, fileId)
        }

        if (dirType === 'folder') {
            if (!workspaceId) return;

            dispatch({
                type: 'UPDATE_FOLDER',
                payload: {
                    folder: emptyBanner,
                    folderId: fileId,
                    workspaceId,
                }
            })

            await removeBanner();
            await updateFolder(emptyBanner, fileId)
        }

        if (dirType === 'workspace') {
            dispatch({
                type: 'UPDATE_WORKSPACE',
                payload: {
                    workspace: emptyBanner,
                    workspaceId: fileId
                }
            })

            await removeBanner();
            await updateWorkspace(emptyBanner, fileId)
        }

        setDeleting(false);
    }

    useEffect(() => {
        if (!fileId) return;

        const fetchInformation = async () => {
            if (dirType === 'file') {
                const { file, getFileErr } = await getFileDetails(fileId);

                if (getFileErr || !file) {
                    if (!workspaceId)
                        return router.replace('/dashboard')
                    return router.replace(`/dashboard/${workspaceId}`)
                }

                if (!workspaceId || quill === null) return;
                if (!file.data) return;

                quill.setContents(JSON.parse(file.data || '{}'))
                dispatch({
                    type: 'UPDATE_FILE',
                    payload: {
                        file: { data: file.data },
                        fileId,
                        folderId: file.folderId,
                        workspaceId,
                    }
                })
            }

            if (dirType === 'folder') {
                const { folder, getFolderErr } = await getFolderDetails(fileId)

                if (getFolderErr || !folder) {
                    if (!workspaceId)
                        return router.replace('/dashboard')
                    return router.replace(`/dashboard/${workspaceId}`)
                }

                if (!workspaceId || quill === null) return;
                if (!folder.data) return;

                quill.setContents(JSON.parse(folder.data || '{}'))
                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: {
                        folder: { data: folder.data },
                        folderId: fileId,
                        workspaceId,
                    }
                })
            }

            if (dirType === 'workspace') {
                const { getWorkspaceErr, workspace } = await getWorkspaceDetails(fileId)

                if (getWorkspaceErr || !workspace) {
                    return router.replace('/dashboard')
                }

                if (!workspaceId || quill === null) return;
                if (!workspace.data) return;

                quill.setContents(JSON.parse(workspace.data || '{}'))
                dispatch({
                    type: 'UPDATE_WORKSPACE',
                    payload: {
                        workspace: { data: workspace.data },
                        workspaceId: fileId,
                    }
                })
            }
        }

        fetchInformation()
    }, [fileId, dirType, router, workspaceId, dispatch, quill])

    useEffect(() => {
        if (!quill || !socket || !fileId || !localCursors.length) return;

        const socketHandler = (range: any, roomId: string, cursorId: string) => {
            if (roomId !== fileId) return;

            const cursorToMove = localCursors.find(
                cursor => cursor.cursors()?.[0].id === cursorId
            );

            if (cursorToMove) {
                cursorToMove.moveCursor(cursorId, range);
            }
        }

        socket.on('receive-cursor-move', socketHandler)

        return () => {
            socket.off('receive-cursor-move', socketHandler)
        }
    }, [quill, socket, fileId, localCursors])

    // rooms
    useEffect(() => {
        if (!socket || !quill || !fileId) return;
        socket.emit('create-room', fileId)
    }, [socket, quill, fileId])

    useEffect(() => {
        if (!quill || !socket || !fileId || !user) return;

        // WIP cursos
        const selectionChangeHandler = (cursorId: string) =>
            (range: any, oldRange: any, source: any) => {
                if (source === 'user' && cursorId) {
                    socket.emit('send-cursor-move', range, fileId, cursorId)
                }
            }

        const quillHandler = (delta: any, oldDelta: any, source: any) => {
            if (source !== 'user') return;

            if (saveTimer.current)
                clearTimeout(saveTimer.current);

            setSaving(true)

            const contents = quill.getContents();
            const length = quill.getLength();

            saveTimer.current = setTimeout(async () => {
                if (contents && length !== 1 && fileId) {
                    const data = { data: JSON.stringify(contents) };

                    if (dirType === 'workspace') {
                        dispatch({
                            type: 'UPDATE_WORKSPACE',
                            payload: {
                                workspace: data,
                                workspaceId: fileId,
                            }
                        })

                        await updateWorkspace(data, fileId)
                    }

                    if (dirType === 'folder') {
                        if (!workspaceId) return;

                        dispatch({
                            type: 'UPDATE_FOLDER',
                            payload: {
                                folder: data,
                                folderId: fileId,
                                workspaceId,
                            }
                        })

                        await updateFolder(data, fileId)
                    }

                    if (dirType === 'file') {
                        if (!workspaceId || !folderId) return;

                        dispatch({
                            type: 'UPDATE_FILE',
                            payload: {
                                file: data,
                                fileId,
                                folderId,
                                workspaceId,
                            }
                        })

                        await updateFile(data, fileId)
                    }
                }

                setSaving(false);
            }, 1000)

            socket.emit('send-changes', delta, fileId)
        }

        quill.on('text-change', quillHandler)
        quill.on('selection-change', selectionChangeHandler(user.id))

        return () => {
            quill.off('text-change', quillHandler)
            quill.off('selection-change', selectionChangeHandler(user.id))
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [
        quill,
        socket,
        fileId,
        user,
        details,
        workspaceId,
        folderId,
        dispatch,
        dirType,
    ])

    useEffect(() => {
        if (!quill || !socket) return;

        const socketHandler = (deltas: any, id: string) => {
            if (id === fileId) {
                quill.updateContents(deltas);
            }
        }

        socket.on('receive-changes', socketHandler)

        return () => {
            socket.off('receive-changes', socketHandler)
        }
    }, [quill, socket, fileId])

    useEffect(() => {
        if (!fileId || !quill) return;

        const room = supabase.channel(fileId);

        const subscription = room
            .on('presence', { event: 'sync' }, () => {
                const newState = room.presenceState();
                const newCollaborators = Object.values(newState).flat() as any;

                setCollaborators(newCollaborators)

                if (!user) return;

                const allCursors: any[] = [];
                newCollaborators.forEach(
                    (collaborator: { id: string; email: string; avatar: string; }) => {
                        if (collaborator.id === user.id) return;

                        const userCursor = quill.getModule('cursors');

                        userCursor.createCursor(
                            collaborator.id,
                            collaborator.email.split('@')[0],
                            `#${Math.random().toString(16).slice(2, 8)}`
                        );

                        allCursors.push(userCursor)
                    }
                )

                setLocalCursors(allCursors)
            })
            .subscribe(async (status) => {
                if (status !== 'SUBSCRIBED' || !user) return;
                const response = await findUser(user.id);
                if (!response) return;

                room.track({
                    id: user.id,
                    email: user.email?.split('@')[0],
                    avatarUrl: response.avatarUrl
                        ? supabase.storage
                            .from('avatars')
                            .getPublicUrl(response.avatarUrl)
                            .data.publicUrl
                        : '',
                })
            })

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(room)
        }
    }, [fileId, quill, supabase, user])

    return (
        <>
            <div className="relative">
                {details.inTrash && (
                    <article
                        className="py-2
                        bg-[#EB5757]
                        flex
                        md:flex-row
                        flex-col
                        justify-center
                        items-center
                        gap-4
                        flex-wrap
                        "
                    >
                        <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
                            <span className="text-white">
                                This {dirType} is in the trash
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                className='bg-transparent border border-white text-white hover:bg-white hover:text-[#EB5757]'
                                onClick={restoreFileHandler}
                            >
                                Restore
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                className='bg-transparent border border-white text-white hover:bg-white hover:text-[#EB5757]'
                                onClick={deleteFileHandler}
                            >
                                Delete permanently
                            </Button>
                        </div>

                        <span className="text-sm text-white">{details.inTrash}</span>
                    </article>
                )}

                <div
                    className="flex
                    flex-col-reverse
                    sm:flex-row
                    sm:justify-between
                    justify-center
                    sm:items-center
                    sm:p-2
                    p-8"
                >
                    <div>{breadcrumbs}</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10">
                            {collaborators.map((collab) => (
                                <TooltipProvider key={collab.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className='-ml-3 bg-background border-2 flex items-center justify-center border-white h-8 w-8 rounded-full'>
                                                <AvatarImage className='rounded-full' src={collab.avatarUrl || ''} />
                                                <AvatarFallback>{collab.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>

                                        <TooltipContent>{collab.email}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>

                        {saving
                            ? <Badge variant="secondary" className='bg-orange-600 top-4 text-white right-4 z-50'>Saving...</Badge>
                            : <Badge variant="secondary" className='bg-emerald-600 top-4 text-white right-4 z-50'>Saved</Badge>}
                    </div>
                </div>
            </div>

            {details.bannerUrl && (
                <div className="relative w-full h-[200px]">
                    <Image
                        src={
                            supabase
                                .storage
                                .from('file-banners')
                                .getPublicUrl(details.bannerUrl)
                                .data.publicUrl ||
                            BannerImage
                        }
                        fill
                        className='w-full md:h-48 h-20 object-cover'
                        alt='Banner image'
                    />
                </div>
            )}

            <div className="flex justify-center items-center flex-col mt-2 relative">
                <div className="w-full self-center flex flex-col px-7 max-w-[800px] lg:my-8">
                    <div className='text-[80px]'>
                        <EmojiPicker getValue={onChangeIcon}>
                            <div
                                className="w-[100px]
                                cursor-pointer
                                transition-colors
                                h-[100px]
                                flex
                                items-center
                                justify-center
                                hover:bg-muted
                                rounded-xl
                                "
                            >{details.iconId}</div>
                        </EmojiPicker>
                    </div>

                    <div className="flex">
                        <BannerUpload
                            details={details}
                            id={fileId}
                            dirType={dirType}
                            className='mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md'
                        >
                            {details.bannerUrl ? 'Update' : 'Add'} banner
                        </BannerUpload>

                        {details.bannerUrl && (
                            <Button
                                onClick={deleteWorkspaceBanner}
                                variant="ghost"
                                className='gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground'
                                disabled={deleting}
                            >
                                <XCircleIcon size={16} />
                                <span className="whitespace-nowrap font-normal">
                                    Remove banner
                                </span>
                            </Button>
                        )}
                    </div>

                    <span className="text-muted-foreground text-3xl font-bold h-9">
                        {details.title}
                    </span>

                    <span className="text-muted-foreground text-sm">
                        {dirType.toUpperCase()}
                    </span>
                </div>

                <div
                    id="container"
                    ref={wrapperRef}
                    className='max-w-[800px] min-h-16'
                ></div>
            </div>
        </>
    );
};

export default QuillEditor
