'use client';

import React, { useMemo, useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useAppState } from "@/lib/providers/state-provider";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "../ui/use-toast";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { useRouter } from "next/navigation";
import { createFile, updateFile, updateFolder } from "@/lib/supabase/queries";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon, Trash } from "lucide-react";
import { File } from "@/lib/supabase/supabase.types";
import { v4 } from "uuid";

interface DropdownProps {
    title: string;
    id: string;
    listType: "folder" | "file" | "native";
    iconId: string;
}

const Dropdown = ({
    title,
    id,
    listType,
    iconId,
}: DropdownProps) => {
    const { toast } = useToast()
    const { user } = useSupabaseUser()
    const { state, dispatch, workspaceId, folderId } = useAppState()
    const router = useRouter()

    const [isEditing, setIsEditing] = useState(false);

    const workspace = state.workspaces.find(w => w.workspaceId === workspaceId);
    const folder = workspace?.folders.find(f => f.folderId === id);
    const files = folder?.files.filter(f => !f.inTrash) || []
    const isFolder = listType === 'folder';

    // folder title synced with server data and local
    const folderTitle: string | undefined = useMemo(() => {
        if (isFolder) {
            if (title === folder?.title || !folder?.title) return title;

            return folder.title
        }
    }, [isFolder, folder?.title, title])

    // file title synced with server data and local
    const fileTitle: string | undefined = useMemo(() => {
        if (!isFolder) {
            const [folder, file] = id.split('folder');

            const stateFileTitle = workspace
                ?.folders
                .find(f => f.folderId === folder)
                ?.files
                .find(f => f.fileId === file)
                ?.title

            if (title === stateFileTitle || !stateFileTitle) return title

            return stateFileTitle
        }
    }, [isFolder, id, title, workspace?.folders])

    const groupIdentifiers = clsx(
        'dark:text-white whitespace-nowrap flex justify-between items-center w-full relative',
        {
            'group/folder': isFolder,
            'group/file': !isFolder,
        }
    )

    const listStyles = useMemo(() => clsx('relative border-none', {
        'text-md': isFolder,
        'ml-6 text-[16px] py-1': !isFolder,
    }), [isFolder]);

    const hoverStyles = useMemo(() => clsx(
        'h-full hidden rounded-sm absolute right-0 items-center justify-center',
        {
            'group-hover/file:block': listType === 'file',
            'group-hover/folder:block': isFolder,
        }
    ), [isFolder, listType])

    const navigatePage = (accId: string, type: DropdownProps['listType']) => {
        const baseUrl = `/dashboard/${workspaceId}`;

        if (type === 'folder') {
            router.push(`${baseUrl}/${accId}`)
        }

        if (type === 'file') {
            const [folderId, fileId] = accId.split(`folder`);

            router.push(`${baseUrl}/${folderId}/${fileId}`)
        }
    }

    const handleDoubleClick = () => setIsEditing(true);

    const handleBlur = async () => {
        if (!isEditing) return;

        setIsEditing(false);

        const [folderId, fileId] = id.split('folder');

        if (!!folderId && !fileId) {
            if (!folderTitle) return;

            toast({
                title: 'Success',
                description: 'Folder title changed.'
            })

            await updateFolder({ title }, folderId);
            return;
        }

        if (!!folderId && !!fileId) {
            if (!fileTitle) return;

            const { updateFileErr } = await updateFile({ title: fileTitle }, fileId)
            if (updateFileErr) {
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: 'Couldn\'t update the title for this file',
                })

                return;
            }

            toast({
                title: 'Success',
                description: 'Folder title changed.'
            })
        }
    }

    const onChangeEmoji = async (selectedEmoji: string) => {
        if (!workspaceId || !isFolder) return;

        dispatch({
            type: 'UPDATE_FOLDER',
            payload: {
                workspaceId,
                folderId: id,
                folder: { iconId: selectedEmoji }
            }
        })

        const { updateFolderErr } = await updateFolder({ iconId: selectedEmoji }, id)

        if (updateFolderErr) {
            toast({
                title: 'Error',
                variant: 'destructive',
                description: 'Could not update the folder emoji'
            })

            return;
        }

        toast({
            title: 'Success',
            description: 'Emoji was updated!'
        })
    }

    const folderTitleChange = (e: any) => {
        if (!workspaceId) return;

        const [folderId] = id.split('folder');

        if (!!folderId) {
            dispatch({
                type: 'UPDATE_FOLDER',
                payload: {
                    folder: { title: e.target.value },
                    folderId,
                    workspaceId
                }
            })
        }
    }

    const fileTitleChange = (e: any) => {
        if (!workspaceId || !folderId) return;

        const [folder, fileId] = id.split('folder');

        if (!!folder && !!fileId) {
            dispatch({
                type: 'UPDATE_FILE',
                payload: {
                    file: { title: e.target.value },
                    fileId,
                    workspaceId,
                    folderId
                }
            })
        }
    }

    const addNewFile = async () => {
        if (!workspaceId) return;

        const newFile: File = {
            folderId: id,
            data: null,
            createdAt: new Date().toISOString(),
            inTrash: null,
            title: 'Untitled',
            iconId: '📄',
            fileId: v4(),
            workspaceId,
            bannerUrl: '',
        }

        dispatch({
            type: 'ADD_FILE',
            payload: { file: newFile, folderId: id, workspaceId }
        })

        const { createFileErr } = await createFile(newFile);

        if (createFileErr) {
            toast({
                title: 'Error',
                variant:'destructive',
                description: 'Could not create a file'
            })
            return;
        }

        toast({
            title:'Success',
            description: 'File created.'
        })
    }

    const moveToTrash = async () => {
        if (!user?.email || !workspaceId) return;
        const [pathId, filePathId] = id.split('folder')

        if (isFolder) {
            dispatch({
                type: 'UPDATE_FOLDER',
                payload: {
                    folder: { inTrash: `Deleted by ${user?.email}` },
                    folderId: pathId,
                    workspaceId
                }
            })

            const { updateFolderErr } = await updateFolder({ inTrash: `Deleted by user ${user?.email}` }, pathId);

            if (updateFolderErr) {
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: 'Could not move the folder to trash',
                })
                return;
            }

            toast({
                title: 'Success',
                description: 'Moved folder to trash',
            })
        }

        if (listType === 'file') {
            dispatch({
                type: 'UPDATE_FILE',
                payload: {
                    file: { inTrash: `Deleted by ${user?.email}` },
                    folderId: pathId,
                    workspaceId,
                    fileId: filePathId,
                }
            })

            const { updateFileErr } = await updateFile({ inTrash: `Deleted by user ${user?.email}` }, filePathId);

            if (updateFileErr) {
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: 'Could not move the file to trash',
                })
                return;
            }

            toast({
                title: 'Success',
                description: 'Moved file to trash',
            })
        }
    }

    return (
        <AccordionItem
            value={id}
            className={listStyles}
            onClick={(e) => {
                e.stopPropagation();
                navigatePage(id, listType)
            }}
        >
            <AccordionTrigger
                id={listType}
                className="hover:no-underline p-2 dark:text-muted-foreground text-sm w-full"
                disabled={listType === 'file'}
            >
                <div className={groupIdentifiers}>
                    <div className="flex gap-4 items-center justify-center overflow-hidden">
                        <div className="relative">
                            {isFolder
                                ? (<EmojiPicker getValue={onChangeEmoji}>{iconId}</EmojiPicker>)
                                : <span>{iconId}</span>}
                        </div>

                        <input
                            type="text"
                            value={isFolder ? folderTitle : fileTitle}
                            className={clsx(
                                'outline-none overflow-hidden w-full text-Neutrals/neutrals-7',
                                {
                                    'bg-muted cursor-text': isEditing,
                                    'bg-transparent cursor-pointer': !isEditing,
                                }
                            )}
                            readOnly={!isEditing}
                            onDoubleClick={handleDoubleClick}
                            onBlur={handleBlur}
                            onChange={
                                isFolder ? folderTitleChange : fileTitleChange
                            }
                        />
                    </div>

                    <div className={hoverStyles}>
                        <TooltipComponent message={listType === 'file' ? 'Delete file' : 'Delete folder'}>
                            <Trash
                                size={15}
                                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                                onClick={moveToTrash}
                            />
                        </TooltipComponent>

                        {(isFolder && !isEditing) && (
                            <TooltipComponent message="Add file">
                                <PlusIcon
                                    size={15}
                                    className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                                    onClick={addNewFile}
                                />
                            </TooltipComponent>
                        )}
                    </div>
                </div>
            </AccordionTrigger>

            {listType !== 'file' && (
                <AccordionContent>
                    {files.map(file => {
                        const customFileId = `${id}folder${file.fileId}`
                        return (
                            <Dropdown
                                key={file.fileId}
                                title={file.title}
                                listType="file"
                                id={customFileId}
                                iconId={file.iconId}
                            />
                        )
                    })}
                </AccordionContent>
            )}
        </AccordionItem>
    )
};

export default Dropdown;
