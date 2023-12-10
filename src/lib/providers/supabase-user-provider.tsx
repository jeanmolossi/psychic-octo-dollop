'use client';

import { AuthUser } from "@supabase/supabase-js";
import { Subscription } from "../supabase/supabase.types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getUserSubscriptionStatus } from "../supabase/queries";
import { useToast } from "@/components/ui/use-toast";
import { useAppState } from "./state-provider";

type SupabaseUserContextType = {
    user: AuthUser | null;
    subscription: Subscription | null;
}

const SupabaseUserContext = createContext<SupabaseUserContextType>(null!);

export const SupabaseUserProvider = ({
    children
}: {
    children: React.ReactNode;
}) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null!)
    const { toast } = useToast()
    const { dispatch } = useAppState()

    const supabase = createClientComponentClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user: supabaseUser },
            } = await supabase.auth.getUser();

            if (supabaseUser) {
                setUser(supabaseUser)

                const avatarUrl = supabase.storage
                    .from('avatars')
                    .getPublicUrl(`user-avatar.${supabaseUser.id}`)
                    ?.data.publicUrl || ''

                dispatch({ type: 'UPDATE_PROFILE_PIC', payload: { avatarUrl }})

                const {
                    subscription: dbSubscription,
                    subscriptionErr
                } = await getUserSubscriptionStatus(supabaseUser.id)

                if (dbSubscription)
                    setSubscription(dbSubscription)

                if (subscriptionErr) {
                    toast({
                        title: 'Unexpected error',
                        description: 'Oops! An unexpected error happened. Try again later.'
                    })
                }
            }
        }

        getUser()
    }, [supabase, toast, dispatch])

    return (
        <SupabaseUserContext.Provider value={{ user, subscription }}>
            {children}
        </SupabaseUserContext.Provider>
    )
}

export const useSupabaseUser = () => useContext(SupabaseUserContext)
