/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from 'react';
import { HitsCounter } from './HitsCounter';
import { ConnectionMethod } from '../types';
import { KapTableColDef } from '../../components/table/types';
import { KapTable } from '../../components/table/KapTable';

interface InspectConnectionProps {
    methods: ConnectionMethod[];
    onMethodClick: (method: string) => void;
}

export const InspectConnectionMethods = (props: InspectConnectionProps) => {
    const { methods, onMethodClick } = props;

    const methodsWithId = useMemo(
        () => methods.map((method) => ({ ...method, id: `${method.providerName}-${method.consumerName}` })),
        [methods]
    );

    const colDefs: KapTableColDef<ConnectionMethod>[] = useMemo(
        () => [
            {
                id: 'providerName',
                label: 'Provider',
                numeric: false,
                valueRenderer: (method) => method.providerName,
                comparator: (a, b) => a.providerName.localeCompare(b.providerName),
            },
            {
                id: 'consumerName',
                label: 'Consumer',
                numeric: false,
                valueRenderer: (method) => method.consumerName,
                comparator: (a, b) => a.consumerName.localeCompare(b.consumerName),
            },
            {
                id: 'hits',
                label: 'Hits',
                numeric: true,
                valueRenderer: (method) => <HitsCounter hits={method.stats.requests} statusCode={100} />,
                comparator: (a, b) => a.stats.requests - b.stats.requests,
            },
            {
                id: '2xx',
                label: '2xx',
                numeric: true,
                valueRenderer: (method) => <HitsCounter hits={method.stats.sc2xx} statusCode={200} />,
                comparator: (a, b) => a.stats.sc2xx - b.stats.sc2xx,
            },
            {
                id: '3xx',
                label: '3xx',
                numeric: true,
                valueRenderer: (method) => <HitsCounter hits={method.stats.sc3xx} statusCode={300} />,
                comparator: (a, b) => a.stats.sc3xx - b.stats.sc3xx,
            },
            {
                id: '4xx',
                label: '4xx',
                numeric: true,
                valueRenderer: (method) => <HitsCounter hits={method.stats.sc4xx} statusCode={400} />,
                comparator: (a, b) => a.stats.sc4xx - b.stats.sc4xx,
            },
            {
                id: '5xx',
                label: '5xx',
                numeric: true,
                valueRenderer: (method) => <HitsCounter hits={method.stats.sc5xx} statusCode={500} />,
                comparator: (a, b) => a.stats.sc5xx - b.stats.sc5xx,
            },
        ],
        []
    );

    return (
        <KapTable
            colDefs={colDefs}
            rows={methodsWithId}
            tableProps={{
                size: 'small',
                stickyHeader: true,
                'aria-label': 'Methods on the connection',
            }}
            defaultOrderBy="timestamp"
            onRowClick={(method) => onMethodClick(method.providerName)}
        />
    );
};
