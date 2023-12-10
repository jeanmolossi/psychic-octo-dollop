import React from 'react'
import { CustomDialogTrigger } from '../global/custom-dialog-trigger';
import TrashRestore from './trash-restore';

const Trash = ({
    children
}: {
    children: React.ReactNode;
}) => {
  return (
    <CustomDialogTrigger
        header='Trash'
        content={<TrashRestore />}
    >
        {children}
    </CustomDialogTrigger>
  )
}

export default Trash
