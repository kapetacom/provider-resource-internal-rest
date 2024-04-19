/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode, useMemo, useState } from 'react';

export interface PayloadAccordionContextType {
    /**
     * If the raw preview is enabled
     */
    raw: boolean;
    /**
     * Callback when the raw preview is toggled
     */
    setRaw: (raw: boolean) => void;
}

const PayloadAccordionContext = React.createContext<PayloadAccordionContextType | undefined>(undefined);

interface PayloadAccordionContextProviderProps {
    children: ReactNode;
}

/**
 * This component provides a context for the payload accordion. The main purpose of this context is
 * for other components to know if the raw preview is enabled or not.
 */
export const PayloadAccordionContextProvider = (props: PayloadAccordionContextProviderProps) => {
    const [raw, setRaw] = useState(false);

    const contextValue = useMemo(
        () => ({
            raw,
            setRaw,
        }),
        [raw]
    );

    return <PayloadAccordionContext.Provider value={contextValue}>{props.children}</PayloadAccordionContext.Provider>;
};

export const usePayloadAccordionContext = () => {
    const context = React.useContext(PayloadAccordionContext);
    if (context === undefined) {
        throw new Error('usePayloadAccordionContext must be used within a PayloadAccordion');
    }
    return context;
};
