import React from 'react'
import { CustomDialogTrigger } from '../global/custom-dialog-trigger';
import SettingsForm from './settings-form';

const Settings = ({
    children
}: {
    children: React.ReactNode;
}) => {
  return (
    <CustomDialogTrigger
        header='Settings'
        content={<SettingsForm />}
    >
        {children}
    </CustomDialogTrigger>
  )
}

export default Settings
