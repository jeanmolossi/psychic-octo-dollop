'use client';

import React, { Dispatch, SetStateAction, createContext, useContext, useState } from "react";
import { ProductWithPrice } from "../supabase/supabase.types";
import SubscriptionModal from "@/components/global/subscription-modal";

type SubscriptionModalContextType = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const SubscriptionModalContext = createContext<SubscriptionModalContextType>(null!)

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
}

function SubscriptionModalProvider({
    children,
    products,
}: {
    children: React.ReactNode;
    products: ProductWithPrice[];
}) {
    const [open, setOpen] = useState(false);

    return (
        <SubscriptionModalContext.Provider value={{ open, setOpen }}>
            {children}

            <SubscriptionModal products={products} />
        </SubscriptionModalContext.Provider>
    )
}

export default SubscriptionModalProvider;
