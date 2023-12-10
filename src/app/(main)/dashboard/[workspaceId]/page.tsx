import QuillEditor from '@/components/quill-editor/quill-editor';
import { getWorkspaceDetails } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import React from 'react'

interface WorkspaceProps {
    params: { workspaceId: string; };
    searchParams: {}
}

const Workspace = async ({ params }: WorkspaceProps) => {
    const { workspace, getWorkspaceErr } = await getWorkspaceDetails(params.workspaceId);

    if (getWorkspaceErr || !workspace) redirect('/dashboard')

    return (
        <div className="relative">
            <QuillEditor
                dirType="workspace"
                fileId={params.workspaceId}
                dirDetails={workspace || {}}
            />
        </div>
    )
}

export default Workspace;
export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'You are on a workspace'
}
