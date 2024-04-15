/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from 'react';
import type { Traffic, ConnectionMethodsMapping } from '@kapeta/ui-web-types';
import './InspectConnectionMethods.less';

interface InspectConnectionProps {
    mapping: ConnectionMethodsMapping;
    trafficLines: Traffic[];
    onMethodClick: (method: string) => void;
}

interface StatusCodes {
    requests: number;
    sc2xx: number;
    sc3xx: number;
    sc4xx: number;
    sc5xx: number;
}

interface ConnectionMethod {
    providerName: string;
    consumerName: string;
    stats: StatusCodes;
}

const useMethodsFromMapping = (mapping: ConnectionMethodsMapping, trafficLines: Traffic[]): ConnectionMethod[] => {
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

export const InspectConnectionMethods = (props: InspectConnectionProps) => {
    const { mapping, trafficLines, onMethodClick } = props;

    const methods = useMethodsFromMapping(mapping, trafficLines);

    return (
        <div className="inspect-connection-methods">
            <table cellSpacing={0}>
                <thead>
                    <tr className={'sections'}>
                        <th />
                        <th className={'hits'} />
                        <th colSpan={4} className={'status-codes'}>
                            HTTP Status
                        </th>
                    </tr>
                    <tr>
                        <th className={'methods'}>Methods</th>
                        <th className={'hits'}>Hits</th>
                        <th className={'status-code'}>2xx</th>
                        <th className={'status-code'}>3xx</th>
                        <th className={'status-code'}>4xx</th>
                        <th className={'status-code'}>5xx</th>
                    </tr>
                </thead>
                <tbody>
                    {methods.map((method, index) => (
                        <tr key={index} onClick={() => onMethodClick(method.providerName)}>
                            <td className={'methods'}>
                                <span className={'provider'}>{method.providerName}</span>
                                <i className="fal fa-long-arrow-right" />
                                <span className={'consumer'}>{method.consumerName}</span>
                            </td>
                            <td className={'hits'}>{method.stats.requests}</td>
                            <td className={'status-code ok'}>{method.stats.sc2xx}</td>
                            <td className={'status-code redirect'}>{method.stats.sc3xx}</td>
                            <td className={'status-code client-error'}>{method.stats.sc4xx}</td>
                            <td className={'status-code server-error'}>{method.stats.sc5xx}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InspectConnectionMethods;
