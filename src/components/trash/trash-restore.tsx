'use client';

import { appFoldersType, useAppState } from '@/lib/providers/state-provider';
import { FolderIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react'

const TrashRestore = () => {
    const { state, workspaceId } = useAppState()

    const workspace = state.workspaces.find(w => w.workspaceId === workspaceId);
    const inTrashFolders = workspace?.folders.filter(f => !!f.inTrash) || [];
    const inTrashFiles = workspace?.folders.flatMap(folder => {
        const files = folder.files.filter(file => !!file.inTrash) || []
        return files.map(file => ({...file, parent: folder.title}))
    }) || [];

  return (
    <section>
        {!!inTrashFolders.length && (
            <>
                <h3>Folders</h3>
                {inTrashFolders.map((folder) => (
                    <Link
                        key={folder.folderId}
                        href={`/dashboard/${folder.workspaceId}/${folder.folderId}`}
                        className='hover:bg-muted rounded-md p-2 flex items-center justify-between'
                    >
                        <article>
                            <aside className="flex items-center gap-2">
                                <FolderIcon />
                                {folder.title} / {folder.files.length === 0
                                ? 'empty'
                                : folder.files.length === 1
                                    ? '1 file'
                                    : `${folder.files.length} files`}
                            </aside>
                        </article>
                    </Link>
                ))}
            </>
        )}

        {!!inTrashFiles.length && (
            <>
                <h3>Files</h3>
                {inTrashFiles.map((file) => (
                    <Link
                        key={file.fileId}
                        href={`/dashboard/${file.workspaceId}/${file.folderId}/${file.fileId}`}
                        className='hover:bg-muted rounded-md p-2 flex items-center justify-between'
                    >
                        <article>
                            <aside className="flex items-center gap-2">
                                <FolderIcon />
                                {file.parent} / {file.title}
                            </aside>
                        </article>
                    </Link>
                ))}
            </>
        )}

        {!inTrashFolders.length && !inTrashFiles.length && (
            <div className="text-muted-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                No items in trash
            </div>
        )}
    </section>
  )
}

export default TrashRestore
