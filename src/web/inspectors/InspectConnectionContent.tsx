/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useState } from 'react';
import type { ResourceTypeProviderInspectorProps, Traffic } from '@kapeta/ui-web-types';
import { InspectConnectionMethods } from './methods/InspectConnectionMethods';
import { InspectConnectionTraffic } from './requests/InspectConnectionTraffic';
import { InspectConnectionPayload } from './payload/InspectConnectionPayload';
import { InspectConnectionBreadcrumbs } from './InspectConnectionBreadcrumbs';
import { useBreadcrumbs, useMethodsFromMapping } from './InspectConnection.hooks';

export type InspectConnectionContentState = {
    selectedMethod: string | undefined;
    selectedPayload: Traffic | undefined;
    selectedPayloadIndex: number | undefined;
};

export const InspectConnectionContent = (props: ResourceTypeProviderInspectorProps) => {
    const { mapping, trafficLines } = props;

    const methods = useMethodsFromMapping(mapping, trafficLines);

    // We use a state object instead of multiple states because the parts of the state are related
    // to each other and should be updated together. This makes the code easier to understand and
    // maintain.
    const [state, setState] = useState<InspectConnectionContentState>({
        selectedMethod: undefined,
        selectedPayload: undefined,
        selectedPayloadIndex: undefined,
    });

    const showMethods = useCallback(() => {
        setState({
            selectedMethod: undefined,
            selectedPayload: undefined,
            selectedPayloadIndex: undefined,
        });
    }, []);

    const showRequests = useCallback((providerMethodId: string) => {
        setState({
            selectedMethod: providerMethodId,
            selectedPayload: undefined,
            selectedPayloadIndex: undefined,
        });
    }, []);

    const showPayload = useCallback((payload: Traffic, index: number) => {
        setState((prev) => ({
            ...prev,
            selectedPayload: payload,
            selectedPayloadIndex: index,
        }));
    }, []);

    const breadcrumbs = useBreadcrumbs({
        method: state.selectedMethod,
        payload: state.selectedPayload,
        payloadIndex: state.selectedPayloadIndex,
        showMethods,
        showRequests,
    });

    const page = state.selectedPayload ? 'payload' : state.selectedMethod ? 'requests' : 'methods';

    return (
        <>
            <InspectConnectionBreadcrumbs breadcrumbs={breadcrumbs} />

            {page === 'methods' && <InspectConnectionMethods methods={methods} onMethodClick={showRequests} />}

            {page === 'requests' && state.selectedMethod && (
                <InspectConnectionTraffic
                    //
                    trafficLines={trafficLines.filter((traffic) => traffic.providerMethodId === state.selectedMethod)}
                    providerMethod={state.selectedMethod}
                    onTrafficClick={showPayload}
                />
            )}

            {page === 'payload' && state.selectedPayload && (
                <InspectConnectionPayload traffic={state.selectedPayload} />
            )}
        </>
    );
};
