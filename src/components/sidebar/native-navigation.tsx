import Link from 'next/link';
import React from 'react'
import { twMerge } from 'tailwind-merge';
import CypressHomeIcon from '../icons/cypress-home-icon';
import Settings from '../settings/settings';
import CypressSettingsIcon from '../icons/cypress-settings-icon';
import Trash from '../trash/trash';
import CypressTrashIcon from '../icons/cypress-trash-icon';

const NativeNavigation = ({
    myWorkspaceId,
    className,
}: {
    myWorkspaceId: string;
    className?: string;
}) => {
  return (
    <nav className={twMerge('my-2', className)}>
        <ul className="flex flex-col gap-2">
            <li>
                <Link
                    className='group/native flex text-Neutrals/neutrals-7 transition-all gap-2'
                    href={`/dashboard/${myWorkspaceId}`}
                >
                    <CypressHomeIcon />
                    <span>My Workspace</span>
                </Link>
            </li>

            <Settings>
                <li className="group/native flex text-Neutrals/neutrals-7 transition-all gap-2">
                    <CypressSettingsIcon />
                    <span>Settings</span>
                </li>
            </Settings>

            <Trash>
                <li className="group/native flex text-Neutrals/neutrals-7 transition-all gap-2">
                    <CypressTrashIcon />
                    <span>Trash</span>
                </li>
            </Trash>
        </ul>
    </nav>
  )
}

export default NativeNavigation
