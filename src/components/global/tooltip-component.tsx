import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const TooltipComponent = ({
    children,
    message
}: {
    children: React.ReactNode;
    message: string;
}) => {
  return (
    <TooltipProvider delayDuration={300}>
        <Tooltip>
            <TooltipTrigger>{children}</TooltipTrigger>
            <TooltipContent>{message}</TooltipContent>
        </Tooltip>
    </TooltipProvider>
  )
}

export default TooltipComponent
