/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useCallback } from 'react';
import { StackContainer, StackPage } from '@kapeta/ui-web-components';
import { InspectConnectionMethods } from './InspectConnectionMethods';
import { InspectConnectionTraffic } from './InspectConnectionTraffic';
import { InspectConnectionPayload } from './InspectConnectionPayload';
import type { ResourceTypeProviderInspectorProps, Traffic } from '@kapeta/ui-web-types';

type StackPageId = 'methods' | 'traffic' | 'payload';

export const InspectConnectionContent = (props: ResourceTypeProviderInspectorProps) => {
    const { mapping, trafficLines } = props;

    const [selectedPageId, setSelectedPageId] = useState<StackPageId>('methods');
    const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);
    const [selectedPayload, setSelectedPayload] = useState<Traffic | undefined>(undefined);

    const showTraffic = useCallback((method: string) => {
        setSelectedMethod(method);
        setSelectedPageId('traffic');
    }, []);

    const showPayload = useCallback((traffic: Traffic) => {
        setSelectedPayload(traffic);
        setSelectedPageId('payload');
    }, []);

    const onPageRequest = useCallback((pageId: string) => {
        switch (pageId) {
            case 'methods':
                setSelectedPageId(pageId);
                setSelectedPayload(undefined);
                setSelectedMethod(undefined);
                break;
            case 'traffic':
                setSelectedPageId(pageId);
                setSelectedPayload(undefined);
                break;
            case 'payload':
                break;
        }
    }, []);

    return (
        <StackContainer currentPageId={selectedPageId} onPageRequest={onPageRequest}>
            <StackPage id={'methods'} title={'Overview'}>
                <InspectConnectionMethods onMethodClick={showTraffic} mapping={mapping} trafficLines={trafficLines} />
            </StackPage>

            {selectedMethod && (
                <StackPage id={'traffic'} title={'Traffic'}>
                    <InspectConnectionTraffic
                        trafficLines={trafficLines.filter((traffic) => traffic.providerMethodId === selectedMethod)}
                        providerMethod={selectedMethod}
                        onTrafficClick={showPayload}
                    />
                </StackPage>
            )}

            {selectedPayload && (
                <StackPage id={'payload'} title={'Payload'}>
                    <InspectConnectionPayload traffic={selectedPayload} />
                </StackPage>
            )}
        </StackContainer>
    );
};
