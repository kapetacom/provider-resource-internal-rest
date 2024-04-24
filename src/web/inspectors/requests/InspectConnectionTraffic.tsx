/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from 'react';
import { Traffic } from '@kapeta/ui-web-types';
import { asByte, asDuration } from '../helpers';
import { RequestStatusCode } from './RequestStatusCode';
import { DateDisplay } from '@kapeta/ui-web-components';
import { KapTable } from '../../components/table/KapTable';
import { KapTableColDef } from '../../components/table/types';

interface InspectMethodTrafficProps {
    trafficLines: Traffic[];
    providerMethod: string;
    onTrafficClick: (traffic: Traffic, index: number) => void;
}

export const InspectConnectionTraffic = (props: InspectMethodTrafficProps) => {
    const { trafficLines, providerMethod, onTrafficClick } = props;

    const colDefs: KapTableColDef<Traffic>[] = useMemo(
        () => [
            {
                id: 'responseCode',
                label: 'Status',
                numeric: false,
                valueRenderer: (traffic) => <RequestStatusCode code={traffic.response?.code} />,
                comparator: (a, b) => {
                    const aCode = a.response?.code || 0;
                    const bCode = b.response?.code || 0;
                    return aCode - bCode;
                },
            },
            {
                id: 'contentLength',
                label: 'Size',
                numeric: true,
                valueRenderer: (traffic) => asByte(traffic),
                comparator: (a, b) => {
                    const aSize = a.response?.headers['content-length'] || '0';
                    const bSize = b.response?.headers['content-length'] || '0';
                    return parseInt(aSize) - parseInt(bSize);
                },
            },
            {
                id: 'duration',
                label: 'Timestamp',
                numeric: true,
                valueRenderer: (traffic) => (
                    <DateDisplay
                        key={traffic.created}
                        date={traffic.created}
                        allowRelative={false}
                        format={{ timeStyle: 'medium' }}
                    />
                ),
                comparator: (a, b) => {
                    return a.created - b.created;
                },
                sort: 'desc',
            },
            {
                id: 'created',
                label: 'Time',
                numeric: true,
                valueRenderer: (traffic) => asDuration(traffic),
                comparator: (a, b) => {
                    const aDuration = a.ended - a.created;
                    const bDuration = b.ended - b.created;
                    return aDuration - bDuration;
                },
            },
        ],
        []
    );

    return (
        <KapTable
            colDefs={colDefs}
            rows={trafficLines}
            tableProps={{
                size: 'small',
                stickyHeader: true,
                'aria-label': `Requests for the ${providerMethod} method`,
            }}
            onRowClick={(traffic, index) => onTrafficClick(traffic, index + 1)}
        />
    );
};
