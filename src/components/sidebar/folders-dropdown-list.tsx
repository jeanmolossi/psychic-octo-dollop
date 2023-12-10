'use client';

import { useAppState } from "@/lib/providers/state-provider";
import { Folder } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import { Accordion } from "../ui/accordion";
import Dropdown from "./dropdown";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { v4 } from "uuid";
import { useToast } from "../ui/use-toast";
import { createFolder } from "@/lib/supabase/queries";
import useSupabaseRealtime from "@/lib/hooks/useSupabaseRealtime";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";

interface FoldersDropdownListProps {
    workspaceFolders: Folder[];
    workspaceId: string;
}

const FoldersDropdownList = ({
    workspaceFolders,
    workspaceId,
}: FoldersDropdownListProps) => {
    useSupabaseRealtime()
    const { state, dispatch, folderId } = useAppState()
    const [ folders, setFolders ] = useState(workspaceFolders)
    const { subscription } = useSupabaseUser()
    const { toast } = useToast()
    const { open, setOpen } = useSubscriptionModal()

    const workspace = state.workspaces
        .find(w => w.workspaceId === workspaceId);

    // effect set initial state server app state

    useEffect(() => {
        if (workspaceFolders.length > 0) {
            dispatch({
                type: 'SET_FOLDERS',
                payload: {
                    folders: workspaceFolders
                        .map(folder => ({
                            ...folder,
                            files: workspace
                                ?.folders
                                .find(f => f.folderId === folder.folderId)
                                ?.files || []
                        })),
                    workspaceId,
                }
            })
        }
    }, [dispatch, workspaceFolders, workspaceId])

    // state

    useEffect(() => {
        setFolders(workspace?.folders || [])
    }, [workspace])

    // add folder

    const addFolderHandler = async () => {
        if (folders.length >= 3 && !subscription) {
            setOpen(true)
            return;
        }

        const newFolder: Folder = {
            data: null,
            folderId: v4(),
            bannerUrl: '',
            createdAt: new Date().toISOString(),
            title: 'Untitled',
            iconId: '📃',
            inTrash: null,
            workspaceId,
        };

        dispatch({
            type: 'ADD_FOLDER',
            payload: {
                folder: { ...newFolder, files: [] },
                workspaceId,
            }
        })

        const { createFolderErr } = await createFolder(newFolder);

        if (createFolderErr) {
            toast({
                title: 'Error',
                variant: 'destructive',
                description: 'Couldn\'t create the folder'
            })

            return;
        }

        toast({
            title: 'Success',
            description: 'Folder created!'
        })
    }

    return (
        <>
        <div
            className="flex
            sticky
            z-20
            top-0
            bg-background
            w-full
            h-10
            group/title
            justify-between
            items-center
            text-Neutrals/neutrals-8"
        >
            <span className="text-xs font-bold text-Neutrals/neutrals-8">FOLDERS</span>

            <TooltipComponent message="Create new folder">
                <PlusIcon
                    size={16}
                    className="group-hover/title:inline-block hidden hover:dark:text-white"
                    onClick={addFolderHandler}
                />
            </TooltipComponent>
        </div>

        <Accordion type="multiple" defaultValue={[folderId || '']} className="pb-20">
            {folders
                .filter(f => !f.inTrash)
                .map(folder => (
                    <Dropdown
                        key={folder.folderId}
                        title={folder.title}
                        listType="folder"
                        id={folder.folderId}
                        iconId={folder.iconId}
                    />
                ))}
        </Accordion>
        </>
    );
};

export default FoldersDropdownList;
