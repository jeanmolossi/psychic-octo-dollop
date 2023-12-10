import QuillEditor from '@/components/quill-editor/quill-editor';
import { getFileDetails } from '@/lib/supabase/queries';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react'

interface FilePageProps {
    params: {
        workspaceId: string;
        folderId: string;
        fileId: string;
    }
    searchParams: {}
}

const FilePage = async ({ params }: FilePageProps) => {
    const { file, getFileErr } = await getFileDetails(params.fileId);

    if (getFileErr || !file) redirect('/dashboard')

    return (
        <div className="relative">
            <QuillEditor
                dirType="file"
                fileId={params.fileId}
                dirDetails={file || {}}
            />
        </div>
    )
}

export default FilePage
export const generateMetadata = async ({ params }: FilePageProps): Promise<Metadata> =>
    Promise.resolve({
        title: `File id ${params.fileId}`
    })
