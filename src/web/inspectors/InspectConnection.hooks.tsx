/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { useMemo } from 'react';
import { ConnectionMethodsMapping, Traffic } from '@kapeta/ui-web-types';
import { ConnectionMethod } from './types';
import { Breadcrumb } from './InspectConnectionBreadcrumbs';

export const useMethodsFromMapping = (
    mapping: ConnectionMethodsMapping,
    trafficLines: Traffic[]
): ConnectionMethod[] => {
    return useMemo(() => {
        const methodMap: Record<string, ConnectionMethod> = {};

        if (!mapping) {
            return [];
        }

        Object.entries(mapping).forEach(([providerMethodId, mappingInfo]) => {
            const method = {
                providerName: providerMethodId,
                consumerName: mappingInfo.targetId,
                stats: {
                    requests: 0,
                    sc2xx: 0,
                    sc3xx: 0,
                    sc4xx: 0,
                    sc5xx: 0,
                },
            };

            methodMap[providerMethodId] = method;
        });

        trafficLines.forEach((traffic: Traffic) => {
            const method = methodMap[traffic.providerMethodId];
            if (!method) {
                console.warn('Unknown provider method for traffic', traffic.providerMethodId);
                return;
            }

            method.stats.requests++;
            if (traffic.response) {
                const response = traffic.response;
                method.stats.sc2xx += response.code >= 200 && response.code < 300 ? 1 : 0;
                method.stats.sc3xx += response.code >= 300 && response.code < 400 ? 1 : 0;
                method.stats.sc4xx += response.code >= 400 && response.code < 500 ? 1 : 0;
                method.stats.sc5xx += response.code >= 500 ? 1 : 0;
            }
        });

        return Object.values(methodMap);
    }, [mapping, trafficLines]);
};

interface UseBreadcrubsProps {
    method: string | undefined;
    payload: Traffic | undefined;
    payloadIndex: number | undefined;
    showMethods: () => void;
    showRequests: (providerMethodId: string) => void;
}

export const useBreadcrumbs = ({ method, payload, payloadIndex, showMethods, showRequests }: UseBreadcrubsProps) => {
    return useMemo(() => {
        const breadcrumbs: Breadcrumb[] = [{ name: 'Overview', onClick: showMethods }];

        if (method) {
            breadcrumbs.push({
                name: method,
                onClick: () => (method ? showRequests(method) : undefined),
            });
        }

        if (payload && payloadIndex !== undefined) {
            breadcrumbs.push({ name: `Request #${payloadIndex}` });
        }

        return breadcrumbs;
    }, [method, payload, payloadIndex, showMethods, showRequests]);
};
