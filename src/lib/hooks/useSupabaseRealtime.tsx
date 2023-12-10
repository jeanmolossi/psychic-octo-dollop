import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import React, { useEffect } from 'react'
import { useAppState } from '../providers/state-provider'
import { useRouter } from 'next/navigation'
import { File } from '../supabase/supabase.types'

const useSupabaseRealtime = () => {
    const supabase = createClientComponentClient()

    const { dispatch, state, workspaceId: selectedWorkspace } = useAppState();

    const router = useRouter();

    useEffect(() => {
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'files' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const {
                            folder_id: folderId,
                            workspace_id: workspaceId,
                            id: fileId,
                        } = payload.new;

                        if (
                            !state.workspaces
                                .find(w => w.workspaceId === workspaceId)
                                ?.folders.find(f => f.folderId === folderId)
                                ?.files.find(f => f.fileId === fileId)
                        ) {
                            const newFile: File = {
                                fileId: payload.new.id,
                                workspaceId: payload.new.workspace_id,
                                folderId: payload.new.folder_id,
                                createdAt: payload.new.created_at,
                                title: payload.new.title,
                                iconId: payload.new.icon_id,
                                data: payload.new.data,
                                inTrash: payload.new.in_trash,
                                bannerUrl: payload.new.banner_url,
                            };

                            dispatch({
                                type: 'ADD_FILE',
                                payload: {
                                    file: newFile,
                                    folderId,
                                    workspaceId
                                },
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        let workspaceId = '';
                        let folderId = '';
                        const fileExists = state.workspaces.some((workspace) =>
                            workspace.folders.some((folder) =>
                                folder.files.some((file) => {
                                    if (file.fileId === payload.old.id) {
                                        workspaceId = workspace.workspaceId;
                                        folderId = folder.folderId;
                                        return true;
                                    }
                                })
                            )
                        );

                        if (fileExists && workspaceId && folderId) {
                            router.replace(`/dashboard/${workspaceId}`);

                            dispatch({
                                type: 'DELETE_FILE',
                                payload: { fileId: payload.old.id, folderId, workspaceId },
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const { folder_id: folderId, workspace_id: workspaceId } = payload.new;

                        state.workspaces.some((workspace) =>
                            workspace.folders.some((folder) =>
                                folder.files.some((file) => {
                                    if (file.fileId === payload.new.id) {
                                        dispatch({
                                            type: 'UPDATE_FILE',
                                            payload: {
                                                workspaceId,
                                                folderId,
                                                fileId: payload.new.id,
                                                file: {
                                                    title: payload.new.title,
                                                    iconId: payload.new.icon_id,
                                                    inTrash: payload.new.in_trash,
                                                },
                                            },
                                        });
                                        return true;
                                    }
                                })
                            )
                        );
                    }
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe();
        }
    }, [supabase, state, selectedWorkspace, dispatch, router])
}

export default useSupabaseRealtime
