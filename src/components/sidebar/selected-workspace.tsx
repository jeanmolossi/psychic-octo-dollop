import { workspace } from '@/lib/supabase/supabase.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

interface SelectedWorkspaceProps {
    workspace: workspace
    onClick?: (option: workspace) => void;
}

export const SelectedWorkspace = ({
    workspace,
    onClick
}: SelectedWorkspaceProps) => {
    const supabase = createClientComponentClient();

    const [workspaceLogo, setWorkspaceLogo] = useState('/cypresslogo.svg')

    useEffect(() => {
        if (workspace.logo) {
            const path = supabase
                .storage
                .from('workspace-logos')
                .getPublicUrl(workspace.logo)

            setWorkspaceLogo(path.data.publicUrl)
        }
    }, [supabase.storage, workspace])

    return (
        <Link
            href={`/dashboard/${workspace.workspaceId}`}
            onClick={() => onClick?.(workspace)}
            className='flex rounded-md hover:bg-muted transition-all
            flex-row p-2 gap-4 justify-center items-center my-2'
        >
            <Image
                src={workspaceLogo}
                alt={`workspace ${workspace.title} logo`}
                width={26}
                height={26}
                loading='lazy'
                style={{ objectFit: 'cover' }}
            />

            <div className="flex flex-col">
                <p className="text-lg w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {workspace.title}
                </p>
            </div>

        </Link>
    )
}
