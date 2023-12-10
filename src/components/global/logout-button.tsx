"use client";

import React from "react";
import { Button } from "../ui/button";
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import TooltipComponent from "./tooltip-component";

const LogoutButton = ({ children }: { children: React.ReactNode }) => {
    const { dispatch } = useAppState()
    const router = useRouter()
    const supabase = createClientComponentClient();

    const logout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        dispatch({ type: 'SET_WORKSPACES', payload: { workspaces: [] } })
    };

    return (
        <TooltipComponent message="Sign out">
            <Button variant={"ghost"} size="icon" className="p-0" onClick={logout}>
                {children}
            </Button>
        </TooltipComponent>
    );
};

export default LogoutButton;
