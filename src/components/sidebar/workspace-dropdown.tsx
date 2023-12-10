'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { workspace } from '@/lib/supabase/supabase.types'
import React, { useEffect, useState } from 'react'
import { SelectedWorkspace } from './selected-workspace';
import { CustomDialogTrigger } from '../global/custom-dialog-trigger';
import { WorkspaceCreator } from '../global/workspace-creator';

interface WorkspaceDropdownProps {
    privateWorkspaces: workspace[];
    sharedWorkspaces: workspace[];
    collaboratingWorkspaces: workspace[];
    defaultValue: workspace | undefined;
}

export const WorkspaceDropdown = ({
    privateWorkspaces,
    sharedWorkspaces,
    collaboratingWorkspaces,
    defaultValue,
}: WorkspaceDropdownProps) => {
    const { state, dispatch } = useAppState()

    const [selectedOption, setSelectedOption] = useState(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const workspace = state.workspaces.find(w => w.workspaceId === defaultValue?.workspaceId)

    useEffect(
        () => {
            if (!state.workspaces.length) {
                dispatch({
                    type: 'SET_WORKSPACES',
                    payload: {
                        workspaces: [
                            ...privateWorkspaces,
                            ...sharedWorkspaces,
                            ...collaboratingWorkspaces,
                        ].map(initWithEmptyFolders),
                    }
                })
            }
        },
        [
            state.workspaces,
            dispatch,
            privateWorkspaces,
            sharedWorkspaces,
            collaboratingWorkspaces
        ],
    )

    const handleSelect = (workspace: workspace) => {
        setSelectedOption(workspace)
        setIsOpen(false);
    }

    useEffect(() => {
        if (workspace)
            setSelectedOption(workspace)

    }, [workspace])

    return (
        <div className="relative inline-block text-left w-full">
            <div>
                <span onClick={() => setIsOpen(!isOpen)}>
                    {selectedOption
                        ? <SelectedWorkspace workspace={selectedOption} />
                        : 'Select a workspace'}
                </span>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute w-full
                    rounded-md shadow-md z-50 h-[190px] bg-black/10
                    backdrop-blur-lg group overflow-y-scroll
                    border-[1px] border-muted"
                >
                    <div className="rounded-md flex flex-col">
                        <div className="!p-2">
                            {!!privateWorkspaces.length && (
                                <>
                                    <p className="text-muted-foreground">Private</p>
                                    <hr />
                                    {privateWorkspaces.map((workspace) => (
                                        <SelectedWorkspace
                                            key={workspace.workspaceId}
                                            workspace={workspace}
                                            onClick={handleSelect}
                                        />
                                    ))}
                                </>
                            )}

                            {!!sharedWorkspaces.length && (
                                <>
                                    <p className="text-muted-foreground">Shared</p>
                                    <hr />
                                    {sharedWorkspaces.map((workspace) => (
                                        <SelectedWorkspace
                                            key={workspace.workspaceId}
                                            workspace={workspace}
                                            onClick={handleSelect}
                                        />
                                    ))}
                                </>
                            )}

                            {!!collaboratingWorkspaces.length && (
                                <>
                                    <p className="text-muted-foreground">Collaborating</p>
                                    <hr />
                                    {collaboratingWorkspaces.map((workspace) => (
                                        <SelectedWorkspace
                                            key={workspace.workspaceId}
                                            workspace={workspace}
                                            onClick={handleSelect}
                                        />
                                    ))}
                                </>
                            )}
                        </div>

                        <CustomDialogTrigger
                            header="Create a Workspace"
                            description='Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too.'
                            content={<WorkspaceCreator />}
                        >
                            <div
                                className="flex
                                transition-all
                                hover:bg-muted
                                justify-center
                                items-center
                                gap-2
                                p-2
                                w-full"
                            >
                                <article
                                    className='text-slate-500 rounded-full
                                    bg-slate-800 w-4 h-4
                                    flex items-center justify-center'
                                >
                                    +
                                </article>
                                Create workspace
                            </div>
                        </CustomDialogTrigger>

                    </div>
                </div>
            )}
        </div>
    )
}

function initWithEmptyFolders(workspace: workspace) {
    return { ...workspace, folders: [] }
}
