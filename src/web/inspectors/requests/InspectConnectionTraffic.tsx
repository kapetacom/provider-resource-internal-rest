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
import { StatusCode, StatusCodeFilter, statusCodeRegExpMap } from './StatusCodeFilter';

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
                filter: (traffic, filterValue) => {
                    if (Array.isArray(filterValue)) {
                        if (filterValue.length === 0) {
                            // No filter value means that all status codes are accepted
                            return true;
                        }
                        const responseCode = traffic.response?.code;
                        if (responseCode) {
                            // Check if the response code matches any of the filter values
                            return filterValue.some((filterCode) => {
                                const regExp = statusCodeRegExpMap[filterCode as StatusCode];
                                return regExp.test(responseCode.toString());
                            });
                        }
                        return false;
                    } else {
                        console.warn(
                            'Invalid filter value:',
                            filterValue,
                            ". Expected an array of status codes, like e.g. ['4xx','5xx']."
                        );
                    }
                    return false;
                },
                filterRenderer: (onFilterChange, filterValue) => (
                    <StatusCodeFilter
                        filterBy="responseCode"
                        filterValue={filterValue as StatusCode[]}
                        onFilterChange={onFilterChange}
                    />
                ),
            } satisfies KapTableColDef<Traffic>,
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
            } satisfies KapTableColDef<Traffic>,
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
            } satisfies KapTableColDef<Traffic>,
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
            } satisfies KapTableColDef<Traffic>,
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
