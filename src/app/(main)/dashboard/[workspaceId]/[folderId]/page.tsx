import QuillEditor from '@/components/quill-editor/quill-editor';
import { getFolderDetails } from '@/lib/supabase/queries';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react'

interface FolderPageProps {
    params: {
        workspaceId: string;
        folderId: string;
    }
    searchParams: {}
}

const FolderPage = async ({ params }: FolderPageProps) => {
    const { folder, getFolderErr } = await getFolderDetails(params.folderId);

    if (getFolderErr || !folder) redirect('/dashboard')

    return (
        <div className="relative">
            <QuillEditor
                dirType="folder"
                fileId={params.folderId}
                dirDetails={folder || {}}
            />
        </div>
    )
}

export default FolderPage
export const dynamic = 'force-dynamic';
export const generateMetadata = async ({ params }: FolderPageProps): Promise<Metadata> =>
    Promise.resolve({
        title: `Folder id ${params.folderId}`
    })
